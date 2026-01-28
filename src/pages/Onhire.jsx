
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from './Layout';
import { FuelCalculator } from './FuelCalculator';
import { INITIAL_VESSELS } from './constants';
import { SurveyType } from './types';
import { Plus, History, Ship, Search, ArrowRight, MessageSquare, Send, Sparkles, BarChart3, Settings, ClipboardCheck, Bot, Info, ChevronLeft, Droplets, Ruler, Trash2, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMaritimeAssistantResponse } from '../services/gemini';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { getSurveys, getVessels, saveSurvey, deleteSurvey, getFullReports, deleteFullReport } from '../api/api';
import { useForm, useFieldArray } from "react-hook-form";
import PicturesReport from '../components/PicturesReport.jsx';
import FullReport from '../components/reports/FullReport';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Schéma de validation Zod pour le survey
const surveySchema = z.object({
  vesselNameEditable: z.string().min(1, "Nom du navire requis"),
  vesselImoEditable: z.string().min(1, "IMO requis"),
  vesselCallSignEditable: z.string().optional(),
  client: z.string().optional(),
  owner: z.string().optional(),
  charterer: z.string().optional(),
  masterName: z.string().optional(),
  chiefEngineerName: z.string().optional(),
  location: z.string().optional(),
  placeOfDelivery: z.string().optional(),
  surveyType: z.string(),
  fromTime: z.string().optional(),
  toTime: z.string().optional(),
  // Utilisation de coerce pour transformer les chaînes en nombres automatiquement
  draftFwd: z.coerce.number().optional(),
  draftAft: z.coerce.number().optional(),
  voy: z.string().optional(),
  list: z.coerce.number().optional(),
  er: z.coerce.number().optional(),
  thermometer: z.string().optional(),
  logBookEntries: z.array(z.object({
    id: z.number().optional(),
    pilotStation: z.string().optional(),
    time: z.string().optional(),
    date: z.string().optional(),
    vlsfo: z.coerce.number().optional(),
    hsfo: z.coerce.number().optional(),
    mdo: z.coerce.number().optional(),
    lsmgo: z.coerce.number().optional(),
  })).optional()
});

const OnHire = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vessels] = useState(INITIAL_VESSELS);
  const [surveys, setSurveys] = useState([]);
  const [fullReports, setFullReports] = useState([]);
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(true);
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailedVessel, setDetailedVessel] = useState(null);
  
  // Initialisation de React Hook Form
  const { register, control, handleSubmit, reset, getValues, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      logBookEntries: []
    }
  });

  // Gestion du tableau dynamique LogBook
  const { fields, append, remove } = useFieldArray({
    control,
    name: "logBookEntries"
  });

  const [initialFuelEntries, setInitialFuelEntries] = useState(null);
  
  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (currentUser) {
      setIsLoadingSurveys(true);
      
      // Charger les surveys
      getSurveys(currentUser.uid)
        .then(userSurveys => {
          setSurveys(userSurveys || []);
        })
        .catch(error => {
          console.error("Erreur lors du chargement des surveys:", error);
          alert("Impossible de charger les surveys.");
        })
        .finally(() => {
          setIsLoadingSurveys(false);
        });

      // Charger les rapports complets (Inspection Reports)
      getFullReports(currentUser.uid)
        .then(reports => {
          setFullReports(reports || []);
        })
        .catch(error => console.error("Erreur chargement rapports complets:", error));

      // Charger les navires personnalisés
      getVessels(currentUser.uid)
        .then(dbVessels => {
          if (dbVessels && dbVessels.length > 0) {
            setVessels([...INITIAL_VESSELS, ...dbVessels]);
          }
        })
        .catch(error => console.error("Erreur lors du chargement des navires:", error));
    } else {
      setSurveys([]);
      setVessels(INITIAL_VESSELS);
      setIsLoadingSurveys(false);
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  const handleCreateSurvey = (vessel) => {
    const vesselData = vessel || {
      name: '',
      imo: '',
      callSign: '',
      client: '',
      owner: '',
      charterer: '',
      tanks: []
    };
    setSelectedVessel(vesselData);
    setSelectedReport(null);
    
    reset({
      client: vesselData.client || '',
      owner: vesselData.owner || '',
      charterer: vesselData.charterer || '',
      location: 'New Port Location',
      placeOfDelivery: '',
      surveyType: 'ONHIRE SURVEY',
      fromTime: '',
      toTime: '',
      draftFwd: '',
      draftAft: '',
      voy: '',
      list: '',
      er: '',
      thermometer: '',
      vesselNameEditable: vesselData.name || '',
      vesselImoEditable: vesselData.imo || '',
      vesselCallSignEditable: vesselData.callSign || '',
      masterName: '',
      chiefEngineerName: ''
    });
    
    setInitialFuelEntries(null); // Réinitialiser les données de carburant pour un nouveau survey
    setIsCreatingSurvey(true);
  };

  const handleSaveSurvey = async (entries, finalHFO, finalMGO) => {
    if (!selectedVessel || !currentUser) {
      alert("Vous devez être connecté pour enregistrer un survey.");
      return;
    }

    // Valider le formulaire avant de sauvegarder
    const isFormValid = await trigger();
    if (!isFormValid) {
      alert("Veuillez corriger les erreurs dans le formulaire (champs rouges) avant de sauvegarder.");
      return;
    }

    const formData = getValues();

    const newSurvey = {
      vesselName: formData.vesselNameEditable || selectedVessel.name,
      vesselImo: formData.vesselImoEditable || selectedVessel.imo,
      vesselCallSign: formData.vesselCallSignEditable || selectedVessel.callSign,
      masterName: formData.masterName,
      chiefEngineerName: formData.chiefEngineerName,
      date: new Date().toISOString().split('T')[0],
      location: formData.location,
      placeOfDelivery: formData.placeOfDelivery,
      type: formData.surveyType,
      client: formData.client,
      charterer: formData.charterer,
      owner: formData.owner,
      fromTime: formData.fromTime,
      toTime: formData.toTime,
      draftFwd: formData.draftFwd,
      draftAft: formData.draftAft,
      voy: formData.voy,
      list: formData.list,
      er: formData.er,
      thermometer: formData.thermometer,
      logBookEntries: formData.logBookEntries,
      soundings: entries,
      totalHFO: parseFloat(finalHFO.toFixed(2)),
      totalMGO: parseFloat(finalMGO.toFixed(2)),
      status: 'Completed'
    };

    try {
      const { surveyId } = await saveSurvey(currentUser.uid, newSurvey);
      setSurveys(prevSurveys => [{ ...newSurvey, id: surveyId }, ...prevSurveys]);
      alert("Survey enregistré avec succès dans votre compte !");
      setIsCreatingSurvey(false);
      setSelectedVessel(null);
      setActiveTab('surveys');
    } catch (error) {
      console.error("Échec de l'enregistrement du survey:", error);
      alert(`Erreur lors de l'enregistrement : ${error.message}`);
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) {
      try {
        await deleteSurvey(currentUser.uid, surveyId);
        setSurveys(prev => prev.filter(s => s.id !== surveyId));
      } catch (error) {
        console.error("Erreur suppression:", error);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleEditFullReport = (report) => {
    setSelectedReport(report);
    setSelectedVessel(null); // On n'a pas besoin de l'objet vessel complet pour l'édition
    setActiveTab('pictures');
  };

  const handleDeleteFullReport = async (reportId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rapport d'inspection complet ?")) {
      try {
        await deleteFullReport(currentUser.uid, reportId);
        setFullReports(prev => prev.filter(r => r.id !== reportId));
      } catch (error) {
        console.error("Erreur suppression rapport:", error);
        alert("Erreur lors de la suppression du rapport.");
      }
    }
  };

  const generateSurveyPDF = async (survey) => {
    const doc = new jsPDF();

    // Fonction pour charger une image de manière asynchrone
    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });

    try {
      // Le logo est dans le dossier /public, accessible à la racine
      const companyLogo = await loadImage('/logoClair.jpg');
      doc.addImage(companyLogo, 'JPEG', 15, 10, 40, 15);
    } catch (error) {
      console.error("Impossible de charger le logo pour le PDF.", error);
    }

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("BUNKER SURVEY REPORT", 105, 22, null, null, "center");

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, null, null, "center");

    // Vessel Info Box with Body Data included
    autoTable(doc, {
      startY: 40,
      head: [['Vessel Particulars', 'Survey Details', 'Commercial Details']],
      body: [
        [`Name: ${survey.vesselName}`, `Date: ${survey.date}`, `Owner: ${survey.owner || '-'}`],
        [`IMO: ${survey.vesselImo}`, `Time: ${survey.fromTime || '-'}`, `Charterer: ${survey.charterer || '-'}`],
        [`Type: ${survey.type}`, `Status: ${survey.status}`, `Place of Survey: ${survey.location || '-'}`],
        [`Call Sign: ${survey.vesselCallSign || '-'}`, `Master: ${survey.masterName || '-'}`, `Place of Delivery: ${survey.placeOfDelivery || '-'}`],
        [`C/E: ${survey.chiefEngineerName || '-'}`, `Draft FWD: ${survey.draftFwd || 'N/A'} m`, `Draft AFT: ${survey.draftAft || 'N/A'} m`],
        [`VOY: ${survey.voy || 'N/A'}`, `List: ${survey.list || 'N/A'}°`, `E.R. Temp: ${survey.er || 'N/A'}°C`],
        [`Thermometer: ${survey.thermometer || 'N/A'}`, ``, ``]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8, cellPadding: 3 } // Smaller font to save space
    });

    let lastY = doc.lastAutoTable.finalY + 10;

    // Certificate Table (small font to save space) - moved to page 1
    autoTable(doc, {
      startY: lastY,
      head: [['VESSEL NAME', 'MARSHALL ISLANDS']],
      body: [
        ['Port of Registry', 'MAJURO'],
        ['Gross & Net Tons', '24,087/12,210'],
        ['Place of Redelivery', 'DLOSP CASABLANCA'],
        ['Date & Time of Redelivery', '28.09.2025 - 12:00'],
        ['Place of Survey', 'CASABLANCA'],
        ['Date & Time Survey Completed', 'CASABLANCA - 15:00']
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      bodyStyles: { textColor: [0, 0, 0] },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 90 } },
      styles: { fontSize: 7, cellPadding: 2 }, // Very small font to save space
      margin: { left: 14, right: 14 }
    });

    // Page 2: Calculated Quantity Tables
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("CALCULATED QUANTITIES", 105, 20, null, null, "center");

    // Préparation des données pour les tables par produit
    const vessel = vessels.find(v => v.imo === survey.vesselImo);
    const processedSoundings = (survey.soundings || []).map(s => {
      let name = s.tankName;
      let type = s.fuelType;
      if (!name && vessel) {
        const t = vessel.tanks.find(vt => vt.id === s.tankId);
        if (t) { name = t.name; type = t.fuelType; }
      }
      return {
        ...s,
        tankName: name || s.tankId || 'Unknown',
        fuelType: type || '-',
        weight: parseFloat(s.weightInAir || 0)
      };
    });

    const fuelCategories = [
      { title: 'HIGH SULPHUR FUEL OIL (HSFO)', filter: type => type.includes('HSFO') || (type.includes('HFO') && !type.includes('VLSFO')) },
      { title: 'VERY LOW SULPHUR FUEL OIL (VLSFO)', filter: type => type.includes('VLSFO') },
      { title: 'MARINE DIESEL OIL (MDO)', filter: type => type.includes('MDO') || (type.includes('MGO') && !type.includes('LSMGO')) },
      { title: 'LOW SULPHUR MARINE GAS OIL (LSMGO)', filter: type => type.includes('LSMGO') }
    ];

    lastY = 30;

    fuelCategories.forEach(cat => {
      const rows = processedSoundings.filter(s => cat.filter((s.fuelType || '').toUpperCase()));

      if (rows.length > 0) {
        const totalWeight = rows.reduce((sum, r) => sum + r.weight, 0);

        const tableBody = rows.map(r => [
          r.tankName,
          r.fuelType,
          r.sounding || '0',
          r.temperature || '0',
          r.densityAt15 || '0',
          r.observedVolume || '0',
          r.weight.toFixed(3)
        ]);

        // Ajouter la ligne de total
        tableBody.push([
          { content: 'Total', colSpan: 6, styles: { fontStyle: 'bold', halign: 'right' } },
          { content: totalWeight.toFixed(3), styles: { fontStyle: 'bold' } }
        ]);

        // Titre de la catégorie
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(cat.title, 14, lastY);

        autoTable(doc, {
          startY: lastY + 2,
          head: [['Tank Name', 'Fuel Type', 'Sounding (m)', 'Temp (C)', 'Density', 'Vol (m3)', 'Weight (MT)']],
          body: tableBody,
          theme: 'striped',
          headStyles: { fillColor: [52, 73, 94] },
          styles: { fontSize: 9 },
          columnStyles: { 6: { fontStyle: 'bold' } } // Colonne poids en gras
        });

        lastY = doc.lastAutoTable.finalY + 15;
      }
    });

    // Page 3: Signatures
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("SIGNATURES", 105, 20, null, null, "center");

    lastY = 40;

    // Texte explicatif
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    const descriptionText = "This is to certify that MV NIKE, which has above mentioned details, Re-delivered between the parties below subject to all terms conditions and exceptions agreed between Owner and Charterers as per governing Charter Party";
    doc.text(descriptionText, 14, lastY, { maxWidth: 180, align: 'justify' });
    lastY += 22;

    // Section des parties (Re-delivered By / To)
    doc.setFont(undefined, 'bold');
    doc.text("Re-delivered By", 14, lastY);
    doc.setFont(undefined, 'normal');
    doc.text("Pacific BASIN SHIPPING LTD.", 14, lastY + 5);
    doc.text("Re-Delivered To...", 14, lastY + 10);
    doc.text("NIKE SHIPPING S.A.", 14, lastY + 15);
    doc.text("29.09.2025", 14, lastY + 20);

    lastY += 40;

    // Bunker quantities section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("The undersigned Master/Surveyor, acting on behalf of PACIFIC BASIN SHIPPING LTD,", 14, lastY);
    doc.text("carried out bunker Survey in order to determine the amount of bunkers remain on board.", 14, lastY + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text("All bunker tanks were carefully sounded, with the presence of the Chief Engineer and the following", 14, lastY + 10);
    doc.text("quantities found and agreed, as calculated from the vessel's calibration tables.", 14, lastY + 14);

    lastY += 30;

    // Bunker quantities listed on separate lines
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Bunker Quantities Found:", 14, lastY);
    lastY += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`• VLSFO: 473.058 MT`, 20, lastY);
    lastY += 6;
    doc.text(`• Diesel Oil: 0.000 MT`, 20, lastY);
    lastY += 6;
    doc.text(`• MGO: 65.790 MT`, 20, lastY);
    lastY += 12;

    // Text about calculation
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const calcText = "The consumption from time of survey to the time of Re-delivery is calculated and verified with the Chief Engineer to be as per C/P:";
    doc.text(calcText, 14, lastY, { maxWidth: 180, align: 'justify' });
    lastY += 12;

    // Consumption quantities listed on separate lines
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Consumption Quantities:", 14, lastY);
    lastY += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`• VLSFO: 0.000 MT`, 20, lastY);
    lastY += 6;
    doc.text(`• Diesel Oil: 0.000 MT`, 20, lastY);
    lastY += 6;
    doc.text(`• MGO: 0.000 MT`, 20, lastY);
    lastY += 12;

    // Text about expected bunkers
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const expectedText = "Consequently, the following Bunkers are expected to be onboard at the time of Re-delivery:";
    doc.text(expectedText, 14, lastY, { maxWidth: 180, align: 'left' });
    lastY += 8;

    // Expected bunker quantities listed on separate lines
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Expected Bunker Quantities:", 14, lastY);
    lastY += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`• VLSFO: 473.058 MT`, 20, lastY);
    lastY += 6;
    doc.text(`• Fuel Oil: 0.000 MT`, 20, lastY);
    lastY += 6;
    doc.text(`• MGO: 65.790 MT`, 20, lastY);
    lastY += 12;

    // Remark section
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    const remarkText = "REMARK: Master will re-confirm by teles or E-Mail exact delivery time and figures.";
    doc.text(remarkText, 14, lastY, { maxWidth: 180, align: 'left' });

    lastY += 20;

    // Signed section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("SIGNED", 14, lastY);
    doc.text("On behalf of Owners", 14, lastY + 8);
    doc.text("The Master of", 14, lastY + 16);
    doc.text("MV NIKE", 14, lastY + 24);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.line(14, lastY + 32, 60, lastY + 32);
    doc.text("Captain/Master", 14, lastY + 36, { align: 'center' });

    doc.setFontSize(9);
    doc.line(100, lastY + 32, 146, lastY + 32);
    doc.text("Chief Engineer", 100, lastY + 36, { align: 'center' });

    doc.setFontSize(9);
    doc.line(166, lastY + 32, 212, lastY + 32);
    doc.text("Date", 166, lastY + 36, { align: 'center' });

    doc.save(`Survey_${survey.vesselName}_${survey.date}.pdf`);
  };

  const handleViewDetails = (survey) => {
    // Trouver le navire correspondant pour récupérer la config des tanks
    const vessel = vessels.find(v => v.imo === survey.vesselImo) || null;
    
    setSelectedVessel(vessel);
    
    // Remplir les détails du formulaire
    reset({
      client: survey.client || '',
      owner: survey.owner || '',
      charterer: survey.charterer || '',
      location: survey.location || '',
      placeOfDelivery: survey.placeOfDelivery || '',
      surveyType: survey.type || 'ONHIRE SURVEY',
      fromTime: survey.fromTime || '',
      toTime: survey.toTime || '',
      draftFwd: survey.draftFwd || '',
      draftAft: survey.draftAft || '',
      voy: survey.voy || '',
      list: survey.list || '',
      er: survey.er || '',
      thermometer: survey.thermometer || '',
      vesselNameEditable: survey.vesselName || '',
      vesselImoEditable: survey.vesselImo || '',
      vesselCallSignEditable: survey.vesselCallSign || '',
      masterName: survey.masterName || '',
      chiefEngineerName: survey.chiefEngineerName || '',
      logBookEntries: survey.logBookEntries || []
    });

    // Passer les données de sondage sauvegardées au calculateur
    setInitialFuelEntries(survey.soundings || []);
    setIsCreatingSurvey(true);
  };

  const handleAiConsult = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await getMaritimeAssistantResponse(aiPrompt);
      setAiResponse(response || '');
    } catch (error) {
      setAiResponse("Erreur lors de la consultation.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddLogBookEntry = () => {
    const newEntry = {
      id: Date.now(),
      pilotStation: '',
      time: '',
      date: '',
      vlsfo: '',
      hsfo: '',
      mdo: '',
      lsmgo: ''
    };
    append(newEntry);
  };

  // Plus besoin de handleUpdateLogBookEntry car register gère cela
  
  const handleDeleteLogBookEntry = (index) => {
    remove(index);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-600 tracking-tight">Fleet Dashboard</h1>
                <p className="text-slate-500 mt-1">Operational summary and fuel trends.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setActiveTab('surveys')}
                  className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  View History
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Charters</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">12</p>
                <div className="mt-4 flex items-center gap-1 text-green-600 text-sm font-medium">
                  <ArrowRight className="w-4 h-4" />
                  <span>+2 this month</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total ROB (HFO)</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">5,420 <span className="text-lg font-normal text-slate-400">MT</span></p>
                <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium">
                  <BarChart3 className="w-4 h-4" />
                  <span>Fleet average: 450 MT/vessel</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-rose-500">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Surveys</p>
                <p className="text-4xl font-bold text-red-600 mt-2">3</p>
                <div className="mt-4 flex items-center gap-1 text-red-600 text-sm font-medium">
                  <Settings className="w-4 h-4" />
                  <span>Overdue: 1</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-slate-800 mb-6">Fuel Inventory Trends (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { day: 'Mon', hfo: 5200 },
                    { day: 'Tue', hfo: 5100 },
                    { day: 'Wed', hfo: 5400 },
                    { day: 'Thu', hfo: 5350 },
                    { day: 'Fri', hfo: 5420 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="hfo" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Upcoming Offhires</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-sm">V{i}</div>
                        <div>
                          <p className="font-medium text-slate-900">Vessel Delta {i}</p>
                          <p className="text-xs text-slate-500">Scheduled: May {20 + i}, 2024</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SURVEYS TAB */}
        {activeTab === 'surveys' && (
          <div className="space-y-6">
            {!isCreatingSurvey ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Onhire / Offhire Reports</h2>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleCreateSurvey(null)}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Blank Survey
                    </button>
                    {/* Barre de recherche existante */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search vessel or IMO..." 
                        className="pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vessels.map(v => (
                    <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                          <Ship className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">IMO {v.imo}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{v.name}</h3>
                      <p className="text-slate-500 text-sm mb-6">{v.type}</p>
                      
                      <button 
                        onClick={() => handleCreateSurvey(v)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200"
                      >
                        <Plus className="w-4 h-4" />
                        New Survey
                      </button>
                    </div>
                  ))}
                </div>

                {/* SECTION: Inspection Reports (Full Reports) */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Inspection Reports (Full Condition Surveys)</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{fullReports.length} Reports</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {fullReports.length > 0 ? (
                      fullReports.map(report => (
                        <div key={report.id} className="p-4 flex flex-wrap md:flex-nowrap items-center gap-6 hover:bg-slate-50 transition-colors">
                          <div className="w-12 h-12 bg-blue-50 rounded flex items-center justify-center text-blue-500">
                            <ClipboardCheck className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <p className="font-bold text-slate-900">{report.vesselName}</p>
                            <p className="text-xs text-slate-500">Created: {new Date(report.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex-1">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                              FULL CONDITION
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditFullReport(report)} 
                              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                            >
                              Ouvrir / Éditer
                            </button>
                            <button onClick={() => handleDeleteFullReport(report.id)} className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500">Aucun rapport d'inspection complet trouvé.</div>
                    )}
                  </div>
                </div>

                {/* SECTION: Bunker Surveys (Existing) */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Bunker Surveys</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {isLoadingSurveys ? (
                      <div className="p-6 text-center text-slate-500">Chargement des rapports...</div>
                    ) : surveys.length > 0 ? (
                      surveys.map(s => (
                        <div key={s.id} className="p-4 flex flex-wrap md:flex-nowrap items-center gap-6 hover:bg-slate-50 transition-colors">
                          <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                            <ClipboardCheck className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <p className="font-bold text-slate-900">{s.vesselName}</p>
                            <p className="text-xs text-slate-500">{s.date} • {s.location}</p>
                          </div>
                          <div className="flex-1">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              s.type === SurveyType.ONHIRE ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {s.type}
                            </span>
                          </div>
                          <div className="flex gap-8">
                            <div className="text-right">
                              <p className="text-xs text-slate-400 uppercase font-bold">HFO ROB</p>
                              <p className="font-mono font-bold text-slate-900">{s.totalHFO} MT</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400 uppercase font-bold">MGO ROB</p>
                              <p className="font-mono font-bold text-slate-900">{s.totalMGO} MT</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleViewDetails(s)} className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                              Details
                            </button>
                            <button onClick={() => {
                              generateSurveyPDF(s).catch(error => {
                                console.error('Erreur lors de la génération du PDF:', error);
                                alert('Erreur lors de la génération du PDF. Vérifiez la console pour plus de détails.');
                              });
                            }} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg" title="Télécharger PDF">
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteSurvey(s.id)} className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500">Aucun rapport trouvé pour votre compte. Créez-en un !</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <button 
                  onClick={() => setIsCreatingSurvey(false)}
                  className="text-slate-500 flex items-center gap-2 hover:text-slate-900 font-medium transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Cancel Survey
                </button>
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Bunker Survey Report</h2>
                    <div className="space-y-6">
                      
                      {/* Vessel Information Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Vessel Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">M/V: Vessel Name</label>
                            <input
                              type="text"
                              {...register("vesselNameEditable")}
                              className={`w-full px-3 py-2 border ${errors.vesselNameEditable ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold`}
                              placeholder="Vessel name"
                            />
                            {errors.vesselNameEditable && <p className="text-red-500 text-xs mt-1">{errors.vesselNameEditable.message}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">IMO Number</label>
                            <input
                              type="text"
                              {...register("vesselImoEditable")}
                              className={`w-full px-3 py-2 border ${errors.vesselImoEditable ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono`}
                              placeholder="IMO Number"
                            />
                            {errors.vesselImoEditable && <p className="text-red-500 text-xs mt-1">{errors.vesselImoEditable.message}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Call Sign</label>
                            <input
                              type="text"
                              {...register("vesselCallSignEditable")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                              placeholder="Call Sign"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Survey Parties Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Survey Parties</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
                            <input
                              type="text"
                              {...register("client")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Owners</label>
                            <input
                              type="text"
                              {...register("owner")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Charterers</label>
                            <input
                              type="text"
                              {...register("charterer")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Master's Name</label>
                            <input
                              type="text"
                              {...register("masterName")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Capt. Name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Chief Engineer</label>
                            <input
                              type="text"
                              {...register("chiefEngineerName")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="C/E Name"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Survey Date/Time Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Survey Duration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">From: Date & Time</label>
                            <input
                              type="datetime-local"
                              {...register("fromTime")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">To: Date & Time</label>
                            <input
                              type="datetime-local"
                              {...register("toTime")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Vessel Conditions Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Vessel Conditions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Draft FWD (m)</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register("draftFwd")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="3.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Draft AFT (m)</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register("draftAft")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="4.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">VOY</label>
                            <input
                              type="text"
                              {...register("voy")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">List (°)</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register("list")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="2.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">E.R. T° (°C)</label>
                            <input
                              type="number"
                              step="0.1"
                              {...register("er")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="30.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Thermometer</label>
                            <input
                              type="text"
                              {...register("thermometer")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="CIAS"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Body Data Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Body Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Draft FWD</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register("draftFwd")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="3.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Draft AFT</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register("draftAft")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="4.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">VOY</label>
                            <input
                              type="text"
                              {...register("voy")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">List</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register("list")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="2.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">E.R. Temperature</label>
                            <input
                              type="number"
                              step="0.1"
                              {...register("er")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="30.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Thermometer</label>
                            <input
                              type="text"
                              {...register("thermometer")}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="CIAS"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Other Details Section */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Other Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Place of Survey</label>
                              <input
                                type="text"
                                {...register("location")}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Port of survey"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Place of Delivery</label>
                              <input
                                type="text"
                                {...register("placeOfDelivery")}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Port of delivery"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Survey Type</label>
                              <select 
                                {...register("surveyType")}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option>ONHIRE SURVEY</option>
                                <option>OFFHIRE SURVEY</option>
                                <option>BUNKERING REPORT</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Log Book Table Section */}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h4 className="font-semibold text-slate-800">Abstract of Log Book</h4>
                            <button
                              onClick={handleAddLogBookEntry}
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add Entry
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200">
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Arrival Pilot Station</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Time (Hrs. L.T.)</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">VLSFO (T)</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">HSFO (T)</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">MDO (T)</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">LSMGO (T)</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {fields.length > 0 ? (
                                  fields.map((entry, index) => (
                                    <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50">
                                      <td className="px-4 py-3">
                                        <input
                                          type="text"
                                          {...register(`logBookEntries.${index}.pilotStation`)}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Station name"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="text"
                                          {...register(`logBookEntries.${index}.time`)}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="HH:MM"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="date"
                                          {...register(`logBookEntries.${index}.date`)}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="number"
                                          {...register(`logBookEntries.${index}.vlsfo`)}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="0"
                                          step="0.01"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="number"
                                          {...register(`logBookEntries.${index}.hsfo`)}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="0"
                                          step="0.01"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="number"
                                          {...register(`logBookEntries.${index}.mdo`)}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="0"
                                          step="0.01"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="number"
                                          {...register(`logBookEntries.${index}.lsmgo`)}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="0"
                                          step="0.01"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          onClick={() => handleDeleteLogBookEntry(index)}
                                          className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="8" className="px-4 py-6 text-center text-slate-500 text-sm">
                                      No entries yet. Click "Add Entry" to start logging fuel data.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedVessel && (
                  <FuelCalculator tanks={selectedVessel.tanks} onSave={handleSaveSurvey} initialData={initialFuelEntries} />
                )}
              </div>
            )}
          </div>
        )}

        {/* AI CONSULTANT TAB */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <header className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Maritime Consultant</h1>
                <p className="text-slate-500">Technical insights on fuel standards, ASTM tables, and BIMCO clauses.</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      Consult Technical Engine
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Powered by Gemini
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="min-h-[300px] prose prose-slate max-w-none">
                      {aiResponse ? (
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                          {aiResponse}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 space-y-4">
                          <Bot className="w-12 h-12 opacity-20" />
                          <p>Ask a question about ship fuel calculations, density corrections, or charter transitions.</p>
                          <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                            <button onClick={() => setAiPrompt("How do I calculate VCF for HFO at 45°C?")} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors">How to calculate VCF?</button>
                            <button onClick={() => setAiPrompt("Explain BIMCO Fuel Quality Clause 2024")} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors">BIMCO Clause help</button>
                            <button onClick={() => setAiPrompt("Common disputes in offhire ROB surveys")} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors">Dispute risks</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiConsult()}
                        placeholder="e.g., 'What are the density correction factors for LSMGO at 25°C?'"
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      />
                      <button 
                        onClick={handleAiConsult}
                        disabled={isAiLoading || !aiPrompt.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                      >
                        {isAiLoading ? 'Analyzing...' : (
                          <>
                            <Send className="w-5 h-5" />
                            Consult
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    Quick Reference
                  </h4>
                  <div className="space-y-4 text-sm text-slate-300">
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-blue-400 font-bold mb-1">Density @ 15°C</p>
                      <p>Standard temperature for quantity measurement.</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-blue-400 font-bold mb-1">ASTM Table 54B</p>
                      <p>Used for volume correction of generalized petroleum products.</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-blue-400 font-bold mb-1">Sludge/Water</p>
                      <p>Ensure to subtract free water and account for sludge in waste tanks.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-6">
                  <h4 className="font-bold text-slate-800 mb-2">Charterer Transition Tip</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    When transitioning from Charter A to Charter B, ensure a joint ROB survey is signed by the Master and both Surveyors to prevent quantity disputes at redelivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VESSELS TAB */}
        {activeTab === 'vessels' && (
          <div className="space-y-6">
            {!detailedVessel ? (
              <>
                <h2 className="text-2xl font-bold text-slate-900">Fleet Management</h2>
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                        <tr>
                          <th className="px-6 py-4">Vessel Name</th>
                          <th className="px-6 py-4">IMO Number</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Tank Count</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vessels.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{v.name}</td>
                            <td className="px-6 py-4 text-slate-500 font-mono">{v.imo}</td>
                            <td className="px-6 py-4 text-slate-600">{v.type}</td>
                            <td className="px-6 py-4 font-medium">{v.tanks.length} Tanks</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">IN SERVICE</span>
                            </td>
                          <td className="px-6 py-4 flex items-center gap-4">
                              <button
                                onClick={() => setDetailedVessel(v)}
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                              >
                                View Details
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVessel(v);
                                setActiveTab('pictures');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                            >
                              Créer Rapport Photo
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Surveys Section */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Recent Surveys</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {isLoadingSurveys ? (
                      <div className="p-6 text-center text-slate-500">Chargement des rapports...</div>
                    ) : surveys.length > 0 ? (
                      surveys.slice(0, 5).map(s => (
                        <div key={s.id} className="p-4 flex flex-wrap md:flex-nowrap items-center gap-6 hover:bg-slate-50 transition-colors">
                          <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                            <ClipboardCheck className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <p className="font-bold text-slate-900">{s.vesselName}</p>
                            <p className="text-xs text-slate-500">{s.date} • {s.location}</p>
                          </div>
                          <div className="flex-1">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              s.type === SurveyType.ONHIRE ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {s.type}
                            </span>
                          </div>
                          <div className="flex gap-8">
                            <div className="text-right">
                              <p className="text-xs text-slate-400 uppercase font-bold">HFO ROB</p>
                              <p className="font-mono font-bold text-slate-900">{s.totalHFO} MT</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400 uppercase font-bold">MGO ROB</p>
                              <p className="font-mono font-bold text-slate-900">{s.totalMGO} MT</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleViewDetails(s)} className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                              Details
                            </button>
                            <button onClick={() => {
                              generateSurveyPDF(s).catch(error => {
                                console.error('Erreur lors de la génération du PDF:', error);
                                alert('Erreur lors de la génération du PDF. Vérifiez la console pour plus de détails.');
                              });
                            }} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg" title="Télécharger PDF">
                              <FileDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500">Aucun rapport trouvé pour votre compte. Créez-en un !</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <button 
                  onClick={() => setDetailedVessel(null)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Fleet List
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Vessel Profile Card */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4">
                        <Ship className="w-8 h-8" />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Vessel Name</label>
                          <input
                            type="text"
                            value={detailedVessel.name}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">IMO Number</label>
                          <input
                            type="text"
                            value={detailedVessel.imo}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, imo: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Call Sign</label>
                          <input
                            type="text"
                            value={detailedVessel.callSign || ''}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, callSign: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            placeholder="e.g., WPXA"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Vessel Type</label>
                          <input
                            type="text"
                            value={detailedVessel.type}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, type: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Flag</label>
                          <input
                            type="text"
                            value={detailedVessel.flag || ''}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, flag: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Marshall Islands"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Year Built</label>
                          <input
                            type="number"
                            value={detailedVessel.yearBuilt || ''}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, yearBuilt: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 2015"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Gross Tonnage</label>
                          <input
                            type="number"
                            value={detailedVessel.tonnage || ''}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, tonnage: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 45000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                          <input
                            type="text"
                            value={detailedVessel.client || ''}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, client: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Pacific Shipping Co."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
                          <input
                            type="text"
                            value={detailedVessel.owner || ''}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, owner: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Global Maritime Ltd."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Charterer</label>
                          <input
                            type="text"
                            value={detailedVessel.charterer || ''}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, charterer: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Ocean Transport Inc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                          <select
                            value={detailedVessel.status || 'Active'}
                            onChange={(e) => setDetailedVessel({ ...detailedVessel, status: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Out of Service">Out of Service</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        Storage Summary
                      </h3>
                      <div className="space-y-4">
                        {Array.from(new Set(detailedVessel.tanks.map(t => t.fuelType))).map(fuel => {
                          const total = detailedVessel.tanks
                            .filter(t => t.fuelType === fuel)
                            .reduce((sum, t) => sum + t.capacity, 0);
                          return (
                            <div key={fuel} className="flex justify-between items-end border-b border-slate-800 pb-2">
                              <div>
                                <p className="text-[10px] uppercase text-slate-500 font-bold">{fuel}</p>
                                <p className="text-lg font-bold">{total.toLocaleString()} <span className="text-xs font-normal opacity-50">m³</span></p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Tank Configuration Table */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <Droplets className="w-5 h-5 text-blue-500" />
                          Tank Configuration
                        </h3>
                        <div className="text-xs text-slate-400">
                          {detailedVessel.tanks.length} Total Tanks
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                              <th className="px-6 py-4">Tank Name</th>
                              <th className="px-6 py-4">Fuel Type</th>
                              <th className="px-6 py-4">Capacity (100%)</th>
                              <th className="px-6 py-4">Max Weight (Approx)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detailedVessel.tanks.map(tank => (
                              <tr key={tank.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-800">{tank.name}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    tank.fuelType.includes('HFO') ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                                  }`}>
                                    {tank.fuelType}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <Ruler className="w-3 h-3 text-slate-300" />
                                    <span className="font-mono">{tank.capacity.toFixed(2)} m³</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                  {(tank.capacity * (tank.fuelType.includes('HFO') ? 0.99 : 0.85)).toFixed(2)} MT
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 italic">
                          * Capacities shown are 100% volume. Safe working capacity is usually 98% for HFO and 95% for MGO.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Survey History & Certificates Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-blue-500" />
                      Survey Certificates & History
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Location</th>
                          <th className="px-6 py-4">Commercial Parties</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {surveys.filter(s => s.vesselImo === detailedVessel.imo).length > 0 ? (
                          surveys.filter(s => s.vesselImo === detailedVessel.imo).map(survey => (
                            <tr key={survey.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-slate-800">{survey.date}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                  survey.type.includes('ONHIRE') ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {survey.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                <div>{survey.location}</div>
                                <div className="text-xs text-slate-400">{survey.placeOfDelivery}</div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500">
                                <div><span className="font-semibold">Chart:</span> {survey.charterer || '-'}</div>
                                <div><span className="font-semibold">Own:</span> {survey.owner || '-'}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => generateSurveyPDF(survey)}
                                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg"
                                >
                                  <FileDown className="w-4 h-4" />
                                  Certificate
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">
                              No surveys recorded for this vessel yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PICTURES REPORT TAB */}
        {activeTab === 'pictures' && (
          <FullReport
            vessel={selectedVessel || detailedVessel}
            initialData={selectedReport}
            onCancel={() => { setSelectedVessel(null); setSelectedReport(null); setActiveTab('surveys'); }}
            onSaved={() => { setSelectedVessel(null); setSelectedReport(null); setActiveTab('surveys'); }}
          />
        )}

      </div>
    </Layout>
  );
};

export default OnHire;

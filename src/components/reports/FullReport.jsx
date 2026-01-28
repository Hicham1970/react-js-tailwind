import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveFullReport } from '../../api/api';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Save, X, Loader, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importez vos composants de section ici
import ShipPersonnel from './sections/ShipPersonnel';
import VesselParticulars from './sections/VesselParticulars';
import VesselCertificates from './sections/VesselCertificates';
import VesselTanks from './sections/VesselTanks';
import GeneralInfo from './sections/GeneralInfo';
import DeckInspection from './sections/DeckInspection';
import CargoHolds from './sections/CargoHolds';
import OtherInspections from './sections/OtherInspections';
import PhotographsSection from './sections/PhotographsSection';

const reportSections = [
    { id: 'shipPersonnel', title: '1.0 SHIP PERSONNEL' },
    { id: 'vesselParticulars', title: '2.0 VESSEL PARTICULARS' },
    { id: 'vesselCertificates', title: '3.0 VESSEL’S CERTIFICATES' },
    { id: 'vesselTanks', title: '4.0 VESSEL’S TANKS' },
    { id: 'generalInfo', title: '5.0 - 8.0 GENERAL INFO' },
    { id: 'deckInspection', title: '9.0 - 13.0 DECK INSPECTION' },
    { id: 'cargoHolds', title: '14.0 - 16.0 CARGO HOLDS' },
    { id: 'otherInspections', title: '17.0 - 19.0 OTHER INSPECTIONS' },
    { id: 'photographs', title: '20.0 PHOTOGRAPHS' },
    { id: 'robActivity', title: '21.0 ROB ACTIVITY' },
];

const FullReport = ({ vessel, initialData, onCancel, onSaved }) => {
    const { currentUser } = useAuth();
    const [activeSection, setActiveSection] = useState(reportSections[0].id);
    const [isSaving, setIsSaving] = useState(false);

    // État centralisé pour toutes les données du rapport
    const [reportData, setReportData] = useState(initialData || {
        vesselId: vessel?.id || '',
        vesselName: vessel?.name || '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        shipPersonnel: { masterName: '', chiefEngineer: '', crewList: '' },
        vesselParticulars: {
            vesselName: vessel?.name || '',
            imo: vessel?.imo || '',
            callSign: vessel?.callSign || '',
            vesselType: vessel?.type || '',
            owners: vessel?.owner || '',
            flagRegistry: vessel?.flag || '',
            grossTonnage: vessel?.tonnage || '',
        },
        vesselCertificates: [],
        vesselTanks: { holds: [], tanks: [] },
        generalInfo: {},
        deckInspection: {},
        cargoHolds: { holds: [] },
        otherInspections: {},
        photographs: {
            hullImages: [],
            forecastleImages: [],
            mainDeckImages: [],
            aftDeckImages: [],
            hatchCoversImages: [],
            wheelHouseImages: [],
            bridgeDeckImages: [],
            lifeboatImages: [],
            engineRoomImages: [],
            bunkerRobImages: []
        },
        robActivity: {},
    });

    // Fonction pour mettre à jour une section de données
    const handleDataChange = (section, data) => {
        setReportData(prev => ({ ...prev, [section]: data }));
    };

    // Fonction utilitaire pour uploader un tableau d'images
    const processAndUploadImages = (images, vessel) => {
        if (!images || images.length === 0) return Promise.resolve([]);
        
        const surveyDate = new Date().toLocaleDateString();
        const vesselId = vessel?.id || reportData.vesselId || 'unknown_vessel';
        const vesselName = vessel?.name || reportData.vesselName || 'Unknown Vessel';

        return Promise.all(
            images.map(async (image) => {
                // Si l'image a déjà une URL (déjà uploadée), on la garde telle quelle
                if (image.url && !image.file) return image;

                const offscreenCanvas = document.createElement('canvas');
                const ctx = offscreenCanvas.getContext('2d');
                const blob = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = image.src;
                    img.onload = () => {
                        offscreenCanvas.width = image.width;
                        offscreenCanvas.height = image.height;
                        ctx.drawImage(img, 0, 0);
                        
                        // Watermark
                        const fontSize = Math.max(24, offscreenCanvas.width * 0.03);
                        ctx.font = `bold ${fontSize}px Arial`;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                        ctx.shadowBlur = 4;
                        ctx.textAlign = 'right';
                        ctx.fillText(`${vesselName} | ${surveyDate}`, offscreenCanvas.width - 20, offscreenCanvas.height - 20);
                        
                        offscreenCanvas.toBlob(resolve, 'image/jpeg', 0.9);
                    };
                    img.onerror = reject;
                });

                const imageRef = ref(storage, `reports/${currentUser.uid}/${vesselId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);
                await uploadBytes(imageRef, blob);
                const downloadURL = await getDownloadURL(imageRef);

                return { url: downloadURL, description: image.description };
            })
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Traiter et uploader les images de toutes les sections
            const photoData = reportData.photographs;
            const uploadedPhotos = {
                ...photoData,
                hullImages: await processAndUploadImages(photoData.hullImages, vessel),
                forecastleImages: await processAndUploadImages(photoData.forecastleImages, vessel),
                mainDeckImages: await processAndUploadImages(photoData.mainDeckImages, vessel),
                aftDeckImages: await processAndUploadImages(photoData.aftDeckImages, vessel),
                hatchCoversImages: await processAndUploadImages(photoData.hatchCoversImages, vessel),
                wheelHouseImages: await processAndUploadImages(photoData.wheelHouseImages, vessel),
                bridgeDeckImages: await processAndUploadImages(photoData.bridgeDeckImages, vessel),
                lifeboatImages: await processAndUploadImages(photoData.lifeboatImages, vessel),
                engineRoomImages: await processAndUploadImages(photoData.engineRoomImages, vessel),
                bunkerRobImages: await processAndUploadImages(photoData.bunkerRobImages, vessel),
            };

            // 2. Préparer les données finales du rapport
            const finalReportData = {
                ...reportData,
                photographs: uploadedPhotos,
                updatedAt: new Date().toISOString(),
            };

            // 3. Sauvegarder dans la Realtime Database
            await saveFullReport(currentUser.uid, finalReportData);

            alert('Rapport sauvegardé avec succès !');
            onSaved();
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du rapport complet :", error);
            alert("Une erreur est survenue. Voir la console pour les détails.");
        } finally {
            setIsSaving(false);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        let yPos = 20;

        const addSectionTitle = (title) => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text(title, margin, yPos);
            yPos += 10;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            doc.setFontSize(10);
        };

        const addTextBlock = (text, label = "") => {
            if (!text) return;
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            if (label) {
                doc.setFont("helvetica", "bold");
                doc.text(label, margin, yPos);
                yPos += 5;
                doc.setFont("helvetica", "normal");
            }
            const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
            doc.text(splitText, margin, yPos);
            yPos += (splitText.length * 5) + 5;
        };

        // --- PAGE DE GARDE ---
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text("ON-HIRE CONDITION SURVEY REPORT", pageWidth / 2, 105, { align: "center" });
        doc.setFontSize(16);
        doc.text(reportData.vesselName, pageWidth / 2, 120, { align: "center" });
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 135, { align: "center" });
        doc.addPage();

        // 1.0 SHIP PERSONNEL
        addSectionTitle("1.0 SHIP PERSONNEL");
        autoTable(doc, {
            startY: yPos,
            head: [['Role', 'Name']],
            body: [
                ['Master', reportData.shipPersonnel.masterName],
                ['Chief Engineer', reportData.shipPersonnel.chiefEngineer],
            ],
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });
        yPos = doc.lastAutoTable.finalY + 10;
        addTextBlock(reportData.shipPersonnel.crewList, "Crew List / Comments:");

        // 2.0 VESSEL PARTICULARS
        addSectionTitle("2.0 VESSEL PARTICULARS");
        const vp = reportData.vesselParticulars;
        autoTable(doc, {
            startY: yPos,
            body: [
                ['Name of Vessel', vp.vesselName, 'Type', vp.vesselType],
                ['Flag / Registry', vp.flagRegistry, 'Call Sign', vp.callSign],
                ['IMO', vp.imo, 'Class', vp.classifications],
                ['Built', vp.placeBuilt, 'Owners', vp.owners],
                ['LOA', vp.loa, 'LBP', vp.lbp],
                ['Breadth', vp.breadth, 'Depth', vp.depthMolded],
                ['Gross Tonnage', vp.grossTonnage, 'Net Tonnage', vp.netTonnage],
                ['Summer DWT', vp.summerDeadweight, 'Summer Draft', vp.summerDraft],
                ['Light Disp.', vp.lightDisplacement, 'Hatches/Holds', vp.hatchesHolds],
            ],
            theme: 'grid',
            styles: { fontSize: 8 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 2: { fontStyle: 'bold', cellWidth: 40 } }
        });
        yPos = doc.lastAutoTable.finalY + 10;

        // 3.0 CERTIFICATES
        addSectionTitle("3.0 VESSEL'S CERTIFICATES");
        autoTable(doc, {
            startY: yPos,
            head: [['Certificate', 'Issue Date', 'Expiry Date']],
            body: (reportData.vesselCertificates || []).map(c => [c.name, c.issueDate, c.expiryDate]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });
        yPos = doc.lastAutoTable.finalY + 10;

        // 4.0 TANKS
        addSectionTitle("4.0 VESSEL'S TANKS");
        doc.text("4.1 Cargo Hold Capacity", margin, yPos);
        yPos += 6;
        autoTable(doc, {
            startY: yPos,
            head: [['Hold No.', 'Grain (M3)', 'Bale (M3)']],
            body: (reportData.vesselTanks?.holds || []).map(h => [h.no, h.grain, h.bale]),
            theme: 'striped'
        });
        yPos = doc.lastAutoTable.finalY + 10;
        
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.text("4.2 Tank Capacity", margin, yPos);
        yPos += 6;
        autoTable(doc, {
            startY: yPos,
            head: [['Product', 'Capacity', 'Unit']],
            body: (reportData.vesselTanks?.tanks || []).map(t => [t.product, t.capacity, t.unit]),
            theme: 'striped'
        });
        yPos = doc.lastAutoTable.finalY + 10;

        // 5.0 - 8.0 GENERAL INFO
        addSectionTitle("5.0 - 8.0 GENERAL INFO");
        const gi = reportData.generalInfo || {};
        addTextBlock(gi.generalDescription, "5.0 General Description");
        addTextBlock(gi.previousVoyage, "6.0 Previous Voyage");
        addTextBlock(gi.deliveryRedelivery, "7.0 Delivery / Redelivery");
        addTextBlock(gi.inspectionSurvey, "8.0 Inspection / Survey");

        // 9.0 - 13.0 DECK INSPECTION
        doc.addPage(); yPos = 20;
        addSectionTitle("9.0 - 13.0 DECK INSPECTION");
        const di = reportData.deckInspection || {};
        const deckSections = [
            { k: 'forecastle', t: '9.0 Forecastle' },
            { k: 'shellPlating', t: '10.0 Shell Plating' },
            { k: 'mainDeck', t: '11.0 Main Deck' },
            { k: 'poopDeck', t: '12.0 Poop Deck' },
            { k: 'hatchCovers', t: '13.0 Hatch Covers' }
        ];
        deckSections.forEach(sect => {
            if (yPos > 250) { doc.addPage(); yPos = 20; }
            const item = di[sect.k];
            doc.setFont("helvetica", "bold");
            doc.text(`${sect.t} (${item?.condition || '-'})`, margin, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            const split = doc.splitTextToSize(item?.comments || '', pageWidth - (margin * 2));
            doc.text(split, margin, yPos);
            yPos += (split.length * 5) + 10;
        });

        // 14.0 CARGO HOLDS
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        addSectionTitle("14.0 CARGO HOLDS");
        const ch = reportData.cargoHolds || {};
        (ch.holds || []).forEach(hold => {
             if (yPos > 220) { doc.addPage(); yPos = 20; }
             doc.setFont("helvetica", "bold");
             doc.text(`Hold No. ${hold.holdNumber}`, margin, yPos);
             yPos += 6;
             doc.setFont("helvetica", "normal");
             doc.setFontSize(9);
             const details = [`Fwd Bulkhead: ${hold.fwdBulkhead}`, `Aft Bulkhead: ${hold.aftBulkhead}`, `Port Shell: ${hold.portShellPlating}`, `Stbd Shell: ${hold.stbdShellPlating}`, `Tank Top: ${hold.tankTop}`, `Ladders: ${hold.ladders}`, `Bilges: ${hold.bilges}`];
             details.forEach(line => {
                 const split = doc.splitTextToSize(line, pageWidth - (margin * 2));
                 doc.text(split, margin, yPos);
                 yPos += (split.length * 4) + 2;
             });
             yPos += 5;
             doc.setFontSize(10);
        });
        addTextBlock(ch.cleanlinessDescription, "15.0 Cleanliness");
        addTextBlock(ch.bilgeWellsDescription, "16.0 Bilge Wells");

        // 17.0 - 19.0 OTHER INSPECTIONS
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        addSectionTitle("17.0 - 19.0 OTHER INSPECTIONS");
        const oi = reportData.otherInspections || {};
        addTextBlock(oi.deckMachinery, "17.0 Deck Machinery");
        addTextBlock(oi.engineRoom, "18.0 Engine Room");
        addTextBlock(oi.bridgeAccommodation, "19.0 Bridge / Accommodation");

        // 20.0 PHOTOGRAPHS
        doc.addPage(); yPos = 20;
        addSectionTitle("20.0 PHOTOGRAPHS");
        const photoSections = [
            { k: 'hull', t: '1/ HULL (EXTERNAL)', intro: 'hullIntro', outro: 'hullOutro', imgs: 'hullImages' },
            { k: 'forecastle', t: '2/ FORECASTLE', intro: 'forecastleIntro', imgs: 'forecastleImages' },
            { k: 'mainDeck', t: '3/ MAIN DECK', intro: 'mainDeckIntro', imgs: 'mainDeckImages' },
            { k: 'aftDeck', t: '4/ AFT DECK', intro: 'aftDeckIntro', imgs: 'aftDeckImages' },
            { k: 'hatchCovers', t: '5/ HATCH COVERS', intro: 'hatchCoversIntro', imgs: 'hatchCoversImages' },
            { k: 'wheelHouse', t: '6/ WHEEL HOUSE', intro: 'wheelHouseIntro', imgs: 'wheelHouseImages' },
            { k: 'bridgeDeck', t: '7/ BRIDGE DECK', intro: 'bridgeDeckIntro', imgs: 'bridgeDeckImages' },
            { k: 'lifeboat', t: '8/ LIFEBOAT', intro: 'lifeboatIntro', imgs: 'lifeboatImages' },
            { k: 'engineRoom', t: '9/ ENGINE ROOM', intro: 'engineRoomIntro', imgs: 'engineRoomImages' },
            { k: 'bunkerRob', t: '10/ BUNKER ROB', intro: 'bunkerRobIntro', imgs: 'bunkerRobImages' },
        ];
        const photos = reportData.photographs || {};
        photoSections.forEach(sect => {
            if (yPos > 250) { doc.addPage(); yPos = 20; }
            doc.setFont("helvetica", "bold"); doc.text(sect.t, margin, yPos); yPos += 7;
            doc.setFont("helvetica", "normal");
            if (photos[sect.intro]) { const split = doc.splitTextToSize(photos[sect.intro], pageWidth - (margin * 2)); doc.text(split, margin, yPos); yPos += (split.length * 5) + 5; }
            const images = photos[sect.imgs] || [];
            if (images.length > 0) {
                let xOffset = margin; const imgWidth = 80; const imgHeight = 60;
                images.forEach((img, index) => {
                    if (yPos + imgHeight + 20 > 280) { doc.addPage(); yPos = 20; }
                    try { 
                        // Utiliser img.src pour l'affichage (base64) ou img.url si disponible
                        const imgSrc = img.src || img.url;
                        if (imgSrc) {
                            doc.addImage(imgSrc, 'JPEG', xOffset, yPos, imgWidth, imgHeight); 
                            if (img.description) { 
                                doc.setFontSize(8); 
                                const descSplit = doc.splitTextToSize(img.description, imgWidth); 
                                doc.text(descSplit, xOffset, yPos + imgHeight + 5); 
                                doc.setFontSize(10); 
                            }
                        }
                    } catch (e) { console.error("Error adding image", e); }
                    if (index % 2 === 0) { xOffset += imgWidth + 10; } else { xOffset = margin; yPos += imgHeight + 25; }
                });
                if (images.length % 2 !== 0) { yPos += imgHeight + 25; }
            }
            if (sect.outro && photos[sect.outro]) { if (yPos > 270) { doc.addPage(); yPos = 20; } const split = doc.splitTextToSize(photos[sect.outro], pageWidth - (margin * 2)); doc.text(split, margin, yPos); yPos += (split.length * 5) + 10; } else { yPos += 5; }
        });

        doc.save(`${reportData.vesselName}_FullReport.pdf`);
    };

    const renderSectionComponent = () => {
        switch (activeSection) {
            case 'shipPersonnel':
                return <ShipPersonnel data={reportData.shipPersonnel} onChange={(data) => handleDataChange('shipPersonnel', data)} />;
            case 'vesselParticulars':
                return <VesselParticulars data={reportData.vesselParticulars} onChange={(data) => handleDataChange('vesselParticulars', data)} />;
            case 'vesselCertificates':
                return <VesselCertificates data={reportData.vesselCertificates} onChange={(data) => handleDataChange('vesselCertificates', data)} />;
            case 'vesselTanks':
                return <VesselTanks data={reportData.vesselTanks} onChange={(data) => handleDataChange('vesselTanks', data)} />;
            case 'generalInfo':
                return <GeneralInfo data={reportData.generalInfo} onChange={(data) => handleDataChange('generalInfo', data)} />;
            case 'deckInspection':
                return <DeckInspection data={reportData.deckInspection} onChange={(data) => handleDataChange('deckInspection', data)} />;
            case 'cargoHolds':
                return <CargoHolds data={reportData.cargoHolds} onChange={(data) => handleDataChange('cargoHolds', data)} />;
            case 'otherInspections':
                return <OtherInspections data={reportData.otherInspections} onChange={(data) => handleDataChange('otherInspections', data)} />;
            case 'photographs':
                return <PhotographsSection data={reportData.photographs} onChange={(data) => handleDataChange('photographs', data)} />;
            default:
                return <div className="p-6 text-slate-500">Section <span className="font-mono font-bold">{activeSection}</span> à implémenter.</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-50 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden">
                {/* Sidebar de navigation */}
                <aside className="w-1/4 bg-white border-r border-slate-200 p-4 overflow-y-auto">
                    <h2 className="font-bold text-lg mb-1 text-slate-800">{reportData.vesselName || 'Navire Inconnu'}</h2>
                    <p className="text-sm text-slate-500 mb-6">Rapport d'inspection</p>
                    <nav className="space-y-1">
                        {reportSections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Contenu principal */}
                <main className="w-3/4 flex flex-col">
                    <header className="flex justify-end items-center p-4 border-b border-slate-200 bg-white">
                        <button onClick={onCancel} className="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm border border-slate-200 mr-3">
                            <X className="w-4 h-4" /> Fermer
                        </button>
                        <button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm mr-3">
                            <FileDown className="w-4 h-4" /> Télécharger PDF
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder le Rapport'}
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6">
                        {renderSectionComponent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FullReport;


import React, { useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as XLSX from 'xlsx';
import { ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon, TrashIcon, PencilSquareIcon, ScaleIcon, CalculatorIcon, DocumentPlusIcon } from '@heroicons/react/24/solid';
import { useUser } from '../hooks/Hooks';


        const App = () => {
            // Utilisation du hook global pour le chargement
            // Le UserContext gère déjà l'état de l'utilisateur et le chargement.
            // Nous avons juste besoin de récupérer ces informations ici.
            const { user, isLoading } = useUser();

            // État pour stocker les entrées
            const [entries, setEntries] = useState(() => {
                try {
                    const saved = localStorage.getItem('sacem_pesage_data');
                    return saved ? JSON.parse(saved) : [];
                } catch (e) {
                    console.error("Erreur de lecture localStorage", e);
                    return [];
                }
            });

            const [searchQuery, setSearchQuery] = useState('');
            const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
            const [editingEntryId, setEditingEntryId] = useState(null); // Pour suivre l'entrée en cours d'édition

            // Filtrer les entrées en fonction de la recherche
            const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
            const filteredEntries = useMemo(() => {
                if (!searchQuery) {
                    return entries;
                }
                const lowercasedQuery = searchQuery.toLowerCase().trim();
                return entries.filter(entry =>
                    (entry.objectRef && entry.objectRef.toLowerCase().includes(lowercasedQuery)) ||
                    (entry.ticket && entry.ticket.toLowerCase().includes(lowercasedQuery)) ||
                    (entry.date && entry.date.toLowerCase().includes(lowercasedQuery)) ||
                    (entry.sealOther && entry.sealOther.toLowerCase().includes(lowercasedQuery))                
            );
        }, [entries, searchQuery]);

            const sortedEntries = useMemo(() => {
                if (!sortConfig.key) {
                    return filteredEntries;
                }

                let sortableItems = [...filteredEntries];
                sortableItems.sort((a, b) => {
                    if (a[sortConfig.key] < b[sortConfig.key]) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (a[sortConfig.key] > b[sortConfig.key]) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                    return 0;
                });
                return sortableItems;
            }, [filteredEntries, sortConfig]);

            // Calcul des statistiques
            const stats = useMemo(() => {
                // Somme de tous les poids nets
                const total = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.netWeight || 0), 0);
                // Moyenne = Total Poids Net / Nombre de pesées (entries.length)
                const average = filteredEntries.length > 0 ? total / filteredEntries.length : 0;

                return {
                    count: filteredEntries.length,
                    total: total.toFixed(3), // 3 décimales pour la précision
                    average: average.toFixed(3)
                };
            }, [filteredEntries]);

            // Trouve la date de la première opération
            const operationStartDate = useMemo(() => {
                if (entries.length === 0) {
                    return new Date().toISOString().split('T')[0]; // Date du jour si aucune entrée
                }
                return entries.reduce((min, entry) => entry.date < min ? entry.date : min, entries[0].date);
            }, [entries]);

            // Trouve la date de la dernière opération
            const operationEndDate = useMemo(() => {
                if (entries.length === 0) {
                    return new Date().toISOString().split('T')[0]; // Date du jour si aucune entrée
                }
                return entries.reduce((max, entry) => entry.date > max ? entry.date : max, entries[0].date);
            }, [entries]);

            // État du formulaire
            const [formData, setFormData] = useState({
                date: new Date().toISOString().split('T')[0],
                ticket: '',
                objectRef: '', // Container ID
                grossWeight: '',
                tareWeight: '',
                sealOther: '',
                sealSGS: 'SGS OGC E' // Valeur par défaut
            });

            // Calcul automatique du Net pour le formulaire
            const currentNetWeight = (formData.grossWeight && formData.tareWeight)
                ? (parseFloat(formData.grossWeight) - parseFloat(formData.tareWeight)).toFixed(2)
                : '0.00';

            // Sauvegarde automatique dans le navigateur
            useEffect(() => {
                localStorage.setItem('sacem_pesage_data', JSON.stringify(entries));
            }, [entries]);

            const handleInputChange = (e) => {
                const { name, value } = e.target;
                setFormData(prev => ({ ...prev, [name]: value }));
            };

            const requestSort = (key) => {
                let direction = 'ascending';
                if (sortConfig.key === key && sortConfig.direction === 'ascending') {
                    direction = 'descending';
                }
                setSortConfig({ key, direction });
            }


            const handleEdit = (entry) => {
                setEditingEntryId(entry.id);
                setFormData({
                    date: entry.date,
                    ticket: entry.ticket,
                    objectRef: entry.objectRef,
                    grossWeight: entry.grossWeight,
                    tareWeight: entry.tareWeight,
                    sealOther: entry.sealOther,
                    sealSGS: entry.sealSGS
                });
            };

            const handleSubmit = (e) => {
                e.preventDefault();
                if (!formData.ticket || !formData.grossWeight) return;

                // Vérification de l'unicité de la référence conteneur (objectRef)
                if (entries.some(entry => entry.id !== editingEntryId && entry.objectRef.trim().toUpperCase() === formData.objectRef.trim().toUpperCase())) {
                    alert('Erreur : Cette référence de conteneur a déjà été enregistrée.');
                    return; // Bloque la soumission du formulaire
                }

                // Vérification de l'unicité du scellé "Autre" (sealOther), s'il est non vide
                const sealOtherTrimmed = formData.sealOther.trim();
                if (sealOtherTrimmed && entries.some(entry => entry.id !== editingEntryId && entry.sealOther.trim().toUpperCase() === sealOtherTrimmed.toUpperCase())) {
                    alert('Erreur : Ce numéro de scellé a déjà été enregistré.');
                    return; // Bloque la soumission du formulaire
                }
                const newEntry = {
                    id: Date.now(),
                    ...formData,
                    netWeight: currentNetWeight
                };

                if (editingEntryId) {
                    // Mode édition : met à jour l'entrée existante
                    setEntries(entries.map(entry =>
                        entry.id === editingEntryId ? { ...newEntry, id: editingEntryId } : entry
                    ));
                    setEditingEntryId(null); // Réinitialise le mode édition
                } else {
                    // Mode ajout : ajoute une nouvelle entrée
                    setEntries(prevEntries => [newEntry, ...prevEntries]);
                }

                // Préparation pour la prochaine entrée
                setFormData(prev => ({
                    ...prev,
                    ticket: editingEntryId ? prev.ticket : (prev.ticket ? (parseInt(prev.ticket) + 1).toString() : ''), // Incrémente seulement si nouvelle entrée
                    objectRef: '',
                    grossWeight: '',
                    tareWeight: '',
                    sealOther: ''
                }));
            };

            const handleCancelEdit = () => {
                setEditingEntryId(null);
                setFormData(prev => ({
                    ...prev, objectRef: '', grossWeight: '', tareWeight: '', sealOther: ''
                })); // Réinitialise les champs spécifiques
            };

            const handleDelete = (id) => {
                if (window.confirm('Voulez-vous vraiment supprimer cette ligne ?')) {
                    setEntries(entries.filter(e => e.id !== id));
                }
            };

            const exportToExcel = () => {
                // Préparer les données
                const dataForExcel = entries.map(row => ({
                    "Date": row.date,
                    "N° Ticket": parseInt(row.ticket),
                    "Référence Conteneur": row.objectRef,
                    "Poids Brut (t)": parseFloat(row.grossWeight),
                    "Poids Tare (t)": parseFloat(row.tareWeight),
                    "Poids Net (t)": parseFloat(row.netWeight),
                    "Scellé Autre": row.sealOther,
                    "Scellé SGS": row.sealSGS
                }));

                const ws = XLSX.utils.json_to_sheet(dataForExcel);

                const wscols = [
                    { wch: 12 }, { wch: 10 }, { wch: 20 },
                    { wch: 15 }, { wch: 15 }, { wch: 15 },
                    { wch: 15 }, { wch: 15 }
                ];
                ws['!cols'] = wscols;

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Pesées");

                XLSX.writeFile(wb, `SACEM_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            };

            const exportToCsv = () => {
                // Utilise les données complètes, non filtrées, pour être cohérent avec l'export Excel
                const headers = [
                    "Date", "N° Ticket", "Référence Conteneur", "Poids Brut (t)",
                    "Poids Tare (t)", "Poids Net (t)", "Scellé Autre", "Scellé SGS"
                ];

                const headerString = headers.join(',');

                const csvRows = entries.map(row => {
                    const values = [
                        row.date, row.ticket, row.objectRef, row.grossWeight,
                        row.tareWeight, row.netWeight, row.sealOther, row.sealSGS
                    ];
                    // Enveloppe chaque valeur dans des guillemets pour gérer les virgules potentielles
                    return values.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',');
                });

                // Combine l'en-tête et les lignes, séparés par un retour à la ligne
                const csvString = [headerString, ...csvRows].join('\n');

                // Crée un Blob et déclenche le téléchargement
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `SACEM_Export_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            const handleResetData = () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.')) {
                    setEntries([]); // Efface les entrées
                    localStorage.removeItem('sacem_pesage_data'); // Efface les données du localStorage
                }
            };



            // On se fie maintenant au chargeur global.
            // Si isLoading est true, le Loader global est déjà affiché, donc on ne retourne rien ici.
            if (isLoading) {
                return null;
            }

            // Si le chargement est terminé mais qu'il n'y a pas d'utilisateur
            if (!user) {
                return <div className="text-center mt-20">Vous devez être connecté pour accéder à cette page.</div>;
            }

            return (
                <div className="min-h-screen p-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="mb-8 flex justify-between items-center bg-slate-800 text-white p-6 rounded-lg shadow-lg">
                            <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500 rounded-full text-white">
                                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">SACEM - Gestion de Pesage</h1>
                                <p className="text-slate-300 text-sm">Opérations Manganèse - Dépôt Sahraoui</p>
                                <div className="mt-2 flex items-center gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Début Pesage</label>
                                        <input type="date" className="mt-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm" disabled value={operationStartDate} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 uppercase">Fin Pesage</label>
                                        <input type="date" className="mt-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm" disabled value={operationEndDate} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleResetData}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition text-sm font-medium shadow-lg border border-red-500"
                        >
                            Réinitialiser
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                onBlur={() => setTimeout(() => setIsExportMenuOpen(false), 150)} // Permet de cliquer sur les liens
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-md transition text-sm font-medium shadow-lg border border-emerald-500 text-white"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" /> Exporter
                            </button>
                            {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 text-slate-700 text-sm">
                                    <a
                                        href="#"
                                        onClick={exportToExcel}
                                        className="block px-4 py-2 hover:bg-slate-100 rounded-t-md"
                                    >
                                        Exporter en <strong>.XLSX</strong> (Excel)
                                    </a>
                                    <a
                                        href="#"
                                        onClick={exportToCsv}
                                        className="block px-4 py-2 hover:bg-slate-100 rounded-b-md"
                                    >
                                        Exporter en <strong>.CSV</strong> (Texte)
                                    </a>
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Formulaire de saisie */}
                        <div className="lg:col-span-1">
                            <div className="glass-panel p-6 rounded-xl sticky top-6">
                                <h2 className="text-lg font-bold mb-4 text-slate-700 border-b pb-2 flex items-center gap-2">
                                    <DocumentPlusIcon className="w-5 h-5 text-blue-600" />
                                    Nouvelle Pesée
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4">

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">N° Ticket</label>
                                            <input
                                                type="number"
                                                name="ticket"
                                                placeholder="Ex: 5491"
                                                value={formData.ticket}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Référence Conteneur (TC)</label>
                                        <input
                                            type="text"
                                            name="objectRef"
                                            placeholder="Ex: TCKU 143 002 8"
                                            value={formData.objectRef}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Poids Brut (t)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="grossWeight"
                                                value={formData.grossWeight}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Poids Tare (t)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="tareWeight"
                                                value={formData.tareWeight}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded border border-blue-100 text-center">
                                        <span className="block text-xs text-blue-500 uppercase font-bold">Poids Net Calculé</span>
                                        <span className="text-2xl font-bold text-blue-700">{currentNetWeight} t</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Scellé Autre</label>
                                            <input
                                                type="text"
                                                name="sealOther"
                                                value={formData.sealOther}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Scellé SGS</label>
                                            <input
                                                type="text"
                                                name="sealSGS"
                                                value={formData.sealSGS}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className={`w-full py-3 rounded font-bold shadow-md transition flex justify-center items-center gap-2 ${editingEntryId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" /> {editingEntryId ? 'Mettre à jour la pesée' : 'Enregistrer la pesée'}
                                    </button>
                                    {editingEntryId && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 rounded font-bold shadow-md transition flex justify-center items-center gap-2 mt-2"
                                        >
                                            Annuler l'édition
                                        </button>
                                    )}
                                </form>
                            </div>
                        </div>

                        {/* Tableau des données et Stats */}
                        <div className="lg:col-span-2 flex flex-col gap-6">

                            {/* Cartes Statistiques */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-panel p-4 rounded-xl flex items-center justify-between bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-none shadow-lg">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <ScaleIcon className="w-10 h-10 text-blue-700" />
                                            <p className="text-blue-400 text-sm font-medium uppercase tracking-wider">Poids Net Total</p>
                                        </div>
                                                <p className="text-3xl font-bold mt-1 text-black">
                                                    {stats && stats.total !== undefined && stats.total !== null && stats.total !== '' ? stats.total : '0.000'}
                                                    <span className="text-lg font-normal opacity-80"> t</span>
                                                </p>
                                    </div>
                                    <div className="bg-white/20 p-3 rounded-full text-white">
                                        {/* keep original Scale svg here (styled via global svg rules) */}
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></svg>
                                    </div>
                                </div>
                                <div className="glass-panel p-4 rounded-xl flex items-center justify-between bg-white border-l-4 border-blue-500">
                                    <div>
                                        {/* Affichage explicite du diviseur (nombre de TC) */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <CalculatorIcon className="w-10 h-10 text-blue-700" />
                                            <p className="text-blue-400 text-sm font-medium uppercase tracking-wider">Moyenne par TC ({stats.count})</p>
                                        </div>
                                        <p className="text-3xl font-bold mt-1 text-slate-700">{stats.average} <span className="text-lg font-normal text-slate-400">t</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Tableau */}
                            <div className="glass-panel rounded-xl overflow-hidden flex-grow">
                                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                                    <h2 className="font-bold text-slate-700 flex-shrink-0">Opérations Récentes</h2>
                                    <div className="flex items-center gap-4 w-full max-w-sm">
                                        <input
                                            type="text"
                                            placeholder="Rechercher (Ticket, TC, Date, Scellé...)"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                        <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 flex-shrink-0">{filteredEntries.length} / {entries.length}</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('date')}>Date{sortConfig.key === 'date' ? (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="inline w-4 h-4"/> : <ChevronDownIcon className="inline w-4 h-4"/>) : null}</th>
                                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('ticket')}>Ticket{sortConfig.key === 'ticket' ? (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="inline w-4 h-4"/> : <ChevronDownIcon className="inline w-4 h-4"/>) : null}</th>
                                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('objectRef')}>Conteneur{sortConfig.key === 'objectRef' ? (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="inline w-4 h-4"/> : <ChevronDownIcon className="inline w-4 h-4"/>) : null}</th>
                                                <th className="px-4 py-3 text-right">Brut</th>
                                                <th className="px-4 py-3 text-right">Tare</th>
                                                <th className="px-4 py-3 text-right font-bold text-blue-600">Net</th>
                                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('sealOther')}>Scellés{sortConfig.key === 'sealOther' ? (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="inline w-4 h-4"/> : <ChevronDownIcon className="inline w-4 h-4"/>) : null}</th>
                                                <th className="px-4 py-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {filteredEntries.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                                        {searchQuery ? 'Aucun résultat trouvé pour votre recherche.' : 'Aucune donnée enregistrée. Utilisez le formulaire pour commencer.'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                sortedEntries.map((row) => (
                                                    <tr key={row.id} className="hover:bg-slate-50 transition">
                                                        <td className="px-4 py-3">{row.date}</td>
                                                        <td className="px-4 py-3 font-mono">{row.ticket}</td>
                                                        <td className="px-4 py-3 font-mono font-medium">{row.objectRef}</td>
                                                        <td className="px-4 py-3 text-right">{row.grossWeight}</td>
                                                        <td className="px-4 py-3 text-right text-slate-500">{row.tareWeight}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-blue-600 bg-blue-50/50">{row.netWeight}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-500">
                                                            <div>{row.sealOther}</div>
                                                            <div className="text-slate-400">{row.sealSGS}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleEdit(row)}
                                                                className="text-blue-400 hover:text-blue-600 transition p-1 mr-2"
                                                                title="Modifier"
                                                            >
                                                                <PencilSquareIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row.id)}
                                                                className="text-red-400 hover:text-red-600 transition p-1"
                                                                title="Supprimer"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };
export default App;

       
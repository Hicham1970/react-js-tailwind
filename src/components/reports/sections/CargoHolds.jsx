import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const CargoHolds = ({ data, onChange }) => {
    // Gestion de la compatibilité si data est encore un tableau (ancien format) ou un objet (nouveau format)
    const holds = Array.isArray(data) ? data : (data?.holds || []);
    const cleanlinessDescription = !Array.isArray(data) ? (data?.cleanlinessDescription || '') : '';
    const bilgeWellsDescription = !Array.isArray(data) ? (data?.bilgeWellsDescription || '') : '';

    const updateHold = (index, field, value) => {
        const newHolds = [...holds];
        newHolds[index] = { ...newHolds[index], [field]: value };
        onChange(Array.isArray(data) ? newHolds : { ...data, holds: newHolds });
    };

    const addHold = () => {
        const newHolds = [...holds, {
            holdNumber: (holds.length + 1).toString(),
            fwdBulkhead: '',
            aftBulkhead: '',
            portShellPlating: '',
            stbdShellPlating: '',
            tankTop: '',
            ladders: '',
            bilges: ''
        }];
        onChange(Array.isArray(data) ? newHolds : { ...data, holds: newHolds });
    };

    const removeHold = (index) => {
        const newHolds = holds.filter((_, i) => i !== index);
        onChange(Array.isArray(data) ? newHolds : { ...data, holds: newHolds });
    };

    const handleDescriptionChange = (e) => {
        onChange({ ...data, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-5xl space-y-8">
            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4">14.0 CARGO HOLDS</h3>

            {holds.map((hold, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                        <h4 className="text-lg font-bold text-slate-700">14.{index + 1} Hold No. {hold.holdNumber}</h4>
                        <button onClick={() => removeHold(index)} className="text-slate-400 hover:text-red-500 transition-colors" title="Remove Hold">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                            <label className="md:col-span-1 text-sm font-medium text-slate-700">Hold Number</label>
                            <input
                                type="text"
                                value={hold.holdNumber}
                                onChange={(e) => updateHold(index, 'holdNumber', e.target.value)}
                                className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {[
                            { label: 'Fwd Bulkhead', key: 'fwdBulkhead' },
                            { label: 'Aft Bulkhead', key: 'aftBulkhead' },
                            { label: 'Port shell plating', key: 'portShellPlating' },
                            { label: 'Stbd Shell plating', key: 'stbdShellPlating' },
                            { label: 'Tank top', key: 'tankTop' },
                            { label: 'Ladders', key: 'ladders' },
                            { label: 'Bilges', key: 'bilges' }
                        ].map((field) => (
                            <div key={field.key} className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                                <label className="md:col-span-1 text-sm font-medium text-slate-700 pt-2">{field.label}</label>
                                <textarea
                                    value={hold[field.key] || ''}
                                    onChange={(e) => updateHold(index, field.key, e.target.value)}
                                    rows="2"
                                    className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder={`Condition of ${field.label.toLowerCase()}...`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={addHold}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Add Cargo Hold
            </button>

            {/* 15.0 INSPECTION OF CARGO HOLDS FOR CLEANLINESS */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">15.0 INSPECTION OF CARGO HOLDS FOR CLEANLINESS</h3>
                <textarea
                    name="cleanlinessDescription"
                    value={cleanlinessDescription}
                    onChange={handleDescriptionChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter cleanliness inspection details..."
                />
            </div>

            {/* 16.0 BILGE WELLS */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">16.0 BILGE WELLS</h3>
                <textarea
                    name="bilgeWellsDescription"
                    value={bilgeWellsDescription}
                    onChange={handleDescriptionChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter bilge wells details..."
                />
            </div>
        </div>
    );
};

export default CargoHolds;
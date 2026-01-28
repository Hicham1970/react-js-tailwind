import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const VesselTanks = ({ data, onChange }) => {
    const holds = data?.holds || [];
    const tanks = data?.tanks || [];

    const updateHold = (index, field, value) => {
        const newHolds = [...holds];
        newHolds[index] = { ...newHolds[index], [field]: value };
        onChange({ ...data, holds: newHolds });
    };

    const addHold = () => {
        onChange({ ...data, holds: [...holds, { no: (holds.length + 1).toString(), grain: '', bale: '' }] });
    };

    const removeHold = (index) => {
        const newHolds = holds.filter((_, i) => i !== index);
        onChange({ ...data, holds: newHolds });
    };

    const updateTank = (index, field, value) => {
        const newTanks = [...tanks];
        newTanks[index] = { ...newTanks[index], [field]: value };
        onChange({ ...data, tanks: newTanks });
    };

    const addTank = () => {
        onChange({ ...data, tanks: [...tanks, { product: '', capacity: '', unit: 'M3' }] });
    };

    const removeTank = (index) => {
        const newTanks = tanks.filter((_, i) => i !== index);
        onChange({ ...data, tanks: newTanks });
    };

    // Calcul automatique des totaux
    const totalGrain = holds.reduce((acc, curr) => acc + (parseFloat(curr.grain) || 0), 0);
    const totalBale = holds.reduce((acc, curr) => acc + (parseFloat(curr.bale) || 0), 0);

    return (
        <div className="max-w-5xl space-y-8">
            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4">4.0 VESSEL’S TANKS/CARGO HOLDS TANK</h3>

            {/* 4.1 Cargo Hold Capacity */}
            <div>
                <h4 className="text-lg font-semibold text-slate-700 mb-4">4.1 Cargo Hold Capacity</h4>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-24">Hold No.</th>
                                <th className="px-4 py-3">Total Grain Capacity (M3)</th>
                                <th className="px-4 py-3">Total Bale Capacity (M3)</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {holds.map((hold, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-4 py-2">
                                        <input type="text" value={hold.no} onChange={(e) => updateHold(index, 'no', e.target.value)} className="w-full bg-transparent outline-none font-medium" />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input type="number" value={hold.grain} onChange={(e) => updateHold(index, 'grain', e.target.value)} className="w-full bg-transparent outline-none" placeholder="0.0" />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input type="number" value={hold.bale} onChange={(e) => updateHold(index, 'bale', e.target.value)} className="w-full bg-transparent outline-none" placeholder="0.0" />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => removeHold(index)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-slate-100 font-bold text-slate-900">
                                <td className="px-4 py-3">Total</td>
                                <td className="px-4 py-3">{totalGrain.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M3</td>
                                <td className="px-4 py-3">{totalBale.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M3</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <button onClick={addHold} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" /> Add Hold</button>
                    </div>
                </div>
            </div>

            {/* 4.2 Tank Capacity */}
            <div>
                <h4 className="text-lg font-semibold text-slate-700 mb-4">4.2 Tank Capacity</h4>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">PRODUCTS</th>
                                <th className="px-4 py-3">TOTAL CAPACITY</th>
                                <th className="px-4 py-3 w-24">UNIT</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tanks.map((tank, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-4 py-2">
                                        <input type="text" value={tank.product} onChange={(e) => updateTank(index, 'product', e.target.value)} className="w-full bg-transparent outline-none font-medium" placeholder="Product Name" />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input type="number" value={tank.capacity} onChange={(e) => updateTank(index, 'capacity', e.target.value)} className="w-full bg-transparent outline-none" placeholder="0.0" />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input type="text" value={tank.unit} onChange={(e) => updateTank(index, 'unit', e.target.value)} className="w-full bg-transparent outline-none uppercase" />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => removeTank(index)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <button onClick={addTank} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" /> Add Tank Product</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VesselTanks;
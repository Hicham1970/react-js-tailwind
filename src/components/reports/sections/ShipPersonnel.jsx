import React from 'react';

const ShipPersonnel = ({ data, onChange }) => {
    const handleChange = (e) => {
        onChange({ ...data, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-6">1.0 SHIP PERSONNEL</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="masterName" className="block text-sm font-medium text-slate-700">Master's Name</label>
                    <input type="text" id="masterName" name="masterName" value={data.masterName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="chiefEngineer" className="block text-sm font-medium text-slate-700">Chief Engineer</label>
                    <input type="text" id="chiefEngineer" name="chiefEngineer" value={data.chiefEngineer || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2 col-span-2">
                    <label htmlFor="crewList" className="block text-sm font-medium text-slate-700">Crew List / Comments</label>
                    <textarea id="crewList" name="crewList" rows="4" value={data.crewList || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter crew details or any comments..."></textarea>
                </div>
            </div>
        </div>
    );
};

export default ShipPersonnel;
import React from 'react';

// Composant utilitaire défini à l'extérieur pour éviter le re-rendu et la perte de focus
const InputField = ({ label, name, value, onChange, placeholder, type = "text", className = "" }) => (
    <div className={`space-y-1 ${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
        />
    </div>
);

const VesselParticulars = ({ data, onChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...data, [name]: value });
    };

    return (
        <div className="max-w-4xl">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">2.0 VESSEL PARTICULARS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Name of Vessel" name="vesselName" value={data.vesselName} onChange={handleChange} placeholder="MV CHANG HANG BIN HAI" />
                <InputField label="Type of Vessel" name="vesselType" value={data.vesselType} onChange={handleChange} placeholder="BULK CARRIER" />
                
                <InputField label="Flag / Port of Registry" name="flagRegistry" value={data.flagRegistry} onChange={handleChange} placeholder="SHANGHAI" />
                <InputField label="Call Sign" name="callSign" value={data.callSign} onChange={handleChange} placeholder="BUJF" />
                
                <InputField label="IMO Number" name="imo" value={data.imo} onChange={handleChange} placeholder="9628764" />
                <InputField label="Classifications" name="classifications" value={data.classifications} onChange={handleChange} placeholder="CCS" />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <InputField label="Delivered Date / Place Built" name="placeBuilt" value={data.placeBuilt} onChange={handleChange} placeholder="15TH November 2011 / Sanoyas Hishino Meisho Co" />
                    <InputField label="Owners" name="owners" value={data.owners} onChange={handleChange} placeholder="Shanghai Ming Wah Shipping Co. Ltd." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField label="L.O.A. (m)" name="loa" value={data.loa} onChange={handleChange} placeholder="199.94" />
                    <InputField label="L.B.P. (m)" name="lbp" value={data.lbp} onChange={handleChange} placeholder="194.00" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Breadth Molded (m)" name="breadth" value={data.breadth} onChange={handleChange} placeholder="32.26" />
                    <InputField label="Depth Molded (m)" name="depthMolded" value={data.depthMolded} onChange={handleChange} placeholder="18.00" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Gross Tonnage (mt)" name="grossTonnage" value={data.grossTonnage} onChange={handleChange} placeholder="33 736" />
                    <InputField label="Net Tonnage (mt)" name="netTonnage" value={data.netTonnage} onChange={handleChange} placeholder="19 656" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Summer DWT (mt)" name="summerDeadweight" value={data.summerDeadweight} onChange={handleChange} placeholder="58001.600" />
                    <InputField label="Summer Draft (m)" name="summerDraft" value={data.summerDraft} onChange={handleChange} placeholder="12.80" />
                </div>
                
                <InputField label="Light Displacement (mt)" name="lightDisplacement" value={data.lightDisplacement} onChange={handleChange} placeholder="11 843" />
                <InputField label="Hatches / Holds" name="hatchesHolds" value={data.hatchesHolds} onChange={handleChange} placeholder="5/5" />
            </div>
        </div>
    );
};

export default VesselParticulars;
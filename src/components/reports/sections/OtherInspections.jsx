import React from 'react';

const OtherInspections = ({ data, onChange }) => {
    const handleChange = (e) => {
        onChange({ ...data, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-5xl space-y-8">
            {/* 17.0 */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">17.0 DECK MACHINERY</h3>
                <p className="text-sm text-slate-500 mb-2">Winches, Windlasses, Cranes, etc.</p>
                <textarea
                    name="deckMachinery"
                    value={data.deckMachinery || ''}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter deck machinery details..."
                />
            </div>

            {/* 18.0 */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">18.0 ENGINE ROOM</h3>
                <textarea
                    name="engineRoom"
                    value={data.engineRoom || ''}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter engine room details..."
                />
            </div>

            {/* 19.0 */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">19.0 BRIDGE/ACCOMMODATION/GALLEY</h3>
                <textarea
                    name="bridgeAccommodation"
                    value={data.bridgeAccommodation || ''}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter bridge, accommodation and galley details..."
                />
            </div>
        </div>
    );
};

export default OtherInspections;
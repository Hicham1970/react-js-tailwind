import React from 'react';

const GeneralInfo = ({ data, onChange }) => {
    const handleChange = (e) => {
        onChange({ ...data, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-5xl space-y-8">
            {/* 5.0 */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">5.0 GENERAL DESCRIPTION OF VESSEL</h3>
                <textarea
                    name="generalDescription"
                    value={data.generalDescription || ''}
                    onChange={handleChange}
                    rows="6"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter general description..."
                />
            </div>

            {/* 6.0 */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">6.0 BACKGROUND OF PREVIOUS VOYAGE/S</h3>
                <textarea
                    name="previousVoyage"
                    value={data.previousVoyage || ''}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter previous voyage details..."
                />
            </div>

            {/* 7.0 */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">7.0 DATE AND TIME OF DELIVERY/RE-DELIVERY</h3>
                <textarea
                    name="deliveryRedelivery"
                    value={data.deliveryRedelivery || ''}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter delivery/redelivery details..."
                />
            </div>

            {/* 8.0 */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">8.0 OUR INSPECTION/SURVEY</h3>
                <textarea
                    name="inspectionSurvey"
                    value={data.inspectionSurvey || ''}
                    onChange={handleChange}
                    rows="6"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter inspection details..."
                />
            </div>
        </div>
    );
};

export default GeneralInfo;
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const VesselCertificates = ({ data, onChange }) => {
    const certificates = data || [];

    const updateCertificate = (index, field, value) => {
        const updatedCertificates = [...certificates];
        updatedCertificates[index] = { ...updatedCertificates[index], [field]: value };
        onChange(updatedCertificates);
    };

    const addCertificate = () => {
        onChange([...certificates, { name: '', issueDate: '', expiryDate: '' }]);
    };

    const removeCertificate = (index) => {
        onChange(certificates.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-5xl">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">3.0 VESSEL’S CERTIFICATES</h3>
            
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 w-1/2">CERTIFICATE</th>
                            <th className="px-4 py-3">DATE OF ISSUE</th>
                            <th className="px-4 py-3">DATE OF EXPIRY</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {certificates.map((cert, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        value={cert.name} 
                                        onChange={(e) => updateCertificate(index, 'name', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-slate-900 placeholder-slate-400"
                                        placeholder="Certificate Name"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input 
                                        type="date" 
                                        value={cert.issueDate} 
                                        onChange={(e) => updateCertificate(index, 'issueDate', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input 
                                        type="date" 
                                        value={cert.expiryDate} 
                                        onChange={(e) => updateCertificate(index, 'expiryDate', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600"
                                    />
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button 
                                        onClick={() => removeCertificate(index)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <button onClick={addCertificate} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"><Plus className="w-4 h-4" /> Add Certificate</button>
                </div>
            </div>
        </div>
    );
};

export default VesselCertificates;
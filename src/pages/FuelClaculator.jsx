
// import React, { useState } from 'react';
// import { Calculator, Save, Info, RefreshCw, Gauge, Edit3 } from 'lucide-react';

// export const FuelCalculator = ({ tanks, onSave }) => {
//   const [manualHfo, setManualHfo] = useState('');
//   const [manualMgo, setManualMgo] = useState('');
  
//   const [entries, setEntries] = useState(() => {
//     const initial = {};
//     tanks.forEach(t => {
//       initial[t.id] = {
//         tankId: t.id,
//         sounding: 0,
//         temperature: 15,
//         densityAt15: t.fuelType.includes('HFO') || t.fuelType.includes('VLSFO') ? 0.991 : 0.845,
//         observedVolume: 0
//       };
//     });
//     return initial;
//   });

//   const calculateCorrected = (tankId) => {
//     const entry = entries[tankId];
//     if (!entry) return;

//     const tank = tanks.find(t => t.id === tankId);
//     if (!tank) return;

//     const rho15 = entry.densityAt15 || 0.9;
//     const tempObs = entry.temperature || 15;
//     const deltaT = tempObs - 15;

//     // ASTM Table 54B Logic (Generalized Products)
//     let k0 = 0;
//     let k1 = 0;

//     const isFuelOil = tank.fuelType.includes('HFO') || tank.fuelType.includes('VLSFO');
    
//     if (isFuelOil) {
//       k0 = 103.8720;
//       k1 = 0.2701;
//     } else {
//       k0 = 186.9696;
//       k1 = 0.4862;
//     }

//     const alpha15 = (k0 / Math.pow(rho15 * 1000, 2)) + (k1 / (rho15 * 1000));
//     const vcf = Math.exp(-alpha15 * deltaT * (1 + 0.8 * alpha15 * deltaT));
//     const vol15 = (entry.observedVolume || 0) * vcf;
    
//     // Weight in Air (Buoyancy Correction 0.0011)
//     const weightInAir = vol15 * (rho15 - 0.0011);

//     setEntries(prev => ({
//       ...prev,
//       [tankId]: {
//         ...prev[tankId],
//         vcf: parseFloat(vcf.toFixed(5)),
//         correctedVolume: parseFloat(weightInAir.toFixed(3))
//       }
//     }));
//   };

//   const handleInputChange = (tankId, field, value) => {
//     setEntries(prev => ({
//       ...prev,
//       [tankId]: { ...prev[tankId], [field]: parseFloat(value.toString()) }
//     }));
//   };

//   const handleSave = () => {
//     const validEntries = Object.values(entries).filter(e => e.tankId);
//     const hfoVal = manualHfo ? parseFloat(manualHfo) : undefined;
//     const mgoVal = manualMgo ? parseFloat(manualMgo) : undefined;
//     onSave(validEntries, hfoVal, mgoVal);
//   };

//   const fuelOilTanks = tanks.filter(t => t.fuelType.includes('HFO') || t.fuelType.includes('VLSFO'));
//   const gasoilTanks = tanks.filter(t => t.fuelType.includes('MGO') || t.fuelType.includes('LSMGO'));

//   const calculateTotal = (tankList) => {
//     return tankList.reduce((acc, t) => acc + (entries[t.id]?.correctedVolume || 0), 0).toFixed(3);
//   };

//   const renderTable = (tankList, title, color) => (
//     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
//       <div className={`p-4 bg-${color}-50 border-b border-slate-200 flex justify-between items-center`}>
//         <h3 className={`font-bold text-slate-800 flex items-center gap-2`}>
//           <Gauge className={`w-5 h-5 text-${color}-600`} />
//           {title} - Calculation (Table 54B)
//         </h3>
//         <div className="text-right">
//           <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Weight</span>
//           <span className={`text-lg font-mono font-bold text-${color}-700`}>{calculateTotal(tankList)} MT</span>
//         </div>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
//             <tr>
//               <th className="px-4 py-3">Tank</th>
//               <th className="px-4 py-3">Sounding (m)</th>
//               <th className="px-4 py-3">Temp (°C)</th>
//               <th className="px-4 py-3">Obs Vol (m³)</th>
//               <th className="px-4 py-3">Dens @15</th>
//               <th className="px-4 py-3">VCF</th>
//               <th className="px-4 py-3">Weight (MT)</th>
//               <th className="px-4 py-3"></th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {tankList.map((tank) => (
//               <tr key={tank.id} className="hover:bg-slate-50 transition-colors">
//                 <td className="px-4 py-3 font-medium text-slate-700">
//                   {tank.name}
//                   <div className="text-[9px] text-slate-400 font-normal uppercase">{tank.fuelType}</div>
//                 </td>
//                 <td className="px-4 py-3">
//                   <input
//                     type="number"
//                     step="0.01"
//                     className="w-20 px-2 py-1 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
//                     value={entries[tank.id]?.sounding || 0}
//                     onChange={(e) => handleInputChange(tank.id, 'sounding', e.target.value)}
//                   />
//                 </td>
//                 <td className="px-4 py-3">
//                   <input
//                     type="number"
//                     step="0.1"
//                     className="w-16 px-2 py-1 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
//                     value={entries[tank.id]?.temperature || 15}
//                     onChange={(e) => handleInputChange(tank.id, 'temperature', e.target.value)}
//                   />
//                 </td>
//                 <td className="px-4 py-3">
//                   <input
//                     type="number"
//                     step="0.1"
//                     className="w-20 px-2 py-1 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
//                     value={entries[tank.id]?.observedVolume || 0}
//                     onChange={(e) => handleInputChange(tank.id, 'observedVolume', e.target.value)}
//                   />
//                 </td>
//                 <td className="px-4 py-3">
//                   <input
//                     type="number"
//                     step="0.0001"
//                     className="w-24 px-2 py-1 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
//                     value={entries[tank.id]?.densityAt15 || 0.9}
//                     onChange={(e) => handleInputChange(tank.id, 'densityAt15', e.target.value)}
//                   />
//                 </td>
//                 <td className="px-4 py-3 text-slate-500 font-mono text-xs">
//                   {entries[tank.id]?.vcf || '-'}
//                 </td>
//                 <td className={`px-4 py-3 font-bold text-${color}-600 font-mono`}>
//                   {entries[tank.id]?.correctedVolume || '0.000'}
//                 </td>
//                 <td className="px-4 py-3">
//                   <button 
//                     onClick={() => calculateCorrected(tank.id)}
//                     className={`p-1 text-${color}-600 hover:bg-${color}-100 rounded transition-colors`}
//                     title="Calculate Tank"
//                   >
//                     <RefreshCw className="w-4 h-4" />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-6">
//       {/* Header with Commit Action */}
//       <div className="flex justify-between items-center mb-2">
//         <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
//           <Calculator className="w-6 h-6 text-blue-600" />
//           ROB Computation Engine
//         </h2>
//         <button 
//           onClick={handleSave}
//           className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
//         >
//           <Save className="w-4 h-4" />
//           Commit Survey Results
//         </button>
//       </div>

//       {/* Manual Entry Section */}
//       <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
//         <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
//           <Edit3 className="w-5 h-5 text-indigo-600" />
//           Quick Entry / Manual Overrides
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="space-y-2">
//             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manual HFO Entry (MT)</label>
//             <div className="relative">
//               <input
//                 type="number"
//                 step="0.1"
//                 placeholder="Total HFO Weight"
//                 className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
//                 value={manualHfo}
//                 onChange={(e) => setManualHfo(e.target.value)}
//               />
//               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">MT</span>
//             </div>
//           </div>
//           <div className="space-y-2">
//             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manual MGO Entry (MT)</label>
//             <div className="relative">
//               <input
//                 type="number"
//                 step="0.1"
//                 placeholder="Total MGO Weight"
//                 className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
//                 value={manualMgo}
//                 onChange={(e) => setManualMgo(e.target.value)}
//               />
//               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">MT</span>
//             </div>
//           </div>
//         </div>
//         <p className="mt-3 text-[10px] text-slate-400 italic">
//           * If values are entered here, they will override the calculated totals from the tank soundings below.
//         </p>
//       </div>

//       {/* Fuel Oil Table */}
//       {fuelOilTanks.length > 0 && renderTable(fuelOilTanks, "Fuel Oil", "amber")}

//       {/* Gasoil Table */}
//       {gasoilTanks.length > 0 && renderTable(gasoilTanks, "Gasoil", "blue")}

//       <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 text-xs flex items-start gap-3 shadow-sm">
//         <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-indigo-500" />
//         <div className="space-y-1">
//           <p className="font-bold uppercase tracking-wider text-[10px] text-indigo-400">Calculation Standard Note</p>
//           <p className="leading-relaxed opacity-80">
//             Systems are strictly adhering to <strong>ASTM D1250-04 (IP 200/04)</strong> for high-precision Volume Correction Factors (Table 54B).
//             Density @ 15°C is corrected for buoyancy using the industry standard <strong>-0.0011 factor</strong> to obtain Weight in Air (Metric Tons). 
//             Always ensure manual soundings are corrected for Trim and List using the vessel's official Calibration Booklet before entry.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };
// export default FuelCalculator;
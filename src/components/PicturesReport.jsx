import React from 'react';
import { Camera, Trash2 } from 'lucide-react';

const PicturesReport = ({ vessel, images, onImagesChange }) => {
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const newImage = {
                id: Date.now() + Math.random(),
                src: event.target.result,
                file: file,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                gps: "34.0522° N, 118.2437° W", // Simulation GPS (nécessiterait EXIF.js pour le réel)
                description: "",
                width: img.width,
                height: img.height
            };
            onImagesChange(prev => [...prev, newImage]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const updateDescription = (id, text) => {
      onImagesChange(prev => prev.map(img => {
        if (img.id === id) {
            return { ...img, description: text };
        }
        return img;
    }));
  };

  const deleteImage = (id) => {
      onImagesChange(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">20.0 PHOTOGRAPHS</h3>
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
              <Camera className="w-4 h-4" />
              Ajouter Photos
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {images.map((img, idx) => (
             <div key={img.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                 <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img src={img.src} alt={`Photo ${idx + 1}`} className="w-full h-full object-contain" />
                    <button 
                        onClick={() => deleteImage(img.id)}
                        className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm backdrop-blur-sm"
                        title="Supprimer la photo"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {img.date}
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description / Commentaire</label>
                    <textarea 
                        value={img.description || ""} 
                        onChange={(e) => updateDescription(img.id, e.target.value)}
                        placeholder="Décrivez cette photo..." 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                        rows="3"
                    />
                 </div>
             </div>
         ))}
       </div>

       {images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <Camera className="w-12 h-12 mb-2 opacity-20" />
                <p>Aucune image chargée</p>
            </div>
        )}
    </div>
  );
};

export default PicturesReport;
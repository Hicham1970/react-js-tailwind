import React from 'react';
import { Camera, Trash2 } from 'lucide-react';

const PhotographsSection = ({ data, onChange }) => {
    // Initialisation sécurisée des données
    const hullImages = data?.hullImages || [];
    const forecastleImages = data?.forecastleImages || [];
    const mainDeckImages = data?.mainDeckImages || [];
    const aftDeckImages = data?.aftDeckImages || [];
    const hatchCoversImages = data?.hatchCoversImages || [];
    const wheelHouseImages = data?.wheelHouseImages || [];
    const bridgeDeckImages = data?.bridgeDeckImages || [];
    const lifeboatImages = data?.lifeboatImages || [];
    const engineRoomImages = data?.engineRoomImages || [];
    const bunkerRobImages = data?.bunkerRobImages || [];
    const hullIntro = data?.hullIntro || '';
    const hullOutro = data?.hullOutro || '';
    const forecastleIntro = data?.forecastleIntro || '';
    const mainDeckIntro = data?.mainDeckIntro || '';
    const aftDeckIntro = data?.aftDeckIntro || '';
    const hatchCoversIntro = data?.hatchCoversIntro || '';
    const wheelHouseIntro = data?.wheelHouseIntro || '';
    const bridgeDeckIntro = data?.bridgeDeckIntro || '';
    const lifeboatIntro = data?.lifeboatIntro || '';
    const engineRoomIntro = data?.engineRoomIntro || '';
    const bunkerRobIntro = data?.bunkerRobIntro || '';

    const handleTextChange = (e) => {
        onChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e, sectionKey) => {
        const files = Array.from(e.target.files);
        const currentImages = data?.[sectionKey] || [];

        const promises = files.map(file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: Date.now() + Math.random(),
                        src: event.target.result,
                        file: file,
                        date: new Date().toLocaleDateString(),
                        description: "",
                        width: img.width,
                        height: img.height
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }));

        Promise.all(promises).then(newImages => {
            onChange({ ...data, [sectionKey]: [...currentImages, ...newImages] });
        });
    };

    const updateImageDescription = (id, text, sectionKey) => {
        const currentImages = data?.[sectionKey] || [];
        const updatedImages = currentImages.map(img => 
            img.id === id ? { ...img, description: text } : img
        );
        onChange({ ...data, [sectionKey]: updatedImages });
    };

    const deleteImage = (id, sectionKey) => {
        const currentImages = data?.[sectionKey] || [];
        const updatedImages = currentImages.filter(img => img.id !== id);
        onChange({ ...data, [sectionKey]: updatedImages });
    };

    const renderImageGrid = (images, sectionKey) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((img, idx) => (
                <div key={img.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                    <div className="relative aspect-video bg-white rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                        <img src={img.src} alt={`Photo ${idx + 1}`} className="w-full h-full object-contain" />
                        <button 
                            onClick={() => deleteImage(img.id, sectionKey)}
                            className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm backdrop-blur-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea 
                        value={img.description || ""} 
                        onChange={(e) => updateImageDescription(img.id, e.target.value, sectionKey)}
                        placeholder="Photo description..." 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                        rows="2"
                    />
                </div>
            ))}
        </div>
    );

    return (
        <div className="max-w-5xl space-y-8">
            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4">20.0 PHOTOGRAPHS</h3>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">1/ HULL (EXTERNAL)</h4>
                
                {/* Texte d'introduction */}
                <textarea
                    name="hullIntro"
                    value={hullIntro}
                    onChange={handleTextChange}
                    rows="5"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter introduction text..."
                />

                {/* Bouton d'ajout de photos */}
                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'hullImages')} />
                    </label>
                </div>

                {renderImageGrid(hullImages, 'hullImages')}

                {/* Texte de conclusion */}
                <textarea
                    name="hullOutro"
                    value={hullOutro}
                    onChange={handleTextChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter concluding text..."
                />
            </div>

            {/* 2/ FORECASTLE */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">2/ FORECASTLE</h4>
                
                <textarea
                    name="forecastleIntro"
                    value={forecastleIntro}
                    onChange={handleTextChange}
                    rows="8"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter forecastle description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'forecastleImages')} />
                    </label>
                </div>

                {renderImageGrid(forecastleImages, 'forecastleImages')}
            </div>

            {/* 3/ MAIN DECK */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">3/ MAIN DECK</h4>
                
                <textarea
                    name="mainDeckIntro"
                    value={mainDeckIntro}
                    onChange={handleTextChange}
                    rows="6"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter main deck description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'mainDeckImages')} />
                    </label>
                </div>

                {renderImageGrid(mainDeckImages, 'mainDeckImages')}
            </div>

            {/* 4/ AFT DECK */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">4/ AFT DECK</h4>
                
                <textarea
                    name="aftDeckIntro"
                    value={aftDeckIntro}
                    onChange={handleTextChange}
                    rows="6"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter aft deck description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'aftDeckImages')} />
                    </label>
                </div>

                {renderImageGrid(aftDeckImages, 'aftDeckImages')}
            </div>

            {/* 5/ HATCH COVERS & CARGO HOLDS */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">5/ HATCH COVERS & CARGO HOLDS</h4>
                
                <textarea
                    name="hatchCoversIntro"
                    value={hatchCoversIntro}
                    onChange={handleTextChange}
                    rows="8"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter hatch covers description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'hatchCoversImages')} />
                    </label>
                </div>

                {renderImageGrid(hatchCoversImages, 'hatchCoversImages')}
            </div>

            {/* 6/ WHEEL HOUSE */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">6/ WHEEL HOUSE</h4>
                
                <textarea
                    name="wheelHouseIntro"
                    value={wheelHouseIntro}
                    onChange={handleTextChange}
                    rows="8"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter wheel house description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'wheelHouseImages')} />
                    </label>
                </div>

                {renderImageGrid(wheelHouseImages, 'wheelHouseImages')}
            </div>

            {/* 7/ BRIDGE DECK */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">7/ BRIDGE DECK</h4>
                
                <textarea
                    name="bridgeDeckIntro"
                    value={bridgeDeckIntro}
                    onChange={handleTextChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter bridge deck description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bridgeDeckImages')} />
                    </label>
                </div>

                {renderImageGrid(bridgeDeckImages, 'bridgeDeckImages')}
            </div>

            {/* 8/ LIFEBOAT */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">8/ LIFEBOAT</h4>
                
                <textarea
                    name="lifeboatIntro"
                    value={lifeboatIntro}
                    onChange={handleTextChange}
                    rows="8"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter lifeboat description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'lifeboatImages')} />
                    </label>
                </div>

                {renderImageGrid(lifeboatImages, 'lifeboatImages')}
            </div>

            {/* 9/ ENGINE ROOM */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">9/ ENGINE ROOM</h4>
                
                <textarea
                    name="engineRoomIntro"
                    value={engineRoomIntro}
                    onChange={handleTextChange}
                    rows="10"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter engine room description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'engineRoomImages')} />
                    </label>
                </div>

                {renderImageGrid(engineRoomImages, 'engineRoomImages')}
            </div>

            {/* 10/ VIEW OF THE ACTIVITY MEASURING BUNKER ROB */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-lg font-bold text-slate-700">10/ VIEW OF THE ACTIVITY MEASURING BUNKER ROB</h4>
                
                <textarea
                    name="bunkerRobIntro"
                    value={bunkerRobIntro}
                    onChange={handleTextChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed"
                    placeholder="Enter description..."
                />

                <div className="flex justify-end">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        Add Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bunkerRobImages')} />
                    </label>
                </div>

                {renderImageGrid(bunkerRobImages, 'bunkerRobImages')}
            </div>
        </div>
    );
};

export default PhotographsSection;
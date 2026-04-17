
import React, { useState } from 'react';
import type { ImageFile } from '../types';
import { useTranslation } from '../App';

interface BottomBarProps {
  imageFiles: ImageFile[];
  onRemoveImage: (id: string) => void;
  onAddImages: (files: FileList) => void;
  onReorderImages: (newImages: ImageFile[]) => void;
  onFocusChange: (ids: string[]) => void;
  focusedImageIds: string[];
}

export const BottomBar: React.FC<BottomBarProps> = ({ imageFiles, onRemoveImage, onAddImages, onReorderImages, onFocusChange, focusedImageIds }) => {
    const { t } = useTranslation();
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onAddImages(e.target.files);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        setDragOverIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newImages = [...imageFiles];
        const [movedItem] = newImages.splice(dragIndex, 1);
        newImages.splice(dragOverIndex, 0, movedItem);
        onReorderImages(newImages);
        
        setDragIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="h-32 bg-gray-900 border-t border-gray-700 flex items-center px-6 space-x-6 overflow-hidden">
            {/* --- ADD BUTTON --- */}
            <label className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-700 rounded-none flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 group-hover:text-indigo-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] font-black text-gray-500 group-hover:text-indigo-400 uppercase tracking-widest">{t('addImages')}</span>
                <input type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*" />
            </label>

            {/* --- TIMELINE CAROUSEL --- */}
            <div className="flex-grow flex items-center space-x-3 overflow-x-auto custom-scrollbar pb-2 h-full">
                {imageFiles.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-gray-600 italic text-sm">
                        {t('noImagesYet')}
                    </div>
                ) : (
                    imageFiles.map((img, index) => {
                        const isDragged = dragIndex === index;
                        const isDragOver = dragOverIndex === index;
                        
                        return (
                            <div 
                                key={img.id} 
                                className={`relative flex-shrink-0 group transition-all duration-200 cursor-grab
                                    ${isDragged ? 'opacity-30 scale-95' : 'opacity-100'}
                                    ${isDragOver ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900 scale-105' : ''}
                                    ${focusedImageIds.includes(img.id) ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900' : ''}
                                `}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                                onClick={() => onFocusChange([img.id])}
                            >
                                <div className="w-24 h-24 rounded-none overflow-hidden border-2 border-gray-800 shadow-xl group-hover:border-indigo-500 transition-all duration-300">
                                    <img src={img.previewUrl} alt={`Thumb ${index}`} className="w-full h-full object-cover pointer-events-none" referrerPolicy="no-referrer" />
                                </div>
                                <button 
                                    onClick={() => onRemoveImage(img.id)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-none opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 z-10 scale-75 group-hover:scale-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black/70 text-[9px] font-black text-white px-2 py-0.5 rounded-none backdrop-blur-md border border-white/10 pointer-events-none">
                                    #{index + 1}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- STATS --- */}
            <div className="flex-shrink-0 px-4 border-l border-gray-800 flex flex-col justify-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total</span>
                <span className="text-2xl font-black text-white leading-none">{imageFiles.length}</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter mt-1">Imagens</span>
            </div>
        </div>
    );
};

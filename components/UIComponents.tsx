
import React, { useState } from 'react';
import type { TranslationKey } from '../App';
import { useTranslation } from '../App';
import { BackgroundStyle } from '../types';

// --- ACCORDION ---
interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700/50 py-4 last:border-b-0">
      <h3
        className="text-sm font-semibold text-gray-300 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </h3>
      {isOpen && <div className="space-y-4 mt-3">{children}</div>}
    </div>
  );
};

// --- CONTROL ---
interface ControlProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const Control: React.FC<ControlProps> = ({ label, hint, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
        {children}
        {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    </div>
);

// --- SLIDER ---
interface SliderProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step: number;
}

export const Slider: React.FC<SliderProps> = ({ label, hint, value, onChange, min, max, step }) => (
    <Control label={label} hint={hint}>
        <div className="flex items-center space-x-2">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className="w-full h-2 bg-gray-600 rounded-none appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono text-gray-300 w-10 text-right">{(value ?? 0).toFixed(2)}</span>
        </div>
    </Control>
);

// --- SELECT ---
interface SelectProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { id: string; name: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, value, onChange, options }) => (
    <Control label={label}>
        <select value={value} onChange={onChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-none text-sm text-gray-200 focus:ring-indigo-500 focus:border-indigo-500">
            {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
        </select>
    </Control>
);

// --- CHECKBOX ---
interface CheckboxProps {
    label: string;
    hint?: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, hint, checked, onChange }) => (
    <div className="space-y-1">
        <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded-none bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-300">{label}</span>
        </label>
        {hint && <p className="text-[10px] text-gray-500 ml-6">{hint}</p>}
    </div>
);

// --- COLOR INPUT ---
interface ColorInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
    <Control label={label}>
        <div className="flex items-center w-full p-1.5 bg-gray-700 border border-gray-600 rounded-none">
            <input type="color" value={value} onChange={onChange} className="w-8 h-6 p-0 border-none rounded-none bg-transparent" />
            <span className="ml-2 text-sm font-mono text-gray-300">{value}</span>
        </div>
    </Control>
);

// --- PRESET THUMBNAIL ---
export const PresetThumbnail: React.FC<{ presetId: string }> = ({ presetId }) => {
    switch (presetId) {
        case 'modern': return (<div className="w-full h-full bg-gray-800 p-1 flex flex-col gap-0.5"><div className="h-1/2 bg-gray-500"></div><div className="h-1/2 flex gap-0.5"><div className="w-1/2 bg-gray-500"></div><div className="w-1/2 bg-gray-500"></div></div></div>);
        case 'vintage': return (<div className="w-full h-full bg-[#D4C8B4] p-1.5 flex flex-col gap-1"><div className="h-1/2 bg-[#6F6659]/50 rounded-none border border-[#F3F0E9]/50"></div><div className="h-1/2 flex gap-1"><div className="w-1/2 bg-[#6F6659]/50 rounded-none border border-[#F3F0E9]/50"></div><div className="w-1/2 bg-[#6F6659]/50 rounded-none border border-[#F3F0E9]/50"></div></div></div>);
        case 'pastel': return (<div className="w-full h-full bg-pink-100/50 p-2 flex flex-col gap-2"><div className="h-1/2 bg-blue-200/50 rounded-none"></div><div className="h-1/2 flex gap-2"><div className="w-1/2 bg-green-200/50 rounded-none"></div><div className="w-1/2 bg-purple-200/50 rounded-none"></div></div></div>);
        case 'dramatic': return (<div className="w-full h-full bg-black p-0.5 flex flex-col gap-0.5 brightness-125 saturate-150"><div className="h-1/2 bg-indigo-500/30 backdrop-blur-sm rounded-none"></div><div className="h-1/2 flex gap-0.5"><div className="w-1/2 bg-purple-500/30 backdrop-blur-sm rounded-none"></div><div className="w-1/2 bg-red-500/30 backdrop-blur-sm rounded-none"></div></div></div>);
        default: return <div className="w-full h-full bg-gray-600"></div>;
    }
};

// --- BACKGROUND THUMBNAIL ---
export const BackgroundThumbnail: React.FC<{ styleId: BackgroundStyle, current: BackgroundStyle, onClick: () => void }> = ({ styleId, current, onClick }) => {
    const isSelected = styleId === current;
    let styleClasses = "w-full h-12 rounded-none transition-all duration-200 border-2 ";
    switch (styleId) {
        case BackgroundStyle.Solid: styleClasses += "bg-gray-600"; break;
        case BackgroundStyle.MeshGradient: styleClasses += "bg-gradient-to-br from-purple-500 via-pink-400 to-orange-400"; break;
        case BackgroundStyle.AuroraLights: styleClasses += "bg-gradient-to-br from-gray-900 via-purple-800 to-blue-900"; break;
        case BackgroundStyle.GrainyPastel: styleClasses += "bg-pink-200 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')] opacity-70"; break;
        case BackgroundStyle.ConicBurst: styleClasses += "bg-[conic-gradient(at_top,_#fdecc9,_#d6c9e3,_#c2d1c5,_#fdecc9)]"; break;
        case BackgroundStyle.PaperTexture: styleClasses += "bg-[#f1faee] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.12%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"; break;
        case BackgroundStyle.Image: styleClasses += "bg-gray-800 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22currentColor%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M4%2016l4.586-4.586a2%202%200%20012.828%200L16%2016m-2-2l1.586-1.586a2%202%200%20012.828%200L20%2014m-6-6h.01M6%2020h12a2%202%200%20002-2V6a2%202%200%2000-2-2H6a2%202%200%2000-2%202v12a2%202%200%20002%202z%22%2F%3E%3C%2Fsvg%3E')] bg-center bg-no-repeat bg-[length:24px_24px]"; break;
    }
    styleClasses += isSelected ? " border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-800 scale-105" : " border-gray-600 hover:border-indigo-400";
    return <button onClick={onClick} className={styleClasses}></button>;
};

// --- IMAGE REORDERING COMPONENT ---
import type { ImageFile } from '../types';

export const DraggableImageThumbnails: React.FC<{
  images: ImageFile[];
  onReorder: (newOrder: ImageFile[]) => void;
  onRemove: (id: string) => void;
}> = ({ images, onReorder, onRemove }) => {
  const { t } = useTranslation();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (index !== dragIndex) {
      setDragOverIndex(index);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = () => {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
    }

    const newImages = [...images];
    const draggedItemContent = newImages.splice(dragIndex, 1)[0];
    newImages.splice(dragOverIndex, 0, draggedItemContent);
    
    onReorder(newImages);

    setDragIndex(null);
    setDragOverIndex(null);
  };
  
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{t('imageOrderHint' as TranslationKey, 'Drag to re-order. Affects all layouts.')}</p>
      <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => {
              const isDragged = dragIndex === index;
              const isDragOver = dragOverIndex === index;
              
              return (
                  <div
                      key={image.id}
                      className={`relative aspect-square bg-gray-700 rounded-none overflow-hidden cursor-grab transition-all duration-200 group
                          ${isDragged ? 'opacity-30 scale-95' : 'opacity-100'}
                          ${isDragOver ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500' : ''}
                      `}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                  >
                      <img
                          src={image.previewUrl}
                          alt={`thumbnail ${index + 1}`}
                          className="w-full h-full object-cover pointer-events-none"
                      />
                       <div className="absolute top-0 right-0 bg-black/60 text-white text-[8px] font-bold rounded-none px-1 py-0.5 pointer-events-none">
                          {index + 1}
                      </div>
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(image.id);
                        }}
                        className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Remover Imagem"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

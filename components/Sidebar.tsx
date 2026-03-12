
import React, { useState, useMemo, useCallback } from 'react';
import type { Settings, ImageFile } from '../types';
import { LayoutType, GridStyle, VoronoiDistribution, TieredShape, BackgroundStyle, CardStyle, CircularPattern, SpiralType } from '../types';
import { useTranslation } from '../App';
import { getLayoutOptions, COLOR_PALETTES, PREDEFINED_LIGHT_COLORS, PREDEFINED_DARK_COLORS, STYLE_PRESETS, DEFAULT_SETTINGS } from '../constants';
import type { TranslationKey } from '../App';

type SidebarTab = 'layout' | 'style';

// --- HELPER COMPONENTS (for internal use in Sidebar) ---

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
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


interface ControlProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const Control: React.FC<ControlProps> = ({ label, hint, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
        {children}
        {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    </div>
);


interface SliderProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step: number;
}

const Slider: React.FC<SliderProps> = ({ label, hint, value, onChange, min, max, step }) => (
    <Control label={label} hint={hint}>
        <div className="flex items-center space-x-2">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono text-gray-300 w-10 text-right">{value.toFixed(2)}</span>
        </div>
    </Control>
);

interface SelectProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { id: string; name: string }[];
}

const Select: React.FC<SelectProps> = ({ label, value, onChange, options }) => (
    <Control label={label}>
        <select value={value} onChange={onChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 focus:ring-indigo-500 focus:border-indigo-500">
            {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
        </select>
    </Control>
);

interface CheckboxProps {
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
        <span className="text-sm text-gray-300">{label}</span>
    </label>
);

interface ColorInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
    <Control label={label}>
        <div className="flex items-center w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md">
            <input type="color" value={value} onChange={onChange} className="w-8 h-6 p-0 border-none rounded bg-transparent" />
            <span className="ml-2 text-sm font-mono text-gray-300">{value}</span>
        </div>
    </Control>
);

// --- IMAGE REORDERING COMPONENT ---

const DraggableImageThumbnails: React.FC<{
  images: ImageFile[];
  onReorder: (newOrder: ImageFile[]) => void;
}> = ({ images, onReorder }) => {
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
                      className={`relative aspect-square bg-gray-700 rounded-md overflow-hidden cursor-grab transition-all duration-200
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
                       <div className="absolute top-0 right-0 bg-black/60 text-white text-xs font-bold rounded-bl-md px-1.5 py-0.5 pointer-events-none">
                          {index + 1}
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

// --- ICONS for TABS ---
const LayoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const StyleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;


// --- PROP TYPES ---

interface SidebarProps {
  settings: Settings;
  onSettingsChange: (newSettings: React.SetStateAction<Settings>) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShapeFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBgImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onShuffle: () => void;
  imageCount: number;
  imageFiles: ImageFile[];
  onImageReorder: (newOrder: ImageFile[]) => void;
  onRandomFocus: () => void;
  colorPalette: string[];
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasPng: boolean;
  onRegeneratePngBgs: () => void;
}

const PresetThumbnail: React.FC<{ presetId: string }> = ({ presetId }) => {
    switch (presetId) {
        case 'modern': return (<div className="w-full h-full bg-gray-800 p-1 flex flex-col gap-0.5"><div className="h-1/2 bg-gray-500"></div><div className="h-1/2 flex gap-0.5"><div className="w-1/2 bg-gray-500"></div><div className="w-1/2 bg-gray-500"></div></div></div>);
        case 'vintage': return (<div className="w-full h-full bg-[#D4C8B4] p-1.5 flex flex-col gap-1"><div className="h-1/2 bg-[#6F6659]/50 rounded-sm border border-[#F3F0E9]/50"></div><div className="h-1/2 flex gap-1"><div className="w-1/2 bg-[#6F6659]/50 rounded-sm border border-[#F3F0E9]/50"></div><div className="w-1/2 bg-[#6F6659]/50 rounded-sm border border-[#F3F0E9]/50"></div></div></div>);
        case 'pastel': return (<div className="w-full h-full bg-pink-100/50 p-2 flex flex-col gap-2"><div className="h-1/2 bg-blue-200/50 rounded-lg"></div><div className="h-1/2 flex gap-2"><div className="w-1/2 bg-green-200/50 rounded-lg"></div><div className="w-1/2 bg-purple-200/50 rounded-lg"></div></div></div>);
        case 'dramatic': return (<div className="w-full h-full bg-black p-0.5 flex flex-col gap-0.5 brightness-125 saturate-150"><div className="h-1/2 bg-indigo-500/30 backdrop-blur-sm rounded-sm"></div><div className="h-1/2 flex gap-0.5"><div className="w-1/2 bg-purple-500/30 backdrop-blur-sm rounded-sm"></div><div className="w-1/2 bg-red-500/30 backdrop-blur-sm rounded-sm"></div></div></div>);
        default: return <div className="w-full h-full bg-gray-600"></div>;
    }
};

const BackgroundThumbnail: React.FC<{ styleId: BackgroundStyle, current: BackgroundStyle, onClick: () => void }> = ({ styleId, current, onClick }) => {
    const isSelected = styleId === current;
    let styleClasses = "w-full h-12 rounded-md transition-all duration-200 border-2 ";
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

const getLayoutControlsTitle = (layout: LayoutType, t: (key: TranslationKey) => string): string => {
    const titleMap: { [key in LayoutType]?: TranslationKey } = {
        [LayoutType.Grid]: 'gridControls', [LayoutType.Mosaic]: 'mosaicControls', [LayoutType.Pile]: 'pileControls', [LayoutType.Wall3D]: 'wall3DControls', [LayoutType.Tiled]: 'mosaicControls', [LayoutType.Fractal]: 'mosaicControls', [LayoutType.Voronoi]: 'voronoiControls', [LayoutType.CustomShape]: 'customShapeControls', [LayoutType.TieredShape]: 'tieredShapeControls', [LayoutType.Kaleidoscope]: 'kaleidoscopeControls', [LayoutType.GoldenSpiral]: 'goldenSpiralControls', [LayoutType.Journal]: 'journalControls', [LayoutType.Circular]: 'circularControls', [LayoutType.Orbital]: 'orbitalControls',
    };
    const key = titleMap[layout];
    return key ? t(key) : t('accordionLayoutControls');
};

// --- MAIN SIDEBAR COMPONENT ---

export const Sidebar: React.FC<SidebarProps> = (props) => {
    const { t } = useTranslation();
    const { 
        settings, onSettingsChange, onFileChange, onShapeFileChange, onBgImageChange, onClear, onShuffle, 
        imageCount, imageFiles, onImageReorder, onRandomFocus, colorPalette,
        onUndo, onRedo, canUndo, canRedo, hasPng, onRegeneratePngBgs
    } = props;
    
    const [activeTab, setActiveTab] = useState<SidebarTab>('layout');
    const layoutOptions = useMemo(() => getLayoutOptions(t), [t]);

    const handleChange = useCallback((key: keyof Settings, value: any) => {
        onSettingsChange(s => {
            const newSettings = { ...s, [key]: value };
            // When layout changes, reset variation settings for a clean slate
            if (key === 'layout') {
                newSettings.organicVariation = DEFAULT_SETTINGS.organicVariation;
                newSettings.globalRotation = DEFAULT_SETTINGS.globalRotation;
            }
            return newSettings;
        });
    }, [onSettingsChange]);
    
    const handlePresetClick = (presetSettings: Partial<Settings>) => {
        onSettingsChange(s => ({ ...s, ...presetSettings }));
    };

    const handleIntelligentRandomize = useCallback(() => {
        let themes: Partial<Settings>[] = [];
        const random = () => Math.random();
        switch (settings.layout) {
            case LayoutType.Orbital: themes = [ { orbitalScale: 1.8, orbitalRadius: 300, orbitalTilt: 15, orbitalLightAngle: 290, orbitalLightIntensity: 0.8, orbitalDoF: 12 }, { orbitalScale: 0.7, orbitalRadius: 800, orbitalFocus: 1200, orbitalTilt: -10, orbitalLightIntensity: 0.3, orbitalDoF: 2 }, { orbitalScale: 1.1, orbitalRadius: 500, orbitalFocus: 600, orbitalTilt: -40, orbitalLightAngle: 120, orbitalDoF: 6 }, ]; break;
            case LayoutType.Wall3D: themes = [ { perspectiveAngle: -25, perspectiveTilt: 15, perspectiveZoom: 1.2, organicVariation: 0.1, spacing: 4 }, { perspectiveAngle: 0, perspectiveTilt: -20, perspectiveZoom: 0.8, organicVariation: 0.5, spacing: 12 }, { perspectiveAngle: 30, perspectiveTilt: 0, perspectiveZoom: 1.5, organicVariation: 0, spacing: 8 }, ]; break;
            case LayoutType.Kaleidoscope: themes = [ { kaleidoscopeSectors: 4, organicVariation: 0.8, imageMultiplier: 4 }, { kaleidoscopeSectors: 16, organicVariation: 0.1, imageMultiplier: 2 }, { kaleidoscopeSectors: 8, organicVariation: 0.5, imageMultiplier: 3 }, ]; break;
            case LayoutType.GoldenSpiral: themes = [ { spiralDensity: 8, spiralTightness: 1.5 }, { spiralDensity: 3, spiralTightness: 0.8 }, { spiralDensity: 6, spiralTightness: 1.2 }, ]; break;
            case LayoutType.Voronoi: themes = [ { voronoiDistribution: VoronoiDistribution.Organic, voronoiOrganicDistance: 0.08, cols: 25 }, { voronoiDistribution: VoronoiDistribution.Frame, voronoiFrameFocus: 2.5, cols: 40, spacing: 4 }, { voronoiDistribution: VoronoiDistribution.Sunflower, voronoiPointJitter: 0.2, cols: 45 }, { voronoiDistribution: VoronoiDistribution.Centered, voronoiCentralBias: 3.0, cols: 35 }, ]; break;
            case LayoutType.Journal: themes = [ { journalOverlap: 0.5, journalRowVariation: 0.8, cols: 6, spacing: 4 }, { journalOverlap: 0.1, journalRowVariation: 0.1, cols: 3, spacing: 10 }, { journalOverlap: 0.3, journalRowVariation: 0.5, cols: 4, spacing: 8 }, ]; break;
            case LayoutType.Pile: themes = [ { pileOrganization: 0.8, pileCardSize: 0.5, shadowBlur: 15 }, { pileOrganization: 0.05, pileCardSize: 0.6, shadowBlur: 40 }, { pileOrganization: 0.4, pileCardSize: 0.4, shadowBlur: 25 }, ]; break;
            case LayoutType.TieredShape: themes = [ { tieredTiers: 8, tieredSizeVariation: 0.9, organicVariation: 0.2 }, { tieredTiers: 25, tieredSizeVariation: 0.3, organicVariation: 0 }, { tieredTiers: 15, tieredSizeVariation: 0.6, organicVariation: 0.1 }, ]; break;
            case LayoutType.Grid: themes = [ { gridStyle: GridStyle.Masonry, spacing: 8, organicVariation: 0.05, autoGrid: true }, { gridStyle: GridStyle.Overlapped, spacing: 15, organicVariation: 0.2, autoGrid: true }, { gridStyle: GridStyle.Uniform, autoGrid: false, rows: 5 + Math.floor(random()*3), cols: 4 + Math.floor(random()*3), spacing: 4 }, ]; break;
            case LayoutType.Circular: themes = [ { circularRings: 8, spacing: 2, circularPattern: CircularPattern.Default }, { circularRings: 2, spacing: 15, circularPattern: CircularPattern.Default }, { circularRings: 5, spacing: 6, circularPattern: CircularPattern.SpiderWeb, organicVariation: 0.15 }, ]; break;
            case LayoutType.Tiled:
            case LayoutType.Fractal: themes = [ { tileVariation: 0.2, cols: 6 }, { tileVariation: 0.95, cols: 14 }, { tileVariation: 0.7, cols: 10 }, ]; break;
            default: onSettingsChange(s => ({ ...s, seed: Math.random() })); return;
        }

        if (themes.length > 0) {
            const theme = themes[Math.floor(Math.random() * themes.length)];
            onSettingsChange(s => ({ ...s, ...theme, seed: Math.random() }));
        }

    }, [settings.layout, onSettingsChange]);

    const hasImages = imageCount > 0;

    // --- CONTEXTUAL CONTROLS LOGIC ---
    const layoutsWithOrganicControls = [LayoutType.Grid, LayoutType.Wall3D, LayoutType.TieredShape, LayoutType.Circular, LayoutType.Journal, LayoutType.Pile];
    const layoutsWithoutRotation = [LayoutType.Voronoi, LayoutType.Mosaic, LayoutType.Fractal, LayoutType.Tiled];
    
    const showOrganicControls = layoutsWithOrganicControls.includes(settings.layout);
    const showGlobalRotation = !layoutsWithoutRotation.includes(settings.layout);
    
    const renderLayoutSpecificControls = () => (
        <div className="space-y-4">
            {(() => {
                switch (settings.layout) {
                    case LayoutType.Grid: return (<>
                        <Select label={t('gridStyle')} value={settings.gridStyle} onChange={e => handleChange('gridStyle', e.target.value)} options={[{id: GridStyle.Uniform, name: t('gridStyleUniform')}, {id: GridStyle.Masonry, name: t('gridStyleMasonry')}, {id: GridStyle.Overlapped, name: t('gridStyleOverlapped')}]} />
                        <Checkbox label={t('autoFitGrid')} checked={settings.autoGrid} onChange={e => handleChange('autoGrid', e.target.checked)} />
                        {!settings.autoGrid && <>
                            <Slider label={t('rows')} min={1} max={50} step={1} value={settings.rows} onChange={e => handleChange('rows', parseInt(e.target.value))} />
                            <Slider label={t('columns')} min={1} max={50} step={1} value={settings.cols} onChange={e => handleChange('cols', parseInt(e.target.value))} />
                        </>}
                    </>);
                    case LayoutType.Mosaic: return (<>
                        <Slider label={t('rows')} min={2} max={25} step={1} value={settings.rows} onChange={e => handleChange('rows', parseInt(e.target.value))} />
                        <Slider label={t('mosaicShapeVariation')} min={0} max={1} step={0.01} value={settings.mosaicShapeVariation} onChange={e => handleChange('mosaicShapeVariation', parseFloat(e.target.value))} />
                    </>);
                    case LayoutType.Pile: return (<>
                        <Slider label={t('organization')} min={0} max={1} step={0.01} value={settings.pileOrganization} onChange={e => handleChange('pileOrganization', parseFloat(e.target.value))} />
                        <Slider label={t('cardSize')} min={0.1} max={1} step={0.01} value={settings.pileCardSize} onChange={e => handleChange('pileCardSize', parseFloat(e.target.value))} />
                    </>);
                    case LayoutType.Wall3D: return (<>
                        <Slider label={t('rows')} min={2} max={20} step={1} value={settings.rows} onChange={e => handleChange('rows', parseInt(e.target.value))} />
                        <Slider label={t('columns')} min={2} max={20} step={1} value={settings.cols} onChange={e => handleChange('cols', parseInt(e.target.value))} />
                        <Slider label={t('perspectiveAngle')} min={-45} max={45} step={1} value={settings.perspectiveAngle} onChange={e => handleChange('perspectiveAngle', parseFloat(e.target.value))} />
                        <Slider label={t('perspectiveTilt')} min={-45} max={45} step={1} value={settings.perspectiveTilt} onChange={e => handleChange('perspectiveTilt', parseFloat(e.target.value))} />
                        <Slider label={t('perspectiveZoom')} min={0.5} max={2.5} step={0.01} value={settings.perspectiveZoom} onChange={e => handleChange('perspectiveZoom', parseFloat(e.target.value))} />
                    </>);
                    case LayoutType.Tiled: case LayoutType.Fractal: return (<>
                        <Select label={t('imageFit')} value={settings.imageFit} onChange={e => handleChange('imageFit', e.target.value as 'cover' | 'contain')} options={[{ id: 'cover', name: t('fitCover')}, { id: 'contain', name: t('fitContain')}]} />
                        <Slider label={t('complexityDensity')} min={2} max={16} step={1} value={settings.cols} onChange={e => handleChange('cols', parseInt(e.target.value))} />
                        <Slider label={t('tileVariation')} min={0.01} max={1} step={0.01} value={settings.tileVariation} onChange={e => handleChange('tileVariation', parseFloat(e.target.value))} />
                    </>);
                    case LayoutType.Voronoi:
                        const distOptions = [{id: VoronoiDistribution.Random, name: t('distJittered')}, {id: VoronoiDistribution.Organic, name: t('distOrganic')}, {id: VoronoiDistribution.Centered, name: t('distCentered')}, {id: VoronoiDistribution.Sunflower, name: t('distSunflower')}, {id: VoronoiDistribution.Frame, name: t('distFrame')}];
                        return (<>
                            <Slider label={t('complexityDensity')} min={5} max={50} step={1} value={settings.cols} onChange={e => handleChange('cols', parseInt(e.target.value))} />
                            <Select label={t('pointDistribution')} value={settings.voronoiDistribution} onChange={e => handleChange('voronoiDistribution', e.target.value)} options={distOptions} />
                            {(settings.voronoiDistribution === VoronoiDistribution.Random || settings.voronoiDistribution === VoronoiDistribution.Sunflower) && <Slider label={t('voronoiJitterIntensity')} min={0} max={1.5} step={0.01} value={settings.voronoiPointJitter} onChange={e => handleChange('voronoiPointJitter', parseFloat(e.target.value))} />}
                            {settings.voronoiDistribution === VoronoiDistribution.Organic && <Slider label={t('voronoiMinDistance')} min={0.01} max={0.2} step={0.005} value={settings.voronoiOrganicDistance} onChange={e => handleChange('voronoiOrganicDistance', parseFloat(e.target.value))} />}
                            {settings.voronoiDistribution === VoronoiDistribution.Centered && <Slider label={t('voronoiCentralBias')} min={1} max={5} step={0.1} value={settings.voronoiCentralBias} onChange={e => handleChange('voronoiCentralBias', parseFloat(e.target.value))} />}
                            {settings.voronoiDistribution === VoronoiDistribution.Frame && <Slider label={t('voronoiFrameThickness')} min={1} max={5} step={0.1} value={settings.voronoiFrameFocus} onChange={e => handleChange('voronoiFrameFocus', parseFloat(e.target.value))} />}
                        </>);
                    case LayoutType.CustomShape: return (<>
                        <Control label={t('customShapeOptional')} hint={t('customShapeHint')}>
                            <label className="w-full text-center cursor-pointer block px-3 py-2 bg-gray-700 text-white font-semibold text-sm rounded-lg shadow-md hover:bg-gray-600 transition">
                                {settings.shapeMaskImage ? t('changeCustomShape') : t('uploadCustomShape')}
                                <input type="file" className="sr-only" onChange={onShapeFileChange} accept="image/*" />
                            </label>
                        </Control>
                        <Slider label={t('threshold')} min={0} max={1} step={0.01} value={settings.shapeMaskThreshold} onChange={e => handleChange('shapeMaskThreshold', parseFloat(e.target.value))} />
                        <Checkbox label={t('invertMask')} checked={settings.shapeMaskInvert} onChange={e => handleChange('shapeMaskInvert', e.target.checked)} />
                        <Slider label={t('bgGridDensity')} min={10} max={50} step={1} value={settings.shapeBurstDensity} onChange={e => handleChange('shapeBurstDensity', parseInt(e.target.value, 10))} />
                        <Checkbox label={t('enableOrganicLayer')} checked={settings.shapeBurstOrganicLayer} onChange={e => handleChange('shapeBurstOrganicLayer', e.target.checked)} />
                        {settings.shapeBurstOrganicLayer && <>
                            <Slider label={t('organicLayerCount')} min={5} max={50} step={1} value={settings.shapeBurstOrganicLayerCount} onChange={e => handleChange('shapeBurstOrganicLayerCount', parseInt(e.target.value, 10))} />
                            <Slider label={t('organicLayerSize')} min={1} max={5} step={0.1} value={settings.shapeBurstOrganicLayerSizeMultiplier} onChange={e => handleChange('shapeBurstOrganicLayerSizeMultiplier', parseFloat(e.target.value))} />
                        </>}
                        <Checkbox label={t('enableForegroundPile')} checked={settings.shapeBurstForeground} onChange={e => handleChange('shapeBurstForeground', e.target.checked)} />
                        {settings.shapeBurstForeground && <>
                            <Slider label={t('foregroundCount')} min={5} max={50} step={1} value={settings.shapeBurstForegroundCount} onChange={e => handleChange('shapeBurstForegroundCount', parseInt(e.target.value, 10))} />
                            <Slider label={t('foregroundSize')} min={1} max={5} step={0.1} value={settings.shapeBurstForegroundSizeMultiplier} onChange={e => handleChange('shapeBurstForegroundSizeMultiplier', parseFloat(e.target.value))} />
                        </>}
                    </>);
                    case LayoutType.TieredShape: return (<>
                        <Select label={t('shape')} value={settings.tieredShape} onChange={e => handleChange('tieredShape', e.target.value)} options={[{id: TieredShape.Heart, name: t('shapeHeart')}, {id: TieredShape.Circle, name: t('shapeCircle')}, {id: TieredShape.Square, name: t('shapeSquare')}]} />
                        <Slider label={t('tiers')} min={5} max={30} step={1} value={settings.tieredTiers} onChange={e => handleChange('tieredTiers', parseInt(e.target.value, 10))} />
                        <Slider label={t('sizeVariation')} min={0} max={1} step={0.01} value={settings.tieredSizeVariation} onChange={e => handleChange('tieredSizeVariation', parseFloat(e.target.value))} />
                    </>);
                    case LayoutType.Kaleidoscope: return <Slider label={t('sectors')} min={4} max={24} step={2} value={settings.kaleidoscopeSectors} onChange={e => handleChange('kaleidoscopeSectors', parseInt(e.target.value))} />;
                    case LayoutType.GoldenSpiral: 
                        const spiralTypeOptions = [
                            {id: SpiralType.Golden, name: t('spiralTypeGolden')},
                            {id: SpiralType.Archimedean, name: t('spiralTypeArchimedean')},
                            {id: SpiralType.Fermat, name: t('spiralTypeFermat')},
                            {id: SpiralType.Hyperbolic, name: t('spiralTypeHyperbolic')},
                        ];
                        return (<>
                        <Select label={t('spiralType')} value={settings.spiralType} onChange={e => handleChange('spiralType', e.target.value)} options={spiralTypeOptions} />
                        <Slider label={t('spiralTightness')} hint={t('spiralTightnessHint')} min={0.1} max={5} step={0.05} value={settings.spiralTightness} onChange={e => handleChange('spiralTightness', parseFloat(e.target.value))} />
                        <Slider label={t('spiralDensity')} hint={t('spiralDensityHint')} min={0.1} max={10} step={0.1} value={settings.spiralDensity} onChange={e => handleChange('spiralDensity', parseFloat(e.target.value))} />
                        <Slider label={t('startPoint')} min={0} max={1} step={0.01} value={settings.goldenSpiralOffset} onChange={e => handleChange('goldenSpiralOffset', parseFloat(e.target.value))} />
                        <Slider label={t('goldenSpiralScale')} min={0.5} max={2.5} step={0.01} value={settings.goldenSpiralScale} onChange={e => handleChange('goldenSpiralScale', parseFloat(e.target.value))} />
                    </>);
                    case LayoutType.Journal: return (<>
                        <p className="text-xs text-gray-400">{t('journalControlsHint')}</p>
                        <Slider label={t('columns')} min={1} max={10} step={1} value={settings.cols} onChange={e => handleChange('cols', parseInt(e.target.value, 10))} />
                        <Slider label={t('overlap')} min={0} max={1} step={0.01} value={settings.journalOverlap} onChange={e => handleChange('journalOverlap', parseFloat(e.target.value))} />
                        <Slider label={t('rowVariation')} min={0} max={1} step={0.01} value={settings.journalRowVariation} onChange={e => handleChange('journalRowVariation', parseFloat(e.target.value))} />
                    </>);
                    case LayoutType.Circular: return (<>
                         <Slider label={t('rings')} min={1} max={10} step={1} value={settings.circularRings} onChange={e => handleChange('circularRings', parseInt(e.target.value))} />
                         <Select label={t('circularPattern')} value={settings.circularPattern} onChange={e => handleChange('circularPattern', e.target.value)} options={[{id: CircularPattern.Default, name: t('patternDefault')}, {id: CircularPattern.SpiderWeb, name: t('patternSpiderWeb')}]} />
                    </>);
                    case LayoutType.Orbital: return (<>
                        <Slider label={t('orbitalRadius')} min={100} max={1000} step={10} value={settings.orbitalRadius} onChange={e => handleChange('orbitalRadius', parseFloat(e.target.value))} />
                        <Slider label={t('orbitalFocus')} min={100} max={2000} step={10} value={settings.orbitalFocus} onChange={e => handleChange('orbitalFocus', parseFloat(e.target.value))} />
                        <Slider label={t('orbitalTilt')} min={-45} max={45} step={1} value={settings.orbitalTilt} onChange={e => handleChange('orbitalTilt', parseFloat(e.target.value))} />
                        <Slider label={t('orbitalScale')} min={-2} max={2} step={0.01} value={settings.orbitalScale} onChange={e => handleChange('orbitalScale', parseFloat(e.target.value))} />
                        <Slider label={t('orbitalLightAngle')} min={0} max={360} step={1} value={settings.orbitalLightAngle} onChange={e => handleChange('orbitalLightAngle', parseFloat(e.target.value))} />
                        <Slider label={t('orbitalLightIntensity')} min={0} max={1} step={0.01} value={settings.orbitalLightIntensity} onChange={e => handleChange('orbitalLightIntensity', parseFloat(e.target.value))} />
                        <Slider label={t('orbitalDoF')} min={0} max={20} step={0.5} value={settings.orbitalDoF} onChange={e => handleChange('orbitalDoF', parseFloat(e.target.value))} />
                    </>);
                    default: return null;
                }
            })()}
        </div>
    );
    
    const bgStyleOptions = [ { id: BackgroundStyle.Solid, name: t('bgStyleSolid') }, { id: BackgroundStyle.MeshGradient, name: t('bgStyleMeshGradient') }, { id: BackgroundStyle.AuroraLights, name: t('bgStyleAuroraGlow') }, { id: BackgroundStyle.GrainyPastel, name: t('bgStyleGrainy') }, { id: BackgroundStyle.ConicBurst, name: t('bgStyleConicBurst') }, { id: BackgroundStyle.PaperTexture, name: t('bgStylePaper') }, { id: BackgroundStyle.Image, name: t('bgStyleImage') }, ];
    const paletteOptions = Object.entries(COLOR_PALETTES).map(([id, {nameKey}]) => ({id, name: t(nameKey)}));

    const TabButton: React.FC<{ tabName: SidebarTab; icon: React.ReactNode; label: string }> = ({ tabName, icon, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            title={label}
            className={`flex-1 p-3 flex justify-center items-center rounded-lg transition-colors duration-200 ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
        >
            {icon}
        </button>
    );

    return (
        <aside className="w-96 flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-r border-gray-700/50 flex flex-col">
            {/* --- FIXED HEADER FOR FILE ACTIONS --- */}
            <div className="p-4 border-b border-gray-700/50 space-y-3 flex-shrink-0">
                <div className="grid grid-cols-2 gap-2">
                    <label
                        htmlFor="file-upload-sidebar"
                        className="w-full text-center cursor-pointer block px-3 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-md hover:bg-indigo-700 transition"
                    >
                        {hasImages ? t('addMoreImages') : t('addImages')}
                        <input id="file-upload-sidebar" name="file-upload" type="file" className="sr-only" multiple onChange={onFileChange} accept="image/*" />
                    </label>
                    <button onClick={onClear} className="px-2 py-2 bg-red-600/80 text-white font-semibold text-xs rounded-lg shadow-md hover:bg-red-700/80 transition disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!hasImages}>{t('clearAll')}</button>
                </div>
            </div>

            {/* --- TAB NAVIGATION --- */}
            <div className="flex justify-around p-2 bg-gray-900/30 border-b border-gray-700/50 space-x-2">
                <TabButton tabName="layout" icon={<LayoutIcon />} label={t('tabLayout')} />
                <TabButton tabName="style" icon={<StyleIcon />} label={t('tabStyle')} />
            </div>

            {/* --- SCROLLABLE TAB CONTENT --- */}
            <div className="flex-grow overflow-y-auto px-4">
                {activeTab === 'layout' && (
                    <div className="py-4 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300">{t('layout')}</h3>
                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                                {layoutOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleChange('layout', opt.id)}
                                        className={`p-2 text-sm font-medium rounded-lg transition-colors text-center shadow-sm h-14 flex items-center justify-center ${settings.layout === opt.id ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                        {opt.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                         <div className="py-2 border-y border-gray-700/50">
                            <Slider label={t('imageDensity')} hint={t('imageDensityHint')} min={1} max={20} step={0.5} value={settings.imageMultiplier} onChange={e => handleChange('imageMultiplier', parseFloat(e.target.value))} />
                        </div>
                        
                        <div className="flex items-center justify-center space-x-2">
                            <button 
                                onClick={onUndo} 
                                disabled={!canUndo}
                                aria-label="Undo"
                                className="p-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 disabled:text-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                             <button
                                onClick={handleIntelligentRandomize}
                                className="flex-grow text-center px-3 py-3 bg-indigo-500/20 text-indigo-300 font-semibold text-sm rounded-lg border border-indigo-500/50 hover:bg-indigo-500/30 transition-all flex items-center justify-center space-x-2 group hover:shadow-lg hover:shadow-indigo-500/20"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                <span>{t('intelligentVariation')}</span>
                            </button>
                             <button 
                                onClick={onRedo} 
                                disabled={!canRedo}
                                aria-label="Redo"
                                className="p-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 disabled:text-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="pt-2">
                             <Accordion title={getLayoutControlsTitle(settings.layout, t)} defaultOpen={true}>
                                {renderLayoutSpecificControls()}
                            </Accordion>
                            {hasImages && (
                                <Accordion title={t('imageOrderTitle')}>
                                    <button 
                                        onClick={onShuffle} 
                                        className="w-full mb-3 px-2 py-2 bg-gray-600 text-white font-semibold text-xs rounded-lg shadow-md hover:bg-gray-500 transition flex items-center justify-center space-x-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        <span>{t('shuffleImages')}</span>
                                    </button>
                                    <DraggableImageThumbnails images={imageFiles} onReorder={onImageReorder} />
                                </Accordion>
                            )}
                            <Accordion title={t('organicVariationControls')} defaultOpen={true}>
                                {showOrganicControls && (
                                    <Slider label={t('chaosVariation')} hint={t('chaosVariationHint')} min={0} max={1} step={0.01} value={settings.organicVariation} onChange={e => handleChange('organicVariation', parseFloat(e.target.value))} />
                                )}
                                {showGlobalRotation && (
                                    <Slider label={t('globalRotation')} hint={t('globalRotationHint')} min={-180} max={180} step={1} value={settings.globalRotation} onChange={e => handleChange('globalRotation', parseInt(e.target.value, 10))} />
                                )}
                            </Accordion>
                        </div>
                    </div>
                )}
                
                {activeTab === 'style' && (
                     <div className="py-4 space-y-4">
                        <div>
                             <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('stylePresets')}</h3>
                            <div className="flex space-x-3 overflow-x-auto -mx-4 px-4 pb-2">
                                {STYLE_PRESETS.map(preset => (
                                    <button key={preset.id} onClick={() => handlePresetClick(preset.settings)} className="flex-shrink-0 w-24 group" title={t(preset.nameKey)}>
                                        <div className="w-24 h-24 bg-gray-700 rounded-lg overflow-hidden transition-transform group-hover:scale-105 ring-2 ring-transparent group-hover:ring-indigo-500"><PresetThumbnail presetId={preset.id} /></div>
                                        <p className="text-xs text-gray-400 mt-1.5 text-center truncate group-hover:text-white">{t(preset.nameKey)}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                         {hasPng && (
                             <Accordion title={t('pngSettings')} defaultOpen={true}>
                                 <div className="space-y-3">
                                     <Checkbox label={t('addPngBg')} checked={settings.addPngBackground} onChange={e => handleChange('addPngBackground', e.target.checked)} />
                                     <button
                                         onClick={onRegeneratePngBgs}
                                         disabled={!settings.addPngBackground}
                                         className="w-full px-3 py-2 bg-gray-600 text-white font-semibold text-sm rounded-lg shadow-md hover:bg-gray-500 transition disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                                     >
                                         {t('randomizePngBg')}
                                     </button>
                                 </div>
                             </Accordion>
                         )}
                        <Accordion title={t('visualEffects')} defaultOpen={true}>
                            <Slider label={t('spacing')} min={0} max={50} step={1} value={settings.spacing} onChange={e => handleChange('spacing', parseInt(e.target.value, 10))} />
                            <Slider label={t('cornerRadius')} min={0} max={100} step={1} value={settings.cornerRadius} onChange={e => handleChange('cornerRadius', parseInt(e.target.value, 10))} />
                            <Slider label={t('shadow')} min={0} max={100} step={1} value={settings.shadowBlur} onChange={e => handleChange('shadowBlur', parseInt(e.target.value, 10))} />
                            <Slider label={t('vignette')} min={0} max={1} step={0.01} value={settings.vignette} onChange={e => handleChange('vignette', parseFloat(e.target.value))} />
                        </Accordion>
                        <Accordion title={t('enableFocalPoint')}>
                            <Checkbox label={t('enableFocalPoint')} checked={settings.focalPoint} onChange={e => handleChange('focalPoint', e.target.checked)} />
                            {settings.focalPoint && <>
                                <Slider label={t('blurIntensity')} min={0} max={20} step={0.5} value={settings.focalPointBlur} onChange={e => handleChange('focalPointBlur', parseFloat(e.target.value))} />
                                <Slider label={t('focusTransition')} hint={t('focusTransitionHint')} min={0} max={1} step={0.01} value={settings.focalPointFocusTransition} onChange={e => handleChange('focalPointFocusTransition', parseFloat(e.target.value))} />
                                <button onClick={onRandomFocus} className="w-full px-3 py-2 bg-gray-600 text-white font-semibold text-sm rounded-lg shadow-md hover:bg-gray-500 transition">{t('randomizeFocus')}</button>
                            </>}
                        </Accordion>
                         <Accordion title={t('imageBorder')}>
                            <Select label={t('cardStyle')} value={settings.cardStyle} onChange={e => handleChange('cardStyle', e.target.value as CardStyle)} options={[{id: CardStyle.Default, name: t('cardStyleDefault')}, {id: CardStyle.Glass, name: t('cardStyleGlass')}]} />
                            <Slider label={t('internalPadding')} hint={t('internalPaddingHint' as TranslationKey)} min={0} max={50} step={1} value={settings.padding} onChange={e => handleChange('padding', parseInt(e.target.value, 10))} />
                            {settings.cardStyle === CardStyle.Default && <>
                                <Checkbox label={t('enableBorder')} checked={settings.imageBorder} onChange={e => handleChange('imageBorder', e.target.checked)} />
                                {settings.imageBorder && <>
                                    <ColorInput label={t('borderColor')} value={settings.borderColor} onChange={e => handleChange('borderColor', e.target.value)} />
                                    <Slider label={t('borderWidth')} min={1} max={50} step={1} value={settings.borderWidth} onChange={e => handleChange('borderWidth', parseInt(e.target.value, 10))} />
                                </>}
                            </>}
                        </Accordion>
                         <Accordion title={t('background')} defaultOpen={true}>
                            <Control label={t('style')}>
                                <div className="grid grid-cols-3 gap-2">
                                    {bgStyleOptions.map(opt => (
                                        <div key={opt.id} className="flex flex-col items-center">
                                            <BackgroundThumbnail styleId={opt.id as BackgroundStyle} current={settings.backgroundStyle} onClick={() => handleChange('backgroundStyle', opt.id)} />
                                            <p className={`text-xs mt-1.5 ${settings.backgroundStyle === opt.id ? 'text-white font-semibold' : 'text-gray-400'}`}>{opt.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </Control>
                            {settings.backgroundStyle === BackgroundStyle.Image && (
                                <Control label={t('bgStyleImage')}>
                                     <label className="w-full text-center cursor-pointer block px-3 py-2 bg-gray-700 text-white font-semibold text-sm rounded-lg shadow-md hover:bg-gray-600 transition">
                                        {settings.backgroundImage ? t('changeBgImage') : t('uploadBgImage')}
                                        <input type="file" className="sr-only" onChange={onBgImageChange} accept="image/*" />
                                    </label>
                                </Control>
                            )}
                            {settings.backgroundStyle === BackgroundStyle.Solid ? (<>
                                <ColorInput label={t('bgColor')} value={settings.bgColor} onChange={e => handleChange('bgColor', e.target.value)} />
                                <Control label={t('predefinedColors')}>
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 mb-2">{t('lightColors')}</h4>
                                        <div className="flex flex-wrap gap-2">{PREDEFINED_LIGHT_COLORS.map(color => (<button key={color.hex} title={color.name} onClick={() => handleChange('bgColor', color.hex)} className={`w-7 h-7 rounded-full border-2 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${settings.bgColor.toLowerCase() === color.hex.toLowerCase() ? 'border-white ring-2 ring-indigo-500' : 'border-gray-600'}`} style={{ backgroundColor: color.hex }} />))}</div>
                                    </div>
                                    <div className="mt-3">
                                        <h4 className="text-xs font-semibold text-gray-400 mb-2">{t('darkColors')}</h4>
                                        <div className="flex flex-wrap gap-2">{PREDEFINED_DARK_COLORS.map(color => (<button key={color.hex} title={color.name} onClick={() => handleChange('bgColor', color.hex)} className={`w-7 h-7 rounded-full border-2 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${settings.bgColor.toLowerCase() === color.hex.toLowerCase() ? 'border-white ring-2 ring-indigo-500' : 'border-gray-500'}`} style={{ backgroundColor: color.hex }} />))}</div>
                                    </div>
                                </Control>
                            </>) : (settings.backgroundStyle !== BackgroundStyle.Image && <Select label={t('bgPalette')} value={settings.bgPalette} onChange={e => handleChange('bgPalette', e.target.value)} options={paletteOptions} />)}
                            {colorPalette.length > 0 && settings.backgroundStyle === BackgroundStyle.Solid && (<Control label={t('suggestedPalette')} hint={t('paletteHint')}><div className="flex flex-wrap gap-2">{colorPalette.map(color => (<button key={color} onClick={() => handleChange('bgColor', color)} className="w-7 h-7 rounded-full border-2 border-gray-600 transition-transform transform hover:scale-110" style={{backgroundColor: color}} />))}</div></Control>)}
                        </Accordion>
                    </div>
                )}
            </div>
        </aside>
    );
};


import React, { useMemo, useCallback, useState } from 'react';
import type { Settings } from '../types';
import { LayoutType, CardStyle } from '../types';
import { useTranslation } from '../App';
import { getLayoutOptions } from '../constants';
import { Select } from './UIComponents';

interface LeftSidebarProps {
  settings: Settings;
  onSettingsChange: (newSettings: React.SetStateAction<Settings>) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ settings, onSettingsChange }) => {
    const { t } = useTranslation();
    const layoutOptions = useMemo(() => getLayoutOptions(t), [t]);
    
    const [isMockupsOpen, setIsMockupsOpen] = useState(true);
    const [isCreativeOpen, setIsCreativeOpen] = useState(true);
    const [isClassicOpen, setIsClassicOpen] = useState(true);

    const handleChange = useCallback((key: keyof Settings, value: any) => {
        onSettingsChange(s => ({ ...s, [key]: value }));
    }, [onSettingsChange]);

    return (
        <aside className="w-80 flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Estrutura & Layout</h2>
            </div>
            
            <div className="flex-grow overflow-y-auto px-2 custom-scrollbar py-4 space-y-4">
                
                {/* --- ESTILO DO ITEM (CardStyle) --- */}
                <div className="bg-gray-800/40 rounded-none border border-gray-700/50 p-4 mb-6">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Estilo do Item (Mockup/Cartão)</h3>
                    <p className="text-[9px] text-gray-500 font-medium mb-3 leading-tight">Define a aparência individual de cada foto (ex: Celular, Polaroid, Vidro).</p>
                    <Select 
                        label="" 
                        value={settings.cardStyle} 
                        onChange={e => handleChange('cardStyle', e.target.value)} 
                        options={[
                            {id: CardStyle.Default, name: 'Sólido / Básico'}, 
                            {id: CardStyle.Glass, name: 'Vidro Fosco (Glassmorphism)'}, 
                            {id: CardStyle.DeviceMockup, name: 'Mockup de Dispositivo'}
                        ]} 
                    />
                    
                    <div className="mt-3">
                        <Select 
                            label="Formato do Item (Proporção)" 
                            value={settings.deviceType} 
                            onChange={e => handleChange('deviceType', e.target.value)} 
                            options={[
                                {id: 'auto', name: 'Automático (Adapta à foto)'}, 
                                {id: 'original', name: 'Original (Sem cortes)'},
                                {id: 'phone', name: 'Celular (Vertical)'}, 
                                {id: 'laptop', name: 'Monitor (Horizontal)'}
                            ]} 
                        />
                    </div>
                </div>

                {/* --- MOCKUP SELECTION SECTION --- */}
                <div className="bg-gray-800/40 rounded-none border border-gray-700/50 overflow-hidden">
                    <button 
                        onClick={() => setIsMockupsOpen(!isMockupsOpen)}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-700/40 transition-colors text-left"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">{t('mockupSectionTitle' as any)}</h3>
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded-none border border-indigo-500/20">PREMIUM</span>
                            </div>
                            <p className="text-[9px] text-gray-500 font-medium mt-1 leading-tight max-w-[200px]">{t('mockupSectionDesc' as any)}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isMockupsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {isMockupsOpen && (
                        <div className="p-3 pt-0 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                            {layoutOptions.filter(opt => [
                                LayoutType.Showcase, LayoutType.MockupSpiral, LayoutType.MockupDiagonal,
                                LayoutType.MockupCascade, LayoutType.MockupGrid3D, LayoutType.MockupStack,
                                LayoutType.MockupWall, LayoutType.IsometricGrid, 
                                LayoutType.StaggeredRows, LayoutType.FloatingCloud, LayoutType.PerspectiveGrid, 
                                LayoutType.CoverFlow, LayoutType.Carousel, LayoutType.Floating
                            ].includes(opt.id as LayoutType)).map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleChange('layout', opt.id)}
                                    className={`p-2 text-[10px] font-black uppercase tracking-tight rounded-none transition-all text-center h-14 flex items-center justify-center leading-tight border ${
                                        settings.layout === opt.id 
                                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30 -translate-y-0.5' 
                                            : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200 hover:border-gray-600'
                                    }`}>
                                    {opt.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- CREATIVE LAYOUTS --- */}
                <div className="bg-gray-800/20 rounded-none border border-gray-700/30 overflow-hidden">
                    <button 
                        onClick={() => setIsCreativeOpen(!isCreativeOpen)}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-700/40 transition-colors text-left"
                    >
                        <div className="flex flex-col">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">{t('creativeSectionTitle' as any)}</h3>
                            <p className="text-[9px] text-gray-500 font-medium mt-1 leading-tight">{t('creativeSectionDesc' as any)}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isCreativeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {isCreativeOpen && (
                        <div className="p-3 pt-0 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                            {layoutOptions.filter(opt => [
                                LayoutType.Kaleidoscope, LayoutType.GoldenSpiral, LayoutType.Fractal, 
                                LayoutType.Voronoi, LayoutType.CustomShape, LayoutType.TieredShape, 
                                LayoutType.Orbital, LayoutType.Wall3D, LayoutType.Circular
                            ].includes(opt.id as LayoutType)).map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleChange('layout', opt.id)}
                                    className={`p-2 text-[10px] font-bold uppercase tracking-tight rounded-none transition-all text-center h-12 flex items-center justify-center leading-tight border ${
                                        settings.layout === opt.id 
                                            ? 'bg-gray-700 border-gray-500 text-white shadow-md' 
                                            : 'bg-gray-800/20 border-gray-700/50 text-gray-500 hover:bg-gray-700/40 hover:text-gray-300'
                                    }`}>
                                    {opt.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- CLASSIC LAYOUTS --- */}
                <div className="bg-gray-800/20 rounded-none border border-gray-700/30 overflow-hidden">
                    <button 
                        onClick={() => setIsClassicOpen(!isClassicOpen)}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-700/40 transition-colors text-left"
                    >
                        <div className="flex flex-col">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">{t('classicSectionTitle' as any)}</h3>
                            <p className="text-[9px] text-gray-500 font-medium mt-1 leading-tight">{t('classicSectionDesc' as any)}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isClassicOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {isClassicOpen && (
                        <div className="p-3 pt-0 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                            {layoutOptions.filter(opt => [
                                LayoutType.Grid, LayoutType.Mosaic, LayoutType.Pile, 
                                LayoutType.Tiled, LayoutType.Journal, LayoutType.Isometric
                            ].includes(opt.id as LayoutType)).map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleChange('layout', opt.id)}
                                    className={`p-2 text-[10px] font-bold uppercase tracking-tight rounded-none transition-all text-center h-12 flex items-center justify-center leading-tight border ${
                                        settings.layout === opt.id 
                                            ? 'bg-gray-700 border-gray-500 text-white shadow-md' 
                                            : 'bg-gray-800/20 border-gray-700/50 text-gray-500 hover:bg-gray-700/40 hover:text-gray-300'
                                    }`}>
                                    {opt.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

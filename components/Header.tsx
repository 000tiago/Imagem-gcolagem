
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../App';
import type { Settings, ExportFormat } from '../types';
import { LayoutType } from '../types';
import { getLayoutOptions } from '../constants';

interface HeaderProps {
    settings: Settings;
    onSettingsChange: (newSettings: React.SetStateAction<Settings>) => void;
    onExport: () => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    isRecording: boolean;
    isExporting: boolean;
    hasImages: boolean;
    palette: string[];
}

const Control: React.FC<{label: string, children: React.ReactNode}> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
        {children}
    </div>
);

const Select: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: { id: string; name: string }[]}> = ({ label, value, onChange, options }) => (
    <Control label={label}>
        <select value={value} onChange={onChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-none text-sm text-gray-200 focus:ring-indigo-500 focus:border-indigo-500">
            {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
        </select>
    </Control>
);

const Slider: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min: number, max: number, step: number}> = ({ label, value, onChange, min, max, step }) => (
    <Control label={label}>
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


export const Header: React.FC<HeaderProps> = (props) => {
  const { 
    settings, onSettingsChange, onExport,
    isRecording, isExporting, hasImages,
    onStartRecording, onStopRecording,
    palette
  } = props;
  const { t, setLanguage, language } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const layoutOptions = getLayoutOptions(t);
  const mockupLayouts = [
    LayoutType.Showcase, 
    LayoutType.MockupWall, 
    LayoutType.IsometricGrid, 
    LayoutType.StaggeredRows, 
    LayoutType.FloatingCloud, 
    LayoutType.PerspectiveGrid, 
    LayoutType.CoverFlow, 
    LayoutType.Carousel, 
    LayoutType.Floating
  ];

  const isMockupMode = mockupLayouts.includes(settings.layout as LayoutType);
  
  const aspectOptions = [
    { id: '16/9', name: t('aspect16_9') }, 
    { id: '1/1', name: t('aspect1_1') }, 
    { id: '4/3', name: t('aspect4_3') }, 
    { id: '9/16', name: t('aspect9_16') },
    { id: '2/3', name: 'Retrato (2:3)' },
    { id: '3/4', name: 'Retrato (3:4)' }
  ];
  const formatOptions: {id: ExportFormat, name: string}[] = [{id: 'jpeg', name: 'JPEG'}, {id: 'png', name: 'PNG'}, {id: 'webp', name: 'WebP'}];
  
  const handleChange = (key: keyof Settings, value: any) => {
    onSettingsChange(s => ({ ...s, [key]: value }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex-shrink-0 bg-gray-900 border-b border-gray-700 shadow-xl z-30">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-fit">
            <h1 className="text-lg font-black text-white tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-none flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <span className="hidden sm:inline uppercase">{t('headerTitle')}</span>
            </h1>
          </div>

          {/* QUICK ACTIONS TOOLBAR */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-4 bg-gray-800/50 rounded-none px-4 py-1.5 border border-gray-700/50">
              
              {/* Quick Action: Mockup Color */}
              {(isMockupMode || settings.cardStyle === 'DeviceMockup') && (
                <div className="flex items-center space-x-2 border-r border-gray-700 pr-4">
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Cor do Aparelho</span>
                   <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        value={settings.borderColor} 
                        onChange={(e) => handleChange('borderColor', e.target.value)}
                        className="w-5 h-5 p-0 border-none bg-transparent cursor-pointer rounded-none overflow-hidden"
                      />
                      <div className="flex items-center space-x-1 border-l border-gray-600 pl-2">
                        {palette.slice(0, 3).map((color, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleChange('borderColor', color)}
                            className={`w-3 h-3 rounded-none border border-white/20 transition-transform hover:scale-125 ${settings.borderColor === color ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-gray-800' : ''}`}
                            style={{ backgroundColor: color }}
                            title={`Cor ${idx + 1}`}
                          />
                        ))}
                      </div>
                   </div>
                </div>
              )}

              {/* Quick Action: Background Color */}
              {settings.backgroundStyle === 'Solid' && (
                <div className="flex items-center space-x-2">
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Cor de Fundo</span>
                   <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        value={settings.bgColor} 
                        onChange={(e) => handleChange('bgColor', e.target.value)}
                        className="w-5 h-5 p-0 border-none bg-transparent cursor-pointer rounded-none overflow-hidden"
                      />
                      <div className="flex items-center space-x-1 border-l border-gray-600 pl-2">
                        {palette.slice(0, 3).map((color, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleChange('bgColor', color)}
                            className={`w-3 h-3 rounded-none border border-white/20 transition-transform hover:scale-125 ${settings.bgColor === color ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-gray-800' : ''}`}
                            style={{ backgroundColor: color }}
                            title={`Cor ${idx + 1}`}
                          />
                        ))}
                      </div>
                   </div>
                </div>
              )}

              {/* Default state if no quick actions */}
              {!isMockupMode && settings.cardStyle !== 'DeviceMockup' && settings.backgroundStyle !== 'Solid' && (
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Ações Rápidas</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 min-w-fit">
              <button
                  onClick={onStartRecording}
                  disabled={isExporting || isRecording || !hasImages}
                  className="px-3 py-2 text-[10px] font-black uppercase tracking-wider bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-none hover:bg-indigo-600/40 transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:border-gray-700 disabled:cursor-not-allowed flex items-center"
                  title="Gera uma animação retrospectiva do seu layout"
              >
                  {isExporting ? (
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  )}
                  {isExporting ? 'Gravando...' : 'Gravar Animação'}
              </button>

              <button
                  onClick={onExport}
                  disabled={isExporting || isRecording || !hasImages}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-green-600 text-white rounded-none shadow-lg shadow-green-900/20 hover:bg-green-500 transition-all disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center"
              >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  {t('exportImage')}
              </button>
              
              <div className="relative" ref={settingsRef}>
                  <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-none bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors border border-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                  </button>
                  {isSettingsOpen && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-none shadow-2xl p-4 space-y-4 ring-1 ring-black/50">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('canvasSettings')}</h3>
                          <Select label={t('aspectRatio')} value={settings.aspectRatio} onChange={e => handleChange('aspectRatio', e.target.value)} options={aspectOptions} />
                          <Select label={t('imageFit')} value={settings.imageFit} onChange={e => handleChange('imageFit', e.target.value)} options={[{ id: 'cover', name: t('fitCover')}, { id: 'contain', name: t('fitContain')}]} />
                          <div className="border-t border-gray-700 my-2"></div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('export')}</h3>
                           <Select label={t('format')} value={settings.exportFormat} onChange={e => handleChange('exportFormat', e.target.value as ExportFormat)} options={formatOptions} />
                          {settings.exportFormat !== 'png' &&
                              <Slider label={t('quality')} min={0.1} max={1} step={0.01} value={settings.exportQuality} onChange={e => handleChange('exportQuality', parseFloat(e.target.value))} />
                          }
                      </div>
                  )}
              </div>

              <div className="flex items-center bg-gray-800 rounded-none p-1 border border-gray-700">
                <button onClick={() => setLanguage('pt')} className={`px-2 py-1 text-[10px] font-bold rounded-none ${language === 'pt' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>PT</button>
                <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-[10px] font-bold rounded-none ${language === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>EN</button>
              </div>
          </div>
        </div>
      </div>
    </header>
  );
};

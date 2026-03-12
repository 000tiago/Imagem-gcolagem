
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../App';
import type { Settings, ExportFormat } from '../types';

interface HeaderProps {
    settings: Settings;
    onSettingsChange: (newSettings: React.SetStateAction<Settings>) => void;
    onExport: () => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    isRecording: boolean;
    isExporting: boolean;
    hasImages: boolean;
}

const Control: React.FC<{label: string, children: React.ReactNode}> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
        {children}
    </div>
);

const Select: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: { id: string; name: string }[]}> = ({ label, value, onChange, options }) => (
    <Control label={label}>
        <select value={value} onChange={onChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-gray-200 focus:ring-indigo-500 focus:border-indigo-500">
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
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono text-gray-300 w-10 text-right">{value.toFixed(2)}</span>
        </div>
    </Control>
);


export const Header: React.FC<HeaderProps> = (props) => {
  const { 
    settings, onSettingsChange, onExport,
    isRecording, isExporting, hasImages,
    onStartRecording, onStopRecording 
  } = props;
  const { t, setLanguage, language } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const aspectOptions = [{ id: '16/9', name: t('aspect16_9') }, { id: '1/1', name: t('aspect1_1') }, { id: '4/3', name: t('aspect4_3') }, { id: '9/16', name: t('aspect9_16') }];
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
    <header className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 shadow-lg z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              {t('headerTitle')}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
              <button
                  onClick={onExport}
                  disabled={isExporting || isRecording || !hasImages}
                  className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center"
              >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  {t('exportImage')}
              </button>
              <button
                  onClick={() => isRecording ? onStopRecording() : onStartRecording()}
                  disabled={isExporting || !hasImages}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                   {isRecording ? <svg className="w-4 h-4 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z"></path></svg> : <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.55a1 1 0 011.45.89v2.22a1 1 0 01-1.45.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>}
                  {isRecording ? t('stopRecording') : t('startRecording')}
              </button>

              <div className="relative" ref={settingsRef}>
                  <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2.5 rounded-lg bg-gray-700/80 text-gray-300 hover:bg-gray-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                  </button>
                  {isSettingsOpen && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl p-4 space-y-4">
                          <h3 className="text-sm font-semibold text-white">{t('canvasSettings')}</h3>
                          <Select label={t('aspectRatio')} value={settings.aspectRatio} onChange={e => handleChange('aspectRatio', e.target.value)} options={aspectOptions} />
                          <Select label={t('imageFit')} value={settings.imageFit} onChange={e => handleChange('imageFit', e.target.value)} options={[{ id: 'cover', name: t('fitCover')}, { id: 'contain', name: t('fitContain')}]} />
                          <div className="border-t border-gray-700 my-2"></div>
                          <h3 className="text-sm font-semibold text-white">{t('export')}</h3>
                           <Select label={t('format')} value={settings.exportFormat} onChange={e => handleChange('exportFormat', e.target.value as ExportFormat)} options={formatOptions} />
                          {settings.exportFormat !== 'png' &&
                              <Slider label={t('quality')} min={0.1} max={1} step={0.01} value={settings.exportQuality} onChange={e => handleChange('exportQuality', parseFloat(e.target.value))} />
                          }
                      </div>
                  )}
              </div>
            
            <div className="flex items-center bg-gray-800 rounded-md p-1 ml-2">
                <button 
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 text-xs font-medium rounded ${language === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                    EN
                </button>
                <button 
                    onClick={() => setLanguage('pt')}
                    className={`px-2 py-1 text-xs font-medium rounded ${language === 'pt' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                    PT
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

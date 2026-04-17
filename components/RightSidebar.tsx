
import React, { useCallback, useMemo } from 'react';
import type { Settings, ImageFile, ImageOverride, ImageFilters } from '../types';
import { CardStyle, BackgroundStyle, LayoutType, GridStyle, VoronoiDistribution, TieredShape, CircularPattern, SpiralType } from '../types';
import { useTranslation } from '../App';
import { PRESETS, PREDEFINED_LIGHT_COLORS, PREDEFINED_DARK_COLORS, PALETTE_OPTIONS } from '../constants';
import { Accordion, Select, Slider, Checkbox, ColorInput, Control, PresetThumbnail, BackgroundThumbnail, DraggableImageThumbnails } from './UIComponents';
import type { TranslationKey } from '../App';

interface RightSidebarProps {
  settings: Settings;
  onSettingsChange: (newSettings: React.SetStateAction<Settings>) => void;
  imageFiles: ImageFile[];
  onReorderImages: (newImages: ImageFile[]) => void;
  onRemoveImage: (id: string) => void;
  onBgImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShapeFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRandomFocus: () => void;
  colorPalette: string[];
  onAddTextOverlay: () => void;
  onUpdateTextOverlay: (id: string, updates: any) => void;
  onRemoveTextOverlay: (id: string) => void;
  focusedImageIds: string[];
  onFocusChange: (ids: string[]) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ 
    settings, 
    onSettingsChange, 
    imageFiles, 
    onReorderImages, 
    onRemoveImage, 
    onBgImageChange, 
    onShapeFileChange,
    onRandomFocus,
    colorPalette,
    onAddTextOverlay,
    onUpdateTextOverlay,
    onRemoveTextOverlay,
    focusedImageIds,
    onFocusChange
}) => {
    const { t } = useTranslation();
    const bgStyleOptions = useMemo(() => [
        { id: BackgroundStyle.Solid, name: t('bgSolid') },
        { id: BackgroundStyle.MeshGradient, name: t('bgMesh') },
        { id: BackgroundStyle.AuroraLights, name: t('bgAurora') },
        { id: BackgroundStyle.GrainyPastel, name: t('bgGrainy') },
        { id: BackgroundStyle.ConicBurst, name: t('bgConic') },
        { id: BackgroundStyle.PaperTexture, name: t('bgPaper') },
        { id: BackgroundStyle.Image, name: t('bgImage') }
    ], [t]);

    const paletteOptions = useMemo(() => PALETTE_OPTIONS.map(p => ({ id: p.id, name: t(p.nameKey as any) })), [t]);

    const handleOverrideChange = useCallback((id: string, field: keyof ImageOverride, value: any) => {
        onSettingsChange(prev => {
            const overrides = { ...prev.imageOverrides };
            const current = overrides[id] || { id };
            overrides[id] = { ...current, [field]: value };
            return { ...prev, imageOverrides: overrides };
        });
    }, [onSettingsChange]);

    const handleFilterOverrideChange = useCallback((id: string, filterField: keyof ImageFilters, value: number) => {
        onSettingsChange(prev => {
            const overrides = { ...prev.imageOverrides };
            const current = overrides[id] || { id };
            const filters = { ...(current.filters || {}) };
            // @ts-ignore
            filters[filterField] = value;
            overrides[id] = { ...current, filters };
            return { ...prev, imageOverrides: overrides };
        });
    }, [onSettingsChange]);

    const handleChange = useCallback((key: keyof Settings, value: any) => {
        onSettingsChange(s => ({ ...s, [key]: value }));
    }, [onSettingsChange]);

    const applyPreset = (presetId: string) => {
        const preset = PRESETS.find(p => p.id === presetId);
        if (preset) onSettingsChange(s => ({ ...s, ...preset.settings }));
    };

    const renderLayoutSpecificControls = () => {
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
                <Slider label={t('complexityDensity')} min={2} max={16} step={1} value={settings.cols} onChange={e => handleChange('cols', parseInt(e.target.value))} />
                <Slider label={t('tileVariation')} min={0.01} max={1} step={0.01} value={settings.tileVariation} onChange={e => handleChange('tileVariation', parseFloat(e.target.value))} />
            </>);
            case LayoutType.Voronoi:
                return (<>
                    <Slider label={t('complexityDensity')} min={5} max={50} step={1} value={settings.cols} onChange={e => handleChange('cols', parseInt(e.target.value))} />
                    <Select label={t('pointDistribution')} value={settings.voronoiDistribution} onChange={e => handleChange('voronoiDistribution', e.target.value)} options={[{id: VoronoiDistribution.Random, name: t('distJittered')}, {id: VoronoiDistribution.Organic, name: t('distOrganic')}, {id: VoronoiDistribution.Centered, name: t('distCentered')}, {id: VoronoiDistribution.Sunflower, name: t('distSunflower')}, {id: VoronoiDistribution.Frame, name: t('distFrame')}]} />
                    {(settings.voronoiDistribution === VoronoiDistribution.Random || settings.voronoiDistribution === VoronoiDistribution.Sunflower) && <Slider label={t('voronoiJitterIntensity')} min={0} max={1.5} step={0.01} value={settings.voronoiPointJitter} onChange={e => handleChange('voronoiPointJitter', parseFloat(e.target.value))} />}
                    {settings.voronoiDistribution === VoronoiDistribution.Organic && <Slider label={t('voronoiMinDistance')} min={0.01} max={0.2} step={0.005} value={settings.voronoiOrganicDistance} onChange={e => handleChange('voronoiOrganicDistance', parseFloat(e.target.value))} />}
                    {settings.voronoiDistribution === VoronoiDistribution.Centered && <Slider label={t('voronoiCentralBias')} min={1} max={5} step={0.1} value={settings.voronoiCentralBias} onChange={e => handleChange('voronoiCentralBias', parseFloat(e.target.value))} />}
                    {settings.voronoiDistribution === VoronoiDistribution.Frame && <Slider label={t('voronoiFrameThickness')} min={1} max={5} step={0.1} value={settings.voronoiFrameFocus} onChange={e => handleChange('voronoiFrameFocus', parseFloat(e.target.value))} />}
                </>);
            case LayoutType.CustomShape: return (<>
                <Control label={t('customShapeOptional')} hint={t('customShapeHint')}>
                    <label className="w-full text-center cursor-pointer block px-3 py-2 bg-gray-700 text-white font-semibold text-sm rounded-none shadow-md hover:bg-gray-600 transition">
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
                return (<>
                <Select label={t('spiralType')} value={settings.spiralType} onChange={e => handleChange('spiralType', e.target.value)} options={[{id: SpiralType.Golden, name: t('spiralTypeGolden')}, {id: SpiralType.Archimedean, name: t('spiralTypeArchimedean')}, {id: SpiralType.Fermat, name: t('spiralTypeFermat')}, {id: SpiralType.Hyperbolic, name: t('spiralTypeHyperbolic')}]} />
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
            case LayoutType.Showcase:
            case LayoutType.MockupSpiral:
            case LayoutType.MockupDiagonal:
            case LayoutType.MockupCascade:
            case LayoutType.MockupGrid3D:
            case LayoutType.MockupStack:
            case LayoutType.MockupWall:
            case LayoutType.IsometricGrid:
            case LayoutType.StaggeredRows:
            case LayoutType.FloatingCloud:
            case LayoutType.PerspectiveGrid:
            case LayoutType.CoverFlow:
            case LayoutType.Carousel:
            case LayoutType.Floating:
                return (<>
                    <Slider label={t('spacing')} min={0} max={100} step={1} value={settings.mockupSpacing} onChange={e => handleChange('mockupSpacing', parseInt(e.target.value, 10))} />
                    <Slider label={t('angle')} min={0} max={100} step={1} value={settings.mockupAngle} onChange={e => handleChange('mockupAngle', parseInt(e.target.value, 10))} />
                </>);
            default: return null;
        }
    };

    const getLayoutControlsTitle = (layout: LayoutType, t: (key: TranslationKey) => string): string => {
        const titleMap: { [key in LayoutType]?: TranslationKey } = {
            [LayoutType.Grid]: 'gridControls', [LayoutType.Mosaic]: 'mosaicControls', [LayoutType.Pile]: 'pileControls', [LayoutType.Wall3D]: 'wall3DControls', [LayoutType.Tiled]: 'mosaicControls', [LayoutType.Fractal]: 'mosaicControls', [LayoutType.Voronoi]: 'voronoiControls', [LayoutType.CustomShape]: 'customShapeControls', [LayoutType.TieredShape]: 'tieredShapeControls', [LayoutType.Kaleidoscope]: 'kaleidoscopeControls', [LayoutType.GoldenSpiral]: 'goldenSpiralControls', [LayoutType.Journal]: 'journalControls', [LayoutType.Circular]: 'circularControls', [LayoutType.Orbital]: 'orbitalControls',
        };
        const key = titleMap[layout];
        return key ? t(key) : t('accordionLayoutControls');
    };

    const layoutsWithOrganicControls = [LayoutType.Grid, LayoutType.Wall3D, LayoutType.TieredShape, LayoutType.Circular, LayoutType.Journal, LayoutType.Pile];
    const layoutsWithoutRotation = [LayoutType.Voronoi, LayoutType.Mosaic, LayoutType.Fractal, LayoutType.Tiled];
    const showOrganicControls = layoutsWithOrganicControls.includes(settings.layout);
    const showGlobalRotation = !layoutsWithoutRotation.includes(settings.layout);

    const isMockupMode = [
        LayoutType.Showcase, LayoutType.MockupSpiral, LayoutType.MockupDiagonal,
        LayoutType.MockupCascade, LayoutType.MockupGrid3D, LayoutType.MockupStack,
        LayoutType.MockupWall, LayoutType.IsometricGrid, LayoutType.StaggeredRows,
        LayoutType.FloatingCloud, LayoutType.PerspectiveGrid, LayoutType.CoverFlow,
        LayoutType.Carousel, LayoutType.Floating
    ].includes(settings.layout);

    return (
        <aside className="w-80 flex-shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex flex-col gap-3">
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Ajustes e Estilos</h2>
                <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded border border-gray-700/50">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Iluminação Automática</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.autoLighting !== false} onChange={e => handleChange('autoLighting', e.target.checked)} />
                        <div className="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto px-4 custom-scrollbar py-4 space-y-6">
                {/* --- SELECTION OVERRIDES --- */}
                {focusedImageIds.length === 1 && (
                    <div className="space-y-2">
                        <div className="px-1 pt-2 pb-1 flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Seleção Atual</h3>
                            <button 
                                onClick={() => onFocusChange([])}
                                className="text-[9px] font-bold text-gray-500 hover:text-white transition-colors"
                            >
                                Desmarcar
                            </button>
                            <button 
                                onClick={() => {
                                    const selectedId = focusedImageIds[0];
                                    onSettingsChange(prev => {
                                        const overrides = { ...prev.imageOverrides };
                                        delete overrides[selectedId];
                                        return { ...prev, imageOverrides: overrides };
                                    });
                                }}
                                className="text-[9px] font-bold text-red-500 hover:text-red-400 transition-colors ml-2"
                            >
                                Resetar
                            </button>
                        </div>
                        <Accordion title="Transformação & Filtros" defaultOpen={true}>
                            <div className="py-2 space-y-4">
                                {(() => {
                                    const selectedId = focusedImageIds[0];
                                    const override = settings.imageOverrides[selectedId] || { id: selectedId };
                                    const filters = override.filters || {};
                                    
                                    return (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Slider label="Rotação" min={-180} max={180} step={1} value={override.rotationOffset || 0} onChange={e => handleOverrideChange(selectedId, 'rotationOffset', parseInt(e.target.value))} />
                                                <Slider label="Escala" min={0.5} max={3} step={0.01} value={override.scaleMultiplier || 1} onChange={e => handleOverrideChange(selectedId, 'scaleMultiplier', parseFloat(e.target.value))} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Slider label="Offset X" min={-500} max={500} step={1} value={override.offsetX || 0} onChange={e => handleOverrideChange(selectedId, 'offsetX', parseInt(e.target.value))} />
                                                <Slider label="Offset Y" min={-500} max={500} step={1} value={override.offsetY || 0} onChange={e => handleOverrideChange(selectedId, 'offsetY', parseInt(e.target.value))} />
                                            </div>
                                            <Slider label="Opacidade" min={0} max={1} step={0.01} value={override.opacity === undefined ? 1 : override.opacity} onChange={e => handleOverrideChange(selectedId, 'opacity', parseFloat(e.target.value))} />
                                            
                                            <div className="pt-2 border-t border-gray-800 space-y-3">
                                                <h4 className="text-[9px] font-bold text-gray-500 uppercase">Camadas (Z-Index)</h4>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleOverrideChange(selectedId, 'zIndex', (override.zIndex || 0) + 1)}
                                                        className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-[9px] font-bold uppercase rounded-none border border-gray-700 transition"
                                                    >
                                                        Trazer p/ Frente
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOverrideChange(selectedId, 'zIndex', (override.zIndex || 0) - 1)}
                                                        className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-[9px] font-bold uppercase rounded-none border border-gray-700 transition"
                                                    >
                                                        Enviar p/ Trás
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-800">
                                                <h4 className="text-[9px] font-bold text-gray-500 uppercase mb-3">Filtros Individuais</h4>
                                                <div className="space-y-3">
                                                    <Slider label="Brilho" min={0.5} max={1.5} step={0.01} value={filters.brightness === undefined ? 1 : filters.brightness} onChange={e => handleFilterOverrideChange(selectedId, 'brightness', parseFloat(e.target.value))} />
                                                    <Slider label="Contraste" min={0.5} max={1.5} step={0.01} value={filters.contrast === undefined ? 1 : filters.contrast} onChange={e => handleFilterOverrideChange(selectedId, 'contrast', parseFloat(e.target.value))} />
                                                    <Slider label="Saturação" min={0} max={2} step={0.01} value={filters.saturate === undefined ? 1 : filters.saturate} onChange={e => handleFilterOverrideChange(selectedId, 'saturate', parseFloat(e.target.value))} />
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </Accordion>
                    </div>
                )}

                {/* --- GROUP 1: COMPOSITION & STRUCTURE --- */}
                <div className="space-y-4">
                    <Accordion title={getLayoutControlsTitle(settings.layout, t)} defaultOpen={true}>
                        <div className="py-2 space-y-4">
                            <p className="text-[10px] text-gray-500 font-medium leading-tight mb-2 italic">
                                {isMockupMode 
                                    ? "Ajuste o posicionamento e perspectiva das fotos." 
                                    : "Controles específicos para a geometria deste layout."}
                            </p>
                            {renderLayoutSpecificControls()}
                        </div>
                    </Accordion>

                    <Accordion title="Densidade & Margens">
                        <div className="py-2 space-y-4">
                            <p className="text-[10px] text-gray-500 font-medium leading-tight mb-2">
                                Controle o preenchimento da tela e o respiro visual.
                            </p>
                            <Slider label={t('imageDensity')} hint={t('imageDensityHint')} min={1} max={20} step={0.5} value={settings.imageMultiplier} onChange={e => handleChange('imageMultiplier', parseFloat(e.target.value))} />
                            <Slider label="Área Útil / Margem" hint="Controla o espaço vazio ao redor de toda a colagem" min={0} max={200} step={1} value={settings.canvasPadding} onChange={e => handleChange('canvasPadding', parseInt(e.target.value, 10))} />
                            <Checkbox label="Travar Posição das Imagens (Apenas Pan)" checked={settings.lockImages} onChange={e => handleChange('lockImages', e.target.checked)} />
                            <Checkbox label="Preview de Baixa Resolução" checked={settings.lowResPreview} onChange={e => handleChange('lowResPreview', e.target.checked)} />
                            <button 
                                onClick={() => onSettingsChange(prev => ({ ...prev, imageOverrides: {}, globalOffsetX: 0, globalOffsetY: 0 }))}
                                className="w-full px-3 py-2 bg-red-900/20 text-red-400 font-bold text-[9px] uppercase tracking-widest rounded-none border border-red-900/30 hover:bg-red-900/30 transition shadow-sm mt-2 text-center"
                            >
                                Limpar Todos os Ajustes Manuais
                            </button>
                        </div>
                    </Accordion>
                </div>

                {/* --- GROUP 2: IMAGE VISUAL & STYLE --- */}
                <div className="space-y-4">
                    <Accordion title="Ajustes do Item (Bordas, Sombra, Foco)" defaultOpen={false}>
                        <div className="py-2 space-y-4">
                            <Slider label={t('spacing')} min={0} max={100} step={1} value={settings.spacing} onChange={e => handleChange('spacing', parseInt(e.target.value, 10))} />
                            <Slider label={t('cornerRadius')} min={0} max={100} step={1} value={settings.cornerRadius} onChange={e => handleChange('cornerRadius', parseInt(e.target.value, 10))} />
                            <Slider label={t('shadow')} min={0} max={100} step={1} value={settings.shadowBlur} onChange={e => handleChange('shadowBlur', parseInt(e.target.value, 10))} />
                            
                            {(settings.cardStyle === CardStyle.DeviceMockup || settings.cardStyle === CardStyle.Glass) && (
                                <Slider label="Intensidade do Vidro/Reflexo" min={0} max={1} step={0.01} value={settings.mockupReflection} onChange={e => handleChange('mockupReflection', parseFloat(e.target.value))} />
                            )}
                            
                            {settings.cardStyle === CardStyle.DeviceMockup && (
                                <div className="pt-2 space-y-4 border-t border-gray-700/50">
                                    <ColorInput label="Cor do Chassi" value={settings.mockupBezelColor} onChange={e => handleChange('mockupBezelColor', e.target.value)} />
                                </div>
                            )}

                            <div className="pt-2 space-y-4 border-t border-gray-800">
                                <h4 className="text-[9px] font-bold text-gray-500 uppercase">Foco e Desfoque (Profundidade)</h4>
                                <Slider label={t('blurIntensity')} min={0} max={20} step={0.5} value={settings.focalPointBlur} onChange={e => handleChange('focalPointBlur', parseFloat(e.target.value))} />
                                <Slider label={t('focusTransition')} hint={t('focusTransitionHint')} min={0} max={1} step={0.01} value={settings.focalPointFocusTransition} onChange={e => handleChange('focalPointFocusTransition', parseFloat(e.target.value))} />
                                <button onClick={onRandomFocus} className="w-full px-3 py-2.5 bg-gray-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-none border border-gray-600 hover:bg-gray-600 transition shadow-sm">{t('randomizeFocus')}</button>
                            </div>
                        </div>
                    </Accordion>

                    <Accordion title={t('stylePresets')}>
                        <div className="grid grid-cols-2 gap-3 py-2">
                            {PRESETS.map(preset => (
                                <button key={preset.id} onClick={() => applyPreset(preset.id)} className="group flex flex-col items-center space-y-2">
                                    <div className="w-full aspect-video rounded-none overflow-hidden border-2 border-gray-700 group-hover:border-indigo-500 transition-all shadow-lg">
                                        <PresetThumbnail presetId={preset.id} />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-wider">{t(preset.nameKey)}</span>
                                </button>
                            ))}
                        </div>
                    </Accordion>

                    <Accordion title="Filtros Globais">
                        <div className="py-2 space-y-4">
                            <Slider label="Brilho" min={0.5} max={1.5} step={0.01} value={settings.globalFilters.brightness} onChange={e => handleChange('globalFilters', { ...settings.globalFilters, brightness: parseFloat(e.target.value) })} />
                            <Slider label="Contraste" min={0.5} max={1.5} step={0.01} value={settings.globalFilters.contrast} onChange={e => handleChange('globalFilters', { ...settings.globalFilters, contrast: parseFloat(e.target.value) })} />
                            <Slider label="Saturação" min={0} max={2} step={0.01} value={settings.globalFilters.saturate} onChange={e => handleChange('globalFilters', { ...settings.globalFilters, saturate: parseFloat(e.target.value) })} />
                            <Slider label="Preto e Branco" min={0} max={1} step={0.01} value={settings.globalFilters.grayscale} onChange={e => handleChange('globalFilters', { ...settings.globalFilters, grayscale: parseFloat(e.target.value) })} />
                            <Slider label="Sépia" min={0} max={1} step={0.01} value={settings.globalFilters.sepia} onChange={e => handleChange('globalFilters', { ...settings.globalFilters, sepia: parseFloat(e.target.value) })} />
                        </div>
                    </Accordion>

                    <Accordion title="Textos & Legendas">
                        <div className="py-2 space-y-4">
                            <button 
                                onClick={onAddTextOverlay}
                                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-none transition flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Adicionar Texto
                            </button>

                            {settings.textOverlays.map(overlay => (
                                <div key={overlay.id} className="p-3 bg-gray-800 rounded-none border border-gray-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <input 
                                            type="text" 
                                            value={overlay.text} 
                                            onChange={e => onUpdateTextOverlay(overlay.id, { text: e.target.value })}
                                            className="bg-transparent text-white text-xs font-bold focus:outline-none w-full mr-2"
                                        />
                                        <button onClick={() => onRemoveTextOverlay(overlay.id)} className="text-gray-500 hover:text-red-400 transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 font-bold uppercase">Tamanho</label>
                                            <input type="number" value={overlay.fontSize} onChange={e => onUpdateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) })} className="w-full bg-gray-900 text-white text-[10px] p-1 rounded-none border border-gray-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 font-bold uppercase">Cor</label>
                                            <input type="color" value={overlay.color} onChange={e => onUpdateTextOverlay(overlay.id, { color: e.target.value })} className="w-full h-6 bg-gray-900 p-0.5 rounded-none border border-gray-700 cursor-pointer" />
                                        </div>
                                    </div>
                                    <Slider label="Posição X" min={0} max={1} step={0.01} value={overlay.x} onChange={e => onUpdateTextOverlay(overlay.id, { x: parseFloat(e.target.value) })} />
                                    <Slider label="Posição Y" min={0} max={1} step={0.01} value={overlay.y} onChange={e => onUpdateTextOverlay(overlay.id, { y: parseFloat(e.target.value) })} />
                                    <Slider label="Rotação" min={-180} max={180} step={1} value={overlay.rotation} onChange={e => onUpdateTextOverlay(overlay.id, { rotation: parseInt(e.target.value) })} />
                                </div>
                            ))}
                        </div>
                    </Accordion>
                </div>

                {/* --- GROUP 3: ENVIRONMENT & FINISH --- */}
                <div className="space-y-4">
                    <Accordion title={t('background')}>
                        <div className="py-2 space-y-6">
                            <Control label={t('style')}>
                                <div className="grid grid-cols-3 gap-2">
                                    {bgStyleOptions.map(opt => (
                                        <div key={opt.id} className="flex flex-col items-center">
                                            <BackgroundThumbnail styleId={opt.id as BackgroundStyle} current={settings.backgroundStyle} onClick={() => handleChange('backgroundStyle', opt.id)} />
                                            <p className={`text-[9px] mt-1.5 uppercase font-bold ${settings.backgroundStyle === opt.id ? 'text-white' : 'text-gray-500'}`}>{opt.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </Control>
                            
                            {settings.backgroundStyle === BackgroundStyle.Image && (
                                <Control label={t('bgStyleImage')}>
                                    <label className="w-full text-center cursor-pointer block px-3 py-2 bg-gray-700 text-white font-semibold text-sm rounded-none shadow-md hover:bg-gray-600 transition">
                                        {settings.backgroundImage ? t('changeBgImage') : t('uploadBgImage')}
                                        <input type="file" className="sr-only" onChange={onBgImageChange} accept="image/*" />
                                    </label>
                                </Control>
                            )}

                            {settings.backgroundStyle === BackgroundStyle.Solid ? (
                                <>
                                    <ColorInput label={t('bgColor')} value={settings.bgColor} onChange={e => handleChange('bgColor', e.target.value)} />
                                    <Control label={t('predefinedColors')}>
                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="text-[9px] font-bold text-gray-500 uppercase mb-2">{t('lightColors')}</h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {PREDEFINED_LIGHT_COLORS.map(color => (
                                                        <button key={color.hex} title={color.name} onClick={() => handleChange('bgColor', color.hex)} className={`w-6 h-6 rounded-none border-2 transition-transform hover:scale-110 ${settings.bgColor.toLowerCase() === color.hex.toLowerCase() ? 'border-white' : 'border-gray-700'}`} style={{ backgroundColor: color.hex }} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-[9px] font-bold text-gray-500 uppercase mb-2">{t('darkColors')}</h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {PREDEFINED_DARK_COLORS.map(color => (
                                                        <button key={color.hex} title={color.name} onClick={() => handleChange('bgColor', color.hex)} className={`w-6 h-6 rounded-none border-2 transition-transform hover:scale-110 ${settings.bgColor.toLowerCase() === color.hex.toLowerCase() ? 'border-white' : 'border-gray-700'}`} style={{ backgroundColor: color.hex }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Control>
                                </>
                            ) : (
                                settings.backgroundStyle !== BackgroundStyle.Image && <Select label={t('bgPalette')} value={settings.bgPalette} onChange={e => handleChange('bgPalette', e.target.value)} options={paletteOptions} />
                            )}
                            
                            {colorPalette.length > 0 && settings.backgroundStyle === BackgroundStyle.Solid && (
                                <Control label={t('suggestedPalette')} hint={t('paletteHint')}>
                                    <div className="flex flex-wrap gap-1.5">
                                        {colorPalette.map(color => (
                                            <button key={color} onClick={() => handleChange('bgColor', color)} className="w-6 h-6 rounded-none border-2 border-gray-700 transition-transform hover:scale-110" style={{backgroundColor: color}} />
                                        ))}
                                    </div>
                                </Control>
                            )}

                            <div className="pt-2 border-t border-gray-800 space-y-4">
                                <Checkbox label="Efeito Degradê na Imagem" checked={settings.vignette > 0} onChange={e => handleChange('vignette', e.target.checked ? 0.2 : 0)} />
                                {settings.vignette > 0 && (
                                    <Slider label={t('vignette')} min={0} max={1} step={0.01} value={settings.vignette} onChange={e => handleChange('vignette', parseFloat(e.target.value))} />
                                )}
                            </div>
                        </div>
                    </Accordion>

                    <Accordion title={t('organicVariationControls')}>
                        <div className="py-2 space-y-4">
                            <p className="text-[10px] text-gray-500 font-medium leading-tight mb-2">
                                Adicione um toque humano e menos rígido à sua colagem.
                            </p>
                            {showOrganicControls && (
                                <Slider label={t('chaosVariation')} hint={t('chaosVariationHint')} min={0} max={1} step={0.01} value={settings.organicVariation} onChange={e => handleChange('organicVariation', parseFloat(e.target.value))} />
                            )}
                            {showGlobalRotation && (
                                <Slider label={t('globalRotation')} hint={t('globalRotationHint')} min={-180} max={180} step={1} value={settings.globalRotation} onChange={e => handleChange('globalRotation', parseInt(e.target.value, 10))} />
                            )}
                            <div className="pt-2">
                                <button 
                                    onClick={() => {
                                        handleChange('organicVariation', 0);
                                        handleChange('globalRotation', 0);
                                    }}
                                    className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold uppercase tracking-widest rounded-none border border-gray-700 transition text-center"
                                >
                                    Restaurar Padrões
                                </button>
                            </div>
                        </div>
                    </Accordion>
                </div>
            </div>
        </aside>
    );
};

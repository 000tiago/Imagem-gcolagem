
import { Settings, LayoutType, GridStyle, VoronoiDistribution, TieredShape, BackgroundStyle, CardStyle, CircularPattern, SpiralType } from './types';
import type { TranslationKey } from './App';

export const getLayoutOptions = (t) => [
  // 3D & Dynamic
  { id: LayoutType.Orbital, name: t('layoutOrbital') },
  { id: LayoutType.Wall3D, name: t('layoutWall3D') },
  { id: LayoutType.Kaleidoscope, name: t('layoutKaleidoscope') },
  // Organic & Artistic
  { id: LayoutType.GoldenSpiral, name: t('layoutGoldenSpiral') },
  { id: LayoutType.Voronoi, name: t('layoutVoronoi') },
  { id: LayoutType.Journal, name: t('layoutJournal') },
  { id: LayoutType.Pile, name: t('layoutPile') },
  // Shape-Based
  { id: LayoutType.TieredShape, name: t('layoutTieredShape') },
  { id: LayoutType.CustomShape, name: t('layoutCustomShape') },
  { id: LayoutType.Circular, name: t('layoutCircular') },
  // Grids & Tiles
  { id: LayoutType.Grid, name: t('layoutGrid') },
  { id: LayoutType.Tiled, name: t('layoutTiled') },
  { id: LayoutType.Fractal, name: t('layoutFractal') },
  { id: LayoutType.Mosaic, name: t('layoutMosaic') },
];

export const getImageFitOptions = (t) => [
    { id: 'cover', name: t('fitCover')},
    { id: 'contain', name: t('fitContain')},
];

export const COLOR_PALETTES: { [key: string]: { nameKey: TranslationKey; colors: string[] } } = {
  wedding: { nameKey: 'paletteWedding', colors: ['#F7F3F0', '#EADED2', '#CDBBA7', '#F4E3E3', '#D3DCD4'] },
  boho: { nameKey: 'paletteBoho', colors: ['#EADFD5', '#DDAF94', '#A8826B', '#8E8268', '#C4AE9D'] },
  pastel: { nameKey: 'palettePastel', colors: ['#FDEBFF', '#E3F8FF', '#FFF5E0', '#DFFDE2', '#F0EFFF'] },
  vintage: { nameKey: 'paletteVintage', colors: ['#F3F0E9', '#EBE2D4', '#D4C8B4', '#A89984', '#6F6659'] }
};

export const PREDEFINED_LIGHT_COLORS = [
  { name: 'Off White', hex: '#F5F5DC' },
  { name: 'Light Sage Green', hex: '#D8E3D7' },
  { name: 'Dove Gray', hex: '#D5D5D5' },
  { name: 'Buttercream', hex: '#F6E7C1' },
  { name: 'Pale Slate Blue', hex: '#CBD3DC' },
  { name: 'Washed Lavender', hex: '#E6E6FA' },
  { name: 'Sandstone', hex: '#F4EBD0' },
];

export const PREDEFINED_DARK_COLORS = [
  { name: 'Burnt Terracotta', hex: '#A0522D' },
  { name: 'Deep Navy Blue', hex: '#1B2A41' },
  { name: 'Dark Olive Green', hex: '#556B2F' },
  { name: 'Aged Bronze', hex: '#8B5E3C' },
  { name: 'Bordeaux', hex: '#581845' },
  { name: 'Petrol Blue', hex: '#355E6B' },
  { name: 'Cocoa Brown', hex: '#5A3E36' },
];

export const STYLE_PRESETS: { id: string; nameKey: TranslationKey; settings: Partial<Settings> }[] = [
  {
    id: 'modern',
    nameKey: 'presetModern',
    settings: {
      spacing: 4,
      padding: 4,
      cornerRadius: 0,
      shadowBlur: 30,
      vignette: 0.1,
      backgroundStyle: BackgroundStyle.Solid,
      bgColor: '#1a1a1a',
      imageBorder: false,
      cardStyle: CardStyle.Default,
      globalRotation: 0,
      organicVariation: 0,
    },
  },
  {
    id: 'vintage',
    nameKey: 'presetVintage',
    settings: {
      spacing: 6,
      padding: 12,
      cornerRadius: 4,
      shadowBlur: 15,
      vignette: 0.5,
      backgroundStyle: BackgroundStyle.PaperTexture,
      bgPalette: 'vintage',
      imageBorder: true,
      borderColor: '#F3F0E9',
      borderWidth: 12,
      cardStyle: CardStyle.Default,
      globalRotation: -2,
      organicVariation: 0.1,
    },
  },
  {
    id: 'pastel',
    nameKey: 'presetPastel',
    settings: {
      spacing: 15,
      padding: 15,
      cornerRadius: 25,
      shadowBlur: 0,
      vignette: 0,
      backgroundStyle: BackgroundStyle.GrainyPastel,
      bgPalette: 'pastel',
      imageBorder: false,
      cardStyle: CardStyle.Default,
      globalRotation: 0,
      organicVariation: 0,
    },
  },
  {
    id: 'dramatic',
    nameKey: 'presetDramatic',
    settings: {
      spacing: 4,
      padding: 8,
      cornerRadius: 8,
      shadowBlur: 60,
      vignette: 0.9,
      backgroundStyle: BackgroundStyle.AuroraLights,
      bgPalette: 'boho',
      imageBorder: false,
      cardStyle: CardStyle.Glass,
      globalRotation: 0,
      organicVariation: 0.05,
    },
  },
];


export const DEFAULT_SETTINGS: Settings = {
  layout: LayoutType.Orbital,
  rows: 15,
  cols: 12,
  spacing: 8,
  bgColor: '#F5F5DC', // Default to Off-White
  backgroundStyle: BackgroundStyle.Solid, // Default to Solid Color
  backgroundImage: null,
  bgPalette: 'wedding',
  seed: 0.5,
  imageMultiplier: 1,
  shadowBlur: 25, 
  cornerRadius: 12, 
  imageFit: 'cover',
  vignette: 0.2, // Softer default vignette
  exportFormat: 'jpeg',
  exportQuality: 0.92,
  aspectRatio: '4/3',
  autoGrid: true,
  gridStyle: GridStyle.Uniform,
  pileOrganization: 0.2, 
  pileCardSize: 0.4, 
  pileCardSizeVariation: 0.5, 
  tileVariation: 0.9,
  mosaicShapeVariation: 0,
  padding: 8,
  imageBorder: false,
  borderColor: '#FFFFFF',
  borderWidth: 10,
  cardStyle: CardStyle.Default,
  focalPoint: false,
  focalPointBlur: 5,
  focalPointFocusTransition: 0,
  shapeMaskImage: null,
  shapeMaskThreshold: 0.5,
  shapeMaskInvert: false,
  voronoiPointJitter: 0.9, 
  voronoiDistribution: VoronoiDistribution.Random,
  voronoiOrganicDistance: 0.1,
  voronoiCentralBias: 2.5,
  voronoiFrameFocus: 1.0,
  shapeBurstDensity: 25, 
  shapeBurstForeground: true,
  shapeBurstForegroundCount: 25,
  shapeBurstForegroundSizeMultiplier: 3.5,
  shapeBurstOrganicLayer: true,
  shapeBurstOrganicLayerCount: 15,
  shapeBurstOrganicLayerSizeMultiplier: 2.0,
  tieredShape: TieredShape.Heart,
  tieredTiers: 12, 
  tieredSizeVariation: 0.85, 
  kaleidoscopeSectors: 8,
  goldenSpiralOffset: 0.1,
  spiralDensity: 4.0, 
  goldenSpiralScale: 0.70,
  spiralType: SpiralType.Golden,
  spiralTightness: 1.0,
  journalOverlap: 0.2,
  journalRowVariation: 0.3, 
  organicVariation: 0.2,
  globalRotation: 0,
  perspectiveAngle: 0,
  perspectiveTilt: 0,
  perspectiveZoom: 1,
  circularRings: 4,
  circularPattern: CircularPattern.Default,
  orbitalRadius: 400,
  orbitalFocus: 800,
  orbitalTilt: 0,
  orbitalScale: 1.0,
  orbitalLightAngle: 45,
  orbitalLightIntensity: 0.5,
  orbitalDoF: 4,
  addPngBackground: true,
  bgSeed: 0.1,
};

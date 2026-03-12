
export enum LayoutType {
  Grid = 'Grid',
  Mosaic = 'Mosaic',
  Pile = 'Pile',
  Wall3D = 'Wall3D',
  Tiled = 'Tiled',
  Fractal = 'Fractal',
  Voronoi = 'Voronoi',
  CustomShape = 'CustomShape',
  TieredShape = 'TieredShape',
  Kaleidoscope = 'Kaleidoscope',
  GoldenSpiral = 'GoldenSpiral',
  Journal = 'Journal',
  Circular = 'Circular',
  Orbital = 'Orbital',
}

export enum BackgroundStyle {
  Solid = 'Solid',
  MeshGradient = 'MeshGradient',
  GrainyPastel = 'GrainyPastel',
  AuroraLights = 'AuroraLights',
  ConicBurst = 'ConicBurst',
  PaperTexture = 'PaperTexture',
  Image = 'Image',
}

export enum GridStyle {
  Uniform = 'Uniform',
  Masonry = 'Masonry',
  Overlapped = 'Overlapped',
}

export enum VoronoiDistribution {
    Random = 'Random', // Jittered Grid
    Organic = 'Organic',
    Centered = 'Centered',
    Sunflower = 'Sunflower', // New
    Frame = 'Frame', // New
}

export enum TieredShape {
    Heart = 'Heart',
    Circle = 'Circle',
    Square = 'Square',
}

export enum CardStyle {
    Default = 'Default',
    Glass = 'Glass',
}

export enum CircularPattern {
    Default = 'Default',
    SpiderWeb = 'SpiderWeb',
}

export enum SpiralType {
  Golden = 'Golden',
  Archimedean = 'Archimedean',
  Fermat = 'Fermat',
  Hyperbolic = 'Hyperbolic',
}

export type ImageFit = 'contain' | 'cover';
export type ExportFormat = 'png' | 'jpeg' | 'webp';

export interface Settings {
  layout: LayoutType;
  rows: number;
  cols: number;
  spacing: number;
  bgColor: string;
  backgroundStyle: BackgroundStyle;
  backgroundImage: string | null;
  bgPalette: string;
  seed: number;
  imageMultiplier: number;
  shadowBlur: number;
  cornerRadius: number;
  // New settings
  imageFit: ImageFit;
  vignette: number; // 0 to 1
  exportFormat: ExportFormat;
  exportQuality: number; // 0.1 to 1 for JPEG
  aspectRatio: string;
  // Grid specific
  autoGrid: boolean;
  gridStyle: GridStyle;
  // Pile specific
  pileOrganization: number; // 0 (chaotic) to 1 (grid)
  pileCardSize: number; // 0.1 to 1
  pileCardSizeVariation: number; // 0 to 1
  // Tiled/Fractal
  tileVariation: number; // 0-1
  // Mosaic Rows
  mosaicShapeVariation: number; // 0-1
  // Image Border
  padding: number;
  imageBorder: boolean;
  borderColor: string;
  borderWidth: number;
  cardStyle: CardStyle;
  // Focal Point
  focalPoint: boolean;
  focalPointBlur: number; // in pixels
  focalPointFocusTransition: number; // 0 (sharp focus) to 1 (no difference)
  // Shape Mask
  shapeMaskImage: string | null; // Data URL of the mask
  shapeMaskThreshold: number; // 0-1
  shapeMaskInvert: boolean;
  // Voronoi
  voronoiPointJitter: number; // 0-1 (For Jittered Grid & Sunflower)
  voronoiDistribution: VoronoiDistribution;
  voronoiOrganicDistance: number; // 0.01 - 0.2 (For Organic - Poisson Disk)
  voronoiCentralBias: number; // 1 - 5 (For Centered Burst)
  voronoiFrameFocus: number; // 1 - 5 (For Frame)
  // Custom Shape (formerly Shape Burst)
  shapeBurstDensity: number; // 10-50
  shapeBurstForeground: boolean;
  shapeBurstForegroundCount: number; // 5-50
  shapeBurstForegroundSizeMultiplier: number; // 1 - 5
  shapeBurstOrganicLayer: boolean;
  shapeBurstOrganicLayerCount: number;
  shapeBurstOrganicLayerSizeMultiplier: number;
  // Tiered Shape (formerly Pixelated)
  tieredShape: TieredShape;
  tieredTiers: number; // 5-20
  tieredSizeVariation: number; // 0-1
  // Kaleidoscope
  kaleidoscopeSectors: number; // 4-24
  // Golden Spiral
  goldenSpiralOffset: number; // 0-1
  spiralDensity: number; // 1-10
  goldenSpiralScale: number; // 0.1 - 2
  spiralType: SpiralType;
  spiralTightness: number; // 0.1 - 5
  // Journal
  journalOverlap: number; // 0-1
  journalRowVariation: number; // 0-1
  // Organic Variation
  organicVariation: number; // 0-1
  globalRotation: number; // -180 to 180
  // 3D Wall (replaces Perspective)
  perspectiveAngle: number; // -45 to 45
  perspectiveTilt: number; // -45 to 45
  perspectiveZoom: number; // 0.5 to 2.5
  // Circular
  circularRings: number; // 1-10
  circularPattern: CircularPattern;
  // Orbital (replaces Showcase)
  orbitalRadius: number; // 100 - 1000
  orbitalFocus: number; // 100 - 2000
  orbitalTilt: number; // -45 to 45
  orbitalScale: number; // 0.5 - 2
  orbitalLightAngle: number; // 0 - 360
  orbitalLightIntensity: number; // 0 - 1
  orbitalDoF: number; // 0 - 20 (Depth of Field blur pixels)
  // PNG Backgrounds
  addPngBackground: boolean;
  bgSeed: number;
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
}

export interface ImageRenderData {
  image: HTMLImageElement;
  id: string;
  // Destination rect
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // Source rect for cropping
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
  // Clipping path
  clip?: (ctx: CanvasRenderingContext2D) => void;
  // For highlight layout
  isHighlighted?: boolean;
  // For 3D sorting
  z?: number;
  // For custom corner radius per item
  cornerRadius?: number;
  // For 3D showcase shadows
  shadowPath?: Path2D;
  // For Orbital lighting and DoF
  brightness?: number; // 0 (dark) to 1 (bright)
  blur?: number; // in pixels
}


// For video animation
export interface Keyframe {
  timestamp: number;
  settings: Settings;
}

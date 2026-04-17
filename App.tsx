
// --- MENSAGEM IMPORTANTE PARA DESENVOLVEDORES ---
// O comportamento do canvas com proporção de tela fixa (aspect ratio) é uma
// característica FUNDAMENTAL e INTENCIONAL deste aplicativo. O usuário precisa
// visualizar a colagem exatamente como ela será exportada (ex: 16:9, 1:1, etc.).
//
// NÃO altere este comportamento para um canvas responsivo que preenche todo o
// contâiner. A previsibilidade do resultado final é a maior prioridade.
// A lógica para manter a proporção está implementada no componente CanvasArea.tsx
// e deve ser mantida.

import React, { useState, useCallback, useMemo, useEffect, createContext, useContext, useRef } from 'react';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { BottomBar } from './components/BottomBar';
import { CanvasArea, CanvasAreaHandle } from './components/CanvasArea';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import type { Settings, ImageFile, Keyframe } from './types';
import { LayoutType, CardStyle, BackgroundStyle } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateEmojiImages } from './utils/emojiUtils';
import { convertToWebP, extractPaletteFromImages } from './utils/imageUtils';
import { exportVideo } from './utils/videoUtils';


// --- INTERNATIONALIZATION (i18n) SETUP ---
const translations = {
  en: {
    // Header
    headerTitle: 'Image Collage Creator',
    noSvg: 'NO SVG',
    noAi: 'NO AI',
    exportImage: 'Export Image',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    canvasSettings: 'Canvas Settings',
    // Welcome Screen
    welcomeTitle: 'Create Your Collage',
    welcomeSubtitle: 'No AI. No SVG. Just high-performance canvas rendering. Start by uploading images or try our demo set.',
    selectImages: 'Select Images',
    loading: 'Loading...',
    tryDemo: 'Try with Demo Images',
    // Sidebar
    addMoreImages: 'Add More Images',
    addImages: 'Add Images',
    clearAll: 'Clear All',
    imageOrderTitle: 'Image Order',
    imageOrderHint: 'Drag to re-order. Affects all layouts.',
    shuffleImages: 'Shuffle Images',
    imageDensity: 'Image Density / Repetition',
    imageDensityHint: 'Controls how many times the image set is repeated to fill the layout.',
    organicVariationControls: 'Organic Touch',
    chaosVariation: 'Chaos / Variation',
    chaosVariationHint: 'Adds random position and rotation offsets to structured layouts for a more organic feel.',
    globalRotation: 'Global Rotation',
    globalRotationHint: 'Applies a consistent rotation angle to all images in the collage.',
    // Sidebar Tabs
    tabLayout: 'Layout',
    tabStyle: 'Style',
    // Layout Names
    layoutTieredShape: 'Tiered Shape',
    layoutCustomShape: 'Custom Shape',
    layoutKaleidoscope: 'Kaleidoscope',
    layoutGrid: 'Grid',
    layoutTiled: 'Tiled Mosaic',
    layoutFractal: 'Fractal Mosaic',
    layoutVoronoi: 'Voronoi Mosaic',
    layoutMosaic: 'Mosaic Rows',
    layoutPile: 'Image Pile',
    layoutWall3D: '3D Wall',
    layoutGoldenSpiral: 'Golden Spiral',
    layoutJournal: 'Journal',
    layoutCircular: 'Circular',
    layoutOrbital: '3D Orbital',
    layoutShowcase: 'Hero Showcase',
    layoutMockupWall: 'Mockup Wall (Grid)',
    layoutIsometricGrid: 'Isometric Grid',
    layoutStaggeredRows: 'Staggered Rows',
    layoutFloatingCloud: 'Floating Cloud',
    layoutPerspectiveGrid: 'Perspective Wall',
    layoutCoverFlow: 'Cover Flow',
    layoutCarousel: 'Linear Carousel',
    layoutFloating: '3D Floating',
    // Aspect Ratios
    aspect16_9: 'Wallpaper (16:9)',
    aspect1_1: 'Square (1:1)',
    aspect4_3: 'Classic (4:3)',
    aspect9_16: 'Story (9:16)',
    // Image Fit
    fitCover: 'Cover (Fill & Crop)',
    fitContain: 'Contain (Fit Inside)',
    // Controls
    deviceType: 'Device Shape',
    deviceTypeAuto: 'Auto (Smart)',
    deviceTypeOriginal: 'Original Photo (No Crop)',
    deviceTypePhone: 'Phone (9:19.5)',
    deviceTypeLaptop: 'Laptop (16:10)',
    mockupSpacing: 'Mockup Spacing',
    mockupAngle: 'Mockup Angle',
    layout: 'Layout',
    accordionLayoutControls: 'Layout Controls',
    gridControls: 'Grid Controls',
    gridStyle: 'Grid Style',
    gridStyleUniform: 'Uniform',
    gridStyleMasonry: 'Masonry',
    gridStyleOverlapped: 'Overlapped',
    autoFitGrid: 'Auto-fit Grid',
    imageFit: 'Image Fit',
    rows: 'Rows',
    columns: 'Columns',
    kaleidoscopeControls: 'Kaleidoscope Controls',
    sectors: 'Sectors',
    intelligentVariation: 'Intelligent Variation',
    tieredShapeControls: 'Tiered Shape Controls',
    shape: 'Shape',
    shapeHeart: 'Heart',
    shapeCircle: 'Circle',
    shapeSquare: 'Square',
    tiers: 'Tiers',
    sizeVariation: 'Size Variation',
    mosaicControls: 'Mosaic Controls',
    complexityDensity: 'Complexity / Density',
    tileVariation: 'Tile Variation',
    mosaicShapeVariation: 'Shape Variation',
    pileControls: 'Pile Controls',
    organization: 'Organization',
    orgChaotic: 'Chaotic',
    orgOrganic: 'Organic',
    orgGrid: 'Grid',
    cardSize: 'Card Size',
    voronoiControls: 'Voronoi Mosaic Controls',
    pointDistribution: 'Point Distribution',
    distJittered: 'Jittered Grid',
    distOrganic: 'Organic (Poisson)',
    distCentered: 'Centered Burst',
    distSunflower: 'Sunflower / Phyllotaxis',
    distFrame: 'Frame',
    voronoiJitterIntensity: 'Jitter Intensity',
    voronoiMinDistance: 'Minimum Distance',
    voronoiCentralBias: 'Central Bias',
    voronoiFrameThickness: 'Frame Thickness',
    customShapeControls: 'Custom Shape Controls',
    bgGridDensity: 'Background Grid Density',
    enableOrganicLayer: 'Enable Organic Layer',
    organicLayerCount: 'Organic Layer Count',
    organicLayerSize: 'Organic Layer Size',
    enableForegroundPile: 'Enable Foreground Pile',
    foregroundCount: 'Foreground Count',
    foregroundSize: 'Foreground Size',
    customShapeOptional: 'Custom Shape (Upload Required)',
    changeCustomShape: 'Change Custom Shape',
    uploadCustomShape: 'Upload Custom Shape',
    customShapeHint: 'Upload a black & white image. The collage will fill the dark areas.',
    threshold: 'Threshold',
    invertMask: 'Invert Mask',
    goldenSpiralControls: 'Golden Spiral Controls',
    startPoint: 'Start Point',
    spiralDensity: 'Density / Angular Separation',
    spiralDensityHint: 'Controls how far apart images are placed along the spiral curve.',
    goldenSpiralScale: 'Scale',
    spiralType: 'Spiral Type',
    spiralTypeGolden: 'Golden (Classic)',
    spiralTypeArchimedean: 'Archimedean (Mandala)',
    spiralTypeFermat: 'Fermat (Dense)',
    spiralTypeHyperbolic: 'Hyperbolic (Inward)',
    spiralTightness: 'Coil Tightness',
    spiralTightnessHint: 'Determines how quickly the spiral expands. Lower is tighter, higher is wider.',
    journalControls: 'Journal Controls',
    journalControlsHint: 'A dense, scrapbook-style layout. Works best with landscape images, but supports all types.',
    overlap: 'Overlap',
    rowVariation: 'Row Variation',
    wall3DControls: '3D Wall Controls',
    perspectiveAngle: 'Angle',
    perspectiveTilt: 'Tilt',
    perspectiveZoom: 'Zoom',
    circularControls: 'Circular Controls',
    rings: 'Rings',
    circularPattern: 'Pattern',
    patternDefault: 'Standard',
    patternSpiderWeb: 'Spider Web',
    orbitalControls: 'Orbital Sphere Controls',
    orbitalRadius: 'Radius',
    orbitalFocus: 'Perspective',
    orbitalTilt: 'Vertical Tilt',
    orbitalScale: 'Scale',
    orbitalLightAngle: 'Light Angle',
    orbitalLightIntensity: 'Light Intensity',
    orbitalDoF: 'Depth of Focus',
    stylePresets: 'Style Presets',
    presetModern: 'Modern Clean',
    presetVintage: 'Soft Vintage',
    presetPastel: 'Pastel Dream',
    presetDramatic: 'Dramatic',
    visualEffects: 'Styling Details',
    spacing: 'Spacing',
    cornerRadius: 'Round Corners',
    shadow: 'Shadow Intensity',
    vignette: 'Vignette Intensity',
    enableFocalPoint: 'Focal Point',
    blurIntensity: 'Blur Intensity (Unfocused)',
    focusTransition: 'Focus Transition',
    focusTransitionHint: 'Controls the softness of focused images. 0 is sharp, 1 is fully blurred.',
    randomizeFocus: 'Randomize Focus',
    imageBorder: 'Image Style',
    cardStyle: 'Card Style',
    cardStyleDefault: 'Solid / Pastel',
    cardStyleGlass: 'Glassmorphism',
    cardStyleDeviceMockup: 'Device Mockup',
    enableBorder: 'Enable Border',
    borderColor: 'Border Color',
    borderWidth: 'Border Width',
    internalPadding: 'Internal Padding',
    internalPaddingHint: 'Space between the image and the edge of its frame.',
    borderlessMode: 'Borderless Mode (Image Only)',
    borderlessModeHint: 'Removes all borders and padding, showing only the raw images.',
    proportionalFit: 'Proportional Fit',
    proportionalFitHint: 'Adjusts images of varying dimensions to fit proportionally without cropping.',
    background: 'Background',
    suggestedPalette: 'Suggested Palette',
    paletteHint: 'Click a color to set it as your solid background.',
    style: 'Style',
    bgStyleSolid: 'Solid Color',
    bgStyleMeshGradient: 'Mesh Gradient',
    bgStyleAuroraGlow: 'Aurora Glow',
    bgStyleGrainy: 'Grainy',
    bgStyleConicBurst: 'Conic Burst',
    bgStylePaper: 'Paper Texture',
    bgStyleImage: 'Image',
    uploadBgImage: 'Upload Background Image',
    changeBgImage: 'Change Background Image',
    bgColor: 'Background Color',
    bgPalette: 'Color Palette',
    paletteWedding: 'Wedding',
    paletteBoho: 'Boho Chic',
    paletteVintage: 'Vintage Journal',
    palettePastel: 'Pastel Tones',
    predefinedColors: 'Predefined Colors',
    lightColors: 'Light Colors',
    darkColors: 'Dark Colors',
    export: 'Export Settings',
    aspectRatio: 'Aspect Ratio',
    format: 'Format',
    quality: 'Quality',
    // Canvas Area
    processing: 'Processing Images...',
    exportingVideo: 'Exporting Video...',
    hintFocus: 'Click images to toggle focus. Unfocused images will be blurred.',
    dropImagesHere: 'Drop images here',
    addPhotosToCollage: 'Add photos to your collage',
    // Section Descriptions
    mockupSectionTitle: 'Professional Mockups',
    mockupSectionDesc: 'Perfect for portfolios. Your photos inside phones and laptops.',
    creativeSectionTitle: 'Creative Layouts',
    creativeSectionDesc: 'Artistic and organic shapes for a unique look.',
    classicSectionTitle: 'Classic Layouts',
    classicSectionDesc: 'Traditional grids and mosaics, clean and organized.',
    // Unified Sidebar Sections
    sectionComposition: 'Composition & Structure',
    sectionImageStyle: 'Image Visual & Style',
    sectionEnvironment: 'Environment & Finish',
    sectionPhotoManagement: 'Photo Management',
  },
  pt: {
    // Header
    headerTitle: 'Criador de Colagens',
    noSvg: 'SEM SVG',
    noAi: 'SEM IA',
    exportImage: 'Exportar Imagem',
    startRecording: 'Iniciar Gravação',
    stopRecording: 'Parar Gravação',
    canvasSettings: 'Ajustes da Tela',
    // Welcome Screen
    welcomeTitle: 'Crie Sua Colagem',
    welcomeSubtitle: 'Sem IA, sem SVG. Apenas performance. Comece enviando suas imagens ou use o conjunto de demonstração.',
    selectImages: 'Selecionar Imagens',
    loading: 'Carregando...',
    tryDemo: 'Usar Imagens Demo',
    // Sidebar
    addMoreImages: 'Adicionar Mais Imagens',
    addImages: 'Adicionar Imagens',
    clearAll: 'Limpar Tudo',
    imageOrderTitle: 'Ordem das Imagens',
    imageOrderHint: 'Arraste para reordenar. A ordem afeta a disposição em todos os layouts.',
    shuffleImages: 'Embaralhar Imagens',
    imageDensity: 'Densidade / Repetição',
    imageDensityHint: 'Controla quantas vezes o conjunto de imagens se repete para preencher o layout.',
    organicVariationControls: 'Toque Orgânico',
    chaosVariation: 'Variação Orgânica',
    chaosVariationHint: 'Adiciona leves desvios de posição e rotação para um resultado menos rígido.',
    globalRotation: 'Rotação Global',
    globalRotationHint: 'Aplica um ângulo de rotação consistente a todas as imagens da colagem.',
    // Sidebar Tabs
    tabLayout: 'Layout',
    tabStyle: 'Estilo',
    // Layout Names
    layoutTieredShape: 'Forma em Camadas',
    layoutCustomShape: 'Forma Customizada',
    layoutKaleidoscope: 'Caleidoscópio',
    layoutGrid: 'Grade',
    layoutTiled: 'Mosaico',
    layoutFractal: 'Mosaico Fractal',
    layoutVoronoi: 'Mosaico Voronoi',
    layoutMosaic: 'Mosaico em Linhas',
    layoutPile: 'Pilha de Fotos',
    layoutWall3D: 'Mural 3D',
    layoutGoldenSpiral: 'Espiral Dourada',
    layoutJournal: 'Estilo Diário',
    layoutCircular: 'Circular',
    layoutOrbital: 'Esfera Orbital 3D',
    layoutShowcase: 'Destaque (Hero)',
    layoutMockupWall: 'Parede de Mockups (Grade)',
    layoutIsometricGrid: 'Grade Isométrica',
    layoutStaggeredRows: 'Linhas Intercaladas',
    layoutFloatingCloud: 'Nuvem Flutuante',
    layoutPerspectiveGrid: 'Parede em Perspectiva',
    layoutCoverFlow: 'Carrossel (Cover Flow)',
    layoutCarousel: 'Carrossel Linear',
    layoutFloating: 'Flutuante 3D',
    // Aspect Ratios
    aspect16_9: 'Wallpaper (16:9)',
    aspect1_1: 'Quadrado (1:1)',
    aspect4_3: 'Clássico (4:3)',
    aspect9_16: 'Story (9:16)',
    // Image Fit
    fitCover: 'Preencher (Cortar)',
    fitContain: 'Conter (Ajustar)',
    // Controls
    deviceType: 'Formato do Aparelho',
    deviceTypeAuto: 'Automático (Inteligente)',
    deviceTypeOriginal: 'Foto Original (Sem Corte)',
    deviceTypePhone: 'Celular (9:19.5)',
    deviceTypeLaptop: 'Notebook (16:10)',
    mockupSpacing: 'Espaçamento / Abertura',
    mockupAngle: 'Ângulo / Rotação',
    layout: 'Estilo de Layout',
    accordionLayoutControls: 'Controles do Layout',
    gridControls: 'Ajustes da Grade',
    gridStyle: 'Estilo da Grade',
    gridStyleUniform: 'Uniforme',
    gridStyleMasonry: 'Alvenaria (Masonry)',
    gridStyleOverlapped: 'Sobreposto',
    autoFitGrid: 'Ajuste Automático',
    imageFit: 'Encaixe da Imagem',
    rows: 'Linhas',
    columns: 'Colunas',
    kaleidoscopeControls: 'Ajustes do Caleidoscópio',
    sectors: 'Setores',
    intelligentVariation: 'Variação Inteligente',
    tieredShapeControls: 'Ajustes da Forma em Camadas',
    shape: 'Forma',
    shapeHeart: 'Coração',
    shapeCircle: 'Círculo',
    shapeSquare: 'Quadrado',
    tiers: 'Camadas',
    sizeVariation: 'Variação de Tamanho',
    mosaicControls: 'Ajustes do Mosaico',
    complexityDensity: 'Complexidade / Densidade',
    tileVariation: 'Variação dos Ladrilhos',
    mosaicShapeVariation: 'Variação da Forma',
    pileControls: 'Ajustes da Pilha de Fotos',
    organization: 'Organização',
    orgChaotic: 'Caótica',
    orgOrganic: 'Orgânica',
    orgGrid: 'Alinhada',
    cardSize: 'Tamanho das Fotos',
    voronoiControls: 'Ajustes do Mosaico Voronoi',
    pointDistribution: 'Distribuição',
    distJittered: 'Grade com Ruído',
    distOrganic: 'Orgânica (Poisson)',
    distCentered: 'Explosão Central',
    distSunflower: 'Girassol',
    distFrame: 'Moldura',
    voronoiJitterIntensity: 'Intensidade do Ruído',
    voronoiMinDistance: 'Distância Mínima',
    voronoiCentralBias: 'Foco no Centro',
    voronoiFrameThickness: 'Espessura da Moldura',
    customShapeControls: 'Ajustes de Forma Customizada',
    bgGridDensity: 'Densidade da Grade',
    enableOrganicLayer: 'Ativar Camada Orgânica',
    organicLayerCount: 'Qtd. Camada Orgânica',
    organicLayerSize: 'Tamanho Camada Orgânica',
    enableForegroundPile: 'Ativar Pilha Frontal',
    foregroundCount: 'Qtd. Pilha Frontal',
    foregroundSize: 'Tamanho Pilha Frontal',
    customShapeOptional: 'Forma Customizada (Requer Upload)',
    changeCustomShape: 'Trocar Imagem da Forma',
    uploadCustomShape: 'Carregar Imagem da Forma',
    customShapeHint: 'Envie uma imagem em preto e branco. A colagem preencherá as áreas escuras.',
    threshold: 'Limiar de Detecção',
    invertMask: 'Inverter Máscara',
    goldenSpiralControls: 'Ajustes da Espiral Dourada',
    startPoint: 'Ponto Inicial',
    spiralDensity: 'Densidade / Separação Angular',
    spiralDensityHint: 'Controla a distância entre as imagens ao longo da curva da espiral.',
    goldenSpiralScale: 'Escala',
    spiralType: 'Tipo de Espiral',
    spiralTypeGolden: 'Dourada (Clássica)',
    spiralTypeArchimedes: 'Arquimedes (Mandala)',
    spiralTypeFermat: 'Fermat (Densa)',
    spiralTypeHyperbolic: 'Hiperbólica (Invertida)',
    spiralTightness: 'Aperto da Espiral',
    spiralTightnessHint: 'Determina a velocidade de expansão da espiral. Menos = mais justa, mais = mais aberta.',
    journalControls: 'Ajustes do Estilo Diário',
    journalControlsHint: 'Layout denso, ideal para fotos de paisagem, mas funciona com todos os tipos.',
    overlap: 'Sobreposição',
    rowVariation: 'Variação de Linha',
    wall3DControls: 'Ajustes do Mural 3D',
    perspectiveAngle: 'Ângulo',
    perspectiveTilt: 'Inclinação',
    perspectiveZoom: 'Zoom',
    circularControls: 'Ajustes do Layout Circular',
    rings: 'Anéis',
    circularPattern: 'Padrão',
    patternDefault: 'Padrão',
    patternSpiderWeb: 'Teia de Aranha',
    orbitalControls: 'Ajustes da Esfera Orbital',
    orbitalRadius: 'Raio',
    orbitalFocus: 'Perspectiva',
    orbitalTilt: 'Inclinação Vertical',
    orbitalScale: 'Escala',
    orbitalLightAngle: 'Ângulo da Luz',
    orbitalLightIntensity: 'Intensidade da Luz',
    orbitalDoF: 'Profundidade de Foco',
    stylePresets: 'Estilos Prontos',
    presetModern: 'Moderno',
    presetVintage: 'Vintage Suave',
    presetPastel: 'Sonho Pastel',
    presetDramatic: 'Dramático',
    visualEffects: 'Ajustes Finos de Estilo',
    spacing: 'Espaçamento',
    cornerRadius: 'Arredondar Bordas',
    shadow: 'Intensidade da Sombra',
    vignette: 'Intensidade da Vinheta',
    enableFocalPoint: 'Ponto de Foco',
    blurIntensity: 'Intensidade do Desfoque',
    focusTransition: 'Suavidade do Foco',
    focusTransitionHint: 'Controla a suavidade das imagens em foco. 0 é nítido, 1 é totalmente desfocado.',
    randomizeFocus: 'Foco Aleatório',
    imageBorder: 'Estilo da Imagem',
    cardStyle: 'Estilo do Cartão',
    cardStyleDefault: 'Sólido / Pastel',
    cardStyleGlass: 'Vidro Fosco',
    cardStyleDeviceMockup: 'Mockup de Dispositivo',
    enableBorder: 'Ativar Borda',
    borderColor: 'Cor da Borda',
    borderWidth: 'Largura da Borda',
    internalPadding: 'Espaçamento Interno',
    internalPaddingHint: 'Espaço entre a imagem e a borda da sua moldura.',
    borderlessMode: 'Modo Sem Bordas (Apenas Imagem)',
    borderlessModeHint: 'Remove todas as bordas e espaçamentos, exibindo apenas as imagens originais.',
    proportionalFit: 'Ajuste Proporcional',
    proportionalFitHint: 'Ajusta imagens de várias dimensões para caberem proporcionalmente sem cortes.',
    background: 'Plano de Fundo',
    suggestedPalette: 'Paleta Sugerida',
    paletteHint: 'Clique em uma cor para usá-la como fundo sólido.',
    style: 'Estilo',
    bgStyleSolid: 'Cor Sólida',
    bgStyleMeshGradient: 'Gradiente',
    bgStyleAuroraGlow: 'Aurora',
    bgStyleGrainy: 'Granulado',
    bgStyleConicBurst: 'Cônico',
    bgStylePaper: 'Textura de Papel',
    bgStyleImage: 'Imagem',
    uploadBgImage: 'Carregar Imagem de Fundo',
    changeBgImage: 'Trocar Imagem de Fundo',
    bgColor: 'Cor de Fundo',
    bgPalette: 'Paleta de Cores',
    paletteWedding: 'Casamento',
    paletteBoho: 'Boho Chic',
    paletteVintage: 'Jornal Vintage',
    palettePastel: 'Tons Pastel',
    predefinedColors: 'Cores Predefinidas',
    lightColors: 'Cores Claras',
    darkColors: 'Cores Escuras',
    export: 'Opções de Exportação',
    aspectRatio: 'Proporção',
    format: 'Formato',
    quality: 'Qualidade',
    // Canvas Area
    processing: 'Processando imagens...',
    exportingVideo: 'Exportando vídeo...',
    hintFocus: 'Clique nas imagens para focar/desfocar. Imagens sem foco serão desfocadas.',
    dropImagesHere: 'Solte as imagens aqui',
    addPhotosToCollage: 'Adicione fotos à sua colagem',
    // Section Descriptions
    mockupSectionTitle: 'Mockups Profissionais',
    mockupSectionDesc: 'Ideal para portfólios e redes sociais. Suas fotos dentro de celulares e notebooks.',
    creativeSectionTitle: 'Layouts Criativos',
    creativeSectionDesc: 'Formas artísticas e orgânicas para um visual único.',
    classicSectionTitle: 'Layouts Clássicos',
    classicSectionDesc: 'Grades e mosaicos tradicionais, limpos e organizados.',
    // Unified Sidebar Sections
    sectionComposition: 'Composição & Estrutura',
    sectionImageStyle: 'Visual da Imagem & Estilo',
    sectionEnvironment: 'Cenário & Toque Final',
    sectionPhotoManagement: 'Gestão de Fotos',
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key as string,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');
  
  const t = useCallback((key: TranslationKey, fallback?: string) => {
    return translations[language][key] || translations['en'][key] || fallback || key;
  }, [language]);
  
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);


const App: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [demoImages, setDemoImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [focusedImageIds, setFocusedImageIds] = useState<string[]>([]);
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  
  const canvasAreaRef = useRef<CanvasAreaHandle>(null);
  
  // State for video recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [initialStateBeforeRecord, setInitialStateBeforeRecord] = useState<Settings | null>(null);

  // State for Undo/Redo
  const [history, setHistory] = useState<Settings[]>([DEFAULT_SETTINGS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    generateEmojiImages(50).then(emojis => {
      setDemoImages(emojis);
      setIsLoading(false);
    });

    return () => {
        demoImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    }
  }, []);

  const handleSettingsChange = useCallback((newSettingsAction: React.SetStateAction<Settings>) => {
      setSettings(prevSettings => {
          const updatedSettings = typeof newSettingsAction === 'function' ? newSettingsAction(prevSettings) : newSettingsAction;
          
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(updatedSettings);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          
          if (isRecording) {
              setKeyframes(prevKeyframes => [...prevKeyframes, { timestamp: Date.now(), settings: updatedSettings }]);
          }
          return updatedSettings;
      });
  }, [isRecording, history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSettings(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSettings(history[newIndex]);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const processFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    const successfulConversions: ImageFile[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const converted = await convertToWebP(file);
        successfulConversions.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file: file,
          previewUrl: converted.previewUrl,
          width: converted.width,
          height: converted.height,
        });
      } catch (error) {
        console.error(`Failed to convert ${file.name} to WebP:`, error);
      }
    }
    
    const newImageFiles = [...imageFiles, ...successfulConversions];
    setImageFiles(newImageFiles);

    if (newImageFiles.length > 0) {
      const palette = await extractPaletteFromImages(newImageFiles.map(f => f.previewUrl));
      setColorPalette(palette);

      // AUTO-IMPROVEMENT: If this is the first upload, set a professional mockup layout
      if (imageFiles.length === 0 && successfulConversions.length > 0) {
        setSettings(prev => ({
          ...prev,
          layout: LayoutType.Showcase,
          cardStyle: CardStyle.DeviceMockup,
          borderColor: palette[0] || '#1a1a1a', // Use dominant color for device casing
          backgroundStyle: BackgroundStyle.AuroraLights, // Set a nice background
          shadowBlur: 40,
          spacing: 10,
        }));
      } else if (palette.length > 0 && settings.cardStyle === CardStyle.DeviceMockup) {
        // Update border color to match new palette if already in mockup mode
        setSettings(prev => ({
          ...prev,
          borderColor: palette[0]
        }));
      }
    }

    setIsLoading(false);
  }, [imageFiles, settings.cardStyle]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste if user is in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        processFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await processFiles(Array.from(event.target.files));
    }
  }, [processFiles]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      await processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);
  
  const handleUseDemoImages = useCallback(() => {
    setIsLoading(true);
    setImageFiles(demoImages);
    extractPaletteFromImages(demoImages.map(f => f.previewUrl)).then(palette => {
        setColorPalette(palette);
        setIsLoading(false);
    });
  }, [demoImages]);


  const handleShapeFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        handleSettingsChange(s => ({ ...s, shapeMaskImage: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, [handleSettingsChange]);

  const handleBgImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        handleSettingsChange(s => ({ ...s, backgroundImage: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, [handleSettingsChange]);
  
  const handleClearImages = useCallback(() => {
    imageFiles.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImageFiles([]);
    setFocusedImageIds([]);
    setColorPalette([]);
  }, [imageFiles]);
  
  const handleShuffle = useCallback(() => {
    setImageFiles(currentFiles => [...currentFiles].sort(() => Math.random() - 0.5));
  }, []);

  const handleImageReorder = useCallback((newOrder: ImageFile[]) => {
    setImageFiles(newOrder);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImageFiles(currentFiles => {
      const fileToRemove = currentFiles.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return currentFiles.filter(f => f.id !== id);
    });
    setFocusedImageIds(currentIds => currentIds.filter(fid => fid !== id));
  }, []);

  const loadedImages = useMemo(() => {
    return imageFiles.filter(img => img.width && img.height);
  }, [imageFiles]);

  const imagesToDisplay = useMemo(() => {
    return loadedImages.length > 0 ? loadedImages : demoImages;
  }, [loadedImages, demoImages]);

  const handleRandomFocus = useCallback(() => {
    if (imagesToDisplay.length === 0) return;

    const allIds = imagesToDisplay.map(img => img.id);
    const shuffled = allIds.sort(() => 0.5 - Math.random());
    
    const focusCount = Math.min(5, Math.max(1, Math.floor(allIds.length * 0.2)));
    
    setFocusedImageIds(shuffled.slice(0, focusCount));
  }, [imagesToDisplay]);

  // Actions triggered from Header
  const handleExport = () => {
    canvasAreaRef.current?.exportImage();
  };

  const handleExportAnimation = useCallback(async () => {
      setIsExporting(true);
      try {
          // Create a synthetic initial state for the "Retrospective" effect
          const initialStateForExport: Settings = {
              ...settings,
              spacing: Math.min(100, settings.spacing + 50), // Start more scattered
              mockupAngle: settings.mockupAngle ? settings.mockupAngle - 45 : -45,
              globalRotation: settings.globalRotation ? settings.globalRotation + 180 : 180, // Spin in
              organicVariation: 1, // High variation
              zoom: Math.max(0.1, settings.zoom - 0.4), // Zoomed out
              globalOffsetX: settings.globalOffsetX - 500, // Slide in
          };

          // We need at least two keyframes. The time difference determines the speed in exportVideo.
          const syntheticKeyframes = [
              { timestamp: 0, settings: initialStateForExport },
              { timestamp: 3000, settings } // 3 seconds animation
          ];

          const canvasSize = canvasAreaRef.current?.getCanvasSize() || { width: 800, height: 800 };
          const videoBlob = await exportVideo(syntheticKeyframes, initialStateForExport, imagesToDisplay, settings, canvasSize);
          const url = URL.createObjectURL(videoBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `collage-animation-${new Date().toISOString()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (error) {
          console.error("Video export failed:", error);
      } finally {
          setIsExporting(false);
      }
  }, [settings, imagesToDisplay]);

  // We don't need handleStopRecording anymore, but we can keep it empty or remove it.
  const handleStopRecording = useCallback(() => {}, []);


  const handleAddTextOverlay = useCallback(() => {
    const newOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'New Text',
      x: 0.5,
      y: 0.5,
      fontSize: 40,
      fontFamily: 'Inter',
      color: '#ffffff',
      rotation: 0,
      opacity: 1,
      fontWeight: 'bold',
    };
    handleSettingsChange(s => ({
      ...s,
      textOverlays: [...s.textOverlays, newOverlay],
    }));
  }, [handleSettingsChange]);

  const handleUpdateTextOverlay = useCallback((id: string, updates: any) => {
    handleSettingsChange(s => ({
      ...s,
      textOverlays: s.textOverlays.map(o => o.id === id ? { ...o, ...updates } : o),
    }));
  }, [handleSettingsChange]);

  const handleRemoveTextOverlay = useCallback((id: string) => {
    handleSettingsChange(s => ({
      ...s,
      textOverlays: s.textOverlays.filter(o => o.id !== id),
    }));
  }, [handleSettingsChange]);

  return (
    <div 
      className="flex flex-col h-screen bg-gray-900 overflow-hidden relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-500/20 backdrop-blur-sm border-4 border-indigo-500 border-dashed m-4 rounded-none pointer-events-none">
          <div className="bg-gray-900/80 px-8 py-6 rounded-none shadow-2xl flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <h2 className="text-2xl font-bold text-white">{t('dropImagesHere' as TranslationKey)}</h2>
            <p className="text-indigo-200 mt-2">{t('addPhotosToCollage' as TranslationKey)}</p>
          </div>
        </div>
      )}
      <Header 
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onExport={handleExport}
        isRecording={isRecording}
        isExporting={isExporting || isLoading}
        onStartRecording={handleExportAnimation}
        onStopRecording={handleStopRecording}
        hasImages={imagesToDisplay.length > 0}
        palette={colorPalette}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 flex items-center justify-center p-4 bg-gray-800/50 overflow-hidden relative">
            {imagesToDisplay.length === 0 && imageFiles.length === 0 ? (
              <WelcomeScreen onFileChange={handleFileChange} onUseDemoImages={handleUseDemoImages} isLoading={isLoading} />
            ) : (
              <CanvasArea 
                ref={canvasAreaRef}
                settings={settings} 
                onSettingsChange={handleSettingsChange}
                images={imagesToDisplay} 
                isLoading={isLoading && loadedImages.length > 0}
                focusedImageIds={focusedImageIds}
                onFocusChange={setFocusedImageIds}
                isRecording={isRecording}
                isExporting={isExporting}
              />
            )}
          </main>
          
          <BottomBar 
            imageFiles={imageFiles}
            onRemoveImage={handleRemoveImage}
            onAddImages={(files) => {
              const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
              handleFileChange(event);
            }}
            onReorderImages={handleImageReorder}
            onFocusChange={setFocusedImageIds}
            focusedImageIds={focusedImageIds}
          />
        </div>

        <RightSidebar 
          settings={settings}
          onSettingsChange={handleSettingsChange}
          imageFiles={imageFiles}
          onReorderImages={handleImageReorder}
          onRemoveImage={handleRemoveImage}
          onBgImageChange={handleBgImageChange}
          onShapeFileChange={handleShapeFileChange}
          onRandomFocus={handleRandomFocus}
          colorPalette={colorPalette}
          onAddTextOverlay={handleAddTextOverlay}
          onUpdateTextOverlay={handleUpdateTextOverlay}
          onRemoveTextOverlay={handleRemoveTextOverlay}
          focusedImageIds={focusedImageIds}
          onFocusChange={setFocusedImageIds}
        />
      </div>
    </div>
  );
};

export default App;

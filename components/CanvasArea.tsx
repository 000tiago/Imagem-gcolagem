
import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Settings, ImageFile, ImageRenderData } from '../types';
import { LayoutType } from '../types';
import { calculateLayout } from '../utils/layoutUtils';
import { useTranslation } from '../App';
import { drawCollage } from '../utils/drawingUtils';

interface CanvasAreaProps {
  settings: Settings;
  images: ImageFile[];
  isLoading: boolean;
  focusedImageIds: string[];
  onFocusChange: React.Dispatch<React.SetStateAction<string[]>>;
  isRecording: boolean;
  isExporting: boolean;
}

export interface CanvasAreaHandle {
  exportImage: () => void;
}

// A custom hook to load images from URLs
const useImageElements = (imageFiles: ImageFile[]): [HTMLImageElement[], boolean] => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const imageElements: HTMLImageElement[] = [];
    let loadedCount = 0;
    
    if (imageFiles.length === 0) {
      setImages([]);
      setLoading(false);
      return;
    }

    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === imageFiles.length) {
        setImages(imageElements.map((img, i) => {
            img.dataset.id = imageFiles[i].id; // Assign ID for later reference
            return img;
        }));
        setLoading(false);
      }
    };
    
    imageFiles.forEach(file => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = file.previewUrl;
      img.onload = handleLoad;
      img.onerror = handleLoad; // Count errors as loaded to not block rendering
      imageElements.push(img);
    });
    
    // Cleanup function
    return () => {
      imageElements.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [imageFiles]);

  return [images, loading];
};

const useShapeMask = (imageUrl: string | null): [ImageData | null, boolean] => {
    const [maskData, setMaskData] = useState<ImageData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
    if (!imageUrl) {
        setMaskData(null);
        setLoading(false);
        return;
    }

    setLoading(true);
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
        const scale = Math.min(500 / img.width, 500 / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setMaskData(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
        setLoading(false);
    };
    img.onerror = () => {
        setMaskData(null);
        setLoading(false);
    }
    }, [imageUrl]);

    return [maskData, loading];
}

const useBackgroundImage = (imageUrl: string | null): [HTMLImageElement | null, boolean] => {
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!imageUrl) {
            setBgImage(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            setBgImage(img);
            setLoading(false);
        };
        img.onerror = () => {
            setBgImage(null);
            setLoading(false);
        };
    }, [imageUrl]);

    return [bgImage, loading];
};

export const CanvasArea = forwardRef<CanvasAreaHandle, CanvasAreaProps>(({ 
    settings, 
    images, 
    isLoading, 
    focusedImageIds, 
    onFocusChange,
    isRecording,
    isExporting,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [loadedImageElements, areImagesLoading] = useImageElements(images);
  const [shapeMaskData, isShapeMaskLoading] = useShapeMask(settings.shapeMaskImage);
  const [bgImageElement, isBgImageLoading] = useBackgroundImage(settings.backgroundImage);
  
  const renderDataRef = useRef<ImageRenderData[]>([]);
  const [interactionHint, setInteractionHint] = useState<string | null>(null);
  const [isProcessingExport, setIsProcessingExport] = useState(false);
  
  useEffect(() => {
    let hint: string | null = null;
    if (settings.focalPoint) {
        hint = t('hintFocus');
    }
    setInteractionHint(hint);
    
    if (hint) {
        const timer = setTimeout(() => setInteractionHint(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [settings.focalPoint, t]);


  const drawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || loadedImageElements.length === 0) return;

      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = canvasSize.width * dpr;
      canvas.height = canvasSize.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${canvasSize.width}px`;
      canvas.style.height = `${canvasSize.height}px`;

      const renderData = calculateLayout(loadedImageElements, canvasSize.width, canvasSize.height, settings, shapeMaskData);
      
      renderDataRef.current = renderData;
      
      drawCollage(ctx, canvasSize.width, canvasSize.height, renderData, settings, focusedImageIds, images, bgImageElement);

  }, [canvasSize, settings, loadedImageElements, focusedImageIds, shapeMaskData, images, bgImageElement]);


  useEffect(() => {
    if (!areImagesLoading && !isShapeMaskLoading && !isBgImageLoading) {
      drawCanvas();
    }
  }, [areImagesLoading, isShapeMaskLoading, isBgImageLoading, drawCanvas]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width: containerWidth, height: containerHeight } = entries[0].contentRect;
        if (containerWidth === 0 || containerHeight === 0) return;

        const [aspectW, aspectH] = settings.aspectRatio.split('/').map(Number);
        if (isNaN(aspectW) || isNaN(aspectH) || aspectH === 0) return;

        const containerAspect = containerWidth / containerHeight;
        const targetAspect = aspectW / aspectH;

        let newWidth, newHeight;

        if (containerAspect > targetAspect) {
          newHeight = containerHeight;
          newWidth = newHeight * targetAspect;
        } else {
          newWidth = containerWidth;
          newHeight = newWidth / targetAspect;
        }
        setCanvasSize({ width: Math.floor(newWidth), height: Math.floor(newHeight) });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [settings.aspectRatio]);

  useImperativeHandle(ref, () => ({
    exportImage: async () => {
      setIsProcessingExport(true);
      
      const loadOriginalImages = (filesToLoad: ImageFile[]): Promise<HTMLImageElement[]> => {
          const promises = filesToLoad.map(file => {
              return new Promise<HTMLImageElement>((resolve, reject) => {
                  const img = new Image();
                  const url = URL.createObjectURL(file.file);
                  img.src = url;
                  img.dataset.id = file.id;
                  img.onload = () => resolve(img);
                  img.onerror = (err) => {
                      URL.revokeObjectURL(url);
                      console.error(`Failed to load high-res image: ${file.file.name}`, err);
                      resolve(new Image()); 
                  };
              });
          });
          return Promise.all(promises);
      };

      const loadExportBgImage = (url: string | null): Promise<HTMLImageElement | null> => {
          if (!url) return Promise.resolve(null);
          return new Promise((resolve) => {
              const img = new Image();
              img.src = url;
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null);
          });
      };

      let originalImageElements: HTMLImageElement[] = [];
      try {
          const [loadedOriginals, exportBgImage] = await Promise.all([
              loadOriginalImages(images),
              loadExportBgImage(settings.backgroundImage)
          ]);
          originalImageElements = loadedOriginals;
          const validOriginals = originalImageElements.filter(img => img.width > 0);

          const exportCanvas = document.createElement('canvas');
          const exportCtx = exportCanvas.getContext('2d');
          if (!exportCtx) return;

          const exportWidth = 3000;
          const [aspectW, aspectH] = settings.aspectRatio.split('/').map(Number);
          const exportHeight = exportWidth * (aspectH / aspectW);

          exportCanvas.width = exportWidth;
          exportCanvas.height = exportHeight;

          const scaleFactor = exportWidth / canvasSize.width;
          const offscreenSettings = {
              ...settings,
              shadowBlur: settings.shadowBlur * scaleFactor,
              cornerRadius: settings.cornerRadius * scaleFactor,
              borderWidth: settings.borderWidth * scaleFactor,
              focalPointBlur: settings.focalPointBlur * scaleFactor,
          };

          let renderData = calculateLayout(validOriginals, exportWidth, exportHeight, offscreenSettings, shapeMaskData);

          drawCollage(exportCtx, exportWidth, exportHeight, renderData, offscreenSettings, focusedImageIds, images, exportBgImage);

          const mimeType = `image/${settings.exportFormat}`;
          const dataUrl = exportCanvas.toDataURL(mimeType, settings.exportQuality);
          
          const link = document.createElement('a');
          link.download = `collage-${new Date().toISOString()}.${settings.exportFormat}`;
          link.href = dataUrl;
          link.click();
      } catch(error) {
          console.error("Image export failed:", error);
      } finally {
          originalImageElements.forEach(img => {
              if (img.src.startsWith('blob:')) {
                  URL.revokeObjectURL(img.src);
              }
          });
          setIsProcessingExport(false);
      }
    }
  }));
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!settings.focalPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedItem = [...renderDataRef.current].reverse().find(item => 
      x >= item.x && x <= item.x + item.width &&
      y >= item.y && y <= item.y + item.height
    );

    if (clickedItem) {
      if (settings.focalPoint) {
          onFocusChange(prev =>
            prev.includes(clickedItem.id)
              ? prev.filter(id => id !== clickedItem.id)
              : [...prev, clickedItem.id]
          );
      }
    }
  };

  const isShapeLayoutWithMask = 
    (settings.layout === LayoutType.CustomShape) &&
    !!settings.shapeMaskImage;
    
  const showLoadingOverlay = isLoading || areImagesLoading || (isShapeLayoutWithMask && isShapeMaskLoading) || isBgImageLoading;
  const isClickable = settings.focalPoint;
  
  const cursorStyle = () => {
      if (isClickable) return 'pointer';
      return 'default';
  }

  const showProcessingOverlay = showLoadingOverlay || isExporting || isProcessingExport;

  return (
    <div className="w-full h-full flex flex-col">
      <div ref={containerRef} className="flex-grow w-full h-full relative flex items-center justify-center">
        <div className="relative shadow-2xl" style={{width: canvasSize.width, height: canvasSize.height}}>
            <canvas 
                ref={canvasRef} 
                style={{cursor: cursorStyle()}}
                onClick={handleCanvasClick}
            />
            {isRecording && (
                <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600/80 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm pointer-events-none">
                     <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                     <span>REC</span>
                </div>
            )}
            {interactionHint && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white text-sm px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm animate-fade-in-out pointer-events-none">
                    {interactionHint}
                </div>
            )}
            {showProcessingOverlay && (
                <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-200">
                        {isExporting ? t('exportingVideo') : (isProcessingExport ? t('exportImage') : t('processing'))}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
});

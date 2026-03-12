
import type { Settings, ImageRenderData, ImageFile } from '../types';
import { LayoutType, BackgroundStyle, CardStyle } from '../types';
import { COLOR_PALETTES } from '../constants';

// A simple pseudorandom number generator for deterministic visuals based on a seed.
const seededRandom = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
};

const drawMeshGradient = (ctx: CanvasRenderingContext2D, width: number, height: number, settings: Settings) => {
    const palette = COLOR_PALETTES[settings.bgPalette]?.colors || COLOR_PALETTES.wedding.colors;
    ctx.save();
    
    ctx.fillStyle = palette[2] || '#f3c8d9';
    ctx.fillRect(0, 0, width, height);

    const createGlow = (x, y, radius, color) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        return grad;
    };
    
    const radius = Math.max(width, height) * 0.9;
    
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.7;

    ctx.fillStyle = createGlow(width * 0.02, height * 0.09, radius, palette[0] || 'hsla(203, 83%, 64%, 1)');
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = createGlow(width * 0.98, height * 0.95, radius, palette[1] || 'hsla(328, 73%, 64%, 1)');
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = createGlow(width * 0.05, height * 0.95, radius, palette[3] || 'hsla(263, 63%, 64%, 1)');
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = createGlow(width * 0.95, height * 0.04, radius, palette[4] || 'hsla(17, 83%, 64%, 1)');
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
};

const drawGrainyPastel = (ctx: CanvasRenderingContext2D, width: number, height: number, settings: Settings) => {
    const palette = COLOR_PALETTES[settings.bgPalette]?.colors || COLOR_PALETTES.pastel.colors;
    ctx.save();
    
    const grainGradient = ctx.createLinearGradient(0, 0, width, height);
    grainGradient.addColorStop(0, palette[0] || '#B8D5E5');
    grainGradient.addColorStop(1, palette[1] || '#F9EBE0');
    ctx.fillStyle = grainGradient;
    ctx.fillRect(0, 0, width, height);
    
    const noiseCanvas = document.createElement('canvas');
    const noiseCtx = noiseCanvas.getContext('2d');
    const noiseSize = 100;
    noiseCanvas.width = noiseSize;
    noiseCanvas.height = noiseSize;
    if (noiseCtx) {
        const noiseData = noiseCtx.createImageData(noiseSize, noiseSize);
        for (let i = 0; i < noiseData.data.length; i += 4) {
            const val = Math.random() * 80;
            noiseData.data[i] = val;
            noiseData.data[i + 1] = val;
            noiseData.data[i + 2] = val;
            noiseData.data[i + 3] = 25;
        }
        noiseCtx.putImageData(noiseData, 0, 0);
        const pattern = ctx.createPattern(noiseCanvas, 'repeat');
        if (pattern) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
        }
    }
    ctx.restore();
};

const drawAuroraLights = (ctx: CanvasRenderingContext2D, width: number, height: number, settings: Settings) => {
    const palette = COLOR_PALETTES[settings.bgPalette]?.colors || COLOR_PALETTES.boho.colors;
    ctx.save();
    ctx.fillStyle = palette[2] || '#030424';
    ctx.fillRect(0, 0, width, height);

    const createGlow = (x, y, radiusX, radiusY, color) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        return grad;
    };

    ctx.globalCompositeOperation = 'screen';
    
    ctx.fillStyle = createGlow(width / 2, 0, width, height, `${palette[0]}66`); // 0.4 alpha
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = createGlow(width, height, width, height, `${palette[1]}66`);
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
};

const drawConicBurst = (ctx: CanvasRenderingContext2D, width: number, height: number, settings: Settings) => {
     const palette = COLOR_PALETTES[settings.bgPalette]?.colors || COLOR_PALETTES.vintage.colors;
     const conicGradient = ctx.createConicGradient(Math.PI/2, width / 2, height / 2);
     conicGradient.addColorStop(0, palette[0] || '#FDECB9');
     conicGradient.addColorStop(0.25, palette[1] || '#D6C9E3');
     conicGradient.addColorStop(0.5, palette[2] || '#C2D1C5');
     conicGradient.addColorStop(0.75, palette[3] || '#FDECB9');
     conicGradient.addColorStop(1, palette[0] || '#FDECB9');
     ctx.fillStyle = conicGradient;
     ctx.fillRect(0, 0, width, height);
};

const drawPaperTexture = (ctx: CanvasRenderingContext2D, width: number, height: number, settings: Settings) => {
    const palette = COLOR_PALETTES[settings.bgPalette]?.colors || COLOR_PALETTES.pastel.colors;
    const baseColor = palette[1] || '#f1faee';
    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    const noiseCanvas = document.createElement('canvas');
    const noiseCtx = noiseCanvas.getContext('2d');
    const noiseSize = 150;
    noiseCanvas.width = noiseSize;
    noiseCanvas.height = noiseSize;
    if (noiseCtx) {
        const noiseData = noiseCtx.createImageData(noiseSize, noiseSize);
        for (let i = 0; i < noiseData.data.length; i += 4) {
            const val = Math.random() * 60;
            noiseData.data[i] = val;
            noiseData.data[i + 1] = val;
            noiseData.data[i + 2] = val;
            noiseData.data[i + 3] = 10;
        }
        noiseCtx.putImageData(noiseData, 0, 0);

        noiseCtx.strokeStyle = 'rgba(0,0,0,0.05)';
        noiseCtx.lineWidth = 0.5;
        for (let i = 0; i < 50; i++) {
            noiseCtx.beginPath();
            noiseCtx.moveTo(Math.random() * noiseSize, Math.random() * noiseSize);
            noiseCtx.lineTo(Math.random() * noiseSize, Math.random() * noiseSize);
            noiseCtx.stroke();
        }

        const pattern = ctx.createPattern(noiseCanvas, 'repeat');
        if (pattern) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
        }
    }
    ctx.restore();
};

const drawImageBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, image: HTMLImageElement | null) => {
    if (!image) {
        // Fallback to dark background if image is not loaded
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        return;
    }

    // Cover logic for background image
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const canvasAspect = width / height;
    let renderW, renderH, offsetX, offsetY;

    if (imageAspect < canvasAspect) {
        renderW = width;
        renderH = width / imageAspect;
        offsetX = 0;
        offsetY = (height - renderH) / 2;
    } else {
        renderH = height;
        renderW = height * imageAspect;
        offsetX = (width - renderW) / 2;
        offsetY = 0;
    }

    ctx.save();
    ctx.drawImage(image, offsetX, offsetY, renderW, renderH);
    ctx.restore();
}


export const drawCollage = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  renderData: ImageRenderData[],
  settings: Settings,
  focusedImageIds: string[],
  imageFiles: ImageFile[],
  backgroundImage: HTMLImageElement | null = null
) => {
     // Add roundRect to context prototype if it doesn't exist
    if (!ctx.roundRect) {
        // @ts-ignore
        ctx.roundRect = function(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x+r, y);
            this.arcTo(x+w, y,   x+w, y+h, r);
            this.arcTo(x+w, y+h, x,   y+h, r);
            this.arcTo(x,   y+h, x,   y,   r);
            this.arcTo(x,   y,   x+w, y,   r);
            this.closePath();
            return this;
        }
    }
    
    // Draw background
    switch (settings.backgroundStyle) {
        case BackgroundStyle.MeshGradient:
            drawMeshGradient(ctx, width, height, settings);
            break;
        case BackgroundStyle.GrainyPastel:
            drawGrainyPastel(ctx, width, height, settings);
            break;
        case BackgroundStyle.AuroraLights:
            drawAuroraLights(ctx, width, height, settings);
            break;
        case BackgroundStyle.ConicBurst:
            drawConicBurst(ctx, width, height, settings);
            break;
        case BackgroundStyle.PaperTexture:
            drawPaperTexture(ctx, width, height, settings);
            break;
        case BackgroundStyle.Image:
            drawImageBackground(ctx, width, height, backgroundImage);
            break;
        case BackgroundStyle.Solid:
        default:
            ctx.fillStyle = settings.bgColor;
            ctx.fillRect(0, 0, width, height);
            break;
    }
    
    // --- Glassmorphism Prep ---
    let blurredBgCanvas: HTMLCanvasElement | null = null;
    if (settings.cardStyle === CardStyle.Glass && renderData.length > 0) {
        blurredBgCanvas = document.createElement('canvas');
        blurredBgCanvas.width = width;
        blurredBgCanvas.height = height;
        const blurCtx = blurredBgCanvas.getContext('2d');
        if (blurCtx) {
            blurCtx.filter = 'blur(6px) saturate(120%) brightness(110%)';
            blurCtx.drawImage(ctx.canvas, 0, 0);
        }
    }


    ctx.save();
    
    // Create a map for quick lookup of image file types
    const isPngMap = new Map(imageFiles.map(f => [f.id, f.file.type === 'image/png']));
    // Create a seeded random generator for deterministic background colors
    const bgRandom = seededRandom(settings.bgSeed);

    renderData.forEach(item => {
      ctx.save();
      
      let itemBlur = item.blur ?? 0;
      if (settings.focalPoint && focusedImageIds.length > 0 && settings.focalPointBlur > 0) {
          if (focusedImageIds.includes(item.id)) {
              // This is a focused image, apply transition blur
              itemBlur += settings.focalPointBlur * settings.focalPointFocusTransition;
          } else {
              // This is an unfocused image, apply full blur
              itemBlur += settings.focalPointBlur;
          }
      }

      if (itemBlur > 0) {
        ctx.filter = `blur(${itemBlur}px)`;
      }

      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = settings.shadowBlur;
      ctx.shadowOffsetX = settings.shadowBlur / 5;
      ctx.shadowOffsetY = settings.shadowBlur / 2.5;

      ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
      ctx.rotate(item.rotation * (Math.PI / 180));
      
      // Create a clipping path for the card shape (used for both image and effects)
      ctx.beginPath();
      if (item.clip) {
        item.clip(ctx);
      } else {
         const cornerRadius = item.cornerRadius ?? settings.cornerRadius;
         // @ts-ignore
         ctx.roundRect(-item.width/2, -item.height/2, item.width, item.height, cornerRadius);
      }
      ctx.save(); // Save the clipping path state
      ctx.clip();

      // --- Draw Pastel Background for PNGs ---
      const originalId = item.id.split('::')[0];
      const isPng = isPngMap.get(originalId);
      if (settings.addPngBackground && isPng) {
          ctx.fillStyle = `hsl(${bgRandom() * 360}, 70%, 85%)`;
          ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
      }

      // --- Draw Card Style ---
      if (settings.cardStyle === CardStyle.Glass && blurredBgCanvas) {
          // Invert transform to draw the blurred background from world coordinates
          ctx.rotate(-item.rotation * (Math.PI / 180));
          ctx.translate(-(item.x + item.width / 2), -(item.y + item.height / 2));
          
          ctx.drawImage(blurredBgCanvas, 0, 0);

          // Restore transform to draw overlays in local coordinates
          ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
          ctx.rotate(item.rotation * (Math.PI / 180));
         
          // Add semi-transparent overlay
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(-item.width/2, -item.height/2, item.width, item.height);

      } else if (settings.cardStyle === CardStyle.Default && settings.imageBorder && settings.borderWidth > 0 && settings.layout !== LayoutType.Voronoi) {
          // For the default style, we need to draw a border *around* the clipped area.
          ctx.restore(); // Restore to before clipping
          ctx.save();
          // We can't easily draw a border around a complex clip, so this only works for roundRect.
          if (!item.clip) {
              ctx.strokeStyle = settings.borderColor;
              ctx.lineWidth = settings.borderWidth * 2; // Stroke is centered, so double width
              ctx.stroke();
          }
           ctx.clip(); // Re-apply clip for the image drawing
      }

      // --- Draw Image ---
      try {
        const padding = Math.max(0, settings.padding);
        const availableWidth = Math.max(0, item.width - padding * 2);
        const availableHeight = Math.max(0, item.height - padding * 2);

        let imageDestWidth = availableWidth;
        let imageDestHeight = availableHeight;
        
        // If 'contain', we adjust the destination size to fit the image's aspect ratio
        // inside the available space, without changing the tile/card itself.
        if (settings.imageFit === 'contain' && item.image.naturalWidth > 0) {
            const imageAspect = item.image.naturalWidth / item.image.naturalHeight;
            const availableAspect = availableWidth / availableHeight;

            if (imageAspect > availableAspect) {
                // Image is wider than the available space's aspect ratio
                imageDestHeight = availableWidth / imageAspect;
            } else {
                // Image is taller or has the same aspect ratio
                imageDestWidth = availableHeight * imageAspect;
            }
        }

        if (imageDestWidth > 0 && imageDestHeight > 0) {
            // The sx, sy, sWidth, sHeight from getCropping correctly define what part of the
            // source image to use. For 'contain', it's the whole image. For 'cover', it's a cropped slice.
            ctx.drawImage(item.image, 
                item.sx, item.sy, item.sWidth, item.sHeight, 
                -imageDestWidth / 2, -imageDestHeight / 2, 
                imageDestWidth, imageDestHeight
            );
        }
      } catch (e) {
          console.error("Error drawing image:", e);
      }

      // --- Draw Orbital Lighting Effect ---
      if (item.brightness !== undefined && settings.orbitalLightIntensity > 0) {
        const lightEffect = (item.brightness - 0.5) * settings.orbitalLightIntensity * 2;
        if (lightEffect > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${lightEffect})`;
            ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
        } else {
            ctx.fillStyle = `rgba(0, 0, 0, ${-lightEffect})`;
            ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
        }
      }
      
      // --- Final Touches (like glass border) ---
      if (settings.cardStyle === CardStyle.Glass) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        const cornerRadius = item.cornerRadius ?? settings.cornerRadius;
        // @ts-ignore
        ctx.roundRect(-item.width/2, -item.height/2, item.width, item.height, cornerRadius);
        ctx.stroke();
      }

      ctx.restore(); // Restore from clipping
      ctx.restore(); // Restore from translation/rotation
    });
    
    if (settings.vignette > 0) {
        ctx.save();
        const outerRadius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2)) * 1.5;
        const gradient = ctx.createRadialGradient(width / 2, height / 2, width / 4, width / 2, height / 2, outerRadius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.6, `rgba(0,0,0,0)`);
        gradient.addColorStop(1, `rgba(0,0,0,${settings.vignette * 1.5})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    ctx.restore();
}

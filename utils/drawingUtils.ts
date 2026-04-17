
import type { Settings, ImageRenderData, ImageFile } from '../types';
import { LayoutType, BackgroundStyle, CardStyle } from '../types';
import { COLOR_PALETTES } from '../constants';
import { getCropping } from './layoutUtils';

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


const drawTextOverlays = (ctx: CanvasRenderingContext2D, width: number, height: number, settings: Settings) => {
    if (!settings.textOverlays || settings.textOverlays.length === 0) return;

    settings.textOverlays.forEach(overlay => {
        ctx.save();
        ctx.translate(overlay.x * width, overlay.y * height);
        ctx.rotate(overlay.rotation * (Math.PI / 180));
        ctx.globalAlpha = overlay.opacity;
        ctx.fillStyle = overlay.color;
        // Use a safe font fallback
        ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px ${overlay.fontFamily}, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add a subtle drop shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = overlay.fontSize / 10;
        
        ctx.fillText(overlay.text, 0, 0);
        ctx.restore();
    });
};

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
    
    renderData.forEach(originalItem => {
      const item = { ...originalItem }; // Shallow copy to allow modifying dimensions for tight framing
      
      // --- APPLY INDIVIDUAL OVERRIDES ---
      const override = settings.imageOverrides?.[item.id];
      if (override) {
          item.rotation += override.rotationOffset || 0;
          const scale = override.scaleMultiplier || 1;
          item.width *= scale;
          item.height *= scale;
          item.x += override.offsetX || 0;
          item.y += override.offsetY || 0;
      }

      // --- TIGHT FRAMING FOR 'CONTAIN' ---
      // If proportional fit (contain) is enabled, shrink the card/frame to tightly wrap the image.
      // This prevents large empty colored bands around non-square images (like wallpapers).
      // We only do this for rectangular layouts (where item.clip is undefined).
      if (settings.imageFit === 'contain' && item.image.naturalWidth > 0 && !item.clip) {
          const padding = Math.max(0, settings.padding);
          const availableWidth = Math.max(0, item.width - padding * 2);
          const availableHeight = Math.max(0, item.height - padding * 2);
          
          if (availableWidth > 0 && availableHeight > 0) {
              const imageAspect = item.image.naturalWidth / item.image.naturalHeight;
              const availableAspect = availableWidth / availableHeight;
              
              let newAvailableWidth = availableWidth;
              let newAvailableHeight = availableHeight;
              
              if (imageAspect > availableAspect) {
                  // Image is wider, reduce height
                  newAvailableHeight = availableWidth / imageAspect;
              } else {
                  // Image is taller, reduce width
                  newAvailableWidth = availableHeight * imageAspect;
              }
              
              item.width = newAvailableWidth + padding * 2;
              item.height = newAvailableHeight + padding * 2;
          }
      }

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

      ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
      ctx.rotate(item.rotation * (Math.PI / 180));
      
      // Create a clipping path for the card shape (used for both image and effects)
      ctx.beginPath();
      if (item.clip && settings.cardStyle !== CardStyle.DeviceMockup) {
        item.clip(ctx);
      } else {
         let cornerRadius = item.cornerRadius ?? settings.cornerRadius;
         if (settings.cardStyle === CardStyle.DeviceMockup) {
             const imageAspect = item.image.naturalWidth / item.image.naturalHeight;
             let isLandscape = item.width > item.height;
             if (settings.deviceType === 'laptop') isLandscape = true;
             else if (settings.deviceType === 'phone') isLandscape = false;
             else if ((settings.deviceType === 'auto' || settings.deviceType === 'original') && item.image.naturalWidth > 0) {
                 isLandscape = imageAspect > 1.1;
             }
             
             const isExplicitDevice = settings.deviceType === 'phone' || settings.deviceType === 'laptop';
             cornerRadius = isLandscape ? item.width * 0.03 : item.width * 0.15;
             
             if (!isExplicitDevice) {
                 cornerRadius = Math.min(item.width, item.height) * 0.05;
             }
         }
         // @ts-ignore
         ctx.roundRect(-item.width/2, -item.height/2, item.width, item.height, Math.max(0, cornerRadius));
      }

      // --- Draw Shadow ---
      if (settings.shadowBlur > 0) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = settings.shadowBlur;
          ctx.shadowOffsetX = settings.shadowBlur / 5;
          ctx.shadowOffsetY = settings.shadowBlur / 2.5;
          ctx.fillStyle = 'white'; // Color doesn't matter, just need to fill to cast shadow
          ctx.fill();
          
          // Reset shadow so it doesn't apply to inner elements
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
      }

      ctx.save(); // Save the clipping path state
      ctx.clip();

      // --- Draw Card Style ---
      if (settings.cardStyle === CardStyle.Glass && blurredBgCanvas) {
          // Invert transform to draw the blurred background from world coordinates
          ctx.rotate(-item.rotation * (Math.PI / 180));
          ctx.translate(-(item.x + item.width / 2), -(item.y + item.height / 2));
          
          ctx.drawImage(blurredBgCanvas, 0, 0);

          // Restore transform to draw overlays in local coordinates
          ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
          ctx.rotate(item.rotation * (Math.PI / 180));
         
          // Add semi-transparent overlay based on reflection setting
          ctx.fillStyle = `rgba(255, 255, 255, ${settings.mockupReflection * 0.3})`;
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
        let padding = Math.max(0, settings.padding);
        let bezelWidth = 0;
        let bottomBezel = 0;
        let outerRadius = 0;
        
        if (settings.cardStyle === CardStyle.DeviceMockup) {
            const imageAspect = item.image.naturalWidth / item.image.naturalHeight;
            const itemAspect = item.width / item.height;
            
            // Determine if we should treat this as landscape or portrait based on deviceType or aspect ratio
            let isLandscape = item.width > item.height;
            if (settings.deviceType === 'laptop') isLandscape = true;
            else if (settings.deviceType === 'phone') isLandscape = false;
            else if ((settings.deviceType === 'auto' || settings.deviceType === 'original') && item.image.naturalWidth > 0) {
                isLandscape = imageAspect > 1.1; // Slightly biased towards portrait for square-ish
            }

            const isExplicitDevice = settings.deviceType === 'phone' || settings.deviceType === 'laptop';

            // Thinner, sleeker bezels
            bezelWidth = isLandscape ? item.width * 0.02 : item.width * 0.035;
            bottomBezel = (isLandscape && settings.deviceType === 'laptop') ? bezelWidth * 2.5 : bezelWidth;
            outerRadius = isLandscape ? item.width * 0.03 : item.width * 0.15;
            
            // If original/auto and not explicit, use a more generic rounded corner
            if (!isExplicitDevice) {
                outerRadius = Math.min(item.width, item.height) * 0.05;
            }
            
            padding += bezelWidth;
            
            // Draw outer casing (uses border color)
            const casingColor = settings.mockupBezelColor || settings.borderColor || '#1a1a1a';
            
            // Premium Metallic gradient for casing - more complex for realism
            const casingGrad = ctx.createLinearGradient(-item.width/2, -item.height/2, item.width/2, item.height/2);
            casingGrad.addColorStop(0, casingColor);
            casingGrad.addColorStop(0.15, '#ffffff');
            casingGrad.addColorStop(0.3, casingColor);
            casingGrad.addColorStop(0.5, '#ffffff');
            casingGrad.addColorStop(0.7, casingColor);
            casingGrad.addColorStop(0.85, '#ffffff');
            casingGrad.addColorStop(1, casingColor);
            
            ctx.fillStyle = casingGrad;
            ctx.beginPath();
            // @ts-ignore
            ctx.roundRect(-item.width / 2, -item.height / 2, item.width, item.height, outerRadius);
            ctx.fill();

            // Subtle outer glow/highlight on the edge
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Inner black bezel (the "glass" part)
            ctx.fillStyle = '#000000';
            const glassBezelPadding = bezelWidth * 0.15;
            const glassRadius = Math.max(0, outerRadius - glassBezelPadding);
            ctx.beginPath();
            // @ts-ignore
            ctx.roundRect(
                -item.width / 2 + glassBezelPadding, 
                -item.height / 2 + glassBezelPadding, 
                item.width - glassBezelPadding * 2, 
                item.height - glassBezelPadding * 2, 
                glassRadius
            );
            ctx.fill();
            
            // Draw physical buttons ONLY for explicit phone
            if (!isLandscape && settings.deviceType === 'phone') {
                ctx.fillStyle = casingColor; // Use solid color for buttons for better contrast
                const btnW = bezelWidth * 0.15;
                // Volume Up (Left)
                ctx.beginPath();
                // @ts-ignore
                ctx.roundRect(-item.width/2 - btnW + 1, -item.height * 0.2, btnW, item.height * 0.08, btnW);
                ctx.fill();
                // Volume Down (Left)
                ctx.beginPath();
                // @ts-ignore
                ctx.roundRect(-item.width/2 - btnW + 1, -item.height * 0.08, btnW, item.height * 0.08, btnW);
                ctx.fill();
                // Power (Right)
                ctx.beginPath();
                // @ts-ignore
                ctx.roundRect(item.width/2 - 1, -item.height * 0.15, btnW, item.height * 0.12, btnW);
                ctx.fill();
            }
            
            // Draw inner black glass bezel (deeper black)
            const casingThickness = bezelWidth * 0.2;
            const innerGlassRadius = Math.max(0, outerRadius - casingThickness);
            ctx.fillStyle = '#050505';
            ctx.beginPath();
            // @ts-ignore
            ctx.roundRect(
                -item.width / 2 + casingThickness, 
                -item.height / 2 + casingThickness, 
                item.width - casingThickness * 2, 
                item.height - casingThickness * 2, 
                innerGlassRadius
            );
            ctx.fill();
            
            ctx.save(); // Save state before inner clip
            // Clip to inner screen
            const screenCornerRadius = Math.max(0, outerRadius - bezelWidth);
            ctx.beginPath();
            // @ts-ignore
            ctx.roundRect(
                -item.width / 2 + bezelWidth, 
                -item.height / 2 + bezelWidth, 
                item.width - bezelWidth * 2, 
                item.height - bezelWidth - bottomBezel, 
                screenCornerRadius
            );
            ctx.clip(); // Inner clip

            // --- Draw Inner Shadow for Screen Depth ---
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = bezelWidth * 0.5;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = bezelWidth * 0.2;
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow
        }

        // Adjust available space for the image. If bottomBezel is larger, we need to adjust height.
        let availableWidth = Math.max(0, item.width - bezelWidth * 2);
        let availableHeight = Math.max(0, item.height - bezelWidth - bottomBezel);
        
        if (settings.cardStyle !== CardStyle.DeviceMockup) {
            availableWidth = Math.max(0, item.width - padding * 2);
            availableHeight = Math.max(0, item.height - padding * 2);
        }

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
            // Recalculate cropping based on the actual destination size to prevent stretching
            const { sx, sy, sWidth, sHeight } = getCropping(item.image, imageDestWidth, imageDestHeight, settings.imageFit);
            
            let imgCenterY = 0;
            if (settings.cardStyle === CardStyle.DeviceMockup) {
                imgCenterY = (bezelWidth - bottomBezel) / 2;
            }

            ctx.save();
            if (override) {
                if (override.opacity !== undefined) ctx.globalAlpha *= override.opacity;
                if (override.filters) {
                    const f = override.filters;
                    let filterStr = '';
                    if (f.brightness !== undefined) filterStr += `brightness(${f.brightness}) `;
                    if (f.contrast !== undefined) filterStr += `contrast(${f.contrast}) `;
                    if (f.grayscale !== undefined) filterStr += `grayscale(${f.grayscale}) `;
                    if (f.sepia !== undefined) filterStr += `sepia(${f.sepia}) `;
                    if (f.saturate !== undefined) filterStr += `saturate(${f.saturate}) `;
                    if (f.hueRotate !== undefined) filterStr += `hue-rotate(${f.hueRotate}deg) `;
                    
                    if (filterStr) {
                        const currentFilter = ctx.filter;
                        ctx.filter = (currentFilter === 'none' ? '' : currentFilter + ' ') + filterStr;
                    }
                }
            }

            ctx.drawImage(item.image, 
                sx, sy, sWidth, sHeight, 
                -imageDestWidth / 2, -imageDestHeight / 2 + imgCenterY, 
                imageDestWidth, imageDestHeight
            );
            ctx.restore();
        }
        
        if (settings.cardStyle === CardStyle.DeviceMockup) {
            const imageAspect = item.image.naturalWidth / item.image.naturalHeight;
            let isLandscape = item.width > item.height;
            if (settings.deviceType === 'laptop') isLandscape = true;
            else if (settings.deviceType === 'phone') isLandscape = false;
            else if (settings.deviceType === 'auto' && item.image.naturalWidth > 0) {
                isLandscape = imageAspect > 1.1;
            }
            // outerRadius already defined above
            
            if (isLandscape) {
                // Laptop Overlays
                // Camera dot
                ctx.fillStyle = '#0a0a0a';
                ctx.beginPath();
                ctx.arc(0, -item.height / 2 + bezelWidth / 2, bezelWidth * 0.25, 0, Math.PI * 2);
                ctx.fill();
                
                // Camera lens reflection
                ctx.fillStyle = '#1a1a2e';
                ctx.beginPath();
                ctx.arc(0, -item.height / 2 + bezelWidth / 2, bezelWidth * 0.1, 0, Math.PI * 2);
                ctx.fill();
                
                // Green indicator light
                ctx.fillStyle = 'rgba(74, 222, 128, 0.8)';
                ctx.beginPath();
                ctx.arc(bezelWidth * 0.8, -item.height / 2 + bezelWidth / 2, bezelWidth * 0.08, 0, Math.PI * 2);
                ctx.fill();
                
                // Keyboard deck/hinge simulation
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-item.width / 2, item.height / 2 - bottomBezel, item.width, bottomBezel);
                
                // Hinge indent
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(-item.width * 0.3, item.height / 2 - bottomBezel * 0.8, item.width * 0.6, bottomBezel * 0.2);
                
                // Screen glare (Laptop)
                const glareGrad = ctx.createLinearGradient(-item.width/2, -item.height/2, item.width/2, item.height/2);
                glareGrad.addColorStop(0, `rgba(255,255,255,${settings.mockupReflection * 0.5})`);
                glareGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
                glareGrad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = glareGrad;
                ctx.fillRect(-imageDestWidth / 2, -imageDestHeight / 2, imageDestWidth, imageDestHeight);
                
            } else {
                // Phone Overlays (Dynamic Island)
                const islandWidth = item.width * 0.28;
                const islandHeight = item.width * 0.07;
                const islandY = -item.height / 2 + bezelWidth + item.width * 0.015;
                
                // Island base
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                // @ts-ignore
                ctx.roundRect(
                    -islandWidth / 2,
                    islandY,
                    islandWidth,
                    islandHeight,
                    islandHeight / 2
                );
                ctx.fill();
                
                // Camera lens inside island
                ctx.fillStyle = '#111111';
                ctx.beginPath();
                ctx.arc(islandWidth * 0.3, islandY + islandHeight / 2, islandHeight * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                // Lens reflection
                ctx.fillStyle = '#2a2a3e';
                ctx.beginPath();
                ctx.arc(islandWidth * 0.3, islandY + islandHeight / 2, islandHeight * 0.15, 0, Math.PI * 2);
                ctx.fill();
                
                // FaceID sensor
                ctx.fillStyle = '#0a0a0a';
                ctx.beginPath();
                ctx.arc(-islandWidth * 0.2, islandY + islandHeight / 2, islandHeight * 0.2, 0, Math.PI * 2);
                ctx.fill();
                
                // Screen glare (Phone)
                const glareGrad = ctx.createLinearGradient(-item.width/2, -item.height/2, item.width/2, item.height/2);
                glareGrad.addColorStop(0, `rgba(255,255,255,${settings.mockupReflection * 0.4})`);
                glareGrad.addColorStop(0.4, 'rgba(255,255,255,0)');
                glareGrad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = glareGrad;
                ctx.fillRect(-imageDestWidth / 2, -imageDestHeight / 2, imageDestWidth, imageDestHeight);
                
                // Inner screen shadow for depth
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = item.width * 0.02;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = item.width * 0.01;
                const innerRadius = item.width * 0.13;
                ctx.beginPath();
                // @ts-ignore
                ctx.roundRect(
                    -imageDestWidth / 2, 
                    -imageDestHeight / 2, 
                    imageDestWidth, 
                    imageDestHeight, 
                    innerRadius
                );
                ctx.stroke();
                ctx.shadowColor = 'transparent'; // Reset shadow
            }
        }
        
        if (settings.cardStyle === CardStyle.DeviceMockup) {
            ctx.restore(); // Restore to outer clip active, inner clip removed
        }
            
            // Glass Glare / Reflection (Diagonal polygon)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.beginPath();
            ctx.moveTo(-item.width / 2, -item.height / 2);
            ctx.lineTo(0, -item.height / 2);
            ctx.lineTo(-item.width / 2, item.height / 2);
            ctx.fill();
            
            // Highlights
            // Outer highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = bezelWidth * 0.05;
            ctx.beginPath();
            ctx.roundRect(
                -item.width / 2 + ctx.lineWidth/2, 
                -item.height / 2 + ctx.lineWidth/2, 
                item.width - ctx.lineWidth, 
                item.height - ctx.lineWidth, 
                Math.max(0, outerRadius - ctx.lineWidth/2)
            );
            ctx.stroke();

            // Inner shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = bezelWidth * 0.15;
            ctx.beginPath();
            ctx.roundRect(
                -item.width / 2 + bezelWidth - ctx.lineWidth/2, 
                -item.height / 2 + bezelWidth - ctx.lineWidth/2, 
                item.width - bezelWidth * 2 + ctx.lineWidth, 
                item.height - bezelWidth - bottomBezel + ctx.lineWidth, 
                Math.max(0, outerRadius - bezelWidth + ctx.lineWidth/2)
            );
            ctx.stroke();
      } catch (e) {
          console.error("Error drawing image:", e);
      }

      // --- Draw Orbital Lighting Effect ---
      if (item.brightness !== undefined && settings.autoLighting && settings.orbitalLightIntensity > 0 && settings.cardStyle !== CardStyle.DeviceMockup) {
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
        ctx.roundRect(-item.width/2, -item.height/2, item.width, item.height, Math.max(0, cornerRadius));
        ctx.stroke();
      }

      // --- Selection Indicator ---
      if (focusedImageIds.includes(item.id)) {
        ctx.strokeStyle = '#6366f1'; // indigo-500
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        const cornerRadius = item.cornerRadius ?? settings.cornerRadius;
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(-item.width/2 - 4, -item.height/2 - 4, item.width + 8, item.height + 8, Math.max(0, cornerRadius + 4));
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
        
        // Draw small corner handles
        ctx.fillStyle = '#6366f1';
        const handleSize = 8;
        ctx.fillRect(-item.width/2 - 8, -item.height/2 - 8, handleSize, handleSize);
        ctx.fillRect(item.width/2, -item.height/2 - 8, handleSize, handleSize);
        ctx.fillRect(-item.width/2 - 8, item.height/2, handleSize, handleSize);
        ctx.fillRect(item.width/2, item.height/2, handleSize, handleSize);
      }

        if (settings.cardStyle === CardStyle.DeviceMockup) {
            ctx.restore(); // Restore from inner clip
        }
      ctx.restore(); // Restore from outer clip
      ctx.restore(); // Restore from translation/rotation
    });
    
    if (settings.vignette > 0 && settings.autoLighting) {
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

    // --- Apply Global Filters ---
    if (settings.globalFilters) {
        const filters = settings.globalFilters;
        const filterStr = `brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturate}) grayscale(${filters.grayscale}) sepia(${filters.sepia}) hue-rotate(${filters.hueRotate}deg)`;
        
        if (filterStr !== 'brightness(1) contrast(1) saturate(1) grayscale(0) sepia(0) hue-rotate(0deg)') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.drawImage(ctx.canvas, 0, 0);
                ctx.clearRect(0, 0, width, height);
                ctx.save();
                ctx.filter = filterStr;
                ctx.drawImage(tempCanvas, 0, 0);
                ctx.restore();
            }
        }
    }

    // --- Draw Text Overlays ---
    drawTextOverlays(ctx, width, height, settings);

    ctx.restore();
}

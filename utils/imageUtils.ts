export const convertToWebP = (file: File): Promise<{ previewUrl: string, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const originalUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = originalUrl;
    img.onload = () => {
      // Use a consistent, reasonable preview size for UI performance.
      // The original full-resolution file will be used for export.
      const MAX_DIMENSION = 800;
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round(targetHeight * (MAX_DIMENSION / targetWidth));
          targetWidth = MAX_DIMENSION;
        } else {
          targetWidth = Math.round(targetWidth * (MAX_DIMENSION / targetHeight));
          targetHeight = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(originalUrl);
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(originalUrl); // Clean up the original blob URL immediately
          if (!blob) {
            return reject(new Error('Canvas toBlob returned null'));
          }
          const webpUrl = URL.createObjectURL(blob);
          resolve({ previewUrl: webpUrl, width: targetWidth, height: targetHeight });
        },
        'image/webp',
        0.8 // Quality setting
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(originalUrl);
      reject(err);
    };
  });
};

// --- New Function for Smart Color Palette ---

// Helper to convert RGB to a single number for easier clustering
const rgbToInt = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;

// Simple quantization algorithm to find dominant colors
const getDominantColors = (imageData: ImageData, count: number): string[] => {
    const pixels = imageData.data;
    const colorCounts: { [key: number]: number } = {};
    const step = 4 * 4; // Sample every 4th pixel for performance

    for (let i = 0; i < pixels.length; i += step) {
        // Quantize colors to reduce the color space (e.g., reduce 256 levels to 16)
        const r = (pixels[i] >> 4) << 4;
        const g = (pixels[i + 1] >> 4) << 4;
        const b = (pixels[i + 2] >> 4) << 4;
        const alpha = pixels[i + 3];

        if (alpha > 128) { // Ignore transparent pixels
            const color = rgbToInt(r, g, b);
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        }
    }

    const sortedColors = Object.entries(colorCounts).sort(([, a], [, b]) => b - a);
    
    return sortedColors.slice(0, count).map(([color]) => {
        const num = parseInt(color, 10);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgb(${r},${g},${b})`;
    });
};


export const extractPaletteFromImages = (previewUrls: string[]): Promise<string[]> => {
    return new Promise(async (resolve) => {
        if (previewUrls.length === 0) {
            resolve([]);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            resolve([]);
            return;
        }
        
        // Create a composite image for analysis
        const compositeSize = 200;
        canvas.width = compositeSize;
        canvas.height = compositeSize;

        const imageElements: HTMLImageElement[] = await Promise.all(
            // FIX: Explicitly type the Promise to resolve with HTMLImageElement.
            previewUrls.map(url => new Promise<HTMLImageElement>(res => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = url;
                img.onload = () => res(img);
                img.onerror = () => res(new Image()); // return empty image on error
            }))
        );

        const gridDim = Math.ceil(Math.sqrt(imageElements.length));
        const cell_w = compositeSize / gridDim;
        const cell_h = compositeSize / gridDim;

        imageElements.forEach((img, i) => {
            if (img.width > 0) {
                const x = (i % gridDim) * cell_w;
                const y = Math.floor(i / gridDim) * cell_h;
                ctx.drawImage(img, x, y, cell_w, cell_h);
            }
        });

        const imageData = ctx.getImageData(0, 0, compositeSize, compositeSize);
        const palette = getDominantColors(imageData, 6);
        
        resolve(palette);
    });
};

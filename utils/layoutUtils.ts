/**
 * @file This file contains the core logic for calculating the position, size, and rotation
 * of every image in a collage for various layout types.
 *
 * The key export is `calculateLayout`, which acts as a router to the specific
 * function for the selected layout (e.g., `calculateGridLayout`, `calculatePileLayout`).
 *
 * A crucial feature is the use of a seeded pseudo-random number generator (`seededRandom`).
 * This ensures that for the same set of images and settings (including the 'seed'), the
 * "random" variations in layouts are deterministic and reproducible. This allows users
 * to shuffle through variations and get back to one they liked.
 */

import { Settings, ImageRenderData, LayoutType, ImageFit, GridStyle, VoronoiDistribution, TieredShape, CircularPattern, SpiralType } from '../types';
// Assuming d3-delaunay is available in the project, as it's standard for Voronoi diagrams.
import { Delaunay } from 'd3-delaunay';


// A simple pseudorandom number generator for deterministic layouts based on a seed.
const seededRandom = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
};

// Helper to calculate source rect for 'cover' or 'contain' image fitting.
export function getCropping(image: HTMLImageElement, destWidth: number, destHeight: number, imageFit: ImageFit): { sx: number, sy: number, sWidth: number, sHeight: number } {
    if (!image.naturalWidth || !image.naturalHeight || !destWidth || !destHeight) {
        return { sx: 0, sy: 0, sWidth: 1, sHeight: 1 };
    }
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const destAspect = destWidth / destHeight;

    let sx = 0, sy = 0, sWidth = image.naturalWidth, sHeight = image.naturalHeight;

    if (imageFit === 'cover') {
        if (imageAspect > destAspect) { // Image is wider than destination
            sWidth = image.naturalHeight * destAspect;
            sx = (image.naturalWidth - sWidth) / 2;
        } else { // Image is taller than destination
            sHeight = image.naturalWidth / destAspect;
            sy = (image.naturalHeight - sHeight) / 2;
        }
    }
    // For 'contain', we use the full source image, which is the default.
    return { sx, sy, sWidth, sHeight };
}

// Helper for 'contain' fit to calculate destination size
function getContainSize(imgAspect: number, cellWidth: number, cellHeight: number): { width: number, height: number } {
    const cellAspect = cellWidth / cellHeight;
    let newWidth = cellWidth;
    let newHeight = cellHeight;
    if (imgAspect > cellAspect) {
        newHeight = cellWidth / imgAspect;
    } else {
        newWidth = cellHeight * imgAspect;
    }
    return { width: newWidth, height: newHeight };
}

function calculateGridLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
  const renderData: ImageRenderData[] = [];
  let { rows, cols, organicVariation } = settings;
  const random = seededRandom(settings.seed);

  if (settings.autoGrid) {
    const totalImages = images.length;
    if (totalImages === 0) return [];
    const canvasAspect = canvasWidth / canvasHeight;
    cols = Math.ceil(Math.sqrt(totalImages * canvasAspect));
    rows = Math.ceil(totalImages / cols);
  }

  // Masonry logic: Places images in the shortest column, creating a staggered effect.
  if (settings.gridStyle === GridStyle.Masonry) {
    const colWidth = (canvasWidth - (cols + 1) * settings.spacing) / cols;
    const colHeights = Array(cols).fill(settings.spacing);
    
    // Repeat images to fill the grid if there aren't enough
    const imagesToDisplay = images.length > 0 ? Array.from({length: rows * cols}, (_, i) => images[i % images.length]) : [];

    imagesToDisplay.forEach((image, index) => {
        const imageAspect = getDeviceAspect(image, settings.deviceType);
        const padding = settings.padding;
        const availableWidth = Math.max(0, colWidth - padding * 2);
        let imgHeight = colWidth / imageAspect;
        
        if (availableWidth > 0) {
             imgHeight = (availableWidth / imageAspect) + padding * 2;
        }

        let targetCol = 0;
        let minColHeight = colHeights[0];
        for (let i = 1; i < cols; i++) {
            if (colHeights[i] < minColHeight) {
                minColHeight = colHeights[i];
                targetCol = i;
            }
        }

        const x = settings.spacing + targetCol * (colWidth + settings.spacing);
        const y = colHeights[targetCol];
        const { sx, sy, sWidth, sHeight } = getCropping(image, colWidth, imgHeight, settings.imageFit);
        
        renderData.push({
            image,
            id: image.dataset.id || `image-${index}`,
            x, y,
            width: colWidth,
            height: imgHeight,
            rotation: 0, sx, sy, sWidth, sHeight
        });
        
        colHeights[targetCol] += imgHeight + settings.spacing;
    });

    const maxColHeight = Math.max(...colHeights);
    if (maxColHeight > 0) {
        const scale = canvasHeight / maxColHeight;
        renderData.forEach(d => {
            d.y = d.y * scale;
            d.height = d.height * scale;
            d.x = d.x * scale + (canvasWidth - (canvasWidth * scale)) / 2;
            d.width = d.width * scale;
        });
    }
    return renderData;
  }
  
  // Uniform/Overlapped logic: Places images in a standard grid.
  const cellWidth = (canvasWidth - (cols + 1) * settings.spacing) / cols;
  const cellHeight = (canvasHeight - (rows + 1) * settings.spacing) / rows;
  
  let imageIndex = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (images.length === 0) continue;
      const image = images[imageIndex % images.length];

      let x = settings.spacing + c * (cellWidth + settings.spacing);
      let y = settings.spacing + r * (cellHeight + settings.spacing);
      let width = cellWidth;
      let height = cellHeight;
      let rotation = 0;
      
      if (settings.gridStyle === GridStyle.Overlapped) {
          const overlapX = (random() - 0.5) * cellWidth * 0.3;
          const overlapY = (random() - 0.5) * cellHeight * 0.3;
          x += overlapX;
          y += overlapY;
      }
      
      // Apply organic variation
      const offsetX = (random() - 0.5) * cellWidth * organicVariation * 0.5;
      const offsetY = (random() - 0.5) * cellHeight * organicVariation * 0.5;
      x += offsetX;
      y += offsetY;
      rotation = (random() - 0.5) * 45 * organicVariation;

      const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);
      
      renderData.push({
        image,
        id: image.dataset.id || `image-${imageIndex}`,
        x, y, width, height,
        rotation,
        sx, sy, sWidth, sHeight
      });

      imageIndex++;
    }
  }
  return renderData;
}


function calculateMosaicRowsLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
  const renderData: ImageRenderData[] = [];
  const random = seededRandom(settings.seed);
  const rows = settings.rows;
  const rowHeight = (canvasHeight - (rows + 1) * settings.spacing) / rows;
  let imageIndex = 0;

  if (images.length === 0) return [];

  for (let i = 0; i < rows; i++) {
    let currentX = settings.spacing;
    let imagesInRow = [];
    let totalAspectRatio = 0;
    
    const numImagesInRow = Math.max(2, Math.floor(2 + random() * (images.length > 10 ? 4 : 2)));

    for (let j = 0; j < numImagesInRow; j++) {
        if(imageIndex >= images.length) imageIndex = 0; // Loop images if not enough
        const img = images[imageIndex];
        const aspectRatio = Math.max(0.25, Math.min(4, img.naturalWidth / img.naturalHeight || 1.6));
        imagesInRow.push(img);
        totalAspectRatio += aspectRatio;
        imageIndex++;
    }
    
    if (imagesInRow.length === 0) continue;

    const rowWidth = canvasWidth - (imagesInRow.length + 1) * settings.spacing;
    const initialY = settings.spacing + i * (rowHeight + settings.spacing);
    
    for(const image of imagesInRow){
      const imageAspectRatio = Math.max(0.25, Math.min(4, getDeviceAspect(image, settings.deviceType)));
      
      const tileWidth = (imageAspectRatio / totalAspectRatio) * rowWidth;
      const tileHeight = rowHeight;
      
      const finalX = currentX;
      const finalY = initialY;
      const finalWidth = tileWidth;
      const finalHeight = tileHeight;

      const rotation = (random() - 0.5) * 30 * settings.mosaicShapeVariation;
      
      const { sx, sy, sWidth, sHeight } = getCropping(image, finalWidth, finalHeight, settings.imageFit);
      
      const cornerRadius = settings.cornerRadius * (1 - settings.mosaicShapeVariation * (random() * 0.5));

      renderData.push({
          image,
          id: image.dataset.id!,
          x: finalX,
          y: finalY,
          width: finalWidth,
          height: finalHeight,
          rotation,
          sx, sy, sWidth, sHeight,
          cornerRadius,
      });
      currentX += tileWidth + settings.spacing;
    }
  }

  return renderData;
}


function calculatePileLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    const { pileOrganization, pileCardSize, pileCardSizeVariation, imageFit } = settings;
    if (images.length === 0) return [];

    const imagesToDisplay = images.map((image) => ({
        image: image,
        id: image.dataset.id!,
    }));

    const chaosFactor = 1 - pileOrganization;

    imagesToDisplay.forEach(({ image, id }) => {
        const aspectRatio = getDeviceAspect(image, settings.deviceType);
        
        const canvasDiagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
        const baseCardDim = canvasDiagonal * 0.2 * pileCardSize;

        const sizeVariation = 1 + (random() - 0.5) * 2 * pileCardSizeVariation;
        let cardWidth = baseCardDim * sizeVariation;
        let cardHeight = cardWidth / aspectRatio;

        const gridX = (random() * (canvasWidth + cardWidth)) - cardWidth;
        const gridY = (random() * (canvasHeight + cardHeight)) - cardHeight;
        
        const centerPull = (1 - chaosFactor) * 0.5;
        const x = gridX * (1 - centerPull) + (canvasWidth / 2 - cardWidth / 2) * centerPull;
        const y = gridY * (1 - centerPull) + (canvasHeight / 2 - cardHeight / 2) * centerPull;

        const maxRotation = 90; 
        const rotation = (random() - 0.5) * 2 * maxRotation * chaosFactor;

        const { sx, sy, sWidth, sHeight } = getCropping(image, cardWidth, cardHeight, imageFit);

        renderData.push({
            image,
            id,
            x, y,
            width: cardWidth,
            height: cardHeight,
            rotation,
            sx, sy, sWidth, sHeight
        });
    });

    return renderData;
}

function calculateWall3DLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    const { rows, cols, organicVariation, perspectiveAngle, perspectiveTilt, perspectiveZoom } = settings;
    if (images.length === 0) return [];
    let imageIndex = 0;

    const angleRad = perspectiveAngle * (Math.PI / 180);
    const tiltRad = perspectiveTilt * (Math.PI / 180);

    // Set a focal length based on canvas size. A larger focal length means less distortion.
    const focalLength = Math.min(canvasWidth, canvasHeight) * 2;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    const gridWidth = canvasWidth * 1.5; // Make the virtual grid larger than canvas to fill on rotation
    const gridHeight = canvasHeight * 1.5;

    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const image = images[imageIndex % images.length];

            // 1. Start with a flat grid point, centered at (0,0)
            const gridX = c * cellWidth + cellWidth / 2 - gridWidth / 2;
            const gridY = r * cellHeight + cellHeight / 2 - gridHeight / 2;

            // 2. Apply 3D rotations (as a 3D plane, initial z is 0)
            // Tilt around X-axis
            const y_tilted = gridY * Math.cos(tiltRad);
            const z_after_tilt = gridY * Math.sin(tiltRad);
            // Angle around Y-axis
            const x_rotated = gridX * Math.cos(angleRad) + z_after_tilt * Math.sin(angleRad);
            const z_final = -gridX * Math.sin(angleRad) + z_after_tilt * Math.cos(angleRad);
            
            // 3. Perspective projection
            const scale = focalLength / (focalLength + z_final);
            const x2d = x_rotated * scale * perspectiveZoom;
            const y2d = y_tilted * scale * perspectiveZoom;

            // 4. Calculate size and position
            let width = cellWidth * scale * perspectiveZoom;
            let height = cellHeight * scale * perspectiveZoom;

            // Apply organic variation after projection
            const offsetX = (random() - 0.5) * width * organicVariation * 0.5;
            const offsetY = (random() - 0.5) * height * organicVariation * 0.5;
            const rotation = (random() - 0.5) * 20 * organicVariation;
            
            const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);

            renderData.push({
                image,
                id: `${image.dataset.id}::p_clone::${imageIndex}`,
                x: x2d + canvasCenterX - width / 2 + offsetX,
                y: y2d + canvasCenterY - height / 2 + offsetY,
                width, height,
                rotation,
                sx, sy, sWidth, sHeight,
                z: z_final
            });
            imageIndex++;
        }
    }
    
    // Sort by z-index so images in the back are drawn first
    return renderData.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}


function calculateTiledLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    let imageIndex = 0;
    
    const split = (x: number, y: number, w: number, h: number, iterations: number) => {
        if (iterations <= 0 || w < 20 || h < 20) {
            if (images.length === 0) return;
            const image = images[imageIndex % images.length];
            
            const destX = x + settings.spacing / 2;
            const destY = y + settings.spacing / 2;
            const destW = w - settings.spacing;
            const destH = h - settings.spacing;

            const { sx, sy, sWidth, sHeight } = getCropping(image, destW, destH, settings.imageFit);

            renderData.push({
                image, id: image.dataset.id!,
                x: destX, y: destY, 
                width: destW, height: destH,
                rotation: 0, sx, sy, sWidth, sHeight
            });
            imageIndex++;
            return;
        }

        const splitVertical = w > h;
        // The tile variation now correctly influences the split point.
        // Low variation = splits near 50%. High variation = splits can be 10-90%.
        const splitPoint = 0.5 + (random() - 0.5) * settings.tileVariation * 0.8;
        
        if (splitVertical) {
            split(x, y, w * splitPoint, h, iterations - 1);
            split(x + w * splitPoint, y, w * (1-splitPoint), h, iterations - 1);
        } else {
            split(x, y, w, h * splitPoint, iterations - 1);
            split(x, y + h * splitPoint, w, h * (1-splitPoint), iterations - 1);
        }
    };
    
    split(0, 0, canvasWidth, canvasHeight, settings.cols / 2);
    return renderData;
}

function calculateFractalLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    let imageIndex = 0;
    if(images.length === 0) return [];

    const initialDepth = Math.max(1, Math.floor(settings.cols / 2));

    const subdivide = (x: number, y: number, w: number, h: number, depth: number) => {
        // The tile variation now controls the probability of stopping subdivision.
        // High variation = low chance of stopping = more small tiles.
        // Low variation = high chance of stopping = more large tiles.
        const shouldStop = random() < (1 - settings.tileVariation) * 0.7;
        if (depth <= 0 || w < 25 || h < 25 || (shouldStop && depth < initialDepth - 1)) {
            const image = images[imageIndex % images.length];
            
            const destX = x + settings.spacing / 2;
            const destY = y + settings.spacing / 2;
            const destW = w - settings.spacing;
            const destH = h - settings.spacing;

            const { sx, sy, sWidth, sHeight } = getCropping(image, destW, destH, settings.imageFit);

            renderData.push({
                image,
                id: image.dataset.id || `image-${imageIndex}`,
                x: destX,
                y: destY,
                width: destW,
                height: destH,
                rotation: 0,
                sx, sy, sWidth, sHeight,
            });
            imageIndex++;
            return;
        }

        // Split based on rectangle aspect ratio to fill the space.
        if (w > h) {
            const split = w / 2;
            subdivide(x, y, split, h, depth - 1);
            subdivide(x + split, y, split, h, depth - 1);
        } else {
            const split = h / 2;
            subdivide(x, y, w, split, depth - 1);
            subdivide(x, y + split, w, split, depth - 1);
        }
    };
    
    subdivide(0, 0, canvasWidth, canvasHeight, initialDepth);
    return renderData;
}

// --- NEW: Poisson Disk Sampling for high-quality organic layouts ---
function poissonDiskSampling(width: number, height: number, minRadius: number, random: () => number, k: number = 30): [number, number][] {
    const cellSize = minRadius / Math.sqrt(2);
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid: ([number, number] | null)[] = new Array(gridWidth * gridHeight).fill(null);
    const active: [number, number][] = [];
    const samples: [number, number][] = [];

    const initialPoint: [number, number] = [random() * width, random() * height];
    const initialGridX = Math.floor(initialPoint[0] / cellSize);
    const initialGridY = Math.floor(initialPoint[1] / cellSize);
    grid[initialGridY * gridWidth + initialGridX] = initialPoint;
    active.push(initialPoint);
    samples.push(initialPoint);

    while (active.length > 0) {
        const activeIndex = Math.floor(random() * active.length);
        const activePoint = active[activeIndex];
        let found = false;

        for (let i = 0; i < k; i++) {
            const angle = random() * 2 * Math.PI;
            const radius = minRadius * (1 + random());
            const newPoint: [number, number] = [
                activePoint[0] + Math.cos(angle) * radius,
                activePoint[1] + Math.sin(angle) * radius,
            ];

            if (newPoint[0] < 0 || newPoint[0] >= width || newPoint[1] < 0 || newPoint[1] >= height) {
                continue;
            }

            const gridX = Math.floor(newPoint[0] / cellSize);
            const gridY = Math.floor(newPoint[1] / cellSize);
            let valid = true;

            for (let y = -2; y <= 2; y++) {
                for (let x = -2; x <= 2; x++) {
                    const neighborGridX = gridX + x;
                    const neighborGridY = gridY + y;
                    if (neighborGridX >= 0 && neighborGridX < gridWidth && neighborGridY >= 0 && neighborGridY < gridHeight) {
                        const neighbor = grid[neighborGridY * gridWidth + neighborGridX];
                        if (neighbor) {
                            const dx = neighbor[0] - newPoint[0];
                            const dy = neighbor[1] - newPoint[1];
                            if (dx * dx + dy * dy < minRadius * minRadius) {
                                valid = false;
                                break;
                            }
                        }
                    }
                }
                if (!valid) break;
            }

            if (valid) {
                grid[gridY * gridWidth + gridX] = newPoint;
                active.push(newPoint);
                samples.push(newPoint);
                found = true;
                break;
            }
        }

        if (!found) {
            active.splice(activeIndex, 1);
        }
    }

    return samples;
}


function calculateVoronoiLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    const numVoronoiPoints = Math.min(images.length, Math.floor(20 + settings.cols * settings.cols * 1.5));
    let points: [number, number][] = [];

    // Generate points based on distribution
    switch (settings.voronoiDistribution) {
        case VoronoiDistribution.Organic: {
            const minRadius = Math.min(canvasWidth, canvasHeight) * settings.voronoiOrganicDistance;
            points = poissonDiskSampling(canvasWidth, canvasHeight, minRadius, random);
            break;
        }
        case VoronoiDistribution.Centered: {
            for (let i = 0; i < numVoronoiPoints; i++) {
                const angle = random() * 2 * Math.PI;
                const maxRadius = Math.min(canvasWidth, canvasHeight) / 2.2;
                const radius = Math.pow(random(), settings.voronoiCentralBias) * maxRadius;
                points.push([
                    canvasWidth / 2 + Math.cos(angle) * radius,
                    canvasHeight / 2 + Math.sin(angle) * radius,
                ]);
            }
            break;
        }
        case VoronoiDistribution.Sunflower: {
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            for (let i = 0; i < numVoronoiPoints; i++) {
                const r = Math.sqrt(i / numVoronoiPoints) * (Math.min(canvasWidth, canvasHeight) / 2.1);
                const theta = i * goldenAngle;
                let x = canvasWidth / 2 + r * Math.cos(theta);
                let y = canvasHeight / 2 + r * Math.sin(theta);
                
                const jitter = settings.voronoiPointJitter * (Math.min(canvasWidth, canvasHeight) * 0.05);
                x += (random() - 0.5) * jitter;
                y += (random() - 0.5) * jitter;
                points.push([x, y]);
            }
            break;
        }
        case VoronoiDistribution.Frame: {
            for (let i = 0; i < numVoronoiPoints; i++) {
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;
                const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
                
                const pointX = random() * canvasWidth;
                const pointY = random() * canvasHeight;

                const dx = pointX - centerX;
                const dy = pointY - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let x, y;
                if (dist > 0) {
                    const pullFactor = Math.pow(dist / maxRadius, 1 / settings.voronoiFrameFocus);
                    const newDist = maxRadius * pullFactor;
                    x = centerX + (dx / dist) * newDist;
                    y = centerY + (dy / dist) * newDist;
                } else {
                    x = centerX;
                    y = centerY;
                }
                points.push([x, y]);
            }
            break;
        }
        case VoronoiDistribution.Random: // Jittered Grid
        default:
            const gridDimJitter = Math.ceil(Math.sqrt(numVoronoiPoints));
            const cellWJitter = canvasWidth / gridDimJitter;
            const cellHJitter = canvasHeight / gridDimJitter;
            for (let i = 0; i < numVoronoiPoints; i++) {
                 const baseJX = (i % gridDimJitter) * cellWJitter + cellWJitter / 2;
                 const baseJY = Math.floor(i / gridDimJitter) * cellHJitter + cellHJitter / 2;
                 points.push([
                    baseJX + (random() - 0.5) * cellWJitter * settings.voronoiPointJitter,
                    baseJY + (random() - 0.5) * cellHJitter * settings.voronoiPointJitter,
                 ]);
            }
            break;
    }
    
    // Ensure points are within canvas bounds
    points = points.map(p => [
        Math.max(0, Math.min(canvasWidth, p[0])),
        Math.max(0, Math.min(canvasHeight, p[1]))
    ]);
    
    if (points.length === 0 || images.length === 0) return [];
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, canvasWidth, canvasHeight]);

    for (let i = 0; i < points.length; i++) {
        const cell = voronoi.cellPolygon(i);
        if (!cell || cell.length < 3) continue;

        const image = images[i % images.length];

        const [minX, minY, maxX, maxY] = cell.reduce(([minX, minY, maxX, maxY], p) => [
            Math.min(minX, p[0]), Math.min(minY, p[1]),
            Math.max(maxX, p[0]), Math.max(maxY, p[1]),
        ], [Infinity, Infinity, -Infinity, -Infinity]);

        const width = maxX - minX;
        const height = maxY - minY;
        
        if (width < 1 || height < 1) continue;

        const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);

        renderData.push({
            image,
            id: image.dataset.id!,
            x: minX, y: minY,
            width, height,
            rotation: 0,
            sx, sy, sWidth, sHeight,
            clip: (ctx: CanvasRenderingContext2D) => {
                const minDim = Math.min(width, height);
                const gap = settings.imageBorder ? settings.borderWidth : settings.spacing;

                if (gap > 0 && minDim > gap) {
                    const scale = Math.max(0, (minDim - gap) / minDim);
                    ctx.scale(scale, scale);
                }
                
                ctx.beginPath();
                ctx.moveTo(cell[0][0] - minX - width / 2, cell[0][1] - minY - height / 2);
                for (let j = 1; j < cell.length; j++) {
                    ctx.lineTo(cell[j][0] - minX - width / 2, cell[j][1] - minY - height / 2);
                }
                ctx.closePath();
            }
        });
    }

    return renderData;
}


function calculateCustomShapeLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings, shapeMaskData: ImageData | null): ImageRenderData[] {
    if (!shapeMaskData) {
        return []; // This layout requires a custom shape
    }

    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    let shapePoints: {x: number, y: number}[] = [];
    
    // Sample points from the mask based on density
    const maskW = shapeMaskData.width;
    const maskH = shapeMaskData.height;
    
    const canvasAspect = canvasWidth / canvasHeight;
    const numPointsX = Math.round(settings.shapeBurstDensity * Math.sqrt(canvasAspect));
    const numPointsY = Math.round(settings.shapeBurstDensity / Math.sqrt(canvasAspect));
    const stepX = maskW / numPointsX;
    const stepY = maskH / numPointsY;

    for (let y = 0; y < maskH; y += stepY) {
        for (let x = 0; x < maskW; x += stepX) {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            const i = (iy * maskW + ix) * 4;
            if (i >= shapeMaskData.data.length - 4) continue;

            const r = shapeMaskData.data[i];
            const isDark = r < settings.shapeMaskThreshold * 255;
            if (isDark !== settings.shapeMaskInvert) {
                    shapePoints.push({
                    x: (ix / maskW) * canvasWidth,
                    y: (iy / maskH) * canvasHeight
                });
            }
        }
    }
    
    if (shapePoints.length === 0) return [];

    // --- START: New Padding Logic ---
    let minPtX = Infinity, minPtY = Infinity, maxPtX = -Infinity, maxPtY = -Infinity;
    for (const pt of shapePoints) {
        minPtX = Math.min(minPtX, pt.x);
        minPtY = Math.min(minPtY, pt.y);
        maxPtX = Math.max(maxPtX, pt.x);
        // FIX: Corrected typo from maxY to maxPtY.
        maxPtY = Math.max(maxPtY, pt.y);
    }
    const shapeWidth = maxPtX - minPtX;
    const shapeHeight = maxPtY - minPtY;
    if (shapeWidth <= 0 || shapeHeight <= 0) return [];
    
    const paddingFraction = 0.1; // 10% padding
    const paddedCanvasWidth = canvasWidth * (1 - paddingFraction * 2);
    const paddedCanvasHeight = canvasHeight * (1 - paddingFraction * 2);
    
    const scale = Math.min(paddedCanvasWidth / shapeWidth, paddedCanvasHeight / shapeHeight);
    
    const newShapeWidth = shapeWidth * scale;
    const newShapeHeight = shapeHeight * scale;
    const offsetX = (canvasWidth - newShapeWidth) / 2;
    const offsetY = (canvasHeight - newShapeHeight) / 2;
    
    const transformedShapePoints = shapePoints.map(pt => ({
        x: ((pt.x - minPtX) * scale) + offsetX,
        y: ((pt.y - minPtY) * scale) + offsetY
    }));
    // --- END: New Padding Logic ---
    
    const cell_dim = Math.min(canvasWidth, canvasHeight) / settings.shapeBurstDensity;
    
    // Background grid using a subset of the images
    const bgImages = images.slice(0, Math.min(images.length, transformedShapePoints.length));
    bgImages.forEach((image, index) => {
        const point = transformedShapePoints[index];
        const width = cell_dim * 0.9;
        const height = cell_dim * 0.9;
        const x = point.x - width / 2;
        const y = point.y - height / 2;
        const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);
        renderData.push({ image, id: image.dataset.id!, x, y, width, height, rotation: 0, sx, sy, sWidth, sHeight });
    });

    if (settings.shapeBurstOrganicLayer) {
        for (let i = 0; i < settings.shapeBurstOrganicLayerCount; i++) {
            const point = transformedShapePoints[Math.floor(random() * transformedShapePoints.length)];
            const image = images[i % images.length];
            const sizeMultiplier = settings.shapeBurstOrganicLayerSizeMultiplier;
            const width = cell_dim * sizeMultiplier * (0.8 + random() * 0.4);
            const height = cell_dim * sizeMultiplier * (0.8 + random() * 0.4);
            let x = point.x - width/2 + (random() - 0.5) * cell_dim;
            let y = point.y - height/2 + (random() - 0.5) * cell_dim;
            const rotation = (random() - 0.5) * 45;

            x = Math.max(-width * 0.3, Math.min(x, canvasWidth - width * 0.7));
            y = Math.max(-height * 0.3, Math.min(y, canvasHeight - height * 0.7));

            const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);
            renderData.push({ image, id: image.dataset.id!, x, y, width, height, rotation, sx, sy, sWidth, sHeight });
        }
    }

    if (settings.shapeBurstForeground) {
        for (let i = 0; i < settings.shapeBurstForegroundCount; i++) {
            const point = transformedShapePoints[Math.floor(random() * transformedShapePoints.length)];
            const image = images[i % images.length];
            const sizeMultiplier = settings.shapeBurstForegroundSizeMultiplier;
            const width = cell_dim * sizeMultiplier * (0.8 + random() * 0.4);
            const height = cell_dim * sizeMultiplier * (0.8 + random() * 0.4);
            let x = point.x - width/2 + (random() - 0.5) * cell_dim * 2;
            let y = point.y - height/2 + (random() - 0.5) * cell_dim * 2;
            const rotation = (random() - 0.5) * 60;

            x = Math.max(-width * 0.3, Math.min(x, canvasWidth - width * 0.7));
            y = Math.max(-height * 0.3, Math.min(y, canvasHeight - height * 0.7));

            const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);
            renderData.push({ image, id: image.dataset.id!, x, y, width, height, rotation, sx, sy, sWidth, sHeight });
        }
    }
    
    return renderData;
}


function calculateTieredShapeLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    const tiers = settings.tieredTiers;
    let imageIndex = 0;
    if (images.length === 0) return [];

    const paddingFraction = 0.1; // 10% padding
    const paddedWidth = canvasWidth * (1 - paddingFraction * 2);
    const paddedHeight = canvasHeight * (1 - paddingFraction * 2);
    const size = Math.min(paddedWidth, paddedHeight);
    const offsetX = (canvasWidth - size) / 2;
    const offsetY = (canvasHeight - size) / 2;
    const radius = size / 2;
    const baseSize = size / tiers;

    for (let r = 0; r < tiers; r++) {
        for (let c = 0; c < tiers; c++) {
            const gridX = offsetX + (c + 0.5) * baseSize;
            const gridY = offsetY + (r + 0.5) * baseSize;

            const dx = gridX - (offsetX + radius);
            const dy = gridY - (offsetY + radius);

            let inShape = false;
            switch (settings.tieredShape) {
                case TieredShape.Circle:
                    if (Math.sqrt(dx * dx + dy * dy) < radius) inShape = true;
                    break;
                case TieredShape.Square:
                    if (Math.abs(dx) < radius && Math.abs(dy) < radius) inShape = true;
                    break;
                case TieredShape.Heart:
                    // Normalize coordinates for the heart equation
                    const hx = dx / (radius * 0.9);
                    const hy = -dy / (radius * 0.9); // y is inverted for heart equation
                    if (hx * hx + Math.pow(hy - Math.sqrt(Math.abs(hx)), 2) <= 1) {
                        inShape = true;
                    }
                    break;
            }

            if (inShape) {
                const image = images[imageIndex % images.length];
                const sizeVar = 1 - settings.tieredSizeVariation + random() * settings.tieredSizeVariation;
                const width = baseSize * sizeVar;
                const height = baseSize * sizeVar;

                const jitterX = (random() - 0.5) * baseSize * settings.organicVariation;
                const jitterY = (random() - 0.5) * baseSize * settings.organicVariation;
                const rotation = (random() - 0.5) * 20 * settings.organicVariation;

                const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);
                renderData.push({
                    image,
                    id: `${image.dataset.id}::clone::${imageIndex}`,
                    x: gridX - width / 2 + jitterX,
                    y: gridY - height / 2 + jitterY,
                    width, height,
                    rotation,
                    sx, sy, sWidth, sHeight,
                });
                imageIndex++;
            }
        }
    }
    return renderData;
}

function calculateKaleidoscopeLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    if (images.length === 0) return [];

    const { kaleidoscopeSectors, organicVariation } = settings;
    const angleStep = (2 * Math.PI) / kaleidoscopeSectors;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Create a base pile of images to be reflected. The chaos of this pile is controlled by the organicVariation slider.
    const numBaseImages = Math.max(5, Math.floor(images.length / 2));
    const basePileImages = Array.from({ length: numBaseImages }, (_, i) => images[i % images.length]);
    
    // The chaos/variation slider directly controls the properties of the base image pile.
    // Higher variation leads to a more chaotic pile (lower organization) and more size differences.
    const basePile = calculatePileLayout(basePileImages, canvasWidth, canvasHeight, {
        ...settings,
        pileOrganization: 1 - organicVariation,
        pileCardSize: 0.25,
        pileCardSizeVariation: 0.3 + organicVariation * 0.7, // Range from 0.3 to 1.0
    });

    for (let i = 0; i < kaleidoscopeSectors; i++) {
        const currentAngle = i * angleStep;
        const isReflected = i % 2 !== 0;

        basePile.forEach(item => {
            const baseItemX = item.x + item.width / 2 - centerX;
            const baseItemY = item.y + item.height / 2 - centerY;

            const reflectedX = isReflected ? -baseItemX : baseItemX;
            const reflectedRotation = isReflected ? -item.rotation : item.rotation;
            
            const cos = Math.cos(currentAngle);
            const sin = Math.sin(currentAngle);

            const rotatedX = reflectedX * cos - baseItemY * sin;
            const rotatedY = reflectedX * sin + baseItemY * cos;
            
            const finalRotation = reflectedRotation + (currentAngle * 180 / Math.PI);

            // Add final organic jitter to the reflected pieces for more variation
            const jitterX = (random() - 0.5) * canvasWidth * 0.05 * organicVariation;
            const jitterY = (random() - 0.5) * canvasHeight * 0.05 * organicVariation;

            renderData.push({
                ...item,
                id: `${item.id}::kaleido::${i}`,
                x: rotatedX + centerX - item.width / 2 + jitterX,
                y: rotatedY + centerY - item.height / 2 + jitterY,
                rotation: finalRotation
            });
        });
    }

    return renderData;
}


function calculateGoldenSpiralLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const { goldenSpiralScale, goldenSpiralOffset, spiralDensity, spiralType, spiralTightness } = settings;
    
    let angle = goldenSpiralOffset * Math.PI * 2;
    let imageIndex = 0;
    
    // ADJUSTED: Make the base spiral sizes more visually distinct and appealing.
    const a_log = (Math.min(canvasWidth, canvasHeight) / 25) * spiralTightness; // Golden: slightly larger start
    const a_arch = (Math.min(canvasWidth, canvasHeight) / 15) * spiralTightness; // Archimedean: more pronounced coils
    const a_fermat = Math.min(canvasWidth, canvasHeight) * 0.25 * spiralTightness; // Fermat: slightly larger
    const a_hyper = Math.max(canvasWidth, canvasHeight) * 1.5 * spiralTightness; // Hyperbolic: starts closer
    
    const maxDist = Math.sqrt(centerX*centerX + centerY*centerY) * 1.5;

    // Add a hero image in the center for Hyperbolic spiral
    if (spiralType === SpiralType.Hyperbolic && images.length > 0) {
        const heroImage = images[0];
        const heroAspect = getDeviceAspect(heroImage, settings.deviceType);
        const heroWidth = Math.min(canvasWidth, canvasHeight) * 0.4; // 40% of canvas
        const heroHeight = heroWidth / heroAspect;
        const { sx, sy, sWidth, sHeight } = getCropping(heroImage, heroWidth, heroHeight, settings.imageFit);

        renderData.push({
            image: heroImage,
            id: heroImage.dataset.id!,
            x: centerX - heroWidth / 2,
            y: centerY - heroHeight / 2,
            width: heroWidth,
            height: heroHeight,
            rotation: 0,
            sx, sy, sWidth, sHeight,
            z: 9999 // Ensure it's on top
        });
        
        // Start the spiral from the second image
        imageIndex = 1;
    }

    while (true) {
        const image = images[imageIndex % images.length];
        
        let radius = 0, dr_dtheta = 0, x_polar = 0, y_polar = 0;
        
        // --- STEP 1: Calculate radius and derivative based on the selected spiral type ---
        switch(spiralType) {
            case SpiralType.Golden: // Logarithmic spiral
                const phi = (1 + Math.sqrt(5)) / 2;
                const b = Math.log(phi) / (Math.PI / 2);
                radius = a_log * Math.exp(b * angle);
                dr_dtheta = b * radius;
                break;
            case SpiralType.Archimedean: // Archimedean spiral
                radius = a_arch * angle * 0.1;
                dr_dtheta = a_arch * 0.1;
                break;
            case SpiralType.Fermat: // Fermat's spiral
                radius = a_fermat * Math.sqrt(angle);
                dr_dtheta = (angle > 0) ? (a_fermat / (2 * Math.sqrt(angle))) : 0;
                break;
            case SpiralType.Hyperbolic: // Hyperbolic spiral
                const minAngle = 0.1;
                if (angle < minAngle) angle = minAngle; // Avoid division by zero
                radius = a_hyper / angle;
                dr_dtheta = -a_hyper / (angle * angle);
                break;
        }
        
        // --- STEP 2: Convert polar to Cartesian coordinates ---
        x_polar = radius * Math.cos(angle);
        y_polar = radius * Math.sin(angle);

        const dist = Math.sqrt(x_polar * x_polar + y_polar * y_polar);
        if (dist > maxDist) {
            break; // Stop when the spiral goes well off-screen
        }

        // --- STEP 3 & 4 Combined: Calculate rotation and size based on spiral type for more artistic results ---
        let rotation: number;
        let scale: number;
        
        const baseSize = Math.min(canvasWidth, canvasHeight) * 0.3; // Slightly larger base size

        switch(spiralType) {
            case SpiralType.Archimedean:
            case SpiralType.Fermat: {
                // For Mandala/Phyllotaxis patterns, a radial rotation looks more artistic.
                const radial_angle = Math.atan2(y_polar, x_polar);
                rotation = radial_angle * (180 / Math.PI) + 90;
                // Make images shrink as they move away from the center.
                scale = Math.pow(Math.max(0, 1 - dist / maxDist), 1.2);
                break;
            }
            case SpiralType.Hyperbolic: {
                // For the inward spiral, keep tangent rotation and make images GROW towards the center.
                const dx_dtheta = dr_dtheta * Math.cos(angle) - radius * Math.sin(angle);
                const dy_dtheta = dr_dtheta * Math.sin(angle) + radius * Math.cos(angle);
                rotation = Math.atan2(dy_dtheta, dx_dtheta) * (180 / Math.PI);
                scale = 0.1 + Math.pow(1 - (dist / maxDist), 1.5) * 1.5; // Grow from 0.1x to 1.6x
                break;
            }
            case SpiralType.Golden:
            default: {
                // For the classic Golden Spiral, keep tangent rotation and have a pronounced size falloff.
                const dx_dtheta = dr_dtheta * Math.cos(angle) - radius * Math.sin(angle);
                const dy_dtheta = dr_dtheta * Math.sin(angle) + radius * Math.cos(angle);
                rotation = Math.atan2(dy_dtheta, dx_dtheta) * (180 / Math.PI);
                // "Disappear at the edges" - use a power function for more dramatic shrinking.
                scale = Math.pow(Math.max(0, 1 - dist / maxDist), 1.5);
                break;
            }
        }
        
        if (scale <= 0.01) { // If image is too small, stop adding more
            if (spiralType !== SpiralType.Hyperbolic) { // Hyperbolic gets bigger, so this check is for outward spirals
                break;
            }
        }

        // --- Determine image dimensions ---
        const imageAspect = getDeviceAspect(image, settings.deviceType);
        let width = baseSize * scale;
        let height = width / imageAspect;

        const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);

        renderData.push({
            image,
            id: image.dataset.id!,
            x: centerX + x_polar - width / 2,
            y: centerY + y_polar - height / 2,
            width, height, rotation,
            sx, sy, sWidth, sHeight,
            z: spiralType === SpiralType.Hyperbolic ? -imageIndex : imageIndex // Reverse z-index for inward spiral
        });
        
        angle += spiralDensity * 0.2;
        imageIndex++;

        if(imageIndex > 500) break; // Safety break
    }

    // Apply global scale for zoom effect
    if (goldenSpiralScale !== 1.0) {
        renderData.forEach(item => {
            const dx = item.x + item.width / 2 - centerX;
            const dy = item.y + item.height / 2 - centerY;
            item.x = centerX + dx * goldenSpiralScale - (item.width * goldenSpiralScale) / 2;
            item.y = centerY + dy * goldenSpiralScale - (item.height * goldenSpiralScale) / 2;
            item.width *= goldenSpiralScale;
            item.height *= goldenSpiralScale;
        });
    }

    return renderData.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}

function calculateJournalLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    const { journalOverlap, journalRowVariation } = settings;
    if (images.length === 0) return [];
    
    // Cap columns to image count to prevent empty columns.
    const cols = Math.max(1, Math.min(settings.cols, images.length));

    const colWidth = (canvasWidth - (cols + 1) * settings.spacing) / cols;
    const colHeights = Array(cols).fill(settings.spacing);

    let imageIndex = 0;
    // Keep filling until a reasonable height is reached or we run out of images to place for the first time
    while (imageIndex < images.length) {
        const image = images[imageIndex];
        
        const imageAspect = getDeviceAspect(image, settings.deviceType);
        // Apply row variation for a more organic, scrapbook feel.
        const heightVariation = 1 + (random() - 0.5) * journalRowVariation;
        const imgHeight = (colWidth / imageAspect) * heightVariation;

        let targetCol = 0;
        let minColHeight = colHeights[0];
        for (let i = 1; i < cols; i++) {
            if (colHeights[i] < minColHeight) {
                minColHeight = colHeights[i];
                targetCol = i;
            }
        }

        const x = settings.spacing + targetCol * (colWidth + settings.spacing);
        
        const y_offset = (imgHeight * journalOverlap * (random() * 0.5 + 0.5));
        const y = colHeights[targetCol] - y_offset;

        const { sx, sy, sWidth, sHeight } = getCropping(image, colWidth, imgHeight, settings.imageFit);
        
        const rotation = (random() - 0.5) * 8;

        renderData.push({
            image,
            id: image.dataset.id!,
            x, y,
            width: colWidth,
            height: imgHeight,
            rotation, sx, sy, sWidth, sHeight
        });
        
        colHeights[targetCol] = y + imgHeight + settings.spacing;
        imageIndex++;
    }

    if (renderData.length === 0) return [];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    renderData.forEach(d => {
        minX = Math.min(minX, d.x);
        minY = Math.min(minY, d.y);
        maxX = Math.max(maxX, d.x + d.width);
        maxY = Math.max(maxY, d.y + d.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    if (contentWidth > 0 && contentHeight > 0) {
        const scaleX = canvasWidth / contentWidth;
        const scaleY = canvasHeight / contentHeight;
        const scale = Math.max(scaleX, scaleY); 

        const newContentWidth = contentWidth * scale;
        const newContentHeight = contentHeight * scale;
        const offsetX = (canvasWidth - newContentWidth) / 2;
        const offsetY = (canvasHeight - newContentHeight) / 2;

        renderData.forEach(d => {
            d.x = (d.x - minX) * scale + offsetX;
            d.y = (d.y - minY) * scale + offsetY;
            d.width *= scale;
            d.height *= scale;
        });
    }

    return renderData;
}

function calculateCircularLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    const random = seededRandom(settings.seed);
    if (images.length === 0) return [];

    const numImages = images.length;
    const numRings = settings.circularRings;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.45;

    let imagesPerRing = Array(numRings).fill(0);
    let totalRatio = 0;
    for (let i = 0; i < numRings; i++) {
        // Outer rings get more images
        const ratio = (i + 1);
        imagesPerRing[i] = ratio;
        totalRatio += ratio;
    }
    
    let assignedImages = 0;
    for (let i = 0; i < numRings; i++) {
        const count = Math.round((imagesPerRing[i] / totalRatio) * numImages);
        imagesPerRing[i] = count;
        assignedImages += count;
    }
    // Distribute remainder
    let remainder = numImages - assignedImages;
    let ringIdx = numRings - 1;
    while(remainder > 0) {
        imagesPerRing[ringIdx]++;
        remainder--;
        ringIdx = (ringIdx - 1 + numRings) % numRings;
    }
    
    let imageIndex = 0;
    for (let r = 0; r < numRings; r++) {
        let ringRadius = (maxRadius / numRings) * (r + 0.8);
        const countInRing = imagesPerRing[r];
        if (countInRing === 0) continue;

        const angleStep = (2 * Math.PI) / countInRing;

        // Calculate size based on circumference to avoid overlap
        const circumference = 2 * Math.PI * ringRadius;
        const maxImgWidth = (circumference / countInRing) - settings.spacing;

        for (let i = 0; i < countInRing; i++) {
            if (imageIndex >= numImages) break;
            const image = images[imageIndex];
            const imageAspect = getDeviceAspect(image, settings.deviceType);

            let angle = i * angleStep;

            if (settings.circularPattern === CircularPattern.SpiderWeb) {
                // Alternate radius for a web-like effect
                ringRadius = (maxRadius / numRings) * (r + 0.8 + (i % 2) * 0.4);
                 // Add tangential offset
                angle += (angleStep / 2) * (r % 2);
            }

            let width = maxImgWidth;
            let height = width / imageAspect;

            const x = centerX + ringRadius * Math.cos(angle) - width / 2;
            const y = centerY + ringRadius * Math.sin(angle) - height / 2;
            
            const rotation = angle * (180 / Math.PI) + 90; // Point outwards
            
            const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);

            renderData.push({
                image,
                id: image.dataset.id!,
                x, y, width, height, rotation, sx, sy, sWidth, sHeight
            });
            imageIndex++;
        }
    }
    return renderData;
}

function calculateOrbitalLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];
    
    const numImages = images.length;
    const { orbitalFocus, orbitalRadius, orbitalTilt, orbitalLightAngle, orbitalDoF } = settings;
    const focalLength = orbitalFocus;
    const radius = orbitalRadius;
    const tiltAngle = orbitalTilt * (Math.PI / 180);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Lighting setup
    const lightAngleRad = orbitalLightAngle * (Math.PI / 180);
    const lightDir = {
        x: Math.cos(lightAngleRad),
        y: Math.sin(lightAngleRad),
        z: 0.5
    };
    const lightMag = Math.sqrt(lightDir.x**2 + lightDir.y**2 + lightDir.z**2);
    const normalizedLightDir = { x: lightDir.x/lightMag, y: lightDir.y/lightMag, z: lightDir.z/lightMag };


    // Use Fibonacci sphere (or golden spiral method) to distribute points evenly on a sphere.
    const phi = Math.PI * (3.0 - Math.sqrt(5.0)); // Golden angle in radians

    for (let i = 0; i < numImages; i++) {
        const image = images[i];
        
        // 3D point on a unit sphere
        const y_sphere = 1 - (i / (numImages - 1)) * 2; // y goes from 1 to -1
        const radius_at_y = Math.sqrt(1 - y_sphere * y_sphere); // radius at y
        const theta = phi * i; // golden angle increment

        let x3d = Math.cos(theta) * radius_at_y * radius;
        let y3d = y_sphere * radius;
        let z3d = Math.sin(theta) * radius_at_y * radius;

        // Apply vertical tilt rotation around X-axis
        const cosTilt = Math.cos(tiltAngle);
        const sinTilt = Math.sin(tiltAngle);
        const y_rot = y3d * cosTilt - z3d * sinTilt;
        const z_rot = y3d * sinTilt + z3d * cosTilt;

        // Perspective projection
        const scale = focalLength / (focalLength - z_rot);
        const x2d = x3d * scale + centerX;
        const y2d = y_rot * scale + centerY;

        const imgAspect = getDeviceAspect(image, settings.deviceType);
        const baseSize = Math.min(canvasWidth, canvasHeight) * 0.2;
        const width = baseSize * scale;
        const height = width / imgAspect;

        const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, settings.imageFit);
        
        // Calculate lighting based on normal vector
        const normalMag = Math.sqrt(x3d**2 + y_rot**2 + z_rot**2);
        const normal = { x: x3d/normalMag, y: y_rot/normalMag, z: z_rot/normalMag };
        const dotProduct = normal.x * normalizedLightDir.x + normal.y * normalizedLightDir.y + normal.z * normalizedLightDir.z;
        const brightness = (dotProduct + 1) / 2; // Remap from [-1, 1] to [0, 1]

        // Calculate Depth of Field blur
        // Focal plane is at the front of the sphere (z_rot = -radius)
        const distFromFocalPlane = (z_rot + radius);
        const blur = (distFromFocalPlane / (2 * radius)) * orbitalDoF;
        
        renderData.push({
            image,
            id: image.dataset.id!,
            x: x2d - width / 2,
            y: y2d - height / 2,
            width, height,
            rotation: 0,
            sx, sy, sWidth, sHeight,
            z: z_rot,
            brightness,
            blur
        });
    }

    // Apply global scale for zoom effect
    if (settings.orbitalScale !== 1.0) {
        renderData.forEach(item => {
            const dx = item.x + item.width / 2 - centerX;
            const dy = item.y + item.height / 2 - centerY;
            item.x = centerX + dx * settings.orbitalScale - (item.width * settings.orbitalScale) / 2;
            item.y = centerY + dy * settings.orbitalScale - (item.height * settings.orbitalScale) / 2;
            item.width *= settings.orbitalScale;
            item.height *= settings.orbitalScale;
        });
    }

    // Sort by z-index so closer images are drawn on top
    return renderData.sort((a, b) => (a.z || 0) - (b.z || 0));
}



// --- NEW MOCKUP LAYOUTS ---

function getDeviceAspect(image: HTMLImageElement, deviceType: string): number {
    if (deviceType === 'phone') return 9 / 19.5; // Modern phone aspect ratio
    if (deviceType === 'laptop') return 16 / 10; // Modern laptop aspect ratio
    return image.naturalWidth / image.naturalHeight || 1;
}

function calculateShowcaseLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Main Hero Image - Balanced size
    const heroW = Math.min(canvasWidth, canvasHeight) * 0.48;
    const heroAspect = getDeviceAspect(images[0], settings.deviceType);
    const heroH = heroW / heroAspect;
    
    const { sx: hsx, sy: hsy, sWidth: hsw, sHeight: hsh } = getCropping(images[0], heroW, heroH, settings.imageFit);
    
    renderData.push({
        image: images[0],
        id: images[0].dataset.id!,
        x: centerX - heroW / 2,
        y: centerY - heroH / 2,
        width: heroW, height: heroH,
        rotation: (settings.mockupAngle - 50) * 0.1,
        sx: hsx, sy: hsy, sWidth: hsw, sHeight: hsh,
        brightness: 1,
        _zIndex: 100,
    } as any);

    // Supporting images arranged in a clean fan/arc behind
    const others = images.slice(1);
    const numOthers = others.length;
    if (numOthers === 0) return renderData;

    const maxOthers = Math.min(numOthers, 24);
    const sideW = heroW * 0.55;
    const spacing = sideW * (settings.mockupSpacing / 100);

    for (let i = 0; i < maxOthers; i++) {
        const img = others[i];
        const aspect = getDeviceAspect(img, settings.deviceType);
        const w = sideW;
        const h = w / aspect;

        // Arrange in a clean symmetrical arc behind the hero
        const arcAngle = Math.PI * (0.8 + Math.min(maxOthers / 30, 0.2)); 
        const angle = (i / (maxOthers - 1 || 1)) * arcAngle - arcAngle / 2 - Math.PI / 2;
        
        // Stagger radius for a more "fan" look
        const radius = heroW * (0.7 + (i % 2 === 0 ? 0.08 : 0)) + spacing;
        
        const x = centerX + Math.cos(angle) * radius - w / 2;
        const y = centerY + Math.sin(angle) * radius - h / 2;

        const { sx, sy, sWidth, sHeight } = getCropping(img, w, h, settings.imageFit);

        renderData.push({
            image: img,
            id: img.dataset.id!,
            x, y,
            width: w, height: h,
            rotation: (angle + Math.PI / 2) * (180 / Math.PI) * 0.4 + (settings.mockupAngle - 50) * 0.2,
            sx, sy, sWidth, sHeight,
            brightness: 0.9,
            _zIndex: 10 + i,
        } as any);
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculateIsometricLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    // Determine grid dimensions based on image count and canvas aspect
    let cols = Math.ceil(Math.sqrt(numImages * (canvasWidth / canvasHeight)));
    if (numImages <= 3) cols = numImages;
    const rows = Math.ceil(numImages / cols);

    const baseW = Math.min(canvasWidth / (cols + rows), canvasHeight / (cols + rows)) * 1.5;
    const gap = baseW * (settings.mockupSpacing / 100) * 0.6;
    
    // Isometric projection constants (30 degrees)
    const angle = Math.PI / 6;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Calculate total grid dimensions to center it precisely
    const gridW = (cols * (baseW + gap) * cosA) + (rows * (baseW + gap) * cosA);
    const gridH = (cols * (baseW + gap) * sinA) + (rows * (baseW + gap) * sinA);
    
    // Center point of the canvas
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    for (let i = 0; i < numImages; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const aspect = getDeviceAspect(images[i], settings.deviceType);
        const w = baseW;
        const h = w / aspect;

        // True isometric positioning relative to center
        const isoX = (col - (cols - 1) / 2) * (baseW + gap) * cosA - (row - (rows - 1) / 2) * (baseW + gap) * cosA;
        const isoY = (col - (cols - 1) / 2) * (baseW + gap) * sinA + (row - (rows - 1) / 2) * (baseW + gap) * sinA;

        const x = centerX + isoX - w / 2;
        const y = centerY + isoY - h / 2;

        const { sx, sy, sWidth, sHeight } = getCropping(images[i], w, h, settings.imageFit);

        renderData.push({
            image: images[i],
            id: images[i].dataset.id!,
            x, y,
            width: w, height: h,
            rotation: -30 + (settings.mockupAngle - 50) * 0.2,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (row + col) * 0.05,
            _zIndex: row + col,
        } as any);
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculateCoverFlowLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const baseSize = Math.min(canvasWidth, canvasHeight) * 0.5;
    
    // Sliders
    const spacing = baseSize * (settings.mockupSpacing / 50);
    const tilt = settings.mockupAngle;

    const centerIdx = Math.floor(numImages / 2);

    for (let i = 0; i < numImages; i++) {
        const image = images[i];
        const aspect = getDeviceAspect(image, settings.deviceType);
        
        const distFromCenter = i - centerIdx;
        const absDist = Math.abs(distFromCenter);
        
        const scale = Math.max(0.4, 1 - absDist * 0.2);
        const w = baseSize * scale;
        const h = w / aspect;
        
        const xOffset = Math.sign(distFromCenter) * (Math.pow(absDist, 0.8) * spacing);
        const x = centerX + xOffset - w / 2;
        const y = centerY - h / 2;
        
        const { sx, sy, sWidth, sHeight } = getCropping(image, w, h, settings.imageFit);
        
        renderData.push({
            image,
            id: image.dataset.id!,
            x, y,
            width: w, height: h,
            rotation: distFromCenter * (tilt !== 0 ? tilt : 5),
            sx, sy, sWidth, sHeight,
            brightness: 1 - (absDist * 0.15),
            _zIndex: -absDist,
        } as any);
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculateCarouselLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const baseSize = Math.min(canvasWidth, canvasHeight) * 0.5;
    const spacing = baseSize * (settings.mockupSpacing / 50);
    const tilt = settings.mockupAngle;

    const centerIdx = Math.floor(numImages / 2);

    for (let i = 0; i < numImages; i++) {
        const image = images[i];
        const aspect = getDeviceAspect(image, settings.deviceType);
        
        const distFromCenter = i - centerIdx;
        const absDist = Math.abs(distFromCenter);
        
        const scale = Math.max(0.6, 1 - absDist * 0.15);
        const w = baseSize * scale;
        const h = w / aspect;
        
        const x = centerX + (distFromCenter * spacing) - w / 2;
        const y = centerY - h / 2;
        
        const { sx, sy, sWidth, sHeight } = getCropping(image, w, h, settings.imageFit);
        
        renderData.push({
            image,
            id: image.dataset.id!,
            x, y,
            width: w, height: h,
            rotation: tilt,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (absDist * 0.1),
            _zIndex: -absDist,
        } as any);
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculateMockupWallLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const aspect = getDeviceAspect(images[0], settings.deviceType);
    
    // Calculate optimal grid columns
    let cols = Math.ceil(Math.sqrt(numImages * (canvasWidth / canvasHeight)));
    if (numImages <= 3) cols = numImages;
    const rows = Math.ceil(numImages / cols);

    const spacing = (canvasWidth / cols) * (settings.mockupSpacing / 100);
    const w = (canvasWidth - (cols + 1) * spacing) / cols;
    const h = w / aspect;

    const totalW = cols * w + (cols - 1) * spacing;
    const totalH = rows * h + (rows - 1) * spacing;

    const startX = (canvasWidth - totalW) / 2;
    const startY = (canvasHeight - totalH) / 2;

    for (let i = 0; i < numImages; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        // Stagger effect: shift every other column slightly
        const staggerY = (col % 2 === 0) ? 0 : h * 0.15;

        const x = startX + col * (w + spacing);
        const y = startY + row * (h + spacing) + staggerY;

        const { sx, sy, sWidth, sHeight } = getCropping(images[i], w, h, settings.imageFit);

        // Subtle perspective tilt based on column
        const tiltX = (col - (cols - 1) / 2) * 2;

        renderData.push({
            image: images[i],
            id: images[i].dataset.id!,
            x, y, width: w, height: h,
            rotation: tiltX + (settings.mockupAngle - 50) * 0.1,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (Math.abs(col - (cols - 1) / 2) * 0.02),
            _zIndex: i,
        } as any);
    }

    return renderData;
}

function calculateIsometricGridLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    let cols = Math.ceil(Math.sqrt(numImages));
    if (numImages <= 3) cols = numImages;
    const rows = Math.ceil(numImages / cols);

    const baseW = Math.min(canvasWidth, canvasHeight) * 0.25;
    const gap = baseW * (settings.mockupSpacing / 100) * 0.5;
    
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Calculate total height of the isometric diamond for centering
    const totalIsoH = (cols + rows - 2) * (baseW + gap) * 0.25;

    for (let i = 0; i < numImages; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const img = images[i];
        const aspect = getDeviceAspect(img, settings.deviceType);
        const w = baseW;
        const h = w / aspect;

        // True 2:1 Isometric projection positioning
        const isoX = (col - row) * (baseW + gap) * 0.5;
        const isoY = (col + row) * (baseW + gap) * 0.25;

        const x = centerX + isoX - w / 2;
        const y = centerY + isoY - totalIsoH / 2 - h / 2;

        const { sx, sy, sWidth, sHeight } = getCropping(img, w, h, settings.imageFit);

        renderData.push({
            image: img,
            id: img.dataset.id!,
            x, y, width: w, height: h,
            rotation: -26.5 + (settings.mockupAngle - 50) * 0.4,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (row + col) * 0.05,
            _zIndex: row + col,
        } as any);
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculateStaggeredRowsLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const rows = numImages > 15 ? 4 : (numImages > 8 ? 3 : 2);
    const itemsPerRow = Math.ceil(numImages / rows);

    const baseH = canvasHeight / (rows + 1);
    const spacing = baseH * (settings.mockupSpacing / 100);

    for (let r = 0; r < rows; r++) {
        const rowItems = (r === rows - 1) ? numImages - r * itemsPerRow : itemsPerRow;
        const rowOffset = (r % 2 === 0 ? 0 : baseH * 0.5);
        
        for (let c = 0; c < rowItems; c++) {
            const idx = r * itemsPerRow + c;
            if (idx >= numImages) break;

            const aspect = getDeviceAspect(images[idx], settings.deviceType);
            const h = baseH;
            const w = h * aspect;

            const x = (c * (w + spacing)) - (rowItems * (w + spacing)) / 2 + canvasWidth / 2 + rowOffset;
            const y = (r * (h + spacing)) - (rows * (h + spacing)) / 2 + canvasHeight / 2;

            const { sx, sy, sWidth, sHeight } = getCropping(images[idx], w, h, settings.imageFit);

            renderData.push({
                image: images[idx],
                id: images[idx].dataset.id!,
                x, y,
                width: w, height: h,
                rotation: (settings.mockupAngle - 50) * 0.3,
                sx, sy, sWidth, sHeight,
                brightness: 1,
                _zIndex: idx,
            } as any);
        }
    }

    return renderData;
}

function calculateFloatingCloudLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const random = seededRandom(settings.seed);
    
    // Increased spread for a less "grouped" feel
    const spread = Math.min(canvasWidth, canvasHeight) * 0.45 * (1 + settings.mockupSpacing / 50);
    const baseW = Math.min(canvasWidth, canvasHeight) * 0.3;

    for (let i = 0; i < numImages; i++) {
        // Golden angle distribution for natural organic feel
        const angle = i * 2.39996 + (random() * 0.4 - 0.2); 
        const radius = Math.pow(i / numImages, 0.6) * spread;
        
        const xPos = centerX + Math.cos(angle) * radius;
        const yPos = centerY + Math.sin(angle) * radius;

        const aspect = getDeviceAspect(images[i], settings.deviceType);
        // Vary size and rotation more for a "cloud" feel
        const sizeVar = 0.8 + random() * 0.4;
        const w = baseW * sizeVar * (1 - (i / numImages) * 0.2);
        const h = w / aspect;

        const { sx, sy, sWidth, sHeight } = getCropping(images[i], w, h, settings.imageFit);

        renderData.push({
            image: images[i],
            id: images[i].dataset.id!,
            x: xPos - w / 2,
            y: yPos - h / 2,
            width: w, height: h,
            rotation: (random() * 20 - 10) + (settings.mockupAngle - 50) * 0.2,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (i / numImages) * 0.1,
            _zIndex: numImages - i,
        } as any);
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculatePerspectiveGridLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    let cols = Math.ceil(Math.sqrt(numImages * (canvasWidth / canvasHeight)));
    if (numImages <= 4) cols = numImages;
    const rows = Math.ceil(numImages / cols);

    const baseW = canvasWidth * 0.25;
    const spacing = baseW * (settings.mockupSpacing / 100) * 0.5;
    
    // Calculate total height by summing up row heights with perspective
    let totalHeight = 0;
    const rowHeights: number[] = [];
    for (let r = 0; r < rows; r++) {
        const scale = 1 - (r * 0.15);
        const h = (baseW * scale) / 0.6; // Assuming 0.6 aspect for representative height
        rowHeights.push(h);
        totalHeight += h + (r < rows - 1 ? spacing * scale : 0);
    }

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const startY = centerY - totalHeight / 2;

    let currentY = startY;
    for (let r = 0; r < rows; r++) {
        const scale = 1 - (r * 0.15);
        const rowW = cols * (baseW * scale) + (cols - 1) * (spacing * scale);
        const startX = centerX - rowW / 2;
        
        for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            if (i >= numImages) break;

            const img = images[i];
            const aspect = getDeviceAspect(img, settings.deviceType);
            const w = baseW * scale;
            const h = w / aspect;

            const x = startX + c * (w + spacing * scale);
            const y = currentY;

            const { sx, sy, sWidth, sHeight } = getCropping(img, w, h, settings.imageFit);

            renderData.push({
                image: img,
                id: img.dataset.id!,
                x, y, width: w, height: h,
                rotation: (settings.mockupAngle - 50) * 0.1,
                sx, sy, sWidth, sHeight,
                brightness: 1 - (r * 0.1),
                _zIndex: -r,
            } as any);
        }
        currentY += rowHeights[r] + spacing * scale;
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculateFloatingLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const baseSize = Math.min(canvasWidth, canvasHeight) * 0.4;
    const spreadX = canvasWidth * 0.3;
    const spreadY = canvasHeight * 0.2;

    for (let i = 0; i < numImages; i++) {
        const image = images[i];
        const aspect = getDeviceAspect(image, settings.deviceType);
        
        // Pseudo-random but deterministic distribution
        const angle = (i / numImages) * Math.PI * 2;
        const radius = (i % 2 === 0 ? 0.5 : 1) * spreadX;
        
        const scale = 0.7 + ((i * 13) % 10) / 30; // Random scale between 0.7 and 1.0
        const w = baseSize * scale;
        const h = w / aspect;
        
        // Center the first image, float the rest
        let x = centerX - w / 2;
        let y = centerY - h / 2;
        
        if (i > 0) {
            x += Math.cos(angle) * radius;
            y += Math.sin(angle) * spreadY + ((i % 3) - 1) * spreadY * 0.5;
        }
        
        const rotation = ((i * 7) % 20) - 10; // Random rotation between -10 and 10
        
        const { sx, sy, sWidth, sHeight } = getCropping(image, w, h, settings.imageFit);
        
        renderData.push({
            image,
            id: image.dataset.id!,
            x, y,
            width: w, height: h,
            rotation: i === 0 ? 0 : rotation,
            sx, sy, sWidth, sHeight,
            brightness: i === 0 ? 1 : 0.8,
            _zIndex: i === 0 ? 100 : i, // Keep first image on top
        } as any);
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculateFreeformLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const baseSize = Math.min(canvasWidth, canvasHeight) * 0.3;

    images.forEach((image, i) => {
        const id = image.dataset.id!;
        const aspect = getDeviceAspect(image, settings.deviceType);
        
        // Default position: simple grid if no overrides
        const cols = Math.ceil(Math.sqrt(numImages));
        const rows = Math.ceil(numImages / cols);
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const w = baseSize;
        const h = w / aspect;
        
        const x = (col + 0.5) * (canvasWidth / cols) - w / 2;
        const y = (row + 0.5) * (canvasHeight / rows) - h / 2;

        const { sx, sy, sWidth, sHeight } = getCropping(image, w, h, settings.imageFit);

        renderData.push({
            image,
            id,
            x, y,
            width: w, height: h,
            rotation: 0,
            sx, sy, sWidth, sHeight
        });
    });

    return renderData;
}

function calculateMockupSpiralLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const baseW = Math.min(canvasWidth, canvasHeight) * 0.35;
    const spacing = settings.mockupSpacing / 100;

    for (let i = 0; i < numImages; i++) {
        // Logarithmic spiral for more "premium" feel
        const angle = 0.7 * i * (1 + spacing * 0.5);
        const radius = (baseW * 0.3) * Math.pow(1.1, i * (1 + spacing * 0.2));
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const img = images[i];
        const aspect = getDeviceAspect(img, settings.deviceType);
        // Scale down as it goes out
        const w = baseW * (1 - (i / numImages) * 0.4);
        const h = w / aspect;

        const { sx, sy, sWidth, sHeight } = getCropping(img, w, h, settings.imageFit);

        renderData.push({
            image: img,
            id: img.dataset.id!,
            x: x - w / 2,
            y: y - h / 2,
            width: w, height: h,
            rotation: (angle * 180 / Math.PI) * 0.2 + (settings.mockupAngle - 50) * 0.4,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (i / numImages) * 0.2,
            _zIndex: numImages - i,
        } as any);
    }

    return renderData.sort((a: any, b: any) => a._zIndex - b._zIndex);
}

function calculateMockupDiagonalLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const baseW = Math.min(canvasWidth, canvasHeight) * 0.42;
    const spacing = settings.mockupSpacing / 50;
    
    // Premium diagonal with depth
    const stepX = baseW * 0.4 * spacing;
    const stepY = baseW * 0.2 * spacing;

    const totalW = baseW + (numImages - 1) * stepX;
    const totalH = (baseW / 0.6) + (numImages - 1) * stepY;

    const startX = (canvasWidth - totalW) / 2;
    const startY = (canvasHeight - totalH) / 2;

    for (let i = 0; i < numImages; i++) {
        const img = images[i];
        const aspect = getDeviceAspect(img, settings.deviceType);
        // Slight scale variation for depth
        const scale = 1 - (i * 0.05);
        const w = baseW * scale;
        const h = w / aspect;

        const x = startX + i * stepX;
        const y = startY + i * stepY;

        const { sx, sy, sWidth, sHeight } = getCropping(img, w, h, settings.imageFit);

        renderData.push({
            image: img,
            id: img.dataset.id!,
            x, y, width: w, height: h,
            rotation: -12 + i * 3 + (settings.mockupAngle - 50) * 0.2,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (i * 0.04),
            _zIndex: i,
        } as any);
    }

    return renderData;
}

function calculateMockupCascadeLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const baseW = canvasWidth * 0.35;
    const stepX = baseW * 0.4 * (settings.mockupSpacing / 50);
    const stepY = baseW * 0.2 * (settings.mockupSpacing / 50);

    const totalW = baseW + (numImages - 1) * stepX;
    const totalH = (baseW / 0.6) + (numImages - 1) * stepY;

    const startX = (canvasWidth - totalW) / 2;
    const startY = (canvasHeight - totalH) / 2;

    for (let i = 0; i < numImages; i++) {
        const img = images[i];
        const aspect = getDeviceAspect(img, settings.deviceType);
        const w = baseW;
        const h = w / aspect;

        const x = startX + i * stepX;
        const y = startY + i * stepY;

        const { sx, sy, sWidth, sHeight } = getCropping(img, w, h, settings.imageFit);

        renderData.push({
            image: img,
            id: img.dataset.id!,
            x, y, width: w, height: h,
            rotation: -15 + (settings.mockupAngle - 50) * 0.3,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (i * 0.05),
            _zIndex: i,
        } as any);
    }

    return renderData;
}

function calculateMockupGrid3DLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    let cols = Math.ceil(Math.sqrt(numImages * (canvasWidth / canvasHeight)));
    if (numImages <= 3) cols = numImages;
    const rows = Math.ceil(numImages / cols);

    const spacing = (canvasWidth / cols) * (settings.mockupSpacing / 100);
    const w = (canvasWidth * 0.8 - (cols - 1) * spacing) / cols;
    const aspect = getDeviceAspect(images[0], settings.deviceType);
    const h = w / aspect;

    const totalW = cols * w + (cols - 1) * spacing;
    const totalH = rows * h + (rows - 1) * spacing;

    const startX = (canvasWidth - totalW) / 2;
    const startY = (canvasHeight - totalH) / 2;

    for (let i = 0; i < numImages; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = startX + col * (w + spacing);
        const y = startY + row * (h + spacing);

        const { sx, sy, sWidth, sHeight } = getCropping(images[i], w, h, settings.imageFit);

        // Apply a 3D perspective tilt
        const tiltX = (col - (cols - 1) / 2) * 5;
        const tiltY = (row - (rows - 1) / 2) * 5;

        renderData.push({
            image: images[i],
            id: images[i].dataset.id!,
            x, y, width: w, height: h,
            rotation: tiltX + tiltY + (settings.mockupAngle - 50) * 0.2,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (row * 0.03),
            _zIndex: i,
        } as any);
    }

    return renderData;
}

function calculateMockupStackLayout(images: HTMLImageElement[], canvasWidth: number, canvasHeight: number, settings: Settings): ImageRenderData[] {
    const renderData: ImageRenderData[] = [];
    if (images.length === 0) return [];

    const numImages = images.length;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const baseW = Math.min(canvasWidth, canvasHeight) * 0.45;
    const spacing = (settings.mockupSpacing / 100) * 40;

    for (let i = 0; i < numImages; i++) {
        const img = images[i];
        const aspect = getDeviceAspect(img, settings.deviceType);
        const w = baseW;
        const h = w / aspect;

        // Neat stack with slight offsets
        const offset = (i - (numImages - 1) / 2) * spacing;
        const x = centerX + offset - w / 2;
        const y = centerY + offset * 0.3 - h / 2;

        const { sx, sy, sWidth, sHeight } = getCropping(img, w, h, settings.imageFit);

        renderData.push({
            image: img,
            id: img.dataset.id!,
            x, y, width: w, height: h,
            rotation: (i - (numImages - 1) / 2) * 5 + (settings.mockupAngle - 50) * 0.3,
            sx, sy, sWidth, sHeight,
            brightness: 1 - (i * 0.02),
            _zIndex: i,
        } as any);
    }

    return renderData;
}

export const calculateLayout = (
  images: HTMLImageElement[],
  canvasWidth: number,
  canvasHeight: number,
  settings: Settings,
  shapeMaskData: ImageData | null
): ImageRenderData[] => {
  if (images.length === 0) return [];

  const validImages = images.filter(img => img.naturalWidth > 0 && img.naturalHeight > 0);
  if (validImages.length === 0) {
      return [];
  }
  
  // Apply multiplier for all layouts to increase density.
  const targetCount = Math.max(1, Math.ceil(validImages.length * settings.imageMultiplier));
  const imagesToUse = Array.from({ length: targetCount }, (_, i) => {
      const originalImage = validImages[i % validImages.length];
      const newImage = originalImage.cloneNode() as HTMLImageElement;
      newImage.dataset.id = `${originalImage.dataset.id}::clone::${i}`;
      return newImage;
  });
  const random = seededRandom(settings.seed);
  const imagesToProcess = [...imagesToUse].sort(() => random() - 0.5);

  const canvasPadding = settings.canvasPadding || 0;
  const effectiveWidth = canvasWidth - canvasPadding * 2;
  const effectiveHeight = canvasHeight - canvasPadding * 2;

  let finalRenderData: ImageRenderData[];

  switch (settings.layout) {
    case LayoutType.Grid:
      finalRenderData = calculateGridLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Mosaic:
      finalRenderData = calculateMosaicRowsLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Pile:
      finalRenderData = calculatePileLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Wall3D:
      finalRenderData = calculateWall3DLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Tiled:
      finalRenderData = calculateTiledLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Fractal:
      finalRenderData = calculateFractalLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Voronoi:
      finalRenderData = calculateVoronoiLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.CustomShape:
      finalRenderData = calculateCustomShapeLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings, shapeMaskData);
      break;
    case LayoutType.TieredShape:
      finalRenderData = calculateTieredShapeLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Kaleidoscope:
        finalRenderData = calculateKaleidoscopeLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
        break;
    case LayoutType.Journal:
      finalRenderData = calculateJournalLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.GoldenSpiral:
      finalRenderData = calculateGoldenSpiralLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Circular:
      finalRenderData = calculateCircularLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Orbital:
      finalRenderData = calculateOrbitalLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Showcase:
      finalRenderData = calculateShowcaseLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.MockupWall:
      finalRenderData = calculateMockupWallLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.IsometricGrid:
      finalRenderData = calculateIsometricGridLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.StaggeredRows:
      finalRenderData = calculateStaggeredRowsLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.FloatingCloud:
      finalRenderData = calculateFloatingCloudLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.PerspectiveGrid:
      finalRenderData = calculatePerspectiveGridLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.CoverFlow:
      finalRenderData = calculateCoverFlowLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Carousel:
      finalRenderData = calculateCarouselLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Floating:
      finalRenderData = calculateFloatingLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.Freeform:
      finalRenderData = calculateFreeformLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.MockupSpiral:
      finalRenderData = calculateMockupSpiralLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.MockupDiagonal:
      finalRenderData = calculateMockupDiagonalLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.MockupCascade:
      finalRenderData = calculateMockupCascadeLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.MockupGrid3D:
      finalRenderData = calculateMockupGrid3DLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    case LayoutType.MockupStack:
      finalRenderData = calculateMockupStackLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
    default:
      finalRenderData = calculateGridLayout(imagesToProcess, effectiveWidth, effectiveHeight, settings);
      break;
  }

  // Offset by padding
  if (canvasPadding > 0) {
      finalRenderData.forEach(item => {
          item.x += canvasPadding;
          item.y += canvasPadding;
      });
  }

  // Apply global rotation and pan as a final step
  if (settings.globalRotation !== 0 || settings.globalOffsetX !== 0 || settings.globalOffsetY !== 0) {
      finalRenderData.forEach(item => {
          item.rotation += settings.globalRotation;
          item.x += settings.globalOffsetX || 0;
          item.y += settings.globalOffsetY || 0;
      });
  }

  // Apply individual image overrides
  finalRenderData.forEach(item => {
      const override = settings.imageOverrides[item.id];
      if (override) {
          if (override.offsetX !== undefined) item.x += override.offsetX;
          if (override.offsetY !== undefined) item.y += override.offsetY;
          if (override.rotationOffset !== undefined) item.rotation += override.rotationOffset;
          if (override.scaleMultiplier !== undefined) {
              const oldW = item.width;
              const oldH = item.height;
              item.width *= override.scaleMultiplier;
              item.height *= override.scaleMultiplier;
              // Keep center
              item.x -= (item.width - oldW) / 2;
              item.y -= (item.height - oldH) / 2;
          }
          if (override.opacity !== undefined) item.opacity = override.opacity;
          if (override.zIndex !== undefined) item.zIndex = override.zIndex;
      }
  });

  // Sort by zIndex if present
  finalRenderData.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return finalRenderData;
};
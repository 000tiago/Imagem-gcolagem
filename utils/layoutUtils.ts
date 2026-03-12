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
function getCropping(image: HTMLImageElement, destWidth: number, destHeight: number, imageFit: ImageFit): { sx: number, sy: number, sWidth: number, sHeight: number } {
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
        const imageAspect = image.naturalWidth / image.naturalHeight || 1;
        const imgHeight = colWidth / imageAspect;

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
        const { sx, sy, sWidth, sHeight } = getCropping(image, colWidth, imgHeight, 'cover');
        
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
      const imageAspectRatio = Math.max(0.25, Math.min(4, image.naturalWidth / image.naturalHeight || 1.6));
      
      const tileWidth = (imageAspectRatio / totalAspectRatio) * rowWidth;
      const tileHeight = rowHeight;
      
      const finalX = currentX;
      const finalY = initialY;
      const finalWidth = tileWidth;
      const finalHeight = tileHeight;

      const rotation = (random() - 0.5) * 30 * settings.mosaicShapeVariation;
      
      const { sx, sy, sWidth, sHeight } = getCropping(image, finalWidth, finalHeight, 'cover');
      
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
        const aspectRatio = image.naturalWidth / image.naturalHeight || 1;
        
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

        const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, 'cover');

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
        const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, 'cover');
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

            const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, 'cover');
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

            const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, 'cover');
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

                const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, 'cover');
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
        const imageAspect = image.naturalWidth / image.naturalHeight || 1;
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
        
        const imageAspect = image.naturalWidth / image.naturalHeight || 1;
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

        const { sx, sy, sWidth, sHeight } = getCropping(image, colWidth, imgHeight, 'cover');
        
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
            const imageAspect = image.naturalWidth / image.naturalHeight || 1;

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
            
            const { sx, sy, sWidth, sHeight } = getCropping(image, width, height, 'cover');

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

        const imgAspect = image.naturalWidth / image.naturalHeight || 1;
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

  let finalRenderData: ImageRenderData[];

  switch (settings.layout) {
    case LayoutType.Grid:
      finalRenderData = calculateGridLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Mosaic:
      finalRenderData = calculateMosaicRowsLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Pile:
      finalRenderData = calculatePileLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Wall3D:
      finalRenderData = calculateWall3DLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Tiled:
      finalRenderData = calculateTiledLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Fractal:
      finalRenderData = calculateFractalLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Voronoi:
      finalRenderData = calculateVoronoiLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.CustomShape:
      finalRenderData = calculateCustomShapeLayout(imagesToProcess, canvasWidth, canvasHeight, settings, shapeMaskData);
      break;
    case LayoutType.TieredShape:
      finalRenderData = calculateTieredShapeLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Kaleidoscope:
        finalRenderData = calculateKaleidoscopeLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
        break;
    case LayoutType.Journal:
      finalRenderData = calculateJournalLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.GoldenSpiral:
      finalRenderData = calculateGoldenSpiralLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Circular:
      finalRenderData = calculateCircularLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    case LayoutType.Orbital:
      finalRenderData = calculateOrbitalLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
    default:
      finalRenderData = calculateGridLayout(imagesToProcess, canvasWidth, canvasHeight, settings);
      break;
  }

  // Apply global rotation as a final step
  if (settings.globalRotation !== 0) {
      finalRenderData.forEach(item => {
          item.rotation += settings.globalRotation;
      });
  }

  return finalRenderData;
};
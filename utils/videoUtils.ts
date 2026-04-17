
import type { Settings, Keyframe, ImageRenderData, ImageFile } from '../types';
import { calculateLayout } from './layoutUtils';
import { drawCollage } from './drawingUtils';

// Linear interpolation for numbers
const lerp = (start: number, end: number, t: number): number => {
    return start * (1 - t) + end * t;
};

// Interpolates between two settings objects to create smooth transitions for video.
const interpolateSettings = (start: Settings, end: Settings, t: number): Settings => {
    const interpolated: Partial<Settings> = {};
    
    // Iterate over all keys in the Settings interface for a complete interpolation.
    // The type assertion `as (keyof Settings)[]` ensures type safety during iteration.
    for (const key of Object.keys(start) as (keyof Settings)[]) {
        const s_val = start[key];
        const e_val = end[key];

        if (typeof s_val === 'number' && typeof e_val === 'number') {
            // Linearly interpolate numeric values for smooth animation.
            // Using `(interpolated as any)` is a necessary workaround here because TypeScript
            // cannot dynamically infer that `lerp(...)` returns a value of the correct type
            // for the specific `key` being processed in the loop.
            (interpolated as any)[key] = lerp(s_val, e_val, t);
        } else {
            // For non-numeric values (like enums or strings), we don't interpolate.
            // The value simply switches from the start value to the end value once the
            // segment is complete (t >= 1).
            (interpolated as any)[key] = t < 1 ? s_val : e_val;
        }
    }
    return interpolated as Settings;
};

// Helper to load image elements from ImageFile objects for video rendering.
// This loads the ORIGINAL file for maximum quality.
const loadVideoImages = (imageFiles: ImageFile[]): Promise<HTMLImageElement[]> => {
    const promises = imageFiles.map(file => {
        return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const objectURL = URL.createObjectURL(file.file);
            img.src = objectURL;
            img.dataset.id = file.id; // Assign ID for layout calculations
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Could not load image for video export: ${file.file.name}`);
                URL.revokeObjectURL(objectURL);
                // Resolve with an empty image to prevent the entire video export from failing.
                resolve(new Image()); 
            };
        });
    });
    return Promise.all(promises);
};

const loadBackgroundImage = (url: string | null): Promise<HTMLImageElement | null> => {
    if (!url) return Promise.resolve(null);
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
    });
};


export const exportVideo = (
    keyframes: Keyframe[],
    initialState: Settings,
    imageFiles: ImageFile[],
    finalState: Settings,
    canvasSize: { width: number, height: number }
): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        if (keyframes.length < 2) {
            return reject(new Error("At least two keyframes are required for an animation."));
        }
        
        // Load main images and background image in parallel
        // We look at both initial and final state for background image, defaulting to final if both exist or picking whichever exists.
        // In a simple case, we just load whatever is in finalState, but if the user changed it during recording, 
        // we might ideally want to support that. For simplicity, we'll use the one present at the start of export logic (finalState).
        const [images, bgImage] = await Promise.all([
            loadVideoImages(imageFiles),
            loadBackgroundImage(finalState.backgroundImage || initialState.backgroundImage)
        ]);
        
        if (images.filter(img => img.width > 0).length === 0) {
            // Clean up any URLs that were created before failing.
             images.forEach(img => {
                if (img.src.startsWith('blob:')) {
                    URL.revokeObjectURL(img.src);
                }
            });
            return reject(new Error("No valid images available for video export."));
        }

        const [aspectW, aspectH] = finalState.aspectRatio.split('/').map(Number);
        const safeAspectW = aspectW || 1;
        if (isNaN(safeAspectW) || isNaN(aspectH)) {
             return reject(new Error(`Invalid aspect ratio for video export: ${finalState.aspectRatio}`));
        }

        const videoWidth = 1280; // HD resolution for a lighter video file
        const videoHeight = Math.round(videoWidth * (aspectH / safeAspectW));

        const canvas = document.createElement('canvas');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Could not create canvas context for video export."));

        const stream = canvas.captureStream(60); // 60 FPS
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        const chunks: Blob[] = [];

        const cleanup = () => {
            images.forEach(img => {
                if (img.src.startsWith('blob:')) {
                    URL.revokeObjectURL(img.src);
                }
            });
        };

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            cleanup();
            resolve(videoBlob);
        };
        recorder.onerror = (e) => {
            cleanup();
            reject(e);
        };

        const totalDuration = keyframes[keyframes.length - 1].timestamp - keyframes[0].timestamp;
        let startTime: number | null = null;
        let currentKeyframeIndex = 0;

        try {
            recorder.start();
        } catch (e) {
            cleanup();
            return reject(e);
        }

        const renderFrame = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;

            if (elapsedTime > totalDuration) {
                recorder.stop();
                return;
            }

            // Find the current and next keyframes
            while (
                currentKeyframeIndex < keyframes.length - 2 &&
                keyframes[currentKeyframeIndex + 1].timestamp - keyframes[0].timestamp < elapsedTime
            ) {
                currentKeyframeIndex++;
            }

            const startKf = keyframes[currentKeyframeIndex];
            const endKf = keyframes[currentKeyframeIndex + 1];

            const segmentDuration = endKf.timestamp - startKf.timestamp;
            const timeIntoSegment = elapsedTime - (startKf.timestamp - keyframes[0].timestamp);
            const progress = segmentDuration > 0 ? Math.min(1, timeIntoSegment / segmentDuration) : 1;

            const currentSettings = interpolateSettings(startKf.settings, endKf.settings, progress);
            
            const safeCanvasWidth = canvasSize.width || 1;
            const scaleFactor = videoWidth / safeCanvasWidth;
            
            // Scale image overrides
            const scaledImageOverrides = { ...currentSettings.imageOverrides };
            for (const key in scaledImageOverrides) {
                scaledImageOverrides[key] = {
                    ...scaledImageOverrides[key],
                    offsetX: (scaledImageOverrides[key].offsetX || 0) * scaleFactor,
                    offsetY: (scaledImageOverrides[key].offsetY || 0) * scaleFactor,
                };
            }

            const scaledSettings = {
                ...currentSettings,
                shadowBlur: currentSettings.shadowBlur * scaleFactor,
                cornerRadius: currentSettings.cornerRadius * scaleFactor,
                borderWidth: currentSettings.borderWidth * scaleFactor,
                focalPointBlur: currentSettings.focalPointBlur * scaleFactor,
                globalOffsetX: (currentSettings.globalOffsetX || 0) * scaleFactor,
                globalOffsetY: (currentSettings.globalOffsetY || 0) * scaleFactor,
                spacing: currentSettings.spacing * scaleFactor,
                canvasPadding: currentSettings.canvasPadding * scaleFactor,
                padding: currentSettings.padding * scaleFactor,
                orbitalRadius: currentSettings.orbitalRadius * scaleFactor,
                orbitalFocus: currentSettings.orbitalFocus * scaleFactor,
                imageOverrides: scaledImageOverrides,
            };
            
            // Draw the collage for the current frame
            const renderData = calculateLayout(images, videoWidth, videoHeight, scaledSettings, null);
            drawCollage(ctx, videoWidth, videoHeight, renderData, scaledSettings, [], imageFiles, bgImage);

            requestAnimationFrame(renderFrame);
        };

        requestAnimationFrame(renderFrame);
    });
};

import type { ImageFile } from '../types';

const EMOJI_LIST = ['🎨', '✨', '🖼️', '🌟', '🌈', '💡', '🚀', '💖', '🎉', '🔥', '💯', '📸'];

export const generateEmojiImages = async (count: number): Promise<ImageFile[]> => {
  const promises: Promise<ImageFile>[] = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const size = 256;
  canvas.width = size;
  canvas.height = size;

  if (!ctx) return [];

  for (let i = 0; i < count; i++) {
    const emoji = EMOJI_LIST[i % EMOJI_LIST.length];
    
    const promise = new Promise<ImageFile>((resolve, reject) => {
      // Clear canvas for transparency
      ctx.clearRect(0, 0, size, size);

      // Draw emoji
      ctx.font = `${size * 0.7}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, size / 2, size / 2 + size * 0.05); // slight offset for better centering
      
      canvas.toBlob(blob => {
        if (!blob) {
            return reject(new Error('Canvas toBlob returned null'));
        }
        const url = URL.createObjectURL(blob);
        resolve({
          id: `emoji-${i}-${Date.now()}`,
          file: new File([blob], `emoji-${i}.png`, { type: 'image/png' }),
          previewUrl: url,
          width: size,
          height: size,
        });
      }, 'image/png');
    });

    promises.push(promise);
  }

  return Promise.all(promises);
};

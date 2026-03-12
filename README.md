# Image Collage Creator

A powerful, high-performance image collage application built with React and the HTML5 Canvas API. This app is designed for speed, precision, and a wide variety of artistic layouts without relying on heavy SVG structures or external AI services.

## 🚀 Key Features

### 🎨 Artistic Layouts
- **Grid & Masonry**: Classic uniform grids, staggered masonry, and overlapped styles.
- **Mosaic & Fractal**: Intelligent row-based mosaics and recursive fractal subdivisions.
- **Voronoi Mosaic**: Organic cell-based layouts using D3-Delaunay for point distribution (Poisson Disk, Sunflower, etc.).
- **3D Wall & Orbital**: Immersive 3D perspectives and spherical projections with depth-of-field effects.
- **Custom Shape Mask**: Fill any shape (uploaded as a black & white mask) with a dense collage of images.
- **Golden Spiral & Kaleidoscope**: Mathematical patterns for unique artistic compositions.
- **Journal/Scrapbook**: A dense, overlapping layout perfect for storytelling.

### ✨ Advanced Visual Effects
- **Focal Point (Bokeh)**: Select specific images to remain sharp while others blur, simulating a shallow depth of field.
- **Glassmorphism**: Apply frosted glass effects to image frames.
- **Dynamic Styling**: Adjustable corner radius, shadows, vignettes, and borders.
- **Organic Touch**: Add "chaos" (random position/rotation offsets) to structured layouts for a more natural feel.

### 🛠 Technical Excellence
- **Deterministic Randomness**: Uses a seeded pseudo-random number generator (PRNG) so layouts are reproducible and shareable.
- **High-Res Export**: Export your creations at up to 3000px+ in PNG, JPEG, or WebP formats.
- **Video Recording**: Capture the layout transitions and animations directly into a video file.
- **Responsive & Fixed Aspect Ratio**: The canvas intelligently scales to fit any screen while strictly maintaining the chosen aspect ratio (16:9, 1:1, 9:16, etc.).
- **PWA Support**: Install the app on your device for an app-like experience and offline access.

---

## 🔧 Integration Guide (for SortFlow)

If you want to integrate the collage capabilities into another application like **SortFlow**, follow these steps:

### 1. Core Logic Extraction
The "brain" of the collage creator is decoupled from the UI. To use it elsewhere, you primarily need:
- `src/utils/layoutUtils.ts`: Contains all mathematical algorithms for positioning images.
- `src/utils/drawingUtils.ts`: Handles the actual rendering of images, shadows, and effects onto the canvas.
- `src/types.ts`: Defines the `Settings` and `ImageRenderData` interfaces required for communication between the layout and drawing layers.

### 2. Implementation Steps
1.  **Install Dependencies**: Ensure `d3-delaunay` is installed if you plan to use Voronoi layouts.
2.  **Setup State**: Use the `Settings` interface from `types.ts` to manage the collage configuration.
3.  **Render Loop**: 
    - Call `calculateLayout(...)` from `layoutUtils.ts` to get an array of `ImageRenderData`.
    - Pass this data to `drawCollage(...)` in `drawingUtils.ts` along with the canvas context.
4.  **Maintain Aspect Ratio**: Copy the `ResizeObserver` logic from `CanvasArea.tsx` to ensure the canvas remains consistent across different screen sizes.

### 3. AI Tool Configuration
To allow an AI to use this as a tool within SortFlow, define the tool's interface as follows:

**Tool Name**: `generate_collage`
**Input**:
- `images`: An array of image objects (URLs or Blobs).
- `config`: A partial `Settings` object (e.g., `{ layout: 'Voronoi', theme: 'Modern' }`).

**Behavior**: The tool should process the images through the `layoutUtils` and return a high-resolution data URL or trigger a canvas render in the UI.

### 🤖 AI Agent Integration (SortFlow Context)
If you are an AI agent tasked with integrating this collage creator into **SortFlow**, follow these instructions:
1.  **Identify Sorted Items**: When a user sorts items in SortFlow, identify the images associated with those items.
2.  **Select Layout**: Choose a layout that matches the sorting logic (e.g., 'Grid' for uniform lists, 'Voronoi' for organic clusters, '3D Wall' for a gallery view).
3.  **Pass to Collage Engine**: Use the `calculateLayout` and `drawCollage` functions to generate a visual summary of the sorted results.
4.  **Interactive Focus**: Enable the `focalPoint` setting if the user wants to highlight specific "top-ranked" items in the collage.

---

## 🌍 Internationalization
The app is fully translatable. Currently supports:
- 🇺🇸 English
- 🇧🇷 Portuguese (Standard)

Check `App.tsx` for the `translations` object to add more languages.

---

## 🛠 Tech Stack
- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **D3-Delaunay** (for Voronoi math)
- **Lucide React** (for iconography)

---

*Developed with precision. No AI slop. Just pure rendering performance.*

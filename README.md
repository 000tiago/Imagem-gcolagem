# Image Collage Creator 🖼️✨

A powerful, web-based tool for creating stunning image collages, device mockups, and dynamic wallpapers. Built with React, TypeScript, and HTML5 Canvas.

## 🌟 Features

* **Advanced Layouts**: Choose from Classic (Grid, Mosaic), Mockup (Isometric, Cascade, 3D Grid), and Creative (Voronoi, Kaleidoscope, Hyperbolic Spiral) layouts.
* **Device Mockups & Styles**: Frame your images in realistic Phone or Laptop mockups, apply elegant Glassmorphism effects, or keep it classic with solid borders and shadows.
* **Retrospective Animation**: Generate a dynamic 3-second video animation (`.webm`) of your layout assembling itself with a single click.
* **Smart Backgrounds**: Automatically extract color palettes from your images to create cohesive solid, gradient, mesh, or blurred backgrounds.
* **Quick Actions**: Instantly adjust device colors and background colors directly from the top header based on your image's extracted palette.
* **High-Quality Export**: Export your creations in PNG, JPEG, or WebP formats with customizable aspect ratios (16:9, 1:1, 9:16, etc.) and resolutions.
* **Bilingual UI**: Fully supports English and Portuguese (PT-BR).

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

* **Frontend Framework**: React 18
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Rendering Engine**: HTML5 Canvas API (Custom rendering engine for layouts and mockups)
* **Build Tool**: Vite
* **Icons**: Lucide React

## 💡 How to Use

1. **Upload Images**: Drag and drop your images or click the upload area at the bottom.
2. **Choose a Layout**: Use the Left Sidebar to select a structure (e.g., Isometric Grid, Golden Spiral).
3. **Customize Style**: Adjust the Card Style (Device Mockup, Glass, Solid) and tweak spacing, shadows, and corner radius.
4. **Refine Background**: Use the Right Sidebar to set the background style (Mesh, Gradient, Blur) and adjust lighting/vignette effects.
5. **Export**: Click "Export Image" for a static high-res image, or "Gravar Animação" for a retrospective video.

## 🎨 Recent Updates
* **Unified UI**: Consolidated layout and style controls into intuitive, collapsible sidebars.
* **Smart Mockups**: Fixed concentric radii calculations for flawless device mockups without image bleeding.
* **Quick Actions Header**: Added a contextual top bar for 1-click color adjustments based on AI-extracted image palettes.
* **Hyperbolic Spiral Hero**: Added a central "Hero" image focus for the Hyperbolic Spiral layout.

# Earthquake Explorer# React + TypeScript + Vite



A modern, interactive web application for visualizing real-time earthquake data from around the world. Built with React, TypeScript, and featuring both 2D charts and an immersive 3D globe visualization.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



![React](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Vite](https://img.shields.io/badge/Vite-5.0-purple)Currently, two official plugins are available:



## Live Demo- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

[View Live Application](https://6908545f65a796cc6053471a--stellular-cucurucho-5ed9f0.netlify.app/)

## React Compiler

## Project Overview

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

This application fetches and displays earthquake data from the USGS (United States Geological Survey) earthquake feed, presenting it through multiple interconnected visualizations:

## Expanding the ESLint configuration

- **Interactive Charts** - Customizable scatter plots and time-series visualizations

- **Data Table** - Comprehensive view of all earthquake records with sorting and selectionIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **3D Globe** - Immersive geographic visualization with adjustable height mapping

- **Real-time Updates** - Automatic data refresh every 10 seconds (rate-limited to prevent API abuse)```js

export default defineConfig([

## Features  globalIgnores(['dist']),

  {

### Core Functionality    files: ['**/*.{ts,tsx}'],

- **Dual-Panel Layout**: Split view with charts on one side and data table on the other    extends: [

- **Bidirectional Selection**: Click a table row to highlight the chart point, or vice versa      // Other configs...

- **Dynamic Axis Controls**: Choose which variables to plot on X and Y axes

- **Responsive Design**: Optimized for desktop and laptop screens      // Remove tseslint.configs.recommended and replace with this

      tseslint.configs.recommendedTypeChecked,

### Advanced Features      // Alternatively, use this for stricter rules

- **3D Globe Visualization**: Interactive Earth model with earthquake points positioned geographically      tseslint.configs.strictTypeChecked,

- **Height Mapping Options**: Display magnitude, depth, station count, or azimuthal gap as 3D height      // Optionally, add this for stylistic rules

- **Color Coding**: Visual gradient from cyan → orange → red based on magnitude or depth      tseslint.configs.stylisticTypeChecked,

- **Expandable Globe Modal**: Full-screen view with enhanced controls and zoom capability

- **Magnitude Filtering**: Slider to filter earthquakes by minimum magnitude      // Other configs...

- **Performance Optimized**: React.memo, useMemo, and CSS animations with GPU acceleration    ],

- **Rate Limiting**: Built-in protection with 10 requests/minute limit and visual feedback    languageOptions: {

      parserOptions: {

### Visual Design        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **Modern Gradient Theme**: Vibrant cyan, purple, and pink color palette        tsconfigRootDir: import.meta.dirname,

- **Smooth Animations**: 60fps animations with bounce and fade effects      },

- **Custom Logo**: Geometric "E" design with seismic wave accent      // other options...

- **Loading States**: Beautiful orbital spinner with gradient text shimmer    },

- **Glass Morphism**: Backdrop blur effects and translucent panels  },

])

## Tech Stack```



### Core FrameworkYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

- **React 18.3** - UI component library

- **TypeScript 5.9** - Type-safe JavaScript```js

- **Vite 5.0** - Fast build tool and dev server// eslint.config.js

import reactX from 'eslint-plugin-react-x'

### State Managementimport reactDom from 'eslint-plugin-react-dom'

- **Zustand 4.5** - Lightweight state management for global earthquake selection

- **React Hooks** - useState, useEffect, useMemo for local stateexport default defineConfig([

- **Props Pattern** - Parent-to-child data and event handler passing  globalIgnores(['dist']),

  {

### Data Visualization    files: ['**/*.{ts,tsx}'],

- **Recharts 2.12** - Responsive charting library for 2D visualizations    extends: [

- **react-globe.gl 2.37** - 3D globe rendering with Three.js      // Other configs...

- **Three.js 0.181** - WebGL 3D graphics library      // Enable lint rules for React

      reactX.configs['recommended-typescript'],

### Styling      // Enable lint rules for React DOM

- **Tailwind CSS 3.4** - Utility-first CSS framework      reactDom.configs.recommended,

- **Custom CSS** - Animations, gradients, and advanced styling    ],

    languageOptions: {

### Data Fetching      parserOptions: {

- **Fetch API** - Native browser data fetching        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **USGS CSV Feed** - Real-time earthquake data source        tsconfigRootDir: import.meta.dirname,

      },

## Installation      // other options...

    },

### Prerequisites  },

- Node.js 16.x or higher])

- npm or yarn package manager```


### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dhairyasoniiiii/earthquake-explorer.git
   cd earthquake-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## Build for Production

```bash
npm run build
```

The optimized production build will be created in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
earthquake-explorer/
├── public/
│   └── favicon.svg          # Custom earthquake logo
├── src/
│   ├── components/
│   │   ├── ChartPanel.tsx   # 2D chart visualization with axis controls
│   │   ├── DataTable.tsx    # Sortable data table with row selection
│   │   └── GlobePanel.tsx   # 3D globe component with point rendering
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles, animations, theme
│   ├── main.tsx             # React app entry point
│   ├── store.ts             # Zustand state management
│   └── types.ts             # TypeScript interfaces
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.cjs      # Tailwind CSS settings
└── vite.config.ts           # Vite build configuration
```

## State Management Approach

This project demonstrates three different state management patterns:

### 1. Props Pattern
Data and event handlers flow from parent (`App.tsx`) to children via props:
```typescript
<ChartPanel 
  earthquakes={filteredEarthquakes} 
  onSelect={handleSelect} 
/>
```

### 2. Zustand Global Store
Manages the currently selected earthquake across all components:
```typescript
// store.ts
export const useEarthquakeStore = create<EarthquakeStore>((set) => ({
  selectedEarthquake: undefined,
  selectEarthquake: (eq) => set({ selectedEarthquake: eq }),
}));

// Usage in components
const { selectedEarthquake, selectEarthquake } = useEarthquakeStore();
```

### 3. Local React State
Component-level state for UI controls and derived data:
```typescript
const [magMin, setMagMin] = useState<number>(0);
const filteredEarthquakes = useMemo(() => 
  earthquakeData.filter(e => e.magnitude >= magMin), 
  [earthquakeData, magMin]
);
```

## Data Flow

1. **Initial Load**: 
   - App fetches CSV from USGS earthquake feed
   - Parses CSV into structured earthquake objects
   - Stores in local state

2. **User Interaction**:
   - User clicks table row → Updates Zustand store → Chart highlights point
   - User clicks chart point → Updates Zustand store → Table scrolls to row
   - User adjusts filters → Derived state recalculates → All views update

3. **Auto-Refresh**:
   - Fetches new data every 10 seconds
   - Rate limiter prevents excessive requests
   - Visual feedback when rate limit is reached

## Data Source

**USGS Earthquake Feed**
- Source: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv
- Updates: Real-time (past 30 days)
- Fields: magnitude, depth, latitude, longitude, time, place, type, station count, azimuthal gap, and more

## Deployment Guide

### Deploying to Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   # Install Netlify CLI globally
   npm install -g netlify-cli

   # Login to Netlify
   netlify login

   # Deploy
   netlify deploy --prod --dir=dist
   ```

3. **Or deploy via Netlify Web UI**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

### Build Settings for Netlify

Create a `netlify.toml` file in the root directory:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Development Process

This project was built collaboratively, leveraging AI assistance for:

- **Architecture Planning**: Designing the component structure and state flow patterns
- **Code Implementation**: Writing TypeScript interfaces and React components
- **Performance Tuning**: Identifying bottlenecks and applying memoization strategies
- **Visual Design**: Creating smooth animations and cohesive color schemes
- **Bug Debugging**: Troubleshooting CSV parsing, globe rendering, and state sync issues
- **Documentation**: Writing clear code comments and this README

The development followed an iterative approach, with continuous testing and refinement of features based on user experience considerations.

## Additional Features

Beyond the core requirements, this project includes:

1. **3D Globe Visualization** - Geographic earthquake display
2. **Multiple Height Modes** - Various data mapping options
3. **Custom Branding** - Unique logo and theme
4. **Smooth Animations** - 60fps performance throughout
5. **Rate Limiting** - API usage protection
6. **Auto-Refresh** - Real-time data updates
7. **Magnitude Filtering** - Dynamic data subsetting

## License

MIT License - feel free to use this project for learning and development.

## Author

**Dhairyasoniiiii**
- GitHub: [@Dhairyasoniiiii](https://github.com/Dhairyasoniiiii)

---

Built with React, TypeScript, and modern web technologies.



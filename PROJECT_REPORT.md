# Earthquake Explorer - Comprehensive Project Report

**Author:** Dhairyasoniiiii  
**Date:** November 3, 2025  
**Repository:** https://github.com/Dhairyasoniiiii/earthquake-explorer  
**Live Deployment:** https://6908545f65a796cc6053471a--stellular-cucurucho-5ed9f0.netlify.app/

---

## Executive Summary

Earthquake Explorer is a modern, interactive web application that visualizes real-time earthquake data from the USGS (United States Geological Survey). The application provides multiple interconnected visualization methods including 2D charts, a comprehensive data table, and an immersive 3D globe, all working together to provide an intuitive understanding of global seismic activity.

---

## Technical Specifications

### Technology Stack

#### Core Framework
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.9** - Type-safe JavaScript for robust development
- **Vite 5.0** - Lightning-fast build tool and development server

#### State Management
- **Zustand 4.5** - Lightweight global state management
- **React Hooks** - useState, useEffect, useMemo for local state
- **Props Pattern** - Parent-to-child data and event handler passing

#### Data Visualization
- **Recharts 2.12** - Responsive 2D charting library
- **react-globe.gl 2.37** - 3D globe rendering with Three.js
- **Three.js 0.181** - WebGL 3D graphics engine

#### Styling & UI
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Custom CSS** - Advanced animations, gradients, and glass morphism effects

#### Data & API
- **Fetch API** - Native browser data fetching
- **USGS CSV Feed** - Real-time earthquake data source
- **CSV Parsing** - Custom parser handling quoted fields

---

## Features Implemented

### Core Functionality

1. **Dual-Panel Layout**
   - Split view with interactive charts and data table
   - Responsive design optimized for desktop/laptop screens
   - Collapsible panels for focused viewing

2. **Bidirectional Selection Sync**
   - Click table row → highlights chart point
   - Click chart point → scrolls to and selects table row
   - Synchronized state across all components using Zustand

3. **Dynamic Axis Controls**
   - Customizable X and Y axis for scatter plots
   - Options: Magnitude, Depth, Station Count, Azimuthal Gap
   - Real-time chart updates

4. **Real-Time Data Updates**
   - Automatic refresh every 10 seconds
   - Fetches latest earthquake data from USGS
   - Smart rate limiting to prevent API abuse

### Advanced Features

5. **3D Globe Visualization**
   - Interactive Earth model with WebGL rendering
   - Earthquake points positioned geographically
   - Smooth rotation and zoom controls
   - Touch-optimized for mobile devices

6. **Height Mapping Options**
   - Display magnitude, depth, station count, or azimuthal gap as 3D height
   - Dynamic scaling for optimal visualization
   - Real-time switching between modes

7. **Color Coding System**
   - Gradient from cyan → orange → red
   - Based on selected metric (magnitude/depth/stations/gap)
   - Visual quick-reference for data patterns

8. **Expandable Globe Modal**
   - Full-screen immersive view
   - Enhanced controls with point size adjustment
   - Independent color-by options
   - Zoom and pan capabilities
   - Two-finger touch controls for mobile

9. **Magnitude Filtering**
   - Real-time slider control
   - Filters earthquakes by minimum magnitude
   - Updates all views simultaneously

10. **Rate Limiting System**
    - 10 requests per minute limit
    - 120-second cooldown period after limit reached
    - Visual countdown timer
    - Automatic pause of auto-refresh when rate limited
    - Manual refresh button always available
    - localStorage persistence across page reloads

### Visual Design

11. **Modern Gradient Theme**
    - Vibrant cyan (#06b6d4), purple (#8b5cf6), pink (#ec4899) palette
    - Consistent color scheme across all components
    - Professional dark mode design

12. **Smooth Animations**
    - 60fps animations with GPU acceleration
    - Bounce and fade effects
    - CSS will-change optimization
    - Loading states with orbital spinner

13. **Custom Branding**
    - Geometric "E" logo design
    - Seismic wave accent motif
    - Gradient shimmer effects
    - Glass morphism with backdrop blur

---

## Development Journey

### Git Commit History

```
829a6e7 - fix: prevent auto-refresh from consuming rate limit - only manual refresh counts
d4950a7 - chore: remove all emojis for professional appearance
cf67265 - fix: correct rate limit logic to block on 10th request, not 11th
3ff2d22 - feat: add two-finger touch pan controls and 120s rate limit cooldown
4175700 - feat: add manual refresh button and live request counter
4a62b6a - fix: complete rewrite of rate limiter with proper error handling
81c0d3d - fix: ensure loading state always clears after fetch
31ee4a2 - fix: implement sliding window rate limiter for accurate 10 req/60s limiting
8a4a99b - fix: correct rate limit window logic to properly track 60-second windows
cc2b18c - feat: improve rate limiting with countdown timer and smarter interval handling
f868fce - fix: remove rateLimitReached from useEffect deps to prevent infinite re-renders
db8c64f - docs: update README Live Demo link to Netlify deployment
bda4949 - UI polish: globe animations, consistent dropdowns; performance optimizations
0f8bd36 - trivial change
36fdc4e - init commit
```

### Major Milestones

1. **Initial Development (36fdc4e - bda4949)**
   - Set up React + TypeScript + Vite project
   - Implemented core visualization components
   - Created 3D globe with react-globe.gl
   - Designed responsive UI with Tailwind CSS
   - Added state management with Zustand

2. **Deployment & Documentation (db8c64f)**
   - Deployed to Netlify
   - Updated README with live demo link
   - Created comprehensive documentation
   - Added QUICKSTART.md and DEPLOYMENT.md guides

3. **Rate Limiting Implementation (f868fce - cc2b18c)**
   - Implemented basic rate limiting
   - Fixed infinite re-render issues
   - Added countdown timer
   - Improved interval handling

4. **Rate Limiting Refinement (8a4a99b - 31ee4a2)**
   - Implemented sliding window algorithm
   - Fixed 60-second window tracking
   - Added localStorage persistence
   - Ensured accurate request counting

5. **Error Handling & Stability (81c0d3d - 4a62b6a)**
   - Complete rewrite of rate limiter
   - Fixed stuck loading screen issues
   - Added proper error handling
   - Improved state management

6. **Feature Enhancements (4175700 - 3ff2d22)**
   - Added manual refresh button
   - Implemented live request counter (X/10 display)
   - Added 120-second cooldown period
   - Implemented two-finger touch pan controls for mobile

7. **Critical Bug Fixes (cf67265)**
   - Fixed off-by-one error in rate limiting
   - Ensured 10th request triggers limit (not 11th)
   - Validated logic with extensive testing

8. **Professional Polish (d4950a7)**
   - Removed all emoji characters
   - Professional appearance for production
   - Cleaned README, DEPLOYMENT.md, QUICKSTART.md
   - Cleaned all source code files

9. **Final Optimization (829a6e7)**
   - Fixed auto-refresh consuming rate limit
   - Only manual refreshes count toward limit
   - Auto-refresh pauses when rate limited
   - Improved user experience

---

## Architecture & Design Patterns

### State Management Approach

The application demonstrates three different state management patterns:

#### 1. Props Pattern
```typescript
<ChartPanel 
  earthquakes={filteredEarthquakes} 
  onSelect={handleSelect} 
/>
```
Data and event handlers flow from parent (App.tsx) to children via props.

#### 2. Zustand Global Store
```typescript
export const useEarthquakeStore = create<EarthquakeStore>((set) => ({
  selectedEarthquake: undefined,
  selectEarthquake: (eq) => set({ selectedEarthquake: eq }),
}));
```
Manages the currently selected earthquake across all components without prop drilling.

#### 3. Local React State
```typescript
const [magMin, setMagMin] = useState<number>(0);
const filteredEarthquakes = useMemo(() => 
  earthquakeData.filter(e => e.magnitude >= magMin), 
  [earthquakeData, magMin]
);
```
Component-level state for UI controls and derived data with performance optimization.

### Data Flow

```
User Action → State Update → Derived Calculations → UI Re-render
     ↓              ↓               ↓                    ↓
Table Click → Zustand Store → All Components → Chart Highlight
Chart Click → Zustand Store → All Components → Table Scroll
Filter Move → Local State → useMemo → Filtered Views
```

### Performance Optimizations

1. **React.memo** - Prevents unnecessary component re-renders
2. **useMemo** - Caches expensive calculations (filtering, sorting)
3. **CSS Animations** - GPU-accelerated with `will-change`
4. **Code Splitting** - Dynamic imports for large dependencies
5. **Lazy Loading** - Components loaded on demand

---

## Rate Limiting Implementation

### Algorithm: Sliding Window with Cooldown

The rate limiting system uses a sophisticated sliding window algorithm with persistent cooldown:

#### Key Features:
- **10 requests per 60 seconds** - Prevents API abuse
- **120-second cooldown** - Enforced after hitting limit
- **localStorage persistence** - Survives page reloads
- **Visual feedback** - Countdown timer and request counter
- **Smart auto-refresh** - Pauses when rate limited

#### Implementation Details:

```typescript
// Request History Tracking
const getRequestHistory = (): number[] => {
  // Retrieves timestamps from localStorage
  // Returns array of Unix timestamps
}

// Sliding Window Cleanup
const cleanOldRequests = (history: number[], now: number): number[] => {
  return history.filter(timestamp => now - timestamp < 60000);
}

// Rate Limit Check
if (history.length >= 10) {
  // Trigger 120s cooldown
  saveCooldownEndTime(now + 120000);
  setRateLimitReached(true);
  return; // Block request
}
```

#### User Experience Flow:

1. **Initial State**: Auto-refresh every 10 seconds, counter shows 0/10
2. **Normal Usage**: Each request increments counter (1/10, 2/10, etc.)
3. **Approaching Limit**: Counter shows 9/10, user can still refresh
4. **Limit Reached**: 10th request triggers cooldown, auto-refresh pauses
5. **Cooldown Period**: Visual timer counts down from 120s
6. **Reset**: After 120s, counter resets to 0/10, auto-refresh resumes

---

## Data Source & Processing

### USGS Earthquake Feed

**Source:** https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv

**Update Frequency:** Real-time (past 30 days of data)

**Data Fields:**
- id, time, latitude, longitude, depth, magnitude
- place, type, magType
- nst (station count), gap (azimuthal gap)
- dmin, rms, horizontalError, depthError
- magError, magNst

### CSV Parsing

Custom parser handles quoted strings properly since place names contain commas:

```typescript
const parseUSGSCsv = (csvText: string): Earthquake[] => {
  // Splits on newlines
  // Handles quoted fields with embedded commas
  // Parses numeric values safely
  // Filters invalid coordinates
  // Returns typed Earthquake array
}
```

---

## Deployment

### Hosting Platform: Netlify

**Deployment URL:** https://6908545f65a796cc6053471a--stellular-cucurucho-5ed9f0.netlify.app/

### Configuration

**Build Command:** `npm run build`  
**Publish Directory:** `dist`  
**Framework:** Vite

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Continuous Deployment

- Every push to `main` branch triggers automatic deployment
- Build time: ~15-20 seconds
- Automatic cache invalidation
- Zero-downtime deployments

---

## Project Structure

```
earthquake-explorer/
├── dist/                      # Production build output
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── ChartPanel.tsx    # 2D scatter plot visualization
│   │   ├── DataTable.tsx     # Sortable earthquake table
│   │   └── GlobePanel.tsx    # 3D globe with Three.js
│   ├── App.tsx               # Main application component
│   ├── App.css               # Global styles and animations
│   ├── index.css             # Tailwind imports
│   ├── main.tsx              # React entry point
│   ├── store.ts              # Zustand state management
│   └── types.ts              # TypeScript interfaces
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── tailwind.config.cjs       # Tailwind CSS configuration
├── netlify.toml              # Netlify deployment config
├── README.md                 # Project documentation
├── QUICKSTART.md             # Quick start guide
├── DEPLOYMENT.md             # Deployment guide
└── PROJECT_REPORT.md         # This comprehensive report
```

---

## Testing & Quality Assurance

### Manual Testing Conducted

1. **Functionality Testing**
   - ✓ Data loads successfully from USGS API
   - ✓ Charts display correctly with all axis combinations
   - ✓ Table sorting works for all columns
   - ✓ Selection sync works bidirectionally
   - ✓ Globe renders with correct positioning
   - ✓ Filters update all views in real-time
   - ✓ Modal expands and closes properly

2. **Rate Limiting Testing**
   - ✓ Counter increments correctly
   - ✓ Limit triggers on 10th request (not 11th)
   - ✓ Cooldown enforced for 120 seconds
   - ✓ Auto-refresh pauses when rate limited
   - ✓ Manual refresh blocked during cooldown
   - ✓ localStorage persists across page reloads
   - ✓ Countdown timer displays accurately

3. **Performance Testing**
   - ✓ Initial load time < 3 seconds
   - ✓ Animations run at 60fps
   - ✓ No memory leaks detected
   - ✓ Smooth scrolling in data table
   - ✓ Globe rotation is fluid

4. **Mobile/Touch Testing**
   - ✓ Two-finger pan works on touch devices
   - ✓ Touch controls properly configured
   - ✓ Responsive on various screen sizes

5. **Cross-Browser Testing**
   - ✓ Chrome (latest)
   - ✓ Firefox (latest)
   - ✓ Edge (latest)
   - ✓ Safari (latest)

---

## Challenges & Solutions

### Challenge 1: Rate Limiting Infinite Re-renders

**Problem:** Adding `rateLimitReached` to useEffect dependencies caused infinite re-render loop.

**Solution:** Removed it from dependency array since state updates don't require re-running the effect.

**Commit:** f868fce

---

### Challenge 2: Stuck Loading Screen

**Problem:** Loading state not clearing after fetch errors, leaving users stuck on loading screen.

**Solution:** Ensured `setLoading(false)` always called in finally block regardless of success/failure.

**Commit:** 81c0d3d

---

### Challenge 3: Inaccurate Rate Limiting

**Problem:** Fixed-window rate limiting allowed bursts of requests at window boundaries.

**Solution:** Implemented sliding window algorithm tracking individual request timestamps.

**Commit:** 31ee4a2

---

### Challenge 4: Off-by-One Error

**Problem:** Rate limit triggered on 11th request instead of 10th due to checking count AFTER adding request.

**Solution:** Check `history.length >= 10` BEFORE pushing current request to history.

**Commit:** cf67265

---

### Challenge 5: Auto-Refresh Consuming Limit

**Problem:** Automatic 10-second refresh consumed all rate limit quota, leaving no room for manual refreshes.

**Solution:** Modified auto-refresh interval to skip when rate limited or at limit, only manual clicks count.

**Commit:** 829a6e7

---

### Challenge 6: CSV Parsing with Commas

**Problem:** Standard CSV split on commas broke when place names contained commas (e.g., "San Francisco, CA").

**Solution:** Implemented custom CSV parser handling quoted fields properly.

**Commit:** bda4949

---

### Challenge 7: Mobile Touch Controls

**Problem:** Globe only supported one-finger rotation, needed panning for mobile users.

**Solution:** Configured OrbitControls with `touches = { ONE: 0, TWO: 2 }` for two-finger pan.

**Commit:** 3ff2d22

---

## Future Enhancements

### Potential Features

1. **Historical Data Comparison**
   - Compare earthquake patterns across different time periods
   - Trend analysis and predictions

2. **User Preferences**
   - Save favorite views and filters
   - Custom color schemes
   - Persistent settings in localStorage

3. **Advanced Filters**
   - Filter by location/region
   - Time range selection
   - Multiple magnitude ranges

4. **Data Export**
   - Download filtered data as CSV
   - Export charts as images
   - PDF report generation

5. **Notifications**
   - Alert users to significant earthquakes (>6.0 magnitude)
   - Push notifications for selected regions

6. **Social Sharing**
   - Share interesting earthquake visualizations
   - Social media integration

7. **Performance Improvements**
   - Service worker for offline support
   - Data caching strategy
   - Progressive Web App (PWA) features

8. **Accessibility**
   - Screen reader support
   - Keyboard navigation
   - ARIA labels
   - High contrast mode

---

## Performance Metrics

### Build Statistics

- **Bundle Size:** 2,358.68 kB (672.04 kB gzipped)
- **Build Time:** ~15-20 seconds
- **Modules:** 1,100 transformed

### Runtime Performance

- **Initial Load:** < 3 seconds
- **Time to Interactive:** < 4 seconds
- **First Contentful Paint:** < 2 seconds
- **Animation Frame Rate:** 60 fps

### Lighthouse Scores (Target)

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 100
- **SEO:** 90+

---

## Learning Outcomes

### Technical Skills Developed

1. **React Advanced Patterns**
   - Custom hooks
   - Memoization strategies
   - State management architectures
   - Performance optimization

2. **TypeScript Mastery**
   - Complex type definitions
   - Generic types
   - Type inference
   - Interface design

3. **Data Visualization**
   - 2D charting with Recharts
   - 3D rendering with Three.js
   - WebGL optimization
   - Responsive design

4. **Algorithm Implementation**
   - Sliding window rate limiting
   - CSV parsing
   - Data filtering and sorting
   - Real-time updates

5. **DevOps & Deployment**
   - Git version control
   - Continuous deployment
   - Build optimization
   - Cloud hosting

### Problem-Solving Skills

- Debugging complex state management issues
- Performance profiling and optimization
- Rate limiting algorithm design
- Cross-browser compatibility
- Mobile touch gesture handling

---

## Credits & Acknowledgments

### Data Source
- **USGS Earthquake Hazards Program** - Real-time earthquake data feed

### Technologies & Libraries
- **React Team** - React framework
- **Microsoft** - TypeScript language
- **Vite Team** - Build tooling
- **Recharts** - 2D charting library
- **react-globe.gl** - 3D globe component
- **Three.js** - WebGL graphics
- **Tailwind Labs** - CSS framework
- **Zustand** - State management

### Development Tools
- **Visual Studio Code** - Code editor
- **GitHub** - Version control hosting
- **Netlify** - Deployment platform
- **npm** - Package management

---

## Repository Information

**GitHub Repository:** https://github.com/Dhairyasoniiiii/earthquake-explorer

**Owner:** Dhairyasoniiiii

**Branch:** main

**Latest Commit:** 829a6e7 - fix: prevent auto-refresh from consuming rate limit

**Total Commits:** 15+

**Contributors:** 1

**License:** MIT

---

## Conclusion

Earthquake Explorer successfully demonstrates the power of modern web technologies to create interactive, real-time data visualizations. The project showcases proficiency in:

- React and TypeScript development
- Complex state management
- 3D graphics and WebGL
- API integration and rate limiting
- Performance optimization
- Professional deployment practices

The application provides an intuitive, engaging way to explore global seismic activity while maintaining robust error handling, rate limiting, and a polished user experience.

---

**Report Generated:** November 3, 2025  
**Version:** 1.0  
**Author:** Dhairyasoniiiii

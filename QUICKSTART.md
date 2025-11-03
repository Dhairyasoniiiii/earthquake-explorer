# Quick Start Guide

Get the Earthquake Explorer running in 3 minutes!

## Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/Dhairyasoniiiii/earthquake-explorer.git

# 2. Navigate to project folder
cd earthquake-explorer

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

## What You'll See

1. **Loading Screen** - Beautiful animated spinner while fetching data
2. **Main Dashboard** - Charts, table, and 3D globe
3. **Interactive Features** - Click around and explore!

## First Steps

Try these interactions:

1. **Click a table row** → Watch the chart highlight that earthquake
2. **Click the globe's "Expand" button** → See full-screen 3D view
3. **Drag the magnitude slider** → Filter earthquakes by size
4. **Change X/Y axis dropdowns** → Explore different data relationships

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Need Help?

- Read the full [README.md](README.md)
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for hosting
## Troubleshooting

**Port already in use?**
```bash
# Vite will automatically use a different port
# Check terminal output for the actual URL
```

**Dependencies not installing?**
```bash
# Clear npm cache and try again
npm cache clean --force
npm install
```

**Globe not rendering?**
```bash
# Check if WebGL is enabled in your browser
# Try a different browser (Chrome recommended)
```

---

Enjoy exploring earthquakes!

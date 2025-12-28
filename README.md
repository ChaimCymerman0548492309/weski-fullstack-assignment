# Weski Hotel Search Application

A full-stack hotel search application for ski resorts built with React, TypeScript, and Node.js.

## 📋 Assignment Requirements Met

### ✅ Core Functionality
- Complete search bar with destination (10 ski resorts), group size (1-10), and date selectors
- Real-time results displayed immediately below search
- All results sorted by price (ascending)

### ✅ API Integration  
- Full integration with HotelsSimulator API
- Searches for requested room size AND larger rooms (up to 10 people)
- Progressive loading - users see results as soon as they arrive
- Type-safe implementation with no `any` types

### ✅ Architecture
- Extensible provider system for adding new hotel APIs
- Clear separation between client (React) and server logic
- Error handling that prevents single failures from breaking entire search

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm** or **yarn**

### Installation
```bash
# Clone the repository
git clone <your-repository-url>
cd weski-fullstack-assignment

# Install dependencies
npm install

# Start the development server
npm start
```
The app will open at `http://localhost:3000`

### Production Build
```bash
# Create production build
npm run build

# Serve the build (requires serve package)
npm install -g serve
serve -s build
```

## 🏗️ Project Structure
```
src/
├── components/
│   └── navbar/          # Search bar component
│       ├── nav-bar.tsx
│       └── ...
├── providers/           # Hotel provider implementations
│   ├── types.ts         # TypeScript interfaces
│   ├── hotelsSimulator.provider.ts
│   └── hotelSearchService.ts
├── App.tsx              # Main application component
├── App.scss             # Styling
└── index.tsx           # Application entry point
```

## 🔧 How It Works

### Search Flow
1. User selects destination, dates, and group size
2. System queries HotelsSimulator API for selected size AND larger rooms (up to 10 people)
3. Results appear progressively as each API call returns
4. All results are aggregated, deduplicated, and sorted by price

### Key Features
- **Progressive Loading**: No waiting for all API calls to complete
- **Smart Room Search**: Automatically searches larger rooms for more options  
- **Duplicate Prevention**: Same hotel-room combinations filtered out
- **Error Resilience**: Individual API failures don't break the entire search

## 🎨 Design Implementation
- Built for 1920x1080 desktop resolution
- Clean, modern interface focused on usability
- Comprehensive hotel cards with images, ratings, distances, and pricing
- Immediate visual feedback during searches

## 📝 Adding New Hotel Providers

The architecture makes it easy to add additional hotel APIs:

1. Create a new provider implementing the `HotelsProvider` interface:
```typescript
export const createNewProvider = (): HotelsProvider => ({
  name: 'NewProvider',
  async search(query) {
    // Your implementation
  }
});
```

2. Add it to the search service:
```typescript
import { createHotelSearchService } from './providers/hotelSearchService';
import { createHotelsSimulatorProvider } from './providers/hotelsSimulator.provider';

const searchService = createHotelSearchService([
  createHotelsSimulatorProvider(),
  createNewProvider()  // Add your new provider here
]);
```

## 🐛 Troubleshooting

**API Connection Issues:**
- Verify internet connection
- Check if the HotelsSimulator API endpoint is accessible
- Ensure date format matches API expectations (MM/DD/YYYY)

**Build Errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript version compatibility

## 📄 License & Attribution
Built for the Weski Senior Full-Stack Developer assignment. All hotel data provided by the HotelsSimulator API.

---

*For questions about this implementation, please refer to the source code or contact the repository maintainer.*
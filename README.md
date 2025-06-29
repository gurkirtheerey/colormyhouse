# ColorMyHouse - AI-Powered House Color Visualizer

A React TypeScript web application that allows users to visualize different paint colors on houses using AI-powered segmentation and realistic color changes.

## Features

- Upload house photos (JPG, PNG, HEIF up to 10MB)
- AI-powered house segmentation (walls, roof, doors, windows, etc.)
- Real-time color preview with HSL manipulation
- Canvas-based editing with Konva.js
- State management with Zustand
- TypeScript support with strict type checking

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Canvas**: Konva.js, React-Konva
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **AI/ML**: TensorFlow.js (planned)
- **File Upload**: React-Dropzone

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Run linting**:
   ```bash
   npm run lint
   ```

## Project Structure

```
src/
├── components/     # React components (ImageUploader, CanvasEditor, ColorPicker)
├── hooks/          # Custom React hooks (useImageProcessor)
├── services/       # API clients and external service integrations
├── store/          # Zustand state management
├── types/          # TypeScript type definitions
└── utils/          # Helper functions (color conversion, image processing)
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_API_URL=http://localhost:3001/api
VITE_TENSORFLOW_MODEL_URL=https://your-cdn.com/models
VITE_SENTRY_DSN=your-sentry-dsn-here
```

## Development Notes

- Uses HSL color space for realistic color changes while preserving shadows
- Canvas implementation supports zoom and pan functionality
- File validation ensures proper image formats and size limits
- TypeScript strict mode enabled with comprehensive type definitions

## Next Steps

1. Integrate TensorFlow.js for AI segmentation
2. Implement selection tools and manual refinement
3. Add color recommendations
4. Connect to backend API for image processing
5. Add user authentication and project persistence

## License

MIT
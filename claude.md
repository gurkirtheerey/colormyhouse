# ColorMyHouse - AI Assistant Context

## Project Overview

ColorMyHouse is a web application that allows users to visualize different paint colors on houses by uploading photos and applying realistic color changes while preserving architectural details, shadows, and textures.

**Target Users**: Homeowners, contractors, and designers
**Business Model**: Freemium (Free tier with 5 images/month, Pro at $9.99/month, Business at $49.99/month)

## Technical Stack

### Frontend

- React 18 with TypeScript
- Zustand for state management
- Konva.js for canvas manipulation
- TensorFlow.js for client-side ML segmentation
- WebGL for GPU-accelerated processing
- Tailwind CSS for styling

### Backend

- Node.js with Express
- PostgreSQL for metadata
- Redis for caching/sessions
- AWS S3 for image storage
- Docker/Kubernetes for containerization

### AI/ML

- Custom U-Net model for house segmentation
- Classes: Sky, Walls, Roof, Windows, Doors, Landscape
- Client-side inference with quantized models (~10MB)

## Project Structure

```
/src
  /components     # React components (ImageUploader, CanvasEditor, ColorPicker, etc.)
  /hooks          # Custom React hooks
  /services       # API clients and external service integrations
  /utils          # Helper functions (color conversion, image processing)
  /store          # Zustand state management
  /types          # TypeScript type definitions
/api
  /routes         # Express route handlers
  /services       # Business logic layer
  /models         # Database models
  /middleware     # Auth, validation, error handling
/ml
  /models         # TensorFlow model files
  /inference      # Inference service code
/public           # Static assets
```

## Key Features & Implementation Notes

### Core Functionality

1. **Image Upload**: Drag-and-drop, format validation (JPG/PNG/HEIF, max 10MB)
2. **Color Selection**: HSL manipulation for realistic color changes, preserve luminance
3. **Segmentation**: AI-powered house detection with manual refinement tools
4. **Real-time Preview**: WebGL shaders for <100ms preview updates
5. **Export**: High-resolution downloads with before/after comparison

### Performance Requirements

- Image processing: <2s for 5MP images
- Preview generation: <100ms
- Page load: <3s first contentful paint
- Support 10K concurrent users

### Critical Implementation Details

- Use HSL color space for hue changes while preserving shadows
- Implement progressive rendering (25% preview → full resolution)
- WebWorkers for non-blocking image processing
- Konva.js layers: base image, selection mask, preview overlay
- Redis for session management and processing job queue

### API Endpoints

- `POST /api/images/upload` - Handle image uploads
- `POST /api/process/color-change` - Process color changes
- `POST /api/segment/auto` - AI segmentation
- `GET /api/projects/:id` - Retrieve project data
- `GET /api/colors/recommendations` - Get color suggestions

### State Management

```typescript
// Core state shape
interface AppState {
  project: {
    id: string;
    image: ImageData;
    selections: Selection[];
    history: HistoryItem[];
  };
  ui: {
    activeTool: Tool;
    selectedColor: Color;
    zoom: number;
  };
}
```

### Security Considerations

- JWT authentication with refresh tokens
- Image virus scanning on upload
- EXIF data stripping
- Rate limiting per user/IP
- CORS configuration for API

### Development Priorities

1. **Phase 1 (MVP)**: Basic upload, manual selection, color change, export
2. **Phase 2**: AI segmentation, color recommendations, user accounts
3. **Phase 3**: Collaboration, API, mobile apps

### Testing Strategy

- Unit tests for color algorithms and utils (Jest)
- Component testing with React Testing Library
- E2E tests for critical flows (Playwright)
- Load testing with k6

### Common Commands

```bash
npm run dev          # Start development server
npm run test         # Run test suite
npm run build        # Production build
npm run analyze      # Bundle analysis
```

### Environment Variables

```
REACT_APP_API_URL
DATABASE_URL
REDIS_URL
AWS_S3_BUCKET
JWT_SECRET
TENSORFLOW_MODEL_URL
```

### Known Constraints

- WebGL required for real-time preview
- TensorFlow.js model size (~10MB) affects initial load
- Mobile version has reduced features
- Color accuracy disclaimer needed

### External Dependencies

- AWS S3 for image storage
- CloudFront CDN for global delivery
- Sentry for error tracking
- Potential paint manufacturer API integrations

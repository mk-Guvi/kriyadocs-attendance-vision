# Smart Attendance Tracker

An AI-powered attendance tracking system built with ReactJS, featuring face recognition capabilities and real-time attendance management.

## 🚀 Features

- **Face Recognition**: AI-powered face detection and matching using face-api.js
- **Real-time Camera**: Live camera feed for capturing attendance photos
- **Smart Check-in/out**: Automatic detection of entry/exit based on face matching
- **Modern UI**: Beautiful, responsive interface with dark theme
- **Local Storage**: Persistent data storage using browser localStorage
- **Real-time Stats**: Live attendance statistics and present count
- **Mobile Responsive**: Works on desktop and mobile devices

## 🛠 Technology Stack

### Frontend
- **ReactJS** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide React** icons
- **React Router** for navigation

### AI/ML Libraries
- **face-api.js** for face detection and recognition
- **@tensorflow/tfjs** for machine learning operations
- **@huggingface/transformers** for additional AI capabilities

### Build Tools
- **Vite** for fast development and building
- **TypeScript** for type safety
- **ESLint** for code quality

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Modern web browser with camera access
- HTTPS (required for camera access in production)

## 🏗 Installation & Setup

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Docker Setup

1. **Build Docker image**
   ```bash
   docker build -t attendance-tracker .
   ```

2. **Run container**
   ```bash
   docker run -p 8080:8080 attendance-tracker
   ```

## 🐳 Docker Configuration

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "preview"]
```

### Docker Compose (Optional)
```yaml
version: '3.8'
services:
  attendance-tracker:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
```

## 📖 Usage Guide

### Basic Workflow

1. **Enter Details**: Fill in name and email address
2. **Camera Access**: Allow camera permissions when prompted
3. **Capture Photo**: Take a clear photo for attendance
4. **Face Recognition**: System automatically detects and matches faces
5. **Attendance Logged**: Entry/exit is recorded with timestamp

### Face Recognition

- **New Users**: First photo creates a new profile with face data
- **Returning Users**: Face matching determines automatic check-in/out
- **Confidence Scoring**: Shows match confidence percentage
- **Fallback**: Works without face detection if models fail to load

### Data Management

- **Local Storage**: All data stored in browser localStorage
- **Export/Import**: Future feature for data portability
- **Clear Data**: Admin option to reset all records

## 🧪 Testing

### Automated Testing

Run the test suite:
```bash
npm test
```

### Test Structure

```
test/
├── unit/
│   ├── components/          # Component unit tests
│   ├── hooks/              # Custom hook tests
│   └── utils/              # Utility function tests
├── integration/
│   ├── attendance-flow.test.ts
│   ├── face-detection.test.ts
│   └── camera-capture.test.ts
├── e2e/
│   └── attendance-tracker.spec.ts
└── README.md               # Test documentation
```

### Test Cases

#### Unit Tests
- Component rendering and props
- Custom hook functionality
- Face detection utilities
- Local storage operations

#### Integration Tests
- Complete attendance flow
- Camera integration
- Face recognition pipeline
- Data persistence

#### E2E Tests
- Full user journey
- Camera permissions
- Cross-browser compatibility

### Running Specific Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🔧 Configuration

### Environment Variables

```bash
# Camera settings
VITE_CAMERA_WIDTH=640
VITE_CAMERA_HEIGHT=480

# Face detection
VITE_FACE_DETECTION_CONFIDENCE=0.6
VITE_FACE_MODELS_PATH=/models

# Storage
VITE_STORAGE_PREFIX=attendance_
```

### Face Detection Models

Download and place in `public/models/`:
- `tiny_face_detector_model-weights_manifest.json`
- `face_landmark_68_model-weights_manifest.json`
- `face_recognition_model-weights_manifest.json`

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Deployment Options

1. **Static Hosting** (Vercel, Netlify)
   - Build and deploy the `dist` folder
   - Ensure HTTPS for camera access

2. **Docker Deployment**
   - Use provided Dockerfile
   - Deploy to container platforms

3. **Server Deployment**
   - Serve static files from `dist`
   - Configure HTTPS and proper headers

### Required Headers

```
Permissions-Policy: camera=(self)
Content-Security-Policy: img-src 'self' data: blob:
```

## 🔒 Security Considerations

- **Camera Privacy**: Images stored locally only
- **HTTPS Required**: Camera access needs secure context
- **Face Data**: Biometric data handled with care
- **No Backend**: Reduces attack surface

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is released under the Public Domain License. See `License.txt` for details.

## 🎯 Future Enhancements

- **Backend Integration**: Node.js with Fastify
- **Database Storage**: MongoDB or PostgreSQL
- **Advanced Analytics**: Attendance reports and insights
- **Mobile App**: React Native version
- **Multi-location**: Support for multiple office locations
- **API Integration**: REST API for external systems

## 🐛 Troubleshooting

### Common Issues

1. **Camera Not Working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Try different browser

2. **Face Detection Failing**
   - Check models are loaded
   - Ensure good lighting
   - Use Chrome/Firefox for best support

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version
   - Update dependencies

### Debug Mode

Enable debug logging:
```bash
localStorage.setItem('debug', 'attendance:*')
```

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check troubleshooting guide
- Review test documentation

---

**Built with ❤️ for the Kriyadocs Frontend Developer Case Study**

*This implementation demonstrates modern web development practices, AI integration, and comprehensive testing methodologies.*
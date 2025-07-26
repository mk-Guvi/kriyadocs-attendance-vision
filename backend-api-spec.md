# Backend API Specification

This document outlines the backend API specification for the Smart Attendance Tracker system using Node.js with Fastify framework.

## Technology Stack

- **Framework**: Fastify (Node.js)
- **Database**: MongoDB (with Docker support)
- **Authentication**: JWT tokens
- **File Storage**: Local file system or AWS S3
- **Face Recognition**: Python microservice or cloud API

## API Endpoints

### Authentication

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'user';
  };
}
```

### Attendees

```typescript
// GET /api/attendees
interface GetAttendeesResponse {
  attendees: Attendee[];
  total: number;
  page: number;
  limit: number;
}

// POST /api/attendees
interface CreateAttendeeRequest {
  name: string;
  email: string;
  image: string; // Base64 or file upload
  faceDescriptor?: number[];
}

// GET /api/attendees/:id
interface GetAttendeeResponse {
  attendee: Attendee;
}

// PUT /api/attendees/:id
interface UpdateAttendeeRequest {
  name?: string;
  email?: string;
  image?: string;
  status?: 'active' | 'inactive';
}
```

### Attendance Records

```typescript
// GET /api/attendance
interface GetAttendanceRequest {
  startDate?: string;
  endDate?: string;
  attendeeId?: string;
  type?: 'ENTRY' | 'EXIT';
  limit?: number;
  offset?: number;
}

interface GetAttendanceResponse {
  records: AttendanceRecord[];
  total: number;
  stats: {
    totalPresent: number;
    totalEntries: number;
    totalExits: number;
  };
}

// POST /api/attendance
interface CreateAttendanceRequest {
  attendeeId?: string; // Optional for new users
  name?: string; // For new users
  email?: string; // For new users
  image: string; // Base64 encoded
  type: 'ENTRY' | 'EXIT';
  location?: string;
  deviceId?: string;
}

interface CreateAttendanceResponse {
  record: AttendanceRecord;
  attendee: Attendee;
  faceMatch?: {
    confidence: number;
    matchedAttendeeId: string;
  };
}
```

### Face Recognition

```typescript
// POST /api/face/detect
interface FaceDetectionRequest {
  image: string; // Base64 encoded
}

interface FaceDetectionResponse {
  detected: boolean;
  descriptor?: number[];
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// POST /api/face/match
interface FaceMatchRequest {
  descriptor: number[];
  threshold?: number; // Default: 0.6
}

interface FaceMatchResponse {
  matches: Array<{
    attendeeId: string;
    confidence: number;
    attendee: Attendee;
  }>;
  bestMatch?: {
    attendeeId: string;
    confidence: number;
  };
}
```

### Analytics

```typescript
// GET /api/analytics/summary
interface AnalyticsSummaryResponse {
  today: {
    totalPresent: number;
    totalEntries: number;
    totalExits: number;
    peakHour: string;
  };
  thisWeek: {
    averageDaily: number;
    totalAttendance: number;
    trends: Array<{
      date: string;
      count: number;
    }>;
  };
  thisMonth: {
    totalAttendance: number;
    uniqueAttendees: number;
    averageDaily: number;
  };
}

// GET /api/analytics/attendance-patterns
interface AttendancePatternsResponse {
  hourlyDistribution: Array<{
    hour: number;
    entries: number;
    exits: number;
  }>;
  dailyDistribution: Array<{
    dayOfWeek: number;
    averageAttendance: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalAttendance: number;
    uniqueAttendees: number;
  }>;
}
```

## Data Models

### Attendee Model

```typescript
interface Attendee {
  id: string;
  name: string;
  email: string;
  images: Array<{
    url: string;
    uploadedAt: Date;
    isProfile: boolean;
  }>;
  faceDescriptors: Array<{
    descriptor: number[];
    createdAt: Date;
    confidence: number;
  }>;
  status: 'active' | 'inactive';
  currentStatus: 'IN' | 'OUT';
  lastEntry?: Date;
  lastExit?: Date;
  totalAttendance: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Attendance Record Model

```typescript
interface AttendanceRecord {
  id: string;
  attendeeId: string;
  name: string;
  email: string;
  image: string;
  type: 'ENTRY' | 'EXIT';
  timestamp: Date;
  location?: string;
  deviceId?: string;
  faceMatch?: {
    confidence: number;
    descriptor: number[];
  };
  metadata?: {
    ipAddress: string;
    userAgent: string;
    processingTime: number;
  };
  createdAt: Date;
}
```

## Implementation Example (Fastify)

```typescript
// server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';

const fastify = Fastify({ logger: true });

// Register plugins
await fastify.register(cors);
await fastify.register(jwt, { secret: process.env.JWT_SECRET });
await fastify.register(multipart);

// Database connection
import { connectToDatabase } from './db/connection';
await connectToDatabase();

// Routes
await fastify.register(import('./routes/auth'), { prefix: '/api/auth' });
await fastify.register(import('./routes/attendees'), { prefix: '/api/attendees' });
await fastify.register(import('./routes/attendance'), { prefix: '/api/attendance' });
await fastify.register(import('./routes/face'), { prefix: '/api/face' });
await fastify.register(import('./routes/analytics'), { prefix: '/api/analytics' });

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

## Database Schema (MongoDB)

```javascript
// attendees collection
{
  _id: ObjectId,
  name: String,
  email: String, // indexed, unique
  images: [
    {
      url: String,
      uploadedAt: Date,
      isProfile: Boolean
    }
  ],
  faceDescriptors: [
    {
      descriptor: [Number], // 128-dimensional face descriptor
      createdAt: Date,
      confidence: Number
    }
  ],
  status: String, // 'active' | 'inactive'
  currentStatus: String, // 'IN' | 'OUT'
  lastEntry: Date,
  lastExit: Date,
  totalAttendance: Number,
  createdAt: Date,
  updatedAt: Date
}

// attendance_records collection
{
  _id: ObjectId,
  attendeeId: ObjectId, // reference to attendees
  name: String,
  email: String,
  image: String,
  type: String, // 'ENTRY' | 'EXIT'
  timestamp: Date, // indexed
  location: String,
  deviceId: String,
  faceMatch: {
    confidence: Number,
    descriptor: [Number]
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    processingTime: Number
  },
  createdAt: Date
}
```

## Deployment Instructions

### Docker Setup

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables

```bash
# .env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongo:27017/attendance
JWT_SECRET=your-super-secret-jwt-key
FACE_DETECTION_API_URL=http://face-service:5000
AWS_S3_BUCKET=attendance-images
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Docker Compose Integration

```yaml
# Add to existing docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/attendance
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=attendance
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

## Testing Strategy

### Unit Tests
- Route handlers
- Database operations
- Face recognition utilities
- Authentication middleware

### Integration Tests
- API endpoint workflows
- Database integration
- Face detection service integration
- File upload handling

### Load Testing
- Concurrent attendance submissions
- Face recognition performance
- Database query optimization
- Image processing throughput

This backend specification provides a comprehensive foundation for implementing the server-side components of the attendance tracking system.
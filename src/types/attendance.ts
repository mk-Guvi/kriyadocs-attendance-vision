export interface AttendanceRecord {
  id: string;
  name: string;
  email: string;
  image: string; // Base64 encoded image
  timestamp: Date;
  type: 'ENTRY' | 'EXIT';
  faceDescriptor?: Float32Array; // For face matching
}

export interface AttendeeProfile {
  id: string;
  name: string;
  email: string;
  lastImage: string;
  faceDescriptor?: Float32Array;
  currentStatus: 'IN' | 'OUT';
  lastEntry?: Date;
  lastExit?: Date;
}

export interface CameraState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
}

export interface FaceDetectionResult {
  isMatch: boolean;
  confidence: number;
  attendeeId?: string;
}
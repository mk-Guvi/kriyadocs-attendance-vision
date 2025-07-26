export interface AttendanceRecord {
  id: string;
  name: string;
  email: string;
  image: string; // Base64 encoded image
  timestamp: Date;
  type: 'ENTRY' | 'EXIT';
  imageFeatures?: Float32Array; // For image matching
  faceDescriptor?: Float32Array; // For face matching (legacy)
}

export interface AttendeeProfile {
  id: string;
  name: string;
  email: string;
  lastImage: string;
  imageFeatures?: Float32Array; // For image matching
  faceDescriptor?: Float32Array; // For face matching (legacy)
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

export interface ImageMatchResult {
  isMatch: boolean;
  confidence: number;
  attendeeId?: string;
}
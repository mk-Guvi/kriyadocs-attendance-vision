import { renderHook, act } from '@testing-library/react';
import { useAttendanceStore } from '@/hooks/useAttendanceStore';
import { AttendanceRecord, AttendeeProfile } from '@/types/attendance';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Attendance Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should complete full attendance flow for new user', async () => {
    const { result } = renderHook(() => useAttendanceStore());

    // Mock face descriptor
    const mockFaceDescriptor = new Float32Array([0.1, 0.2, 0.3]);

    // Add first attendance record (entry)
    act(() => {
      const record = result.current.addRecord({
        name: 'John Doe',
        email: 'john@example.com',
        image: 'data:image/jpeg;base64,mockdata',
        type: 'ENTRY',
        faceDescriptor: mockFaceDescriptor
      });

      // Update profile
      result.current.updateProfile({
        id: record.id,
        name: 'John Doe',
        email: 'john@example.com',
        lastImage: 'data:image/jpeg;base64,mockdata',
        currentStatus: 'IN',
        lastEntry: new Date(),
        faceDescriptor: mockFaceDescriptor
      });
    });

    // Verify entry was recorded
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].type).toBe('ENTRY');
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].currentStatus).toBe('IN');

    // Add exit record
    act(() => {
      const record = result.current.addRecord({
        name: 'John Doe',
        email: 'john@example.com',
        image: 'data:image/jpeg;base64,mockdata2',
        type: 'EXIT',
        faceDescriptor: mockFaceDescriptor
      });

      // Update profile status
      result.current.updateProfile({
        id: record.id,
        currentStatus: 'OUT',
        lastExit: new Date()
      });
    });

    // Verify exit was recorded
    expect(result.current.records).toHaveLength(2);
    expect(result.current.records[0].type).toBe('EXIT'); // Latest first
    expect(result.current.profiles[0].currentStatus).toBe('OUT');
  });

  it('should handle face matching for returning user', async () => {
    const { result } = renderHook(() => useAttendanceStore());

    const userId = 'user-123';
    const mockFaceDescriptor = new Float32Array([0.1, 0.2, 0.3]);

    // Create existing profile
    act(() => {
      result.current.updateProfile({
        id: userId,
        name: 'Jane Smith',
        email: 'jane@example.com',
        lastImage: 'data:image/jpeg;base64,existing',
        currentStatus: 'OUT',
        faceDescriptor: mockFaceDescriptor
      });
    });

    // Get face descriptors for matching
    const descriptors = result.current.getFaceDescriptors();
    expect(descriptors).toHaveLength(1);
    expect(descriptors[0].id).toBe(userId);
    expect(descriptors[0].descriptor).toEqual(mockFaceDescriptor);

    // Simulate matching process
    act(() => {
      const record = result.current.addRecord({
        name: 'Jane Smith',
        email: 'jane@example.com',
        image: 'data:image/jpeg;base64,newimage',
        type: 'ENTRY',
        faceDescriptor: mockFaceDescriptor
      });

      // Update existing profile
      result.current.updateProfile({
        id: userId,
        currentStatus: 'IN',
        lastEntry: new Date(),
        lastImage: 'data:image/jpeg;base64,newimage'
      });
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].currentStatus).toBe('IN');
  });

  it('should persist data to localStorage', async () => {
    const { result } = renderHook(() => useAttendanceStore());

    act(() => {
      result.current.addRecord({
        name: 'Test User',
        email: 'test@example.com',
        image: 'data:image/jpeg;base64,test',
        type: 'ENTRY'
      });
    });

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'attendance_records',
      expect.stringContaining('Test User')
    );
  });

  it('should load data from localStorage on initialization', () => {
    const mockRecord = {
      id: 'record-1',
      name: 'Stored User',
      email: 'stored@example.com',
      image: 'data:image/jpeg;base64,stored',
      timestamp: new Date().toISOString(),
      type: 'ENTRY'
    };

    const mockProfile = {
      id: 'profile-1',
      name: 'Stored User',
      email: 'stored@example.com',
      lastImage: 'data:image/jpeg;base64,stored',
      currentStatus: 'IN',
      lastEntry: new Date().toISOString()
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'attendance_records') {
        return JSON.stringify([mockRecord]);
      }
      if (key === 'attendee_profiles') {
        return JSON.stringify([mockProfile]);
      }
      return null;
    });

    const { result } = renderHook(() => useAttendanceStore());

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].name).toBe('Stored User');
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].name).toBe('Stored User');
  });

  it('should handle data corruption gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      return 'invalid json data';
    });

    // Should not throw error
    const { result } = renderHook(() => useAttendanceStore());

    expect(result.current.records).toHaveLength(0);
    expect(result.current.profiles).toHaveLength(0);
  });

  it('should clear all data correctly', async () => {
    const { result } = renderHook(() => useAttendanceStore());

    // Add some data first
    act(() => {
      result.current.addRecord({
        name: 'Test User',
        email: 'test@example.com',
        image: 'data:image/jpeg;base64,test',
        type: 'ENTRY'
      });

      result.current.updateProfile({
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        lastImage: 'data:image/jpeg;base64,test',
        currentStatus: 'IN'
      });
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.profiles).toHaveLength(1);

    // Clear all data
    act(() => {
      result.current.clearAllData();
    });

    expect(result.current.records).toHaveLength(0);
    expect(result.current.profiles).toHaveLength(0);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('attendance_records');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('attendee_profiles');
  });

  it('should get recent records with limit', async () => {
    const { result } = renderHook(() => useAttendanceStore());

    // Add multiple records
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addRecord({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          image: `data:image/jpeg;base64,user${i}`,
          type: i % 2 === 0 ? 'ENTRY' : 'EXIT'
        });
      }
    });

    expect(result.current.records).toHaveLength(25);

    const recentRecords = result.current.getRecentRecords(10);
    expect(recentRecords).toHaveLength(10);

    // Should be in reverse chronological order (latest first)
    expect(recentRecords[0].name).toBe('User 24');
    expect(recentRecords[9].name).toBe('User 15');
  });
});
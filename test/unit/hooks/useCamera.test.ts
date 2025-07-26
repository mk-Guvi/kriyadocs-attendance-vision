import { renderHook, act } from '@testing-library/react';
import { useCamera } from '@/hooks/useCamera';

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

describe('useCamera Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCamera());
    
    expect(result.current.cameraState.isActive).toBe(false);
    expect(result.current.cameraState.isLoading).toBe(false);
    expect(result.current.cameraState.error).toBe(null);
    expect(result.current.cameraState.stream).toBe(null);
  });

  it('should start camera successfully', async () => {
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([]),
    };
    mockGetUserMedia.mockResolvedValueOnce(mockStream);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });
    expect(result.current.cameraState.isActive).toBe(true);
    expect(result.current.cameraState.isLoading).toBe(false);
    expect(result.current.cameraState.error).toBe(null);
  });

  it('should handle camera access error', async () => {
    const errorMessage = 'Camera access denied';
    mockGetUserMedia.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.cameraState.isActive).toBe(false);
    expect(result.current.cameraState.isLoading).toBe(false);
    expect(result.current.cameraState.error).toBe(errorMessage);
  });

  it('should stop camera and clean up stream', async () => {
    const mockTrack = { stop: jest.fn() };
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([mockTrack]),
    };
    mockGetUserMedia.mockResolvedValueOnce(mockStream);

    const { result } = renderHook(() => useCamera());

    // Start camera first
    await act(async () => {
      await result.current.startCamera();
    });

    // Then stop it
    act(() => {
      result.current.stopCamera();
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(result.current.cameraState.isActive).toBe(false);
    expect(result.current.cameraState.stream).toBe(null);
  });

  it('should capture image from video element', async () => {
    const mockCanvas = document.createElement('canvas');
    const mockContext = {
      drawImage: jest.fn(),
    };
    
    jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
    jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext as any);
    jest.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,mockdata');

    const mockStream = {
      getTracks: jest.fn().mockReturnValue([]),
    };
    mockGetUserMedia.mockResolvedValueOnce(mockStream);

    const { result } = renderHook(() => useCamera());

    // Start camera first
    await act(async () => {
      await result.current.startCamera();
    });

    // Mock video element
    const mockVideo = {
      videoWidth: 640,
      videoHeight: 480,
    };
    Object.defineProperty(result.current.videoRef, 'current', {
      value: mockVideo,
      writable: true,
    });

    const imageData = result.current.captureImage();

    expect(imageData).toBe('data:image/jpeg;base64,mockdata');
    expect(mockContext.drawImage).toHaveBeenCalledWith(mockVideo, 0, 0);
  });

  it('should return null when capturing image without active camera', () => {
    const { result } = renderHook(() => useCamera());

    const imageData = result.current.captureImage();

    expect(imageData).toBe(null);
  });
});
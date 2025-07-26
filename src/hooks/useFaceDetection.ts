import { useState, useCallback, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { FaceDetectionResult } from '@/types/attendance';

export const useFaceDetection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const modelsLoadedRef = useRef(false);

  useEffect(() => {
    const loadModels = async () => {
      if (modelsLoadedRef.current) return;
      
      setIsLoading(true);
      try {
        // Load face detection and recognition models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        
        modelsLoadedRef.current = true;
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load face detection models:', error);
        // Continue without face detection if models fail to load
        setIsLoaded(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  const detectFaceFromImage = useCallback(async (imageElement: HTMLImageElement): Promise<Float32Array | null> => {
    if (!isLoaded) return null;

    try {
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection?.descriptor || null;
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }, [isLoaded]);

  const compareFaces = useCallback((descriptor1: Float32Array, descriptor2: Float32Array): number => {
    if (!descriptor1 || !descriptor2) return 0;
    
    try {
      const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
      return Math.max(0, 1 - distance); // Convert distance to confidence (0-1)
    } catch (error) {
      console.error('Face comparison error:', error);
      return 0;
    }
  }, []);

  const findMatchingFace = useCallback(
    (newDescriptor: Float32Array, existingDescriptors: { id: string; descriptor: Float32Array }[]): FaceDetectionResult => {
      if (!newDescriptor || !isLoaded) {
        return { isMatch: false, confidence: 0 };
      }

      let bestMatch = { id: '', confidence: 0 };
      const threshold = 0.6; // Confidence threshold for face matching

      existingDescriptors.forEach(({ id, descriptor }) => {
        const confidence = compareFaces(newDescriptor, descriptor);
        if (confidence > bestMatch.confidence) {
          bestMatch = { id, confidence };
        }
      });

      return {
        isMatch: bestMatch.confidence > threshold,
        confidence: bestMatch.confidence,
        attendeeId: bestMatch.confidence > threshold ? bestMatch.id : undefined
      };
    },
    [compareFaces, isLoaded]
  );

  return {
    isLoaded,
    isLoading,
    detectFaceFromImage,
    compareFaces,
    findMatchingFace
  };
};
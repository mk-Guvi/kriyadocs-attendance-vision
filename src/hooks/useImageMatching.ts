import { useState, useCallback, useRef, useEffect } from 'react';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface ImageMatchResult {
  isMatch: boolean;
  confidence: number;
  attendeeId?: string;
}

export const useImageMatching = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const featureExtractorRef = useRef<any>(null);

  useEffect(() => {
    const loadModel = async () => {
      if (featureExtractorRef.current) return;
      
      setIsLoading(true);
      try {
        console.log('Loading image feature extractor...');
        // Use a lightweight model for feature extraction
        const extractor = await pipeline(
          'feature-extraction',
          'mixedbread-ai/mxbai-embed-xsmall-v1',
          { 
            device: 'webgpu',
            dtype: 'fp16',
          }
        );
        
        featureExtractorRef.current = extractor;
        setIsLoaded(true);
        console.log('Image feature extractor loaded successfully');
      } catch (error) {
        console.error('Failed to load image feature extractor:', error);
        // Fall back to CPU if WebGPU fails
        try {
          const extractor = await pipeline(
            'feature-extraction',
            'mixedbread-ai/mxbai-embed-xsmall-v1',
            { device: 'cpu' }
          );
          featureExtractorRef.current = extractor;
          setIsLoaded(true);
          console.log('Image feature extractor loaded on CPU');
        } catch (cpuError) {
          console.error('Failed to load on CPU as well:', cpuError);
          setIsLoaded(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  const extractImageFeatures = useCallback(async (imageDataUrl: string): Promise<Float32Array | null> => {
    if (!featureExtractorRef.current || !isLoaded) {
      console.log('Feature extractor not ready');
      return null;
    }

    try {
      // Convert base64 to image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            // Create canvas to process image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }

            // Resize to standard size for consistent features
            const size = 224;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);

            // Convert to ImageData
            const imageData = ctx.getImageData(0, 0, size, size);
            
            // Convert to normalized tensor-like format
            const pixels = new Float32Array(size * size * 3);
            for (let i = 0; i < imageData.data.length; i += 4) {
              const pixelIndex = i / 4;
              pixels[pixelIndex] = imageData.data[i] / 255.0;     // R
              pixels[pixelIndex + size * size] = imageData.data[i + 1] / 255.0; // G
              pixels[pixelIndex + size * size * 2] = imageData.data[i + 2] / 255.0; // B
            }

            // Extract features using the model
            const features = await featureExtractorRef.current(pixels);
            
            // Convert to Float32Array
            const featureArray = new Float32Array(features.data || features);
            console.log('Extracted features:', featureArray.length, 'dimensions');
            resolve(featureArray);
          } catch (error) {
            console.error('Error extracting features:', error);
            reject(error);
          }
        };

        img.onerror = () => {
          console.error('Failed to load image for feature extraction');
          reject(new Error('Failed to load image'));
        };

        img.src = imageDataUrl;
      });
    } catch (error) {
      console.error('Image feature extraction error:', error);
      return null;
    }
  }, [isLoaded]);

  const compareImages = useCallback((features1: Float32Array, features2: Float32Array): number => {
    if (!features1 || !features2 || features1.length !== features2.length) {
      return 0;
    }

    try {
      // Calculate cosine similarity
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < features1.length; i++) {
        dotProduct += features1[i] * features2[i];
        norm1 += features1[i] * features1[i];
        norm2 += features2[i] * features2[i];
      }

      const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
      
      // Convert to confidence score (0-1)
      const confidence = Math.max(0, (similarity + 1) / 2);
      
      console.log('Image similarity:', similarity, 'confidence:', confidence);
      return confidence;
    } catch (error) {
      console.error('Error comparing images:', error);
      return 0;
    }
  }, []);

  const findMatchingImage = useCallback(
    (newImageFeatures: Float32Array, existingImages: { id: string; features: Float32Array }[]): ImageMatchResult => {
      if (!newImageFeatures || !isLoaded) {
        return { isMatch: false, confidence: 0 };
      }

      let bestMatch = { id: '', confidence: 0 };
      const threshold = 0.75; // Confidence threshold for image matching

      existingImages.forEach(({ id, features }) => {
        const confidence = compareImages(newImageFeatures, features);
        if (confidence > bestMatch.confidence) {
          bestMatch = { id, confidence };
        }
      });

      console.log('Best image match:', bestMatch);

      return {
        isMatch: bestMatch.confidence > threshold,
        confidence: bestMatch.confidence,
        attendeeId: bestMatch.confidence > threshold ? bestMatch.id : undefined
      };
    },
    [compareImages, isLoaded]
  );

  // Fallback: Simple pixel-based comparison for when ML model fails
  const simpleImageCompare = useCallback((img1: string, img2: string): Promise<number> => {
    return new Promise((resolve) => {
      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');
      const ctx1 = canvas1.getContext('2d');
      const ctx2 = canvas2.getContext('2d');

      if (!ctx1 || !ctx2) {
        resolve(0);
        return;
      }

      const image1 = new Image();
      const image2 = new Image();
      let loaded = 0;

      const processImages = () => {
        loaded++;
        if (loaded !== 2) return;

        try {
          // Resize both images to same small size for comparison
          const size = 64;
          canvas1.width = canvas2.width = size;
          canvas1.height = canvas2.height = size;

          ctx1.drawImage(image1, 0, 0, size, size);
          ctx2.drawImage(image2, 0, 0, size, size);

          const data1 = ctx1.getImageData(0, 0, size, size).data;
          const data2 = ctx2.getImageData(0, 0, size, size).data;

          // Calculate simple pixel difference
          let totalDiff = 0;
          for (let i = 0; i < data1.length; i += 4) {
            const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
            const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];
            totalDiff += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
          }

          const maxDiff = size * size * 3 * 255;
          const similarity = 1 - (totalDiff / maxDiff);
          
          console.log('Simple image similarity:', similarity);
          resolve(Math.max(0, similarity));
        } catch (error) {
          console.error('Simple image comparison error:', error);
          resolve(0);
        }
      };

      image1.onload = processImages;
      image2.onload = processImages;
      image1.onerror = () => resolve(0);
      image2.onerror = () => resolve(0);

      image1.src = img1;
      image2.src = img2;
    });
  }, []);

  return {
    isLoaded,
    isLoading,
    extractImageFeatures,
    compareImages,
    findMatchingImage,
    simpleImageCompare
  };
};
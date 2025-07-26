# Face Detection Models

This directory should contain the face-api.js model files for face detection and recognition.

## Required Files

Download the following model files and place them in this directory:

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_landmark_68_model-weights_manifest.json** 
4. **face_landmark_68_model-shard1**
5. **face_recognition_model-weights_manifest.json**
6. **face_recognition_model-shard1**
7. **face_recognition_model-shard2**

## Download Sources

Models can be downloaded from:
- [face-api.js GitHub repository](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
- [Official face-api.js models](https://github.com/justadudewhohacks/face-api.js/blob/master/README.md#models)

## Model Information

- **Tiny Face Detector**: Lightweight face detection model (~300KB)
- **Face Landmark 68**: 68-point facial landmark detection
- **Face Recognition**: Face descriptor generation for matching

## Usage

The application will automatically load these models on startup if they are present. If models are not found, the app will continue to work but without face recognition capabilities.

## Docker Deployment

For Docker deployments, ensure these model files are copied into the container:

```dockerfile
COPY public/models/ /usr/share/nginx/html/models/
```

## Performance

- Model loading time: ~2-5 seconds on first load
- Models are cached by the browser after first load
- Total model size: ~6-8MB
- WebGL acceleration supported for faster inference
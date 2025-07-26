import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isProcessing?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  onCapture, 
  isProcessing = false 
}) => {
  const { videoRef, cameraState, startCamera, stopCamera, captureImage } = useCamera();

  const handleCapture = () => {
    const imageData = captureImage();
    if (imageData) {
      onCapture(imageData);
    }
  };

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            className={cn(
              "w-full aspect-video bg-muted rounded-lg object-cover",
              !cameraState.isActive && "hidden"
            )}
            playsInline
            muted
          />
          
          {!cameraState.isActive && (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Camera not active</p>
              </div>
            </div>
          )}

          {cameraState.isLoading && (
            <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Starting camera...</p>
              </div>
            </div>
          )}
        </div>

        {cameraState.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{cameraState.error}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!cameraState.isActive ? (
            <Button 
              onClick={startCamera} 
              disabled={cameraState.isLoading}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button 
                onClick={stopCamera}
                variant="outline"
                className="flex-1"
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
              <Button 
                onClick={handleCapture}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Capture
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
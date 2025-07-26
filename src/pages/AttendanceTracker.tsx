import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';

import { CameraCapture } from '@/components/CameraCapture';
import { AttendanceForm } from '@/components/AttendanceForm';
import { AttendanceStatus } from '@/components/AttendanceStatus';
import { AttendanceList } from '@/components/AttendanceList';

import { useAttendanceStore } from '@/hooks/useAttendanceStore';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { AttendeeProfile } from '@/types/attendance';

type Step = 'form' | 'capture' | 'processing' | 'complete';

const AttendanceTracker: React.FC = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('form');
  const [currentUser, setCurrentUser] = useState<Partial<AttendeeProfile>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  
  const {
    records,
    profiles,
    addRecord,
    updateProfile,
    getProfile,
    getRecentRecords,
    getFaceDescriptors,
    clearAllData
  } = useAttendanceStore();

  const { isLoaded: faceDetectionLoaded, detectFaceFromImage, findMatchingFace } = useFaceDetection();

  const recentRecords = getRecentRecords(20);
  const currentlyPresent = profiles.filter(p => p.currentStatus === 'IN').length;

  const handleFormSubmit = useCallback((formData: { name: string; email: string }) => {
    setCurrentUser(formData);
    setStep('capture');
  }, []);

  const processAttendance = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // Create image element for face detection
      const img = new Image();
      img.onload = async () => {
        let faceDescriptor: Float32Array | null = null;
        let matchResult = { isMatch: false, confidence: 0, attendeeId: undefined };

        // Try face detection if available
        if (faceDetectionLoaded) {
          faceDescriptor = await detectFaceFromImage(img);
          
          if (faceDescriptor) {
            const existingDescriptors = getFaceDescriptors();
            const result = findMatchingFace(faceDescriptor, existingDescriptors);
            matchResult = {
              isMatch: result.isMatch,
              confidence: result.confidence,
              attendeeId: result.attendeeId
            };
          }
        }

        // Determine user ID and entry type
        let userId: string;
        let entryType: 'ENTRY' | 'EXIT';
        let profileData: AttendeeProfile;

        if (matchResult.isMatch && matchResult.attendeeId) {
          // Known user - toggle their status
          userId = matchResult.attendeeId;
          const existingProfile = getProfile(userId)!;
          entryType = existingProfile.currentStatus === 'OUT' ? 'ENTRY' : 'EXIT';
          
          profileData = {
            ...existingProfile,
            lastImage: imageData,
            currentStatus: entryType === 'ENTRY' ? 'IN' : 'OUT',
            ...(entryType === 'ENTRY' ? { lastEntry: new Date() } : { lastExit: new Date() }),
            faceDescriptor: faceDescriptor || existingProfile.faceDescriptor
          };

          // Show match confidence
          toast({
            title: `Welcome back, ${existingProfile.name}!`,
            description: `Face match confidence: ${(matchResult.confidence * 100).toFixed(1)}%`,
            duration: 3000,
          });
        } else {
          // New user or no face match - default to entry
          userId = crypto.randomUUID();
          entryType = 'ENTRY';
          
          profileData = {
            id: userId,
            name: currentUser.name || 'Unknown User',
            email: currentUser.email || 'unknown@example.com',
            lastImage: imageData,
            currentStatus: 'IN',
            lastEntry: new Date(),
            faceDescriptor
          };

          if (faceDetectionLoaded && !faceDescriptor) {
            toast({
              title: "No face detected",
              description: "Attendance recorded without face recognition",
              variant: "default",
            });
          }
        }

        // Create attendance record
        const record = addRecord({
          name: profileData.name,
          email: profileData.email,
          image: imageData,
          type: entryType,
          faceDescriptor
        });

        // Update profile
        updateProfile(profileData);

        // Update current user for display
        setCurrentUser(profileData);

        // Show success message
        toast({
          title: entryType === 'ENTRY' ? "Checked In Successfully!" : "Checked Out Successfully!",
          description: `${profileData.name} - ${record.timestamp.toLocaleString()}`,
          duration: 5000,
        });

        setStep('complete');
      };

      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to process the captured image",
          variant: "destructive",
        });
        setStep('capture');
      };

      img.src = imageData;
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process attendance. Please try again.",
        variant: "destructive",
      });
      setStep('capture');
    } finally {
      setIsProcessing(false);
    }
  }, [
    currentUser,
    faceDetectionLoaded,
    detectFaceFromImage,
    findMatchingFace,
    getFaceDescriptors,
    getProfile,
    addRecord,
    updateProfile,
    toast
  ]);

  const resetFlow = useCallback(() => {
    setStep('form');
    setCurrentUser({});
    setIsProcessing(false);
  }, []);

  const handleClearData = useCallback(() => {
    clearAllData();
    toast({
      title: "Data Cleared",
      description: "All attendance records have been removed",
    });
  }, [clearAllData, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Smart Attendance Tracker
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered attendance system with face recognition
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{currentlyPresent} Present</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{records.length} Total Records</span>
                </div>
              </div>
              
              {!faceDetectionLoaded && (
                <Badge variant="outline" className="border-warning text-warning">
                  Face Detection Loading
                </Badge>
              )}
              
              {faceDetectionLoaded && (
                <Badge variant="default" className="bg-success text-success-foreground">
                  Face Detection Ready
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Attendance Flow */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Attendance Check-in/out</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFlow}
                      disabled={isProcessing}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    {records.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearData}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {step === 'form' && (
                  <AttendanceForm
                    onSubmit={handleFormSubmit}
                    isLoading={isProcessing}
                  />
                )}

                {step === 'capture' && (
                  <CameraCapture
                    onCapture={processAttendance}
                    isProcessing={isProcessing}
                  />
                )}

                {step === 'processing' && (
                  <div className="text-center py-12">
                    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">Processing Attendance</h3>
                    <p className="text-muted-foreground">
                      {faceDetectionLoaded ? 'Analyzing face and matching records...' : 'Recording attendance...'}
                    </p>
                  </div>
                )}

                {step === 'complete' && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Attendance Recorded!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you, {currentUser.name}. Your attendance has been logged.
                    </p>
                    <Button onClick={resetFlow} className="bg-gradient-to-r from-primary to-primary/80">
                      Record Another Attendance
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Status */}
            {recentRecords.length > 0 && currentUser.name && (
              <AttendanceStatus
                profile={currentUser as AttendeeProfile}
                recentRecord={recentRecords[0]}
                totalPresent={currentlyPresent}
              />
            )}
          </div>

          {/* Attendance History */}
          <div>
            <AttendanceList records={recentRecords} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
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
import { useImageMatching } from '@/hooks/useImageMatching';
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
    getImageFeatures,
    getTodayEntryRecord,
    clearAllData
  } = useAttendanceStore();

  const { isLoaded: faceDetectionLoaded, detectFaceFromImage, findMatchingFace } = useFaceDetection();
  const { 
    isLoaded: imageMatchingLoaded, 
    isLoading: imageMatchingLoading,
    extractImageFeatures, 
    findMatchingImage,
    simpleImageCompare 
  } = useImageMatching();

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
      // Create image element for processing
      const img = new Image();
      img.onload = async () => {
        let faceDescriptor: Float32Array | null = null;
        let imageFeatures: Float32Array | null = null;
        let matchResult: { isMatch: boolean; confidence: number; attendeeId: string | undefined } = { 
          isMatch: false, 
          confidence: 0, 
          attendeeId: undefined 
        };

        console.log('Processing image for matching...');

        // Try face detection first (if available)
        if (faceDetectionLoaded) {
          console.log('Attempting face detection...');
          faceDescriptor = await detectFaceFromImage(img);
          
          if (faceDescriptor) {
            console.log('Face detected, attempting face matching...');
            // Legacy face matching - kept for compatibility but not used primarily
            const existingDescriptors = profiles
              .filter(p => p.faceDescriptor)
              .map(p => ({ id: p.id, descriptor: p.faceDescriptor! }));
            
            if (existingDescriptors.length > 0) {
              const result = findMatchingFace(faceDescriptor, existingDescriptors);
              if (result.isMatch) {
                matchResult = {
                  isMatch: result.isMatch,
                  confidence: result.confidence,
                  attendeeId: result.attendeeId
                };
                console.log('Face match found:', matchResult);
              }
            }
          }
        }

        // Try image feature extraction and matching (primary method)
        if (!matchResult.isMatch) {
          console.log('Attempting image feature extraction...');
          if (imageMatchingLoaded) {
            imageFeatures = await extractImageFeatures(imageData);
            
            if (imageFeatures) {
              console.log('Image features extracted, attempting image matching...');
              const existingImages = getImageFeatures();
              const imageMatchResult = findMatchingImage(imageFeatures, existingImages);
              
              if (imageMatchResult.isMatch) {
                matchResult = {
                  isMatch: imageMatchResult.isMatch,
                  confidence: imageMatchResult.confidence,
                  attendeeId: imageMatchResult.attendeeId
                };
                console.log('Image match found:', matchResult);
              }
            }
          }
        }

        // Fallback: Simple image comparison for existing profiles
        if (!matchResult.isMatch && profiles.length > 0) {
          console.log('Trying simple image comparison fallback...');
          let bestSimpleMatch = { id: '', confidence: 0 };
          
          for (const profile of profiles) {
            if (profile.lastImage) {
              const similarity = await simpleImageCompare(imageData, profile.lastImage);
              if (similarity > bestSimpleMatch.confidence) {
                bestSimpleMatch = { id: profile.id, confidence: similarity };
              }
            }
          }
          
          const simpleThreshold = 0.8; // High threshold for simple comparison
          if (bestSimpleMatch.confidence > simpleThreshold) {
            matchResult = {
              isMatch: true,
              confidence: bestSimpleMatch.confidence,
              attendeeId: bestSimpleMatch.id
            };
            console.log('Simple image match found:', matchResult);
          }
        }

        // Determine user ID and entry type
        let userId: string;
        let entryType: 'ENTRY' | 'EXIT';
        let profileData: AttendeeProfile;

        if (matchResult.isMatch && matchResult.attendeeId) {
          // Known user via face match - check for same-day validation
          userId = matchResult.attendeeId;
          const existingProfile = getProfile(userId)!;
          entryType = existingProfile.currentStatus === 'OUT' ? 'ENTRY' : 'EXIT';
          
          // If trying to EXIT, validate image matches today's ENTRY
          if (entryType === 'EXIT') {
            const todayEntry = getTodayEntryRecord(userId);
            if (todayEntry) {
              const similarity = await simpleImageCompare(imageData, todayEntry.image);
              if (similarity < 0.7) { // Threshold for same-day image validation
                toast({
                  title: "Check-out Failed",
                  description: "Image does not match today's check-in. Please use the same appearance as when you checked in.",
                  variant: "destructive",
                });
                setStep('capture');
                setIsProcessing(false);
                return;
              }
            }
          }
          
          profileData = {
            ...existingProfile,
            lastImage: imageData,
            currentStatus: entryType === 'ENTRY' ? 'IN' : 'OUT',
            ...(entryType === 'ENTRY' ? { lastEntry: new Date() } : { lastExit: new Date() }),
            imageFeatures: imageFeatures || existingProfile.imageFeatures,
            faceDescriptor: faceDescriptor || existingProfile.faceDescriptor
          };

          // Show match confidence
          const matchType = imageFeatures ? 'Image' : faceDescriptor ? 'Face' : 'Simple';
          toast({
            title: `Welcome back, ${existingProfile.name}!`,
            description: `${matchType} match confidence: ${(matchResult.confidence * 100).toFixed(1)}%`,
            duration: 3000,
          });
        } else {
          // Check for existing user by email (fallback when face matching fails)
          const existingProfileByEmail = profiles.find(p => 
            p.email.toLowerCase() === currentUser.email?.toLowerCase()
          );

          if (existingProfileByEmail) {
            // Known user by email - check for same-day validation
            userId = existingProfileByEmail.id;
            entryType = existingProfileByEmail.currentStatus === 'OUT' ? 'ENTRY' : 'EXIT';
            
            // If trying to EXIT, validate image matches today's ENTRY
            if (entryType === 'EXIT') {
              const todayEntry = getTodayEntryRecord(userId);
              if (todayEntry) {
                const similarity = await simpleImageCompare(imageData, todayEntry.image);
                if (similarity < 0.7) { // Threshold for same-day image validation
                  toast({
                    title: "Check-out Failed",
                    description: "Image does not match today's check-in. Please use the same appearance as when you checked in.",
                    variant: "destructive",
                  });
                  setStep('capture');
                  setIsProcessing(false);
                  return;
                }
              }
            }
            
            profileData = {
              ...existingProfileByEmail,
              lastImage: imageData,
              currentStatus: entryType === 'ENTRY' ? 'IN' : 'OUT',
              ...(entryType === 'ENTRY' ? { lastEntry: new Date() } : { lastExit: new Date() }),
              imageFeatures: imageFeatures || existingProfileByEmail.imageFeatures,
              faceDescriptor: faceDescriptor || existingProfileByEmail.faceDescriptor
            };

            toast({
              title: `${entryType === 'ENTRY' ? 'Welcome back' : 'Goodbye'}, ${existingProfileByEmail.name}!`,
              description: `Recognized by email. ${entryType === 'ENTRY' ? 'Checking in' : 'Checking out'}.`,
              duration: 3000,
            });
          } else {
            // New user - default to entry
            userId = crypto.randomUUID();
            entryType = 'ENTRY';
            
            profileData = {
              id: userId,
              name: currentUser.name || 'Unknown User',
              email: currentUser.email || 'unknown@example.com',
              lastImage: imageData,
              currentStatus: 'IN',
              lastEntry: new Date(),
              imageFeatures,
              faceDescriptor
            };

            toast({
              title: "Welcome!",
              description: `New attendee ${profileData.name} checked in.`,
              duration: 3000,
            });
          }

          if (!imageMatchingLoaded && !faceDetectionLoaded) {
            toast({
              title: "Limited functionality",
              description: "Image matching unavailable - using email fallback only",
              variant: "default",
            });
          } else if (imageMatchingLoaded && !imageFeatures && !faceDescriptor) {
            toast({
              title: "No features detected",
              description: "Attendance recorded without biometric matching",
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
          imageFeatures,
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
    profiles,
    faceDetectionLoaded,
    imageMatchingLoaded,
    detectFaceFromImage,
    findMatchingFace,
    extractImageFeatures,
    findMatchingImage,
    simpleImageCompare,
    getImageFeatures,
    getProfile,
    getTodayEntryRecord,
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
              
              {!faceDetectionLoaded && !imageMatchingLoaded && (
                <Badge variant="outline" className="border-warning text-warning">
                  Image Matching Loading
                </Badge>
              )}
              
              {(faceDetectionLoaded || imageMatchingLoaded) && (
                <Badge variant="default" className="bg-success text-success-foreground">
                  {imageMatchingLoaded ? 'AI Image Matching Ready' : 'Face Detection Ready'}
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
                      {imageMatchingLoaded ? 'Analyzing image features and matching records...' : 
                       faceDetectionLoaded ? 'Analyzing face and matching records...' : 
                       'Recording attendance...'}
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
import { useState, useCallback, useEffect } from 'react';
import { AttendanceRecord, AttendeeProfile } from '@/types/attendance';

const STORAGE_KEYS = {
  RECORDS: 'attendance_records',
  PROFILES: 'attendee_profiles'
} as const;

export const useAttendanceStore = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [profiles, setProfiles] = useState<AttendeeProfile[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
      const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);

      if (savedRecords) {
        const parsedRecords = JSON.parse(savedRecords).map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
          imageFeatures: record.imageFeatures ? new Float32Array(record.imageFeatures) : undefined,
          faceDescriptor: record.faceDescriptor ? new Float32Array(record.faceDescriptor) : undefined
        }));
        setRecords(parsedRecords);
      }

      if (savedProfiles) {
        const parsedProfiles = JSON.parse(savedProfiles).map((profile: any) => ({
          ...profile,
          lastEntry: profile.lastEntry ? new Date(profile.lastEntry) : undefined,
          lastExit: profile.lastExit ? new Date(profile.lastExit) : undefined,
          imageFeatures: profile.imageFeatures ? new Float32Array(profile.imageFeatures) : undefined,
          faceDescriptor: profile.faceDescriptor ? new Float32Array(profile.faceDescriptor) : undefined
        }));
        setProfiles(parsedProfiles);
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    }
  }, []);

  // Save records to localStorage
  const saveRecords = useCallback((newRecords: AttendanceRecord[]) => {
    try {
      const serializedRecords = newRecords.map(record => ({
        ...record,
        imageFeatures: record.imageFeatures ? Array.from(record.imageFeatures) : undefined,
        faceDescriptor: record.faceDescriptor ? Array.from(record.faceDescriptor) : undefined
      }));
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(serializedRecords));
    } catch (error) {
      console.error('Failed to save records:', error);
    }
  }, []);

  // Save profiles to localStorage
  const saveProfiles = useCallback((newProfiles: AttendeeProfile[]) => {
    try {
      const serializedProfiles = newProfiles.map(profile => ({
        ...profile,
        imageFeatures: profile.imageFeatures ? Array.from(profile.imageFeatures) : undefined,
        faceDescriptor: profile.faceDescriptor ? Array.from(profile.faceDescriptor) : undefined
      }));
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(serializedProfiles));
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  }, []);

  // Add new attendance record
  const addRecord = useCallback((record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    saveRecords(updatedRecords);

    return newRecord;
  }, [records, saveRecords]);

  // Update or create attendee profile
  const updateProfile = useCallback((profileData: Partial<AttendeeProfile> & { id: string }) => {
    const existingIndex = profiles.findIndex(p => p.id === profileData.id);
    let updatedProfiles: AttendeeProfile[];

    if (existingIndex >= 0) {
      updatedProfiles = profiles.map((profile, index) =>
        index === existingIndex ? { ...profile, ...profileData } : profile
      );
    } else {
      const newProfile: AttendeeProfile = {
        name: '',
        email: '',
        lastImage: '',
        currentStatus: 'OUT',
        ...profileData,
        id: profileData.id
      };
      updatedProfiles = [...profiles, newProfile];
    }

    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
  }, [profiles, saveProfiles]);

  // Get attendee profile by ID
  const getProfile = useCallback((id: string): AttendeeProfile | undefined => {
    return profiles.find(p => p.id === id);
  }, [profiles]);

  // Get recent records (last 50)
  const getRecentRecords = useCallback((limit = 50): AttendanceRecord[] => {
    return records.slice(0, limit);
  }, [records]);

  // Get all image features for matching
  const getImageFeatures = useCallback(() => {
    return profiles
      .filter(p => p.imageFeatures)
      .map(p => ({
        id: p.id,
        features: p.imageFeatures!
      }));
  }, [profiles]);

  // Clear all data
  const clearAllData = useCallback(() => {
    setRecords([]);
    setProfiles([]);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
  }, []);

  return {
    records,
    profiles,
    addRecord,
    updateProfile,
    getProfile,
    getRecentRecords,
    getImageFeatures,
    getFaceDescriptors: getImageFeatures, // Keep for backwards compatibility
    clearAllData
  };
};
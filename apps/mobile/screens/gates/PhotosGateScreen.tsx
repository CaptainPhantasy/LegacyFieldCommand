import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { database } from '../../db';
import JobGate from '../../db/model/JobGate';
import JobPhoto from '../../db/model/JobPhoto';
import { supabase } from '../../lib/supabase';
import PhotoCapture from '../../components/PhotoCapture';
import { validateGate } from '../../utils/gateValidation';
// Note: Local canCompleteGate() is for UI feedback, validateGate() is for final validation

interface PhotosGateScreenProps {
  route: {
    params: {
      gateId: string;
      jobId: string;
    };
  };
}

const ROOMS = ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Basement', 'Attic', 'Exterior', 'Other'];
const PHOTO_TYPES = ['Wide shot', 'Close-up damage', 'Equipment', 'PPE', 'Other'];
const AFFECTED_AREAS = ['North wall', 'South wall', 'East wall', 'West wall', 'Floor', 'Ceiling', 'Cabinets', 'Other'];

export default function PhotosGateScreen({ route }: PhotosGateScreenProps) {
  const navigation = useNavigation();
  const { gateId, jobId } = route.params;
  const [gate, setGate] = useState<JobGate | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomPhotos, setRoomPhotos] = useState<Record<string, Array<{ uri: string; type: string; area: string }>>>({});
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<string>('');
  const [currentPhotoArea, setCurrentPhotoArea] = useState<string>('');

  React.useEffect(() => {
    const fetchGate = async () => {
      const gatesCollection = database.collections.get<JobGate>('job_gates');
      const foundGate = await gatesCollection.find(gateId);
      setGate(foundGate);
    };
    fetchGate();
  }, [gateId]);

  const handlePhotoTaken = async (uri: string) => {
    if (!selectedRoom) {
      Alert.alert('Select Room', 'Please select a room first');
      return;
    }

    // Show modal to select photo type and affected area
    Alert.alert(
      'Photo Details',
      'Select photo type and affected area',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Wide shot',
          onPress: () => {
            Alert.alert('Affected Area', 'Select affected area', [
              ...AFFECTED_AREAS.map(area => ({
                text: area,
                onPress: () => {
                  addPhotoToRoom(selectedRoom, uri, 'Wide shot', area);
                },
              })),
              { text: 'Cancel', style: 'cancel' },
            ]);
          },
        },
        {
          text: 'Close-up damage',
          onPress: () => {
            Alert.alert('Affected Area', 'Select affected area', [
              ...AFFECTED_AREAS.map(area => ({
                text: area,
                onPress: () => {
                  addPhotoToRoom(selectedRoom, uri, 'Close-up damage', area);
                },
              })),
              { text: 'Cancel', style: 'cancel' },
            ]);
          },
        },
        {
          text: 'Equipment',
          onPress: () => addPhotoToRoom(selectedRoom, uri, 'Equipment', 'N/A'),
        },
        {
          text: 'PPE',
          onPress: () => addPhotoToRoom(selectedRoom, uri, 'PPE', 'N/A'),
        },
      ]
    );
  };

  const addPhotoToRoom = (room: string, uri: string, type: string, area: string) => {
    setRoomPhotos(prev => ({
      ...prev,
      [room]: [...(prev[room] || []), { uri, type, area }],
    }));
  };

  const getRoomPhotoCount = (room: string) => {
    return roomPhotos[room]?.length || 0;
  };

  const canCompleteGate = () => {
    const roomsWithPhotos = Object.keys(roomPhotos).filter(room => roomPhotos[room].length >= 3);
    return roomsWithPhotos.length > 0;
  };

  const handleCompleteGate = async () => {
    // Validate gate using validation utility
    const validation = await validateGate(gateId, jobId);
    if (!validation.isValid) {
      Alert.alert(
        'Gate Incomplete',
        validation.errors.join('\n\n') + (validation.warnings.length > 0 ? '\n\nWarnings:\n' + validation.warnings.join('\n') : ''),
        [{ text: 'OK' }]
      );
      return;
    }

    if (!canCompleteGate()) {
      Alert.alert(
        'Incomplete Documentation',
        'You must document at least one room with a minimum of 3 photos (wide shot, close-up, context).',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Upload all photos and create records
      for (const [room, photos] of Object.entries(roomPhotos)) {
        for (const photo of photos) {
          const photoResponse = await fetch(photo.uri);
          const blob = await photoResponse.blob();
          const fileName = `${room}_${photo.type}_${Date.now()}.jpg`;
          const filePath = `jobs/${jobId}/photos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('job-photos')
            .upload(filePath, blob, { contentType: 'image/jpeg' });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          // Save to local DB
          const photosCollection = database.collections.get('job_photos');
          await photosCollection.create((p: any) => {
            p.jobId = jobId;
            p.gateId = gateId;
            p.storagePath = filePath;
            p.metadata = JSON.stringify({
              room,
              type: photo.type,
              affectedArea: photo.area,
            });
            p.isPpe = photo.type === 'PPE';
            p.createdAt = Date.now();
          });
        }
      }

      // Update gate status
      const gatesCollection = database.collections.get<JobGate>('job_gates');
      await database.write(async () => {
        const gateToUpdate = await gatesCollection.find(gateId);
        await gateToUpdate.update((g: JobGate) => {
          g.status = 'complete';
          g.completedAt = Date.now();
        });
      });

      Alert.alert('Success', 'Photos gate completed!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete gate');
    }
  };

  if (!gate) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos Gate</Text>
        <Text style={styles.subtitle}>Document rooms with photos</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.requirementCard}>
          <Text style={styles.requirementTitle}>Required per room:</Text>
          <Text style={styles.requirementText}>• Wide room shot</Text>
          <Text style={styles.requirementText}>• Close-up of damage</Text>
          <Text style={styles.requirementText}>• Context/equipment photo</Text>
          <Text style={styles.requirementText}>• Minimum 3 photos per documented room</Text>
        </View>

        <View style={styles.roomsSection}>
          <Text style={styles.sectionTitle}>Select Room to Document</Text>
          <View style={styles.roomGrid}>
            {ROOMS.map(room => (
              <TouchableOpacity
                key={room}
                style={[
                  styles.roomButton,
                  selectedRoom === room && styles.roomButtonSelected,
                  getRoomPhotoCount(room) >= 3 && styles.roomButtonComplete,
                ]}
                onPress={() => {
                  setSelectedRoom(room);
                  setShowRoomModal(true);
                }}
              >
                <Text style={styles.roomButtonText}>{room}</Text>
                <Text style={styles.roomButtonCount}>
                  {getRoomPhotoCount(room)} photos
                </Text>
                {getRoomPhotoCount(room) >= 3 && (
                  <Text style={styles.roomButtonCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedRoom && (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>
              Photos for {selectedRoom} ({getRoomPhotoCount(selectedRoom)}/3 minimum)
            </Text>
            <PhotoCapture
              onPhotoTaken={handlePhotoTaken}
              label={`Add Photo to ${selectedRoom}`}
              required={getRoomPhotoCount(selectedRoom) < 3}
            />
            {roomPhotos[selectedRoom]?.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Text style={styles.photoItemText}>
                  {index + 1}. {photo.type} - {photo.area}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              !canCompleteGate() && styles.completeButtonDisabled,
            ]}
            onPress={handleCompleteGate}
            disabled={!canCompleteGate()}
          >
            <Text style={styles.completeButtonText}>Complete Gate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    padding: 16,
  },
  requirementCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  roomsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: '45%',
    alignItems: 'center',
  },
  roomButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  roomButtonComplete: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  roomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  roomButtonCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  roomButtonCheck: {
    fontSize: 20,
    color: '#10b981',
    marginTop: 4,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  photoItemText: {
    fontSize: 14,
    color: '#111827',
  },
  actions: {
    marginTop: 24,
  },
  completeButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});


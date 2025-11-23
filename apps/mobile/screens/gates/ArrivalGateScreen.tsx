import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { database } from '../../db';
import JobGate from '../../db/model/JobGate';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { validateGate, canCompleteGate } from '../../utils/gateValidation';

interface ArrivalGateScreenProps {
  route: {
    params: {
      gateId: string;
      jobId: string;
    };
  };
}

export default function ArrivalGateScreen({ route }: ArrivalGateScreenProps) {
  const navigation = useNavigation();
  const { gateId, jobId } = route.params;
  const [gate, setGate] = useState<JobGate | null>(null);
  const [arrivalPhotoUri, setArrivalPhotoUri] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  React.useEffect(() => {
    const fetchGate = async () => {
      const gatesCollection = database.collections.get<JobGate>('job_gates');
      const foundGate = await gatesCollection.find(gateId);
      setGate(foundGate);
    };
    fetchGate();
  }, [gateId]);

  const handleTakeArrivalPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take arrival photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setArrivalPhotoUri(result.assets[0].uri);
    }
  };

  const handleCompleteGate = async () => {
    // Validate gate before completion
    const validation = await validateGate(gateId, jobId);
    if (!validation.isValid) {
      Alert.alert(
        'Gate Incomplete',
        validation.errors.join('\n\n'),
        [
          { text: 'Log Exception', onPress: () => handleException() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!arrivalPhotoUri && !gate?.requiresException) {
      Alert.alert(
        'Photo Required',
        'You must take an arrival photo before completing this gate. If you cannot take a photo, you must log an exception.',
        [
          { text: 'Take Exception', onPress: () => handleException() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setIsCompleting(true);
    try {
      // Upload photo to Supabase Storage
      const photoResponse = await fetch(arrivalPhotoUri);
      const blob = await photoResponse.blob();
      const fileName = `arrival_${jobId}_${Date.now()}.jpg`;
      const filePath = `jobs/${jobId}/photos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Save photo record to local DB
      const photosCollection = database.collections.get('job_photos');
      await photosCollection.create((photo: any) => {
        photo.jobId = jobId;
        photo.gateId = gateId;
        photo.storagePath = filePath;
        photo.metadata = JSON.stringify({ type: 'arrival', stage: 'Arrival' });
        photo.isPpe = false;
        photo.createdAt = Date.now();
      });

      // Update gate status
      const gatesCollection = database.collections.get<JobGate>('job_gates');
      await database.write(async () => {
        const gateToUpdate = await gatesCollection.find(gateId);
        await gateToUpdate.update((g: JobGate) => {
          g.status = 'complete';
          g.completedAt = Date.now();
          g.completedBy = (supabase.auth.getUser() as any).then((u: any) => u.data.user?.id) || null;
        });
      });

      Alert.alert('Success', 'Arrival gate completed!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete gate');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleException = async () => {
    Alert.prompt(
      'Exception Reason',
      'Please provide a reason why you cannot complete the arrival gate:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: async (reason) => {
            if (!reason || reason.trim().length === 0) {
              Alert.alert('Error', 'Exception reason is required');
              return;
            }

            try {
              const gatesCollection = database.collections.get<JobGate>('job_gates');
              await database.write(async () => {
                const gateToUpdate = await gatesCollection.find(gateId);
                await gateToUpdate.update((g: JobGate) => {
                  g.status = 'skipped';
                  g.requiresException = true;
                  g.exceptionReason = reason;
                  g.completedAt = Date.now();
                });
              });

              Alert.alert('Exception Logged', 'Gate marked with exception.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to log exception');
            }
          },
        },
      ],
      'plain-text'
    );
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
        <Text style={styles.title}>Arrival Gate</Text>
        <Text style={styles.subtitle}>Document your arrival on-site</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.requirementCard}>
          <Text style={styles.requirementTitle}>Required:</Text>
          <Text style={styles.requirementText}>• Arrival photo (exterior of property/unit)</Text>
          <Text style={styles.requirementText}>• Timestamp (auto-captured)</Text>
        </View>

        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Arrival Photo</Text>
          {arrivalPhotoUri ? (
            <View style={styles.photoPreview}>
              <Text style={styles.photoPreviewText}>Photo captured ✓</Text>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleTakeArrivalPhoto}
              >
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleTakeArrivalPhoto}
            >
              <Text style={styles.captureButtonText}>📷 Take Arrival Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.completeButton, !arrivalPhotoUri && styles.completeButtonDisabled]}
            onPress={handleCompleteGate}
            disabled={!arrivalPhotoUri || isCompleting}
          >
            <Text style={styles.completeButtonText}>
              {isCompleting ? 'Completing...' : 'Complete Gate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exceptionButton}
            onPress={handleException}
          >
            <Text style={styles.exceptionButtonText}>Log Exception</Text>
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
  photoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  captureButton: {
    backgroundColor: '#3b82f6',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  photoPreview: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  photoPreviewText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  retakeButton: {
    padding: 8,
  },
  retakeButtonText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  actions: {
    gap: 12,
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
  exceptionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  exceptionButtonText: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
  },
});


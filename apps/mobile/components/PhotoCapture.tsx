import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface PhotoCaptureProps {
  onPhotoTaken: (uri: string) => void;
  label?: string;
  required?: boolean;
}

export default function PhotoCapture({ onPhotoTaken, label = 'Take Photo', required = false }: PhotoCaptureProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      onPhotoTaken(result.assets[0].uri);
    }
  };

  const handleSelectFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      onPhotoTaken(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
              <Text style={styles.actionButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSelectFromLibrary}>
              <Text style={styles.actionButtonText}>Choose Different</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.captureContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <Text style={styles.captureButtonText}>📷 {label}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.libraryButton} onPress={handleSelectFromLibrary}>
            <Text style={styles.libraryButtonText}>Choose from Library</Text>
          </TouchableOpacity>
          {required && (
            <Text style={styles.requiredText}>* This photo is required</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  libraryButton: {
    padding: 12,
  },
  libraryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  requiredText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});


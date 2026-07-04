import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export async function compressImage(uri: string): Promise<string> {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipResult.uri;
}

export async function uploadTripPhoto(
  userId: string,
  tripId: string,
  photoUri: string,
  type: 'start' | 'end'
): Promise<string> {
  const compressedUri = await compressImage(photoUri);
  const filePath = `${userId}/${tripId}/${type}.jpg`;

  if (Platform.OS === 'web') {
    // Web: use fetch/blob approach
    const response = await fetch(compressedUri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from('trip-photos')
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
  } else {
    // Native (Android/iOS): use base64 → ArrayBuffer approach
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = decode(base64);
    const { error } = await supabase.storage
      .from('trip-photos')
      .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
  }

  return filePath;
}

export async function getSignedPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('trip-photos')
    .createSignedUrl(path, 86400);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteTripPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('trip-photos')
    .remove([path]);
  if (error) throw error;
}

// utils/media.ts
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

export async function checkPhotoPermission(): Promise<boolean> {
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  return status === "granted";
}

export async function checkCameraPermission(): Promise<boolean> {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status === "granted";
}

export async function requestPhotoPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
}

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === "granted";
}

export async function openGallery(
  options: ImagePicker.ImagePickerOptions = {},
) {
  // Ensure library permission
  if (!(await checkPhotoPermission())) {
    const granted = await requestPhotoPermission();
    if (!granted) {
      throw new Error("Photo library permission denied");
    }
  }

  // Launch
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    ...options,
  });
}

export async function openCamera(options: ImagePicker.ImagePickerOptions = {}) {
  // Ensure camera permission
  if (!(await checkCameraPermission())) {
    const granted = await requestCameraPermission();
    if (!granted) {
      throw new Error("Camera permission denied");
    }
  }

  // Launch
  return ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    ...options,
  });
}

export async function downloadImageToLibrary(
  imageUrl: string,
  fileName?: string,
): Promise<MediaLibrary.Asset> {
  if (!(await checkPhotoPermission())) {
    const granted = await requestPhotoPermission();
    if (!granted) {
      throw new Error("Photo library permission denied");
    }
  }
  const name =
    fileName || imageUrl.split("/").pop() || `download-${Date.now()}`;
  const extension = name.includes(".") ? "" : ".jpg";
  const localUri =
    ((FileSystem as any).cacheDirectory || "") +
    (name.endsWith(extension) ? name : name + extension);

  const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
  if (downloadResult.status !== 200) {
    throw new Error(`Failed to download image: HTTP ${downloadResult.status}`);
  }

  const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
  return asset;
}

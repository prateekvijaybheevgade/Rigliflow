export interface UploadBlobResult {
  success: boolean;
  url: string;
  downloadUrl?: string;
  pathname?: string;
  contentType?: string;
  isFallback?: boolean;
  message?: string;
  error?: string;
}

export interface StoredBlobItem {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

/**
 * Uploads a base64 string or data URL to Vercel Blob storage.
 * Gracefully falls back to inline data URL if storage token is not yet configured.
 */
export async function uploadBase64ToStorage(
  fileBase64: string,
  filename: string,
  mimeType: string = 'image/png'
): Promise<UploadBlobResult> {
  try {
    const response = await fetch('/api/upload-blob', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64, filename, mimeType }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.warn('[StorageService] Falling back to inline data URI:', error);
    // Return original data URL as resilient fallback
    const fallbackUrl = fileBase64.startsWith('data:')
      ? fileBase64
      : `data:${mimeType};base64,${fileBase64}`;
    return {
      success: true,
      url: fallbackUrl,
      downloadUrl: fallbackUrl,
      pathname: filename,
      isFallback: true,
      message: error.message || 'Offline fallback',
    };
  }
}

/**
 * Uploads a native File or Blob object to storage.
 */
export async function uploadFileToStorage(
  file: File | Blob,
  filename?: string
): Promise<UploadBlobResult> {
  const name = filename || (file instanceof File ? file.name : `file_${Date.now()}.png`);
  const mimeType = file.type || 'application/octet-stream';

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await uploadBase64ToStorage(base64, name, mimeType);
      resolve(res);
    };
    reader.onerror = () => {
      resolve({
        success: false,
        url: '',
        error: 'Failed to read file buffer',
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Lists blobs from storage.
 */
export async function listStoredFiles(prefix: string = 'flowlify/'): Promise<StoredBlobItem[]> {
  try {
    const response = await fetch(`/api/list-blobs?prefix=${encodeURIComponent(prefix)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.blobs || [];
  } catch (error) {
    console.error('[StorageService] Error listing files:', error);
    return [];
  }
}

/**
 * Deletes a stored file by URL.
 */
export async function deleteStoredFile(url: string): Promise<boolean> {
  try {
    const response = await fetch('/api/delete-blob', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('[StorageService] Error deleting file:', error);
    return false;
  }
}

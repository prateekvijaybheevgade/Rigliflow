import { put } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileBase64, filename, mimeType = 'image/png' } = req.body || {};

    if (!fileBase64 || !filename) {
      return res.status(400).json({ error: 'Missing fileBase64 or filename parameter' });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    // Graceful fallback if Vercel Blob storage is not connected yet
    if (!blobToken) {
      const dataUri = fileBase64.startsWith('data:')
        ? fileBase64
        : `data:${mimeType};base64,${fileBase64}`;

      return res.status(200).json({
        success: true,
        url: dataUri,
        downloadUrl: dataUri,
        pathname: filename,
        contentType: mimeType,
        isFallback: true,
        message: 'BLOB_READ_WRITE_TOKEN is not set. Saved as data URI fallback.',
      });
    }

    // Strip data URI header if present
    const cleanBase64 = fileBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');

    // Clean filename and create organized path
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `flowlify/${Date.now()}-${safeFilename}`;

    let blob: any;
    try {
      blob = await put(pathname, fileBuffer, {
        access: 'public',
        contentType: mimeType,
        token: blobToken,
      });
    } catch (putErr: any) {
      // If store is configured as private, retry with access: 'private'
      if (
        putErr.message &&
        (putErr.message.includes('private') || putErr.message.includes('Cannot use public access'))
      ) {
        blob = await put(pathname, fileBuffer, {
          access: 'private',
          contentType: mimeType,
          token: blobToken,
        });
      } else {
        throw putErr;
      }
    }

    const isPrivate = blob.url?.includes('.private.blob.');
    const displayUrl = isPrivate
      ? `/api/view-blob?url=${encodeURIComponent(blob.url)}`
      : blob.url;

    return res.status(200).json({
      success: true,
      url: displayUrl,
      rawUrl: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType,
      isPrivate,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Error uploading file to Vercel Blob:', error);
    return res.status(500).json({
      error: error.message || 'Failed to upload file to Vercel Blob',
      details: error.toString(),
    });
  }
}

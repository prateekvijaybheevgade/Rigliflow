import { del } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'Missing url to delete' });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return res.status(200).json({ success: true, isFallback: true });
    }

    await del(url, { token: blobToken });

    return res.status(200).json({
      success: true,
      message: 'Blob successfully deleted',
    });
  } catch (error: any) {
    console.error('Error deleting blob from Vercel Blob:', error);
    return res.status(500).json({
      error: error.message || 'Failed to delete blob',
    });
  }
}

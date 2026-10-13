import { list } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return res.status(200).json({
        success: true,
        blobs: [],
        isFallback: true,
      });
    }

    const { prefix } = req.query || {};
    const result = await list({
      prefix: typeof prefix === 'string' ? prefix : 'flowlify/',
      token: blobToken,
    });

    return res.status(200).json({
      success: true,
      blobs: result.blobs,
      hasMore: result.hasMore,
    });
  } catch (error: any) {
    console.error('Error listing blobs from Vercel Blob:', error);
    return res.status(500).json({
      error: error.message || 'Failed to list blobs',
    });
  }
}

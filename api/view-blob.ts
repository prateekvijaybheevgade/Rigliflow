export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).send('Missing url parameter');
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch blob asset');
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const arrayBuffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Error serving blob:', err);
    return res.status(500).send(err.message || 'Error serving blob');
  }
}

import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filename = `florettes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.gif`;
    const blob = await put(filename, req, {
      access: 'public',
      contentType: 'image/gif',
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    return res.status(500).json({ error: 'Upload failed' });
  }
}

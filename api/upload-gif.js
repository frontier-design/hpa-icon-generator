import { put } from "@vercel/blob";

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

export const config = {
  api: { bodyParser: false },
};

function isAllowedOrigin(req) {
  const allowed = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : [];

  const origin = req.headers["origin"] || "";
  const referer = req.headers["referer"] || "";

  if (allowed.length === 0) return true;

  for (const pattern of allowed) {
    if (origin === pattern || referer.startsWith(pattern)) return true;
  }
  return false;
}

function collectBody(stream, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    stream.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        stream.destroy();
        reject(new Error("Body too large"));
      } else {
        chunks.push(chunk);
      }
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const contentType = (req.headers["content-type"] || "").toLowerCase();
  if (contentType !== "image/gif") {
    return res.status(400).json({ error: "Content-Type must be image/gif" });
  }

  let body;
  try {
    body = await collectBody(req, MAX_BODY_BYTES);
  } catch {
    return res.status(413).json({ error: "File too large (max 5 MB)" });
  }

  if (body.length < 6 || body.slice(0, 3).toString("ascii") !== "GIF") {
    return res.status(400).json({ error: "Not a valid GIF file" });
  }

  try {
    const filename = `florettes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.gif`;
    const blob = await put(filename, body, {
      access: "public",
      contentType: "image/gif",
    });

    return res.status(200).json({ url: blob.url });
  } catch {
    return res.status(500).json({ error: "Upload failed" });
  }
}

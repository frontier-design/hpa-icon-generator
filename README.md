# HPA Tools

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Markup & styling | HTML5, CSS | — |
| Client logic | Vanilla JavaScript (IIFE modules on `window.RA`) | — |
| 2D graphics engine | [Paper.js](http://paperjs.org/) (CDN) | `0.12.17` |
| GIF encoding | Custom `MiniGIF` encoder (`js/lib/gif-encoder.js`) | — |
| Serverless runtime | Vercel Functions (Node.js) | — |
| Cloud storage | Vercel Blob | — |

No build step, bundler, or framework.

## Libraries & Dependencies

### npm (`package.json`)

| Package | Version |
|---------|---------|
| [`@vercel/blob`](https://vercel.com/docs/storage/vercel-blob) | `^0.27.0` |

### CDN

| Library | Version | Loaded from |
|---------|---------|-------------|
| [Paper.js](http://paperjs.org/) | `0.12.17` | cdnjs.cloudflare.com |

## API

### `POST /api/upload-gif`

Uploads an animated GIF to Vercel Blob and returns its public URL. Used by the Email Signature tool so signatures can reference a stable HTTPS image.

**Request**

- Method: `POST`
- Content-Type: `image/gif`
- Body: raw GIF bytes (max **5 MB**)

**Response**

```json
{ "url": "https://<blob-store>.public.blob.vercel-storage.com/florettes/<id>.gif" }
```

**Error codes**

| Status | Reason |
|--------|--------|
| `400` | Missing or invalid GIF (`Content-Type` mismatch or bad magic bytes) |
| `403` | Origin not in `ALLOWED_ORIGINS` allowlist |
| `405` | Non-POST method |
| `413` | File exceeds 5 MB |
| `500` | Blob upload failure |

## Server-Side Blob Storage

The only server-side code lives in `api/upload-gif.js` — a single Vercel serverless function.

**Flow:**

1. Client renders the Florette animation into a GIF using the `MiniGIF` encoder.
2. The GIF `Blob` is `POST`ed to `/api/upload-gif`.
3. The handler validates the request (method, origin, content-type, size, GIF magic bytes).
4. On success, it streams the body to **Vercel Blob** via `put()` with `access: "public"`.
5. Files are stored under the `florettes/` prefix with a timestamped random filename.
6. The public URL is returned to the client and embedded in the generated email signature HTML.

All other tools (Florette export, Wallpaper, Business Card) work entirely client-side using Canvas `toBlob()` / `toDataURL()` and browser download or print.

## Environment Variables

2 Required env variables. Will deliver upon request during migration

## Running Locally

```bash
npm install
npx vercel dev
```

The API route (`/api/upload-gif`) requires `vercel dev` or a Vercel deployment, a plain static server will work for everything except email signature GIF uploads.

## Project Structure

```
├── index.html                  # Entry point
├── style.css                   # Global styles and fonts
├── package.json
├── api/
│   └── upload-gif.js           # Serverless GIF upload → Vercel Blob
├── js/
│   ├── app.js                  # Tool navigation and switching
│   ├── bottomsheet.js          # Mobile bottom sheet / desktop sidebar
│   ├── lib/
│   │   └── gif-encoder.js      # MiniGIF encoder (median-cut palette)
│   ├── florette/
│   │   ├── canvas.js           # Paper.js scene and export
│   │   ├── controls.js         # Sliders, swatches, export UI
│   │   ├── states.js           # Animation keyframes and playback
│   │   └── main.js             # Undo/redo, wires controls ↔ canvas
│   ├── email-signature/
│   │   └── main.js             # Signature preview, GIF upload, HTML export
│   ├── wallpaper/
│   │   └── main.js             # Wallpaper grid and JPEG download
│   └── business-card/
│       ├── main.js             # Card fields and print export
│       └── main.css
└── assets/
    ├── fonts/                  # Bradford, EK Notice Classic
    ├── images/                 # Foil texture, favicon
    └── logos/final_logos/       # HPA logo SVG variants
```

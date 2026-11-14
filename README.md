# Cinéo

> Production-grade cinema discovery platform and realtime synchronized Watch Party room with Three.js 3D hero animation, WebRTC mesh video/audio, and sub-second NTP clock synchronization.

---

## Highlights

- **Three.js 3D Cinema Space**: Curved 3D film ribbon textured with movie stills, floating amber/blue starlight particle vortex, directional key lighting, smooth mouse parallax, and accessible pause controls.
- **Synchronized Watch Party**: Real-time room synchronization for up to 8 peers with sub-second countdown (`3·2·1·Play!`), floating emoji reactions, chat, and movie-mode mic (push-to-talk with Spacebar).
- **Four Source Adapters**:
  - **Any OTT**: Shared countdown and pause/resume sync for Netflix, Prime Video, JioHotstar, Disney+, and Apple TV+.
  - **YouTube**: Integrated YouTube IFrame Player API with synchronized play, pause, and seek commands.
  - **Video File**: Synchronized local playback of identical files verified by size, name, and duration fingerprint.
  - **Screen Share**: Native browser tab capture with system audio and graceful mobile detection.
- **Recommendation Engine**:
  - **Discover**: Deep catalog filtering by release year, genre, streaming service, and regional language (Telugu, Hindi, Tamil, Malayalam, Kannada, English, Spanish, Japanese, Korean, French).
  - **Movies Like**: Thematic similarity engine with clear match rationales ("Why it matches").
  - **Watch Order**: Franchise roadmaps and chronological timeline explorer.
- **Zero-Error Architecture**: Built with strict TypeScript, 0 ESLint warnings, 15 unit tests, and 39 end-to-end Playwright tests across Desktop Chromium, Mobile Chrome, and Mobile Safari.

---

## System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │               Browser Client            │
                    │   Next.js 14 App Router + React 18      │
                    │   Three.js Hero + Tailwind Tokens       │
                    └────────────┬───────────────────┬────────┘
                                 │                   │
                 HTTP / REST     │                   │  WebSocket (JSON Protocol)
            (TMDB Proxy & Pages) │                   │  (Player State & Signals)
                                 ▼                   ▼
                    ┌──────────────────┐    ┌─────────────────────────┐
                    │  Next.js Server  │    │ Realtime Node Server    │
                    │  (Port 3000)     │    │ (Port 3001)             │
                    │  Cache & API     │    │ In-Memory Rooms & NTP   │
                    └──────────────────┘    └────────────┬────────────┘
                                                         │
                                             WebRTC Mesh │ Signaling
                                                         ▼
                                            ┌─────────────────────────┐
                                            │   Peer-to-Peer Mesh     │
                                            │   Camera & Audio Feeds  │
                                            └─────────────────────────┘
```

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Shrikanth70/cineo_x.git
cd cineo_x
npm ci
```

### 2. Configure Environment
Cinéo operates in **Demo Mode** out of the box with bundled fixtures and in-memory WebSockets when API keys are omitted.

```bash
cp .env.example .env
```

*(Optional)* Add your free TMDB API key to `.env`:
```env
TMDB_API_KEY=your_tmdb_api_key_here
```

### 3. Launch Development Server
```bash
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)
- Realtime WebSocket Server: `ws://localhost:3001`

---

## Verification & Quality Gates

Every release is gated by strict linting, type-checking, unit, and cross-browser E2E suites:

```bash
# Typecheck with TypeScript strict mode
npm run typecheck

# Run Next.js and ESLint checks
npm run lint

# Execute Vitest unit suites (NTP clock sync, protocol schemas, storage)
npm test

# Execute Playwright E2E suites (Chromium, Pixel 7, iPhone 14)
npm run e2e

# Build optimized production bundle
npm run build
```

---

## Environment Variables

All variables are optional with robust defaults:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Canonical public origin URL | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server endpoint for Watch Party rooms | `ws://localhost:3001` |
| `WS_PORT` | Port for the standalone realtime server | `3001` |
| `TMDB_API_KEY` | TMDB API Key (v3) for live poster and title metadata | Bundled fixtures fallback |
| `TMDB_API_READ_ACCESS_TOKEN` | TMDB v4 Bearer Token | Bundled fixtures fallback |
| `ANTHROPIC_API_KEY` | Claude API key for natural language cinema queries | Deterministic fallback |
| `NEXT_PUBLIC_TURN_SERVER` | Optional TURN server address for restrictive NAT traversal | Public Google STUN |

---

## Production Deployment

### Option A: Docker Compose (All-in-One)
```bash
docker-compose up -d --build
```
Runs the Next.js production server on port `3000` and the WebSocket coordinator on port `3001`.

### Option B: Cloud Split Deployment (Vercel + Render / Railway)

1. **Deploy WebSocket Server**:
   - Host `server/index.ts` as a Node web service on [Render](https://render.com) or [Railway](https://railway.app).
   - Set build command: `npm install && npm run build:server`
   - Set start command: `npx tsx server/index.ts`
   - Note the resulting WebSocket address: `wss://your-service.onrender.com`.

2. **Deploy Frontend to Vercel**:
   - Import the repository into [Vercel](https://vercel.com).
   - Set environment variable `NEXT_PUBLIC_WS_URL=wss://your-service.onrender.com`.
   - Set environment variable `TMDB_API_KEY=your_api_key`.
   - Deploy.

---

## Legal & Attribution

- **TMDB Attribution**: This product uses the TMDB API but is not endorsed or certified by TMDB.
- **Fair Play & Privacy**: Cinéo does not host, pirate, or circumvent DRM. Video streams play locally on individual devices or licensed embeds. Camera and microphone feeds are exchanged peer-to-peer over encrypted WebRTC mesh and are never recorded or stored on any server.

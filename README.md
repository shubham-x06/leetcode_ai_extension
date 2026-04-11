## Setup and run

Monorepo layout:

- **`backend/`** — Express + TypeScript API (MongoDB, JWT, Google token verification, Alfa LeetCode proxy, Groq AI).
- **`frontend/`** — React + Vite dashboard source; build output goes to `extension/dashboard/`.
- **`extension/`** — Chrome MV3 extension (LeetCode widget + packaged dashboard).

### Prerequisites

- Node.js and npm ([nodejs.org](https://nodejs.org))
- MongoDB running locally (or a cloud URI) matching `MONGODB_URI`
- Groq API key ([groq.com](https://groq.com))
- Google Cloud OAuth **Web client ID** used for `chrome.identity` (set the same value in the extension manifest `oauth2.client_id` and backend `GOOGLE_CLIENT_ID`)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: GROQ_API_KEY, MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID
npm install
npm run dev
```

You should see `Server running at http://localhost:3001`.

### Dashboard (React)

```bash
cd frontend
npm install
npm run build
```

This writes static files to `extension/dashboard/`.

### Chrome extension

1. Replace `YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID.apps.googleusercontent.com` in `extension/manifest.json` with your real OAuth client ID (must match backend `GOOGLE_CLIENT_ID`).
2. In Google Cloud Console, add your extension’s OAuth redirect / Chrome extension client configuration per [Chrome identity docs](https://developer.chrome.com/docs/extensions/reference/api/identity).
3. Open `chrome://extensions`, enable **Developer mode**, **Load unpacked**, choose the **`extension`** folder (not `frontend/`).

Click the toolbar icon to open the dashboard. On a LeetCode problem page (`/problems/*`), the floating widget appears.

### Common errors

- **Could not connect to backend** — Start the backend; in Settings set API base URL if not using `http://localhost:3001`. For a remote API host, add that origin under `host_permissions` in `extension/manifest.json`.
- **Failed to get hint / AI busy** — Check `GROQ_API_KEY`; rate limits return a “try again” message.
- **LeetCode profile private** — Make the profile public so Alfa can read stats.
- **Mongo connection failed** — Ensure MongoDB is reachable at `MONGODB_URI`.


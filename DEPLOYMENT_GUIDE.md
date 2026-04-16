# Ultimate Deployment Guide

This guide covers everything required to push your backend, frontend, and extension to a production environment. 

---

## 1. Deploying the Backend API (Render / Railway / Vercel)

Although `package.json` includes `vercel/node`, an Express application with open sockets/polling and Mongoose connections is typically easiest to deploy on **Render** to avoid serverless connection-pooling issues.

1. **Push your code to GitHub.** Ensure the `backend` directory is included.
2. Sign up on [Render.com](https://render.com/).
3. Click **New +** > **Web Service**.
4. Connect the GitHub repository.
5. In the settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Under **Environment Variables**, you must add:
   - `MONGODB_URI`: Your production MongoDB atlas string.
   - `JWT_SECRET`: A secure cryptographically random string.
   - `GROQ_API_KEY`: Your active Groq AI inference key.
   - `CORS_ORIGIN`: Set this to `https://your-frontend-domain.vercel.app` once you have it.
7. Click **Deploy**. Copy the resulting API URL (e.g., `https://leetcode-api.onrender.com`).

---

## 2. Deploying the Frontend Dashboard (Vercel)

1. Sign up on [Vercel.com](https://vercel.com/).
2. Click **Add New Project** and import the same GitHub repository.
3. In the Configuration Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: The production URL returned from your backend step (e.g., `https://leetcode-api.onrender.com/api`). Note: Include the `/api` extension.
5. Click **Deploy**. Vercel will output a live domain. Ensure you add this domain to the `CORS_ORIGIN` back in your Render settings!

---

## 3. Deploying the Chrome Extension (Chrome Web Store)

Once the backend and frontend are actively communicating:

1. **Update Production URLs**:
   Open `extension/widget.js` and modify the API base mapping:
   ```javascript
   const API_BASE_URL = 'https://leetcode-api.onrender.com/api'; // Replace with Production URL
   ```
   Open `extension/manifest.json` and adjust your host permissions to match production so the browser permits cross-origin requests securely:
   ```json
   "host_permissions": [
     "*://*.leetcode.com/*",
     "https://your-frontend-domain.vercel.app/*",
     "https://leetcode-api.onrender.com/*"
   ]
   ```
2. **Build / Package**:
   - The extension currently requires no pre-compilation (it's built with raw HTML/CSS/JS). Simply ZIP the contents of the `extension` folder into an archive (`extension.zip`).
3. **Publish**:
   - Navigate to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
   - Pay the $5 registration fee if you haven't already.
   - Click **Add new item** and upload the `extension.zip`.
   - Fill in the required metadata (Descriptions, Icons, Screenshots) and **Submit for Review**. Reviews typically take between 2 to 5 business days.

# FaceSort — AI-Powered Photo Distribution App

**FaceSort** is an AI-powered photo distribution application that automatically matches and distributes group event photos to the correct people using face recognition. After a group event (trip, wedding, college fest, hackathon), all photos end up on one device. FaceSort solves the manual sorting process automatically using face embeddings (ArcFace) and face detection (RetinaFace).

---

## 🚀 Quick Start Guide

This project contains three components:
1. **`backend/`** — FastAPI Python backend containing the database models, authentication, uploads, and AI matching pipeline.
2. **`web/`** — **(Recommended)** Modern React + Vite web client designed with premium Vanilla CSS dark glassmorphism.
3. **`mobile/`** — Expo React Native mobile application built with shared design system tokens.

---

### Step 1: Start the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python run.py
   ```
   The backend automatically sets up the SQLite database and upload storage. Visit the interactive API docs at `http://localhost:8000/docs`.

---

### Step 2: Start the Web Client (Recommended)

1. Open a new terminal and navigate to the web directory:
   ```bash
   cd web
   ```
2. Install Node dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
   Open **`http://localhost:5173`** in your browser to explore the FaceSort app!

---

### Step 3: Start the Mobile App (Alternative)

1. Open a new terminal and navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install Node dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```
4. Choose your preview mode:
   - Scan the QR code using your phone's camera and open in the **Expo Go** app to run natively!
   - Press `w` to view in your web browser.

---

## 🧠 Core AI Pipeline

The face recognition pipeline is located in `backend/app/services/face_service.py` and uses **ArcFace** embeddings and the **RetinaFace** detector backend.

1. **Selfie Registration:** Users upload 2–5 selfies. The pipeline extracts 512-dimensional face vectors for each and averages them into a single **centroid vector** for that user.
2. **Scanning Photos:** When the host triggers processing, each event group photo is scanned for faces, generating a 512-dimensional vector for each face found.
3. **Similarity Matching:** It computes **cosine similarity** (using NumPy) between each detected face vector and all member centroid vectors:
   - Match threshold: **$\geq 0.60$** (configurable in `.env`).
   - The best match above the threshold receives a linked photo match and is displayed with a confidence percentage (e.g., `92% confidence`).
4. **Personal Gallery:** Members immediately receive a clean, tailored photo grid containing only the event pictures they appear in!

---

## 🎨 Premium Dark Glassmorphism UI

Designed with a premium startup-grade dark aesthetic:
- **Central Theme Tokens:** Consistent spacing, colors, and shadows under `mobile/constants/theme.ts`.
- **Glass Card backdrops:** Clean glass borders and overlays.
- **Micro-animations:** Spring click interactions, input focus transitions, and animated dots/progress bars for the AI processing status.
- **Fast Grids:** shopify `@shopify/flash-list` and high-performance `expo-image` rendering.

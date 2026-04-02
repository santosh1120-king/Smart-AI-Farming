# AI Smart Farming Assistant

A full-stack farming assistant built with React, FastAPI, Supabase, and Gemini.

## Features

- Crop image analysis with Gemini vision
- Voice farming assistant powered by Gemini
- Weather monitoring with risk alerts
- Government scheme discovery
- JWT-based login and registration
- Crop analysis history
- Optional Firebase push notifications

## Stack

- Frontend: React + Vite
- Backend: FastAPI
- Database: Supabase
- AI: Gemini via Google's OpenAI-compatible API endpoint
- Hosting: Vercel (frontend) and Render (backend)

## Local Setup

### Backend

```bash
cd backend
copy .env.example .env
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed_schemes.py
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Environment Variables

### Backend

Required in `backend/.env`:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SECRET_KEY`
- `GEMINI_API_KEY`
- `OPENWEATHER_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional:

- `FIREBASE_CREDENTIALS_PATH`
- `FRONTEND_URL`

Before running the backend, create the Supabase tables with `backend/supabase_schema.sql` and then seed schemes with `python seed_schemes.py`.

### Frontend

Required in production:

- `VITE_API_URL`

Optional for push notifications:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`

## Deployment Notes

- Set `VITE_API_URL` in Vercel to your Render backend origin, for example `https://your-service.onrender.com`
- Redeploy Vercel after changing any `VITE_` environment variable
- Set `FRONTEND_URL` in Render to your Vercel frontend URL
- Ensure Render has all required backend environment variables before redeploying

## Core API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/crop/analyze`
- `GET /api/crop/history`
- `GET /api/weather?lat=&lon=`
- `GET /api/schemes?state=&crop=`
- `POST /api/voice/query`
- `GET /api/notifications`

Built for farmers: simple, practical, and production-ready.

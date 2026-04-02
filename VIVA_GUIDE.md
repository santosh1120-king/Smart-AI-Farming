# AI Smart Farming Viva Guide

This file is a simple study guide for explaining the project in a viva.
Read this top to bottom once or twice and you will have a clear story to tell.

## 1. Project Title

AI Smart Farming Assistant

## 2. One-Line Explanation

This is a full-stack web application that helps farmers with crop analysis, weather-based risk alerts, government schemes, and farming advice using AI.

## 3. Main Goal of the Project

The goal of the project is to support farmers with:

- crop disease or health analysis from images
- weather insights and alerts
- farming question answering through AI
- government scheme discovery
- simple login and personalized dashboard features

## 4. Problem Statement

Farmers often face problems like:

- not knowing whether a crop is healthy or diseased
- lack of quick expert advice
- difficulty finding relevant schemes
- weather uncertainty
- limited access to digital agricultural tools

This project solves that by combining AI, weather data, notifications, and government scheme information in one app.

## 5. High-Level Architecture

The project has 3 main parts:

1. Frontend
2. Backend
3. External services

### Frontend

Built with React.

It is responsible for:

- showing pages and forms
- taking image uploads
- letting users log in
- collecting user AI keys in the browser
- calling backend APIs
- displaying analysis results

### Backend

Built with FastAPI in Python.

It is responsible for:

- authentication
- business logic
- talking to Supabase
- uploading images to Cloudinary
- calling AI providers
- sending weather and notification logic

### External Services Used

- Supabase: database
- Cloudinary: image storage
- OpenWeather: weather API
- Firebase: push notifications
- Supabase Auth with Google: Google login
- Groq / OpenRouter: AI providers through BYOK

## 6. Simple System Flow

### Example: Crop Analysis

1. User logs in
2. User opens Crop Analysis page
3. User uploads crop image
4. User optionally adds notes
5. Frontend sends image + user AI keys to backend
6. Backend uploads image to Cloudinary
7. Backend sends image to AI provider waterfall
8. AI returns crop health analysis
9. Backend stores result in Supabase
10. Frontend shows result to user

### Example: Voice Assistant

1. User types or speaks farming question
2. Frontend sends question + AI keys to backend
3. Backend tries Groq first, then OpenRouter if needed
4. Answer comes back
5. Backend stores the voice log
6. Frontend displays response

## 7. Why This Project Uses BYOK

BYOK means Bring Your Own Key.

Instead of keeping one paid AI key on the server:

- users paste their own Groq and OpenRouter keys
- the keys are stored in browser localStorage
- frontend sends them only when making AI requests

### Why this is useful

- reduces project cost
- supports free-tier usage
- avoids maintaining one shared AI bill
- makes the system more flexible

## 8. AI Waterfall Cascade

The AI system does not depend on only one provider.

It uses a waterfall method:

### For text tasks

1. Groq `llama-3.3-70b-versatile`
2. Groq `llama-3.1-8b-instant`
3. OpenRouter `meta-llama/llama-3.3-70b-instruct:free`

### For image crop analysis

1. OpenRouter `google/gemini-2.0-flash-lite-001`
2. OpenRouter `meta-llama/llama-3.3-70b-instruct:free`

### Why waterfall is used

- if one provider fails, another can be tried
- improves reliability
- supports zero-cost/free-tier usage better

## 9. Frontend Structure

The frontend is inside the `frontend` folder.

Important parts:

- `src/pages`: main app pages
- `src/components`: reusable UI pieces
- `src/context`: auth state management
- `src/services`: API helpers and local browser key helpers

### Important frontend files

- [App.jsx](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/App.jsx)
  Main routing file

- [Layout.jsx](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/components/Layout.jsx)
  Main app shell, sidebar, AI key modal button

- [CropAnalysisPage.jsx](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/pages/CropAnalysisPage.jsx)
  Upload image and show AI crop analysis

- [VoiceAssistantPage.jsx](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/pages/VoiceAssistantPage.jsx)
  Ask farming questions through text or speech

- [SchemesPage.jsx](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/pages/SchemesPage.jsx)
  Shows government schemes

- [AuthContext.jsx](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/context/AuthContext.jsx)
  Stores logged-in user state

- [api.js](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/services/api.js)
  Axios setup and token handling

- [aiKeys.js](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/services/aiKeys.js)
  Saves Groq/OpenRouter keys in browser localStorage

- [APIKeySettingsModal.jsx](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/frontend/src/components/APIKeySettingsModal.jsx)
  Modal where users paste AI keys

## 10. Backend Structure

The backend is inside the `backend` folder.

Important parts:

- `app/main.py`: FastAPI app entry
- `app/routes`: API endpoints
- `app/services`: external service logic
- `app/database.py`: Supabase database helper
- `app/config.py`: environment variable config
- `app/utils/auth.py`: JWT auth logic
- `app/data`: hardcoded internal data

### Important backend files

- [main.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/main.py)
  Starts the API and adds CORS and routes

- [database.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/database.py)
  Handles create/read/update/delete using Supabase REST API

- [auth.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/routes/auth.py)
  Register, login, Google auth, and FCM token update

- [crop.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/routes/crop.py)
  Crop image upload and AI analysis

- [voice.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/routes/voice.py)
  Farming question answering

- [weather.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/routes/weather.py)
  Weather API and risk alerts

- [schemes.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/routes/schemes.py)
  Returns hardcoded scheme data

- [ai_service.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/services/ai_service.py)
  AI waterfall logic

- [cloudinary_service.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/services/cloudinary_service.py)
  Upload/delete crop images

- [notification_service.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/services/notification_service.py)
  Firebase push notifications

## 11. Authentication Flow

The project supports:

- email/password login
- Google login through Supabase Auth

### Email/Password flow

1. User registers or logs in
2. Backend validates data
3. Backend creates JWT token
4. Frontend stores token in localStorage
5. Token is sent in later API requests

### Google login flow

1. User clicks Google sign-in
2. Supabase handles Google OAuth
3. Frontend gets session token
4. Backend verifies Supabase user
5. Backend creates local app JWT
6. User becomes logged in

## 12. Database Design

Supabase is used as the database.

### Main tables

- `users`
- `crop_analyses`
- `weather_data`
- `notifications`
- `voice_logs`
- `government_schemes`

### What each table stores

`users`
- user profile
- email
- phone
- state
- FCM token

`crop_analyses`
- crop image URL
- AI analysis result JSON
- created date

`weather_data`
- latitude and longitude
- weather result JSON

`notifications`
- alert title and body
- read/unread status

`voice_logs`
- user questions
- AI responses

`government_schemes`
- scheme details

## 13. Why RLS Was Added

RLS means Row Level Security.

It was enabled in Supabase to make the tables protected.

In this project:

- public users should not directly access tables
- backend uses the `service_role` key
- so backend can safely access and manage data

This is useful because:

- it improves security
- frontend does not directly control database tables

## 14. Why Government Schemes Were Changed Later

Originally schemes were read from Supabase.

Later the project was changed to directly use hardcoded scheme data because:

- scheme page should work even if database is empty
- no need to seed the database just for static scheme content
- simpler for demo and viva

Now the schemes route serves hardcoded data from:

- [schemes_data.py](c:/Users/ASUS/OneDrive/Desktop/AI assisted farming ojt/backend/app/data/schemes_data.py)

## 15. Image Handling Design

Crop images are not stored directly in Supabase.

Instead:

- image file is uploaded to Cloudinary
- Cloudinary returns image URL and public ID
- backend stores that URL and public ID in Supabase

### Why Cloudinary is used

- better for media storage
- easier image hosting and delivery
- avoids storing large files directly in DB

## 16. Weather Feature Design

The weather module:

- takes user location
- fetches weather from OpenWeather
- stores weather result in database
- creates alerts for risky conditions
- can send notification if FCM token exists

## 17. Notification System

Notifications use Firebase.

### Flow

1. frontend asks permission
2. gets FCM token
3. backend stores token in user profile
4. backend sends push notification when crop/weather risk is detected

## 18. Codebase Design Philosophy

The project follows separation of concerns.

That means:

- routes handle request/response
- services handle business logic or third-party APIs
- database file handles DB operations
- frontend pages handle UI
- reusable components handle repeated UI parts

This is good software design because code stays:

- cleaner
- easier to debug
- easier to extend

## 19. Deployment Architecture

### Frontend

Deployed on Vercel

### Backend

Deployed on Render

### Database

Supabase

### Media

Cloudinary

### Notifications

Firebase

### AI

Groq and OpenRouter using user-pasted browser keys

## 20. Environment Variables

### Frontend env

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend env

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SECRET_KEY`
- `OPENWEATHER_API_KEY`
- `CLOUDINARY_*`
- `FRONTEND_URL`
- Firebase credentials path

### Important viva point

Groq and OpenRouter keys are not stored in deployment env for this version.
They are stored in browser localStorage by the user.

## 21. What Happens When User Clicks "Analyze"

Simple answer:

1. Frontend checks if AI key exists
2. Frontend sends image, notes, and AI keys to backend
3. Backend uploads image to Cloudinary
4. Backend calls AI waterfall
5. Backend stores result
6. Frontend shows crop type, health, issues, recommendations, and next steps

## 22. Why This Project Is Full Stack

It is full stack because it has:

- frontend UI
- backend API
- database
- authentication
- third-party integrations
- deployment

## 23. Key Technical Concepts You Should Say in Viva

Use these words confidently:

- full-stack web application
- REST API
- JWT authentication
- OAuth login
- cloud database
- row level security
- object storage / media hosting
- AI inference waterfall
- browser localStorage
- microservice-style integration with external APIs

## 24. Simple Strengths of the Project

- farmer-friendly and practical
- combines multiple services in one app
- cost-conscious AI design using BYOK
- supports image analysis and text advice
- secure separation between frontend and backend
- scalable structure for future features

## 25. Limitations You Can Honestly Say

Good viva answers are honest.

You can say:

- AI accuracy depends on image quality and provider quality
- free-tier AI keys may hit quota or rate limits
- government schemes are currently static/hardcoded
- weather alerts depend on external API availability
- push notifications need Firebase setup and browser support

## 26. Future Improvements

Very useful for viva.

You can say future scope includes:

- multilingual support for farmers
- regional crop recommendation engine
- live marketplace integration
- disease detection model fine-tuned on agriculture data
- direct soil sensor / IoT integration
- admin panel for managing scheme data
- analytics dashboard for farmer usage patterns

## 27. Most Important Viva Summary

If the examiner says, "Explain your project in 1 minute", say this:

This project is an AI-powered smart farming assistant built using React for the frontend and FastAPI for the backend. It helps farmers analyze crop images, ask farming questions, view weather risks, and discover government schemes. The backend stores user data and analysis history in Supabase, uses Cloudinary for image hosting, Firebase for notifications, and a BYOK AI waterfall using Groq and OpenRouter for low-cost AI responses. The architecture is modular, with separate routes, services, database helpers, and UI components, which makes it easier to maintain and scale.

## 28. Likely Viva Questions With Simple Answers

### Q: Why did you choose React?

Because React helps build reusable UI components and makes the frontend interactive and maintainable.

### Q: Why did you choose FastAPI?

Because FastAPI is fast, simple, and very good for building Python APIs with clean route structure.

### Q: Why did you use Supabase?

Because Supabase gives a simple cloud PostgreSQL database and easy integration for modern web apps.

### Q: Why Cloudinary?

Because images are better stored in media hosting rather than directly in the database.

### Q: Why use JWT?

Because JWT helps securely identify logged-in users in API requests.

### Q: Why use BYOK?

Because it reduces cost and lets users bring their own free AI keys instead of depending on one paid backend key.

### Q: Why use an AI waterfall?

Because if one provider fails, the system can try another provider and become more reliable.

### Q: Why did schemes stop using the database?

Because those schemes are mostly static content, so hardcoded delivery is simpler and works even without seeded DB rows.

### Q: What is RLS?

RLS means Row Level Security. It restricts direct table access in Supabase and improves security.

### Q: How does crop analysis work?

The image is uploaded, stored in Cloudinary, then sent to AI for analysis, and the result is stored in the database and shown to the user.

## 29. 30-Second Revision List

Before viva, remember these 10 things:

1. React frontend
2. FastAPI backend
3. Supabase database
4. Cloudinary for image storage
5. Firebase for notifications
6. Google login through Supabase Auth
7. JWT for app authentication
8. Groq + OpenRouter AI waterfall
9. BYOK using browser localStorage
10. Hardcoded government schemes through backend API

## 30. Final Advice For Viva

Do not try to sound overly technical.
Speak slowly and clearly.
Tell the flow in steps.
If stuck, explain what happens from user action to backend response.
That alone is often enough to show understanding.

Good simple pattern for any answer:

- what feature does
- which technology handles it
- why that technology was chosen

Example:

Crop analysis takes an image from the frontend, the backend uploads it to Cloudinary, then AI providers analyze it and the result is stored in Supabase. This design separates image storage, AI processing, and database storage clearly.


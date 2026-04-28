# Rain Alert Notification Plan

This file is a step-by-step plan for adding automatic rain alert notifications to the project later.

The goal is:

- detect possible rain or risky weather automatically
- create a notification inside the app
- optionally send a browser push notification
- avoid requiring manual page refresh

This is a planning file only. It explains what to build and in what order.

## 1. Feature Goal

We want the website to notify the farmer when:

- rain is expected soon
- heavy rain risk is high
- humidity + rain may cause disease risk
- weather becomes risky for crops

Example alerts:

- "Rain expected in the next few hours. Protect harvested crop."
- "Heavy rainfall likely today. Delay spraying if possible."
- "High humidity and rain risk may increase fungal disease."

## 2. Best Architecture Choice

For this project, the best design is:

1. backend scheduled weather checking
2. notification saved in database
3. push notification sent through Firebase
4. frontend shows alert history in the bell/notification area

Why this is better than refresh or WebSocket:

- users may not keep the site open
- weather alerts are periodic, not millisecond-critical
- push notifications are more practical for a farming use case
- easier to explain in viva

## 3. Final Feature Flow

The complete flow should work like this:

1. user logs in
2. user allows notification permission in browser
3. frontend gets Firebase Cloud Messaging token
4. backend stores the FCM token in the `users` table
5. backend periodically checks weather for saved user location
6. backend decides whether weather is risky
7. backend inserts a row into `notifications`
8. backend sends push notification through Firebase
9. browser shows the alert
10. user opens app and sees the same alert in notification history

## 4. Main Parts Needed

There are 4 major parts:

1. Firebase setup
2. frontend notification integration
3. backend weather alert logic
4. scheduled execution / cron job

## 5. Firebase Setup Plan

This is required if you want browser push notifications.

### Step 1: Create Firebase project

In Firebase Console:

- create a new project
- enable Cloud Messaging

### Step 2: Add web app

Inside Firebase project:

- add a Web App
- copy Firebase web config values

You will get values like:

- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId

These go to frontend env variables.

### Step 3: Generate VAPID key

In Firebase Cloud Messaging settings:

- open Web Push certificates
- generate a VAPID key if not already present

This is required for browser notification token generation.

### Step 4: Create service account key

In Firebase project settings:

- go to Service Accounts
- generate private key JSON

This file is needed in backend so Python can send notifications.

### Step 5: Store Firebase values

Frontend env:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`

Backend:

- place Firebase service account JSON in backend
- set `FIREBASE_CREDENTIALS_PATH`

## 6. Frontend Work Plan

### Goal

Frontend should:

- ask notification permission
- get FCM token
- send token to backend
- show notification count/history in UI

### Current status

You already have partial Firebase notification code in frontend.
So this is not starting from zero.

### What needs to be done

#### A. Confirm Firebase config is correct

Check:

- `frontend/src/services/firebase.js`
- env values in frontend deployment

#### B. Ask notification permission at the right time

Best moment:

- after login
- or first time user enters dashboard

The app already has some token sync logic in layout.
This should be reviewed and tested properly.

#### C. Save token to backend

Flow:

1. frontend gets FCM token
2. frontend calls backend endpoint like `/api/auth/fcm-token`
3. backend saves token to current user row

This already partly exists.

#### D. Add service worker for web push

For browser push notifications, a Firebase messaging service worker is usually needed.

You will likely need:

- `firebase-messaging-sw.js` in frontend public/root area

This service worker helps receive push notifications in browser context.

#### E. Improve notification UI

Frontend should also show:

- unread bell badge
- notification list page or dropdown
- mark as read

Some of this already exists in your backend and sidebar unread count logic.

## 7. Backend Work Plan

### Goal

Backend should:

- check weather automatically
- detect rain risk
- create alerts
- send push notifications

### A. Define weather alert logic

You need clear rules.

Simple version:

- if current weather includes rain -> alert
- if rain is expected soon in forecast -> alert
- if humidity is high and rain chance is high -> fungal disease warning
- if strong wind + rain -> crop damage warning

Good beginner-friendly starting rules:

1. `rain expected within next 3 hours`
2. `current weather says rain`
3. `humidity > threshold and rain probability high`

### B. Decide where location comes from

The backend needs user weather location.

Possible approaches:

1. store latest lat/lon from weather page in DB
2. add dedicated user location fields in `users`

Best cleaner design:

- save user preferred location in `users` table
- or create a user settings table later

For now, simplest is:

- store last known weather location for the user
- use latest `weather_data` row or add explicit location fields

### C. Create reusable alert generation function

Add a backend service function that:

- fetches weather
- calculates risk
- decides if notification is needed
- returns notification payload

This should be separate from route code.

Example module:

- `backend/app/services/weather_alert_service.py`

### D. Prevent duplicate alerts

Very important.

Without this, users may get spammed every few minutes.

Simple anti-spam logic:

- if same type of rain alert already sent in last 3 hours, do not send again

For example:

- do not send repeated "Rain expected soon" alerts every 5 minutes

### E. Save alert in notifications table

When rain risk is detected:

- insert into `notifications`

Suggested notification types:

- `weather_rain`
- `weather_storm`
- `weather_disease_risk`

### F. Send push through Firebase

If user has `fcm_token`:

- send push notification through existing Firebase notification service

This service already exists partially in backend.

### G. Optionally add an endpoint for manual testing

Useful during development:

- add a test route like `/api/weather/check-alerts-now`

This route should:

- run weather check for current user
- return what alert would be created

This helps test before cron is added.

## 8. Scheduled Job / Cron Plan

This is the most important part for "no refresh needed".

### Goal

Run weather checks automatically without user action.

### Options

#### Option A: Render Cron Job

If Render supports cron/background jobs in your setup:

- create a scheduled job
- run a Python command every 15 minutes

Example idea:

- script checks all users with saved locations
- creates alerts where needed

This is probably the best choice for your stack.

#### Option B: External cron service

Use a cron platform to call a backend endpoint every few minutes.

Example:

- cron calls `/api/weather/run-scheduled-alert-check`

This is easier if hosting does not support native scheduling well.

#### Option C: Frontend polling only

Not recommended as final solution.

Why:

- works only when site is open
- not true alerting

### Recommended schedule

Start with:

- every 15 minutes

Later, if needed:

- every 5 minutes

## 9. Database Changes to Consider

Current database already has:

- `notifications`
- `users.fcm_token`
- `weather_data`

Possible improvement:

Add location fields in `users`:

- `weather_lat`
- `weather_lon`
- `location_name`

Why:

- scheduler should know where each user is
- easier than depending on temporary page request data

If you do not want DB changes now, fallback option:

- use latest row from `weather_data`

## 10. Step-by-Step Implementation Order

Follow this order when you actually build it:

### Phase 1: Make Firebase push fully ready

1. create/configure Firebase project
2. add web config in frontend env
3. generate VAPID key
4. add service account JSON to backend
5. confirm browser can request permission
6. confirm FCM token is saved into backend

### Phase 2: Improve notification display

1. show unread count clearly
2. add notification page or dropdown if needed
3. test mark-read and read-all flow

### Phase 3: Add weather alert logic

1. write reusable alert calculation logic
2. test with manual endpoint
3. generate notification rows in DB
4. add anti-duplicate logic

### Phase 4: Connect Firebase push sending

1. send push when alert is created
2. confirm browser receives notification
3. test with allowed and blocked permission cases

### Phase 5: Add scheduler

1. create cron/scheduled job
2. run weather checks every 15 minutes
3. confirm alerts appear even when app is not open

## 11. Suggested Notification Message Templates

You can use messages like:

### Rain soon

Title:

`Rain Alert`

Body:

`Rain is expected in your area soon. Protect harvested crop and avoid spraying.`

### Heavy rain

Title:

`Heavy Rain Warning`

Body:

`Heavy rainfall may affect your crop in the next few hours. Take precautions.`

### Disease risk

Title:

`Crop Disease Risk Alert`

Body:

`High humidity and rain may increase fungal disease risk. Inspect leaves tomorrow.`

## 12. Testing Plan

When building later, test in this order:

### Test 1: Firebase permission

- allow browser notifications
- confirm token gets generated

### Test 2: Token saved

- check backend user row has `fcm_token`

### Test 3: Manual notification send

- call test endpoint
- verify notification appears in browser

### Test 4: DB notification

- check notification row saved in `notifications`

### Test 5: Duplicate prevention

- trigger same alert twice
- confirm second one is blocked within cooldown window

### Test 6: Scheduled execution

- run scheduled job
- confirm alerts work without website refresh

## 13. Possible Problems and Fixes

### Problem: No notification permission

Fix:

- ask user again with clear explanation
- show fallback in-app notifications

### Problem: No FCM token

Fix:

- check Firebase config
- check VAPID key
- check service worker

### Problem: User gets too many alerts

Fix:

- add cooldown logic
- only send when weather meaningfully changes

### Problem: User has no saved location

Fix:

- require weather location once
- save preferred location in DB

### Problem: Browser closed, no alert

Fix:

- verify FCM/service worker/browser support
- confirm push notification permissions

## 14. What to Say in Viva

If asked how rain alerts can work without refresh, say:

This feature should be designed using a scheduled backend weather check instead of manual refresh. The backend periodically checks forecast data, creates notification records, and sends browser push notifications through Firebase. This is better than WebSockets for this project because weather alerts are periodic and users may not keep the website open all the time.

If asked why Firebase is needed, say:

Firebase Cloud Messaging helps send browser push notifications. Without it, we can still show notifications inside the app, but not reliably alert the user when they are away from the page.

## 15. Best Final Recommendation

If building later, the best practical version is:

- save user weather location
- scheduled backend weather check every 15 minutes
- create `notifications` DB row
- send Firebase push notification
- frontend bell icon shows history and unread count

This is the best balance of:

- usefulness
- simplicity
- good system design
- strong viva explanation


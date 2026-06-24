# Somali Headline Generation App

This project combines a FastAPI backend and a Next.js frontend to generate
Somali news headlines and article categories with a fine-tuned mT5 model.

It now includes:

- MongoDB persistence
- Email/password authentication with JWT
- Automatic headline history saving
- Protected history pages for each user

## Current architecture

### Backend

- `app.py` wires the FastAPI app, CORS, JWT middleware, MongoDB startup, and
  routers.
- `services/inference.py` handles model discovery, loading, caching, and
  inference.
- `routers/auth.py` provides registration, login, and current-user APIs.
- `routers/history.py` provides authenticated history list, detail, create, and
  delete APIs.
- `routers/predict.py` exposes model listing and authenticated prediction.
- `services/user_service.py`, `services/security.py`, and
  `services/history_service.py` hold user, JWT, password hashing, and history
  logic.
- `db/mongodb.py` creates the MongoDB connection and indexes.

### Frontend

- `client/app/page.tsx` is the landing page.
- `client/app/login/page.tsx` and `client/app/register/page.tsx` handle account
  access.
- `client/app/predict/page.tsx` is the protected generation page.
- `client/app/history/page.tsx` lists saved headline history.
- `client/app/history/[id]/page.tsx` shows a single saved result.
- `client/components/auth/AuthProvider.tsx` stores the JWT and user session in
  the browser.

## How headline generation works

1. The frontend loads available models from `GET /models`.
2. An authenticated user submits article text from the `/predict` page.
3. The backend runs mT5 inference in `services/inference.py`.
4. The prediction result is saved to MongoDB with the current user id,
   article text, generated headline, category, model id, and timestamp.
5. The frontend shows the generated result and links to the saved history item.

## Environment variables

Copy the backend `.env.example` at the project root and set values for your
environment.

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=headline_ai
JWT_SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
CLIENT_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

For the Next.js frontend, copy `client/.env.example` to `client/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Backend setup

```bash
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Frontend setup

```bash
cd client
pnpm install
pnpm dev
```

The frontend runs on `http://localhost:3000` by default and expects the API at
`http://localhost:8000` unless `NEXT_PUBLIC_API_URL` is changed.

## API overview

### Public routes

- `GET /`
- `GET /models`
- `POST /auth/register`
- `POST /auth/login`

### Protected routes

- `GET /auth/me`
- `POST /predict`
- `GET /history`
- `POST /history`
- `GET /history/{history_id}`
- `DELETE /history/{history_id}`

## Manual test flow

1. Start MongoDB locally.
2. Start the FastAPI backend.
3. Start the Next.js frontend.
4. Open `http://localhost:3000/register` and create an account.
5. Log in if you are not redirected automatically.
6. Open `/predict`, select a model, and submit an article.
7. Confirm the result modal appears and links to a saved history item.
8. Open `/history` and confirm the new record is listed.
9. Open the history detail page to view the original article and generated
   headline.
10. Delete a history item and confirm it disappears from the list.

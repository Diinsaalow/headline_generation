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
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/?appName=headline-generation
MONGODB_DB_NAME=headline-generation
JWT_SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
CLIENT_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

For the Next.js frontend, copy `client/.env.example` to `client/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Backend setup

You can run the API with Docker or directly on your machine. Both options use
your MongoDB Atlas cluster (or any remote MongoDB) via `MONGODB_URI` in `.env`.

### Option A: Docker (API only)

Requirements:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose)
- Trained model files in `./models/<model-id>/` (each folder needs a `config.json`)
- A `.env` file with your Atlas connection string (copy from `.env.example`)

```bash
docker compose up --build
```

The API is available at `http://localhost:8000`. MongoDB stays on Atlas — Docker
only runs the FastAPI container.

Useful commands:

```bash
docker compose up --build -d   # run in the background
docker compose logs -f api     # follow API logs
docker compose down            # stop the container
```

The frontend still runs separately (see below). Point it at
`http://localhost:8000`.

### Option B: Local Python (no Docker)

```bash
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Set `MONGODB_URI` and other values in `.env`, or export them in your shell.

## Frontend setup

```bash
cd client
pnpm install
pnpm dev
```

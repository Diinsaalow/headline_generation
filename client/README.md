# Frontend

This is the Next.js frontend for the Somali headline generation project.

## Pages

- `/` landing page
- `/login` login page
- `/register` registration page
- `/predict` protected headline generation page
- `/history` protected saved-history page
- `/history/[id]` protected history detail page

## Run locally

```bash
pnpm install
pnpm dev
```

Set `NEXT_PUBLIC_API_URL` to the FastAPI backend URL if it is not running on
`http://localhost:8000`.

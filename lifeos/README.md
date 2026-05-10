# LifeOS — Nexus Digital Solutions

> Personal operating system for high-velocity entrepreneurs.
> Built by Nexus Digital Solutions 

---

## Stack

| Layer | Tech | Deploy |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind | Vercel |
| Backend | FastAPI + SQLAlchemy + SQLite | Render / Railway |
| AI | Claude API (Anthropic) | — |
| Email | Resend | — |
| SMS/WhatsApp | Africa's Talking | — |
| Real-time | WebSockets (native FastAPI) | — |
| Auth | JWT (access + refresh tokens) | — |

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in your API keys in .env

uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

App available at: http://localhost:3000

**Default login:** `admin@nexusdigitalsolutions.zm` / `changeme` (set in backend `.env`)

---

## Production Deployment

### Backend → Render

1. Push repo to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Connect your repo, set root to `/backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add a **Disk** (1GB) mounted at `/data`
7. Set environment variables:
   ```
   DATABASE_URL=sqlite:////data/lifeos.db
   SECRET_KEY=<generate 32+ char random string>
   ANTHROPIC_API_KEY=sk-ant-...
   RESEND_API_KEY=re_...
   AT_USERNAME=...
   AT_API_KEY=...
   FRONTEND_URL=https://your-app.vercel.app
   ADMIN_EMAIL=your@email.com
   ADMIN_PASSWORD=<strong password>
   ```

### Frontend → Vercel

1. Import repo on [vercel.com](https://vercel.com)
2. Set root to `/frontend`
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com
   NEXT_PUBLIC_WS_URL=wss://your-api.onrender.com
   ```
4. Deploy

---

## API Endpoints

```
POST   /api/v1/auth/login          Login
POST   /api/v1/auth/refresh        Refresh token
GET    /api/v1/auth/me             Current user

GET    /api/v1/projects/           List projects
POST   /api/v1/projects/           Create project
PATCH  /api/v1/projects/{id}       Update project
DELETE /api/v1/projects/{id}       Delete project

GET    /api/v1/personnel/          List personnel
POST   /api/v1/personnel/          Add person
PATCH  /api/v1/personnel/{id}      Update person
DELETE /api/v1/personnel/{id}      Remove person

GET    /api/v1/followups/          List follow-ups
POST   /api/v1/followups/          Create follow-up
PATCH  /api/v1/followups/{id}      Update / mark done
DELETE /api/v1/followups/{id}      Delete
GET    /api/v1/followups/stats/summary  Stats

GET    /api/v1/reminders/          List reminders
POST   /api/v1/reminders/          Schedule reminder
PATCH  /api/v1/reminders/{id}      Update
DELETE /api/v1/reminders/{id}      Cancel

POST   /api/v1/briefing/           Generate AI morning briefing

WS     /ws?token=<access_token>    Real-time WebSocket
```

---

## Features

- **AI Morning Briefing** — Claude-powered daily ops summary emailed at 06:00 CAT
- **Real-time updates** — WebSocket broadcasts when projects/follow-ups change
- **Email reminders** — Resend API with HTML templates
- **WhatsApp/SMS** — Africa's Talking integration
- **JWT auth** — Secure access + refresh token flow with auto-refresh
- **Projects tracker** — 10 active projects, CRUD, categories, urgency, blockers
- **Personnel registry** — Full team directory with pending deliverables
- **Follow-ups board** — Priority-sorted, checkable, with overdue tracking
- **Reminder scheduler** — APScheduler with daily/weekly recurrence

---

## Project Structure

```
lifeos/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, JWT, WebSocket manager
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── services/      # AI briefing, email, WhatsApp, scheduler
│   │   ├── database.py    # DB setup + seeding
│   │   └── main.py        # App entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
└── frontend/
    ├── app/
    │   ├── (auth)/login/      # Login page
    │   └── (dashboard)/       # Protected dashboard pages
    │       ├── dashboard/     # Command center
    │       ├── projects/      # Projects CRUD
    │       ├── personnel/     # People registry
    │       ├── followups/     # Follow-ups board
    │       └── reminders/     # Reminder scheduler
    ├── components/ui/         # Shared UI components
    ├── hooks/                 # useWebSocket
    ├── lib/                   # API client, auth store
    └── types/                 # TypeScript interfaces
```

---

*Nexus Digital Solutions — Connecting the Dots. Building the Future.*

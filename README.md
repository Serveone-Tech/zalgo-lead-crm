# Zalgo Infotech — Lead Management System

A lightweight conversation tracking system for coaches & consultants.

---

## Project Structure

```
zalgo-crm/
├── backend/          ← Node.js + Express API
│   ├── db/           ← PostgreSQL connection & schema
│   ├── middleware/   ← JWT auth middleware
│   ├── routes/       ← API routes (auth, leads)
│   ├── server.js     ← Entry point
│   └── .env.example  ← Environment variables template
│
└── frontend/         ← Next.js 14 App
    ├── app/
    │   ├── dashboard/  ← Dashboard page
    │   ├── leads/      ← Leads management page
    │   └── login/      ← Login / Register page
    ├── components/
    │   ├── Sidebar.js  ← Navigation sidebar
    │   └── LeadModal.js ← Add/Edit lead modal
    └── lib/
        └── api.js      ← Axios API client
```

---

## Setup Instructions

### Step 1 — Neon PostgreSQL Database

1. Go to https://neon.tech and create a free account
2. Create a new project → get your **Connection String**
3. It will look like: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

---

### Step 2 — Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=your_neon_connection_string_here
JWT_SECRET=any_long_random_secret_string
PORT=5000
```

Start the server:
```bash
npm run dev     # development (with nodemon)
npm start       # production
```

The API will run on `http://localhost:5000`
The database tables will be **auto-created** on first run.

---

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev     # development → http://localhost:3000
npm run build   # production build
npm start       # production server
```

---

## Usage

1. Open `http://localhost:3000`
2. Register a new account (first time) or Login
3. Dashboard shows:
   - Stats overview (Total, Active, Booked, Overdue, Today)
   - **Overdue follow-ups** — full lead details table
   - **Today's follow-ups**
   - All leads overview
4. Leads page — full CRUD with search & filters
5. Change stage directly from the dropdown in the table
6. Click any row to edit lead details

---

## API Endpoints

| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| POST   | /api/auth/register | Create account       |
| POST   | /api/auth/login    | Login                |
| GET    | /api/leads         | Get all leads        |
| GET    | /api/leads/stats   | Dashboard stats      |
| GET    | /api/leads/overdue | Overdue leads only   |
| POST   | /api/leads         | Create lead          |
| PUT    | /api/leads/:id     | Update lead          |
| DELETE | /api/leads/:id     | Delete lead          |

All `/api/leads` routes require `Authorization: Bearer <token>` header.

---

## Tech Stack

- **Frontend**: Next.js 14, React 18
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon DB)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **HTTP Client**: Axios

---

## Color Theme

Based on Zalgo Infotech brand:
- Primary Dark: `#141414`
- Surface: `#1c1c1c`
- Teal Accent: `#00868a`
- Text: `#ebebeb`

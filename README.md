# EcoTrack AI - Carbon Footprint Awareness Platform

EcoTrack AI is a full-stack, production-grade web application designed to help users track, analyze, and reduce their carbon footprint. By integrating scientific carbon calculation factors, gamification mechanics (challenges, badges, leaderboard), AI-powered suggestions, and downloadable PDF/CSV reports, the platform turns environmental awareness into an interactive and rewarding habit.

---

## Technical Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS (Shadcn Zinc design guidelines)
- **State Management & Query Caching**: TanStack Query (React Query)
- **Charts**: Recharts (with responsive vectors and dark mode palettes)
- **Backend**: Node.js + Express + TypeScript
- **Database & Auth**: Supabase (PostgreSQL) + Row Level Security (RLS)
- **AI Recommendation Engine**: Google Gemini AI (with built-in rule-based fallback engine)
- **PDF Generation**: PDFKit (streams directly to client via Express)
- **Offline Support**: Local Storage queues + automated online synchronization listeners

---

## Directory Structure

```
├── client/                     # React Single Page Application
│   ├── src/
│   │   ├── components/         # Core views (Dashboard, Calculator, Assistant, Challenges, Leaderboard, AdminPanel)
│   │   ├── lib/                # Supabase SDK and API client configuration
│   │   ├── App.tsx             # Root layout, router, sidebar and auth container
│   │   ├── index.css           # Global theme styling and variable definitions
│   │   └── main.tsx            # Mounting script
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
├── server/                     # Node.js Express Backend Service
│   ├── src/
│   │   ├── config/             # Supabase clients (service key & anon) configurations
│   │   ├── middleware/         # requireAuth JWT guard, requireAdmin, errorHandler
│   │   ├── routes/             # Entries, challenges, leaderboard, reports, AI, and admin APIs
│   │   ├── utils/              # Carbon calculations, PDF builders, CSV formatting, winston loggers
│   │   └── server.ts           # Server entry point
│   ├── tsconfig.json
│   └── package.json
└── supabase/
    └── schema.sql              # Database DDL, RLS policies, seed challenges, and profile triggers
```

---

## Database Provisioning (Supabase Setup)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Navigate to the **SQL Editor** tab.
3. Paste the contents of `supabase/schema.sql` into the query editor and click **Run**.
4. This script creates:
   - The public profiles table `users` linked to `auth.users`.
   - Triggers to automatically sync registers from Supabase Auth into `public.users`.
   - Tables for `carbon_entries`, `challenges`, `user_challenges`, `achievements`, `user_achievements`, `leaderboard`, `reports`, and `audit_logs`.
   - Row Level Security (RLS) policies allowing users to read/write only their own data while restricting admin routes.
   - Seed data for default eco challenges and achievements.

---

## Installation & Running Locally

### 1. Pre-requisites
- **Node.js**: v18 or later.
- **Supabase Account**: A running Supabase project.

### 2. Configure Backend Service
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Set your environment variables in `.env`:
   - `PORT`: Server port (e.g. `5000`).
   - `SUPABASE_URL`: Your Supabase Project API URL.
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key (for user-level requests).
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (for secure backend bypass of RLS).
   - `SUPABASE_JWT_SECRET`: Found in Project Settings -> API -> JWT Secret.
   - `GEMINI_API_KEY`: Google Gemini API Key. (Leave empty to trigger the local fallback engine).
4. Start the server in hot-reload development mode:
   ```bash
   npm run dev
   ```

### 3. Configure Frontend Client
1. Navigate to the `client` directory:
   ```bash
   cd ../client
   ```
2. Create an environment file `.env` in the `client` folder with:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_BACKEND_URL=http://localhost:5000/api
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. The client will be live on `http://localhost:3000`.

---

## Core Features & Mechanics

### 1. Carbon Footprint Calculations
Predefined scientific factors are used to calculate kg CO2 emissions:
- **Car**: 0.18 kg/km
- **Motorcycle**: 0.05 kg/km
- **Bus**: 0.08 kg/km
- **Train**: 0.04 kg/km
- **Electricity**: 0.85 kg/kWh
- **Diet**: Vegetarian (1.5 kg/day), Mixed (2.5 kg/day), Non-Vegetarian (4.5 kg/day)
- **Shopping**: Low (2 kg/day), Moderate (5 kg/day), High (10 kg/day)
- **Waste**: 1.2 kg/kg

### 2. Gamification & Badges
- **Eco Beginner**: Unlocked upon logging the first daily footprint.
- **Green Warrior**: Unlocked upon completing 3 eco challenges and earning 300 points.
- **Sustainability Champion**: Unlocked upon reaching 1000 points.

### 3. Offline Synchronization
If you lose internet connection, you can still log entries! The system stores the entry in the browser's `localStorage` queue. As soon as `window.onLine` fires, the application syncs all pending records sequentially with the backend server and triggers a success notification toast.

### 4. AI Recommendations Falling Back
When the Gemini API key is configured, the system uses `gemini-1.5-flash` to generate a response about your footprint. If no key is set, the local rules engine analyzes your average emissions, spots your largest emitter, and writes a rich markdown assessment.

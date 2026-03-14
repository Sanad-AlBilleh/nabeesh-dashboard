# CLAUDE.md

## Commands
```bash
npm install
npm run dev      # Vite dev server → http://localhost:3001
npm run build    # Production build → dist/
npm run start    # Serve dist/ via Express
```

## Environment Variables
Create a `.env` file (see `.env.example`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PIPELINE_URL=   # URL of Nabeesh-Pipeline-v1 FastAPI backend
```

## Architecture
React 18 SPA (Vite + Tailwind CSS + ShadCN-style components).
Served in production by a minimal Express server.

**Stack:**
- React 18 + React Router v6
- Tailwind CSS v3 (utility-first styling)
- ShadCN-inspired UI primitives in `src/components/ui/`
- Recharts for charts
- Lucide React for icons
- Supabase JS client for database

**Routing:**
- `/`                                    → `Dashboard`
- `/jobs/new`                            → `PostJob`
- `/jobs/:jobId`                         → `JobPipeline`
- `/jobs/:jobId/candidate/:candidateId`  → `CandidateDetail`

**Key files:**
- `src/lib/supabase.js`      — Supabase client, STATUS_LABELS, STATUS_COLORS, gradeColor, formatRelativeTime
- `src/components/ui/`       — Button, Card, Badge, Table, Progress, Input, Label, etc.
- `src/components/Layout.jsx`— Collapsible sidebar layout

**Candidate status flow:**
`applied → screening → screen_rejected | stage3_waiting → stage3_processing → interview_pending → interview_completed → scored → hired | rejected`

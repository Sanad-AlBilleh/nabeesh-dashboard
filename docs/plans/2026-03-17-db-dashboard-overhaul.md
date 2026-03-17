# Dashboard DB Overhaul — Master Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Agent assignments:** Task 2 MUST use Opus 4.6. Tasks 1, 3, 4 use Sonnet 4.6.

**Goal:** Eliminate all mock/fallback data, fully connect every dashboard feature to Supabase, clean up DB schema, and fix the per-candidate "Promote to Stage 3" button.

**Architecture:** Direct Supabase JS client queries from frontend (no Pipeline backend for reads). All writes/mutations via Supabase JS client. Pipeline backend (`Nabeesh-Pipeline-v1` on Railway) only for stage processing triggers (`/api/trigger-stage3`).

**Tech Stack:** React 18, Vite, Supabase JS v2, Recharts, Lucide React, inline CSS + CSS variables, no Tailwind, no Redux.

---

## Codebase Map

```
C:\Nabeesh\nabeesh-dashboard\
  src/
    pages/
      Dashboard.jsx        — Already DB-connected (fetchDashboardStats). No mock data.
      Analytics.jsx        — Already DB-connected. No mock data.
      Candidates.jsx       — Already DB-connected (fetchCandidates). No mock data.
      CandidateDetail.jsx  — Already DB-connected (fetchApplication). No mock data.
      Assessments.jsx      — Already DB-connected (custom_assessments). No mock data.
      Jobs.jsx             — MOCK DATA: MOCK_JOBS, setTimeout fake load. Must fix.
      Offers.jsx           — MOCK DATA: MOCK_OFFERS constant. Must fix.
      Interviews.jsx       — MOCK DATA: MOCK_INTERVIEWS constant. Must fix.
      Settings.jsx         — PARTIAL MOCK: INTEGRATIONS, EMAIL_TEMPLATES constants.
                             Company form uses live company from useAuth() but saves nowhere.
      JobDetail.jsx        — (check separately; likely uses DB via api.js)
      JobForm.jsx          — (check separately; likely uses DB via api.js)
      Login.jsx            — Auth only, no mock data.
      Signup.jsx           — Auth only, no mock data.
    lib/
      db.js                — fetchCandidates, fetchApplication, fetchDashboardStats — all real.
      auth.jsx             — AuthProvider, loadProfile reads recruiter_profiles → company.
                             BUG: loads company.name from prof.company_name (field doesn't
                             exist on recruiter_profiles; must join companies table).
      api.js               — FastAPI client wrapper — largely unused in UI (UI bypasses it).
      supabase.js          — Supabase JS client. Correct.
    components/            — All components are display-only. No mock data inside them.

C:\Nabeesh\Nabeesh-Pipeline-v1\
  main.py                  — FastAPI. Stages 1–4. /api/trigger-stage3 endpoint.
  stage6.py                — Stage 6 post-interview scoring.
```

---

## Database Schema Reference

### Tables confirmed in Supabase (project: vaewfynsxuormrztsfgi)

**`companies`**
| column | type |
|---|---|
| company_id | bigint PK |
| company_name | text NOT NULL |
| company_type | text |
| company_size | text |
| company_industry | text |
| company_location | text |
| company_tagline | text |
| company_admin_email | text |
| company_admin_phone | text |
| full_name | text |
| job_title | text |
| created_at | timestamptz |

**Missing from `companies`:** `website`, `description`. Settings page expects both. Must ALTER TABLE.

**`recruiter_profiles`**
| column | type |
|---|---|
| id | uuid PK (= auth.users.id) |
| company_id | bigint FK → companies |
| full_name | text NOT NULL |
| email | text NOT NULL |
| role | text |
| avatar_url | text |
| phone | text |
| timezone | text |
| created_at, updated_at | timestamptz |

**Missing from `recruiter_profiles`:** `company_name` — auth.jsx line 54 reads `prof.company_name` which does not exist. This is the root cause of "No company configured". Must fix auth.jsx to join companies.

**`offers`**
| column | type |
|---|---|
| id | bigint PK |
| candidate_id | bigint FK → candidates |
| job_id | bigint FK → jobs |
| application_id | bigint FK → applications |
| recruiter_id | uuid |
| company_id | bigint FK → companies |
| offer_data | jsonb NOT NULL |
| status | text |
| sent_at, signed_at, declined_at, expires_at | timestamptz |
| notes | text |
| template_id, docusign_envelope_id, docusign_status | text |
| created_at, updated_at | timestamptz |

**Missing from `offers`:** `salary`, `currency`, `equity`, `start_date` — all stored inside `offer_data` jsonb. No schema change needed; just read from `offer_data.salary`, `offer_data.currency`, `offer_data.equity`, `offer_data.start_date`.

**`interviews`**
| column | type |
|---|---|
| interview_id | bigint PK |
| run_id | bigint FK → pipeline_runs |
| job_id | bigint FK → jobs |
| candidate_id | bigint FK → candidates |
| application_id | bigint FK → applications |
| question_plan | jsonb |
| status | text |
| started_at, completed_at | timestamptz |
| duration_seconds | integer |
| interview_link | text |
| formatted_transcript, raw_transcript_object | text/jsonb |
| video_url, retell_recording_url | text |
| created_at, updated_at | timestamptz |

**Missing from `interviews`:** `type` (ai_voice vs live), `score` (lives in interview_scores.stage6_score), `transcript_available` (derive from formatted_transcript IS NOT NULL), `meeting_link` (use interview_link column). No schema change needed — derive from existing columns.
**Missing:** `scheduled_at` — interviews have no scheduled datetime field, only `started_at` / `completed_at`. Must ADD `scheduled_at timestamptz` for future scheduled (live) interviews.

**`interview_scores`**
| column | type |
|---|---|
| score_id | bigint PK |
| interview_id | bigint FK → interviews |
| application_id | bigint FK → applications |
| candidate_id | bigint FK → candidates |
| job_id | bigint FK → jobs |
| stage6_score | numeric |
| final_composite | numeric |
| relevance_avg, depth_avg, accuracy_avg, communication_avg | numeric |
| profile_consistency_grade, motivation_fit_grade, composure_grade | text |
| behavioral_flags, filler_word_analysis | jsonb |
| assessment_summary | text |
| scored_at | timestamptz |

**`facial_analysis_results`**
| column | type |
|---|---|
| id | bigint PK |
| interview_id | bigint FK → interviews |
| confidence_score | numeric |
| engagement_score | numeric |
| stress_tolerance_score | numeric |
| communication_style_score | numeric |
| authenticity_score | numeric |
| overall_score | numeric |
| facial_openness/conscientiousness/extraversion/agreeableness/neuroticism | numeric |
| timeline_data | jsonb |
| ai_summary | text |
| key_moments | jsonb |
| action_unit_averages | jsonb |
| face_thumbnail_url, video_duration_sec, frames_analyzed, processing_duration_ms | various |
| status, error_message | text |

All display columns for facial + body language tabs exist. No schema changes needed here.

**`candidates`**
| column | type |
|---|---|
| candidate_id | bigint PK |
| full_name, email, phone | text |
| city, country | text |
| professional_summary, seniority_level | text |
| years_relevant_experience | numeric |
| highest_degree, major, university | text |
| skills, certifications, languages | ARRAY |
| cv_file_url, source_file_url, linkedin_url | text |
| summary_embedding | vector (USER-DEFINED) |
| gender, education_stage | text |
| parsing_confidence, raw_extracted_text | text |
| created_at, updated_at | timestamptz |

`certifications`, `languages` arrays exist. Full Profile tab can display them directly.

**`candidate_experiences`** — FK: candidate_id → candidates
**`candidate_projects`** — FK: candidate_id → candidates

Already queried in CandidateDetail.jsx (lines 151–156).

**`jobs`**
| key columns |
|---|
| job_id, company_id, title, status |
| job_city, job_country, is_remote, employment_type, seniority_level |
| required_skills, preferred_skills, salary_min, salary_max, salary_currency |
| created_at |

Missing from `jobs` for Jobs page: `location` (derive from job_city + job_country), `location_type` (derive from is_remote: true → 'remote', else check job_city/country), `application_count` (aggregate from applications), `distributions` (from job_distributions table).

**`job_distributions`** — FK: job_id → jobs. Has: platform, status, posted_at, external_url.

**`email_templates`** — FK: company_id → companies. Has: name, subject, body_html, variables, is_active.

**`integration_connections`** — FK: company_id → companies. Has: platform, status, credentials, config, connected_at.

---

## File Map: Files to Create or Modify

| File | Change |
|---|---|
| `src/lib/auth.jsx` | Fix loadProfile to JOIN companies; expose full company object |
| `src/lib/db.js` | Add fetchJobs(), fetchOffers(), fetchInterviews(), saveSettings() |
| `src/pages/Jobs.jsx` | Remove MOCK_JOBS; connect to Supabase jobs + job_distributions |
| `src/pages/Offers.jsx` | Remove MOCK_OFFERS; connect to Supabase offers + candidates + jobs |
| `src/pages/Interviews.jsx` | Remove MOCK_INTERVIEWS; connect to Supabase interviews + interview_scores |
| `src/pages/Settings.jsx` | Remove INTEGRATIONS, EMAIL_TEMPLATES constants; connect to DB |
| `src/pages/CandidateDetail.jsx` | Fix promote button (Task 4); verify full_profile tab has certifications/languages |

---

## Chunk 1: Tasks 1 and 4

---

## Task 1: Remove All Mock/Fallback Data (Sonnet 4.6)

### Mock Variables Inventory

| File | Mock Variable/Expression | Line(s) | Action |
|---|---|---|---|
| `Jobs.jsx` | `MOCK_JOBS` constant (10 hardcoded jobs) | 11–22 | Delete entire constant |
| `Jobs.jsx` | `PLATFORM_LABELS`, `PLATFORM_COLORS` | 24–25 | Keep — these are display config, not mock data |
| `Jobs.jsx` | `setTimeout(() => { setJobs(MOCK_JOBS)... }, 600)` in useEffect | 36–37 | Replace with real Supabase fetch |
| `Offers.jsx` | `MOCK_OFFERS` constant (7 hardcoded offers) | 9–17 | Delete entire constant |
| `Offers.jsx` | `filtered = MOCK_OFFERS.filter(...)` | 25 | Replace with state variable |
| `Offers.jsx` | `statusCounts` computed from `MOCK_OFFERS` | 32 | Compute from real data |
| `Offers.jsx` | `signed = MOCK_OFFERS.filter(...)` | 33 | Compute from real data |
| `Offers.jsx` | `pending = MOCK_OFFERS.filter(...)` | 34 | Compute from real data |
| `Offers.jsx` | Summary cards: `MOCK_OFFERS.length`, `.filter(...)` | 67–70 | Compute from real data |
| `Interviews.jsx` | `MOCK_INTERVIEWS` constant (7 hardcoded interviews) | 11–18 | Delete entire constant |
| `Interviews.jsx` | `const now = new Date('2026-03-16T10:00:00')` | 9 | Delete (unused after mock removal) |
| `Interviews.jsx` | `upcoming = MOCK_INTERVIEWS.filter(...)` | 26 | Replace with state variable |
| `Interviews.jsx` | `past = MOCK_INTERVIEWS.filter(...)` | 27 | Replace with state variable |
| `Interviews.jsx` | Calendar: `MOCK_INTERVIEWS.filter(iv => iv.scheduled_at.startsWith(dateStr))` | 155 | Replace with real data |
| `Settings.jsx` | `INTEGRATIONS` constant (6 hardcoded integrations) | 6–13 | Delete; replace with DB fetch |
| `Settings.jsx` | `EMAIL_TEMPLATES` constant (5 hardcoded templates) | 15–21 | Delete; replace with DB fetch |
| `Settings.jsx` | `companyForm` initialized with `'Acme Corp'` fallback | 30 | Remove hardcoded fallback |
| `Settings.jsx` | `companyForm.website` initialized with `'https://acme.com'` | 31 | Remove hardcoded fallback |
| `Settings.jsx` | `companyForm.industry` initialized with `'Technology'` | 32 | Remove hardcoded fallback |

### DB Slate: Delete Existing Test Rows

- [ ] **Step 1: Delete test data from DB**

Run in Supabase SQL editor (or via MCP execute_sql):

```sql
-- Order matters due to FK constraints
DELETE FROM facial_analysis_results;
DELETE FROM interview_scores;
DELETE FROM interview_conversation_log;
DELETE FROM interviews;
DELETE FROM stage3_results;
DELETE FROM stage2_results;
DELETE FROM stage1_results;
DELETE FROM pipeline_runs;
DELETE FROM applications;
DELETE FROM candidates;
-- Keep companies, recruiter_profiles, jobs — those belong to the recruiter
```

- [ ] **Step 2: Verify tables are empty**

```sql
SELECT
  (SELECT COUNT(*) FROM applications) AS applications,
  (SELECT COUNT(*) FROM candidates) AS candidates,
  (SELECT COUNT(*) FROM interviews) AS interviews,
  (SELECT COUNT(*) FROM stage2_results) AS stage2_results;
```

Expected: all 0.

- [ ] **Step 3: Remove MOCK_JOBS from Jobs.jsx**

In `src/pages/Jobs.jsx`, delete lines 11–22 (the `MOCK_JOBS` constant).
Delete lines 24–25 (PLATFORM_LABELS, PLATFORM_COLORS are kept as display config — do not delete).
Replace the `useEffect` block (lines 35–37) with a real fetch (implemented in Task 2).

- [ ] **Step 4: Remove MOCK_OFFERS from Offers.jsx**

In `src/pages/Offers.jsx`, delete lines 9–17 (the `MOCK_OFFERS` constant).
Replace all 5 references to `MOCK_OFFERS` with references to a `offers` state variable (implemented in Task 2).

- [ ] **Step 5: Remove MOCK_INTERVIEWS from Interviews.jsx**

In `src/pages/Interviews.jsx`, delete lines 9–19 (the `MOCK_INTERVIEWS` constant and `const now` line).
Replace all references to `MOCK_INTERVIEWS` with references to `interviews` state variable (implemented in Task 2).

- [ ] **Step 6: Remove INTEGRATIONS constant from Settings.jsx**

In `src/pages/Settings.jsx`, delete lines 6–13 (the `INTEGRATIONS` constant).
Add a `useEffect` to fetch from `integration_connections` table (implemented in Task 2).

- [ ] **Step 7: Remove EMAIL_TEMPLATES constant from Settings.jsx**

In `src/pages/Settings.jsx`, delete lines 15–21 (the `EMAIL_TEMPLATES` constant).
Add a `useEffect` to fetch from `email_templates` table (implemented in Task 2).

- [ ] **Step 8: Remove hardcoded fallbacks from Settings.jsx companyForm**

In `src/pages/Settings.jsx` lines 30–32, change:
```js
// BEFORE
name: company?.name || 'Acme Corp',
website: company?.website || 'https://acme.com',
industry: company?.industry || 'Technology',
```
To:
```js
// AFTER — will be repopulated from DB in Task 2
name: '',
website: '',
industry: '',
description: '',
company_type: '',
company_size: '',
company_location: '',
```

- [ ] **Step 9: Commit**

```bash
git add src/pages/Jobs.jsx src/pages/Offers.jsx src/pages/Interviews.jsx src/pages/Settings.jsx
git commit -m "chore: remove all mock/fallback data constants from pages"
```

**Expected result after Task 1:** All four pages render empty states (no data) with no errors. The UI structure is intact. No hardcoded arrays remain in any page file.

---

## Task 4: Fix the "Promote to Stage 3" Button (Sonnet 4.6)

### Analysis of the Pipeline `/api/trigger-stage3` Endpoint

From reading `main.py` lines 134–230:

1. The endpoint accepts `{ job_id, top_percent? }` — **no `application_id` parameter**.
2. It fetches ALL candidates for that job whose `application.status == 'stage3_waiting'`.
3. It ranks them by `stage2_results.total_score` descending.
4. It promotes the top `STAGE3_TOP_PERCENT` percent (configurable, default likely 30%).
5. It sets promoted candidates' status to `stage3_processing` and runs Stage 3 in background.

**There is no single-candidate endpoint.** The endpoint is bulk, per-job.

### The Fix: Per-Candidate Promote via Direct DB Update

The pipeline's `run_stage3_and_beyond()` function is called only after:
1. The application status is set to `stage3_processing`
2. The `pipeline_stage` is set to `stage3_llm_eval`

The `/api/trigger-stage3` endpoint checks `.eq("status", "stage3_waiting")` before updating, then calls `run_stage3_and_beyond()` via background task.

**Fix approach (option c):** For a per-candidate promote button, directly update the application row via Supabase, then POST to `/api/trigger-stage3` with `{ job_id, top_percent: 1.0 }`. With `top_percent: 1.0`, all waiting candidates for that job are promoted — but since only this one was just set to `stage3_waiting` and the rest were already promoted, this effectively triggers only the one candidate.

**Cleaner approach:** Update the application status to `stage3_processing` and `pipeline_stage` to `stage3_llm_eval` directly via Supabase (bypassing the percentage logic), then POST to a single-candidate trigger. Since there is no single-candidate endpoint, we update the DB directly to `stage3_processing` first (skipping the percentage logic), then call the Pipeline with a custom endpoint or call `run_stage3_and_beyond` indirectly.

**Simplest correct approach:** Directly update the DB to status `stage3_processing` + pipeline_stage `stage3_llm_eval`, then POST `{ job_id, top_percent: 1.0 }` to `/api/trigger-stage3`. The endpoint will find this candidate (it checks `stage3_waiting`, not `stage3_processing`). **Wait** — the endpoint only picks up `stage3_waiting` status candidates. So updating to `stage3_processing` first would make the trigger miss it.

**Therefore the correct flow is:**
1. Verify application is currently `stage3_waiting` (else show error).
2. POST `{ job_id: application.job_id, top_percent: 1.0 }` to `/api/trigger-stage3`.
3. The endpoint will pick up this candidate (and any other waiting candidates for same job) and promote them all.
4. Poll or refresh application status to show updated state.

If the user wants ONLY this specific candidate promoted (not all waiting), the correct approach is a new endpoint on the Pipeline. For now, use `top_percent: 1.0` which promotes all currently waiting candidates for that job.

### Files to Modify

- `src/pages/CandidateDetail.jsx` — add PromoteButton component
- `src/lib/api.js` — add `triggerStage3(jobId)` function

### Implementation

- [ ] **Step 1: Add triggerStage3 to api.js**

In `src/lib/api.js`, add after the existing exports:

```js
// ─── Pipeline Triggers ─────────────────────────────────────────
export const triggerStage3 = (jobId, topPercent = 1.0) =>
  post('/api/trigger-stage3', { job_id: jobId, top_percent: topPercent })
```

- [ ] **Step 2: Add promote button to CandidateDetail PipelineTab**

In `src/pages/CandidateDetail.jsx`, find the `PipelineTab` component and inside the `llm_evaluation` stage card content section, add a promote button that appears when `application.status === 'stage3_waiting'`.

Locate the stage card render loop (around line 634) where `meta.key === 'llm_evaluation'` is handled. Add after the LLMContent component:

```jsx
{meta.key === 'llm_evaluation' && (
  <>
    <LLMContent stage3={stage3} />
    {application.status === 'stage3_waiting' && job?.job_id && (
      <PromoteButton
        applicationId={application.application_id}
        jobId={job.job_id}
        onPromoted={() => {
          // Reload application data to reflect new status
          fetchApplication(application.application_id).then(result => {
            setApplication(result.application)
            setStage3(result.stage3)
          }).catch(console.error)
        }}
      />
    )}
  </>
)}
```

- [ ] **Step 3: Implement PromoteButton component**

Add this component inside `CandidateDetail.jsx` (at the bottom, before the export):

```jsx
function PromoteButton({ applicationId, jobId, onPromoted }) {
  const [promoting, setPromoting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handlePromote() {
    if (promoting) return
    setPromoting(true)
    setError(null)
    try {
      // POST to pipeline trigger — top_percent: 1.0 promotes all waiting for this job
      await triggerStage3(jobId, 1.0)
      setDone(true)
      // Give the pipeline a moment, then refresh
      setTimeout(() => {
        onPromoted()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to trigger Stage 3')
    } finally {
      setPromoting(false)
    }
  }

  if (done) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', marginTop: 12,
        background: 'rgba(52,211,153,0.08)',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: 7,
      }}>
        <CheckCircle size={14} color="#34d399" />
        <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>
          Stage 3 triggered — processing in background
        </span>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12 }}>
      {error && (
        <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>{error}</p>
      )}
      <button
        onClick={handlePromote}
        disabled={promoting}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px',
          background: promoting ? 'var(--bg-tertiary)' : 'var(--accent)',
          color: promoting ? 'var(--text-muted)' : '#fff',
          border: '1px solid',
          borderColor: promoting ? 'var(--border)' : 'var(--accent)',
          borderRadius: 7,
          fontSize: 13, fontWeight: 600,
          cursor: promoting ? 'not-allowed' : 'pointer',
          transition: 'all 0.12s',
        }}
      >
        <Zap size={13} />
        {promoting ? 'Triggering…' : 'Promote to Stage 3'}
      </button>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
        Triggers LLM evaluation for all stage3_waiting candidates in this job.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Add triggerStage3 import to CandidateDetail.jsx**

At the top of `src/pages/CandidateDetail.jsx`, add to the api import:

```js
import { triggerStage3 } from '../lib/api'
```

- [ ] **Step 5: Verify the button only appears in the correct state**

The button must ONLY appear when `application.status === 'stage3_waiting'`. Confirm no other status value shows it. The pipeline sets `stage3_processing` → `stage3_llm_eval` → `interview_pending` — none of these should show the button.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.js src/pages/CandidateDetail.jsx
git commit -m "feat: add per-candidate Promote to Stage 3 button in pipeline tab"
```

**Expected result after Task 4:** On a candidate's Pipeline tab, when `application.status === 'stage3_waiting'`, a "Promote to Stage 3" button appears. Clicking it calls `POST /api/trigger-stage3` with `{ job_id, top_percent: 1.0 }`. All `stage3_waiting` candidates for that job (including this one) are triggered. On success, the button shows a success state and refreshes the application data.

---

## Chunk 2: Task 2

---

## Task 2: Full DB↔UI Connectivity (Opus 4.6)

> **CRITICAL:** This task MUST be executed by the Opus 4.6 agent. It touches the most complex data mapping and requires precise Supabase query construction.

### Sub-task 2A: Fix Auth — "No Company Configured" Root Cause

**Root cause:** `auth.jsx` line 54 reads `prof.company_name` from `recruiter_profiles`. But `recruiter_profiles` has NO `company_name` column. It only has `company_id` (FK to `companies`). So `company_name` is always undefined, making `setCompany(null)` — hence every page shows "No company configured".

**Fix:** Join `companies` table in `loadProfile`.

**Files to modify:** `src/lib/auth.jsx`

- [ ] **Step 1: Fix loadProfile to join companies**

Replace the `loadProfile` function in `src/lib/auth.jsx`:

```js
async function loadProfile(userId) {
  try {
    // Join recruiter_profiles → companies to get full company data
    const { data: prof, error: profErr } = await supabase
      .from('recruiter_profiles')
      .select(`
        *,
        companies (
          company_id,
          company_name,
          company_industry,
          company_size,
          company_type,
          company_location,
          company_tagline,
          company_admin_email,
          company_admin_phone
        )
      `)
      .eq('id', userId)
      .maybeSingle()

    if (profErr) throw profErr
    setProfile(prof || null)

    if (prof?.company_id && prof?.companies) {
      setCompany({
        id: prof.company_id,
        name: prof.companies.company_name,
        industry: prof.companies.company_industry,
        size: prof.companies.company_size,
        type: prof.companies.company_type,
        location: prof.companies.company_location,
        tagline: prof.companies.company_tagline,
        admin_email: prof.companies.company_admin_email,
        admin_phone: prof.companies.company_admin_phone,
        // will be populated after schema migration in 2B:
        website: prof.companies.website || null,
        description: prof.companies.description || null,
      })
    } else {
      setCompany(null)
    }
  } catch (err) {
    console.warn('Profile load error:', err.message)
    setCompany(null)
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: Verify Dashboard loads company name**

After this fix, Dashboard should show the company name in the header and no longer show "No company configured" for a recruiter whose `recruiter_profiles.company_id` is set.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.jsx
git commit -m "fix: load company data via join in loadProfile — resolves No company configured"
```

---

### Sub-task 2B: Schema Migrations for Missing Columns

Run these migrations via Supabase SQL editor or `mcp__plugin_supabase_supabase__apply_migration`:

- [ ] **Step 1: Add missing columns to `companies`**

```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS description text;
```

- [ ] **Step 2: Add `scheduled_at` to `interviews`**

```sql
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_type text DEFAULT 'ai_voice';
```

`interview_type` values: `'ai_voice'` | `'live'`. Default `'ai_voice'` (all existing pipeline interviews are AI voice via Retell).

- [ ] **Step 3: Add `sign_on_bonus` to offers (if desired by user)**

The Offers page shows a "sign-on bonus" field. Currently not in `offer_data` schema. This lives inside the `offer_data` jsonb — no migration needed; just write and read `offer_data.sign_on_bonus`.

- [ ] **Step 4: Commit migration notes**

```bash
git add . # add any migration tracking files
git commit -m "db: add website/description to companies, scheduled_at/interview_type to interviews"
```

---

### Sub-task 2C: Settings Page — Full DB Connectivity

**Files to modify:** `src/pages/Settings.jsx`, `src/lib/db.js`

The Settings page has 4 tabs: Company, Profile, Integrations, Email Templates.

**Company tab** must read/write the `companies` table.
**Profile tab** must read/write the `recruiter_profiles` table.
**Integrations tab** must read from `integration_connections` table.
**Email Templates tab** must read/write `email_templates` table.

- [ ] **Step 1: Add DB helper functions to db.js**

```js
// Settings: fetch full company by id
export async function fetchCompany(companyId) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('company_id', companyId)
    .single()
  if (error) throw error
  return data
}

// Settings: update company fields
export async function updateCompany(companyId, fields) {
  const { data, error } = await supabase
    .from('companies')
    .update(fields)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Settings: update recruiter profile
export async function updateRecruiterProfile(userId, fields) {
  const { data, error } = await supabase
    .from('recruiter_profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Settings: fetch integration connections for company
export async function fetchIntegrations(companyId) {
  const { data, error } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('company_id', companyId)
  if (error) throw error
  return data || []
}

// Settings: fetch email templates for company
export async function fetchEmailTemplates(companyId) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

// Settings: update email template
export async function updateEmailTemplate(templateId, fields) {
  const { data, error } = await supabase
    .from('email_templates')
    .update(fields)
    .eq('id', templateId)
    .select()
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Rewrite Settings.jsx Company tab**

Remove the `INTEGRATIONS` and `EMAIL_TEMPLATES` constants (already done in Task 1).

Add state and useEffect at top of `Settings()` component:

```jsx
const { user, profile, company, loadProfile } = useAuth()
const [companyData, setCompanyData] = useState(null)
const [integrations, setIntegrations] = useState([])
const [emailTemplates, setEmailTemplates] = useState([])
const [loadingData, setLoadingData] = useState(true)

useEffect(() => {
  if (!company?.id) return
  async function loadSettings() {
    setLoadingData(true)
    try {
      const [comp, intgs, templates] = await Promise.all([
        fetchCompany(company.id),
        fetchIntegrations(company.id),
        fetchEmailTemplates(company.id),
      ])
      setCompanyData(comp)
      setIntegrations(intgs)
      setEmailTemplates(templates)
      // Initialize company form from real data
      setCompanyForm({
        name: comp.company_name || '',
        website: comp.website || '',
        industry: comp.company_industry || '',
        description: comp.description || '',
        company_type: comp.company_type || '',
        company_size: comp.company_size || '',
        company_location: comp.company_location || '',
      })
    } catch (err) {
      console.error('Settings load error:', err)
    } finally {
      setLoadingData(false)
    }
  }
  loadSettings()
}, [company?.id])
```

- [ ] **Step 3: Wire Save Changes button for Company tab**

Replace the `handleSave` stub with a real save:

```jsx
async function handleSaveCompany() {
  setSaving(true)
  try {
    await updateCompany(company.id, {
      company_name: companyForm.name,
      website: companyForm.website,
      company_industry: companyForm.industry,
      description: companyForm.description,
      company_type: companyForm.company_type,
      company_size: companyForm.company_size,
      company_location: companyForm.company_location,
    })
    setSaved(true)
    // Refresh auth context company
    await loadProfile(user.id)
    setTimeout(() => setSaved(false), 2000)
  } catch (err) {
    console.error('Save company error:', err)
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 4: Wire Save Changes button for Profile tab**

```jsx
async function handleSaveProfile() {
  setSaving(true)
  try {
    await updateRecruiterProfile(user.id, {
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      timezone: profileForm.timezone,
    })
    setSaved(true)
    await loadProfile(user.id)
    setTimeout(() => setSaved(false), 2000)
  } catch (err) {
    console.error('Save profile error:', err)
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 5: Wire Integrations tab**

Replace the static `INTEGRATIONS` map with the `integrations` state array. The DB `integration_connections.platform` column is the key. Map `status: 'active'` → "Connected", any other value → "Not connected".

The "Connect" and "Disconnect" buttons can remain non-functional for now (they'd need OAuth flows) — just display the real connection status from DB.

Render:
```jsx
{integrations.length === 0
  ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No integrations configured.</p>
  : integrations.map(intg => (
    <IntegrationRow key={intg.id} integration={intg} />
  ))
}
```

- [ ] **Step 6: Wire Email Templates tab**

Replace `EMAIL_TEMPLATES` with `emailTemplates` state. Use `body_html` column (the DB uses `body_html`, not `body`). Save via `updateEmailTemplate(template.id, { subject, body_html })`.

- [ ] **Step 7: Add missing fields to Settings Company form**

The Settings UI currently only has: Name, Website, Industry, Description.
The `companies` table also has: `company_type`, `company_size`, `company_location`, `company_tagline`.
Add these fields to the Company tab form:

```jsx
<Field label="Company Type" value={companyForm.company_type} onChange={v => setCompanyForm(f => ({ ...f, company_type: v }))} />
<Field label="Company Size" value={companyForm.company_size} onChange={v => setCompanyForm(f => ({ ...f, company_size: v }))} />
<Field label="Location" value={companyForm.company_location} onChange={v => setCompanyForm(f => ({ ...f, company_location: v }))} />
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/Settings.jsx src/lib/db.js
git commit -m "feat: connect Settings page to Supabase companies/integrations/email_templates"
```

---

### Sub-task 2D: Jobs Page — Full DB Connectivity

**Files to modify:** `src/pages/Jobs.jsx`, `src/lib/db.js`

- [ ] **Step 1: Add fetchJobs to db.js**

```js
export async function fetchJobs(companyId) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      job_id, title, status, seniority_level,
      job_city, job_country, is_remote, employment_type,
      created_at,
      job_distributions(platform, status)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error

  // Fetch application counts separately (Supabase can't aggregate in select easily)
  const jobIds = (data || []).map(j => j.job_id)
  let countMap = {}
  if (jobIds.length > 0) {
    // Use count per job_id
    const { data: apps } = await supabase
      .from('applications')
      .select('job_id')
      .in('job_id', jobIds)
    for (const a of (apps || [])) {
      countMap[a.job_id] = (countMap[a.job_id] || 0) + 1
    }
  }

  return (data || []).map(j => ({
    ...j,
    // Derive location string
    location: j.is_remote
      ? 'Remote'
      : [j.job_city, j.job_country].filter(Boolean).join(', ') || 'Unknown',
    // Derive location_type
    location_type: j.is_remote ? 'remote' : (j.job_city ? 'onsite' : 'remote'),
    // Application count
    application_count: countMap[j.job_id] || 0,
    // Distribution platforms
    distributions: (j.job_distributions || [])
      .filter(d => d.status === 'active' || d.status === 'posted')
      .map(d => d.platform),
  }))
}
```

- [ ] **Step 2: Rewrite Jobs.jsx useEffect**

```jsx
const { company } = useAuth()

useEffect(() => {
  if (!company?.id) { setLoading(false); return }
  fetchJobs(company.id)
    .then(data => { setJobs(data); setLoading(false) })
    .catch(err => { console.error('Jobs fetch error:', err); setLoading(false) })
}, [company?.id])
```

- [ ] **Step 3: Update Jobs.jsx table rendering**

Jobs from DB use `job_id` (not `id`). Update: `key={job.job_id}`, `navigate(\`/jobs/${job.job_id}\`)`.
Title column: already `job.title`. Location: already derived.
The `seniority` sub-label: use `job.seniority_level` (same field name).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Jobs.jsx src/lib/db.js
git commit -m "feat: connect Jobs page to Supabase — remove MOCK_JOBS"
```

---

### Sub-task 2E: Offers Page — Full DB Connectivity

**Files to modify:** `src/pages/Offers.jsx`, `src/lib/db.js`

The `offers` table stores `salary`, `currency`, `equity`, `start_date`, `sign_on_bonus` inside the `offer_data` jsonb column. The UI must extract these from `offer_data`.

- [ ] **Step 1: Add fetchOffers to db.js**

```js
export async function fetchOffers(companyId) {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      id, status, sent_at, signed_at, declined_at, expires_at,
      offer_data, notes, created_at,
      candidates(candidate_id, full_name, email),
      jobs(job_id, title)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data || []).map(o => ({
    ...o,
    // Flatten offer_data fields for UI convenience
    candidate: o.candidates?.full_name || '—',
    candidate_id: o.candidates?.candidate_id,
    job: o.jobs?.title || '—',
    salary: o.offer_data?.salary ?? null,
    currency: o.offer_data?.currency ?? 'USD',
    equity: o.offer_data?.equity ?? null,
    start_date: o.offer_data?.start_date ?? null,
    sign_on_bonus: o.offer_data?.sign_on_bonus ?? null,
  }))
}

export async function createOffer(companyId, recruiterId, candidateId, jobId, applicationId, offerData) {
  const { data, error } = await supabase
    .from('offers')
    .insert({
      company_id: companyId,
      recruiter_id: recruiterId,
      candidate_id: candidateId,
      job_id: jobId,
      application_id: applicationId,
      offer_data: offerData,
      status: 'draft',
    })
    .select()
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Rewrite Offers.jsx with real data**

```jsx
const { user, company } = useAuth()
const [offers, setOffers] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  if (!company?.id) { setLoading(false); return }
  fetchOffers(company.id)
    .then(data => { setOffers(data); setLoading(false) })
    .catch(err => { console.error('Offers fetch:', err); setLoading(false) })
}, [company?.id])

// Replace all MOCK_OFFERS references with offers state variable
const filtered = offers.filter(o => {
  const matchSearch = !search
    || o.candidate.toLowerCase().includes(search.toLowerCase())
    || o.job.toLowerCase().includes(search.toLowerCase())
  const matchStatus = statusFilter === 'all' || o.status === statusFilter
  return matchSearch && matchStatus
})

const statusCounts = {}
offers.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })
const signed = offers.filter(o => o.status === 'signed').length
const pending = offers.filter(o => ['sent', 'draft'].includes(o.status)).length
```

- [ ] **Step 3: Wire "Create Offer" modal save**

The Create Offer modal form must collect: candidate (search box → select application_id), job_id, salary, currency, equity, start_date, expiry_date, notes.
On submit: call `createOffer(...)` from db.js, then reload `fetchOffers(company.id)`.

For the candidate/job dropdowns, fetch from Supabase:
```jsx
// In modal open handler:
const { data: hiredCandidates } = await supabase
  .from('applications')
  .select('application_id, candidates(full_name), jobs(title, job_id)')
  .eq('jobs.company_id', company.id)
  .in('status', ['interview_completed', 'scored', 'hired'])
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Offers.jsx src/lib/db.js
git commit -m "feat: connect Offers page to Supabase — remove MOCK_OFFERS"
```

---

### Sub-task 2F: Interviews Page — Full DB Connectivity

**Files to modify:** `src/pages/Interviews.jsx`, `src/lib/db.js`

The `interviews` table uses `started_at`/`completed_at` rather than `scheduled_at`. After the schema migration in 2B adds `scheduled_at`, this works for future live interviews.
For existing AI voice interviews: derive the "date" from `completed_at` (or `started_at`).

- [ ] **Step 1: Add fetchInterviews to db.js**

```js
export async function fetchInterviews(companyId) {
  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select('job_id')
    .eq('company_id', companyId)
  if (jobsErr) throw jobsErr

  const jobIds = (jobs || []).map(j => j.job_id)
  if (jobIds.length === 0) return []

  const { data, error } = await supabase
    .from('interviews')
    .select(`
      interview_id, status, duration_seconds, interview_link,
      scheduled_at, started_at, completed_at,
      interview_type, formatted_transcript, video_url,
      created_at, job_id, candidate_id, application_id,
      candidates(full_name),
      jobs(title),
      interview_scores(stage6_score)
    `)
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data || []).map(iv => ({
    ...iv,
    // Candidate / job name
    candidate: iv.candidates?.full_name || '—',
    job: iv.jobs?.title || '—',
    // Score
    score: iv.interview_scores?.[0]?.stage6_score ?? null,
    // Duration in minutes
    duration: iv.duration_seconds ? Math.round(iv.duration_seconds / 60) : null,
    // Type: use interview_type column (after migration), default 'ai_voice'
    type: iv.interview_type || 'ai_voice',
    // Scheduled date: use scheduled_at if set, else started_at, else completed_at
    scheduled_at: iv.scheduled_at || iv.started_at || iv.completed_at,
    // Transcript available?
    transcript_available: !!iv.formatted_transcript,
    // Meeting link
    meeting_link: iv.interview_link || null,
  }))
}

export async function scheduleInterview(applicationId, candidateId, jobId, scheduledAt, durationMinutes, type, meetingLink) {
  const { data, error } = await supabase
    .from('interviews')
    .insert({
      application_id: applicationId,
      candidate_id: candidateId,
      job_id: jobId,
      scheduled_at: scheduledAt,
      duration_seconds: durationMinutes * 60,
      interview_type: type,
      interview_link: meetingLink,
      status: 'scheduled',
      question_plan: {}, // empty for manually scheduled
    })
    .select()
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Rewrite Interviews.jsx with real data**

```jsx
const { company } = useAuth()
const [interviews, setInterviews] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  if (!company?.id) { setLoading(false); return }
  fetchInterviews(company.id)
    .then(data => { setInterviews(data); setLoading(false) })
    .catch(err => { setError(err.message); setLoading(false) })
}, [company?.id])

const upcoming = interviews
  .filter(i => i.status === 'scheduled')
  .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))

const past = interviews
  .filter(i => ['completed', 'scored'].includes(i.status))
  .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
```

- [ ] **Step 3: Wire "Schedule Interview" modal save**

On form submit:
```jsx
async function handleSchedule() {
  const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString()
  await scheduleInterview(
    null, // no application_id for manually scheduled
    null, // no candidate_id (from name field)
    null, // no job_id (from job field)
    scheduledAt,
    form.duration,
    form.type,
    form.meeting_link || null,
  )
  setScheduleOpen(false)
  // reload
  fetchInterviews(company.id).then(setInterviews)
}
```

Note: for full implementation the modal needs candidate/job dropdowns that resolve IDs. This is the same pattern as the Offers modal — fetch candidates and jobs from DB.

- [ ] **Step 4: Fix calendar view to use real data**

Replace `MOCK_INTERVIEWS.filter(...)` in calendar with:
```jsx
const dayInterviews = dateStr
  ? interviews.filter(iv => iv.scheduled_at?.startsWith(dateStr))
  : []
```

Remove the hardcoded `'2026-03-16'` "current day" and use `new Date()` instead.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Interviews.jsx src/lib/db.js
git commit -m "feat: connect Interviews page to Supabase — remove MOCK_INTERVIEWS"
```

---

### Sub-task 2G: CandidateDetail — Full Profile Tab (certifications, languages)

**Files to modify:** `src/pages/CandidateDetail.jsx`

The `candidates` table already has `certifications` (ARRAY) and `languages` (ARRAY) columns. The `FullProfileTab` component receives `candidate` prop which is the full `candidates` row. This data is already fetched.

- [ ] **Step 1: Verify FullProfileTab renders certifications and languages**

Find `FullProfileTab` component in `CandidateDetail.jsx`. Confirm it renders `candidate.certifications` and `candidate.languages`. If not, add:

```jsx
{candidate.certifications?.length > 0 && (
  <div>
    <SectionTitle title="Certifications" icon={Award} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
      {candidate.certifications.map((cert, i) => (
        <span key={i} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 12, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
          {cert}
        </span>
      ))}
    </div>
  </div>
)}

{candidate.languages?.length > 0 && (
  <div>
    <SectionTitle title="Languages" icon={BookOpen} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
      {candidate.languages.map((lang, i) => (
        <span key={i} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 12, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
          {lang}
        </span>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/CandidateDetail.jsx
git commit -m "feat: display certifications and languages in Full Profile tab"
```

---

### Sub-task 2H: Score Distribution Tab

The `ScoreDistributionTab` already queries real data (lines 174–194 of CandidateDetail.jsx). It fetches:
- `stage2_results.total_score` by `job_id` — exists
- `interview_scores.stage6_score, final_composite` by `job_id` — exists
- `facial_analysis_results.overall_score` by interview_ids — exists

**This is already correctly wired.** No changes needed unless columns are missing (they're not).

- [ ] **Step 1: Verify distribution tab works end-to-end**

Navigate to a candidate who has gone through stages 2 and 6. Confirm score histograms render. If they show "No data" that's expected until real candidates run through the pipeline.

---

### Sub-task 2I: Analytics Page

The `Analytics.jsx` page is already fully DB-connected (lines 55–166 use only Supabase queries). It correctly reads `applications`, `stage2_results`, `interviews`.

The only remaining issue is that `dateRange` state (`1m`, `3m`, `6m`, `1y`) is set but NEVER used to filter the `loadAnalytics` call. The monthly trend chart is hardcoded to 6 months regardless of the selector.

- [ ] **Step 1: Wire dateRange to actual data filtering**

Pass `dateRange` into `loadAnalytics` and filter `apps` by `applied_at`:

```jsx
useEffect(() => {
  if (!company?.id) { setLoading(false); return }
  loadAnalytics(company.id, dateRange)
}, [company?.id, dateRange])

async function loadAnalytics(companyId, range) {
  // Convert range to a cutoff date
  const cutoffMap = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }
  const months = cutoffMap[range] || 6
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const cutoffISO = cutoff.toISOString()

  const { data: apps, error: appsErr } = await supabase
    .from('applications')
    .select(`...`)
    .eq('jobs.company_id', companyId)
    .gte('applied_at', cutoffISO)   // <-- add this filter
    .order('applied_at', { ascending: false })
  ...
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Analytics.jsx
git commit -m "fix: wire dateRange filter to analytics data query"
```

---

**Expected result after Task 2:** Every page in the dashboard reads from and writes to Supabase. No page shows "No company configured" when the recruiter has a `company_id` in their profile. Offers, Interviews, Jobs, and Settings all show real data (or empty states if no data exists). The full candidate profile shows certifications, languages, and all stage scores.

---

## Chunk 3: Task 3

---

## Task 3: DB Schema Audit & Cleanup (Sonnet 4.6)

### Findings from Schema Introspection

#### Duplicate / Redundant Columns

| Issue | Tables / Columns | Recommendation |
|---|---|---|
| `companies.full_name` and `companies.job_title` | These appear to be recruiter contact fields that were put on the company table incorrectly. The same fields exist on `recruiter_profiles` (`full_name`) | Move logic to `recruiter_profiles`. Drop from `companies` only after confirming no code reads them. |
| `jobs.company_name` | Redundant — `jobs.company_id` FK to `companies.company_name` is the canonical source | Never write to `jobs.company_name`; drop after confirming unused. |
| `candidates.source_file_url` vs `candidates.cv_file_url` | Two URL columns for the same CV | Audit which is populated. Keep one, migrate data, drop the other. |
| `stage1_results`, `stage2_results`, `stage3_results` all have `candidate_id`, `job_id` | These are redundant if `application_id` is always present and `applications` has both | Keep for query performance (denormalization is acceptable here). Add index on `application_id`. |

#### Missing Foreign Key Constraints

| Table | Column | Should FK to | Action |
|---|---|---|---|
| `application_actions` | `recruiter_id` | `recruiter_profiles(id)` | ADD FK |
| `offers` | `recruiter_id` | `recruiter_profiles(id)` | ADD FK |
| `notifications` | (check) | candidates | Verify FK exists |
| `recruiter_notifications` | (check columns) | recruiter_profiles | Verify FK exists |
| `interview_scores` | `job_id` | `jobs(job_id)` | FK exists per FK query ✓ |
| `assessments` | `application_id` | `applications(application_id)` | FK exists ✓ |

#### Tables That May Not Be Needed (never queried by UI)

| Table | Usage | Action |
|---|---|---|
| `assessment_questions` | Separate from `custom_assessment_questions` — may be legacy | Investigate; drop if unused |
| `assessments` | Separate from `custom_assessments` — may be legacy pipeline assessment table | Check if pipeline writes here; if not, drop |
| `career_pages` | No UI reads this | Keep for future feature; no action |
| `company_follows` | Candidate-facing; no recruiter UI reads | Keep for future; no action |
| `saved_jobs` | Candidate-facing; no recruiter UI reads | Keep for future; no action |
| `screening_answers` / `job_screening_questions` | No UI reads | Keep for future pipeline feature |
| `job_standardized_questions` | No UI reads | Keep for future; no action |
| `resume_parse_jobs` | Pipeline internal; no UI reads | Keep; no action |
| `users` | `candidates.user_id` FKs here, but recruiter auth uses `auth.users` directly | Investigate if this is a legacy table |
| `recruiter_notifications` | Separate from `notifications` — two notification tables | Consolidate or pick one |

#### Naming Inconsistencies

| Issue | Examples | Recommendation |
|---|---|---|
| PK naming not consistent | `companies.company_id`, `jobs.job_id`, `offers.id`, `email_templates.id`, `facial_analysis_results.id` | Prefer `{table_singular}_id` everywhere. Migrate `offers.id → offers.offer_id`, etc. This is a large breaking change — document but defer. |
| `companies.company_industry` vs `jobs.seniority_level` | Some columns have table-name prefix (company_industry) others don't | Prefer no prefix inside the table. Rename `company_industry → industry`, `company_location → location`, etc. Large migration — document, defer. |
| `interviews.duration_seconds` vs offers using jsonb | Inconsistent approach to storing domain data | Acceptable; keep as-is. |

### Migration SQLs

- [ ] **Step 1: Add missing FK constraints**

```sql
-- application_actions.recruiter_id → recruiter_profiles(id)
ALTER TABLE application_actions
  ADD CONSTRAINT fk_application_actions_recruiter
  FOREIGN KEY (recruiter_id) REFERENCES recruiter_profiles(id)
  ON DELETE SET NULL;

-- offers.recruiter_id → recruiter_profiles(id)
ALTER TABLE offers
  ADD CONSTRAINT fk_offers_recruiter
  FOREIGN KEY (recruiter_id) REFERENCES recruiter_profiles(id)
  ON DELETE SET NULL;
```

- [ ] **Step 2: Add performance indexes**

```sql
-- Frequently queried: applications by job
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);

-- Stage results lookups
CREATE INDEX IF NOT EXISTS idx_stage2_results_application_id ON stage2_results(application_id);
CREATE INDEX IF NOT EXISTS idx_stage3_results_application_id ON stage3_results(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_scores_interview_id ON interview_scores(interview_id);
CREATE INDEX IF NOT EXISTS idx_facial_analysis_results_interview_id ON facial_analysis_results(interview_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_company_id ON offers(company_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
```

- [ ] **Step 3: Drop redundant jobs.company_name**

Only after confirming the pipeline never writes to it and no UI reads it:

```sql
-- Confirm zero non-null values:
SELECT COUNT(*) FROM jobs WHERE company_name IS NOT NULL AND company_name != '';
-- If 0, then:
ALTER TABLE jobs DROP COLUMN IF EXISTS company_name;
```

- [ ] **Step 4: Investigate and clean candidate_experiences / candidate_projects**

```sql
-- Check what columns these tables have
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('candidate_experiences', 'candidate_projects')
ORDER BY table_name, ordinal_position;
```

Confirm the columns match what CandidateDetail.jsx renders (title, company, start_date, end_date, description for experiences; title, description, tech_stack for projects).

- [ ] **Step 5: Audit users table**

```sql
-- Check if users table has any rows and what it's for
SELECT COUNT(*), MAX(created_at) FROM users;
```

If 0 rows and only `candidates.user_id` references it (candidates who registered via the career portal), it can be kept but is low priority.

- [ ] **Step 6: Commit audit notes**

```bash
git add docs/plans/
git commit -m "docs: DB schema audit findings and migration SQLs"
```

**Expected result after Task 3:** All FK constraints are present. Key query paths have indexes. Redundant columns are documented with migration SQL ready to run. No data is lost.

---

## Cross-Task Dependency Notes

```
Task 1 (mock removal) → must run BEFORE Task 2 (DB connectivity)
Task 2A (auth fix)    → must run BEFORE all other Task 2 sub-tasks (company.id is null until fixed)
Task 2B (migrations)  → must run BEFORE 2C (Settings needs website/description columns)
Task 2B (migrations)  → must run BEFORE 2F (Interviews needs scheduled_at column)
Task 3               → independent; can run in parallel with Tasks 1 and 4
Task 4               → independent of Task 2; can run after Task 1
```

---

## Summary of What Each Agent Must Know

### For Task 1 Agent (Sonnet 4.6)

You are removing 3 `MOCK_*` constants from 3 page files and 2 constants from Settings.jsx. Each page file must still render (with empty states). Do not touch any DB queries or component structure. The exact lines to delete are listed in Task 1 above.

### For Task 2 Agent (Opus 4.6)

Start with Sub-task 2A immediately — fixing `auth.jsx` is a blocker for everything else. The root cause is that `prof.company_name` is read from `recruiter_profiles` which has no such column. Fix by joining `companies` in the Supabase select. Then run 2B (schema migrations) before 2C and 2F. Work through 2C → 2D → 2E → 2F → 2G → 2H → 2I in order.

### For Task 3 Agent (Sonnet 4.6)

Run the SQL queries listed to investigate tables before deleting anything. Add all indexes (Step 2) first — they are safe. Add FK constraints (Step 1) carefully — verify no orphan rows exist first with: `SELECT * FROM table WHERE column NOT IN (SELECT id FROM referenced_table)`. If orphans exist, SET NULL strategy is specified in the FK DDL.

### For Task 4 Agent (Sonnet 4.6)

The pipeline `/api/trigger-stage3` endpoint takes `{ job_id, top_percent }`. There is NO per-candidate endpoint. The correct fix is: verify `application.status === 'stage3_waiting'`, then POST to `/api/trigger-stage3` with `{ job_id: application.job_id, top_percent: 1.0 }`. This triggers all waiting candidates for that job (typically just this one). Add the `PromoteButton` component to `CandidateDetail.jsx` inside the `llm_evaluation` stage card, only when status is `stage3_waiting`.

---

## Environment Notes

- Supabase project ID: `vaewfynsxuormrztsfgi`
- Pipeline API base: `VITE_API_URL` env var (Railway URL)
- All Supabase calls use the anon key from `VITE_SUPABASE_ANON_KEY`
- RLS policies on Supabase tables must allow the anon/authenticated user to read/write. If queries return empty arrays with no error, check RLS policies first.
- No Tailwind — use only inline styles with CSS variables (`var(--bg-secondary)`, `var(--border)`, `var(--accent)`, `var(--text-primary)`, `var(--text-muted)`, `var(--text-secondary)`, `var(--success)`, `var(--danger)`, `var(--warning)`, `var(--info)`)
- `date-fns` is available for date formatting. Use `format(new Date(dateStr), 'MMM d, yyyy')`.
- `lucide-react` is available for icons. Import from `'lucide-react'`.

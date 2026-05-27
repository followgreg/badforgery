# BadForgery

> You have 10 seconds to look. 60 seconds to lie.

A daily memory-drawing game. Each day, everyone worldwide sees the same painting for 10 seconds, then draws it from memory in 60 seconds. Submissions land in a global gallery with anonymous star ratings.

**Live:** https://badforgery.com

---

## Tech Stack

- React + Vite
- React Router
- Supabase (Postgres)
- Tailwind CSS v4
- Canvas API (no drawing libraries)
- Art Institute of Chicago public API (no key required)
- GitHub Pages deployment

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/your-username/badforgery
cd badforgery
npm install
```

### 2. Environment variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Supabase schema

Run this SQL in the Supabase SQL editor:

```sql
create table submissions (
  id uuid primary key default gen_random_uuid(),
  day_key text not null,
  nickname text,
  drawing_data text not null,
  artwork_id text not null,
  created_at timestamp with time zone default now()
);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  stars int check (stars between 1 and 5),
  created_at timestamp with time zone default now()
);

create index on submissions(day_key);
create index on ratings(submission_id);

-- RLS
alter table submissions enable row level security;
alter table ratings enable row level security;

create policy "Anyone can read submissions" on submissions for select using (true);
create policy "Anyone can insert submissions" on submissions for insert with check (true);
create policy "Anyone can update their submission" on submissions for update using (true);

create policy "Anyone can read ratings" on ratings for select using (true);
create policy "Anyone can insert ratings" on ratings for insert with check (true);

-- Grants
grant select, insert, update on public.submissions to anon;
grant select, insert on public.ratings to anon;
```

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to GitHub Pages

```bash
npm run deploy
```

---

## How It Works

1. **Home** — Shows today's artwork title (image hidden). Archive strip of past 7 days.
2. **Study** — 10-second countdown with the full painting. Image fades to black at 0.
3. **Draw** — 60-second canvas session. 6 brush types, 5 sizes, 36-color palette + custom picker. Undo (15 steps), clear.
4. **Submit** — Side-by-side comparison. Enter a nickname. Posts to Supabase.
5. **Gallery** — Global grid of all forgeries. Sort by newest or top rated. Click to open and rate.
6. **Archive** — Past days at `/archive/YYYY-MM-DD`. Artwork fully visible, ratings open.

---

## localStorage Keys

| Key | Purpose |
|---|---|
| `artwork_YYYY-MM-DD` | Cached artwork data for the day |
| `submitted_YYYY-MM-DD` | Submission UUID if user submitted |
| `played_YYYY-MM-DD` | Flag: user completed the draw phase |
| `rated_{uuid}` | Flag: user rated a specific submission |

---

## Brush Types

| Brush | Behavior |
|---|---|
| Round | Standard circular brush, opacity 0.9 |
| Flat | Elliptical, direction-aware |
| Texture | Multiple offset strokes, rough edge |
| Spray | Random dot scatter in radius |
| Watercolor | Soft, very low opacity, builds up |
| Eraser | Clears to white |

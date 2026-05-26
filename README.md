# Expense Tracker


A full-stack personal finance app: log daily spending, split **fixed** costs from **variable** ones, set a monthly budget and income, and see everything on a warm, minimal dashboard. Built to learn **React**, **Node/Express**, and **PostgreSQL** 
---

### What you can do

- **Track expenses** — amount, date, description, and category tags  
- **Label each expense** — shared vs individual · fixed vs variable  
- **See the big picture** — monthly spending, remaining budget, savings (income − spending)  
- **Explore trends** — category donuts (overall, fixed, variable) and weekly spending with prev/next week  
- **Use it your way** — browser UI for daily use, or the terminal CLI (`npm run cli`)

### How the pieces fit together

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React frontend │ ──► │  Express API     │ ──► │  Supabase Postgres  │
│  localhost:5173 │     │  localhost:3000  │     │  (cloud database)   │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

You run the **API** and **frontend** locally while you develop. Your expenses, categories, budgets, and income live in **Supabase** — so they are still there tomorrow after `npm start`.

### Stack

| Layer | Technology | Role |
|-------|------------|------|
| **UI** | React + Vite | Dashboard, forms, charts |
| **API** | Node.js + Express | REST endpoints, business logic |
| **Data** | PostgreSQL (Supabase) | Persistent storage |
| **CLI** | Node + readline | Optional terminal menu |

### Design

Warm, calm UI inspired by a minimal finance dashboard: cream background (`#f0e7d5`), chocolate brown sidebar (`#4b3935`), soft cards and donut charts.

### Quick start

```bash
npm install && cp .env.example .env   # add Supabase DATABASE_URL
npm run migrate && npm start          # API → http://localhost:3000
cd frontend && npm install && npm run dev   # app → http://localhost:5173
```

---

## Database (Supabase + PostgreSQL)

All app data lives in **Supabase**, not in your browser or in Node memory.

| Stored in Supabase | What it is |
|------------------|------------|
| `expenses` | Each purchase (amount, date, category, fixed/variable, shared/individual) |
| `categories` | Tags like Food, Rent |
| `monthly_budgets` | Spending limit per month |
| `monthly_income` | Income and optional savings goal per month |



## Features

- **Add / edit / delete expenses** — amount, date, description, category  
- **Shared vs individual** and **fixed vs variable** costs  
- **Dashboard** — budget, income, savings, 3 donut charts, weekly spending with week navigation  
- **Categories**, **monthly budget**, **monthly income + savings goal**

### Formulas

| Metric | Formula |
|--------|---------|
| **Remaining budget** | Spending limit − total expenses |
| **Savings this month** | Monthly income − total expenses |

Budget is a **spending cap**, not your paycheck. Income is separate.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Start API (runs migrations first) |
| `npm run migrate` | Create / update database tables |
| `npm run cli` | Terminal menu (uses same Supabase data) |
| `cd frontend && npm run dev` | React dev server |

---

## Security

- **Never commit `.env`** — it contains your database password  
- **Never** put `DATABASE_URL` in the React frontend  
- Later (friend + phone app): add **login** (e.g. Supabase Auth) — same database, per-user rows  

---

## Project structure

```
db/schema.sql          — PostgreSQL table definitions
src/db/                — connection pool, migrations, row mappers
src/expenses.js        — expense CRUD
src/categories.js      — tags
src/budgets.js         — monthly spending limits
src/income.js          — income + savings goals
frontend/              — React app
.env                   — DATABASE_URL (you create this; not in git)
```

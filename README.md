# Expense Tracker

A personal **expense tracker** built to learn full-stack development. Track what you spend, organize it with tags, and mark costs as yours alone or shared with others.

---

## Overview

This project helps you **record and manage daily expenses** in one place. For each entry you can log the amount, when it happened, an optional note, a category tag (like Food or Transport), and whether the cost is **individual** (only you) or **shared** (split with roommates, friends, etc.).

| How | What it is |
|-----|------------|
| **Web app** | React UI with sidebar — overview, add/edit/delete, categories |
| **Terminal (CLI)** | Text menu — `npm run cli` |
| **HTTP API** | Express REST API — `npm start` |

Data is stored **in memory** for now (resets when the server stops). Database and login are planned next.

**Design:** cream `#f0e7d5` background, brown `#4b3935` sidebar (desktop reference UI).

---

## Features

- **Add expenses** — amount, date, description, category tag  
- **Edit & delete** — fix mistakes or remove entries  
- **Category tags** — pick existing or create new  
- **Shared vs individual** — label each expense  
- **Filter by tag** — on overview page and API  
- **Spending summary** — total spending, remaining budget, donut by category (API)
- **Income & savings (Option A)** — monthly income; savings = income − spending; optional savings goal with progress bar

### Formulas

| Metric | Formula |
|--------|---------|
| **Remaining budget** | Spending limit − total expenses |
| **Savings this month** | Monthly income − total expenses |
| **Savings goal %** | Savings ÷ goal × 100 (if goal set) |

Budget is a **spending cap**, not your paycheck. Income is separate.


# Expense Tracker

A personal **expense tracker** built to learn full-stack development. Track what you spend, organize it with tags, and mark costs as yours alone or shared with others.

---

## Overview

This project helps you **record and manage daily expenses** in one place. For each entry you can log the amount, when it happened, an optional note, a category tag (like Food or Transport), and whether the cost is **individual** (only you) or **shared** (split with roommates, friends, etc.).

You can use it in two ways today:

| How | What it is |
|-----|------------|
| **Terminal (CLI)** | A text menu to add, edit, delete, and list expenses — great while learning Node.js |
| **HTTP API** | A REST backend ready for a web or mobile frontend later |

Data is stored **in memory** for now (it resets when the server or CLI stops). A database and user login are planned next.

---

## Features

- **Add expenses** — amount, date, description, category tag  
- **Edit & delete** — fix mistakes or remove entries  
- **Category tags** — pick an existing tag or create a new one when adding an expense  
- **Shared vs individual** — label each expense for personal spending or shared costs  
- **Filter by tag** — list expenses for one category via the API  

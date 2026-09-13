# 🚀 Nova — Waitlist & Early-Access Management Tool
> **BSc Computer Science Final / Semester Project**  
> **Domain:** Startup & Growth Tech / Full-Stack Web Application  
> **Tech Stack:** React.js, Node.js, Express.js, PostgreSQL (with Zero-Config Local Storage Fallback), REST API, JWT Authentication.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Architecture & Workflow](#-architecture--workflow)
4. [Technology Stack](#-technology-stack)
5. [Quick Start Guide](#-quick-start-guide)
6. [Database Schema & PostgreSQL Setup](#-database-schema--postgresql-setup)
7. [REST API Endpoints](#-rest-api-endpoints)
8. [Referral Ranking Algorithm](#-referral-ranking-algorithm)

---

## 🎯 Project Overview
Startups launching a new product face a critical challenge: managing high initial demand while scaling their infrastructure smoothly. A referral-driven waitlist solves this by:
1. **Controlling Rollout Capacity:** Releasing access in managed cohorts (waves).
2. **Organic Viral Growth:** Incentivizing early adopters to refer friends in exchange for jumping ahead in the queue.
3. **Data Insights:** Giving startup founders real-time metrics on viral coefficients and demand.

This application provides a **public early-access waitlist portal** with personalized referral tracking and an **administrative control console** to manage users, release access in batches, and monitor growth metrics.

---

## ✨ Key Features

### 👤 User Workflow & Public Portal
* **Live Waitlist Counter:** Real-time indicator displaying total signups.
* **Instant Signup & Validation:** Validates full name and email; prevents duplicate entries.
* **Unique Referral Code & Link:** Automatically creates a unique code (e.g. `ALEX-4F2A`) and shareable link (`http://localhost:5173/?ref=ALEX-4F2A`).
* **Dynamic Waitlist Rank:** Real-time position calculation based on referral count and signup timestamp.
* **One-Click Social Sharing:** Share buttons for Twitter/X, WhatsApp, LinkedIn, and Email.
* **Gamification & Reward Tiers:** Visual badges and milestone trackers (Bronze Pioneer ➔ Silver Explorer ➔ Gold Advocate ➔ Diamond VIP).
* **Self-Service Status Lookup:** Existing users can enter their email anytime to check their rank and retrieve their invite link.

### 🛡️ Admin Management Console
* **Secure Authentication:** Protected with JSON Web Tokens (JWT) and hashed passwords (bcrypt).
* **Real-Time Analytics Dashboard:**
  * Total waitlist signups
  * Total referrals generated
  * Users granted access vs. waiting
  * Viral referral conversion rate (%)
  * Top community advocates leaderboard
* **Batch Access Release Engine:**
  * Release access to the next **Top N** users with a single click.
  * Or select specific users via checkboxes to grant access.
* **Individual Status Management:** Toggle user statuses (`waitlisted`, `granted`, `revoked`).
* **Waitlist Directory Tools:** Live search (by name, email, or referral code), status filters, and multi-field sorting.
* **CSV Data Export:** One-click download of the complete waitlist for external CRM or spreadsheet analysis.
* **Email Outbox & Activity Viewer:** Built-in viewer to inspect sent and simulated transactional emails (Welcome & Access Granted).

---

## 🏗️ Architecture & Workflow

```
[ User Browser ]  <-------- React.js / Vite (Port 5173) -------->
                                    │
                               REST API Calls
                                    │
[ Express Server ] <------ Node.js Backend (Port 5000) --------->
     │                              │
     ├── Authentication (JWT)       ├── Transactional Emails (Nodemailer / Simulated Outbox)
     └── Data Repository Layer ─────┤
                                    ├── Production: PostgreSQL (`schema.sql`)
                                    └── Fallback: Local JSON Storage (`server/data/waitlist.json`)
```

### The Dual-Engine Database Architecture (Zero-Config College Demo)
To ensure seamless evaluation during college presentations without requiring PostgreSQL installation on examiner PCs:
* **PostgreSQL Engine:** Runs when `USE_POSTGRES=true` and PostgreSQL server is active.
* **Local Storage Fallback:** If PostgreSQL is not installed or unreachable, the system automatically falls back to an embedded JSON storage engine (`server/data/waitlist.json`).
* **Result:** Zero setup errors. It works out-of-the-box on any computer.

---

## 💻 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React.js (v18) + Vite | Modern, component-based, lightning-fast HMR and reactive UI state |
| **Backend** | Node.js + Express.js | Lightweight, event-driven RESTful API framework |
| **Database** | PostgreSQL + Local JSON Store | Relational SQL schema with robust local fallback for presentations |
| **Security** | JWT + bcryptjs | Industry-standard token authentication and password hashing |
| **Styling** | Vanilla CSS3 (Custom Design System) | Glassmorphism aesthetics, responsive grid, zero heavy UI framework overhead |
| **Icons** | Lucide React | Clean, modern feather-style iconography |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* npm (comes bundled with Node.js)

### 2. Install Dependencies
Run the following in the project root directory:
```bash
# Install root, backend, and frontend packages in one command
npm run install:all
```

### 3. Populate Demo Data (Crucial for Presentations!)
Seed 15 realistic waitlist members with ranks and referral counts:
```bash
npm run seed
```

### 4. Start the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```

* **Frontend Public Waitlist:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:5000](http://localhost:5000)
* **Admin Portal Login:** [http://localhost:5173](http://localhost:5173) (Click "Admin Portal" top-right)
  * **Default Username:** `admin`
  * **Default Password:** `admin123`

---

## 🗄️ Database Schema & PostgreSQL Setup

If you wish to demonstrate PostgreSQL to your professor:

1. Create a database named `waitlist_db` in PostgreSQL:
   ```sql
   CREATE DATABASE waitlist_db;
   ```
2. Run the provided schema script located at `server/db/schema.sql`:
   ```bash
   psql -U postgres -d waitlist_db -f server/db/schema.sql
   ```
3. Update `.env`:
   ```env
   USE_POSTGRES=true
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/waitlist_db
   ```
4. Restart the server (`npm run dev`).

### Database Tables:
* **`waitlist_users`**: Stores user ID, name, email, referral code, referred-by code, referral count, access status (`waitlisted`/`granted`/`revoked`), and timestamps.
* **`referrals`**: Records individual referral links between referrers and new signups.
* **`admin_users`**: Stores admin username and bcrypt password hash.
* **`email_logs`**: Logs all welcome and access invitation emails with HTML content.

---

## 📡 REST API Endpoints

### Public Endpoints:
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/waitlist/join` | Register on waitlist; accepts `{ name, email, ref }` |
| `GET` | `/api/waitlist/status` | Look up status by query: `?email=...` or `?code=...` |
| `GET` | `/api/waitlist/public-stats` | Get total waitlist count and top 5 leaderboard preview |
| `GET` | `/api/health` | Backend server health check and active DB engine status |

### Admin Endpoints (Require Bearer Token):
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Authenticate admin; returns JWT token |
| `GET` | `/api/admin/stats` | Dashboard metrics: total signups, referrals, viral rate |
| `GET` | `/api/admin/users` | List users with search (`?search=`), filter (`?status=`), and sorting |
| `PATCH` | `/api/admin/users/:id/status` | Update access status (`waitlisted`, `granted`, `revoked`) |
| `POST` | `/api/admin/users/batch-grant` | Batch release access to top N or selected user IDs |
| `DELETE` | `/api/admin/users/:id` | Remove user from waitlist |
| `GET` | `/api/admin/export/csv` | Download complete waitlist as CSV |
| `GET` | `/api/admin/emails` | Retrieve activity log of all dispatched emails |

---

## 🧮 Referral Ranking Algorithm

The waitlist rank represents the user's position in line.
* **Primary Key:** `referral_count DESC` (Users who bring more signups jump to the front).
* **Secondary Key (Tie Breaker):** `created_at ASC` (First-In, First-Out principle for users with the same referral count).

### PostgreSQL Query:
```sql
SELECT 
  u.*,
  ROW_NUMBER() OVER (ORDER BY u.referral_count DESC, u.created_at ASC) as rank
FROM waitlist_users u;
```

---

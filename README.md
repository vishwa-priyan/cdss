# Agentic AI-Powered Clinical Decision Support System (CDSS)

Production-ready CDSS dashboard for doctors: multi-agent AI framework (symptom analysis, RAG knowledge retrieval, disease prediction, explainability) with structured medical guidelines and explainable outputs.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MySQL
- **Auth:** JWT, Role-Based Access Control (Admin, Doctor, Nurse)
- **File upload:** Multer

## Setup

1. **Clone and install**
   ```bash
   npm run install:all
   ```

2. **Database**
   - Create MySQL database: `CREATE DATABASE cdss;`
   - Copy `.env.example` to `.env` and set `DB_*` and `JWT_SECRET`.
   - Run schema: `mysql -u root -p cdss < server/db/schema.sql`
   - On first server start, an admin user is seeded: **admin@cdss.local** / **admin123**

3. **Run**
   - Dev (both client and server): `npm run dev`
   - Or: `npm run server` (port 5000) and `npm run client` (Vite dev server)

## Default Roles

- **Admin:** Manage users and system settings
- **Doctor:** Add patients, run AI diagnosis, add notes
- **Nurse:** Add vitals and patient data (no delete, no AI)

## Project Structure

- `client/` – React (Vite) frontend
- `server/` – Express API, MySQL, JWT, Multer

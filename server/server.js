import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { seedAdmin } from './db/seed.js';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import encounterRoutes from './routes/encounters.js';
import dashboardRoutes from './routes/dashboard.js';
import reportsRoutes from './routes/reports.js';
import alertsRoutes from './routes/alerts.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';
import labReportsRoutes from './routes/labReports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (read-only)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/encounters', encounterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/lab-reports', labReportsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(env.port, async () => {
  try {
    await seedAdmin();
  } catch (e) {
    console.warn('Seed skipped:', e.message);
  }
  console.log(`CDSS server running on http://localhost:${env.port}`);
});

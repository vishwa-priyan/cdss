-- CDSS Database Schema (MySQL)
-- Run: mysql -u root -p cdss < server/db/schema.sql

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS doctor_notes;
DROP TABLE IF EXISTS ai_results;
DROP TABLE IF EXISTS lab_reports;
DROP TABLE IF EXISTS symptoms;
DROP TABLE IF EXISTS vitals;
DROP TABLE IF EXISTS encounters;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'nurse') NOT NULL DEFAULT 'nurse',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT,
  gender VARCHAR(50),
  contact VARCHAR(255),
  chief_complaint TEXT,
  past_medical_history TEXT,
  current_medications TEXT,
  allergies TEXT,
  risk_level ENUM('low', 'medium', 'high') DEFAULT 'low',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_risk_level (risk_level),
  INDEX idx_created_at (created_at)
);

CREATE TABLE encounters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  visit_date DATE NOT NULL,
  chief_complaint TEXT,
  doctor_notes TEXT,
  follow_up_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient_id (patient_id),
  INDEX idx_visit_date (visit_date),
  INDEX idx_created_by (created_by)
);

CREATE TABLE vitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  encounter_id INT NOT NULL,
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  blood_sugar DECIMAL(8,2),
  heart_rate INT,
  temperature DECIMAL(4,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
  INDEX idx_encounter_id (encounter_id)
);

CREATE TABLE symptoms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  encounter_id INT NOT NULL,
  symptom_text TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
  INDEX idx_encounter_id (encounter_id)
);

CREATE TABLE lab_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  encounter_id INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
  INDEX idx_encounter_id (encounter_id)
);

CREATE TABLE ai_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  encounter_id INT NOT NULL,
  result_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
  UNIQUE KEY unique_encounter_ai (encounter_id),
  INDEX idx_encounter_id (encounter_id)
);

CREATE TABLE doctor_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  encounter_id INT NOT NULL,
  note_text TEXT NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_encounter_id (encounter_id)
);

-- Run server/db/seed.js to create default admin (admin@cdss.local / admin123)

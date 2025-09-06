const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './database/timetable.db';

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Ensure database directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
    });

    // Create tables
    const createTables = `
      -- Users table for authentication
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        department TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Departments table
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        head_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (head_id) REFERENCES users(id)
      );

      -- Classrooms table
      CREATE TABLE IF NOT EXISTS classrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'classroom',
        equipment TEXT,
        department_id INTEGER,
        is_available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );

      -- Faculty table
      CREATE TABLE IF NOT EXISTS faculty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        employee_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department_id INTEGER NOT NULL,
        max_hours_per_day INTEGER DEFAULT 6,
        max_hours_per_week INTEGER DEFAULT 30,
        avg_leaves_per_month INTEGER DEFAULT 2,
        specializations TEXT,
        is_available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );

      -- Subjects table
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        department_id INTEGER NOT NULL,
        semester INTEGER NOT NULL,
        credits INTEGER NOT NULL,
        hours_per_week INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'theory',
        requires_lab BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );

      -- Student batches table
      CREATE TABLE IF NOT EXISTS student_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        semester INTEGER NOT NULL,
        student_count INTEGER NOT NULL,
        academic_year TEXT NOT NULL,
        shift TEXT DEFAULT 'morning',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );

      -- Faculty-Subject mapping
      CREATE TABLE IF NOT EXISTS faculty_subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        preference_level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (faculty_id) REFERENCES faculty(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        UNIQUE(faculty_id, subject_id)
      );

      -- Timetables table
      CREATE TABLE IF NOT EXISTS timetables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        semester INTEGER NOT NULL,
        academic_year TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        created_by INTEGER NOT NULL,
        approved_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME,
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      );

      -- Timetable slots table
      CREATE TABLE IF NOT EXISTS timetable_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timetable_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        subject_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        classroom_id INTEGER NOT NULL,
        batch_id INTEGER NOT NULL,
        is_fixed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (timetable_id) REFERENCES timetables(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (faculty_id) REFERENCES faculty(id),
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
        FOREIGN KEY (batch_id) REFERENCES student_batches(id)
      );

      -- Fixed slots table (for special classes)
      CREATE TABLE IF NOT EXISTS fixed_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        subject_id INTEGER,
        faculty_id INTEGER,
        classroom_id INTEGER,
        batch_id INTEGER,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (faculty_id) REFERENCES faculty(id),
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
        FOREIGN KEY (batch_id) REFERENCES student_batches(id)
      );

      -- Optimization parameters table
      CREATE TABLE IF NOT EXISTS optimization_params (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL,
        max_classes_per_day INTEGER DEFAULT 6,
        min_break_duration INTEGER DEFAULT 15,
        start_time TEXT DEFAULT '09:00',
        end_time TEXT DEFAULT '17:00',
        lunch_break_start TEXT DEFAULT '13:00',
        lunch_break_end TEXT DEFAULT '14:00',
        working_days INTEGER DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );
    `;

    db.exec(createTables, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Insert default admin user if not exists
      const defaultAdmin = `
        INSERT OR IGNORE INTO users (username, email, password_hash, role) 
        VALUES ('admin', 'admin@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
      `;
      
      db.run(defaultAdmin, (err) => {
        if (err) {
          console.error('Error creating default admin:', err);
        } else {
          console.log('Database initialized successfully');
        }
        db.close();
        resolve();
      });
    });
  });
}

function getDatabase() {
  return new sqlite3.Database(DB_PATH);
}

module.exports = {
  initializeDatabase,
  getDatabase
};

const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Departments CRUD
router.get('/departments', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.all(`
    SELECT d.*, u.username as head_name 
    FROM departments d 
    LEFT JOIN users u ON d.head_id = u.id 
    ORDER BY d.name
  `, (err, departments) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    db.close();
    res.json(departments);
  });
});

router.post('/departments', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { name, code, head_id } = req.body;
  
  if (!name || !code) {
    return res.status(400).json({ message: 'Name and code are required' });
  }
  
  const db = getDatabase();
  
  db.run('INSERT INTO departments (name, code, head_id) VALUES (?, ?, ?)', 
    [name, code, head_id || null], function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error creating department' });
    }
    
    db.close();
    res.status(201).json({ 
      message: 'Department created successfully',
      id: this.lastID 
    });
  });
});

// Classrooms CRUD
router.get('/classrooms', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.all(`
    SELECT c.*, d.name as department_name 
    FROM classrooms c 
    LEFT JOIN departments d ON c.department_id = d.id 
    ORDER BY c.name
  `, (err, classrooms) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    db.close();
    res.json(classrooms);
  });
});

router.post('/classrooms', authenticateToken, (req, res) => {
  const { name, capacity, type, equipment, department_id } = req.body;
  
  if (!name || !capacity) {
    return res.status(400).json({ message: 'Name and capacity are required' });
  }
  
  const db = getDatabase();
  
  db.run(`INSERT INTO classrooms (name, capacity, type, equipment, department_id) 
          VALUES (?, ?, ?, ?, ?)`, 
    [name, capacity, type || 'classroom', equipment, department_id], function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error creating classroom' });
    }
    
    db.close();
    res.status(201).json({ 
      message: 'Classroom created successfully',
      id: this.lastID 
    });
  });
});

// Faculty CRUD
router.get('/faculty', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.all(`
    SELECT f.*, d.name as department_name 
    FROM faculty f 
    LEFT JOIN departments d ON f.department_id = d.id 
    ORDER BY f.name
  `, (err, faculty) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    db.close();
    res.json(faculty);
  });
});

router.post('/faculty', authenticateToken, (req, res) => {
  const { 
    name, employee_id, email, department_id, max_hours_per_day, 
    max_hours_per_week, avg_leaves_per_month, specializations 
  } = req.body;
  
  if (!name || !employee_id || !email || !department_id) {
    return res.status(400).json({ 
      message: 'Name, employee ID, email, and department are required' 
    });
  }
  
  const db = getDatabase();
  
  db.run(`INSERT INTO faculty (name, employee_id, email, department_id, 
          max_hours_per_day, max_hours_per_week, avg_leaves_per_month, specializations) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [name, employee_id, email, department_id, max_hours_per_day || 6, 
     max_hours_per_week || 30, avg_leaves_per_month || 2, specializations], 
    function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error creating faculty record' });
    }
    
    db.close();
    res.status(201).json({ 
      message: 'Faculty created successfully',
      id: this.lastID 
    });
  });
});

// Subjects CRUD
router.get('/subjects', authenticateToken, (req, res) => {
  const { department_id, semester } = req.query;
  const db = getDatabase();
  
  let query = `
    SELECT s.*, d.name as department_name 
    FROM subjects s 
    LEFT JOIN departments d ON s.department_id = d.id
  `;
  let params = [];
  
  if (department_id || semester) {
    query += ' WHERE ';
    const conditions = [];
    
    if (department_id) {
      conditions.push('s.department_id = ?');
      params.push(department_id);
    }
    
    if (semester) {
      conditions.push('s.semester = ?');
      params.push(semester);
    }
    
    query += conditions.join(' AND ');
  }
  
  query += ' ORDER BY s.name';
  
  db.all(query, params, (err, subjects) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    db.close();
    res.json(subjects);
  });
});

router.post('/subjects', authenticateToken, (req, res) => {
  const { 
    name, code, department_id, semester, credits, 
    hours_per_week, type, requires_lab 
  } = req.body;
  
  if (!name || !code || !department_id || !semester || !credits || !hours_per_week) {
    return res.status(400).json({ 
      message: 'Name, code, department, semester, credits, and hours per week are required' 
    });
  }
  
  const db = getDatabase();
  
  db.run(`INSERT INTO subjects (name, code, department_id, semester, credits, 
          hours_per_week, type, requires_lab) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [name, code, department_id, semester, credits, hours_per_week, 
     type || 'theory', requires_lab || 0], 
    function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error creating subject' });
    }
    
    db.close();
    res.status(201).json({ 
      message: 'Subject created successfully',
      id: this.lastID 
    });
  });
});

// Student Batches CRUD
router.get('/batches', authenticateToken, (req, res) => {
  const { department_id, semester } = req.query;
  const db = getDatabase();
  
  let query = `
    SELECT sb.*, d.name as department_name 
    FROM student_batches sb 
    LEFT JOIN departments d ON sb.department_id = d.id
  `;
  let params = [];
  
  if (department_id || semester) {
    query += ' WHERE ';
    const conditions = [];
    
    if (department_id) {
      conditions.push('sb.department_id = ?');
      params.push(department_id);
    }
    
    if (semester) {
      conditions.push('sb.semester = ?');
      params.push(semester);
    }
    
    query += conditions.join(' AND ');
  }
  
  query += ' ORDER BY sb.name';
  
  db.all(query, params, (err, batches) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    db.close();
    res.json(batches);
  });
});

router.post('/batches', authenticateToken, (req, res) => {
  const { 
    name, department_id, semester, student_count, 
    academic_year, shift 
  } = req.body;
  
  if (!name || !department_id || !semester || !student_count || !academic_year) {
    return res.status(400).json({ 
      message: 'Name, department, semester, student count, and academic year are required' 
    });
  }
  
  const db = getDatabase();
  
  db.run(`INSERT INTO student_batches (name, department_id, semester, student_count, 
          academic_year, shift) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
    [name, department_id, semester, student_count, academic_year, shift || 'morning'], 
    function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error creating batch' });
    }
    
    db.close();
    res.status(201).json({ 
      message: 'Batch created successfully',
      id: this.lastID 
    });
  });
});

// Faculty-Subject mapping
router.post('/faculty-subjects', authenticateToken, (req, res) => {
  const { faculty_id, subject_id, preference_level } = req.body;
  
  if (!faculty_id || !subject_id) {
    return res.status(400).json({ message: 'Faculty ID and Subject ID are required' });
  }
  
  const db = getDatabase();
  
  db.run(`INSERT OR REPLACE INTO faculty_subjects (faculty_id, subject_id, preference_level) 
          VALUES (?, ?, ?)`, 
    [faculty_id, subject_id, preference_level || 1], 
    function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error creating faculty-subject mapping' });
    }
    
    db.close();
    res.status(201).json({ 
      message: 'Faculty-subject mapping created successfully',
      id: this.lastID 
    });
  });
});

router.get('/faculty-subjects/:faculty_id', authenticateToken, (req, res) => {
  const { faculty_id } = req.params;
  const db = getDatabase();
  
  db.all(`
    SELECT fs.*, s.name as subject_name, s.code as subject_code 
    FROM faculty_subjects fs 
    JOIN subjects s ON fs.subject_id = s.id 
    WHERE fs.faculty_id = ?
  `, [faculty_id], (err, mappings) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    db.close();
    res.json(mappings);
  });
});

// Optimization parameters
router.get('/optimization-params/:department_id', authenticateToken, (req, res) => {
  const { department_id } = req.params;
  const db = getDatabase();
  
  db.get('SELECT * FROM optimization_params WHERE department_id = ?', 
    [department_id], (err, params) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (!params) {
      // Return default parameters
      db.close();
      return res.json({
        department_id: parseInt(department_id),
        max_classes_per_day: 6,
        min_break_duration: 15,
        start_time: '09:00',
        end_time: '17:00',
        lunch_break_start: '13:00',
        lunch_break_end: '14:00',
        working_days: 5
      });
    }
    
    db.close();
    res.json(params);
  });
});

router.post('/optimization-params', authenticateToken, (req, res) => {
  const { 
    department_id, max_classes_per_day, min_break_duration, 
    start_time, end_time, lunch_break_start, lunch_break_end, working_days 
  } = req.body;
  
  if (!department_id) {
    return res.status(400).json({ message: 'Department ID is required' });
  }
  
  const db = getDatabase();
  
  db.run(`INSERT OR REPLACE INTO optimization_params 
          (department_id, max_classes_per_day, min_break_duration, start_time, 
           end_time, lunch_break_start, lunch_break_end, working_days, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, 
    [department_id, max_classes_per_day || 6, min_break_duration || 15, 
     start_time || '09:00', end_time || '17:00', lunch_break_start || '13:00', 
     lunch_break_end || '14:00', working_days || 5], 
    function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error saving optimization parameters' });
    }
    
    db.close();
    res.json({ message: 'Optimization parameters saved successfully' });
  });
});

module.exports = router;

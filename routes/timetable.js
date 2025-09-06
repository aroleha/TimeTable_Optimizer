const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { generateOptimizedTimetable } = require('../utils/optimizer');

const router = express.Router();

// Get all timetables
router.get('/', authenticateToken, (req, res) => {
  const { department_id, status } = req.query;
  const db = getDatabase();
  
  let query = `
    SELECT t.*, d.name as department_name, 
           u1.username as created_by_name, u2.username as approved_by_name
    FROM timetables t
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.approved_by = u2.id
  `;
  let params = [];
  
  if (department_id || status) {
    query += ' WHERE ';
    const conditions = [];
    
    if (department_id) {
      conditions.push('t.department_id = ?');
      params.push(department_id);
    }
    
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    
    query += conditions.join(' AND ');
  }
  
  query += ' ORDER BY t.created_at DESC';
  
  db.all(query, params, (err, timetables) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    db.close();
    res.json(timetables);
  });
});

// Get specific timetable with slots
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  // Get timetable details
  db.get(`
    SELECT t.*, d.name as department_name, 
           u1.username as created_by_name, u2.username as approved_by_name
    FROM timetables t
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.approved_by = u2.id
    WHERE t.id = ?
  `, [id], (err, timetable) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (!timetable) {
      db.close();
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Get timetable slots
    db.all(`
      SELECT ts.*, s.name as subject_name, s.code as subject_code,
             f.name as faculty_name, c.name as classroom_name,
             sb.name as batch_name
      FROM timetable_slots ts
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN faculty f ON ts.faculty_id = f.id
      LEFT JOIN classrooms c ON ts.classroom_id = c.id
      LEFT JOIN student_batches sb ON ts.batch_id = sb.id
      WHERE ts.timetable_id = ?
      ORDER BY ts.day_of_week, ts.start_time
    `, [id], (err, slots) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      db.close();
      res.json({
        ...timetable,
        slots: slots
      });
    });
  });
});

// Generate new optimized timetable
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { 
      name, department_id, semester, academic_year, 
      optimization_options = {} 
    } = req.body;
    
    if (!name || !department_id || !semester || !academic_year) {
      return res.status(400).json({ 
        message: 'Name, department, semester, and academic year are required' 
      });
    }
    
    const db = getDatabase();
    
    // Create new timetable record
    db.run(`
      INSERT INTO timetables (name, department_id, semester, academic_year, created_by) 
      VALUES (?, ?, ?, ?, ?)
    `, [name, department_id, semester, academic_year, req.user.userId], 
    async function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Error creating timetable' });
      }
      
      const timetableId = this.lastID;
      
      try {
        // Generate optimized timetable
        const optimizedSlots = await generateOptimizedTimetable({
          timetableId,
          departmentId: department_id,
          semester,
          academicYear: academic_year,
          options: optimization_options
        });
        
        // Insert generated slots
        const stmt = db.prepare(`
          INSERT INTO timetable_slots 
          (timetable_id, day_of_week, start_time, end_time, subject_id, 
           faculty_id, classroom_id, batch_id, is_fixed) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const slot of optimizedSlots) {
          stmt.run([
            timetableId, slot.day_of_week, slot.start_time, slot.end_time,
            slot.subject_id, slot.faculty_id, slot.classroom_id, 
            slot.batch_id, slot.is_fixed || 0
          ]);
        }
        
        stmt.finalize();
        db.close();
        
        res.status(201).json({
          message: 'Timetable generated successfully',
          timetableId: timetableId,
          slotsGenerated: optimizedSlots.length
        });
        
      } catch (optimizationError) {
        // If optimization fails, delete the timetable record
        db.run('DELETE FROM timetables WHERE id = ?', [timetableId]);
        db.close();
        
        res.status(500).json({ 
          message: 'Error generating optimized timetable',
          error: optimizationError.message 
        });
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate multiple timetable options
router.post('/generate-options', authenticateToken, async (req, res) => {
  try {
    const { 
      department_id, semester, academic_year, 
      num_options = 3, optimization_options = {} 
    } = req.body;
    
    if (!department_id || !semester || !academic_year) {
      return res.status(400).json({ 
        message: 'Department, semester, and academic year are required' 
      });
    }
    
    const options = [];
    
    for (let i = 0; i < num_options; i++) {
      try {
        const optimizedSlots = await generateOptimizedTimetable({
          departmentId: department_id,
          semester,
          academicYear: academic_year,
          options: { ...optimization_options, variation: i }
        });
        
        options.push({
          option: i + 1,
          slots: optimizedSlots,
          score: calculateTimetableScore(optimizedSlots)
        });
        
      } catch (error) {
        console.error(`Error generating option ${i + 1}:`, error);
      }
    }
    
    if (options.length === 0) {
      return res.status(500).json({ 
        message: 'Unable to generate any timetable options' 
      });
    }
    
    // Sort options by score (higher is better)
    options.sort((a, b) => b.score - a.score);
    
    res.json({
      message: `Generated ${options.length} timetable options`,
      options: options
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save selected timetable option
router.post('/save-option', authenticateToken, async (req, res) => {
  try {
    const { 
      name, department_id, semester, academic_year, 
      selected_option 
    } = req.body;
    
    if (!name || !department_id || !semester || !academic_year || !selected_option) {
      return res.status(400).json({ 
        message: 'All fields including selected option are required' 
      });
    }
    
    const db = getDatabase();
    
    // Create new timetable record
    db.run(`
      INSERT INTO timetables (name, department_id, semester, academic_year, created_by) 
      VALUES (?, ?, ?, ?, ?)
    `, [name, department_id, semester, academic_year, req.user.userId], 
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Error creating timetable' });
      }
      
      const timetableId = this.lastID;
      
      // Insert selected slots
      const stmt = db.prepare(`
        INSERT INTO timetable_slots 
        (timetable_id, day_of_week, start_time, end_time, subject_id, 
         faculty_id, classroom_id, batch_id, is_fixed) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const slot of selected_option.slots) {
        stmt.run([
          timetableId, slot.day_of_week, slot.start_time, slot.end_time,
          slot.subject_id, slot.faculty_id, slot.classroom_id, 
          slot.batch_id, slot.is_fixed || 0
        ]);
      }
      
      stmt.finalize();
      db.close();
      
      res.status(201).json({
        message: 'Timetable saved successfully',
        timetableId: timetableId
      });
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update timetable status
router.put('/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['draft', 'pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  const db = getDatabase();
  
  let query = 'UPDATE timetables SET status = ?, updated_at = CURRENT_TIMESTAMP';
  let params = [status];
  
  // If approving, set approved_by and approved_at
  if (status === 'approved') {
    query += ', approved_by = ?, approved_at = CURRENT_TIMESTAMP';
    params.push(req.user.userId);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error updating timetable status' });
    }
    
    if (this.changes === 0) {
      db.close();
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    db.close();
    res.json({ message: 'Timetable status updated successfully' });
  });
});

// Delete timetable
router.delete('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  // Delete slots first (foreign key constraint)
  db.run('DELETE FROM timetable_slots WHERE timetable_id = ?', [id], (err) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error deleting timetable slots' });
    }
    
    // Delete timetable
    db.run('DELETE FROM timetables WHERE id = ?', [id], function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Error deleting timetable' });
      }
      
      if (this.changes === 0) {
        db.close();
        return res.status(404).json({ message: 'Timetable not found' });
      }
      
      db.close();
      res.json({ message: 'Timetable deleted successfully' });
    });
  });
});

// Get timetable conflicts
router.get('/:id/conflicts', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  // Check for various types of conflicts
  const conflictQueries = [
    // Faculty double booking
    `SELECT 'faculty_conflict' as type, ts1.id as slot1_id, ts2.id as slot2_id,
            f.name as faculty_name, ts1.day_of_week, ts1.start_time, ts1.end_time
     FROM timetable_slots ts1
     JOIN timetable_slots ts2 ON ts1.faculty_id = ts2.faculty_id 
       AND ts1.day_of_week = ts2.day_of_week
       AND ts1.id != ts2.id
       AND ts1.timetable_id = ?
       AND ts2.timetable_id = ?
       AND ((ts1.start_time < ts2.end_time AND ts1.end_time > ts2.start_time))
     JOIN faculty f ON ts1.faculty_id = f.id`,
    
    // Classroom double booking
    `SELECT 'classroom_conflict' as type, ts1.id as slot1_id, ts2.id as slot2_id,
            c.name as classroom_name, ts1.day_of_week, ts1.start_time, ts1.end_time
     FROM timetable_slots ts1
     JOIN timetable_slots ts2 ON ts1.classroom_id = ts2.classroom_id 
       AND ts1.day_of_week = ts2.day_of_week
       AND ts1.id != ts2.id
       AND ts1.timetable_id = ?
       AND ts2.timetable_id = ?
       AND ((ts1.start_time < ts2.end_time AND ts1.end_time > ts2.start_time))
     JOIN classrooms c ON ts1.classroom_id = c.id`,
    
    // Batch double booking
    `SELECT 'batch_conflict' as type, ts1.id as slot1_id, ts2.id as slot2_id,
            sb.name as batch_name, ts1.day_of_week, ts1.start_time, ts1.end_time
     FROM timetable_slots ts1
     JOIN timetable_slots ts2 ON ts1.batch_id = ts2.batch_id 
       AND ts1.day_of_week = ts2.day_of_week
       AND ts1.id != ts2.id
       AND ts1.timetable_id = ?
       AND ts2.timetable_id = ?
       AND ((ts1.start_time < ts2.end_time AND ts1.end_time > ts2.start_time))
     JOIN student_batches sb ON ts1.batch_id = sb.id`
  ];
  
  const allConflicts = [];
  let completedQueries = 0;
  
  conflictQueries.forEach(query => {
    db.all(query, [id, id], (err, conflicts) => {
      if (!err && conflicts.length > 0) {
        allConflicts.push(...conflicts);
      }
      
      completedQueries++;
      if (completedQueries === conflictQueries.length) {
        db.close();
        res.json({
          conflicts: allConflicts,
          hasConflicts: allConflicts.length > 0
        });
      }
    });
  });
});

// Helper function to calculate timetable score
function calculateTimetableScore(slots) {
  let score = 100;
  
  // Deduct points for various issues
  const facultyHours = {};
  const classroomUtilization = {};
  
  slots.forEach(slot => {
    // Track faculty hours
    if (!facultyHours[slot.faculty_id]) {
      facultyHours[slot.faculty_id] = 0;
    }
    facultyHours[slot.faculty_id] += 1;
    
    // Track classroom utilization
    if (!classroomUtilization[slot.classroom_id]) {
      classroomUtilization[slot.classroom_id] = 0;
    }
    classroomUtilization[slot.classroom_id] += 1;
  });
  
  // Penalize uneven faculty workload
  const facultyHourValues = Object.values(facultyHours);
  if (facultyHourValues.length > 0) {
    const avgHours = facultyHourValues.reduce((a, b) => a + b, 0) / facultyHourValues.length;
    const variance = facultyHourValues.reduce((sum, hours) => sum + Math.pow(hours - avgHours, 2), 0) / facultyHourValues.length;
    score -= variance * 2;
  }
  
  // Reward good classroom utilization
  const utilizationValues = Object.values(classroomUtilization);
  if (utilizationValues.length > 0) {
    const avgUtilization = utilizationValues.reduce((a, b) => a + b, 0) / utilizationValues.length;
    score += avgUtilization * 2;
  }
  
  return Math.max(0, Math.round(score));
}

module.exports = router;

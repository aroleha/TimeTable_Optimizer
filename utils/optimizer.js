const { getDatabase } = require('../database/init');

// Main timetable optimization function
async function generateOptimizedTimetable({ 
  timetableId, departmentId, semester, academicYear, options = {} 
}) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Get all required data for optimization
    Promise.all([
      getSubjects(db, departmentId, semester),
      getFaculty(db, departmentId),
      getClassrooms(db, departmentId),
      getBatches(db, departmentId, semester),
      getOptimizationParams(db, departmentId),
      getFixedSlots(db),
      getFacultySubjectMappings(db, departmentId)
    ]).then(([subjects, faculty, classrooms, batches, params, fixedSlots, facultyMappings]) => {
      
      try {
        const optimizedSlots = optimizeTimetable({
          subjects,
          faculty,
          classrooms,
          batches,
          params,
          fixedSlots,
          facultyMappings,
          options
        });
        
        db.close();
        resolve(optimizedSlots);
        
      } catch (error) {
        db.close();
        reject(error);
      }
      
    }).catch(error => {
      db.close();
      reject(error);
    });
  });
}

// Core optimization algorithm
function optimizeTimetable({ 
  subjects, faculty, classrooms, batches, params, fixedSlots, facultyMappings, options 
}) {
  const slots = [];
  const timeSlots = generateTimeSlots(params);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Initialize tracking structures
  const facultySchedule = initializeFacultySchedule(faculty, days, timeSlots);
  const classroomSchedule = initializeClassroomSchedule(classrooms, days, timeSlots);
  const batchSchedule = initializeBatchSchedule(batches, days, timeSlots);
  
  // Place fixed slots first
  fixedSlots.forEach(fixedSlot => {
    if (fixedSlot.is_active) {
      const dayIndex = getDayIndex(fixedSlot.day_of_week);
      const timeIndex = getTimeSlotIndex(fixedSlot.start_time, timeSlots);
      
      if (dayIndex !== -1 && timeIndex !== -1) {
        // Mark resources as occupied
        if (fixedSlot.faculty_id) {
          facultySchedule[fixedSlot.faculty_id][dayIndex][timeIndex] = true;
        }
        if (fixedSlot.classroom_id) {
          classroomSchedule[fixedSlot.classroom_id][dayIndex][timeIndex] = true;
        }
        if (fixedSlot.batch_id) {
          batchSchedule[fixedSlot.batch_id][dayIndex][timeIndex] = true;
        }
        
        slots.push({
          day_of_week: dayIndex,
          start_time: fixedSlot.start_time,
          end_time: fixedSlot.end_time,
          subject_id: fixedSlot.subject_id,
          faculty_id: fixedSlot.faculty_id,
          classroom_id: fixedSlot.classroom_id,
          batch_id: fixedSlot.batch_id,
          is_fixed: 1
        });
      }
    }
  });
  
  // Generate requirements for each subject-batch combination
  const requirements = generateRequirements(subjects, batches, params);
  
  // Sort requirements by priority (more constrained first)
  requirements.sort((a, b) => {
    const aConstraints = getConstraintScore(a, facultyMappings);
    const bConstraints = getConstraintScore(b, facultyMappings);
    return bConstraints - aConstraints;
  });
  
  // Apply genetic algorithm or constraint satisfaction
  const maxAttempts = options.variation ? 100 + (options.variation * 50) : 100;
  let attempts = 0;
  let bestSolution = null;
  let bestScore = -1;
  
  while (attempts < maxAttempts) {
    const currentSolution = [...slots]; // Start with fixed slots
    const tempFacultySchedule = JSON.parse(JSON.stringify(facultySchedule));
    const tempClassroomSchedule = JSON.parse(JSON.stringify(classroomSchedule));
    const tempBatchSchedule = JSON.parse(JSON.stringify(batchSchedule));
    
    let success = true;
    
    // Try to place all requirements
    for (const requirement of requirements) {
      const placement = findBestPlacement(
        requirement,
        tempFacultySchedule,
        tempClassroomSchedule,
        tempBatchSchedule,
        facultyMappings,
        timeSlots,
        days,
        params,
        options
      );
      
      if (placement) {
        currentSolution.push(placement);
        
        // Update schedules
        tempFacultySchedule[placement.faculty_id][placement.day_of_week][placement.time_index] = true;
        tempClassroomSchedule[placement.classroom_id][placement.day_of_week][placement.time_index] = true;
        tempBatchSchedule[placement.batch_id][placement.day_of_week][placement.time_index] = true;
      } else {
        success = false;
        break;
      }
    }
    
    if (success) {
      const score = evaluateSolution(currentSolution, params, faculty, classrooms, batches);
      if (score > bestScore) {
        bestScore = score;
        bestSolution = currentSolution;
      }
    }
    
    attempts++;
    
    // Add some randomization for different variations
    if (options.variation && attempts % 20 === 0) {
      requirements.sort(() => Math.random() - 0.5);
    }
  }
  
  if (!bestSolution) {
    throw new Error('Unable to generate a feasible timetable with current constraints');
  }
  
  return bestSolution;
}

// Generate time slots based on parameters
function generateTimeSlots(params) {
  const slots = [];
  const startHour = parseInt(params.start_time.split(':')[0]);
  const endHour = parseInt(params.end_time.split(':')[0]);
  const lunchStart = parseInt(params.lunch_break_start.split(':')[0]);
  const lunchEnd = parseInt(params.lunch_break_end.split(':')[0]);
  
  for (let hour = startHour; hour < endHour; hour++) {
    // Skip lunch break
    if (hour >= lunchStart && hour < lunchEnd) {
      continue;
    }
    
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    slots.push({ start_time: startTime, end_time: endTime });
  }
  
  return slots;
}

// Generate requirements for subjects and batches
function generateRequirements(subjects, batches, params) {
  const requirements = [];
  
  subjects.forEach(subject => {
    batches.forEach(batch => {
      if (batch.semester === subject.semester) {
        // Calculate number of slots needed per week
        const slotsPerWeek = subject.hours_per_week;
        
        for (let i = 0; i < slotsPerWeek; i++) {
          requirements.push({
            subject_id: subject.id,
            batch_id: batch.id,
            subject_name: subject.name,
            batch_name: batch.name,
            requires_lab: subject.requires_lab,
            type: subject.type,
            priority: subject.credits * 10 // Higher credits = higher priority
          });
        }
      }
    });
  });
  
  return requirements;
}

// Find best placement for a requirement
function findBestPlacement(
  requirement, 
  facultySchedule, 
  classroomSchedule, 
  batchSchedule, 
  facultyMappings, 
  timeSlots, 
  days, 
  params,
  options
) {
  const candidates = [];
  
  // Get available faculty for this subject
  const availableFaculty = facultyMappings.filter(
    mapping => mapping.subject_id === requirement.subject_id
  );
  
  if (availableFaculty.length === 0) {
    return null; // No faculty available for this subject
  }
  
  // Try each day and time slot
  days.forEach((day, dayIndex) => {
    timeSlots.forEach((timeSlot, timeIndex) => {
      // Check if batch is available
      if (batchSchedule[requirement.batch_id][dayIndex][timeIndex]) {
        return; // Batch is busy
      }
      
      // Try each available faculty member
      availableFaculty.forEach(facultyMapping => {
        const facultyId = facultyMapping.faculty_id;
        
        // Check if faculty is available
        if (facultySchedule[facultyId][dayIndex][timeIndex]) {
          return; // Faculty is busy
        }
        
        // Find suitable classroom
        const suitableClassrooms = findSuitableClassrooms(
          requirement, 
          classroomSchedule, 
          dayIndex, 
          timeIndex
        );
        
        suitableClassrooms.forEach(classroom => {
          const score = calculatePlacementScore(
            requirement,
            facultyMapping,
            classroom,
            dayIndex,
            timeIndex,
            facultySchedule,
            params
          );
          
          candidates.push({
            day_of_week: dayIndex,
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time,
            subject_id: requirement.subject_id,
            faculty_id: facultyId,
            classroom_id: classroom.id,
            batch_id: requirement.batch_id,
            score: score,
            time_index: timeIndex
          });
        });
      });
    });
  });
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Sort by score and return best candidate
  candidates.sort((a, b) => b.score - a.score);
  
  // Add some randomization for variations
  if (options.variation && candidates.length > 1) {
    const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
    return topCandidates[Math.floor(Math.random() * topCandidates.length)];
  }
  
  return candidates[0];
}

// Find suitable classrooms for a requirement
function findSuitableClassrooms(requirement, classroomSchedule, dayIndex, timeIndex) {
  const suitable = [];
  
  Object.keys(classroomSchedule).forEach(classroomId => {
    // Check if classroom is available
    if (!classroomSchedule[classroomId][dayIndex][timeIndex]) {
      // Add classroom type matching logic here if needed
      suitable.push({ id: parseInt(classroomId) });
    }
  });
  
  return suitable;
}

// Calculate placement score
function calculatePlacementScore(requirement, facultyMapping, classroom, dayIndex, timeIndex, facultySchedule, params) {
  let score = 100;
  
  // Prefer faculty with higher preference for this subject
  score += (facultyMapping.preference_level || 1) * 20;
  
  // Prefer spreading classes throughout the week
  const facultyDayLoad = facultySchedule[facultyMapping.faculty_id][dayIndex].filter(slot => slot).length;
  score -= facultyDayLoad * 5;
  
  // Prefer morning slots slightly
  if (timeIndex < 2) {
    score += 5;
  }
  
  // Avoid back-to-back classes for the same faculty
  if (timeIndex > 0 && facultySchedule[facultyMapping.faculty_id][dayIndex][timeIndex - 1]) {
    score -= 10;
  }
  if (timeIndex < facultySchedule[facultyMapping.faculty_id][dayIndex].length - 1 && 
      facultySchedule[facultyMapping.faculty_id][dayIndex][timeIndex + 1]) {
    score -= 10;
  }
  
  return score;
}

// Evaluate solution quality
function evaluateSolution(solution, params, faculty, classrooms, batches) {
  let score = 1000;
  
  // Check faculty workload distribution
  const facultyHours = {};
  solution.forEach(slot => {
    if (!facultyHours[slot.faculty_id]) {
      facultyHours[slot.faculty_id] = 0;
    }
    facultyHours[slot.faculty_id]++;
  });
  
  // Penalize uneven distribution
  const hourValues = Object.values(facultyHours);
  if (hourValues.length > 0) {
    const avg = hourValues.reduce((a, b) => a + b, 0) / hourValues.length;
    const variance = hourValues.reduce((sum, hours) => sum + Math.pow(hours - avg, 2), 0) / hourValues.length;
    score -= variance * 10;
  }
  
  // Check classroom utilization
  const classroomHours = {};
  solution.forEach(slot => {
    if (!classroomHours[slot.classroom_id]) {
      classroomHours[slot.classroom_id] = 0;
    }
    classroomHours[slot.classroom_id]++;
  });
  
  // Reward good utilization
  const utilizationValues = Object.values(classroomHours);
  if (utilizationValues.length > 0) {
    const avgUtilization = utilizationValues.reduce((a, b) => a + b, 0) / utilizationValues.length;
    score += avgUtilization * 5;
  }
  
  return score;
}

// Helper functions
function initializeFacultySchedule(faculty, days, timeSlots) {
  const schedule = {};
  faculty.forEach(f => {
    schedule[f.id] = days.map(() => new Array(timeSlots.length).fill(false));
  });
  return schedule;
}

function initializeClassroomSchedule(classrooms, days, timeSlots) {
  const schedule = {};
  classrooms.forEach(c => {
    schedule[c.id] = days.map(() => new Array(timeSlots.length).fill(false));
  });
  return schedule;
}

function initializeBatchSchedule(batches, days, timeSlots) {
  const schedule = {};
  batches.forEach(b => {
    schedule[b.id] = days.map(() => new Array(timeSlots.length).fill(false));
  });
  return schedule;
}

function getDayIndex(dayOfWeek) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return typeof dayOfWeek === 'string' ? days.indexOf(dayOfWeek) : dayOfWeek;
}

function getTimeSlotIndex(time, timeSlots) {
  return timeSlots.findIndex(slot => slot.start_time === time);
}

function getConstraintScore(requirement, facultyMappings) {
  const availableFaculty = facultyMappings.filter(
    mapping => mapping.subject_id === requirement.subject_id
  );
  return 100 - (availableFaculty.length * 10); // Fewer faculty = higher constraint
}

// Database helper functions
function getSubjects(db, departmentId, semester) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM subjects WHERE department_id = ? AND semester = ?',
      [departmentId, semester],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getFaculty(db, departmentId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM faculty WHERE department_id = ? AND is_available = 1',
      [departmentId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getClassrooms(db, departmentId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM classrooms WHERE (department_id = ? OR department_id IS NULL) AND is_available = 1',
      [departmentId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getBatches(db, departmentId, semester) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM student_batches WHERE department_id = ? AND semester = ?',
      [departmentId, semester],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getOptimizationParams(db, departmentId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM optimization_params WHERE department_id = ?',
      [departmentId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || {
          max_classes_per_day: 6,
          min_break_duration: 15,
          start_time: '09:00',
          end_time: '17:00',
          lunch_break_start: '13:00',
          lunch_break_end: '14:00',
          working_days: 5
        });
      }
    );
  });
}

function getFixedSlots(db) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM fixed_slots WHERE is_active = 1',
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getFacultySubjectMappings(db, departmentId) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT fs.*, s.department_id 
      FROM faculty_subjects fs
      JOIN subjects s ON fs.subject_id = s.id
      WHERE s.department_id = ?
    `, [departmentId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  generateOptimizedTimetable
};

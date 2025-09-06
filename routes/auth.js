const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { username, email, password, role, department } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const db = getDatabase();
    
    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (row) {
        db.close();
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const stmt = db.prepare(`
        INSERT INTO users (username, email, password_hash, role, department) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([username, email, passwordHash, role || 'user', department], function(err) {
        if (err) {
          db.close();
          return res.status(500).json({ message: 'Error creating user' });
        }
        
        db.close();
        res.status(201).json({ 
          message: 'User created successfully',
          userId: this.lastID 
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const db = getDatabase();
    
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!user) {
        db.close();
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        db.close();
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role,
          department: user.department 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      db.close();
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          department: user.department
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.get('SELECT id, username, email, role, department, created_at FROM users WHERE id = ?', 
    [req.user.userId], (err, user) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (!user) {
      db.close();
      return res.status(404).json({ message: 'User not found' });
    }
    
    db.close();
    res.json(user);
  });
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, department } = req.body;
    const db = getDatabase();
    
    db.run('UPDATE users SET email = ?, department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [email, department, req.user.userId], function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Error updating profile' });
      }
      
      db.close();
      res.json({ message: 'Profile updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const db = getDatabase();
  
  db.all('SELECT id, username, email, role, department, created_at FROM users ORDER BY created_at DESC', 
    (err, users) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    
    db.close();
    res.json(users);
  });
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;
  
  if (parseInt(id) === req.user.userId) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }
  
  const db = getDatabase();
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error deleting user' });
    }
    
    if (this.changes === 0) {
      db.close();
      return res.status(404).json({ message: 'User not found' });
    }
    
    db.close();
    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;

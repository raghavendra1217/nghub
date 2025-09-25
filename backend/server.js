const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { protect, authorize } = require('./middleware/authMiddleware');
const { runPy } = require('./utils/emailRunner');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
  } else {
    console.log('✅ Connected to Supabase PostgreSQL database');
    release();
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../my-app/dist')));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Database middleware - attach pool to request
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Note: Table creation is handled in Supabase dashboard
// The users table should already exist with the schema we provided

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { employee_id, name, email, contact, password, role } = req.body;
    
    console.log("📝 Registration attempt:", { employee_id, name, email, contact, role });

    // Validate input
    if (!employee_id || !name || !email || !contact || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate role
    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either admin or employee' });
    }

    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM users WHERE email = $1 OR employee_id = $2';
    const checkUserResult = await pool.query(checkUserQuery, [email, employee_id]);
    
    if (checkUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or employee ID already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertQuery = 'INSERT INTO users (employee_id, name, email, contact, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
    const insertResult = await pool.query(insertQuery, [employee_id, name, email, contact, hashedPassword, role]);
    
    // Generate JWT token
    const token = jwt.sign({ userId: insertResult.rows[0].id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: insertResult.rows[0].id, employee_id, name, email, contact, role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, employee_id: user.employee_id, name: user.name, email: user.email, contact: user.contact, role: user.role }
    });
  } catch (error) {
    console.log("❌ Login error:", error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected route example
app.get('/api/profile', protect, (req, res) => {
  res.json({ user: req.user });
});

// Admin only route example
app.get('/api/admin/users', protect, authorize('admin'), async (req, res) => {
  try {
    const usersQuery = 'SELECT id, employee_id, name, email, contact, role, created_at FROM users ORDER BY created_at DESC';
    const usersResult = await pool.query(usersQuery);
    res.json({ users: usersResult.rows });
  } catch (error) {
    console.log("❌ Error fetching users:", error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Employee route example
app.get('/api/employee/dashboard', protect, authorize('employee', 'admin'), (req, res) => {
  res.json({ 
    message: 'Employee dashboard', 
    user: req.user 
  });
});

// Forgot Password endpoint
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const userQuery = 'SELECT id, email, name FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const user = userResult.rows[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP expiry (10 minutes from now)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with OTP and expiry
    const updateQuery = 'UPDATE users SET otp = $1, otp_expiry = $2 WHERE id = $3';
    await pool.query(updateQuery, [otp, otpExpiry, user.id]);

    console.log(`📧 Sending OTP ${otp} to ${email}`);

    // Send OTP via email
    try {
      await runPy('send_otp_email.py', [email, otp]);
      console.log(`✅ OTP sent successfully to ${email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send email: ${emailError.message}`);
      console.error(`❌ Email error details:`, emailError);
      return res.status(500).json({ error: 'Failed to send OTP email. Please check email configuration.' });
    }

    res.json({
      message: 'OTP sent successfully to your email',
      email: email
    });

  } catch (error) {
    console.log("❌ Forgot password error:", error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Check if user exists and OTP is valid
    const userQuery = 'SELECT id, email, otp, otp_expiry FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Clear OTP after successful verification
    const clearOtpQuery = 'UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = $1';
    await pool.query(clearOtpQuery, [user.id]);

    res.json({
      message: 'OTP verified successfully',
      email: email
    });

  } catch (error) {
    console.log("❌ Verify OTP error:", error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password endpoint
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userQuery = 'SELECT id FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2';
    await pool.query(updateQuery, [hashedPassword, email]);

    res.json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.log("❌ Reset password error:", error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Employee management routes (Admin only)
app.get('/api/employees', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('✅ Fetching employees list with customer counts');
    const result = await req.db.query(`
      SELECT u.id, u.employee_id, u.name, u.email, u.contact, u.role,
             COUNT(c.id) as customer_count
      FROM users u
      LEFT JOIN customers c ON u.id = c.created_by
      GROUP BY u.id, u.employee_id, u.name, u.email, u.contact, u.role
      ORDER BY u.name
    `);
    res.json({ 
      employees: result.rows,
      count: result.rows.length 
    });
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/admin/register', protect, authorize('admin'), async (req, res) => {
  try {
    const { employee_id, name, email, contact, password, role } = req.body;
    
    console.log('✅ Admin registering new employee:', { employee_id, name, email, role });

    // Check if user already exists
    const existingUser = await req.db.query('SELECT id FROM users WHERE email = $1 OR employee_id = $2', [email, employee_id]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or employee ID already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await req.db.query(
      'INSERT INTO users (employee_id, name, email, contact, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, employee_id, name, email, contact, role',
      [employee_id, name, email, contact, hashedPassword, role]
    );

    const newUser = result.rows[0];
    console.log('✅ Employee registered successfully:', newUser.id);

    res.status(201).json({ 
      message: 'Employee registered successfully',
      user: newUser 
    });
  } catch (error) {
    console.error('❌ Error registering employee:', error);
    res.status(500).json({ error: 'Failed to register employee' });
  }
});

app.get('/api/employees/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Fetching employee details:', id);

    const result = await req.db.query('SELECT id, employee_id, name, email, contact, role FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee: result.rows[0] });
  } catch (error) {
    console.error('❌ Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

app.put('/api/employees/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, name, email, contact, role } = req.body;
    
    console.log('✅ Admin updating employee:', { id, employee_id, name, email, role });

    // Check if employee exists
    const existingUser = await req.db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if email or employee_id is already taken by another user
    const duplicateCheck = await req.db.query(
      'SELECT id FROM users WHERE (email = $1 OR employee_id = $2) AND id != $3', 
      [email, employee_id, id]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email or Employee ID already exists for another user' });
    }

    // Update employee
    const result = await req.db.query(
      'UPDATE users SET employee_id = $1, name = $2, email = $3, contact = $4, role = $5 WHERE id = $6 RETURNING id, employee_id, name, email, contact, role',
      [employee_id, name, email, contact, role, id]
    );

    const updatedUser = result.rows[0];
    console.log('✅ Employee updated successfully:', updatedUser.id);

    res.json({ 
      message: 'Employee updated successfully',
      employee: updatedUser 
    });
  } catch (error) {
    console.error('❌ Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Admin deleting employee:', id);

    // Check if employee exists
    const existingUser = await req.db.query('SELECT id, name FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete employee
    await req.db.query('DELETE FROM users WHERE id = $1', [id]);
    
    console.log('✅ Employee deleted successfully:', existingUser.rows[0].name);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Customer management routes (Employee only)
app.get('/api/customers', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    console.log('✅ Fetching customers list for user:', req.user.name, 'Role:', req.user.role);
    
    let query, params;
    
    if (req.user.role === 'admin') {
      // Admin can see all customers
      console.log('📊 Admin accessing all customers');
      query = `
        SELECT c.*, u.name as created_by_name 
        FROM customers c 
        LEFT JOIN users u ON c.created_by = u.id 
        ORDER BY c.created_at DESC
      `;
      params = [];
    } else {
      // Employee can only see their own customers
      console.log('👤 Employee accessing their own customers, User ID:', req.user.id);
      query = `
        SELECT c.*, u.name as created_by_name 
        FROM customers c 
        LEFT JOIN users u ON c.created_by = u.id 
        WHERE c.created_by = $1
        ORDER BY c.created_at DESC
      `;
      params = [req.user.id];
    }
    
    const result = await req.db.query(query, params);
    console.log('📋 Found', result.rows.length, 'customers for', req.user.name);
    res.json({ 
      customers: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { customer_name, phone_number, type_of_work, discussed_amount, paid_amount, pending_amount, mode_of_payment } = req.body;
    
    console.log('✅ Employee adding new customer:', { customer_name, phone_number, type_of_work });

    // Insert new customer
    const result = await req.db.query(
      `INSERT INTO customers (customer_name, phone_number, type_of_work, discussed_amount, paid_amount, pending_amount, mode_of_payment, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, customer_name, phone_number, type_of_work, discussed_amount, paid_amount, pending_amount, mode_of_payment, created_at`,
      [customer_name, phone_number, type_of_work, discussed_amount, paid_amount, pending_amount, mode_of_payment, req.user.id]
    );

    const newCustomer = result.rows[0];
    console.log('✅ Customer added successfully:', newCustomer.id);

    res.status(201).json({ 
      message: 'Customer added successfully',
      customer: newCustomer 
    });
  } catch (error) {
    console.error('❌ Error adding customer:', error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

// Update Customer Route
app.put('/api/customers/:id', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone_number, type_of_work, discussed_amount, paid_amount, pending_amount, mode_of_payment } = req.body
    
    console.log('✅ Updating customer:', req.user.name, 'Customer ID:', id)
    
    // Check if customer exists and belongs to this employee (or user is admin)
    let query, params
    if (req.user.role === 'admin') {
      query = 'SELECT id FROM customers WHERE id = $1'
      params = [id]
    } else {
      query = 'SELECT id FROM customers WHERE id = $1 AND created_by = $2'
      params = [id, req.user.id]
    }
    
    const customerCheck = await req.db.query(query, params)
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found or access denied' })
    }
    
    // Update customer
    const result = await req.db.query(`
      UPDATE customers 
      SET customer_name = $1, phone_number = $2, type_of_work = $3, 
          discussed_amount = $4, paid_amount = $5, pending_amount = $6, 
          mode_of_payment = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, phone_number, type_of_work, discussed_amount, paid_amount, pending_amount, mode_of_payment, id])
    
    console.log('✅ Customer updated successfully:', result.rows[0])
    res.json({ 
      message: 'Customer updated successfully',
      customer: result.rows[0]
    })
  } catch (error) {
    console.error('❌ Error updating customer:', error)
    res.status(500).json({ error: 'Failed to update customer' })
  }
})

// Delete Customer Route
app.delete('/api/customers/:id', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    
    console.log('✅ Deleting customer:', req.user.name, 'Customer ID:', id)
    
    // Check if customer exists and belongs to this employee (or user is admin)
    let query, params
    if (req.user.role === 'admin') {
      query = 'SELECT id FROM customers WHERE id = $1'
      params = [id]
    } else {
      query = 'SELECT id FROM customers WHERE id = $1 AND created_by = $2'
      params = [id, req.user.id]
    }
    
    const customerCheck = await req.db.query(query, params)
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found or access denied' })
    }
    
    // Delete customer (cards and claims will be deleted due to CASCADE)
    await req.db.query('DELETE FROM customers WHERE id = $1', [id])
    
    console.log('✅ Customer deleted successfully')
    res.json({ 
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting customer:', error)
    res.status(500).json({ error: 'Failed to delete customer' })
  }
})

app.get('/api/employees/:id/customers', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Fetching customers for employee:', id);

    const result = await req.db.query(`
      SELECT c.*, u.name as created_by_name 
      FROM customers c 
      LEFT JOIN users u ON c.created_by = u.id 
      WHERE c.created_by = $1
      ORDER BY c.created_at DESC
    `, [id]);
    
    res.json({ 
      customers: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching employee customers:', error);
    res.status(500).json({ error: 'Failed to fetch employee customers' });
  }
});

// Camp Management Routes
app.get('/api/camps', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('✅ Fetching camps list');
    const result = await req.db.query(`
      SELECT c.*, u.name as created_by_name,
             ARRAY(
               SELECT u2.name 
               FROM users u2 
               WHERE u2.id::text = ANY(c.assigned_to)
             ) as assigned_employee_names
      FROM camps c 
      LEFT JOIN users u ON c.created_by = u.id 
      ORDER BY c.camp_date DESC
    `);
    res.json({ 
      camps: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching camps:', error);
    res.status(500).json({ error: 'Failed to fetch camps' });
  }
});

app.post('/api/camps', protect, authorize('admin'), async (req, res) => {
  try {
    const { camp_date, location, location_link, phone_number, status, conducted_by, assigned_to } = req.body;
    
    console.log('✅ Admin adding new camp:', { camp_date, location, status });

    // Insert new camp
    const result = await req.db.query(
      `INSERT INTO camps (camp_date, location, location_link, phone_number, status, conducted_by, assigned_to, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, camp_date, location, location_link, phone_number, status, conducted_by, assigned_to, created_at`,
      [camp_date, location, location_link, phone_number, status, conducted_by, assigned_to, req.user.id]
    );

    const newCamp = result.rows[0];
    console.log('✅ Camp added successfully:', newCamp.id);

    res.status(201).json({ 
      message: 'Camp added successfully',
      camp: newCamp 
    });
  } catch (error) {
    console.error('❌ Error adding camp:', error);
    res.status(500).json({ error: 'Failed to add camp' });
  }
});

app.get('/api/camps/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Fetching camp details:', id);

    const result = await req.db.query(`
      SELECT c.*, u.name as created_by_name,
             ARRAY(
               SELECT u2.name 
               FROM users u2 
               WHERE u2.id::text = ANY(c.assigned_to)
             ) as assigned_employee_names
      FROM camps c 
      LEFT JOIN users u ON c.created_by = u.id 
      WHERE c.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camp not found' });
    }

    res.json({ camp: result.rows[0] });
  } catch (error) {
    console.error('❌ Error fetching camp:', error);
    res.status(500).json({ error: 'Failed to fetch camp' });
  }
});

app.put('/api/camps/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { camp_date, location, location_link, phone_number, status, conducted_by, assigned_to } = req.body;
    
    console.log('✅ Admin updating camp:', { id, camp_date, location, status });

    // Check if camp exists
    const existingCamp = await req.db.query('SELECT id FROM camps WHERE id = $1', [id]);
    if (existingCamp.rows.length === 0) {
      return res.status(404).json({ error: 'Camp not found' });
    }

    // Update camp
    const result = await req.db.query(
      `UPDATE camps SET camp_date = $1, location = $2, location_link = $3, phone_number = $4, 
       status = $5, conducted_by = $6, assigned_to = $7, last_updated = CURRENT_TIMESTAMP 
       WHERE id = $8 
       RETURNING id, camp_date, location, location_link, phone_number, status, conducted_by, assigned_to, last_updated`,
      [camp_date, location, location_link, phone_number, status, conducted_by, assigned_to, id]
    );

    const updatedCamp = result.rows[0];
    console.log('✅ Camp updated successfully:', updatedCamp.id);

    res.json({ 
      message: 'Camp updated successfully',
      camp: updatedCamp 
    });
  } catch (error) {
    console.error('❌ Error updating camp:', error);
    res.status(500).json({ error: 'Failed to update camp' });
  }
});

app.delete('/api/camps/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Admin deleting camp:', id);

    // Check if camp exists
    const existingCamp = await req.db.query('SELECT id, location FROM camps WHERE id = $1', [id]);
    if (existingCamp.rows.length === 0) {
      return res.status(404).json({ error: 'Camp not found' });
    }

    // Delete camp
    await req.db.query('DELETE FROM camps WHERE id = $1', [id]);
    
    console.log('✅ Camp deleted successfully:', existingCamp.rows[0].location);

    res.json({ message: 'Camp deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting camp:', error);
    res.status(500).json({ error: 'Failed to delete camp' });
  }
});

// Employee camp assignments
app.get('/api/employee/camps', protect, authorize('employee'), async (req, res) => {
  try {
    console.log('✅ Fetching camps assigned to employee:', req.user.name, 'ID:', req.user.id);
    
    const result = await req.db.query(`
      SELECT c.*, u.name as created_by_name
      FROM camps c 
      LEFT JOIN users u ON c.created_by = u.id 
      WHERE $1 = ANY(c.assigned_to)
      ORDER BY c.camp_date ASC
    `, [req.user.id.toString()]);
    
    console.log('📋 Found', result.rows.length, 'camps assigned to', req.user.name);
    res.json({ 
      camps: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching employee camps:', error);
    res.status(500).json({ error: 'Failed to fetch assigned camps' });
  }
});

// Employee update camp status
app.put('/api/employee/camps/:id/status', protect, authorize('employee'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('✅ Employee updating camp status:', req.user.name, 'Camp ID:', id, 'New Status:', status);
    
    // Validate status
    const validStatuses = ['planned', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: planned, ongoing, completed, cancelled' });
    }
    
    // Check if camp exists and is assigned to this employee
    const campCheck = await req.db.query(`
      SELECT id FROM camps 
      WHERE id = $1 AND $2 = ANY(assigned_to)
    `, [id, req.user.id.toString()]);
    
    if (campCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Camp not found or not assigned to you' });
    }
    
    // Update camp status
    const result = await req.db.query(`
      UPDATE camps 
      SET status = $1, last_updated = CURRENT_TIMESTAMP
      WHERE id = $2 AND $3 = ANY(assigned_to)
      RETURNING *
    `, [status, id, req.user.id.toString()]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camp not found or not assigned to you' });
    }
    
    console.log('✅ Camp status updated successfully:', result.rows[0]);
    res.json({ 
      message: 'Camp status updated successfully',
      camp: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating camp status:', error);
    res.status(500).json({ error: 'Failed to update camp status' });
  }
});

// Card Management Routes (One card per customer)

// Get card for a customer
app.get('/api/customers/:customerId/card', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { customerId } = req.params;
    
    console.log('✅ Fetching card for customer:', customerId, 'User:', req.user.name);
    
    // Check if customer exists and user has access
    let customerQuery, customerParams;
    if (req.user.role === 'admin') {
      customerQuery = 'SELECT id FROM customers WHERE id = $1';
      customerParams = [customerId];
    } else {
      customerQuery = 'SELECT id FROM customers WHERE id = $1 AND created_by = $2';
      customerParams = [customerId, req.user.id];
    }
    
    const customerCheck = await req.db.query(customerQuery, customerParams);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found or access denied' });
    }
    
    // Fetch card for the customer
    const result = await req.db.query(`
      SELECT c.*, u.name as created_by_name
      FROM cards c 
      LEFT JOIN users u ON c.created_by = u.id 
      WHERE c.customer_id = $1
    `, [customerId]);
    
    console.log('📋 Found', result.rows.length, 'card for customer:', customerId);
    res.json({ 
      card: result.rows[0] || null
    });
  } catch (error) {
    console.error('❌ Error fetching customer card:', error);
    res.status(500).json({ error: 'Failed to fetch customer card' });
  }
});

// Add new card for a customer (one per customer)
app.post('/api/customers/:customerId/card', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const { 
      card_number, 
      register_number, 
      card_holder_name, 
      agent_name, 
      agent_mobile
    } = req.body;
    
    console.log('✅ Adding new card for customer:', customerId, 'User:', req.user.name);
    
    // Validate required fields
    if (!card_number || !card_holder_name) {
      return res.status(400).json({ error: 'Card number and card holder name are required' });
    }
    
    // Check if customer exists and user has access
    let customerQuery, customerParams;
    if (req.user.role === 'admin') {
      customerQuery = 'SELECT id FROM customers WHERE id = $1';
      customerParams = [customerId];
    } else {
      customerQuery = 'SELECT id FROM customers WHERE id = $1 AND created_by = $2';
      customerParams = [customerId, req.user.id];
    }
    
    const customerCheck = await req.db.query(customerQuery, customerParams);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found or access denied' });
    }
    
    // Check if customer already has a card
    const existingCard = await req.db.query('SELECT id FROM cards WHERE customer_id = $1', [customerId]);
    if (existingCard.rows.length > 0) {
      return res.status(400).json({ error: 'Customer already has a card' });
    }
    
    // Check if card number already exists
    const cardCheck = await req.db.query('SELECT id FROM cards WHERE card_number = $1', [card_number]);
    if (cardCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Card number already exists' });
    }
    
    // Add new card
    const result = await req.db.query(`
      INSERT INTO cards (
        card_number, register_number, card_holder_name, agent_name, agent_mobile,
        customer_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      card_number, register_number, card_holder_name, agent_name, agent_mobile,
      customerId, req.user.id
    ]);
    
    console.log('✅ Card added successfully:', result.rows[0]);
    res.status(201).json({ 
      message: 'Card added successfully',
      card: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error adding card:', error);
    res.status(500).json({ error: 'Failed to add card' });
  }
});

// Update card
app.put('/api/cards/:id', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      card_number, 
      register_number, 
      card_holder_name, 
      agent_name, 
      agent_mobile
    } = req.body;
    
    console.log('✅ Updating card:', id, 'User:', req.user.name);
    
    // Validate required fields
    if (!card_number || !card_holder_name) {
      return res.status(400).json({ error: 'Card number and card holder name are required' });
    }
    
    // Check if card exists and user has access
    let cardQuery, cardParams;
    if (req.user.role === 'admin') {
      cardQuery = 'SELECT id FROM cards WHERE id = $1';
      cardParams = [id];
    } else {
      cardQuery = 'SELECT id FROM cards WHERE id = $1 AND created_by = $2';
      cardParams = [id, req.user.id];
    }
    
    const cardCheck = await req.db.query(cardQuery, cardParams);
    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found or access denied' });
    }
    
    // Check if card number already exists (excluding current card)
    const duplicateCheck = await req.db.query('SELECT id FROM cards WHERE card_number = $1 AND id != $2', [card_number, id]);
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Card number already exists' });
    }
    
    // Update card
    const result = await req.db.query(`
      UPDATE cards SET 
        card_number = $1, register_number = $2, card_holder_name = $3, 
        agent_name = $4, agent_mobile = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [
      card_number, register_number, card_holder_name, agent_name, agent_mobile, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    console.log('✅ Card updated successfully:', result.rows[0]);
    res.json({ 
      message: 'Card updated successfully',
      card: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// Delete card
app.delete('/api/cards/:id', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Deleting card:', id, 'User:', req.user.name);
    
    // Check if card exists and user has access
    let cardQuery, cardParams;
    if (req.user.role === 'admin') {
      cardQuery = 'SELECT id FROM cards WHERE id = $1';
      cardParams = [id];
    } else {
      cardQuery = 'SELECT id FROM cards WHERE id = $1 AND created_by = $2';
      cardParams = [id, req.user.id];
    }
    
    const cardCheck = await req.db.query(cardQuery, cardParams);
    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found or access denied' });
    }
    
    // Delete card (this will cascade delete all claims)
    const result = await req.db.query('DELETE FROM cards WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    console.log('✅ Card deleted successfully:', result.rows[0]);
    res.json({ 
      message: 'Card deleted successfully',
      card: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// Claims Management Routes (Multiple claims per card)

// Get all claims for a card
app.get('/api/cards/:cardId/claims', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { cardId } = req.params;
    
    console.log('✅ Fetching claims for card:', cardId, 'User:', req.user.name);
    
    // Check if card exists and user has access
    let cardQuery, cardParams;
    if (req.user.role === 'admin') {
      cardQuery = 'SELECT id FROM cards WHERE id = $1';
      cardParams = [cardId];
    } else {
      cardQuery = 'SELECT id FROM cards WHERE id = $1 AND created_by = $2';
      cardParams = [cardId, req.user.id];
    }
    
    const cardCheck = await req.db.query(cardQuery, cardParams);
    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found or access denied' });
    }
    
    // Fetch claims for the card
    const result = await req.db.query(`
      SELECT c.*, u.name as created_by_name
      FROM claims c 
      LEFT JOIN users u ON c.created_by = u.id 
      WHERE c.card_id = $1
      ORDER BY c.created_at DESC
    `, [cardId]);
    
    console.log('📋 Found', result.rows.length, 'claims for card:', cardId);
    res.json({ 
      claims: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching card claims:', error);
    res.status(500).json({ error: 'Failed to fetch card claims' });
  }
});

// Add new claim for a card
app.post('/api/cards/:cardId/claims', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { cardId } = req.params;
    const { 
      type_of_claim, 
      process_state, 
      discussed_amount, 
      paid_amount, 
      pending_amount 
    } = req.body;
    
    console.log('✅ Adding new claim for card:', cardId, 'User:', req.user.name);
    
    // Validate required fields
    if (!type_of_claim || !process_state) {
      return res.status(400).json({ error: 'Type of claim and process state are required' });
    }
    
    // Validate type of claim
    const validClaimTypes = ['Marriage gift', 'Maternity benefit', 'Natural Death', 'Accidental death'];
    if (!validClaimTypes.includes(type_of_claim)) {
      return res.status(400).json({ error: 'Invalid type of claim' });
    }
    
    // Validate process state
    const validProcessStates = ['ALO', 'Nodal Officer', 'Board', 'Insurance'];
    if (!validProcessStates.includes(process_state)) {
      return res.status(400).json({ error: 'Invalid process state' });
    }
    
    // Check if card exists and user has access
    let cardQuery, cardParams;
    if (req.user.role === 'admin') {
      cardQuery = 'SELECT id FROM cards WHERE id = $1';
      cardParams = [cardId];
    } else {
      cardQuery = 'SELECT id FROM cards WHERE id = $1 AND created_by = $2';
      cardParams = [cardId, req.user.id];
    }
    
    const cardCheck = await req.db.query(cardQuery, cardParams);
    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found or access denied' });
    }
    
    // Add new claim
    const result = await req.db.query(`
      INSERT INTO claims (
        type_of_claim, process_state, discussed_amount, paid_amount, pending_amount,
        card_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      type_of_claim, process_state, discussed_amount || 0, paid_amount || 0, pending_amount || 0,
      cardId, req.user.id
    ]);
    
    console.log('✅ Claim added successfully:', result.rows[0]);
    res.status(201).json({ 
      message: 'Claim added successfully',
      claim: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error adding claim:', error);
    res.status(500).json({ error: 'Failed to add claim' });
  }
});

// Update claim
app.put('/api/claims/:id', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      type_of_claim, 
      process_state, 
      discussed_amount, 
      paid_amount, 
      pending_amount 
    } = req.body;
    
    console.log('✅ Updating claim:', id, 'User:', req.user.name);
    
    // Validate required fields
    if (!type_of_claim || !process_state) {
      return res.status(400).json({ error: 'Type of claim and process state are required' });
    }
    
    // Validate type of claim
    const validClaimTypes = ['Marriage gift', 'Maternity benefit', 'Natural Death', 'Accidental death'];
    if (!validClaimTypes.includes(type_of_claim)) {
      return res.status(400).json({ error: 'Invalid type of claim' });
    }
    
    // Validate process state
    const validProcessStates = ['ALO', 'Nodal Officer', 'Board', 'Insurance'];
    if (!validProcessStates.includes(process_state)) {
      return res.status(400).json({ error: 'Invalid process state' });
    }
    
    // Check if claim exists and user has access
    let claimQuery, claimParams;
    if (req.user.role === 'admin') {
      claimQuery = 'SELECT id FROM claims WHERE id = $1';
      claimParams = [id];
    } else {
      claimQuery = 'SELECT id FROM claims WHERE id = $1 AND created_by = $2';
      claimParams = [id, req.user.id];
    }
    
    const claimCheck = await req.db.query(claimQuery, claimParams);
    if (claimCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found or access denied' });
    }
    
    // Update claim
    const result = await req.db.query(`
      UPDATE claims SET 
        type_of_claim = $1, process_state = $2, discussed_amount = $3,
        paid_amount = $4, pending_amount = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [
      type_of_claim, process_state, discussed_amount || 0, paid_amount || 0, pending_amount || 0, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    console.log('✅ Claim updated successfully:', result.rows[0]);
    res.json({ 
      message: 'Claim updated successfully',
      claim: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating claim:', error);
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

// Delete claim
app.delete('/api/claims/:id', protect, authorize('employee', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Deleting claim:', id, 'User:', req.user.name);
    
    // Check if claim exists and user has access
    let claimQuery, claimParams;
    if (req.user.role === 'admin') {
      claimQuery = 'SELECT id FROM claims WHERE id = $1';
      claimParams = [id];
    } else {
      claimQuery = 'SELECT id FROM claims WHERE id = $1 AND created_by = $2';
      claimParams = [id, req.user.id];
    }
    
    const claimCheck = await req.db.query(claimQuery, claimParams);
    if (claimCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found or access denied' });
    }
    
    // Delete claim
    const result = await req.db.query('DELETE FROM claims WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    console.log('✅ Claim deleted successfully:', result.rows[0]);
    res.json({ 
      message: 'Claim deleted successfully',
      claim: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error deleting claim:', error);
    res.status(500).json({ error: 'Failed to delete claim' });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../my-app/dist/index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 Server started successfully!');
  console.log(`📡 Backend API running at: http://localhost:${PORT}`);
  console.log(`🌐 Frontend served at: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log('📝 Request logging enabled - all incoming requests will be displayed below:');
  console.log('─'.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await pool.end();
  console.log('Database connection closed.');
  process.exit(0);
});

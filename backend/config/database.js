const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'pii_detector_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
}

// Get database connection
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
}

// Execute query with error handling
async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  getConnection,
  executeQuery
};
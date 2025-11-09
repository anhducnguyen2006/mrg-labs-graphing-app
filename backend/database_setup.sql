-- MRG Labs Graphing App - Database Setup Script
-- Run this script to initialize the database for authentication

-- Create database
CREATE DATABASE IF NOT EXISTS mrg_labs_db;

USE mrg_labs_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create graphs table
CREATE TABLE IF NOT EXISTS graphs (
    graph_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    baseline_filename VARCHAR(255),
    sample_filename VARCHAR(255),
    generated_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Create a test user (password: testpass123)
-- Password hash generated using bcrypt
-- INSERT INTO users (username, password) VALUES 
-- ('testuser', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ygDXLhXO9qCy');

-- Display table structures
DESCRIBE users;
DESCRIBE graphs;

-- Display success message
SELECT 'Database setup complete!' AS status;

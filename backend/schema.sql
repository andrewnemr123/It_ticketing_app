CREATE DATABASE IF NOT EXISTS it_ticketing;
USE it_ticketing;

CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'EMPLOYEE', 
        'TECHNICIAN', 
        'ADMIN'
    ) DEFAULT 'EMPLOYEE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM(
      'Hardware', 
      'Software', 
      'Network', 
      'Access / Permissions', 
      'Security', 
      'Email', 
      'Other'
    ) DEFAULT 'Software',
    priority ENUM(
      'Low', 
      'Medium', 
      'High', 
      'Critical'
    ) DEFAULT 'Medium',
    status ENUM(
      'New', 
      'Open', 
      'In Progress', 
      'Waiting for User', 
      'Resolved', 
      'Closed'
    ) DEFAULT 'New',
    creator_id INT NOT NULL,
    assigned_to_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (creator_id) REFERENCES user(id),
    FOREIGN KEY (assigned_to_id) REFERENCES user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ticket_event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    event_type ENUM(
      'COMMENT', 
      'INTERNAL_NOTE', 
      'STATUS_CHANGE', 
      'ASSIGNMENT_CHANGE', 
      'PRIORITY_CHANGE'
    ) DEFAULT 'COMMENT',
    old_value VARCHAR(255) NULL,
    new_value VARCHAR(255) NULL,
    comment_text TEXT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES ticket(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Phase 2

-- CREATE TABLE IF NOT EXISTS ticket_attachment (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     ticket_id INT NOT NULL,
--     user_id INT NOT NULL,
--     filename VARCHAR(255) NOT NULL,
--     filepath VARCHAR(500) NOT NULL,
--     filesize INT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     
--     FOREIGN KEY (ticket_id) REFERENCES ticket(id),
--     FOREIGN KEY (user_id) REFERENCES user(id)
-- );

INSERT INTO user (name, email, password_hash, role)
VALUES 
  ('System Admin', 'admin@company.com', 'Password123!', 'ADMIN'),
  ('Alex Rivers (IT Support)', 'tech@company.com', 'Password123!', 'TECHNICIAN'),
  ('Sarah Jenkins (Employee)', 'sarah@company.com', 'Password123!', 'EMPLOYEE')
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO ticket (id, ticket_number, title, description, category, priority, status, creator_id, assigned_to_id)
VALUES 
  (1, 'TICK-1001', 'VPN connection dropping intermittently', 'When connecting to remote servers, VPN disconnects every 15 minutes.', 'Network', 'High', 'In Progress', 3, 2),
  (2, 'TICK-1002', 'Request for JetBrains IntelliJ license', 'New developer onboarding requires enterprise IDE license.', 'Software', 'Medium', 'Open', 3, NULL),
  (3, 'TICK-1003', 'Second monitor no HDMI display', 'Monitor shows black screen after display driver update.', 'Hardware', 'Low', 'Resolved', 3, 2)
ON DUPLICATE KEY UPDATE ticket_number = ticket_number;

INSERT INTO ticket_event (ticket_id, user_id, event_type, comment_text, is_internal, old_value, new_value)
VALUES 
  (1, 3, 'COMMENT', 'Ticket submitted. Please check the logs.', FALSE, NULL, NULL),
  (1, 2, 'INTERNAL_NOTE', 'Verified gateway logs, investigating firewall rule reset.', TRUE, NULL, NULL),
  (1, 2, 'STATUS_CHANGE', NULL, FALSE, 'New', 'In Progress')
ON DUPLICATE KEY UPDATE id = id;
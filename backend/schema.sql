-- IT Ticketing System Database Schema

CREATE DATABASE IF NOT EXISTS it_ticketing;
USE it_ticketing;

CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER'
);

CREATE TABLE IF NOT EXISTS ticket (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('OPEN', 'IN_PROGRESS', 'CLOSED') DEFAULT 'OPEN',
    category ENUM('HARDWARE', 'SOFTWARE', 'NETWORK') DEFAULT 'SOFTWARE',
    creator_id INT, -- inserted by the backend
    assignee_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (creator_id) REFERENCES user(id) ON DELETE SET NULL,
    FOREIGN KEY (assignee_id) REFERENCES user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ticket_event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    user_id INT,
    action VARCHAR(50),
    comment_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
);

-- INSERT INTO user (email, password_hash, role) VALUES 
-- ('admin@company.com', 'pass1', 'ADMIN'),
-- ('user@company.com', 'pass2', 'USER'),
-- ('andrew@gmail.com', 'pass3', 'USER');

-- INSERT INTO ticket (title, description, category, creator_id, assignee_id) VALUES 
-- ('Laptop wont turn on', 'Screen remains black when I press power', 'HARDWARE', 2, 1),
-- ('App Down', 'App wont power one', 'SOFTWARE', 2, 1)
-- ;

-- INSERT INTO ticket_event (ticket_id, user_id, action, comment_text) VALUES 
-- (1, 2, 'CREATED', 'Submitted hardware request'),
-- (1, 1, 'COMMENTED', 'I will come check on your laptop battery')
-- ;

-- IT Ticket Management System - MySQL schema
-- Usage:  mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS it_ticketing
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE it_ticketing;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('EMPLOYEE', 'ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- tickets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number  VARCHAR(30) UNIQUE NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    category ENUM(
        'Hardware',
        'Software',
        'Network',
        'Access / Permissions',
        'Security',
        'Email',
        'Other'
    ) NOT NULL DEFAULT 'Other',
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    status ENUM(
        'New',
        'Open',
        'In Progress',
        'Waiting for User',
        'Resolved',
        'Closed'
    ) NOT NULL DEFAULT 'New',
    creator_id     INT NOT NULL,
    assigned_to_id INT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ticket_creator  FOREIGN KEY (creator_id)     REFERENCES user(id),
    CONSTRAINT fk_ticket_assignee FOREIGN KEY (assigned_to_id) REFERENCES user(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- ticket events (history / comments / notes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_event (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id    INT NOT NULL,
    user_id      INT NOT NULL,
    event_type ENUM(
        'COMMENT',
        'INTERNAL_NOTE',
        'STATUS_CHANGE',
        'ASSIGNMENT_CHANGE',
        'PRIORITY_CHANGE'
    ) NOT NULL DEFAULT 'COMMENT',
    old_value    VARCHAR(255) NULL,
    new_value    VARCHAR(255) NULL,
    comment_text TEXT NULL,
    is_internal  BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_user   FOREIGN KEY (user_id)   REFERENCES user(id)
);

-- ---------------------------------------------------------------------------
-- ticket attachments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_attachment (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id  INT NOT NULL,
    user_id    INT NOT NULL,
    filename   VARCHAR(255) NOT NULL,
    filepath   VARCHAR(500) NOT NULL,
    filesize   INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attach_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE,
    CONSTRAINT fk_attach_user   FOREIGN KEY (user_id)   REFERENCES user(id)
);

-- (MySQL automatically indexes every foreign-key column, which covers the
--  creator_id / assigned_to_id / ticket_id lookups this app makes.)

-- NOTE: No user rows are inserted here on purpose. Passwords must be bcrypt
-- hashed, which plain SQL cannot do. Create the first admin with:
--     npm run create-admin
-- or load demo data (hashed) with:
--     npm run seed

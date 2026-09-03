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

-- ===========================================================================
-- USER AUDIT
-- ===========================================================================
--
-- Records INSERT, UPDATE and DELETE operations on the user table.
--
-- password_hash is intentionally NOT stored in the audit table.
--
-- SELECT operations cannot be captured with a trigger. If SELECT auditing
-- is required, configure MySQL's general query log separately.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_audit (
    audit_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id        INT NULL,

    action         ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    changed_at     TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    db_user        VARCHAR(255) NOT NULL,
    db_host        VARCHAR(255) NULL,

    -- Values before the change
    old_name       VARCHAR(100) NULL,
    old_email      VARCHAR(255) NULL,
    old_role       ENUM('EMPLOYEE', 'ADMIN') NULL,

    -- Values after the change
    new_name       VARCHAR(100) NULL,
    new_email      VARCHAR(255) NULL,
    new_role       ENUM('EMPLOYEE', 'ADMIN') NULL,

    PRIMARY KEY (audit_id),

    INDEX idx_user_audit_user_id (user_id),
    INDEX idx_user_audit_changed_at (changed_at),
    INDEX idx_user_audit_action (action)
);

-- ---------------------------------------------------------------------------
-- INSERT AUDIT TRIGGER
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS user_audit_insert;

DELIMITER //

CREATE TRIGGER user_audit_insert
AFTER INSERT ON user
FOR EACH ROW
BEGIN
    INSERT INTO user_audit (
        user_id,
        action,
        db_user,
        db_host,
        new_name,
        new_email,
        new_role
    )
    VALUES (
        NEW.id,
        'INSERT',
        CURRENT_USER(),
        SUBSTRING_INDEX(USER(), '@', -1),
        NEW.name,
        NEW.email,
        NEW.role
    );
END//

DELIMITER ;


-- ---------------------------------------------------------------------------
-- UPDATE AUDIT TRIGGER
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS user_audit_update;

DELIMITER //

CREATE TRIGGER user_audit_update
AFTER UPDATE ON user
FOR EACH ROW
BEGIN
    INSERT INTO user_audit (
        user_id,
        action,
        db_user,
        db_host,

        old_name,
        old_email,
        old_role,

        new_name,
        new_email,
        new_role
    )
    VALUES (
        NEW.id,
        'UPDATE',
        CURRENT_USER(),
        SUBSTRING_INDEX(USER(), '@', -1),

        OLD.name,
        OLD.email,
        OLD.role,

        NEW.name,
        NEW.email,
        NEW.role
    );
END//

DELIMITER ;


-- ---------------------------------------------------------------------------
-- DELETE AUDIT TRIGGER
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS user_audit_delete;

DELIMITER //

CREATE TRIGGER user_audit_delete
AFTER DELETE ON user
FOR EACH ROW
BEGIN
    INSERT INTO user_audit (
        user_id,
        action,
        db_user,
        db_host,

        old_name,
        old_email,
        old_role
    )
    VALUES (
        OLD.id,
        'DELETE',
        CURRENT_USER(),
        SUBSTRING_INDEX(USER(), '@', -1),

        OLD.name,
        OLD.email,
        OLD.role
    );
END//

DELIMITER ;

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
    creator_id     INT NULL,
    assigned_to_id INT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ticket_creator  FOREIGN KEY (creator_id)     REFERENCES user(id) ON DELETE SET NULL,
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

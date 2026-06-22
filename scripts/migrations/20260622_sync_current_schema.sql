-- ============================================
-- Migration: sync database schema to current SQLAlchemy models
-- Created: 2026-06-22
--
-- Scope:
--   - Adds tables introduced after the initial portfolio/project schema.
--   - Adds project detail columns used by scripts/seed_data.sql.
--   - Adds indexes, unique constraints, and foreign keys expected by models.py.
--
-- Notes:
--   - This migration is idempotent: it checks information_schema before each
--     ALTER statement.
--   - It does not insert or modify seed data.
--   - Run against the selected portfolio database.
-- ============================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS upload_file (
    id INT NOT NULL AUTO_INCREMENT,
    uuid VARCHAR(32) NOT NULL,
    user_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    upload_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uuid (uuid),
    UNIQUE KEY stored_filename (stored_filename),
    KEY idx_upload_file_user (user_id),
    CONSTRAINT upload_file_ibfk_1
        FOREIGN KEY (user_id) REFERENCES `user` (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cors_origin (
    id INT NOT NULL AUTO_INCREMENT,
    server_code VARCHAR(50) NOT NULL,
    origin VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cors_server_origin (server_code, origin),
    KEY idx_cors_server_code (server_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS revoked_token (
    jti VARCHAR(36) NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    PRIMARY KEY (jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sync_portfolio_schema_20260622;

DELIMITER $$

CREATE PROCEDURE sync_portfolio_schema_20260622()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'portfolio'
          AND column_name = 'file_uuid'
    ) THEN
        ALTER TABLE portfolio
            ADD COLUMN file_uuid VARCHAR(32) NULL AFTER description;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'thumbnail_file_uuid'
    ) THEN
        ALTER TABLE project
            ADD COLUMN thumbnail_file_uuid VARCHAR(32) NULL AFTER summary;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'description'
    ) THEN
        ALTER TABLE project
            ADD COLUMN description TEXT NULL AFTER updated_at;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'tech_stack'
    ) THEN
        ALTER TABLE project
            ADD COLUMN tech_stack JSON NULL AFTER description;
        UPDATE project SET tech_stack = JSON_ARRAY() WHERE tech_stack IS NULL;
        ALTER TABLE project
            MODIFY COLUMN tech_stack JSON NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'screenshots'
    ) THEN
        ALTER TABLE project
            ADD COLUMN screenshots JSON NULL AFTER tech_stack;
        UPDATE project SET screenshots = JSON_ARRAY() WHERE screenshots IS NULL;
        ALTER TABLE project
            MODIFY COLUMN screenshots JSON NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'links'
    ) THEN
        ALTER TABLE project
            ADD COLUMN links JSON NULL AFTER screenshots;
        UPDATE project SET links = JSON_ARRAY() WHERE links IS NULL;
        ALTER TABLE project
            MODIFY COLUMN links JSON NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'start_date'
    ) THEN
        ALTER TABLE project
            ADD COLUMN start_date VARCHAR(20) NULL AFTER links;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'end_date'
    ) THEN
        ALTER TABLE project
            ADD COLUMN end_date VARCHAR(20) NULL AFTER start_date;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'features'
    ) THEN
        ALTER TABLE project
            ADD COLUMN features JSON NULL AFTER end_date;
        UPDATE project SET features = JSON_ARRAY() WHERE features IS NULL;
        ALTER TABLE project
            MODIFY COLUMN features JSON NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND column_name = 'tags'
          AND is_nullable = 'YES'
    ) THEN
        UPDATE project SET tags = JSON_ARRAY() WHERE tags IS NULL;
        ALTER TABLE project
            MODIFY COLUMN tags JSON NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'portfolio'
          AND index_name = 'idx_portfolio_user'
    ) THEN
        CREATE INDEX idx_portfolio_user ON portfolio (user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'portfolio'
          AND index_name = 'idx_portfolio_order'
    ) THEN
        CREATE INDEX idx_portfolio_order ON portfolio (user_id, `order`);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND index_name = 'idx_item_portfolio'
    ) THEN
        CREATE INDEX idx_item_portfolio ON project (portfolio_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND index_name = 'idx_item_order'
    ) THEN
        CREATE INDEX idx_item_order ON project (portfolio_id, `order`);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'upload_file'
          AND index_name = 'idx_upload_file_user'
    ) THEN
        CREATE INDEX idx_upload_file_user ON upload_file (user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'cors_origin'
          AND index_name = 'idx_cors_server_code'
    ) THEN
        CREATE INDEX idx_cors_server_code ON cors_origin (server_code);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = 'user'
          AND constraint_name = 'username'
    ) THEN
        ALTER TABLE `user`
            ADD CONSTRAINT username UNIQUE (username);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = 'user'
          AND constraint_name = 'email'
    ) THEN
        ALTER TABLE `user`
            ADD CONSTRAINT email UNIQUE (email);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = 'upload_file'
          AND constraint_name = 'uuid'
    ) THEN
        ALTER TABLE upload_file
            ADD CONSTRAINT uuid UNIQUE (uuid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = 'upload_file'
          AND constraint_name = 'stored_filename'
    ) THEN
        ALTER TABLE upload_file
            ADD CONSTRAINT stored_filename UNIQUE (stored_filename);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = 'portfolio'
          AND constraint_name = 'uq_user_portfolio_code'
    ) THEN
        ALTER TABLE portfolio
            ADD CONSTRAINT uq_user_portfolio_code UNIQUE (user_id, code);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = 'project'
          AND constraint_name = 'uq_portfolio_item_code'
    ) THEN
        ALTER TABLE project
            ADD CONSTRAINT uq_portfolio_item_code UNIQUE (portfolio_id, code);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = 'cors_origin'
          AND constraint_name = 'uq_cors_server_origin'
    ) THEN
        ALTER TABLE cors_origin
            ADD CONSTRAINT uq_cors_server_origin UNIQUE (server_code, origin);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.referential_constraints
        WHERE constraint_schema = DATABASE()
          AND table_name = 'portfolio'
          AND constraint_name = 'portfolio_ibfk_1'
    ) THEN
        ALTER TABLE portfolio
            ADD CONSTRAINT portfolio_ibfk_1
            FOREIGN KEY (user_id) REFERENCES `user` (id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.referential_constraints
        WHERE constraint_schema = DATABASE()
          AND table_name = 'portfolio'
          AND constraint_name = 'portfolio_ibfk_2'
    ) THEN
        ALTER TABLE portfolio
            ADD CONSTRAINT portfolio_ibfk_2
            FOREIGN KEY (file_uuid) REFERENCES upload_file (uuid)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.referential_constraints
        WHERE constraint_schema = DATABASE()
          AND table_name = 'project'
          AND constraint_name = 'project_ibfk_1'
    ) THEN
        ALTER TABLE project
            ADD CONSTRAINT project_ibfk_1
            FOREIGN KEY (portfolio_id) REFERENCES portfolio (id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.referential_constraints
        WHERE constraint_schema = DATABASE()
          AND table_name = 'upload_file'
          AND constraint_name = 'upload_file_ibfk_1'
    ) THEN
        ALTER TABLE upload_file
            ADD CONSTRAINT upload_file_ibfk_1
            FOREIGN KEY (user_id) REFERENCES `user` (id)
            ON DELETE CASCADE;
    END IF;
END$$

DELIMITER ;

CALL sync_portfolio_schema_20260622();

DROP PROCEDURE sync_portfolio_schema_20260622;

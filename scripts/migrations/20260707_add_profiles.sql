-- ============================================
-- Migration: add profile schema and portfolio profile link
-- Created: 2026-07-07
--
-- Source of truth:
--   - portfolio_project_server_flask/models.py
--
-- Compared against MCP MySQL database `portfolio` on 2026-07-07:
--   - Missing table: profile
--   - Missing column: portfolio.profile_id
--   - Missing FK: portfolio.profile_id -> profile.id ON DELETE SET NULL
--
-- Notes:
--   - Idempotent for partially migrated databases.
--   - Run against the selected portfolio database.
-- ============================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS profile (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    headline VARCHAR(200) NULL,
    bio TEXT NULL,
    avatar_file_uuid VARCHAR(32) NULL,
    links JSON NOT NULL,
    extra_fields JSON NOT NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_profile_user (user_id),
    KEY idx_profile_default (user_id, is_default),
    KEY avatar_file_uuid (avatar_file_uuid),
    CONSTRAINT profile_ibfk_1
        FOREIGN KEY (user_id) REFERENCES `user` (id)
        ON DELETE CASCADE,
    CONSTRAINT profile_ibfk_2
        FOREIGN KEY (avatar_file_uuid) REFERENCES upload_file (uuid)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sync_profile_schema_20260707;

DELIMITER $$

CREATE PROCEDURE sync_profile_schema_20260707()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'profile'
          AND column_name = 'email'
    ) THEN
        ALTER TABLE profile
            ADD COLUMN email VARCHAR(255) NULL AFTER display_name;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'profile'
          AND column_name = 'extra_fields'
    ) THEN
        ALTER TABLE profile
            ADD COLUMN extra_fields JSON NULL AFTER links;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'profile'
          AND column_name = 'links'
          AND is_nullable = 'YES'
    ) THEN
        UPDATE profile SET links = JSON_ARRAY() WHERE links IS NULL;
        ALTER TABLE profile
            MODIFY COLUMN links JSON NOT NULL;
    END IF;

    UPDATE profile SET extra_fields = JSON_ARRAY() WHERE extra_fields IS NULL;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'profile'
          AND column_name = 'extra_fields'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE profile
            MODIFY COLUMN extra_fields JSON NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'profile'
          AND index_name = 'idx_profile_user'
    ) THEN
        CREATE INDEX idx_profile_user ON profile (user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'profile'
          AND index_name = 'idx_profile_default'
    ) THEN
        CREATE INDEX idx_profile_default ON profile (user_id, is_default);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'profile'
          AND index_name = 'avatar_file_uuid'
    ) THEN
        CREATE INDEX avatar_file_uuid ON profile (avatar_file_uuid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE()
          AND table_name = 'profile'
          AND column_name = 'user_id'
          AND referenced_table_name = 'user'
          AND referenced_column_name = 'id'
    ) THEN
        ALTER TABLE profile
            ADD CONSTRAINT profile_ibfk_1
            FOREIGN KEY (user_id) REFERENCES `user` (id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE()
          AND table_name = 'profile'
          AND column_name = 'avatar_file_uuid'
          AND referenced_table_name = 'upload_file'
          AND referenced_column_name = 'uuid'
    ) THEN
        ALTER TABLE profile
            ADD CONSTRAINT profile_ibfk_2
            FOREIGN KEY (avatar_file_uuid) REFERENCES upload_file (uuid)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'portfolio'
          AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE portfolio
            ADD COLUMN profile_id INT NULL AFTER user_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'portfolio'
          AND index_name = 'idx_portfolio_profile'
    ) THEN
        CREATE INDEX idx_portfolio_profile ON portfolio (profile_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.key_column_usage
        WHERE constraint_schema = DATABASE()
          AND table_name = 'portfolio'
          AND column_name = 'profile_id'
          AND referenced_table_name = 'profile'
          AND referenced_column_name = 'id'
    ) THEN
        ALTER TABLE portfolio
            ADD CONSTRAINT portfolio_profile_fk
            FOREIGN KEY (profile_id) REFERENCES profile (id)
            ON DELETE SET NULL;
    END IF;
END$$

DELIMITER ;

CALL sync_profile_schema_20260707();

DROP PROCEDURE sync_profile_schema_20260707;

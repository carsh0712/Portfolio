CREATE TABLE IF NOT EXISTS profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    headline VARCHAR(200) NULL,
    bio TEXT NULL,
    avatar_file_uuid VARCHAR(32) NULL,
    links JSON NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    KEY idx_profile_user (user_id),
    KEY idx_profile_default (user_id, is_default),
    CONSTRAINT profile_ibfk_1
        FOREIGN KEY (user_id) REFERENCES user (id)
        ON DELETE CASCADE,
    CONSTRAINT profile_ibfk_2
        FOREIGN KEY (avatar_file_uuid) REFERENCES upload_file (uuid)
        ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @portfolio_profile_column_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'portfolio'
      AND column_name = 'profile_id'
);

SET @portfolio_profile_sql := IF(
    @portfolio_profile_column_exists = 0,
    'ALTER TABLE portfolio ADD COLUMN profile_id INT NULL AFTER user_id',
    'SELECT 1'
);
PREPARE stmt FROM @portfolio_profile_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @portfolio_profile_index_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'portfolio'
      AND index_name = 'idx_portfolio_profile'
);

SET @portfolio_profile_index_sql := IF(
    @portfolio_profile_index_exists = 0,
    'CREATE INDEX idx_portfolio_profile ON portfolio (profile_id)',
    'SELECT 1'
);
PREPARE stmt FROM @portfolio_profile_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @portfolio_profile_fk_exists := (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = 'portfolio'
      AND constraint_name = 'portfolio_profile_fk'
      AND constraint_type = 'FOREIGN KEY'
);

SET @portfolio_profile_fk_sql := IF(
    @portfolio_profile_fk_exists = 0,
    'ALTER TABLE portfolio ADD CONSTRAINT portfolio_profile_fk FOREIGN KEY (profile_id) REFERENCES profile (id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @portfolio_profile_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

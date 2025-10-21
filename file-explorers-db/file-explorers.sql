CREATE DATABASE IF NOT EXISTS file_explorers;
GRANT ALL PRIVILEGES ON file_explorers.* TO 'nejc'@'%';

USE file_explorers;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, password_hash)
VALUES (
    'demo_user',
    'demo@example.com',
    '$2a$14$xFvq6IkBm8fp19GsEd24zONSMyUHVvcsZnFb9xpX//s0fr6ekoFpG'
);

CREATE TABLE IF NOT EXISTS levels (
    level_Id INT AUTO_INCREMENT PRIMARY KEY,
    level_data JSON NOT NULL
);

INSERT INTO levels (level_data) VALUES (
    '{
        "name": "Demo Level",
        "difficulty": "easy",
        "layout": [[0,1,0],[1,0,1],[0,1,0]],
        "description": "This is a demo level."
    }'
);

CREATE TABLE IF NOT EXISTS user_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    level_id INT NOT NULL,
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UNIQUE KEY uniq_user_level (user_id, level_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (level_id) REFERENCES levels(level_Id)
);

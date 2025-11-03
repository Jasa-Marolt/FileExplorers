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
    level_data JSON NOT NULL,
    name VARCHAR(100) DEFAULT "",
    description TEXT,
    difficulty INT DEFAULT 1,
    instructions TEXT
);

INSERT INTO levels (level_data, name, description, difficulty, instructions) VALUES 
    ('[
        {
            "id": 0,
            "name": "guide.txt",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 1,
            "name": "Folder1",
            "isDirectory": true,
            "parentDirectoryId": null
        },
        {
            "id": 2,
            "name": "Folder2",
            "isDirectory": true,
            "parentDirectoryId": 1
        },
        {
            "id": 3,
            "name": "message.txt",
            "isDirectory": false,
            "parentDirectoryId": 2
        }
    ]', 'Level 1', 'A simple level with nested folders.', 1, 'Find the message.txt file inside Folder2.'),
    ('[
        {
            "id": 0,
            "name": "guide.txt",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 1,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 2,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 3,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 4,
            "name": "Folder1",
            "isDirectory": true,
            "parentDirectoryId": null
        }
    ]', 'Level 2', 'Multiple files with the same name.', 2, 'Identify the correct Civilian file.'),
    ('[
        {
            "id": 0,
            "name": "guide.txt",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 1,
            "name": "Zombie",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 2,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 3,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 4,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        }
    ]', 'Level 3', 'Distinguishing between similar files.', 2, 'Find the Zombie file among Civilians.'),
    ('[
        {
            "id": 0,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 1,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": null
        },
        {
            "id": 2,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 1
        },
        {
            "id": 3,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 2
        },
        {
            "id": 4,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 3
        },
        {
            "id": 5,
            "name": "end.txt",
            "isDirectory": false,
            "parentDirectoryId": 4
        }
    ]', 'Level 4', 'Deeply nested folders.', 3, 'Locate the end.txt file at the deepest level.'),
    ('[
        {
            "id": 0,
            "name": "guide.txt",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 1,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 2,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 3,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        },
        {
            "id": 4,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": null
        }
    ]', 'Level 5', 'All files look the same.', 1, 'Find the unique Civilian file.'),
    ('[
        {
            "id": 0,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": null
        },
        {
            "id": 1,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 0
        },
        {
            "id": 2,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 1
        },
        {
            "id": 3,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 2
        },
        {
            "id": 4,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 3
        },
        {
            "id": 5,
            "name": "New Folder",
            "isDirectory": true,
            "parentDirectoryId": 4
        },

        {
            "id": 6,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": null
        },
        {
            "id": 7,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 6
        },
        {
            "id": 8,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 7
        },
        {
            "id": 9,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 8
        },
        {
            "id": 10,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 9
        },
        {
            "id": 11,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 10
        },
        {
            "id": 12,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": null
        },
        {
            "id": 13,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 12
        },
        {
            "id": 14,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 13
        },
        {
            "id": 15,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 14
        },
        {
            "id": 16,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 15
        },
        {
            "id": 17,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 16
        },
        {
            "id": 18,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": null
        },
        {
            "id": 19,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 18
        },
        {
            "id": 20,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 19
        },
        {
            "id": 21,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 20
        },
        {
            "id": 22,
            "name": "New folder",
            "isDirectory": true,
            "parentDirectoryId": 21
        },
        {
            "id": 23,
            "name": "Civilian",
            "isDirectory": false,
            "parentDirectoryId": 22
        }
    ]', 'Level 6', 'Extremely deep nesting.', 4, 'Find the Civilian file at the deepest level.');

CREATE TABLE IF NOT EXISTS user_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    level_id INT NOT NULL,
    solved_at TIMESTAMP DEFAULT NULL, 
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_level (user_id, level_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (level_id) REFERENCES levels(level_Id)
);

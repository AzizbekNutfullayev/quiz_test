-- sql/002_seed.sql

INSERT INTO difficulties (id, name) VALUES
(1, 'easy'),
(2, 'medium'),
(3, 'hard')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, status) VALUES
(1, 'Math', 'active'),
(2, 'English', 'active'),
(3, 'IT', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, status) VALUES
(1, 1, 'Algebra', 'active'),
(2, 1, 'Geometry', 'active'),
(3, 2, 'Grammar', 'active'),
(4, 3, 'Networking', 'active')
ON CONFLICT (id) DO NOTHING;

-- admin user
INSERT INTO users (email, role, is_banned)
VALUES ('newadmin@gmail.com', 'admin', false)
ON CONFLICT (email) DO NOTHING;

-- Math / Algebra / easy -> 10 ta
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, status)
VALUES
(1,1,1,'2 + 2 = ?', '3', '4', '5', '6', 'B', 'active'),
(1,1,1,'5 + 3 = ?', '6', '7', '8', '9', 'C', 'active'),
(1,1,1,'10 - 4 = ?', '5', '6', '7', '8', 'B', 'active'),
(1,1,1,'3 x 3 = ?', '6', '7', '8', '9', 'D', 'active'),
(1,1,1,'12 / 3 = ?', '2', '3', '4', '5', 'C', 'active'),
(1,1,1,'7 + 1 = ?', '6', '7', '8', '9', 'C', 'active'),
(1,1,1,'9 - 2 = ?', '5', '6', '7', '8', 'C', 'active'),
(1,1,1,'4 x 2 = ?', '6', '7', '8', '9', 'C', 'active'),
(1,1,1,'15 / 5 = ?', '2', '3', '4', '5', 'B', 'active'),
(1,1,1,'6 + 2 = ?', '7', '8', '9', '10', 'B', 'active');

-- Math / Algebra / medium -> 10 ta
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, status)
VALUES
(1,1,2,'x + 5 = 9, x = ?', '2', '3', '4', '5', 'C', 'active'),
(1,1,2,'2x = 12, x = ?', '5', '6', '7', '8', 'B', 'active'),
(1,1,2,'x - 3 = 7, x = ?', '9', '10', '11', '12', 'B', 'active'),
(1,1,2,'3x = 15, x = ?', '3', '4', '5', '6', 'C', 'active'),
(1,1,2,'x / 2 = 6, x = ?', '10', '11', '12', '13', 'C', 'active'),
(1,1,2,'x + 8 = 14, x = ?', '4', '5', '6', '7', 'C', 'active'),
(1,1,2,'x - 6 = 2, x = ?', '6', '7', '8', '9', 'C', 'active'),
(1,1,2,'4x = 20, x = ?', '4', '5', '6', '7', 'B', 'active'),
(1,1,2,'18 / x = 3, x = ?', '5', '6', '7', '8', 'B', 'active'),
(1,1,2,'x + 1 = 10, x = ?', '7', '8', '9', '10', 'C', 'active');

-- English / Grammar / easy -> 10 ta
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, status)
VALUES
(2,3,1,'Choose the correct word: She ___ a student.', 'am', 'is', 'are', 'be', 'B', 'active'),
(2,3,1,'Choose the correct word: They ___ happy.', 'is', 'am', 'are', 'be', 'C', 'active'),
(2,3,1,'Choose the correct word: I ___ from Uzbekistan.', 'am', 'is', 'are', 'be', 'A', 'active'),
(2,3,1,'Choose the correct word: He ___ my friend.', 'am', 'is', 'are', 'be', 'B', 'active'),
(2,3,1,'Choose the correct word: We ___ ready.', 'am', 'is', 'are', 'be', 'C', 'active'),
(2,3,1,'Choose the plural form of "book".', 'books', 'bookes', 'bookies', 'booken', 'A', 'active'),
(2,3,1,'Choose the correct article: ___ apple', 'a', 'an', 'the', 'no article', 'B', 'active'),
(2,3,1,'Choose the correct article: ___ car', 'a', 'an', 'the', 'no article', 'A', 'active'),
(2,3,1,'Which is a pronoun?', 'run', 'beautiful', 'they', 'quickly', 'C', 'active'),
(2,3,1,'Which word is a verb?', 'eat', 'blue', 'table', 'small', 'A', 'active');

-- IT / Networking / easy -> 10 ta
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, status)
VALUES
(3,4,1,'What does IP stand for?', 'Internet Protocol', 'Internal Program', 'Input Process', 'Internet Port', 'A', 'active'),
(3,4,1,'Which device connects networks?', 'Monitor', 'Router', 'Keyboard', 'Mouse', 'B', 'active'),
(3,4,1,'Which cable is commonly used in LAN?', 'HDMI', 'USB', 'Ethernet', 'VGA', 'C', 'active'),
(3,4,1,'What does LAN mean?', 'Local Area Network', 'Large Access Node', 'Long Area Network', 'Light Access Network', 'A', 'active'),
(3,4,1,'Which one is a private IP?', '8.8.8.8', '192.168.1.1', '1.1.1.1', '17.172.224.47', 'B', 'active'),
(3,4,1,'What device forwards packets?', 'Router', 'Printer', 'Scanner', 'Speaker', 'A', 'active'),
(3,4,1,'Wi-Fi is a type of...', 'Wired network', 'Wireless network', 'Storage', 'CPU', 'B', 'active'),
(3,4,1,'Which protocol is used for web pages?', 'HTTP', 'FTP', 'SSH', 'SMTP', 'A', 'active'),
(3,4,1,'Which one is a browser?', 'Chrome', 'Linux', 'MySQL', 'Windows', 'A', 'active'),
(3,4,1,'DNS converts domain names to...', 'Passwords', 'IP addresses', 'Ports', 'Files', 'B', 'active');
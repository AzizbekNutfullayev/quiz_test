-- =========================================
-- 002_seed.sql
-- Quiz Platform Backend Seed Data
-- =========================================

-- =========================================
-- DIFFICULTIES
-- =========================================
INSERT INTO difficulties (id, name) VALUES
(1, 'easy'),
(2, 'medium'),
(3, 'hard')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- CATEGORIES
-- =========================================
INSERT INTO categories (id, name, status) VALUES
(1, 'Math', 'active'),
(2, 'English', 'active'),
(3, 'IT', 'active')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- SUBCATEGORIES
-- =========================================
INSERT INTO subcategories (id, category_id, name, status) VALUES
(1, 1, 'Algebra', 'active'),
(2, 1, 'Geometry', 'active'),
(3, 2, 'Grammar', 'active'),
(4, 3, 'Networking', 'active')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- ADMIN USER
-- =========================================
INSERT INTO users (email, role, is_banned)
VALUES
('newadmin@gmail.com', 'admin', FALSE)
ON CONFLICT (email) DO NOTHING;

-- =========================================
-- PREMIUM PLANS
-- =========================================
INSERT INTO plans (id, name, duration_days, price, currency, is_active) VALUES
(1, '1 Month Premium', 30, 29000, 'UZS', TRUE),
(2, '3 Months Premium', 90, 79000, 'UZS', TRUE),
(3, '1 Year Premium', 365, 249000, 'UZS', TRUE)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- QUESTIONS
-- =========================================

-- -------------------------
-- Math / Algebra / Easy
-- category_id = 1
-- subcategory_id = 1
-- difficulty_id = 1
-- -------------------------
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url, status)
VALUES
(1, 1, 1, '2 + 2 nechchi?', '3', '4', '5', '6', 'B', NULL, 'active'),
(1, 1, 1, '5 + 3 nechchi?', '6', '7', '8', '9', 'C', NULL, 'active'),
(1, 1, 1, '10 - 4 nechchi?', '5', '6', '7', '8', 'B', NULL, 'active'),
(1, 1, 1, '3 x 3 nechchi?', '6', '7', '8', '9', 'D', NULL, 'active'),
(1, 1, 1, '12 / 3 nechchi?', '2', '3', '4', '5', 'C', NULL, 'active'),
(1, 1, 1, '7 + 1 nechchi?', '6', '7', '8', '9', 'C', NULL, 'active'),
(1, 1, 1, '9 - 2 nechchi?', '5', '6', '7', '8', 'C', NULL, 'active'),
(1, 1, 1, '4 x 2 nechchi?', '6', '7', '8', '9', 'C', NULL, 'active'),
(1, 1, 1, '15 / 5 nechchi?', '2', '3', '4', '5', 'B', NULL, 'active'),
(1, 1, 1, '6 + 2 nechchi?', '7', '8', '9', '10', 'B', NULL, 'active');

-- -------------------------
-- Math / Algebra / Medium
-- category_id = 1
-- subcategory_id = 1
-- difficulty_id = 2
-- -------------------------
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url, status)
VALUES
(1, 1, 2, 'x + 5 = 9, x nechchi?', '2', '3', '4', '5', 'C', NULL, 'active'),
(1, 1, 2, '2x = 12, x nechchi?', '5', '6', '7', '8', 'B', NULL, 'active'),
(1, 1, 2, 'x - 3 = 7, x nechchi?', '9', '10', '11', '12', 'B', NULL, 'active'),
(1, 1, 2, '3x = 15, x nechchi?', '3', '4', '5', '6', 'C', NULL, 'active'),
(1, 1, 2, 'x / 2 = 6, x nechchi?', '10', '11', '12', '13', 'C', NULL, 'active'),
(1, 1, 2, 'x + 8 = 14, x nechchi?', '4', '5', '6', '7', 'C', NULL, 'active'),
(1, 1, 2, 'x - 6 = 2, x nechchi?', '6', '7', '8', '9', 'C', NULL, 'active'),
(1, 1, 2, '4x = 20, x nechchi?', '4', '5', '6', '7', 'B', NULL, 'active'),
(1, 1, 2, '18 / x = 3, x nechchi?', '5', '6', '7', '8', 'B', NULL, 'active'),
(1, 1, 2, 'x + 1 = 10, x nechchi?', '7', '8', '9', '10', 'C', NULL, 'active');

-- -------------------------
-- Math / Algebra / Hard
-- category_id = 1
-- subcategory_id = 1
-- difficulty_id = 3
-- -------------------------
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url, status)
VALUES
(1, 1, 3, '2x + 3 = 11, x nechchi?', '2', '3', '4', '5', 'C', NULL, 'active'),
(1, 1, 3, '3x - 6 = 9, x nechchi?', '4', '5', '6', '7', 'B', NULL, 'active'),
(1, 1, 3, '5x = 45, x nechchi?', '7', '8', '9', '10', 'C', NULL, 'active'),
(1, 1, 3, 'x/4 = 5, x nechchi?', '16', '18', '20', '22', 'C', NULL, 'active'),
(1, 1, 3, '7x = 49, x nechchi?', '5', '6', '7', '8', 'C', NULL, 'active'),
(1, 1, 3, 'x^2 = 25, musbat x nechchi?', '3', '4', '5', '6', 'C', NULL, 'active'),
(1, 1, 3, '2x - 4 = 10, x nechchi?', '6', '7', '8', '9', 'B', NULL, 'active'),
(1, 1, 3, '9x = 81, x nechchi?', '7', '8', '9', '10', 'C', NULL, 'active'),
(1, 1, 3, 'x + x = 14, x nechchi?', '5', '6', '7', '8', 'C', NULL, 'active'),
(1, 1, 3, 'x - 12 = 8, x nechchi?', '18', '19', '20', '21', 'C', NULL, 'active');

-- -------------------------
-- English / Grammar / Easy
-- category_id = 2
-- subcategory_id = 3
-- difficulty_id = 1
-- -------------------------
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url, status)
VALUES
(2, 3, 1, 'Choose the correct word: She ___ a student.', 'am', 'is', 'are', 'be', 'B', NULL, 'active'),
(2, 3, 1, 'Choose the correct word: They ___ happy.', 'is', 'am', 'are', 'be', 'C', NULL, 'active'),
(2, 3, 1, 'Choose the correct word: I ___ from Uzbekistan.', 'am', 'is', 'are', 'be', 'A', NULL, 'active'),
(2, 3, 1, 'Choose the correct word: He ___ my friend.', 'am', 'is', 'are', 'be', 'B', NULL, 'active'),
(2, 3, 1, 'Choose the correct word: We ___ ready.', 'am', 'is', 'are', 'be', 'C', NULL, 'active'),
(2, 3, 1, 'Choose the plural form of "book".', 'books', 'bookes', 'bookies', 'booken', 'A', NULL, 'active'),
(2, 3, 1, 'Choose the correct article: ___ apple', 'a', 'an', 'the', 'no article', 'B', NULL, 'active'),
(2, 3, 1, 'Choose the correct article: ___ car', 'a', 'an', 'the', 'no article', 'A', NULL, 'active'),
(2, 3, 1, 'Which is a pronoun?', 'run', 'beautiful', 'they', 'quickly', 'C', NULL, 'active'),
(2, 3, 1, 'Which word is a verb?', 'eat', 'blue', 'table', 'small', 'A', NULL, 'active');

-- -------------------------
-- IT / Networking / Easy
-- category_id = 3
-- subcategory_id = 4
-- difficulty_id = 1
-- -------------------------
INSERT INTO questions
(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url, status)
VALUES
(3, 4, 1, 'What does IP stand for?', 'Internet Protocol', 'Internal Program', 'Input Process', 'Internet Port', 'A', NULL, 'active'),
(3, 4, 1, 'Which device connects networks?', 'Monitor', 'Router', 'Keyboard', 'Mouse', 'B', NULL, 'active'),
(3, 4, 1, 'Which cable is commonly used in LAN?', 'HDMI', 'USB', 'Ethernet', 'VGA', 'C', NULL, 'active'),
(3, 4, 1, 'What does LAN mean?', 'Local Area Network', 'Large Access Node', 'Long Area Network', 'Light Access Network', 'A', NULL, 'active'),
(3, 4, 1, 'Which one is a private IP?', '8.8.8.8', '192.168.1.1', '1.1.1.1', '17.172.224.47', 'B', NULL, 'active'),
(3, 4, 1, 'What device forwards packets?', 'Router', 'Printer', 'Scanner', 'Speaker', 'A', NULL, 'active'),
(3, 4, 1, 'Wi-Fi is a type of...', 'Wired network', 'Wireless network', 'Storage', 'CPU', 'B', NULL, 'active'),
(3, 4, 1, 'Which protocol is used for web pages?', 'HTTP', 'FTP', 'SSH', 'SMTP', 'A', NULL, 'active'),
(3, 4, 1, 'Which one is a browser?', 'Chrome', 'Linux', 'MySQL', 'Windows', 'A', NULL, 'active'),
(3, 4, 1, 'DNS converts domain names to...', 'Passwords', 'IP addresses', 'Ports', 'Files', 'B', NULL, 'active');
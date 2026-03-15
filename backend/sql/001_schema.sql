-- =========================================
-- 001_schema.sql
-- Quiz Platform Backend Full Schema
-- =========================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================
-- DROP OLD TABLES
-- =========================================
DROP TABLE IF EXISTS attempt_answers CASCADE;
DROP TABLE IF EXISTS attempt_questions CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;

DROP TABLE IF EXISTS user_questions CASCADE;

DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS difficulties CASCADE;

DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    premium_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================
-- OTPS
-- =========================================
CREATE TABLE otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otps_email ON otps(email);

-- =========================================
-- DIFFICULTIES
-- =========================================
CREATE TABLE difficulties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_categories_status CHECK (status IN ('active', 'inactive'))
);

-- =========================================
-- SUBCATEGORIES
-- =========================================
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_subcategories_status CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);

-- =========================================
-- QUESTIONS (ADMIN QUESTIONS)
-- =========================================
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    subcategory_id INTEGER NULL REFERENCES subcategories(id) ON DELETE SET NULL,
    difficulty_id INTEGER NOT NULL REFERENCES difficulties(id),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL,
    image_url TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_questions_correct_option CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    CONSTRAINT chk_questions_status CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_questions_subcategory_id ON questions(subcategory_id);
CREATE INDEX idx_questions_difficulty_id ON questions(difficulty_id);
CREATE INDEX idx_questions_status ON questions(status);

-- =========================================
-- QUIZ ATTEMPTS
-- =========================================
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    subcategory_id INTEGER NULL REFERENCES subcategories(id),
    difficulty_id INTEGER NOT NULL REFERENCES difficulties(id),
    total_questions INTEGER NOT NULL,
    time_per_question_sec INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP NULL,
    CONSTRAINT chk_quiz_attempts_status CHECK (status IN ('in_progress', 'finished'))
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_category_id ON quiz_attempts(category_id);
CREATE INDEX idx_quiz_attempts_finished_at ON quiz_attempts(finished_at);

-- =========================================
-- ATTEMPT QUESTIONS (SNAPSHOT)
-- =========================================
CREATE TABLE attempt_questions (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    question_id INTEGER NULL REFERENCES questions(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    image_url TEXT NULL,
    correct_option CHAR(1) NOT NULL,
    CONSTRAINT chk_attempt_questions_correct_option CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    CONSTRAINT uq_attempt_questions UNIQUE (attempt_id, order_index)
);

CREATE INDEX idx_attempt_questions_attempt_id ON attempt_questions(attempt_id);

-- =========================================
-- ATTEMPT ANSWERS
-- =========================================
CREATE TABLE attempt_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    selected_option CHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken_sec INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_attempt_answers_selected_option CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    CONSTRAINT uq_attempt_answers UNIQUE (attempt_id, order_index)
);

CREATE INDEX idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);

-- =========================================
-- PREMIUM PLANS
-- =========================================
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================
-- PAYMENTS
-- =========================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES plans(id),
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
    provider VARCHAR(50) NOT NULL DEFAULT 'manual',
    provider_transaction_id VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'paid',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP NULL
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_plan_id ON payments(plan_id);

-- =========================================
-- SUBSCRIPTIONS
-- =========================================
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES plans(id),
    payment_id INTEGER NULL REFERENCES payments(id) ON DELETE SET NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_subscriptions_status CHECK (status IN ('active', 'expired', 'cancelled'))
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- =========================================
-- PREMIUM USER QUESTIONS
-- =========================================
CREATE TABLE user_questions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL,
    difficulty_id INTEGER NULL REFERENCES difficulties(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_questions_correct_option CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    CONSTRAINT chk_user_questions_status CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_user_questions_user_id ON user_questions(user_id);

CREATE TABLE IF NOT EXISTS battles (
    id SERIAL PRIMARY KEY,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    source_type VARCHAR(30) NOT NULL DEFAULT 'system',
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_battles_status CHECK (status IN ('pending', 'accepted', 'in_progress', 'finished', 'cancelled')),
    CONSTRAINT chk_battles_source_type CHECK (source_type IN ('system', 'premium_custom'))
);

CREATE TABLE IF NOT EXISTS battle_questions (
    id SERIAL PRIMARY KEY,
    battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    question_source VARCHAR(20) NOT NULL DEFAULT 'admin',
    question_id INTEGER NULL REFERENCES questions(id) ON DELETE SET NULL,
    user_question_id INTEGER NULL REFERENCES user_questions(id) ON DELETE SET NULL,

    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL,

    CONSTRAINT chk_battle_questions_source CHECK (question_source IN ('admin', 'user')),
    CONSTRAINT chk_battle_questions_correct CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    CONSTRAINT uq_battle_questions UNIQUE (battle_id, order_index)


    CREATE TABLE IF NOT EXISTS battle_answers (
    id SERIAL PRIMARY KEY,
    battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    selected_option CHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken_sec INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_battle_answers_selected CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    CONSTRAINT uq_battle_answers UNIQUE (battle_id, user_id, order_index)
);


CREATE TABLE IF NOT EXISTS battle_results (
    id SERIAL PRIMARY KEY,
    battle_id INTEGER NOT NULL UNIQUE REFERENCES battles(id) ON DELETE CASCADE,
    player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player1_correct INTEGER NOT NULL DEFAULT 0,
    player2_correct INTEGER NOT NULL DEFAULT 0,
    winner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    result_type VARCHAR(20) NOT NULL DEFAULT 'draw',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_battle_result_type CHECK (result_type IN ('player1', 'player2', 'draw'))
);
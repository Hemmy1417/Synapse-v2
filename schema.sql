-- ============================================================
-- Synapse — Database Schema
-- Compatible with: PostgreSQL 14+
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ───────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50)  NOT NULL UNIQUE,
  display_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  avatar_url    TEXT,
  reputation    INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Agents ──────────────────────────────────────────────────
CREATE TABLE agents (
  id            VARCHAR(50)  PRIMARY KEY,           -- e.g. 'analyst', 'skeptic'
  name          VARCHAR(100) NOT NULL,
  symbol        VARCHAR(10)  NOT NULL,
  description   TEXT,
  system_prompt TEXT         NOT NULL,
  color         VARCHAR(20),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed agents
INSERT INTO agents (id, name, symbol, description, system_prompt, color) VALUES
  ('analyst',    'Analyst',    '◈', 'Data-driven systematic thinker',       'You are the Analyst agent...', '#4A9EFF'),
  ('skeptic',    'Skeptic',    '◇', 'Challenges assumptions',               'You are the Skeptic agent...', '#FF6B6B'),
  ('optimist',   'Optimist',   '◉', 'Surfaces opportunities and upsides',   'You are the Optimist agent...','#52D68A'),
  ('researcher', 'Researcher', '◎', 'Connects discussion to established knowledge', 'You are the Researcher agent...', '#FFB347');

-- ── Decision Threads ─────────────────────────────────────────
CREATE TYPE thread_status AS ENUM ('Open', 'In Discussion', 'Consensus Reached', 'Archived');
CREATE TYPE thread_category AS ENUM ('governance', 'economics', 'policy', 'tech', 'finance', 'personal', 'science', 'ethics');

CREATE TABLE decision_threads (
  id                UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             VARCHAR(300)   NOT NULL,
  description       TEXT,
  category          thread_category NOT NULL DEFAULT 'tech',
  creator_id        UUID           REFERENCES users(id) ON DELETE SET NULL,
  creator_name      VARCHAR(100),                          -- denormalized for anon users
  status            thread_status  NOT NULL DEFAULT 'Open',
  consensus_score   SMALLINT       NOT NULL DEFAULT 0 CHECK (consensus_score BETWEEN 0 AND 100),
  contribution_count INTEGER       NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threads_status      ON decision_threads(status);
CREATE INDEX idx_threads_created     ON decision_threads(created_at DESC);
CREATE INDEX idx_threads_consensus   ON decision_threads(consensus_score DESC);
CREATE INDEX idx_threads_category    ON decision_threads(category);

-- ── Contributions ────────────────────────────────────────────
CREATE TYPE sentiment_type AS ENUM ('support', 'neutral', 'oppose');

CREATE TABLE contributions (
  id            UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id     UUID            NOT NULL REFERENCES decision_threads(id) ON DELETE CASCADE,
  -- Author — one of these will be set
  user_id       UUID            REFERENCES users(id) ON DELETE SET NULL,
  author_name   VARCHAR(100),                             -- for anonymous / display
  agent_id      VARCHAR(50)     REFERENCES agents(id) ON DELETE SET NULL,
  -- Structured content
  claim         TEXT            NOT NULL,
  reasoning     TEXT            NOT NULL,
  evidence      TEXT,
  confidence    SMALLINT        NOT NULL DEFAULT 60 CHECK (confidence BETWEEN 0 AND 100),
  sentiment     sentiment_type  NOT NULL DEFAULT 'neutral',
  -- Metadata
  parent_id     UUID            REFERENCES contributions(id) ON DELETE SET NULL,  -- for threading
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_author CHECK (user_id IS NOT NULL OR agent_id IS NOT NULL OR author_name IS NOT NULL)
);

CREATE INDEX idx_contribs_thread     ON contributions(thread_id, created_at);
CREATE INDEX idx_contribs_agent      ON contributions(agent_id);
CREATE INDEX idx_contribs_sentiment  ON contributions(thread_id, sentiment);

-- ── Votes / Agreement Signals ────────────────────────────────
CREATE TYPE vote_type AS ENUM ('agree', 'disagree', 'insightful', 'flawed');

CREATE TABLE votes (
  id               UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
  contribution_id  UUID       NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  user_id          UUID       REFERENCES users(id) ON DELETE CASCADE,
  vote             vote_type  NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (contribution_id, user_id)
);

CREATE INDEX idx_votes_contribution ON votes(contribution_id);
CREATE INDEX idx_votes_user         ON votes(user_id);

-- ── Consensus Snapshots ──────────────────────────────────────
CREATE TABLE consensus_snapshots (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id             UUID        NOT NULL REFERENCES decision_threads(id) ON DELETE CASCADE,
  consensus_score       SMALLINT    NOT NULL,
  support_count         INTEGER     NOT NULL DEFAULT 0,
  neutral_count         INTEGER     NOT NULL DEFAULT 0,
  oppose_count          INTEGER     NOT NULL DEFAULT 0,
  total_contributions   INTEGER     NOT NULL DEFAULT 0,
  -- AI-generated summary fields
  current_state         TEXT,
  key_argument_for      TEXT,
  key_argument_against  TEXT,
  open_questions        TEXT,
  next_steps            TEXT,
  minority_view         TEXT,
  -- Snapshot timing
  snapshot_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_thread ON consensus_snapshots(thread_id, snapshot_at DESC);

-- ── Reputation Events (bonus feature) ───────────────────────
CREATE TYPE reputation_event_type AS ENUM (
  'contribution_upvoted',
  'contribution_insightful',
  'prediction_correct',
  'thread_created',
  'consensus_contributor'
);

CREATE TABLE reputation_events (
  id          UUID                   PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID                   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  reputation_event_type  NOT NULL,
  delta       INTEGER                NOT NULL,
  source_id   UUID,                                       -- contribution or thread id
  created_at  TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rep_events_user ON reputation_events(user_id, created_at DESC);

-- ── Triggers ─────────────────────────────────────────────────

-- Auto-update thread contribution_count
CREATE OR REPLACE FUNCTION update_thread_contribution_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE decision_threads
  SET contribution_count = (
    SELECT COUNT(*) FROM contributions WHERE thread_id = NEW.thread_id
  ),
  updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_contribution_count
AFTER INSERT OR DELETE ON contributions
FOR EACH ROW EXECUTE FUNCTION update_thread_contribution_count();

-- Auto-update updated_at on threads
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_threads_updated_at
BEFORE UPDATE ON decision_threads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Escrow / Staking (added for wallet integration) ──────────

-- Tracks GEN staked per contribution submission
CREATE TABLE contribution_stakes (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  contribution_id  UUID        NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  staker_address   VARCHAR(42) NOT NULL,
  stake_gen        NUMERIC(20,8) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked','returned','slashed','rewarded')),
  reward_gen       NUMERIC(20,8) DEFAULT 0,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stakes_contribution ON contribution_stakes(contribution_id);
CREATE INDEX idx_stakes_staker       ON contribution_stakes(staker_address);

-- Tracks GEN staked per vote
CREATE TABLE vote_stakes (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  contribution_id  UUID        NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  voter_address    VARCHAR(42) NOT NULL,
  is_support       BOOLEAN     NOT NULL,
  stake_gen        NUMERIC(20,8) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked','returned','slashed','rewarded')),
  reward_gen       NUMERIC(20,8) DEFAULT 0,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contribution_id, voter_address)
);

CREATE INDEX idx_vote_stakes_contribution ON vote_stakes(contribution_id);
CREATE INDEX idx_vote_stakes_voter        ON vote_stakes(voter_address);

-- Pending claimable GEN per wallet address
CREATE TABLE escrow_pending (
  address     VARCHAR(42) PRIMARY KEY,
  pending_gen NUMERIC(20,8) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- On-chain tx log
CREATE TABLE tx_log (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash     VARCHAR(66) UNIQUE,
  from_addr   VARCHAR(42) NOT NULL,
  action      VARCHAR(100) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','failed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

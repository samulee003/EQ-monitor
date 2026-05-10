-- 今心 Bot 數據庫 Schema
-- PostgreSQL / Supabase / InsForge 兼容

CREATE TABLE IF NOT EXISTS bot_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  language TEXT DEFAULT 'zh-TW',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ,
  total_sessions INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_session_date DATE
);

CREATE TABLE IF NOT EXISTS ruler_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES bot_users(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  body_part TEXT,
  emotion_name TEXT,
  emotion_quadrant TEXT CHECK (emotion_quadrant IN ('red', 'yellow', 'blue', 'green')),
  emotion_intensity INT CHECK (emotion_intensity BETWEEN 1 AND 10),
  trigger_event TEXT,
  psychological_need TEXT,
  expression_text TEXT,
  regulation_technique TEXT CHECK (regulation_technique IN ('breathing', 'grounding54321', 'mindfulness')),
  post_mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES bot_users(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  session_id UUID REFERENCES ruler_sessions(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  message_type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  step TEXT CHECK (step IN ('idle', 'recognize', 'understand', 'label', 'express', 'regulate', 'summary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON ruler_sessions(line_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(line_user_id, created_at DESC);

-- RLS for Supabase
ALTER TABLE bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruler_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

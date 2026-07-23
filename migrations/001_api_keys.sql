CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_hash TEXT UNIQUE NOT NULL,
  user_github_id TEXT,
  plan TEXT DEFAULT 'free',
  rate_limit INTEGER DEFAULT 60,
  created_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT
);
-- 003_brew_submissions.sql
-- 匿名冲煮数据提交表 · M4 开放数据集

CREATE TABLE IF NOT EXISTS brew_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brew_id TEXT NOT NULL UNIQUE,
  origin TEXT NOT NULL,
  variety TEXT,
  process TEXT,
  roastLevel TEXT,
  brewer TEXT NOT NULL,
  grinder TEXT,
  dose REAL NOT NULL,
  waterAmount REAL NOT NULL,
  ratio TEXT,
  grindSize TEXT,
  waterTemperature REAL,
  stepsCount INTEGER NOT NULL,
  totalBrewTime REAL,
  finalYield REAL,
  measuredTDS REAL,
  submittedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brew_origin ON brew_submissions(origin);
CREATE INDEX IF NOT EXISTS idx_brew_brewer ON brew_submissions(brewer);

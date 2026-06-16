CREATE TABLE IF NOT EXISTS device_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_name TEXT NOT NULL,
  setting TEXT NOT NULL,
  micron_value INTEGER,
  description TEXT,
  UNIQUE(device_name, setting)
);

INSERT OR IGNORE INTO device_registry (device_name, setting, micron_value, description) VALUES
  ('Comandante C40', '15', 400, '细研磨，适合意式'),
  ('Comandante C40', '22', 600, '中细研磨，适合 V60'),
  ('Comandante C40', '30', 900, '粗研磨，适合法压壶'),
  ('Kinu M47', '1.5', 350, '细研磨'),
  ('Kinu M47', '3.0', 600, '中研磨'),
  ('Kinu M47', '5.0', 1000, '粗研磨'),
  ('EK43', '5', 400, '细研磨，土耳其咖啡'),
  ('EK43', '10', 700, '中研磨，手冲通用'),
  ('EK43', '15', 1100, '粗研磨，法压壶'),
  ('Fellow Ode Gen 2', '2', 400, '细研磨'),
  ('Fellow Ode Gen 2', '6', 700, '中研磨'),
  ('Fellow Ode Gen 2', '11', 1200, '粗研磨');
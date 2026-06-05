-- Схема базы данных для платформы промышленного туризма

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('tourist', 'operator', 'admin')) DEFAULT 'tourist',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  company_name TEXT,
  company_address TEXT,
  company_inn TEXT,
  company_bank TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'blocked')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Предприятия
CREATE TABLE IF NOT EXISTS enterprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  contacts TEXT,
  access_rules TEXT,
  group_min INTEGER DEFAULT 10,
  group_max INTEGER DEFAULT 50,
  ticket_price REAL DEFAULT 0,
  age_limit TEXT,
  ovz_accessible INTEGER DEFAULT 0,
  seasonality TEXT,
  photos TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Экскурсии
CREATE TABLE IF NOT EXISTS excursions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  operator_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  short_description TEXT,
  target_audience TEXT,
  route_description TEXT,
  duration_minutes INTEGER DEFAULT 120,
  seasonality TEXT,
  base_price REAL NOT NULL,
  extra_charges TEXT,
  group_min INTEGER DEFAULT 10,
  group_max INTEGER DEFAULT 20,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
  photos TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Заявки на экскурсии
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  excursion_id INTEGER NOT NULL REFERENCES excursions(id),
  requested_date DATE NOT NULL,
  requested_time TEXT,
  people_count INTEGER NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'group_not_met', 'completed')),
  ai_alternatives TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Документы
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('contract', 'invoice', 'act')),
  file_path TEXT,
  generated_text TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'generated', 'signed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Расчёты рентабельности
CREATE TABLE IF NOT EXISTS calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  excursion_id INTEGER REFERENCES excursions(id),
  people_count INTEGER NOT NULL,
  guide_cost REAL DEFAULT 2500,
  transport_cost REAL DEFAULT 0,
  enterprise_fee REAL DEFAULT 0,
  overhead_cost REAL DEFAULT 500,
  revenue REAL NOT NULL,
  profit REAL,
  profitability REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Посещения (история)
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  enterprise_id INTEGER REFERENCES enterprises(id),
  excursion_id INTEGER REFERENCES excursions(id),
  visit_date DATE,
  group_age TEXT,
  city TEXT,
  people_count INTEGER,
  status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'completed', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI рекомендации
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  request_id INTEGER REFERENCES requests(id),
  type TEXT NOT NULL CHECK(type IN ('alternatives', 'recommendations')),
  input_json TEXT,
  output_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Аудит логи
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  meta_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_excursions_enterprise ON excursions(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_excursions_operator ON excursions(operator_id);
CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_excursion ON requests(excursion_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_visits_user ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_excursion ON calculations(excursion_id);

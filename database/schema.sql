-- SQLite schema for the asset management system

-- roles (角色表)
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL -- 'system_admin', 'asset_manager', 'user'
);

-- users (使用者表)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL, -- 登入帳號
    password_hash TEXT NOT NULL,  -- 加密後的密碼
    full_name TEXT,              -- 使用者全名
    role_id INTEGER,             -- 關聯到角色表
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- categories (資產分類表)
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER, -- 指向父分類的 ID，若為 NULL 則為頂層分類
    description TEXT,
    FOREIGN KEY (parent_id) REFERENCES categories (id)
);

-- assets (資產主表)
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unique_code TEXT UNIQUE NOT NULL,
    asset_type TEXT DEFAULT 'flexible',
    category_id INTEGER,
    features TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'available',
    current_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (current_user_id) REFERENCES users (id)
);

-- asset_history (資產歷史紀錄表)
CREATE TABLE asset_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- e.g., 'created', 'updated', 'checked_out', 'checked_in', 'retired'
    user_id INTEGER, -- User who performed the action
    details TEXT, -- e.g., JSON string of what was changed
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- category_managers (分類管理者對應表)
CREATE TABLE category_managers (
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

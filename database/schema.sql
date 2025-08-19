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
    name TEXT NOT NULL,                    -- 名稱 (圓規)
    unique_code TEXT UNIQUE NOT NULL,      -- 唯一編號 (系統生成，用於 QR Code)
    asset_type TEXT DEFAULT 'flexible',    -- 資產類型 ('flexible', 'fixed')
    category_id INTEGER,                   -- 關聯到分類表
    features TEXT,                         -- 特徵 (用 JSON 格式彈性儲存)
    photo_url TEXT,                        -- 照片存放網址
    status TEXT DEFAULT 'available',       -- 狀態 ('available', 'in_use', 'maintenance', 'retired')
    current_user_id INTEGER,               -- 若 in_use，指向借用者 ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (current_user_id) REFERENCES users (id)
);

-- asset_logs (資產日誌表)
CREATE TABLE asset_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'checkout' (借出), 'checkin' (歸還)
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- 備註
    FOREIGN KEY (asset_id) REFERENCES assets (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- asset_manager_permissions (資產管理者權限對應表)
CREATE TABLE asset_manager_permissions (
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

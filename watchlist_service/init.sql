CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.alembic_version_watchlist (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_watchlist_pkc PRIMARY KEY (version_num)
);

CREATE TABLE IF NOT EXISTS app.watchlists (
    id VARCHAR NOT NULL, 
    user_id VARCHAR NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    description TEXT, 
    is_default BOOLEAN DEFAULT false NOT NULL, 
    sort_order INTEGER DEFAULT 0 NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    PRIMARY KEY (id), 
    CONSTRAINT uq_watchlists_user_id_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS ix_watchlists_user_id ON app.watchlists (user_id);
CREATE INDEX IF NOT EXISTS ix_watchlists_user_id_deleted_at ON app.watchlists (user_id, deleted_at);

-- Only insert if not exists
INSERT INTO app.alembic_version_watchlist (version_num) 
SELECT '002_create_watchlist_items_table' 
WHERE NOT EXISTS (SELECT 1 FROM app.alembic_version_watchlist);

CREATE TABLE IF NOT EXISTS app.watchlist_items (
    id VARCHAR NOT NULL, 
    watchlist_id VARCHAR NOT NULL, 
    user_id VARCHAR NOT NULL, 
    fincode INTEGER NOT NULL, 
    company_name VARCHAR(255) NOT NULL, 
    exchange VARCHAR(10) NOT NULL, 
    symbol VARCHAR(50), 
    series VARCHAR(10), 
    bse_scripcode VARCHAR(20), 
    display_symbol VARCHAR(80), 
    position INTEGER, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    PRIMARY KEY (id), 
    FOREIGN KEY(watchlist_id) REFERENCES app.watchlists (id) ON DELETE CASCADE, 
    CONSTRAINT uq_watchlist_items_watchlist_id_fincode UNIQUE (watchlist_id, fincode)
);

CREATE INDEX IF NOT EXISTS ix_watchlist_items_watchlist_id ON app.watchlist_items (watchlist_id);
CREATE INDEX IF NOT EXISTS ix_watchlist_items_user_id ON app.watchlist_items (user_id);
CREATE INDEX IF NOT EXISTS ix_watchlist_items_user_watchlist ON app.watchlist_items (user_id, watchlist_id);
CREATE INDEX IF NOT EXISTS ix_watchlist_items_fincode ON app.watchlist_items (fincode);
CREATE INDEX IF NOT EXISTS ix_watchlist_items_exchange_symbol_series ON app.watchlist_items (exchange, symbol, series);

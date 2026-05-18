```txt
auth_db
 ├── users
 ├── refresh_tokens
 ├── api_keys
 ├── audit_logs
 ├── watchlists
 └── watchlist_items   future
```

```txt
One user → many watchlists
Each watchlist → future many stocks/items
```

Do **soft delete** using `deleted_at`, not hard delete. This is safer for user data.


For now, don’t fetch financial data. When you later add stocks, this table will hold only identifiers, and financial data will come from Azure read-only DB.

## Endpoint design

Base path through gateway:

```txt
/api/v1/watchlists
```

### Watchlist CRUD endpoints

| Method   | Endpoint                                    | Purpose                            |
| -------- | ------------------------------------------- | ---------------------------------- |
| `POST`   | `/api/v1/watchlists`                        | Create watchlist                   |
| `GET`    | `/api/v1/watchlists`                        | Get all watchlists of current user |
| `GET`    | `/api/v1/watchlists/{watchlist_id}`         | Get one watchlist                  |
| `PATCH`  | `/api/v1/watchlists/{watchlist_id}`         | Rename/update watchlist            |
| `DELETE` | `/api/v1/watchlists/{watchlist_id}`         | Soft delete watchlist              |
| `PATCH`  | `/api/v1/watchlists/{watchlist_id}/default` | Mark as default watchlist          |
| `PATCH`  | `/api/v1/watchlists/reorder`                | Reorder multiple watchlists        |

### Future stock/item endpoints

Do not implement deeply now, but reserve the API shape:

| Method   | Endpoint                                            | Purpose            |
| -------- | --------------------------------------------------- | ------------------ |
| `POST`   | `/api/v1/watchlists/{watchlist_id}/items`           | Add stock later    |
| `GET`    | `/api/v1/watchlists/{watchlist_id}/items`           | List stocks later  |
| `DELETE` | `/api/v1/watchlists/{watchlist_id}/items/{item_id}` | Remove stock later |

## Request/response examples

### Create watchlist

```http
POST /api/v1/watchlists
```

```json
{
  "name": "Banking Stocks",
  "description": "My banking sector tracking list"
}
```

Response:

```json
{
  "success": true,
  "message": "Watchlist created successfully",
  "data": {
    "id": "uuid",
    "name": "Banking Stocks",
    "description": "My banking sector tracking list",
    "is_default": false,
    "sort_order": 0,
    "items_count": 0,
    "created_at": "2026-05-15T..."
  }
}
```

### List watchlists

```http
GET /api/v1/watchlists
```

Response:

```json
{
  "success": true,
  "message": "Watchlists fetched successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Banking Stocks",
      "description": "My banking sector tracking list",
      "is_default": true,
      "sort_order": 0,
      "items_count": 0,
      "created_at": "2026-05-15T..."
    }
  ]
}
```

## Service folder structure

Create a new service:

```txt
watchlist_service/
 ├── Dockerfile
 ├── requirements.txt
 ├── alembic.ini
 ├── migrations/
 └── app/
     ├── main.py
     ├── api/
     │   ├── deps.py
     │   └── v1/
     │       ├── router.py
     │       ├── health.py
     │       └── watchlists/
     │           └── routes.py
     ├── core/
     │   ├── config.py
     │   ├── response.py
     │   └── security.py
     ├── db/
     │   ├── base.py
     │   └── session.py
     ├── models/
     │   └── watchlist.py
     ├── schemas/
     │   └── watchlist.py
     ├── repository/
     │   └── watchlist_repo.py
     └── services/
         └── watchlist_service.py
```

Use the same pattern as your `auth_service`: FastAPI, SQLAlchemy async, Alembic, Pydantic settings, and standard response wrapper.

## Auth/BFF logic

Your gateway already validates authentication before proxying protected routes. It then injects identity into headers for downstream services. That means `watchlist_service` should **not decode JWT again** in normal flow. It should trust only requests from gateway.

Inside `watchlist_service`, dependency should read:

```txt
X-User-Id
X-Tier
X-Auth-Type
X-Request-Id
```

But to prevent spoofing, add one more internal header from gateway:

```txt
X-Internal-Secret
```

Then `watchlist_service` should reject requests without valid `X-Internal-Secret`.

So the rule becomes:

```txt
Client never calls watchlist_service directly.
Client calls gateway.
Gateway authenticates user.
Gateway forwards user_id to watchlist_service.
Watchlist service performs CRUD only for that user_id.
```

## Gateway changes needed

### 1. Add setting

In `api_gateway/app/core/config.py`, add:

```python
WATCHLIST_SERVICE_URL: str
```

Your health check already references `settings.WATCHLIST_SERVICE_URL`, but this setting is not present in the shown config. So without adding it, gateway startup can fail or health check can break. 

### 2. Add route

In `api_gateway/app/core/routing.py`:

```python
"/api/v1/watchlists": {
    "service_name": "watchlist_service",
    "target": settings.WATCHLIST_SERVICE_URL,
    "auth_required": True,
    "strip_prefix": False,
    "timeout": 15.0,
    "cache_ttl": 0,
},
```

Do **not** cache watchlist CRUD yet because it is user-specific and write-heavy.

### 3. Add internal secret forwarding

In `api_gateway/app/proxy/engine.py`, inside `build_headers()`:

```python
headers["x-internal-secret"] = settings.INTERNAL_SECRET
```

Also add it to `ALLOWED_HEADERS` if needed:

```python
"x-internal-secret",
```

## Docker compose change

Add service:

```yaml
watchlist_service:
  build:
    context: ./watchlist_service
  container_name: investkode_watchlist_service
  env_file:
    - .env
  environment:
    - DATABASE_URL=${WATCHLIST_DATABASE_URL}
  depends_on:
    auth_db:
      condition: service_healthy
  ports:
    - "8002:8000"
```

And update gateway env:

```yaml
api_gateway:
  environment:
    - REDIS_URL=${GATEWAY_REDIS_URL}
    - WATCHLIST_SERVICE_URL=${WATCHLIST_SERVICE_URL}
```

`.env`:

```env
WATCHLIST_SERVICE_URL=http://watchlist_service:8000
WATCHLIST_DATABASE_URL=postgresql+asyncpg://user:pass@auth_db:5432/dbname
```

## Nginx/BFF logic

Nginx should stay simple:

```txt
nginx → api_gateway
```

Do not route nginx directly to `watchlist_service`.

Correct BFF responsibility:

```txt
Nginx:
  SSL, domain, request forwarding

API Gateway:
  auth validation
  rate limiting
  request id
  proxy routing
  user identity forwarding
  service protection

Watchlist Service:
  CRUD only
  business validation
  DB transaction
```

## CRUD business rules

Use these rules from the beginning:

1. User can create many watchlists.
2. Watchlist name must be unique per user.
3. Every query must filter by `user_id`.
4. User cannot access another user’s watchlist.
5. Delete should be soft delete.
6. If deleting the default watchlist, either block it or auto-select another default.
7. Limit watchlists per user, for example 20 initially.
8. Do not allow empty names.
9. Do not use financial DB in this phase.
10. Do not expose internal DB IDs of users from auth service; only use `user_id` from gateway header.

## Recommended implementation phases

### Phase 1: Service skeleton

Create `watchlist_service` with:

```txt
health endpoint
config
db session
response wrapper
internal auth dependency
```

Endpoint:

```txt
GET /health
GET /api/v1/health
```

### Phase 2: Watchlist model and migration

Add:

```txt
models/watchlist.py
schemas/watchlist.py
repository/watchlist_repo.py
```

Run Alembic migration for `watchlists`.

### Phase 3: CRUD APIs

Implement:

```txt
POST /api/v1/watchlists
GET /api/v1/watchlists
GET /api/v1/watchlists/{id}
PATCH /api/v1/watchlists/{id}
DELETE /api/v1/watchlists/{id}
```

### Phase 4: Gateway route

Add:

```txt
WATCHLIST_SERVICE_URL
/api/v1/watchlists route
internal secret forwarding
```

### Phase 5: Docker/nginx integration

Add service in docker-compose. Keep nginx pointing only to gateway.

## My recommended first step

Start with **Phase 1 + Phase 2 only**:

```txt
Create watchlist_service skeleton
Add DB connection
Add Watchlist model
Add Alembic migration - i want to migrate automate before when the service will up 
Add health endpoint
Add internal auth dependency
```


```plaintext
{
  "success": true,
  "status": "ok",
  "request_id": "req_abc",
  "schema_version": "1.0",
  "view": {
    "view_id": "watchlist.default",
    "view_type": "data_grid",
    "title": "Watchlist",
    "description": "Stocks tracked by the user",
    "context": {
      "entity_type": "watchlist",
      "entity_id": null
    },
    "permissions": {
      "access": "allowed",
      "plan": "free",
      "required_plan": "free",
      "can_view": true,
      "can_export": false,
      "can_customize_layout": true,
      "can_sort": true,
      "can_filter": true,
      "can_add_column": false,
      "can_remove_column": true,
      "can_expand_rows": true,
      "can_view_nested_data": true
    },
    "features": {
      "searchable": true,
      "sortable": true,
      "filterable": true,
      "exportable": false,
      "pagination": true,
      "column_customization": true,
      "row_actions": true,
      "bulk_actions": false,
      "mobile_card_view": true,
      "virtualized": false,
      "expandable_rows": true,
      "lazy_expansion": true,
      "nested_views": true,
      "expansion_cache": true,
      "client_sorting": true,
      "client_filtering": true,
      "client_pagination": true,
      "server_sorting": false,
      "server_filtering": false,
      "server_pagination": false
    },
    "layout": {
      "density": "compact",
      "variant": "glass",
      "responsive_mode": "table_to_cards",
      "pinned_columns": ["stock"],
      "pinned_rows": [],
      "default_page_size": 10,
      "expansion_position": "below_row",
      "expansion_indent": true
    },
    "user_layout": {
      "source": "default",
      "visible_columns": [],
      "column_order": [],
      "column_widths": {},
      "pinned_columns": ["stock"],
      "expanded_rows": [],
      "sort": {
        "key": "position",
        "direction": "asc"
      },
      "filters": [],
      "density": "compact"
    },
    "actions": [
      {
        "id": "add_stock",
        "label": "Add stock",
        "scope": "view",
        "type": "modal"
      },
      {
        "id": "create_list",
        "label": "New list",
        "scope": "view",
        "type": "modal"
      }
    ],
    "columns": [
      {
        "key": "stock",
        "label": "Stock",
        "type": "company",
        "cell_renderer": "company_cell",
        "sortable": true,
        "filterable": true,
        "hideable": false,
        "default_visible": true,
        "width": 260,
        "min_width": 240,
        "align": "left"
      },
      {
        "key": "last_price",
        "label": "Last Price",
        "type": "currency",
        "formatter": "currency_inr",
        "sortable": true,
        "filterable": true,
        "hideable": true,
        "default_visible": true,
        "width": 130,
        "align": "right"
      }
    ],
    "data": {
      "rows": [
        {
          "id": "item_123",
          "values": {
            "stock": {
              "company_name": "ICICI Bank",
              "symbol": "ICICIBANK",
              "exchange": "NSE"
            },
            "company_name": "ICICI Bank",
            "symbol": "ICICIBANK",
            "exchange": "NSE",
            "last_price": null,
            "change_percent": null,
            "market_cap": "—",
            "pe": null,
            "sector": "Banks & NBFC",
            "actions": null
          },
          "meta": {
            "list_ids": ["wl_123"],
            "draggable": true,
            "logo": {
              "type": "initials",
              "label": "IC",
              "variant": "banks"
            }
          },
          "_row": {
            "expandable": true,
            "expansion_key": "company_snapshot",
            "expansion_label": "Company snapshot",
            "expansion_mode": "nested_view"
          }
        }
      ]
    },
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total_rows": 1,
      "total_pages": 1,
      "mode": "client"
    },
    "sorting": {
      "mode": "client",
      "default": {
        "key": "position",
        "direction": "asc"
      },
      "allowed_keys": [
        "position",
        "stock",
        "company_name",
        "symbol",
        "exchange",
        "last_price",
        "change_percent",
        "market_cap",
        "pe",
        "sector"
      ]
    },
    "filters": [
      {
        "key": "exchange",
        "label": "Exchange",
        "type": "select",
        "options": ["NSE", "BSE"]
      },
      {
        "key": "sector",
        "label": "Sector",
        "type": "text",
        "options": []
      }
    ],
    "row_expansion": {
      "enabled": true,
      "mode": "nested_view",
      "trigger": "row_click",
      "endpoint": "/api/v1/views/watchlist.default/rows/{row_id}/expand",
      "allowed_expansion_keys": ["company_snapshot"],
      "cache_ttl_seconds": 300
    },
    "meta": {
      "source": {
        "type": "internal_db",
        "name": "InvestKaro DB",
        "vendor": "Accord Fintech"
      },
      "freshness": "monthly",
      "data_quality": "partial",
      "currency": "INR",
      "unit": "mixed",
      "warnings": [
        "Price data is based on the latest available monthly feed, not real-time market data."
      ],
      "client_processing_limit": 100
    },
    "empty_state": {
      "title": "No stocks in watchlist",
      "description": "Add stocks to start tracking them.",
      "action": {
        "key": "add_stock",
        "label": "Add Stock"
      }
    },
    "watchlist": {
      "active_list_id": "all",
      "allow_new_list": true,
      "allow_add_stock": true,
      "allow_drag_reorder": true,
      "allow_export": false,
      "tabs": [
        {
          "id": "all",
          "label": "All",
          "count": 1,
          "type": "all",
          "source": "default",
          "is_default": true
        }
      ],
      "presets": [
        {
          "id": "preset_core",
          "label": "Core holdings",
          "description": "Your long-term foundation stocks",
          "type": "core"
        }
      ],
      "kpis": [
        {
          "key": "tracked",
          "label": "Tracked",
          "value": 1,
          "helper": "across 1 lists",
          "sparkline": [18, 14, 16, 10, 12, 6, 9, 4, 7],
          "tone": "accent"
        }
      ]
    }
  }
}
```
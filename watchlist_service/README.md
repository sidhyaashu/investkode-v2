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
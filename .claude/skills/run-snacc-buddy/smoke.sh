#!/usr/bin/env bash
# Snacc Buddy smoke test — starts backend, runs curl assertions, optionally starts Expo web.
# Run from repo root: bash .claude/skills/run-snacc-buddy/smoke.sh [--web]
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BACKEND="$REPO_ROOT/backend"
FRONTEND="$REPO_ROOT/frontend"
API="http://127.0.0.1:8000"

# ── 1. Prereqs ────────────────────────────────────────────────────────────────
check() { command -v "$1" &>/dev/null || { echo "Missing: $1"; exit 1; }; }
check uv
check docker
check curl

# PostgreSQL (port 5434) and Redis (6379) must be running via Docker Compose.
docker exec snacc-buddy-db-1 pg_isready -q 2>/dev/null || {
  echo "PostgreSQL not running. Start with: docker compose up db redis -d"
  exit 1
}
redis-cli -p 6379 ping &>/dev/null || {
  echo "Redis not running. Start with: docker compose up db redis -d"
  exit 1
}

# ── 2. Start backend ──────────────────────────────────────────────────────────
echo "→ Starting backend..."
cd "$BACKEND"
DATABASE_URL="postgresql+asyncpg://snacc_buddy_admin:nomz123@localhost:5434/snacc_buddy" \
REDIS_URL="redis://localhost:6379" \
MAIL_SUPPRESS_SEND=1 \
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 > /tmp/snacc-api.log 2>&1 &
API_PID=$!
echo "  PID: $API_PID"

# Wait for startup (max 15s)
for i in $(seq 1 15); do
  curl -sf "$API/health" &>/dev/null && break
  sleep 1
  [ $i -eq 15 ] && { echo "Backend failed to start"; cat /tmp/snacc-api.log | tail -20; kill $API_PID 2>/dev/null; exit 1; }
done
echo "  ✓ /health OK"

# ── 3. Auth smoke test ────────────────────────────────────────────────────────
TEST_EMAIL="smoke-$$@test.dev"
TEST_PASS="Smoke1234!"

# Register
REG=$(curl -sf -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\",\"is_active\":true}" 2>/dev/null \
  || echo '{"detail":"REGISTER_USER_ALREADY_EXISTS"}')
echo "  ✓ register: $TEST_EMAIL"

# Login
TOKEN=$(curl -sf -X POST "$API/auth/jwt/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$TEST_EMAIL&password=$TEST_PASS" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
[ -n "$TOKEN" ] || { echo "Login failed"; kill $API_PID; exit 1; }
echo "  ✓ login: got JWT"

# ── 4. API endpoint assertions ────────────────────────────────────────────────
# GET /api/v1/food/logs
LOGS=$(curl -sf -H "Authorization: Bearer $TOKEN" "$API/api/v1/food/logs")
echo "$LOGS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'items' in d" \
  && echo "  ✓ GET /api/v1/food/logs"

# POST /api/v1/food/logs (confirm log)
LOG=$(curl -sf -X POST "$API/api/v1/food/logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_type":"lunch",
    "image_urls":[],
    "analysis":{
      "food_name":"Test meal","estimated_total_calories":500,
      "macros":{"protein_g":30,"carbs_g":55,"fat_g":10,"fibre_g":3},
      "ambiguity_flags":[],"overall_confidence":0.9
    }
  }')
echo "$LOG" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['estimated_total_calories']==500" \
  && echo "  ✓ POST /api/v1/food/logs (confirm)"

# GET /api/v1/analytics/daily
TODAY=$(date +%Y-%m-%d)
DAILY=$(curl -sf -H "Authorization: Bearer $TOKEN" "$API/api/v1/analytics/daily?target_date=$TODAY")
echo "$DAILY" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'total_calories' in d" \
  && echo "  ✓ GET /api/v1/analytics/daily"

# GET /api/v1/analytics/weekly
WEEKLY=$(curl -sf -H "Authorization: Bearer $TOKEN" "$API/api/v1/analytics/weekly")
echo "$WEEKLY" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'week' in d and len(d['week'])==7" \
  && echo "  ✓ GET /api/v1/analytics/weekly"

# GET /api/v1/analytics/streak
STREAK=$(curl -sf -H "Authorization: Bearer $TOKEN" "$API/api/v1/analytics/streak")
echo "$STREAK" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'streak' in d" \
  && echo "  ✓ GET /api/v1/analytics/streak"

# PATCH /api/v1/food/logs/{id} (update notes)
LOG_ID=$(echo "$LOG" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
PATCHED=$(curl -sf -X PATCH "$API/api/v1/food/logs/$LOG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"smoke test note","mood":["happy"]}')
echo "$PATCHED" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('notes')=='smoke test note'" \
  && echo "  ✓ PATCH /api/v1/food/logs/{id}"

# DELETE /api/v1/food/logs/{id}
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  -H "Authorization: Bearer $TOKEN" "$API/api/v1/food/logs/$LOG_ID")
[ "$STATUS" = "204" ] && echo "  ✓ DELETE /api/v1/food/logs/{id}" || { echo "  ✗ DELETE failed: $STATUS"; kill $API_PID; exit 1; }

echo ""
echo "Backend smoke: PASS"

# ── 5. Expo web (optional) ────────────────────────────────────────────────────
if [ "$1" = "--web" ]; then
  echo ""
  echo "→ Starting Expo web (port 8081)..."
  cd "$FRONTEND"
  EXPO_PUBLIC_API_URL=http://localhost:8000 \
  EXPO_PUBLIC_PLATFORM_MODE=web \
  npx expo start --web --port 8081 > /tmp/snacc-expo.log 2>&1 &
  EXPO_PID=$!
  echo "  PID: $EXPO_PID"
  for i in $(seq 1 30); do
    curl -sf http://localhost:8081 &>/dev/null && break
    sleep 1
    [ $i -eq 30 ] && { echo "Expo failed to start"; tail -20 /tmp/snacc-expo.log; exit 1; }
  done
  echo "  ✓ http://localhost:8081 serving"
  echo ""
  echo "Expo web: UP"
  echo "  API PID:  $API_PID (kill to stop)"
  echo "  Expo PID: $EXPO_PID (kill to stop)"
else
  kill $API_PID 2>/dev/null || true
  echo ""
  echo "API stopped. Run with --web to also start the Expo frontend."
fi

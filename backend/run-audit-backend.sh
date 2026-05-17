#!/usr/bin/env bash
# ============================================================
# Auditoria Automatica de Backend - Sprint 3
# Proyecto UniConnect - Ingenieria de Software III
# ============================================================
# Uso:
#   bash run-audit-backend.sh [URL_BACKEND]
#
# El reporte se genera en:
#   audit-report-backend.md
# ============================================================

set -euo pipefail

BACKEND_URL="${1:-}"
REPORT_FILE="${AUDIT_REPORT_FILE:-audit-report-backend.md}"
PASS=0
FAIL=0
WARN=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# If the script lives inside backend/, run the audit from there even when it is
# invoked from the repository root with "bash backend/run-audit-backend.sh".
if [ -f "$SCRIPT_DIR/package.json" ] && { [ -d "$SCRIPT_DIR/services" ] || [ -d "$SCRIPT_DIR/src" ]; }; then
  cd "$SCRIPT_DIR"
elif [ ! -f "package.json" ] && [ -f "backend/package.json" ]; then
  cd "backend"
fi

check() {
  echo -e "${GREEN}  PASS${RESET} $1"
  PASS=$((PASS + 1))
  echo "- PASS | $1" >> "$REPORT_FILE"
}

fail() {
  echo -e "${RED}  FAIL${RESET} $1"
  FAIL=$((FAIL + 1))
  echo "- FAIL | $1" >> "$REPORT_FILE"
}

warn() {
  echo -e "${YELLOW}  WARN${RESET} $1"
  WARN=$((WARN + 1))
  echo "- WARN | $1" >> "$REPORT_FILE"
}

section() {
  echo -e "\n${CYAN}${BOLD}== $1 ==${RESET}"
  {
    echo ""
    echo "## $1"
  } >> "$REPORT_FILE"
}

write_report() {
  printf '%s\n' "$1" >> "$REPORT_FILE"
}

percent_ge() {
  local value="${1:-0}"
  local minimum="${2:-0}"

  awk -v value="$value" -v minimum="$minimum" 'BEGIN { exit !(value + 0 >= minimum + 0) }'
}

clean_count() {
  tr -d '[:space:]'
}

GREP_EXCLUDES=(
  --exclude-dir=node_modules
  --exclude-dir=dist
  --exclude-dir=coverage
  --exclude-dir=.turbo
  --exclude-dir=.git
)

CODE_PATHS=()
[ -d "src" ] && CODE_PATHS+=("src")
[ -d "gateway/src" ] && CODE_PATHS+=("gateway/src")

if [ -d "services" ]; then
  while IFS= read -r dir; do
    CODE_PATHS+=("$dir")
  done < <(find services -mindepth 2 -maxdepth 2 -type d -name src 2>/dev/null | sort)
fi

[ -d "shared" ] && CODE_PATHS+=("shared")
[ -d "supabase/functions" ] && CODE_PATHS+=("supabase/functions")

TEST_ROOTS=()
[ -d "tests" ] && TEST_ROOTS+=("tests")

if [ -d "services" ]; then
  while IFS= read -r dir; do
    TEST_ROOTS+=("$dir")
  done < <(find services -mindepth 2 -maxdepth 2 -type d -name test 2>/dev/null | sort)
fi

grep_code() {
  local pattern="$1"
  shift

  [ "$#" -eq 0 ] && return 0

  grep -RInE \
    --include="*.ts" \
    --include="*.js" \
    "${GREP_EXCLUDES[@]}" \
    "$pattern" \
    "$@" 2>/dev/null \
    | grep -Ev '\.(spec|test)\.(ts|js)' \
    || true
}

count_code() {
  local pattern="$1"
  shift

  grep_code "$pattern" "$@" | wc -l | clean_count
}

grep_files() {
  local pattern="$1"
  shift

  [ "$#" -eq 0 ] && return 0

  grep -InE "$pattern" "$@" 2>/dev/null || true
}

append_matches() {
  local title="$1"
  local pattern="$2"
  shift 2
  local matches

  matches="$(grep_code "$pattern" "$@" | head -60 || true)"

  {
    echo ""
    echo "### Evidencia: $title"
    if [ -n "$matches" ]; then
      echo '```text'
      printf '%s\n' "$matches"
      echo '```'
    else
      echo "_Sin coincidencias automaticas._"
    fi
  } >> "$REPORT_FILE"
}

mapfile -t ALL_TEST_FILES < <(
  find . \
    \( -path "./node_modules" -o -path "./node_modules/*" \
       -o -path "./dist" -o -path "./dist/*" \
       -o -path "./coverage" -o -path "./coverage/*" \
       -o -path "./.turbo" -o -path "./.turbo/*" \
       -o -path "./.git" -o -path "./.git/*" \) -prune \
    -o -type f \
    \( -name "*.spec.ts" -o -name "*.test.ts" -o -name "*.spec.js" -o -name "*.test.js" \) \
    -print 2>/dev/null \
  | sed 's#^\./##' \
  | sort
)

cat > "$REPORT_FILE" <<EOF
# Auditoria Backend - Sprint 3

- Fecha: $(date)
- Directorio auditado: $(pwd)
- URL backend: ${BACKEND_URL:-No proporcionada}
- Reporte generado por: run-audit-backend.sh

EOF

echo -e "${BOLD}Auditoria Backend - Sprint 3 - $(date '+%d/%m/%Y %H:%M')${RESET}"
echo -e "Directorio: $(pwd)\n"

# ============================================================
# Deteccion de tecnologia
# ============================================================
section "Deteccion de tecnologia"

IS_TS=false
IS_NESTJS=false
IS_JS=false

if [ -f "tsconfig.json" ] || find . -maxdepth 3 -name "tsconfig.json" -not -path "*/node_modules/*" -print -quit | grep -q .; then
  IS_TS=true
  check "TypeScript detectado"
else
  IS_JS=true
  warn "Proyecto JavaScript puro o sin tsconfig.json detectable"
fi

if grep -R "\"@nestjs/core\"" package.json gateway/package.json services/*/package.json shared/*/package.json 2>/dev/null | grep -q .; then
  IS_NESTJS=true
  check "NestJS detectado"
fi

if [ "${#CODE_PATHS[@]}" -gt 0 ]; then
  check "Rutas fuente detectadas (${#CODE_PATHS[@]}): ${CODE_PATHS[*]}"
else
  fail "No se detectaron rutas fuente (src, gateway/src, services/*/src, shared, supabase/functions)"
fi

if [ "${#ALL_TEST_FILES[@]}" -gt 0 ]; then
  check "Archivos de prueba detectados (${#ALL_TEST_FILES[@]})"
else
  warn "No se detectaron archivos *.spec.* o *.test.*"
fi

{
  echo ""
  echo "- TypeScript: $IS_TS"
  echo "- NestJS: $IS_NESTJS"
  echo "- JavaScript puro: $IS_JS"
  echo "- Rutas fuente: ${CODE_PATHS[*]:-ninguna}"
  echo "- Raices de tests: ${TEST_ROOTS[*]:-ninguna}"
} >> "$REPORT_FILE"

# ============================================================
# A - Singleton
# ============================================================
section "A - Patron Singleton"

A_SCORE=0

SINGLETON_GETINSTANCE=$(count_code "getInstance[[:space:]]*\\(" "${CODE_PATHS[@]}")
SINGLETON_STATIC=$(count_code "static[[:space:]].*instance" "${CODE_PATHS[@]}")
SINGLETON_PRIVATE=$(count_code "private[[:space:]]+constructor" "${CODE_PATHS[@]}")

echo "  getInstance() encontrado: $SINGLETON_GETINSTANCE veces"
echo "  static instance encontrado: $SINGLETON_STATIC veces"
echo "  private constructor encontrado: $SINGLETON_PRIVATE veces"

if [ "$SINGLETON_GETINSTANCE" -gt 0 ] || [ "$SINGLETON_STATIC" -gt 0 ] || [ "$SINGLETON_PRIVATE" -gt 0 ]; then
  check "Singleton detectado en codigo"
  A_SCORE=5
else
  fail "No se encontro implementacion de Singleton"
fi

if [ "$IS_NESTJS" = "true" ]; then
  INJECTABLE_COUNT=$(count_code "@Injectable[[:space:]]*\\(" "${CODE_PATHS[@]}")
  if [ "$INJECTABLE_COUNT" -gt 0 ]; then
    check "NestJS: $INJECTABLE_COUNT servicios @Injectable() detectados"
  else
    warn "NestJS detectado, pero no se encontraron servicios @Injectable()"
  fi
fi

append_matches "Singleton" "getInstance[[:space:]]*\\(|static[[:space:]].*instance|private[[:space:]]+constructor" "${CODE_PATHS[@]}"

# ============================================================
# B - Decorator estructural
# ============================================================
section "B - Patron Decorator Estructural"

B_SCORE=0

DECORATOR_CLASS=$(count_code "class[[:space:]].*Decorator|abstract[[:space:]]+class[[:space:]].*Decorator|implements[[:space:]].*Decorator|interface[[:space:]].*Decorator" "${CODE_PATHS[@]}")
DECORATOR_COMPONENT=$(count_code "this\\.(component|wrapped|_component|message)\\b|protected[[:space:]]+readonly[[:space:]]+message\\b|private[[:space:]]+readonly[[:space:]].*component\\b|constructor[[:space:]]*\\([^)]*(component|message|wrapped)\\b" "${CODE_PATHS[@]}")
DECORATOR_TESTS=$(grep_files "Decorator|decorator|BaseMessage|FileDecorator|MentionDecorator|ReactionDecorator" "${ALL_TEST_FILES[@]}" | wc -l | clean_count)

echo "  Clases/interfases Decorator encontradas: $DECORATOR_CLASS"
echo "  Composicion interna detectada: $DECORATOR_COMPONENT"
echo "  Referencias de tests Decorator: $DECORATOR_TESTS lineas"

if [ "$DECORATOR_CLASS" -gt 0 ]; then
  check "Clase/interfaz Decorator encontrada"
  B_SCORE=$((B_SCORE + 3))
else
  fail "No se encontro implementacion del patron Decorator estructural"
fi

if [ "$DECORATOR_COMPONENT" -gt 0 ]; then
  check "Composicion interna del objeto decorado detectada"
  B_SCORE=$((B_SCORE + 2))
else
  warn "No se detecto composicion interna clara (this.component, this.message, wrapped, etc.)"
fi

if [ "$DECORATOR_TESTS" -gt 0 ]; then
  check "Tests del Decorator presentes"
  B_SCORE=$((B_SCORE + 3))
else
  fail "No se encontraron tests del Decorator (requerido US-18)"
fi

for MODULE in chat message messaging profile student notification; do
  MODULE_FILES=$(find "${CODE_PATHS[@]}" \
    \( -path "*/node_modules/*" -o -path "*/dist/*" -o -path "*/coverage/*" -o -path "*/.turbo/*" \) -prune \
    -o -type f \( -name "*.ts" -o -name "*.js" \) -print 2>/dev/null \
    | grep -Ei "$MODULE" \
    | wc -l \
    | clean_count)

  [ "$MODULE_FILES" -gt 0 ] && echo "  Modulo '$MODULE': $MODULE_FILES archivos relacionados"
done

append_matches "Decorator estructural" "class[[:space:]].*Decorator|abstract[[:space:]]+class[[:space:]].*Decorator|implements[[:space:]].*Decorator|interface[[:space:]].*Decorator|this\\.(component|wrapped|_component|message)\\b|protected[[:space:]]+readonly[[:space:]]+message\\b" "${CODE_PATHS[@]}"

# ============================================================
# C - Observer
# ============================================================
section "C - Patron Observer"

C_SCORE=0

OBSERVER_INTERFACE=$(count_code "interface[[:space:]]+I?[[:alnum:]_]*Observer\\b|class[[:space:]]+[[:alnum:]_]*Observer\\b|implements[[:space:]]+I?[[:alnum:]_]*Observer\\b" "${CODE_PATHS[@]}")
SUBJECT_CLASS=$(count_code "class[[:space:]]+[[:alnum:]_]*Subject\\b|class[[:space:]]+[[:alnum:]_]*Observable\\b|interface[[:space:]]+I[[:alnum:]_]*Subject\\b" "${CODE_PATHS[@]}")
OBSERVER_METHODS=$(count_code "\\b(notify|addObserver|removeObserver|subscribe|unsubscribe|emit|handle)\\b" "${CODE_PATHS[@]}")
EVENTEMITTER=$(count_code "EventEmitter|EventBus|@OnEvent|EventsModule" "${CODE_PATHS[@]}")
OBSERVER_TESTS=$(grep_files "Observer|observer|Subject|subscribe|unsubscribe|notify|emit" "${ALL_TEST_FILES[@]}" | wc -l | clean_count)

echo "  Interfaz/clase Observer: $OBSERVER_INTERFACE"
echo "  Clase Subject/Observable: $SUBJECT_CLASS"
echo "  Metodos notify/subscribe/unsubscribe/emit: $OBSERVER_METHODS"
echo "  EventEmitter/EventBus: $EVENTEMITTER"
echo "  Tests del Observer: $OBSERVER_TESTS lineas"

if [ "$OBSERVER_INTERFACE" -gt 0 ] || [ "$EVENTEMITTER" -gt 0 ]; then
  check "Observer interface/EventEmitter/EventBus detectado"
  C_SCORE=$((C_SCORE + 2))
else
  fail "No se encontro implementacion de Observer"
fi

if [ "$SUBJECT_CLASS" -gt 0 ]; then
  check "Subject/Observable detectado"
  C_SCORE=$((C_SCORE + 2))
else
  fail "No se encontro clase Subject/Observable"
fi

if [ "$OBSERVER_METHODS" -gt 3 ]; then
  check "Metodos del patron Observer presentes ($OBSERVER_METHODS referencias)"
  C_SCORE=$((C_SCORE + 2))
else
  warn "Pocos metodos Observer detectados; revisar implementacion manualmente"
fi

if [ "$OBSERVER_TESTS" -gt 0 ]; then
  check "Tests del Observer presentes"
  C_SCORE=$((C_SCORE + 2))
else
  fail "No se encontraron tests del Observer (requerido US-19)"
fi

append_matches "Observer" "interface[[:space:]]+I?[[:alnum:]_]*Observer\\b|class[[:space:]]+[[:alnum:]_]*Observer\\b|implements[[:space:]]+I?[[:alnum:]_]*Observer\\b|class[[:space:]]+[[:alnum:]_]*Subject\\b|interface[[:space:]]+I[[:alnum:]_]*Subject\\b|\\b(subscribe|unsubscribe|notify|emit)\\b|EventBus|EventEmitter" "${CODE_PATHS[@]}"

# ============================================================
# D - Tests y cobertura
# ============================================================
section "D - Tests y Cobertura"

D_SCORE=0
TEST_STATUS=1
TEST_OUTPUT=""
TEST_RUNNER="No ejecutado"
LINE_COV="0"
FUNC_COV="0"
BRANCH_COV="0"

NODE_TEST_FILES=()
for test_file in "${ALL_TEST_FILES[@]}"; do
  if grep -q "node:test" "$test_file" 2>/dev/null; then
    NODE_TEST_FILES+=("$test_file")
  fi
done

if [ "${#NODE_TEST_FILES[@]}" -gt 0 ] && command -v node >/dev/null 2>&1; then
  TEST_RUNNER="node --test + tsx"
  echo "  Ejecutando pruebas con Node test runner + tsx..."
  set +e
  TEST_OUTPUT=$(node --import tsx --test --experimental-test-coverage "${NODE_TEST_FILES[@]}" 2>&1)
  TEST_STATUS=$?
  set -e
elif grep -R "\"jest\"" package.json gateway/package.json services/*/package.json shared/*/package.json 2>/dev/null | grep -q . || [ -f "jest.config.ts" ] || [ -f "jest.config.js" ]; then
  TEST_RUNNER="jest"
  echo "  Ejecutando pruebas con Jest..."
  set +e
  TEST_OUTPUT=$(npx jest --coverage --passWithNoTests --forceExit 2>&1)
  TEST_STATUS=$?
  set -e
else
  warn "No se detecto runner ejecutable (node:test o Jest)"
fi

if [ "$TEST_RUNNER" != "No ejecutado" ]; then
  echo "$TEST_OUTPUT" | grep -E "tests |suites |pass |fail |duration_ms|all files|Test Suites:|Tests:|Statements|Functions" | tail -30 || true

  if [ "$TEST_STATUS" -eq 0 ]; then
    check "Suite de pruebas ejecutada correctamente con $TEST_RUNNER"
    D_SCORE=$((D_SCORE + 2))
  else
    fail "La suite de pruebas fallo con $TEST_RUNNER"
  fi

  ALL_COVERAGE_LINE=$(echo "$TEST_OUTPUT" | grep -E "all files[[:space:]]*\\|" | tail -1 || true)
  if [ -n "$ALL_COVERAGE_LINE" ]; then
    LINE_COV=$(echo "$ALL_COVERAGE_LINE" | awk -F'|' '{ gsub(/[^0-9.]/, "", $2); print $2 }')
    BRANCH_COV=$(echo "$ALL_COVERAGE_LINE" | awk -F'|' '{ gsub(/[^0-9.]/, "", $3); print $3 }')
    FUNC_COV=$(echo "$ALL_COVERAGE_LINE" | awk -F'|' '{ gsub(/[^0-9.]/, "", $4); print $4 }')
  else
    STMT_COV=$(echo "$TEST_OUTPUT" | grep "Statements" | grep -oE '[0-9]+(\.[0-9]+)?' | head -1 || true)
    FUNC_COV=$(echo "$TEST_OUTPUT" | grep "Functions" | grep -oE '[0-9]+(\.[0-9]+)?' | head -1 || true)
    LINE_COV="${STMT_COV:-0}"
    FUNC_COV="${FUNC_COV:-0}"
  fi

  LINE_COV="${LINE_COV:-0}"
  FUNC_COV="${FUNC_COV:-0}"
  BRANCH_COV="${BRANCH_COV:-0}"

  echo "  Cobertura lineas/statements: $LINE_COV%"
  echo "  Cobertura funciones: $FUNC_COV%"
  echo "  Cobertura branches: $BRANCH_COV%"

  if percent_ge "$LINE_COV" 70; then
    check "Cobertura lineas/statements >= 70% ($LINE_COV%)"
    D_SCORE=$((D_SCORE + 2))
  else
    fail "Cobertura lineas/statements insuficiente: $LINE_COV% (minimo 70%)"
  fi

  if percent_ge "$FUNC_COV" 70; then
    check "Cobertura de funciones >= 70% ($FUNC_COV%)"
    D_SCORE=$((D_SCORE + 1))
  else
    fail "Cobertura de funciones insuficiente: $FUNC_COV% (minimo 70%)"
  fi

  {
    echo ""
    echo "### Resumen de pruebas"
    echo ""
    echo "- Runner: $TEST_RUNNER"
    echo "- Estado: $TEST_STATUS"
    echo "- Cobertura lineas/statements: $LINE_COV%"
    echo "- Cobertura funciones: $FUNC_COV%"
    echo "- Cobertura branches: $BRANCH_COV%"
    echo ""
    echo '```text'
    echo "$TEST_OUTPUT" | grep -E "tests |suites |pass |fail |duration_ms|all files|Test Suites:|Tests:|Statements|Functions" | tail -40 || true
    echo '```'
  } >> "$REPORT_FILE"
fi

TEST_FILE_COUNT="${#ALL_TEST_FILES[@]}"
echo "  Archivos de test encontrados: $TEST_FILE_COUNT"
if [ "$TEST_FILE_COUNT" -ge 2 ]; then
  check "$TEST_FILE_COUNT archivos de test presentes"
else
  fail "Muy pocos archivos de test ($TEST_FILE_COUNT)"
fi

# ============================================================
# E - Integracion
# ============================================================
section "E - Tests de Integracion"

E_SCORE=0

mapfile -t E2E_FILES < <(
  find . \
    \( -path "./node_modules" -o -path "./node_modules/*" \
       -o -path "./dist" -o -path "./dist/*" \
       -o -path "./coverage" -o -path "./coverage/*" \
       -o -path "./.turbo" -o -path "./.turbo/*" \
       -o -path "./.git" -o -path "./.git/*" \) -prune \
    -o -type f \
    \( -name "*.e2e-spec.*" -o -name "*.integration.*" \) \
    -print 2>/dev/null \
  | sed 's#^\./##' \
  | sort
)

ENDPOINT_TEST_REFS=$(grep_files "fetch[[:space:]]*\\(|supertest|request[[:space:]]*\\(|createServer|/health|/api/|routes" "${ALL_TEST_FILES[@]}" | wc -l | clean_count)
DOMAIN_INTEGRATION_REFS=$(grep_files "integration|integracion|Subject integration" "${ALL_TEST_FILES[@]}" | wc -l | clean_count)

if [ "${#E2E_FILES[@]}" -gt 0 ] || [ "$ENDPOINT_TEST_REFS" -gt 0 ]; then
  check "Tests de integracion/e2e de endpoints encontrados"
  E_SCORE=2
else
  fail "No se encontraron tests de integracion/e2e de endpoints (requerido US-20)"
fi

if [ "$DOMAIN_INTEGRATION_REFS" -gt 0 ]; then
  warn "Hay referencias a pruebas de integracion de dominio ($DOMAIN_INTEGRATION_REFS), pero no sustituyen pruebas de endpoints"
fi

{
  echo ""
  echo "### Evidencia integracion"
  echo ""
  echo "- Archivos e2e/integration: ${#E2E_FILES[@]}"
  echo "- Referencias endpoint en tests: $ENDPOINT_TEST_REFS"
  echo "- Referencias integracion de dominio: $DOMAIN_INTEGRATION_REFS"
} >> "$REPORT_FILE"

# ============================================================
# F - Docker y despliegue
# ============================================================
section "F - Docker y Despliegue"

F_SCORE=0

DOCKERFILE_COUNT=$(find . -maxdepth 4 -name "Dockerfile" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | wc -l | clean_count)
COMPOSE_COUNT=$(find . .. -maxdepth 3 \( -name "docker-compose.yml" -o -name "compose.yml" \) -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | sort -u | wc -l | clean_count)
CI_COUNT=0

if [ -d ".github/workflows" ] || [ -d "../.github/workflows" ]; then
  CI_COUNT=$((CI_COUNT + 1))
fi

if [ -f "infra/ci/backend-ci.yml" ]; then
  CI_COUNT=$((CI_COUNT + 1))
fi

if [ "$DOCKERFILE_COUNT" -gt 0 ]; then
  check "Dockerfile presente ($DOCKERFILE_COUNT encontrado/s)"
else
  fail "Dockerfile no encontrado"
fi

if [ "$COMPOSE_COUNT" -gt 0 ]; then
  check "docker-compose/compose presente ($COMPOSE_COUNT encontrado/s)"
else
  warn "docker-compose.yml no encontrado"
fi

if [ "$DOCKERFILE_COUNT" -gt 0 ] && [ "$COMPOSE_COUNT" -gt 0 ]; then
  F_SCORE=$((F_SCORE + 1))
fi

if [ "$CI_COUNT" -gt 0 ]; then
  check "CI/CD configurado (.github/workflows o infra/ci)"
else
  warn "No se encontro configuracion CI/CD"
fi

URL_OK=false
if [ -n "$BACKEND_URL" ]; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND_URL" 2>/dev/null || echo "000")
  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ] || [ "$HTTP_STATUS" = "404" ]; then
    check "URL accesible: $BACKEND_URL (HTTP $HTTP_STATUS)"
    URL_OK=true
  else
    fail "URL no responde: $BACKEND_URL (HTTP $HTTP_STATUS)"
  fi
else
  warn "URL de backend no proporcionada; ejecuta: bash run-audit-backend.sh https://tu-url.fly.dev"
fi

if [ "$CI_COUNT" -gt 0 ] && [ "$URL_OK" = "true" ]; then
  F_SCORE=$((F_SCORE + 1))
elif [ "$CI_COUNT" -gt 0 ]; then
  warn "CI/CD existe, pero el despliegue activo no se pudo validar sin URL"
fi

{
  echo ""
  echo "### Evidencia Docker/CI"
  echo ""
  echo "- Dockerfiles: $DOCKERFILE_COUNT"
  echo "- Compose files: $COMPOSE_COUNT"
  echo "- CI/CD indicadores: $CI_COUNT"
  echo "- URL validada: $URL_OK"
} >> "$REPORT_FILE"

# ============================================================
# Resumen
# ============================================================
section "Resumen de Auditoria"

TOTAL_CHECKS=$((PASS + FAIL + WARN))
TOTAL_SCORE=$((A_SCORE + B_SCORE + C_SCORE + D_SCORE + E_SCORE + F_SCORE))
GRADE_30_PERCENT=$(awk -v score="$TOTAL_SCORE" 'BEGIN { printf "%.2f", (score / 30) * 1.5 }')
GRADE_OVER_5=$(awk -v score="$TOTAL_SCORE" 'BEGIN { printf "%.2f", (score / 30) * 5 }')

echo -e "\n${BOLD}Resultados:${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET}"
echo -e "  ${RED}FAIL: $FAIL${RESET}"
echo -e "  ${YELLOW}WARN: $WARN${RESET}"
echo -e "  Total verificaciones: $TOTAL_CHECKS"
echo -e "\n${BOLD}Estimacion automatica: $TOTAL_SCORE / 30${RESET}"
echo -e "${BOLD}Equivalente 30% de la nota: $GRADE_30_PERCENT / 1.50${RESET}"
echo -e "${BOLD}Equivalente sobre 5.0: $GRADE_OVER_5 / 5.00${RESET}"

{
  echo ""
  echo "| Seccion | Criterio | Obtenido | Max |"
  echo "| --- | --- | ---: | ---: |"
  echo "| A | Singleton | $A_SCORE | 5 |"
  echo "| B | Decorator Estructural | $B_SCORE | 8 |"
  echo "| C | Observer | $C_SCORE | 8 |"
  echo "| D | Tests + Cobertura | $D_SCORE | 5 |"
  echo "| E | Tests de Integracion en endpoints | $E_SCORE | 2 |"
  echo "| F | Docker + CI/CD + Despliegue | $F_SCORE | 2 |"
  echo "|  | **Total** | **$TOTAL_SCORE** | **30** |"
  echo ""
  echo "- PASS: $PASS"
  echo "- FAIL: $FAIL"
  echo "- WARN: $WARN"
  echo "- Total verificaciones: $TOTAL_CHECKS"
  echo "- Estimacion automatica: $TOTAL_SCORE / 30"
  echo "- Equivalente 30% de la nota: $GRADE_30_PERCENT / 1.50"
  echo "- Equivalente sobre 5.0: $GRADE_OVER_5 / 5.00"
} >> "$REPORT_FILE"

echo -e "\nReporte guardado en: ${CYAN}$REPORT_FILE${RESET}"

#!/usr/bin/env bash
# check-coverage.sh
# Valida:
#   CA3 - Cobertura global >= 70%
#   CA2 - Decorator + Observer combinado >= 85%
# Lee coverage/coverage-summary.json generado por c8

set -euo pipefail

COVERAGE_FILE="coverage/coverage-summary.json"
MIN_GLOBAL=70
MIN_PATTERNS=85

# Módulos de patrones: decorator + observer (incluye shared + servicios)
PATTERNS_PREFIXES=(
  "services/messaging/src/domain/decorators"
  "shared/patterns/decorator"
  "services/events/src/domain/events"
  "shared/patterns/observer"
)

GLOBAL_FAILED=false
PATTERNS_FAILED=false

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "Error: No se encontró $COVERAGE_FILE. Ejecuta 'c8' primero."
  exit 1
fi

get_pct() {
  local val
  val=$(jq -r "$1" "$COVERAGE_FILE")
  if [ "$val" = "Unknown" ] || [ "$val" = "null" ]; then echo "100"; else echo "$val"; fi
}

# ─── CA3: Cobertura Global ≥ 70% ───
global_lines=$(get_pct '.total.lines.pct')
global_branches=$(get_pct '.total.branches.pct')
global_functions=$(get_pct '.total.functions.pct')
global_statements=$(get_pct '.total.statements.pct')

echo "[CA3] Global — lines: ${global_lines}% | branches: ${global_branches}% | functions: ${global_functions}% | statements: ${global_statements}%"

for metric in lines branches functions statements; do
  val_var="global_${metric}"
  val="${!val_var}"
  if (( $(echo "$val < $MIN_GLOBAL" | bc -l) )); then
    echo "❌ Error: Cobertura por debajo del umbral mínimo"
    echo "   ${metric}: ${val}% | Umbral requerido: ${MIN_GLOBAL}%"
    GLOBAL_FAILED=true
  fi
done

[ "$GLOBAL_FAILED" = false ] && echo "✅ [CA3] Cobertura global supera el umbral ${MIN_GLOBAL}%"

# ─── CA2: Decorator + Observer ≥ 85% ───
total_lines=0
covered_lines=0

for prefix in "${PATTERNS_PREFIXES[@]}"; do
  while IFS=$'\t' read -r t c; do
    total_lines=$((total_lines + t))
    covered_lines=$((covered_lines + c))
  done < <(jq -r --arg prefix "$prefix" '
    to_entries[]
    | select(.key | gsub("\\\\"; "/") | contains($prefix))
    | "\(.value.lines.total)\t\(.value.lines.covered)"
  ' "$COVERAGE_FILE")
done

if [ "$total_lines" -eq 0 ]; then
  echo "⚠️  [CA2] No se encontraron archivos de Decorator/Observer en el reporte."
else
  patterns_pct=$(echo "scale=2; $covered_lines * 100 / $total_lines" | bc)
  echo "[CA2] Decorator + Observer combinado: ${patterns_pct}%"

  if (( $(echo "$patterns_pct < $MIN_PATTERNS" | bc -l) )); then
    echo "❌ Error: Cobertura por debajo del umbral mínimo"
    echo "   Decorator+Observer: ${patterns_pct}% | Umbral requerido: ${MIN_PATTERNS}%"
    PATTERNS_FAILED=true
  else
    echo "✅ [CA2] Decorator+Observer ${patterns_pct}% supera el umbral ${MIN_PATTERNS}%"
  fi
fi

# ─── Salida final ───
if [ "$GLOBAL_FAILED" = true ] || [ "$PATTERNS_FAILED" = true ]; then
  exit 1
fi
echo "✅ Todos los umbrales de cobertura cumplidos"

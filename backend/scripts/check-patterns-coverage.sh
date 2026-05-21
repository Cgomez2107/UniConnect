#!/usr/bin/env bash
# check-patterns-coverage.sh
# Valida que la cobertura combinada de los módulos Decorator y Observer >= 85%
# Lee coverage/coverage-summary.json generado por vitest --coverage

set -euo pipefail

COVERAGE_FILE="coverage/coverage-summary.json"
PATTERNS_PREFIXES=("shared/patterns/decorator" "shared/patterns/observer")
MIN_COVERAGE=85

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "Error: No se encontró $COVERAGE_FILE. Ejecuta 'npx vitest run --coverage' primero."
  exit 1
fi

total_lines=0
covered_lines=0

for prefix in "${PATTERNS_PREFIXES[@]}"; do
  while IFS=$'\t' read -r t c; do
    total_lines=$((total_lines + t))
    covered_lines=$((covered_lines + c))
  done < <(jq -r --arg prefix "$prefix" '
    to_entries[]
    | select(.key | startswith($prefix))
    | "\(.value.lines.total)\t\(.value.lines.covered)"
  ' "$COVERAGE_FILE")
done

if [ "$total_lines" -eq 0 ]; then
  echo "⚠️  No se encontraron archivos de Decorator/Observer en el reporte de cobertura."
  exit 0
fi

pct=$(echo "scale=2; $covered_lines * 100 / $total_lines" | bc)
echo "Cobertura combinada Decorator + Observer: ${pct}%"

if (( $(echo "$pct < $MIN_COVERAGE" | bc -l) )); then
  echo "❌ Error: Cobertura por debajo del umbral mínimo"
  echo "   Cobertura: ${pct}% | Umbral requerido: ${MIN_COVERAGE}%"
  exit 1
fi

echo "✅ Cobertura de patrones ${pct}% supera el umbral ${MIN_COVERAGE}%"

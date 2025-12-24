#!/bin/bash

# Script para ejecutar tests E2E de forma segura sin saturar el servidor
# Ejecuta los tests de uno en uno con pausas entre ellos

set -e

echo "🧪 Ejecutando tests E2E de forma segura (secuencial)..."
echo ""

# Array de archivos de test
TEST_FILES=(
  "cypress/e2e/comment-authentication.cy.js"
  "cypress/e2e/comment-permalinks.cy.js"
  "cypress/e2e/markdown.cy.js"
  "cypress/e2e/navigation-improvements.cy.js"
)

TOTAL_PASSING=0
TOTAL_FAILING=0
TOTAL_TESTS=0
FAILED_SPECS=()

# Ejecutar cada test individualmente
for TEST_FILE in "${TEST_FILES[@]}"; do
  echo "📝 Ejecutando: $TEST_FILE"

  # Ejecutar el test y capturar el resultado
  if npx cypress run --spec "$TEST_FILE" --headless; then
    echo "✅ $TEST_FILE - PASÓ"
  else
    echo "❌ $TEST_FILE - FALLÓ"
    FAILED_SPECS+=("$TEST_FILE")
  fi

  # Pausa de 3 segundos entre tests para dar tiempo al servidor
  echo "⏸️  Esperando 3 segundos antes del siguiente test..."
  sleep 3
  echo ""
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "📊 RESUMEN FINAL"
echo "════════════════════════════════════════════════════════"

if [ ${#FAILED_SPECS[@]} -eq 0 ]; then
  echo "✅ Todos los tests pasaron exitosamente!"
  exit 0
else
  echo "❌ Tests que fallaron:"
  for SPEC in "${FAILED_SPECS[@]}"; do
    echo "   - $SPEC"
  done
  exit 1
fi

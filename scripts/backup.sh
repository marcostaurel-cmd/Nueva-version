#!/usr/bin/env bash
# Respaldo semanal por etapas — miércoles 8 PM PST
set -euo pipefail

# ─── Configuración ────────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-"$PROJECT_ROOT/.backups"}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_NAME="nueva-version_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
KEEP_LAST="${KEEP_LAST:-5}"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

ETAPAS_COMPLETADAS=0
TOTAL_ETAPAS=6

# ─── Utilidades ───────────────────────────────────────────────────────────────
log()  { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
ok()   { log "  ✔ $*"; }
fail() { log "  ✘ ERROR: $*"; exit 1; }

progreso() {
  ETAPAS_COMPLETADAS=$(( ETAPAS_COMPLETADAS + 1 ))
  log ""
  log "══════════════════════════════════════════════════════"
  log "  ETAPA ${ETAPAS_COMPLETADAS}/${TOTAL_ETAPAS}: $1"
  log "══════════════════════════════════════════════════════"
}

# ─── ETAPA 1: Verificación del entorno ────────────────────────────────────────
progreso "VERIFICACIÓN DEL ENTORNO"

[[ -d "$PROJECT_ROOT" ]] || fail "Directorio del proyecto no encontrado: $PROJECT_ROOT"
[[ -f "$PROJECT_ROOT/package.json" ]] || fail "No se encontró package.json en $PROJECT_ROOT"
command -v node >/dev/null 2>&1 || fail "Node.js no está instalado"
command -v npm  >/dev/null 2>&1 || fail "npm no está instalado"

mkdir -p "$BACKUP_DIR"
ok "Directorio de respaldo listo: $BACKUP_DIR"
ok "Node $(node -v) | npm $(npm -v)"
ok "Entorno verificado"

# ─── ETAPA 2: Construcción (build de producción) ──────────────────────────────
progreso "CONSTRUCCIÓN DE PRODUCCIÓN"

cd "$PROJECT_ROOT"

if [[ ! -d "node_modules" ]]; then
  log "Instalando dependencias..."
  npm ci --silent || fail "npm ci falló"
fi

log "Ejecutando npm run build..."
npm run build >> "$LOG_FILE" 2>&1 || fail "La construcción falló — revisa $LOG_FILE"
[[ -d "$PROJECT_ROOT/dist" ]] || fail "El directorio dist no fue generado"
ok "Build completado exitosamente"

# ─── ETAPA 3: Empaquetado ─────────────────────────────────────────────────────
progreso "EMPAQUETADO DEL RESPALDO"

mkdir -p "$BACKUP_PATH"

# Copia el build de producción
cp -r "$PROJECT_ROOT/dist"         "$BACKUP_PATH/dist"
ok "dist/ copiado"

# Copia el código fuente (excluye node_modules y .backups)
tar -czf "$BACKUP_PATH/src.tar.gz" \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./.backups' \
  --exclude='./dist' \
  -C "$PROJECT_ROOT" . \
  >> "$LOG_FILE" 2>&1 || fail "Error al comprimir el código fuente"
ok "Código fuente comprimido → src.tar.gz"

# Metadata del respaldo
cat > "$BACKUP_PATH/metadata.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "fecha_pst": "$(TZ='America/Los_Angeles' date '+%Y-%m-%d %H:%M:%S %Z')",
  "fecha_utc": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
  "proyecto": "Nueva-version",
  "node_version": "$(node -v)",
  "npm_version": "$(npm -v)",
  "git_commit": "$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo 'N/A')",
  "git_branch": "$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')"
}
EOF
ok "metadata.json generado"

# Empaqueta todo en un único archivo final
ARCHIVO_FINAL="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
tar -czf "$ARCHIVO_FINAL" -C "$BACKUP_DIR" "$BACKUP_NAME" >> "$LOG_FILE" 2>&1 \
  || fail "Error al crear el archivo final del respaldo"
rm -rf "$BACKUP_PATH"
ok "Archivo final: ${ARCHIVO_FINAL}"

# ─── ETAPA 4: Almacenamiento y registro ──────────────────────────────────────
progreso "ALMACENAMIENTO Y REGISTRO"

TAMANIO="$(du -sh "$ARCHIVO_FINAL" | cut -f1)"
ok "Respaldo almacenado — tamaño: ${TAMANIO}"

# Enlace simbólico al último respaldo
ULTIMO="${BACKUP_DIR}/latest.tar.gz"
ln -sf "$ARCHIVO_FINAL" "$ULTIMO"
ok "Enlace 'latest.tar.gz' actualizado → ${ARCHIVO_FINAL}"

# ─── ETAPA 5: Verificación de integridad ─────────────────────────────────────
progreso "VERIFICACIÓN DE INTEGRIDAD"

tar -tzf "$ARCHIVO_FINAL" > /dev/null 2>&1 || fail "El archivo de respaldo está corrupto"
ok "Archivo íntegro (tar listing OK)"

# Checksum SHA-256
CHECKSUM_FILE="${ARCHIVO_FINAL}.sha256"
sha256sum "$ARCHIVO_FINAL" > "$CHECKSUM_FILE"
ok "SHA-256: $(cut -d' ' -f1 "$CHECKSUM_FILE")"

# ─── ETAPA 6: Limpieza de respaldos antiguos ──────────────────────────────────
progreso "LIMPIEZA — conservar últimos ${KEEP_LAST} respaldos"

RESPALDOS_ANTIGUOS=$(ls -t "${BACKUP_DIR}"/nueva-version_*.tar.gz 2>/dev/null | tail -n +$(( KEEP_LAST + 1 )))
if [[ -n "$RESPALDOS_ANTIGUOS" ]]; then
  while IFS= read -r viejo; do
    rm -f "$viejo" "${viejo}.sha256"
    ok "Eliminado: $(basename "$viejo")"
  done <<< "$RESPALDOS_ANTIGUOS"
else
  ok "No hay respaldos antiguos para eliminar"
fi

TOTAL_ACTUALES=$(ls "${BACKUP_DIR}"/nueva-version_*.tar.gz 2>/dev/null | wc -l)
ok "${TOTAL_ACTUALES} respaldo(s) retenido(s)"

# ─── Resumen final ────────────────────────────────────────────────────────────
log ""
log "╔══════════════════════════════════════════════════════╗"
log "║        RESPALDO COMPLETADO — ${TOTAL_ETAPAS}/${TOTAL_ETAPAS} ETAPAS OK          ║"
log "╚══════════════════════════════════════════════════════╝"
log "  Archivo : ${ARCHIVO_FINAL}"
log "  Tamaño  : ${TAMANIO}"
log "  Log     : ${LOG_FILE}"
log "  Hora PST: $(TZ='America/Los_Angeles' date '+%Y-%m-%d %H:%M:%S %Z')"
log ""

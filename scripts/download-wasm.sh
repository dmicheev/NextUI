#!/bin/bash

# Скрипт для загрузки WASM файлов ONNX Runtime Web
# Использование: ./scripts/download-wasm.sh

set -e

VERSION="1.17.0"
BASE_URL="https://cdn.jsdelivr.net/npm/onnxruntime-web@${VERSION}/dist"
TARGET_DIR="public/wasm"

echo "📥 Загрузка WASM файлов ONNX Runtime Web v${VERSION}..."
echo "📁 Целевая директория: ${TARGET_DIR}"

# Создаем директорию, если она не существует
mkdir -p "${TARGET_DIR}"

# Список файлов для загрузки
FILES=(
  "ort-wasm.wasm"
  "ort-wasm-simd.wasm"
  "ort-wasm-threaded.wasm"
  "ort-wasm-simd-threaded.wasm"
)

# Загружаем файлы
for file in "${FILES[@]}"; do
  url="${BASE_URL}/${file}"
  target="${TARGET_DIR}/${file}"
  
  echo "⬇️  Загрузка: ${file}"
  
  if curl -f -L -o "${target}" "${url}"; then
    echo "✅ Успешно: ${file}"
    
    # Вычисляем SHA-256 хеш
    hash=$(shasum -a 256 "${target}" | cut -d ' ' -f 1)
    echo "   SHA-256: ${hash}"
  else
    echo "❌ Ошибка при загрузке: ${file}"
    exit 1
  fi
done

echo ""
echo "🎉 Все WASM файлы успешно загружены!"
echo "📊 Информация о файлах:"
ls -lh "${TARGET_DIR}"

echo ""
echo "📝 Для добавления SRI хешей в HTML, используйте следующие значения:"
for file in "${FILES[@]}"; do
  target="${TARGET_DIR}/${file}"
  hash=$(shasum -a 256 "${target}" | cut -d ' ' -f 1)
  echo "<script src=\"/wasm/${file}\" integrity=\"sha256-${hash}\" crossorigin=\"anonymous\"></script>"
done

echo ""
echo "✨ Готово! Теперь WASM файлы будут загружаться из локальной директории."

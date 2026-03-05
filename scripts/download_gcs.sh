#!/usr/bin/env bash

GCS_URL="${1}"
OUTPUT_DIR="${2:-./}"

if [[ -z "$GCS_URL" ]]; then
  echo "Error: No URL provided."
  echo "Usage: $0 <gcs_url> [output_dir]"
  exit 1
fi

# Extract filename: split on / or %2F, decode last segment only
FILENAME=$(python3 -c "
import sys, urllib.parse, re
url = sys.argv[1]
parts = re.split(r'%2F|/', url, flags=re.IGNORECASE)
print(urllib.parse.unquote(parts[-1]))
" "$GCS_URL")

mkdir -p "$OUTPUT_DIR"
OUTPUT_PATH="${OUTPUT_DIR}/${FILENAME}"

echo "📥 Downloading: $FILENAME"
echo "📁 Destination: $OUTPUT_PATH"

TOKEN=$(gcloud auth print-access-token)

curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -o "$OUTPUT_PATH" \
  --progress-bar \
  --url "$GCS_URL"   # <-- use --url flag to prevent & being parsed by shell

if [[ $? -eq 0 ]]; then
  # Verify it's not an XML error response
  if file "$OUTPUT_PATH" | grep -q "XML\|ASCII"; then
    echo "❌ Got error response instead of file:"
    cat "$OUTPUT_PATH"
    rm "$OUTPUT_PATH"
    return 1
  fi
  echo "✅ Done: $OUTPUT_PATH"
else
  echo "❌ Download failed."
  exit 1
fi


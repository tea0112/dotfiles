#!/bin/bash

# Kiểm tra xem người dùng có nhập ít nhất 1 argument (tên file input) không
if [ -z "$1" ]; then
    echo "Usage: $0 <input_pdf> [output_pdf]"
    echo "Example: $0 document.pdf"
    exit 1
fi

INPUT_FILE="$1"

# Kiểm tra file input có tồn tại không
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File '$INPUT_FILE' not found!"
    exit 1
fi

# Xử lý tên file output
if [ -n "$2" ]; then
    # Nếu người dùng cung cấp argument thứ 2, dùng nó làm output
    OUTPUT_FILE="$2"
else
    # Nếu không, tự động tạo tên file output: tenfile.pdf -> tenfile-ocr.pdf
    DIR=$(dirname "$INPUT_FILE")
    FILENAME=$(basename -- "$INPUT_FILE")
    EXTENSION="${FILENAME##*.}"
    NAME="${FILENAME%.*}"
    
    # Nếu đang ở thư mục hiện tại thì bỏ ./ để nhìn cho gọn
    if [ "$DIR" = "." ]; then
        OUTPUT_FILE="${NAME}-ocr.${EXTENSION}"
    else
        OUTPUT_FILE="${DIR}/${NAME}-ocr.${EXTENSION}"
    fi
fi

echo "Processing: '$INPUT_FILE' -> '$OUTPUT_FILE'..."

# Chạy lệnh ocrmypdf với các flag bạn yêu cầu
# -l eng: Ngôn ngữ tiếng Anh
# --deskew: Chỉnh nghiêng
# --clean: Làm sạch nhiễu (noise cleaning)
# --oversample 300: Rasterize lại ở 300 DPI để tăng chất lượng OCR
# --optimize 0: Tắt tối ưu hóa dung lượng (để giữ nguyên chất lượng ảnh gốc)
# --force-ocr: Bắt buộc OCR đè lên text cũ (nếu có)
ocrmypdf -l eng \
    --deskew \
    --clean \
    --oversample 300 \
    --optimize 0 \
    --force-ocr \
    "$INPUT_FILE" \
    "$OUTPUT_FILE"

# Kiểm tra kết quả trả về
if [ $? -eq 0 ]; then
    echo "✅ Success! Output saved to: '$OUTPUT_FILE'"
else
    echo "❌ Error: OCR process failed."
    exit 1
fi


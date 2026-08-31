# Pi Agent — Global Extensions

Thư mục extension **global** của Pi Agent (`~/.pi/agent/extensions/`) — tự động load khi khởi
động pi hoặc khi gõ `/reload`. Bản sync (versioned) nằm ở `~/dotfiles/.pi/agent/extensions/`.

| File | Vai trò |
|---|---|
| `muse-review.ts` | **Muse Review Orchestrator** — quy trình viết + review nhiều bước chạy chế độ Advisor (viết bài dài) |
| `critic-review.ts` | **Critic độc lập** — đứng sau MỌI lượt trả lời của MỌI model (code, shell, văn bản…), soi lỗi và bắt làm lại |
| `muse-review.test.mjs` | Test mô phỏng end-to-end cho muse-review (53 assertions) |
| `critic-review.test.mjs` | Test mô phỏng end-to-end cho critic-review (30 assertions) |
| `netgate-provider.ts` | Đăng ký provider `netgate` (VNPT gateway, MiniMax-M3) + rate limiting theo model |
| `netgate_ratelimit.json` | State file của rate limiter (tự sinh, không sửa tay) |
| `netgate-provider.ts.bak` | Backup bản cũ |
| `test-hook.ts` | Debug utility — log `before_provider_request` ra `/home/theo/test-hook.log` |
| `package.json` | Phục vụ jiti resolve dependency của extension |

---

## muse-review.ts — Muse Review Orchestrator (Advisor Mode)

### Mục đích

Vượt qua giới hạn output tokens cứng của model (vd `opencode-go/muse-spark-1.2-contributor`)
bằng quy trình viết + review nhiều bước, tự động hoàn toàn:

```
Bước 1–3 (Writing):  Mở bài → Thân bài → Kết luận   (mỗi phần ~200–450 từ, kết thúc ---END OF PART n---)
Bước 4–6 (Review):   Chính tả & Ngữ pháp → Logic & Lập luận → Ví dụ & Thuyết phục
Bước 7   (Final):    Tổng hợp & Trau chuốt → kết thúc ---FINAL VERSION---
Dự phòng:            nếu chưa thấy FINAL, yêu cầu xuất lại đúng 1 lần
```

**Chế độ Advisor**: pipeline chạy hoàn toàn ngoài main session — extension tự gọi model qua
`ctx.modelRegistry.complete()`. Main session chỉ nhận 3 thứ:

| Thành phần | Vào context LLM? |
|---|---|
| `Muse brief › <tin nhắn của bạn>` | ✅ |
| Progress lines `✍️ [3/7] Kết luận · 210 từ · ~600 tokens · 6.4s` | ❌ (TUI-only, qua `appendEntry`) |
| `✨ Muse Review — Bản hoàn chỉnh` (bài final full) | ✅ |

Draft, step prompt, bản review trung gian **không bao giờ nằm trong main session** → context
cũ không bị bẩn. Bản full nằm trong hội thoại nên các lượt chat sau (vd "sửa đoạn 2") vẫn thấy.

### Kích hoạt & thu thập yêu cầu

- **Auto-start**: tin nhắn đầu tiên người dùng **tự gõ** của phiên **mới** (session chưa có user
  message, không phải slash command) = đề tài. Main agent không trả lời tin này.
- **Model gating**: chỉ kích hoạt khi model đang chọn nằm trong `MUSE_MODELS` (mặc định bắt
  **chính xác** `opencode-go/muse-spark-1.2-contributor`). Model khác → extension im lặng bỏ qua.
- **Mọi tin nhắn gõ thêm trong lúc chạy** được ghi vào brief và fold vào advisor context ở ranh
  giới bước kế tiếp (nhãn `YÊU CẦU BỔ SUNG từ người dùng`). Main model không trả lời riêng từng
  tin trong lúc pipeline chạy. Sau khi xong bài → chat bình thường.
- Phiên `/resume` có lịch sử → không bao giờ tự hijack.

### Điều khiển

| Lệnh/hành động | Tác dụng |
|---|---|
| `STOP_REVIEW` (gõ trong chat) | **Kill switch duy nhất** — hủy run, bản nháp bị vứt, không đưa vào hội thoại |
| Esc | ⚠️ Không dừng được advisor (main agent đang idle) |
| `/new`, `/resume`, `/reload`, quit | Tự abort sạch (`session_shutdown`) |
| `/model` giữa chừng | Không ảnh hưởng run đang chạy (advisor giữ model đã capture lúc start) |

### Xử lý sự cố

| Tình huống | Hành vi |
|---|---|
| Response < `MUSE_MIN_TOKENS` | Retry đúng `MUSE_MAX_RETRIES` lần/bước (task build lại, phản hồi xấu bị loại khỏi context) |
| Lỗi API / timeout | Dừng ngay, không retry vô hạn; **có draft thì trả bản nháp gần nhất kèm cảnh báo** |
| Quá `MUSE_MAX_STEPS` lần gọi | Dừng + trả bản gần hoàn chỉnh nhất |
| Model bỏ qua marker | Marker chỉ là advisory — vẫn chạy tiếp (dễ thấy qua progress lines) |

### Cấu hình (biến môi trường, tùy chọn)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `MUSE_MODELS` | `opencode-go/muse-spark-1.2-contributor` | Danh sách model được phép chạy, phân tách bởi dấu phẩy; entry dạng `provider/id`, hỗ trợ wildcard `*` (vd `netgate/muse-*`); `*` = mọi model |
| `MUSE_AUTO_START` | `1` | Tắt (`0`) nếu muốn tạm vô hiệu hóa |
| `MUSE_MAX_STEPS` | `10` | Số lần gọi model tối đa mỗi run |
| `MUSE_MIN_TOKENS` | `20` | Ngưỡng coi response là "quá ngắn" |
| `MUSE_MAX_RETRIES` | `1` | Số lần retry mỗi bước khi quá ngắn |
| `MUSE_STEP_TIMEOUT` | `180000` | Timeout mỗi lần gọi model (ms) |

**Thêm provider/model mới**: sửa `DEFAULT_MODELS` ở đầu `muse-review.ts` hoặc đặt
`MUSE_MODELS="a/model-1,b/model-2"` khi khởi động pi. Dùng `*` làm giá trị duy nhất sẽ cho phép
mọi model — không khuyến nghị làm mặc định vì mọi phiên mới đều thành phiên viết bài.

### Lưu ý

- Token các call của advisor **không cộng vào `/session`** của pi (gọi ngoài agent loop) — chi
  phí thật vẫn phát sinh trên provider.
- Trạng thái in-memory: `/reload`/restart giữa chừng sẽ hủy run (đúng thiết kế).
- Đánh giá "quá ngắn" dùng số token output thật từ `usage.output`, fallback ước lượng ký tự/4.

### Test & sync

```bash
# chạy test (mock modelRegistry.complete, không cần mạng/API key)
node ~/.pi/agent/extensions/muse-review.test.mjs

# sync sang dotfiles
cp ~/.pi/agent/extensions/muse-review.ts ~/.pi/agent/extensions/muse-review.test.mjs \
   ~/dotfiles/.pi/agent/extensions/
```

---

## critic-review.ts — Critic độc lập "đứng sau" (general)

Sau MỌI lượt trả lời của MỌI model (code, shell, giải thích, soạn thảo…), extension gọi 1 call
ẩn làm người phản biện khách quan. Critic KHÔNG sửa gì, không nói chuyện với user — chỉ phán
theo một trong 3 khuôn:

| Verdict | Nghĩa là | Hành động |
|---|---|---|
| `---LGTM---` | sạch | chỉ hiện dòng `✓ critic`, không tốn lượt nào |
| `---NEED-VERIFY---` | thiếu bằng chứng (test/lint chưa chạy) | chính **main agent** (kẻ có tool) được yêu cầu chạy lệnh và báo cáo; extension không bao giờ tự chạy code của bạn — chỉ tự đọc `git diff` (chỉ đọc) |
| `---ISSUES---` | có lỗi thật | đáp án cũ collapse còn 1 dòng, main agent phải kiểm chứng/sửa và **xuất lại đáp án cuối đầy đủ** |

Nguyên tắc:
- Bằng chứng = prompt + đáp án + tool log của lượt vừa chạy + git diff. Critic bị cấm đoán mò
  ngoài bằng chứng → ít false-positive.
- Trần số vòng can thiệp `CRITIC_MAX_ROUNDS` (mặc định 2) → không loop vô tận.
- User nhắn tin mới → mọi phán quyết đang chờ bị hủy ngay (không inject vào chuyện mới).
- Muse Review đang chạy → critic im lặng hoàn toàn (phối hợp qua `pi.events`).
- Đáp án bị thay thế được collapse qua markdownTransformer (display-only).

### Điều khiển & cấu hình

| | |
|---|---|
| `CRITIC_OFF` / `CRITIC_ON` | tắt / bật critic cho phiên hiện tại (gõ trong chat) |
| `CRITIC_AUTO=1\|0` | mặc định bật cho mọi model (đặt `0` nếu muốn) |
| `CRITIC_MAX_ROUNDS=2` | số lần critic được can thiệp / lượt hỏi |
| `CRITIC_TIMEOUT=60000` | timeout mỗi call critic (ms) |
| `CRITIC_MIN_ANSWER=120` | đáp án ngắn hơn mức này + không có tool call → bỏ qua |

Chi phí: mỗi lượt đáng kể = +1 call ẩn; khi có lỗi = +1 lượt main agent sửa. Token call critic
không vào `/session` của pi.

```bash
node ~/.pi/agent/extensions/critic-review.test.mjs
cp ~/.pi/agent/extensions/critic-review.ts ~/.pi/agent/extensions/critic-review.test.mjs \
   ~/dotfiles/.pi/agent/extensions/
```

---

## netgate-provider.ts

Đăng ký provider `netgate` (OpenAI-compatible gateway, mặc định `https://net.vnpt.vn/gateway/v1`,
auth qua env `AI_GATEWAY_API_KEY`, base URL override bằng `AI_GATEWAY_BASE_URL`) với model
`MiniMax/MiniMax-M3` (150k context). Kèm **rate limiting** riêng cho các model của provider này —
danh sách model bị limit được dẫn xuất tự động từ config, persist state vào
`netgate_ratelimit.json` (có file lock tránh race).

## test-hook.ts

Debug utility: ghi mỗi `before_provider_request` (500 ký tự đầu) vào
`/home/theo/test-hook.log`. Chỉ bật khi cần debug payload provider — nên xóa/comment khi không dùng.

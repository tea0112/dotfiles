# Pi Agent — Global Extensions

Thư mục extension **global** của Pi Agent (`~/.pi/agent/extensions/`) — tự động load khi khởi
động pi hoặc khi gõ `/reload`. Bản sync (versioned) nằm ở `~/dotfiles/.pi/agent/extensions/`.

| File | Vai trò |
|---|---|
| `muse-review.ts` | **Muse Suite — 1 extension, 2 engine, chỉ áp dụng cho model trong `MUSE_MODELS`**: Engine 1 viết bài dài (Advisor pipeline), Engine 2 = Critic độc lập soi mọi sản phẩm của muse |
| `muse-review.test.mjs` | Test mô phỏng end-to-end cho cả 2 engine (107 assertions, không cần mạng) |
| `netgate-provider.ts` | Đăng ký provider `netgate` (VNPT gateway, MiniMax-M3) + rate limiting theo model |
| `netgate_ratelimit.json` | State file của rate limiter (tự sinh, không sửa tay) |
| `netgate-provider.ts.bak` | Backup bản cũ |
| `test-hook.ts` | Debug utility — log `before_provider_request` ra `/home/theo/test-hook.log` |
| `package.json` | Phục vụ jiti resolve dependency của extension |

---

## muse-review.ts — Muse Suite (model yếu như muse-spark)

### Model gating — quan trọng nhất

**TOÀN BỘ suite (cả 2 engine) CHỈ hoạt động khi model đang chọn nằm trong `MUSE_MODELS`**
(mặc định bắt chính xác `opencode-go/muse-spark-1.2-contributor`). Model khác → extension
im lặng 100%: không hijack tin nhắn, không critic. Đây là điểm khác với các bản trước.

### Engine 1 — Advisor pipeline (viết bài dài)

Vượt giới hạn output tokens của model bằng quy trình chạy hoàn toàn ngoài main session qua
`ctx.modelRegistry.complete()`:

```
Bước 1–3 (Writing):  Mở bài → Thân bài → Kết luận   (mỗi phần có NGƯỠNG TỐI THIỂU, kết thúc ---END OF PART n---)
Bước 4–6 (Review):   Chính tả & Ngữ pháp → Logic & Lập luận → Ví dụ & Thuyết phục
Bước 7   (Final):    Tổng hợp & Trau chuốt → kết thúc ---FINAL VERSION---
Dự phòng:            nếu chưa thấy FINAL, yêu cầu xuất lại đúng 1 lần
```

**Chống cắt (max output)**: lượt trả lời bị ngắt vì chạm giới hạn output (`stopReason=length`)
KHÔNG bị bỏ — extension bảo model **VIẾT TIẾP từ đúng chỗ dừng** (tối đa `MUSE_MAX_CONTINUATIONS`
lần) rồi ghép lại thành nội dung đầy đủ của bước.

**Chặn lười**: mỗi bước có ngưỡng tối thiểu — bước viết theo số từ cứng (Mở bài ≥150, Thân bài
≥220, Kết luận ≥100 từ), bước review/tổng hợp phải ≥70–80% độ dài bản hiện tại. Quá cụt → quát
lỗi ("PHẢN HỒI QUÁ CỤT — BẠN ĐANG LƯỜI") + bắt viết lại chi tiết (`MUSE_MAX_RETRIES` lần/bước),
phản hồi lười bị loại khỏi context. Chi tiết trước, review sau, rồi mới trả kết quả.

**Chế độ Advisor**: main session chỉ nhận 3 thứ:

| Thành phần | Vào context LLM? |
|---|---|
| `Muse brief › <tin nhắn của bạn>` | ✅ |
| Progress lines `✍️ [3/7] Kết luận · 210 từ · ~600 tokens · 6.4s` | ❌ (TUI-only, qua `appendEntry`) |
| `✨ Muse Review — Bản hoàn chỉnh` (bài final full) | ✅ |

Draft, step prompt, bản review trung gian **không bao giờ nằm trong main session** → context
cũ không bị bẩn. Bản full nằm trong hội thoại nên các lượt chat sau vẫn thấy.

### Kích hoạt — MỌI tin nhắn

- **Mọi tin nhắn tự gõ** trên muse model (không phải slash command) = đề tài → pipeline chạy,
  main model KHÔNG trả lời riêng (`action: handled`). Không chỉ tin đầu tiên.
- Tin gõ thêm **trong lúc pipeline đang chạy** → fold vào brief (nhãn `YÊU CẦU BỔ SUNG`), tính
  vào bài viết đang soạn. Xong bài → tin kế tiếp lại mở pipeline mới.
- `/resume` có lịch sử → **vẫn chạy** (mọi tin nhắn). Slash command (`/…`) không bị hijack.
- `MUSE_AUTO_START=0` → chat bình thường (critic vẫn soi answer, xem Engine 2).

### Engine 2 — Critic độc lập (chỉ trên muse model)

Soi MỌI sản phẩm của muse model:

**(a) Bài viết của pipeline**: ngay sau khi deliver, critic đọc đề bài + bài viết và phán.

| Verdict | Hành động |
|---|---|
| `---LGTM---` | dòng `✓ critic · bài viết đạt`, xong |
| `---ISSUES---` | gọi thêm bước **CHỈNH SỬA trong kênh ẩn** (giữ phần tốt, xử lý từng nhận xét, xuất lại toàn bộ) → deliver bản mới, bản cũ tự collapse còn 1 dòng. Trần `CRITIC_MAX_ROUNDS` vòng sửa |
| `---NEED-VERIFY---` | bỏ qua — bài viết không cần chạy lệnh lấy bằng chứng |

**(b) Mọi answer của main agent** (khi main agent có chạy: slash command, tool loop,
`MUSE_AUTO_START=0`…): như cũ — ISSUES → đáp án cũ collapse, main agent phải sửa và xuất lại
đầy đủ; NEED-VERIFY → main agent chạy lệnh lấy bằng chứng.

**Critic chỉ đòi lệnh verify RẺ NHANH** (unit test 1–2 file, typecheck, lint — tự thoát trong
~30s). **CẤM đòi** start/dev server, watch, build đầy đủ, e2e, cài dependencies, migration,
gọi network ngoài, lệnh tương tác — việc xác minh đắt đó → critic tự kết luận từ bằng chứng
tĩnh (đọc code/diff/log), không bắt user chờ. Critic cũng không bao giờ tự chạy code của bạn —
chỉ tự đọc `git diff` (chỉ đọc). Bằng chứng = prompt + đáp án + tool log + git diff, cấm đoán mò.

User nhắn tin mới → phán quyết đang chờ hủy ngay. Trần vòng `CRITIC_MAX_ROUNDS` → không loop.

### Điều khiển

| Lệnh/hành động | Tác dụng |
|---|---|
| `STOP_REVIEW` (gõ trong chat) | **Kill switch duy nhất** — hủy cả pipeline lẫn critic đang dở; bản nháp bị vứt |
| `CRITIC_OFF` / `CRITIC_ON` | tắt / bật riêng Engine 2 |
| Esc | ⚠️ Không dừng được advisor (main agent đang idle) |
| `/new`, `/resume`, `/reload`, quit | Tự abort sạch (`session_shutdown`) |

### Xử lý sự cố

| Tình huống | Hành vi |
|---|---|
| Output bị cắt (`stopReason=length`) | Bảo **viết tiếp** tối đa `MUSE_MAX_CONTINUATIONS` lần, rồi ghép; vẫn cắt → cảnh báo + lấy phần dài nhất |
| Response quá cụt (thiếu từ/tokens) | Quát + bắt viết lại `MUSE_MAX_RETRIES` lần/bước |
| Lỗi API / timeout | Dừng ngay, không retry vô hạn; **có draft thì trả bản nháp gần nhất kèm cảnh báo** |
| Quá `MUSE_MAX_STEPS` lần gọi | Dừng + trả bản gần hoàn chỉnh nhất |
| Model bỏ qua marker | Marker chỉ là advisory — vẫn chạy tiếp (dễ thấy qua progress lines) |

### Cấu hình (biến môi trường, tùy chọn)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `MUSE_MODELS` | `opencode-go/muse-spark-1.2-contributor` | Danh sách model áp dụng suite, phân tách phẩy; dạng `provider/id`, hỗ trợ wildcard `*` (vd `netgate/muse-*`); `*` = mọi model |
| `MUSE_AUTO_START` | `1` | `1`: mọi tin nhắn tự gõ trên muse model → pipeline. `0`: chat bình thường (critic vẫn soi) |
| `MUSE_MAX_STEPS` | `14` | Số lần gọi model tối đa mỗi run (gồm cả lượt viết tiếp) |
| `MUSE_MIN_TOKENS` | `20` | Sàn tokens tối thiểu mỗi lượt gọi |
| `MUSE_MAX_RETRIES` | `2` | Số lần bắt viết lại khi output quá cụt |
| `MUSE_MAX_CONTINUATIONS` | `4` | Số lần bảo "viết tiếp" khi bị cắt ở giới hạn max output |
| `MUSE_STEP_TIMEOUT` | `180000` | Timeout mỗi lần gọi model (ms) |
| `CRITIC_AUTO` | `1` | Bật/tắt Engine 2 |
| `CRITIC_MAX_ROUNDS` | `2` | Số vòng critic can thiệp (sửa bài / bắt verify) |
| `CRITIC_TIMEOUT` | `60000` | Timeout mỗi call critic (ms) |
| `CRITIC_MIN_ANSWER` | `120` | Answer của main agent ngắn hơn + không tool call → bỏ qua khỏi soi |

**Thêm provider/model mới**: sửa `DEFAULT_MODELS` ở đầu `muse-review.ts` hoặc đặt
`MUSE_MODELS="a/model-1,b/model-2"` khi khởi động pi. Dùng `*` làm giá trị duy nhất sẽ cho phép
mọi model — không khuyến nghị làm mặc định vì mọi tin nhắn đều thành phiên viết bài.

### Lưu ý

- Token các call ẩn (advisor + critic) **không cộng vào `/session`** của pi (gọi ngoài agent
  loop) — chi phí thật vẫn phát sinh trên provider.
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

## netgate-provider.ts

Đăng ký provider `netgate` (OpenAI-compatible gateway, mặc định `https://net.vnpt.vn/gateway/v1`,
auth qua env `AI_GATEWAY_API_KEY`, base URL override bằng `AI_GATEWAY_BASE_URL`) với model
`MiniMax/MiniMax-M3` (150k context). Kèm **rate limiting** riêng cho các model của provider này —
danh sách model bị limit được dẫn xuất tự động từ config, persist state vào
`netgate_ratelimit.json` (có file lock tránh race).

## test-hook.ts

Debug utility: ghi mỗi `before_provider_request` (500 ký tự đầu) vào
`/home/theo/test-hook.log`. Chỉ bật khi cần debug payload provider — nên xóa/comment khi không dùng.

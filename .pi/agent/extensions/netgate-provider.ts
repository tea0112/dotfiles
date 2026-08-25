import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export default function (pi: ExtensionAPI) {
  pi.registerProvider("netgate", {
    name: "netGate",
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://net.vnpt.vn/gateway/v1", 
    apiKey: "$AI_GATEWAY_API_KEY",
    api: "openai-completions",
    models: [
      {
        id: "MiniMax/MiniMax-M3",
        name: "minimax-m3-custom",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 150000, 
        maxTokens: 16384
      }
    ]
  });

  // Tệp tin lưu trữ trạng thái xô token dùng chung cho tất cả các terminal
  const STATE_FILE = path.join(os.homedir(), '.pi/agent/extensions/netgate_ratelimit.json');
  const LOCK_FILE = STATE_FILE + '.lock';

  // Hàm khóa file để chống xung đột (race condition) giữa nhiều terminal
  async function acquireLock() {
    while (true) {
      try {
        const fd = fs.openSync(LOCK_FILE, 'wx'); // Tạo file nguyên tử (atomic)
        fs.closeSync(fd);
        return;
      } catch (err: any) {
        if (err.code === 'EEXIST') {
          // Xóa lock nếu quá hạn 5s (phòng hờ tiến trình trước crash)
          const stat = fs.statSync(LOCK_FILE, { throwIfNoEntry: false });
          if (stat && Date.now() - stat.mtimeMs > 5000) {
            try { fs.unlinkSync(LOCK_FILE); } catch(e) {}
          }
          await new Promise(r => setTimeout(r, 20)); // Đợi 20ms rồi thử lại
        } else {
          throw err;
        }
      }
    }
  }

  function releaseLock() {
    try { fs.unlinkSync(LOCK_FILE); } catch(e) {}
  }

  async function consumeTokensAcrossProcesses(tokensNeeded: number) {
    await acquireLock();
    try {
      let state = { tokens: 600000, requests: 30, lastRefill: Date.now() };
      
      if (fs.existsSync(STATE_FILE)) {
        try { 
          const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); 
          // Chỉ lấy nếu đúng chuẩn số để tránh bị NaN do lỗi ghi đè rác
          if (typeof parsed.tokens === 'number' && !isNaN(parsed.tokens)) state.tokens = parsed.tokens;
          if (typeof parsed.requests === 'number' && !isNaN(parsed.requests)) state.requests = parsed.requests;
          if (typeof parsed.lastRefill === 'number' && !isNaN(parsed.lastRefill)) state.lastRefill = parsed.lastRefill;
        } catch (e) {
          // Bỏ qua nếu file lỗi, tiếp tục với state đầy (max quota)
        }
      }

      const now = Date.now();
      const elapsedMs = now - state.lastRefill;
      
      // Hồi phục token
      state.tokens = Math.min(600000, state.tokens + elapsedMs * 10);
      state.requests = Math.min(30, state.requests + elapsedMs * 0.0005);
      state.lastRefill = now;

      let delayMs = 0;
      if (tokensNeeded > state.tokens) {
        delayMs = Math.max(delayMs, (tokensNeeded - state.tokens) / 10);
      }
      if (1 > state.requests) {
        delayMs = Math.max(delayMs, (1 - state.requests) / 0.0005);
      }

      // CHÌA KHÓA: Trừ token NGAY LẬP TỨC (thấu chi) trước khi ngủ.
      state.tokens -= tokensNeeded;
      state.requests -= 1;

      // GHI FILE NGUYÊN TỬ (Atomic Write) chống lỗi Ctrl+C giữa chừng
      const tempFile = STATE_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(state));
      fs.renameSync(tempFile, STATE_FILE);

      return delayMs;
    } finally {
      releaseLock();
    }
  }

  pi.on("before_provider_request", async (event: any) => {
    const payloadStr = JSON.stringify(event.payload || {});
    const tokensNeeded = Math.min(150000, Math.floor(payloadStr.length / 3) + 500);

    const delayMs = await consumeTokensAcrossProcesses(tokensNeeded);
    
    if (delayMs > 0) {
      const waitTime = Math.ceil(delayMs) + 100;
      console.log(`\n[NetGate Rate Limiter] (Multi-process) Hết quota! Ép trễ ${Math.round(waitTime/1000 * 10)/10}s cho ${tokensNeeded} tokens...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  });
}

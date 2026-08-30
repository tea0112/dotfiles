import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export default function (pi: ExtensionAPI) {
  const netgateConfig = {
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
  };
  pi.registerProvider("netgate", netgateConfig);

  // Chỉ áp dụng rate limiting cho các model thuộc provider netgate.
  // Dẫn xuất từ config để model mới thêm vào provider tự động được cover.
  const NETGATE_MODEL_IDS = new Set(netgateConfig.models.map((m: any) => m.id));

  // Cờ được set ở hook `before_provider_request`, hook `after_provider_response`
  // dùng nó để quyết định có xử lý hay không (event after không chứa model).
  let lastWasNetgate = false;

  const STATE_FILE = path.join(os.homedir(), '.pi/agent/extensions/netgate_ratelimit.json');
  const LOCK_FILE = STATE_FILE + '.lock';

  async function acquireLock() {
    while (true) {
      try {
        const fd = fs.openSync(LOCK_FILE, 'wx');
        fs.closeSync(fd);
        return;
      } catch (err: any) {
        if (err.code === 'EEXIST') {
          const stat = fs.statSync(LOCK_FILE, { throwIfNoEntry: false });
          if (stat && Date.now() - stat.mtimeMs > 5000) {
            try { fs.unlinkSync(LOCK_FILE); } catch(e) {}
          }
          await new Promise(r => setTimeout(r, 20));
        } else {
          throw err;
        }
      }
    }
  }

  function releaseLock() {
    try { fs.unlinkSync(LOCK_FILE); } catch(e) {}
  }

  async function syncStateWithServer(serverTokens: number) {
    await acquireLock();
    try {
      let state: any = { tokens: 600000, requests: 30, lastRefill: Date.now(), lockUntil: 0 };
      if (fs.existsSync(STATE_FILE)) {
        try { 
          const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); 
          if (typeof parsed.tokens === 'number' && !isNaN(parsed.tokens)) state.tokens = parsed.tokens;
          if (typeof parsed.requests === 'number' && !isNaN(parsed.requests)) state.requests = parsed.requests;
          if (typeof parsed.lastRefill === 'number' && !isNaN(parsed.lastRefill)) state.lastRefill = parsed.lastRefill;
          if (typeof parsed.lockUntil === 'number' && !isNaN(parsed.lockUntil)) state.lockUntil = parsed.lockUntil;
        } catch (e) {}
      }
      
      // Ghi đè số dư từ Server
      state.tokens = serverTokens;
      state.lastRefill = Date.now();

      const tempFile = STATE_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(state));
      fs.renameSync(tempFile, STATE_FILE);
    } finally {
      releaseLock();
    }
  }

  async function setEmergencyLock(resetDelayMs: number) {
    await acquireLock();
    try {
      let state: any = { tokens: 600000, requests: 30, lastRefill: Date.now(), lockUntil: 0 };
      if (fs.existsSync(STATE_FILE)) {
        try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); } catch (e) {}
      }
      // Đặt cờ khóa khẩn cấp
      state.lockUntil = Date.now() + resetDelayMs;
      // Reset số dư về 0 để đồng bộ log
      state.tokens = 0;
      state.requests = 0;

      const tempFile = STATE_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(state));
      fs.renameSync(tempFile, STATE_FILE);
    } finally {
      releaseLock();
    }
  }

  async function consumeTokensAcrossProcesses(tokensNeeded: number) {
    await acquireLock();
    try {
      let state: any = { tokens: 600000, requests: 30, lastRefill: Date.now(), lockUntil: 0 };
      
      if (fs.existsSync(STATE_FILE)) {
        try { 
          const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); 
          if (typeof parsed.tokens === 'number' && !isNaN(parsed.tokens)) state.tokens = parsed.tokens;
          if (typeof parsed.requests === 'number' && !isNaN(parsed.requests)) state.requests = parsed.requests;
          if (typeof parsed.lastRefill === 'number' && !isNaN(parsed.lastRefill)) state.lastRefill = parsed.lastRefill;
          if (typeof parsed.lockUntil === 'number' && !isNaN(parsed.lockUntil)) state.lockUntil = parsed.lockUntil;
        } catch (e) {}
      }

      // 1. Kiểm tra cờ Khóa khẩn cấp (Fixed Window 429)
      if (state.lockUntil && Date.now() < state.lockUntil) {
         const forceWait = state.lockUntil - Date.now();
         return forceWait;
      }

      // 2. Tính toán Local Bucket
      const now = Date.now();
      const elapsedMs = now - state.lastRefill;
      
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

      state.tokens -= tokensNeeded;
      state.requests -= 1;

      const tempFile = STATE_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(state));
      fs.renameSync(tempFile, STATE_FILE);

      return delayMs;
    } finally {
      releaseLock();
    }
  }

  // Biến lưu thời điểm gửi request cuối cùng để phát hiện Retry
  let lastRequestTime = 0;

  pi.on("before_provider_request", async (event: any) => {
    // Chỉ throttle cho model của netgate; bỏ qua mọi provider khác.
    lastWasNetgate = NETGATE_MODEL_IDS.has(event.payload?.model);
    if (!lastWasNetgate) return;

    const now = Date.now();
    
    // PHÁT HIỆN RETRY: Pi Agent mặc định retry 3 lần mỗi lần cách nhau chỉ 1-2s.
    // Nếu khoảng cách giữa 2 request < 4 giây, chắc chắn là đang bị 429 và bị ép retry.
    if (lastRequestTime > 0 && now - lastRequestTime < 4000) {
      const retryDelay = 65000; // Ép chờ 65s cho mỗi lần retry
      console.log(`\n[NetGate Rate Limiter] Cảnh báo: Pi Agent đang Retry quá nhanh! Kéo giãn thêm 65s để chờ Server nhả Token (Rolling Window)...`);
      await new Promise(r => setTimeout(r, retryDelay));
    }

    const payloadStr = JSON.stringify(event.payload || {});
    // CHUẨN HÓA CÔNG THỨC: Chia 2 thay vì chia 3 (an toàn hơn cho tiếng Việt/Code) + cộng 16384 (Max Tokens)
    const tokensNeeded = Math.min(150000, Math.floor(payloadStr.length / 2) + 500 + 16384);

    const delayMs = await consumeTokensAcrossProcesses(tokensNeeded);
    
    if (delayMs > 0) {
      const waitTime = Math.ceil(delayMs) + 100;
      console.log(`\n[NetGate Rate Limiter] Quá tải Local! Ép trễ ${Math.round(waitTime/1000 * 10)/10}s cho ${tokensNeeded} tokens...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
    
    // Cập nhật thời điểm gửi (sau khi đã ngủ xong)
    lastRequestTime = Date.now();
  });

  // Hook 2: Đồng bộ trạng thái với Server
  pi.on("after_provider_response", async (event: any) => {
    // Event này không mang model; bỏ qua nếu request trước đó không phải netgate.
    if (!lastWasNetgate) return;

    // Nếu dính 429 thật sự, khóa 60 giây (đủ để qua phút mới)
    if (event.status === 429) {
      console.log(`\n[NetGate Rate Limiter] Bắt được 429 từ Server! Tự động bật Khóa 60s để cứu /goal...`);
      await setEmergencyLock(60000);
      return;
    }

    // Nếu có Header từ Server, đồng bộ số dư về file
    if (event.headers) {
       // LiteLLM trả về header chữ thường
       const remainingStr = event.headers["x-ratelimit-team_member-remaining-tokens"] || event.headers["x-ratelimit-remaining-tokens"];
       if (remainingStr) {
          const serverTokens = parseInt(remainingStr, 10);
          if (!isNaN(serverTokens)) {
             await syncStateWithServer(serverTokens);
          }
       }
    }
  });
}

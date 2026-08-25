import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("netgate", {
    name: "netGate",
    
    // SỬA Ở ĐÂY: Gọi trực tiếp biến môi trường qua process.env, 
    // kèm theo URL dự phòng (fallback) để đảm bảo không bao giờ bị lỗi URL trống.
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://net.vnpt.vn/gateway/v1", 
    
    // apiKey thì vẫn dùng cú pháp "$" được theo chuẩn của Pi
    apiKey: "$AI_GATEWAY_API_KEY",
    
    api: "openai-completions",
    
    models: [
      {
        id: "MiniMax/MiniMax-M3",
        name: "minimax-m3-custom",
        reasoning: false,
        input: ["text", "image"],
        cost: { 
          input: 0, 
          output: 0, 
          cacheRead: 0, 
          cacheWrite: 0 
        },
        // Đặt contextWindow 150,000 (tối đa) - kết hợp với hook rate-limit bên dưới để không bị 429
        contextWindow: 150000, 
        maxTokens: 16384
      }
    ]
  });

  // Kỹ thuật Token Bucket (Dynamic Rate Limiting)
  // Tối ưu hóa throughput: Gửi request ngay lập tức nếu còn quota. Chỉ delay khi sắp chạm trần API.
  const MAX_TPM = 600000;
  const MAX_RPM = 30;
  let currentTokens = MAX_TPM;
  let currentRequests = MAX_RPM;
  let lastRefillTime = Date.now();

  function refill() {
    const now = Date.now();
    const elapsedMs = now - lastRefillTime;
    // 600,000 tokens / 60,000 ms = 10 tokens / ms
    currentTokens = Math.min(MAX_TPM, currentTokens + (elapsedMs * 10));
    // 30 requests / 60,000 ms = 0.0005 req / ms
    currentRequests = Math.min(MAX_RPM, currentRequests + (elapsedMs * 0.0005));
    lastRefillTime = now;
  }

  pi.on("before_provider_request", async (event: any) => {
    // Ước tính số token của request (1 token ~ 3.5 ký tự)
    const payloadStr = JSON.stringify(event.payload || {});
    const tokensNeeded = Math.min(150000, Math.floor(payloadStr.length / 3) + 500);

    refill();
    let delayMs = 0;
    
    // Nếu không đủ tokens, tính thời gian cần chờ
    if (tokensNeeded > currentTokens) {
      delayMs = Math.max(delayMs, (tokensNeeded - currentTokens) / 10);
    }
    
    // Nếu không đủ requests, tính thời gian cần chờ
    if (1 > currentRequests) {
      delayMs = Math.max(delayMs, (1 - currentRequests) / 0.0005);
    }
    
    if (delayMs > 0) {
      delayMs = Math.ceil(delayMs) + 100; // Thêm 100ms buffer an toàn
      console.log(`\n[NetGate Rate Limiter] Hết quota! Đang ép trễ ${Math.round(delayMs/1000 * 10)/10}s để hồi phục ${tokensNeeded} tokens...`);
      await new Promise(r => setTimeout(r, delayMs));
      refill(); // Cập nhật lại bucket sau khi ngủ dậy
    }
    
    currentTokens -= tokensNeeded;
    currentRequests -= 1;
  });
}

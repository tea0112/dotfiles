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
        contextWindow: 1000000, 
        maxTokens: 65536
      }
    ]
  });
}

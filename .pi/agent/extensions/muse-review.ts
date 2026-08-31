/**
 * muse-review.ts — Muse Review Orchestrator (ADVISOR MODE) cho Pi Agent
 *
 * Mục đích:
 *   Vượt qua giới hạn output tokens cứng của model (opencode-go/muse-spark-1.2-contributor)
 *   bằng quy trình viết + review nhiều bước. Chế độ ADVISOR: pipeline chạy HOÀN TOÀN NGÕAI
 *   main session qua ctx.modelRegistry.complete() — main session chỉ nhận:
 *     1. Các tin nhắn của bạn (mirror thành "Muse brief", visible)
 *     2. Progress lines (appendEntry — CHỈ hiển thị TUI, KHÔNG vào context LLM)
 *     3. Bản hoàn chỉnh cuối cùng (custom message "Muse Review — Bản hoàn chỉnh")
 *   Draft, step prompt, bản review trung gian KHÔNG BAO GIỜ nằm trong main session
 *   → context cũ không bị response của review làm bẩn.
 *
 * Model gating:
 *   Chỉ kích hoạt khi model đang chọn nằm trong danh sách MUSE_MODELS (mặc định bắt
 *   chính xác "opencode-go/muse-spark-1.2-contributor"). Model khác → im lặng bỏ qua,
 *   tin nhắn đi qua main agent bình thường. MUSE_MODELS phân tách bởi dấu phẩy,
 *   mỗi entry dạng "provider/id", hỗ trợ wildcard *; đặt "*" để cho phép mọi model.
 *   Advisor capture model lúc start — /model giữa chừng không ảnh hưởng run đang chạy.
 *
 * Luồng kích hoạt & thu thập yêu cầu:
 *   - Tin nhắn đầu tiên người dùng TỰ GÕ của phiên MỚI (session chưa có user message,
 *     không phải slash command) → start advisor. Main agent KHÔNG trả lời tin này.
 *   - Trong lúc advisor chạy, mọi tin nhắn của bạn được ghi vào brief (fold vào context
 *     của advisor ở ranh giới bước kế tiếp) và mirror vào main session — KHÔNG được
 *     main model trả lời riêng. Sau khi xong bài → chat bình thường.
 *   - Kill switch: gõ STOP_REVIEW (bất kể model gì) → abort. Esc KHÔNG dừng được
 *     (main agent đang idle). /new, /resume, /reload, quit → abort sạch.
 *
 * Pipeline (7 bước chính + 1 bước dự phòng, tối đa MUSE_MAX_STEPS lần gọi):
 *   Bước 1–3 (Writing): Mở bài / Thân bài / Kết luận, đánh dấu ---END OF PART n---
 *   Bước 4–6 (Review) : Chính tả & Ngữ pháp / Logic & Lập luận / Ví dụ & Thuyết phục
 *                       — mỗi bước đọc toàn bộ advisor context, chỉ xuất bản đã cải thiện
 *   Bước 7   (Final)  : Tổng hợp & Trau chuốt, kết thúc ---FINAL VERSION---
 *   Dự phòng          : nếu chưa thấy ---FINAL VERSION---, yêu cầu xuất lại đúng 1 lần
 *   Dừng bất thường (lỗi API/timeout/maxSteps) → trả về bản nháp gần nhất (có cảnh báo).
 *   STOP_REVIEW → hủy, KHÔNG đưa bản nháp vào hội thoại.
 *
 * Xử lý sự cố (spec mục 7):
 *   - Phản hồi < MUSE_MIN_TOKENS → retry đúng MUSE_MAX_RETRIES lần (task được build lại).
 *   - stopReason "error" / throw / timeout → dừng + báo lỗi, không retry vô hạn.
 *
 * Cấu hình env (tùy chọn):
 *   MUSE_MODELS=list      danh sách model (mặc định: opencode-go/muse-spark-1.2-contributor)
 *   MUSE_AUTO_START=1|0   bật/tắt auto-start (mặc định 1)
 *   MUSE_MAX_STEPS=10     số lần gọi model tối đa (mặc định 10)
 *   MUSE_MIN_TOKENS=20    ngưỡng "quá ngắn" (mặc định 20)
 *   MUSE_MAX_RETRIES=1    retry mỗi bước khi quá ngắn (mặc định 1)
 *   MUSE_STEP_TIMEOUT=180000  timeout mỗi lần gọi model (ms)
 *
 * Lưu ý: token các call advisor KHÔNG cộng vào /session của pi (gọi ngoài agent loop).
 * Trạng thái in-memory — /reload/restart giữa chừng sẽ hủy run.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { uuidv7, type Message as AiMessage } from "@earendil-works/pi-ai";

// ============================== Cấu hình ==============================

function envInt(name: string, def: number, min = 0): number {
	const raw = process.env[name];
	if (!raw) return def;
	const n = Number.parseInt(raw, 10);
	return Number.isFinite(n) && n >= min ? n : def;
}

function envBool(name: string, def: boolean): boolean {
	const raw = process.env[name];
	if (raw === undefined || raw === "") return def;
	return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

// Danh sách model được phép chạy quy trình — THÊM PROVIDER MỚI VÀO ĐÂY (hoặc dùng env MUSE_MODELS).
// Mỗi entry dạng "provider/id", hỗ trợ wildcard * (ví dụ "opencode-go/muse-spark-*").
const DEFAULT_MODELS = ["opencode-go/muse-spark-1.2-contributor"];

function parseModels(raw: string | undefined): string[] {
	if (raw === undefined || raw.trim() === "") return [...DEFAULT_MODELS];
	const list = raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	return list.length > 0 ? list : [...DEFAULT_MODELS];
}

const CONFIG = {
	autoStart: envBool("MUSE_AUTO_START", true),
	maxSteps: envInt("MUSE_MAX_STEPS", 10, 1),
	minTokens: envInt("MUSE_MIN_TOKENS", 20, 1),
	maxRetries: envInt("MUSE_MAX_RETRIES", 1, 0),
	stepTimeoutMs: envInt("MUSE_STEP_TIMEOUT", 180_000, 1_000),
	models: parseModels(process.env["MUSE_MODELS"]),
};

const EXT_ID = "muse-review";
const STOP_TEXT = "STOP_REVIEW";

const FINAL_MARKER_RE = /-{3,}\s*FINAL\s+VERSION\s*-{3,}/i;
const partMarkerRe = (part: number): RegExp =>
	new RegExp(`-{3,}\\s*END OF PART ${part}\\s*-{3,}`, "i");

// ============================== Model matching ==============================

/** So khớp "provider/id" của model với DANH SÁCH pattern glob đơn giản (chỉ hỗ trợ *). */
function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function modelMatches(model: { provider?: string; id?: string } | undefined): boolean {
	const id = model ? `${model.provider ?? ""}/${model.id ?? ""}` : "";
	if (!id || id === "/") return false;
	return CONFIG.models.some((pattern) => {
		if (pattern === "*") return true;
		const re = new RegExp(`^${pattern.split("*").map(escapeRegExp).join(".*")}$`, "i");
		return re.test(id);
	});
}

// ============================== Định nghĩa các bước ==============================

interface StepDef {
	phase: "writing" | "review" | "final";
	title: string;
	task: string;
	tail: string;
	part?: number;
}

const STEPS: StepDef[] = [
	{
		phase: "writing",
		part: 1,
		title: "Mở bài",
		task:
			"Viết MỞ BÀI của bài luận cho đề tài trong hội thoại: giới thiệu vấn đề, tạo điểm thu hút, dẫn dắt vào luận đề. Độ dài mục tiêu: khoảng 200–350 từ.",
		tail: "Kết thúc phần bằng đúng dòng: ---END OF PART 1---",
	},
	{
		phase: "writing",
		part: 2,
		title: "Thân bài",
		task:
			"Viết THÂN BÀI, tiếp nối Mở bài đã có trong hội thoại. Triển khai từng luận điểm chính thành đoạn văn hoàn chỉnh (mỗi đoạn một luận điểm, có câu chủ đề). Độ dài mục tiêu: khoảng 300–450 từ.",
		tail: "Kết thúc phần bằng đúng dòng: ---END OF PART 2---",
	},
	{
		phase: "writing",
		part: 3,
		title: "Kết luận",
		task:
			"Viết KẾT LUẬN, khép lại bài viết bằng cách chốt vấn đề và nâng tầm thông điệp, dựa trên Mở bài và Thân bài đã có trong hội thoại. Độ dài mục tiêu: khoảng 150–250 từ.",
		tail: "Kết thúc phần bằng đúng dòng: ---END OF PART 3---",
	},
	{
		phase: "review",
		title: "Chính tả & Ngữ pháp",
		task:
			"REVIEW CHÍNH TẢ & NGỮ PHÁP: đọc toàn bộ nội dung bài viết trong hội thoại, sửa TẤT CẢ lỗi chính tả, ngữ pháp, dấu câu và dùng từ. Chỉ xuất ra toàn bộ bản đã sửa (ghép liền mạch), KHÔNG liệt kê lỗi, KHÔNG bình luận.",
		tail: "Không thêm bất kỳ dấu hiệu kết thúc đặc biệt nào.",
	},
	{
		phase: "review",
		title: "Logic & Lập luận",
		task:
			"REVIEW LOGIC & LẬP LUẬN: đọc bản mới nhất trong hội thoại, kiểm tra mạch lập luận và tính nhất quán, thắt chặt liên kết giữa các đoạn, bổ sung luận cứ cho những chỗ còn yếu. Chỉ xuất toàn bộ bản đã cải thiện, không bình luận.",
		tail: "Không thêm bất kỳ dấu hiệu kết thúc đặc biệt nào.",
	},
	{
		phase: "review",
		title: "Ví dụ & Thuyết phục",
		task:
			"REVIEW VÍ DỤ & TÍNH THUYẾT PHỤC: đọc bản mới nhất trong hội thoại, bổ sung dẫn chứng, ví dụ cụ thể và số liệu minh họa ở những chỗ phù hợp để tăng sức thuyết phục. Chỉ xuất toàn bộ bản đã cải thiện, không bình luận.",
		tail: "Không thêm bất kỳ dấu hiệu kết thúc đặc biệt nào.",
	},
	{
		phase: "final",
		title: "Tổng hợp & Trau chuốt",
		task:
			"TỔNG HỢP & TRAU CHUỐT: đọc toàn bộ hội thoại, ghép và chỉnh sửa toàn bộ bài thành MỘT bản hoàn chỉnh duy nhất, mượt mà, nhất quán về văn phong từ đầu đến cuối. Chỉ xuất toàn bộ bài hoàn chỉnh, không bình luận.",
		tail: "Kết thúc bài bằng đúng dòng: ---FINAL VERSION---",
	},
];

// Bước dự phòng: yêu cầu xuất lại bản cuối nếu chưa thấy FINAL VERSION.
const FALLBACK_STEP: StepDef = {
	phase: "final",
	title: "Xuất bản cuối (dự phòng)",
	task:
		"Bản trả lời trước chưa có dấu hiệu hoàn tất. Hãy xuất lại TOÀN BỘ bản bài viết hoàn chỉnh nhất hiện tại (dựa trên toàn bộ hội thoại), không bình luận.",
	tail: "Kết thúc bài bằng đúng dòng: ---FINAL VERSION---",
};

const TOTAL_STEPS = STEPS.length; // 7; index TOTAL_STEPS = FALLBACK_STEP

function stepAt(index: number): StepDef {
	return index >= 0 && index < TOTAL_STEPS ? STEPS[index] : FALLBACK_STEP;
}

// ============================== Kiểu & helpers ==============================

interface MessageLike {
	role?: string;
	content?: unknown;
	stopReason?: string;
	errorMessage?: string;
	usage?: { output?: number };
}

type CompleteResponse = MessageLike & { content: unknown };

interface ProgressData {
	kind: "start" | "step" | "retry" | "warning" | "error" | "finished";
	message?: string;
	index?: number;
	title?: string;
	words?: number;
	seconds?: number;
	tokens?: number;
}

function extractText(content: unknown): string {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return content
			.filter((b) => (b as { type?: string })?.type === "text")
			.map((b) => (b as { text?: string })?.text ?? "")
			.join("\n");
	}
	return "";
}

/** Bỏ Wrapper [SECTION]/[END] khi đo độ dài. */
function coreContent(text: string): string {
	return text
		.split("\n")
		.filter((line) => !/^\s*\[\s*SECTION\s*\]\s*$/i.test(line) && !/^\s*\[\s*END\s*\]\s*$/i.test(line))
		.join("\n")
		.trim();
}

/** Làm sạch bản final trước khi trả về người dùng. */
function cleanFinal(text: string): string {
	return text
		.split("\n")
		.filter(
			(line) =>
				!/^\s*\[\s*SECTION\s*\]\s*$/i.test(line) &&
				!/^\s*\[\s*END\s*\]\s*$/i.test(line) &&
				!FINAL_MARKER_RE.test(line),
		)
		.join("\n")
		.trim();
}

function countWords(text: string): number {
	return text.split(/\s+/).filter(Boolean).length;
}

function truncate(text: string, max: number): string {
	return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function notify(
	ctx: ExtensionContext,
	text: string,
	level: "info" | "warning" | "error" = "info",
): void {
	if (!ctx.hasUI) return;
	ctx.ui.notify(text, level);
}

function setStatus(ctx: ExtensionContext, index: number, extra = ""): void {
	if (!ctx.hasUI) return;
	const step = stepAt(index);
	const n = Math.min(index + 1, TOTAL_STEPS);
	ctx.ui.setStatus(EXT_ID, `[Muse] Bước ${n}/${TOTAL_STEPS} · ${step.title}${extra}`);
}

function clearStatus(ctx: ExtensionContext): void {
	if (!ctx.hasUI) return;
	ctx.ui.setStatus(EXT_ID, undefined);
}

function appendProgress(pi: ExtensionAPI, data: ProgressData): void {
	try {
		pi.appendEntry(EXT_ID, data);
	} catch {
		// bỏ qua — progress là TUI-only, không được ảnh hưởng vòng lặp
	}
}

function countUserMessages(ctx: ExtensionContext): number {
	try {
		return (ctx.sessionManager.getBranch() as unknown as { type: string; message?: MessageLike }[]).filter(
			(e) => e.type === "message" && e.message?.role === "user",
		).length;
	} catch {
		return 0;
	}
}

// ============================== Sinh prompt ==============================

const ADVISOR_SYSTEM = [
	`[QUY TRÌNH MUSE REVIEW — CHẾ ĐỘ ADVISOR]`,
	`Bạn đang chạy trong một quy trình viết bài nhiều bước do extension điều phối. Mỗi lượt gọi chỉ thực hiện NHIỆM VỤ của bước hiện tại, không làm trước nội dung của các bước sau.`,
	``,
	`QUY TẮC BẮT BUỘC:`,
	`- Toàn bộ đề tài và yêu cầu của người dùng nằm trong chính hội thoại này — đọc kỹ và tôn trọng TẤT CẢ yêu cầu.`,
	`- Bọc toàn bộ nội dung trả lời trong cặp thẻ: dòng đầu tiên là [SECTION], dòng cuối cùng là [END]. Không viết bất cứ gì ngoài cặp thẻ này.`,
	`- TUYỆT ĐỐI không dùng các cụm từ "Tôi không thể", "As an AI", "xin lỗi" hoặc bất kỳ câu từ chối / nhắc đến bản chất AI nào.`,
	`- Không bình luận về quy trình, không đặt câu hỏi ngược lại, không xin hướng dẫn thêm.`,
].join("\n");

function buildStepTask(index: number, isRetry: boolean): string {
	const step = stepAt(index);
	const n = Math.min(index + 1, TOTAL_STEPS);
	const lines: string[] = [];
	if (isRetry) {
		lines.push(
			`[MUSE REVIEW ⚠ PHẢN HỒI QUÁ NGẮN]`,
			`Câu trả lời trước của bạn quá ngắn so với yêu cầu. Hãy thực hiện LẠI bước hiện tại (${step.title}) với nội dung CHI TIẾT và ĐẦY ĐỦ hơn.`,
			``,
		);
	} else {
		lines.push(`[MUSE REVIEW ▸ BƯỚC ${n}/${TOTAL_STEPS} — ${step.title.toUpperCase()}]`);
	}
	lines.push(`NHIỆM VỤ: ${step.task}`, step.tail);
	lines.push(`(Bọc nội dung trong [SECTION]...[END]; tham khảo toàn bộ hội thoại trong phiên làm việc này.)`);
	return lines.join("\n");
}

// ============================== Advisor state ==============================

/** Phần state chia sẻ với input handler (STOP, fold tin nhắn giữa chừng). */
let adv: {
	running: boolean;
	controller: AbortController | null;
	pendingUserTexts: string[];
} = { running: false, controller: null, pendingUserTexts: [] };

/** Cờ theo PHIÊN — chỉ reset ở session_start (không bị reset khi run kết thúc). */
let sessionFlags = { typedCount: 0, initialUserMessages: 0, advisorRan: false };

function resetAdvisor(): void {
	adv.controller?.abort();
	adv = { running: false, controller: null, pendingUserTexts: [] };
}

function userMsg(text: string): AiMessage {
	return { role: "user", content: [{ type: "text", text }], timestamp: Date.now() };
}

/** Gộp timeout + STOP thành một signal; biết được stop do timeout hay do người dùng. */
function makeStepSignal(
	controller: AbortController,
	timeoutMs: number,
): { signal: AbortSignal; isTimeout: () => boolean } {
	const timeoutSignal = AbortSignal.timeout(timeoutMs);
	const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
	const signal = anyFn ? anyFn([controller.signal, timeoutSignal]) : controller.signal;
	return { signal, isTimeout: () => timeoutSignal.aborted && !controller.signal.aborted };
}

// ============================== Advisor loop ==============================

function mirrorBrief(pi: ExtensionAPI, text: string): void {
	try {
		pi.sendMessage({ customType: "muse-brief", content: text, display: true });
	} catch {
		// bỏ qua — mirror chỉ phục vụ context/transcript
	}
}

function deliver(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	text: string,
	label: string,
	level: "info" | "warning",
): void {
	try {
		pi.sendMessage({ customType: "muse-review-result", content: text, display: true });
	} catch {
		// nếu send lỗi thì vẫn notify
	}
	appendProgress(pi, { kind: "finished", message: label });
	notify(ctx, `Muse Review: ${label}`, level);
}

async function runAdvisor(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	firstUserText: string,
	controller: AbortController,
): Promise<void> {
	const model = ctx.model;
	const modelId = model ? `${model.provider}/${model.id}` : "(không rõ)";
	const messages: AiMessage[] = [];
	let stepIndex = 0;
	let retries = 0;
	let stepsExecuted = 0;
	let latestDraft = "";
	let startedAt = 0;

	try {
		if (!model) throw new Error("không có model đang chọn");
		setStatus(ctx, 0);
		startedAt = Date.now();
		appendProgress(pi, {
			kind: "start",
			message: `đề tài: "${truncate(firstUserText, 80)}" · model ${modelId} · ${TOTAL_STEPS} bước · STOP_REVIEW để hủy`,
		});
		messages.push(userMsg(firstUserText));

		while (true) {
			// Fold các tin nhắn người dùng gõ thêm giữa chừng (yêu cầu của họ = đầu vào bắt buộc).
			if (adv.pendingUserTexts.length > 0) {
				const list = adv.pendingUserTexts
					.splice(0)
					.map((t) => `- ${t}`)
					.join("\n");
				messages.push(
					userMsg(`YÊU CẦU BỔ SUNG từ người dùng (bắt buộc tôn trọng khi thực hiện):\n${list}`),
				);
			}

			// Guard maxSteps: dừng và trả về bản gần hoàn chỉnh nhất (spec mục 7).
			if (stepsExecuted >= CONFIG.maxSteps) {
				if (latestDraft) {
					deliver(
						pi,
						ctx,
						latestDraft,
						`đạt giới hạn ${CONFIG.maxSteps} lần gọi model — trả về bản gần hoàn chỉnh nhất (chưa qua bước trau chuốt).`,
						"warning",
					);
				} else {
					notify(ctx, `Muse Review: đạt giới hạn ${CONFIG.maxSteps} bước mà chưa có nội dung — dừng.`, "error");
					appendProgress(pi, { kind: "error", message: `đạt giới hạn ${CONFIG.maxSteps} bước, không có nội dung` });
				}
				return;
			}

			const step = stepAt(stepIndex);
			setStatus(ctx, stepIndex);
			messages.push(userMsg(buildStepTask(stepIndex, retries > 0)));
			const callStart = Date.now();
			const { signal, isTimeout } = makeStepSignal(controller, CONFIG.stepTimeoutMs);

			let response: CompleteResponse;
			try {
				response = (await ctx.modelRegistry.complete(
					model,
					{ systemPrompt: ADVISOR_SYSTEM, messages },
					{ signal, cacheRetention: "none", sessionId: uuidv7() },
				)) as unknown as CompleteResponse;
			} catch (err) {
				if (controller.signal.aborted) {
					appendProgress(pi, {
						kind: "warning",
						message: `⛔ đã dừng theo STOP_REVIEW tại bước "${step.title}" — bản nháp KHÔNG được đưa vào hội thoại.`,
					});
					notify(ctx, "Muse Review: đã dừng. Bản nháp không được đưa vào hội thoại.", "info");
					return;
				}
				throw err;
			}

			stepsExecuted++;

			// Người dùng hủy (STOP đã abort trước đó) hoặc model trả aborted.
			if (response.stopReason === "aborted" || controller.signal.aborted) {
				appendProgress(pi, {
					kind: "warning",
					message: `⛔ đã dừng theo STOP_REVIEW tại bước "${step.title}" — bản nháp KHÔNG được đưa vào hội thoại.`,
				});
				notify(ctx, "Muse Review: đã dừng. Bản nháp không được đưa vào hội thoại.", "info");
				return;
			}
			if (response.stopReason === "error" || response.errorMessage) {
				throw new Error(
					isTimeout()
						? `timeout sau ${Math.round(CONFIG.stepTimeoutMs / 1000)}s ở bước "${step.title}"`
						: (response.errorMessage ?? response.stopReason ?? "lỗi không rõ"),
				);
			}

			const raw = extractText(response.content);
			const body = coreContent(raw);
			const outTokens = response.usage?.output ?? Math.ceil(body.length / 4);
			const seconds = (Date.now() - callStart) / 1000;

			// Phản hồi quá ngắn → retry đúng MUSE_MAX_RETRIES lần (build lại task, không giữ phản hồi xấu).
			if (outTokens < CONFIG.minTokens && retries < CONFIG.maxRetries) {
				retries++;
				messages.pop();
				appendProgress(pi, {
					kind: "retry",
					index: stepIndex,
					title: step.title,
					message: `phản hồi ~${outTokens} tokens — thử lại ${retries}/${CONFIG.maxRetries}`,
				});
				continue;
			}
			retries = 0;

			// Đưa output vào advisor context (AssistantMessage đầy đủ từ complete()).
			messages.push(response as unknown as AiMessage);
			latestDraft = body;
			appendProgress(pi, {
				kind: "step",
				index: stepIndex,
				title: step.title,
				words: countWords(body),
				tokens: outTokens,
				seconds: Math.round(seconds * 10) / 10,
			});

			if (stepIndex < TOTAL_STEPS - 1) {
				stepIndex++;
				continue;
			}

			// Bước 6 (Tổng hợp & Trau chuốt): có FINAL là hoàn tất.
			if (stepIndex === TOTAL_STEPS - 1 && FINAL_MARKER_RE.test(raw)) {
				deliver(pi, ctx, cleanFinal(raw), "hoàn tất! Bản hoàn chỉnh bên dưới.", "info");
				return;
			}

			// Bước 7 (dự phòng): xuất lại lần cuối.
			if (FINAL_MARKER_RE.test(raw)) {
				deliver(pi, ctx, cleanFinal(raw), "hoàn tất sau bước dự phòng! Bản hoàn chỉnh bên dưới.", "info");
			} else {
				deliver(
					pi,
					ctx,
					latestDraft,
					"không tìm thấy ---FINAL VERSION--- kể cả sau bước dự phòng — trả về bản đầy đủ nhất hiện có.",
					"warning",
				);
			}
			return;
		}
	} catch (err) {
		const msg = (err as Error)?.message ?? String(err);
		appendProgress(pi, { kind: "error", message: `lỗi: ${truncate(msg, 160)}` });
		if (latestDraft) {
			deliver(pi, ctx, latestDraft, `lỗi giữa chừng (${truncate(msg, 100)}) — trả về bản nháp gần nhất.`, "warning");
		} else {
			notify(ctx, `Muse Review: lỗi — ${msg}. Không có nội dung để trả về, dừng.`, "error");
		}
	} finally {
		adv.running = false;
		adv.controller = null;
		adv.pendingUserTexts = [];
		pi.events.emit("muse", { running: false });
		clearStatus(ctx);
		void startedAt;
	}
}

function startAdvisor(pi: ExtensionAPI, ctx: ExtensionContext, firstUserText: string): void {
	resetAdvisor();
	const controller = new AbortController();
	adv.running = true;
	adv.controller = controller;
	sessionFlags.advisorRan = true;
	mirrorBrief(pi, firstUserText);
	pi.events.emit("muse", { running: true });
	notify(
		ctx,
		`Muse Review: bắt đầu quy trình ${TOTAL_STEPS} bước. Trong lúc chạy, tin nhắn của bạn sẽ được ghi vào brief (main model không trả lời riêng). STOP_REVIEW để hủy.`,
		"info",
	);
	void runAdvisor(pi, ctx, firstUserText, controller).catch((err) => {
		notify(ctx, `Muse Review: lỗi không mong muốn — ${(err as Error)?.message ?? err}`, "error");
		adv.running = false;
		adv.controller = null;
		clearStatus(ctx);
	});
}

// ============================== Extension ==============================

export default function (pi: ExtensionAPI) {
	// ---- UI renderers ----

	// Brief của người dùng (mirror từ tin nhắn bị handled): hiển thị như dòng ghi nhận.
	pi.registerMessageRenderer("muse-brief", (message, _options, theme) => {
		const text = typeof message.content === "string" ? message.content : "(nội dung)";
		return new Text(theme.fg("accent", `Muse brief › ${text}`), 0, 0);
	});

	// Kết quả cuối cùng: nhãn nổi bật + toàn văn.
	pi.registerMessageRenderer("muse-review-result", (message, _options, theme) => {
		const text = typeof message.content === "string" ? message.content : "";
		return new Text(`${theme.bold(theme.fg("success", "✨ Muse Review — Bản hoàn chỉnh"))}\n\n${text}`, 0, 0);
	});

	// Progress lines: TUI-only (appendEntry KHÔNG vào context LLM).
	pi.registerEntryRenderer(EXT_ID, (entry, _options, theme) => {
		const d = (entry.data ?? {}) as ProgressData;
		let line = "";
		switch (d.kind) {
			case "start":
				line = theme.fg("accent", `▶ Muse Review · ${d.message ?? ""}`);
				break;
			case "step":
				line = theme.fg(
					"success",
					`✍️ [${Math.min((d.index ?? 0) + 1, TOTAL_STEPS)}/${TOTAL_STEPS}] ${d.title ?? ""} · ${d.words ?? 0} từ · ~${d.tokens ?? 0} tokens · ${d.seconds ?? 0}s`,
				);
				break;
			case "retry":
				line = theme.fg("warning", `⚠️ [${Math.min((d.index ?? 0) + 1, TOTAL_STEPS)}/${TOTAL_STEPS}] ${d.title ?? ""} — ${d.message ?? ""}`);
				break;
			case "warning":
				line = theme.fg("warning", `⚠️ ${d.message ?? ""}`);
				break;
			case "error":
				line = theme.fg("error", `✗ ${d.message ?? ""}`);
				break;
			case "finished":
				line = theme.fg("success", `✔ ${d.message ?? ""}`);
				break;
			default:
				line = "";
		}
		return new Text(line, 0, 0);
	});

	// ---- Lifecycle ----

	pi.on("session_start", async (_event, ctx) => {
		resetAdvisor();
		sessionFlags = { typedCount: 0, initialUserMessages: countUserMessages(ctx), advisorRan: false };
		clearStatus(ctx);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		resetAdvisor();
		clearStatus(ctx);
	});

	// ---- Input: kill switch / fold brief / auto-start ----

	pi.on("input", async (event, ctx) => {
		try {
			const text = (event.text ?? "").trim();

			// Kill switch (mọi nguồn, mọi trạng thái).
			if (text.toUpperCase() === STOP_TEXT) {
				const wasRunning = adv.running;
				resetAdvisor();
				clearStatus(ctx);
				notify(
					ctx,
					wasRunning
						? "Muse Review: STOP_REVIEW — đang hủy. Bản nháp sẽ KHÔNG được đưa vào hội thoại."
						: "Muse Review: không có run nào đang chạy.",
					wasRunning ? "info" : "warning",
				);
				return { action: "handled" };
			}

			// Chỉ xử lý tin nhắn người dùng tự gõ.
			if (event.source !== "interactive") return { action: "continue" };
			if (event.source === "interactive") sessionFlags.typedCount++;

			// Đang chạy: ghi vào brief (không cho main model trả lời riêng).
			if (adv.running) {
				if (text) {
					adv.pendingUserTexts.push(text);
					mirrorBrief(pi, text);
					notify(ctx, "📎 Đã ghi nhận vào Muse Review — sẽ được tính vào bài viết.", "info");
				}
				return { action: "handled" };
			}

			// Auto-start: tin nhắn đầu tiên tự gõ của phiên mới + model trong danh sách.
			if (!CONFIG.autoStart) return { action: "continue" };
			if (sessionFlags.advisorRan || sessionFlags.typedCount !== 1 || sessionFlags.initialUserMessages > 0) {
				return { action: "continue" };
			}
			if (!text || text.startsWith("/")) return { action: "continue" };
			if (!modelMatches(ctx.model)) return { action: "continue" };

			startAdvisor(pi, ctx, text);
			return { action: "handled" };
		} catch {
			return { action: "continue" };
		}
	});
}

/**
 * muse-review.ts — Muse Suite cho Pi Agent: bộ "kèm cặp" 2 tầng cho model yếu
 *
 * Một extension duy nhất, 2 engine:
 *
 * ═══ ENGINE 1 — MUSE REVIEW (viết bài dài, advisor mode) ═══
 *   Vượt giới hạn output tokens của model (opencode-go/muse-spark-1.2-contributor và
 *   danh sách MUSE_MODELS) bằng pipeline 7 bước chạy NGOÀI main session qua
 *   ctx.modelRegistry.complete():
 *     Bước 1–3 (Writing):  Mở bài → Thân bài → Kết luận  (---END OF PART n---)
 *     Bước 4–6 (Review):   Chính tả & Ngữ pháp → Logic & Lập luận → Ví dụ & Thuyết phục
 *     Bước 7   (Final):    Tổng hợp & Trau chuốt → ---FINAL VERSION---
 *     Dự phòng:            xuất lại đúng 1 lần nếu chưa thấy FINAL
 *   Main session chỉ nhận: brief (tin nhắn của bạn, mirror) + progress lines (TUI-only,
 *   không vào context) + bản hoàn chỉnh cuối. Draft/prompt/review trung gian không bao giờ
 *   nằm trong main session.
 *   - Auto-start: tin nhắn đầu tiên tự gõ của phiên mới + model khớp MUSE_MODELS.
 *   - Mọi tin nhắn gõ thêm trong lúc chạy được fold vào brief (main model không trả lời riêng).
 *   - /resume có lịch sử → không hijack. Model ngoài danh sách → im lặng bỏ qua.
 *
 * ═══ ENGINE 2 — CRITIC (phản biện độc lập, GENERAL — mọi loại việc, mọi model) ═══
 *   Sau MỌI lượt trả lời của main agent (code, shell, văn bản, phân tích...), gọi 1 call
 *   ẩn làm reviewer khách quan. Critic KHÔNG sửa, không nói chuyện với user — chỉ phán:
 *     ---LGTM---        sạch → 1 dòng "✓ critic", không tốn lượt
 *     ---NEED-VERIFY---  thiếu bằng chứng test/lint → chính MAIN AGENT (kẻ có tool) được
 *                        yêu cầu chạy lệnh và báo cáo; extension không bao giờ tự chạy code
 *                        của bạn (chỉ tự đọc git diff — chỉ đọc)
 *     ---ISSUES---       có lỗi thật → đáp án cũ collapse còn 1 dòng, main agent phải
 *                        kiểm chứng/sửa và XUẤT LẠI đáp án cuối đầy đủ
 *   - Bằng chứng: prompt + đáp án + tool log lượt vừa chạy + git diff. Cấm đoán mò ngoài
 *     bằng chứng. Trần vòng can thiệp CRITIC_MAX_ROUNDS → không loop vô tận.
 *   - User nhắn tin mới → mọi phán quyết đang chờ bị hủy ngay.
 *   - Engine 1 đang chạy → Engine 2 im lặng hoàn toàn (cùng module, flag chung).
 *   - Đáp án bị thay thế được collapse còn 1 dòng (markdownTransformer, display-only).
 *
 * ═══ Điều khiển ═══
 *   STOP_REVIEW  (gõ trong chat) → hủy TẤT CẢ: pipeline viết bài + critic đang dở
 *   CRITIC_OFF / CRITIC_ON                    → tắt / bật riêng Engine 2
 *
 * ═══ Cấu hình env (tùy chọn) ═══
 *   MUSE_MODELS=list        danh sách model chạy pipeline, phân tách phẩy, hỗ trợ wildcard *
 *                           (mặc định chính xác: opencode-go/muse-spark-1.2-contributor)
 *   MUSE_AUTO_START=1|0     bật/tắt auto-start của Engine 1 (mặc định 1)
 *   MUSE_MAX_STEPS=10       số lần gọi model tối đa mỗi run viết bài
 *   MUSE_MIN_TOKENS=20      ngưỡng "quá ngắn" của bước viết
 *   MUSE_MAX_RETRIES=1      retry mỗi bước viết khi quá ngắn
 *   MUSE_STEP_TIMEOUT=180000    timeout mỗi call viết bài (ms)
 *   CRITIC_AUTO=1|0         bật/tắt Engine 2 (mặc định 1 — áp cho mọi model)
 *   CRITIC_MAX_ROUNDS=2     số lần critic được can thiệp / lượt hỏi của user
 *   CRITIC_TIMEOUT=60000    timeout mỗi call critic (ms)
 *   CRITIC_MIN_ANSWER=120   đáp án ngắn hơn + không tool call → bỏ qua khỏi soi
 *
 * Lưu ý: token các call ẩn (advisor + critic) không cộng vào /session của pi.
 * Trạng thái in-memory — /reload/restart giữa chừng hủy sạch.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { uuidv7, type Message as AiMessage } from "@earendil-works/pi-ai";

// ═════════════════════════════ Cấu hình ═════════════════════════════

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

// Danh sách model chạy pipeline viết bài — THÊM PROVIDER MỚI VÀO ĐÂY (hoặc env MUSE_MODELS).
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
	// Engine 1 — writing pipeline
	autoStart: envBool("MUSE_AUTO_START", true),
	maxSteps: envInt("MUSE_MAX_STEPS", 10, 1),
	minTokens: envInt("MUSE_MIN_TOKENS", 20, 1),
	maxRetries: envInt("MUSE_MAX_RETRIES", 1, 0),
	stepTimeoutMs: envInt("MUSE_STEP_TIMEOUT", 180_000, 1_000),
	models: parseModels(process.env["MUSE_MODELS"]),
	// Engine 2 — critic
	criticAutoOn: envBool("CRITIC_AUTO", true),
	criticMaxRounds: envInt("CRITIC_MAX_ROUNDS", 2, 0),
	criticTimeoutMs: envInt("CRITIC_TIMEOUT", 60_000, 1_000),
	criticMinAnswerChars: envInt("CRITIC_MIN_ANSWER", 120, 0),
};

const EXT_ID = "muse-review";
const CRITIC_ENTRY_ID = "critic-review";
const STOP_TEXT = "STOP_REVIEW";
const OFF_TEXT = "CRITIC_OFF";
const ON_TEXT = "CRITIC_ON";
const INJECT_PREFIX = "⚙️ [CRITIC REVIEW]";

const FINAL_MARKER_RE = /-{3,}\s*FINAL\s+VERSION\s*-{3,}/i;
const partMarkerRe = (part: number): RegExp =>
	new RegExp(`-{3,}\\s*END OF PART ${part}\\s*-{3,}`, "i");
const VERDICT_LGTM = /-{3,}\s*LGTM\s*-{3,}/i;
const VERDICT_VERIFY = /-{3,}\s*NEED-VERIFY\s*-{3,}/i;
const VERDICT_ISSUES = /-{3,}\s*ISSUES\s*-{3,}/i;

// ═════════════════════════════ Model matching ═════════════════════════════

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

// ═════════════════════════════ Định nghĩa các bước viết ═════════════════════════════

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

const FALLBACK_STEP: StepDef = {
	phase: "final",
	title: "Xuất bản cuối (dự phòng)",
	task:
		"Bản trả lời trước chưa có dấu hiệu hoàn tất. Hãy xuất lại TOÀN BỘ bản bài viết hoàn chỉnh nhất hiện tại (dựa trên toàn bộ hội thoại), không bình luận.",
	tail: "Kết thúc bài bằng đúng dòng: ---FINAL VERSION---",
};

const TOTAL_STEPS = STEPS.length;

function stepAt(index: number): StepDef {
	return index >= 0 && index < TOTAL_STEPS ? STEPS[index] : FALLBACK_STEP;
}

// ═════════════════════════════ Helpers chung ═════════════════════════════

interface MessageLike {
	role?: string;
	content?: unknown;
	stopReason?: string;
	errorMessage?: string;
	usage?: { output?: number };
}

interface EntryLike {
	type: string;
	message?: MessageLike;
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

function coreContent(text: string): string {
	return text
		.split("\n")
		.filter((line) => !/^\s*\[\s*SECTION\s*\]\s*$/i.test(line) && !/^\s*\[\s*END\s*\]\s*$/i.test(line))
		.join("\n")
		.trim();
}

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
	return text.length <= max ? `${text.slice(0, max - 1)}…` : text;
}

function oneLine(s: string): string {
	return s.replace(/\s+/g, " ").trim();
}

/** Key nội dung (djb2 + độ dài) để nhận diện đáp án đã bị thay thế khi render. */
function keyOf(text: string): string {
	let h = 5381;
	for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
	return `${text.length}:${h.toString(36)}`;
}

function notify(ctx: ExtensionContext, text: string, level: "info" | "warning" | "error" = "info"): void {
	if (!ctx.hasUI) return;
	ctx.ui.notify(text, level);
}

function setStatus(ctx: ExtensionContext, text: string | undefined): void {
	if (!ctx.hasUI) return;
	ctx.ui.setStatus(EXT_ID, text);
}

function appendEntrySafe(pi: ExtensionAPI, customType: string, data: unknown): void {
	try {
		pi.appendEntry(customType, data);
	} catch {
		// progress là TUI-only, không để lỗi nó làm hỏng luồng
	}
}

function countUserMessages(ctx: ExtensionContext): number {
	try {
		return (ctx.sessionManager.getBranch() as unknown as EntryLike[]).filter(
			(e) => e.type === "message" && e.message?.role === "user",
		).length;
	} catch {
		return 0;
	}
}

function userMsg(text: string): AiMessage {
	return { role: "user", content: [{ type: "text", text }], timestamp: Date.now() };
}

/** Gộp timeout + STOP thành một signal; biết được stop do timeout hay do người dùng. */
function makeStepSignal(controller: AbortController, timeoutMs: number): {
	signal: AbortSignal;
	isTimeout: () => boolean;
} {
	const timeoutSignal = AbortSignal.timeout(timeoutMs);
	const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
	const signal = anyFn ? anyFn([controller.signal, timeoutSignal]) : controller.signal;
	return { signal, isTimeout: () => timeoutSignal.aborted && !controller.signal.aborted };
}

// ═════════════════════════════ ENGINE 1 — ADVISOR ═════════════════════════════

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

interface AdvisorState {
	running: boolean;
	stepIndex: number;
	controller: AbortController | null;
	pendingUserTexts: string[];
}

let adv: AdvisorState = { running: false, stepIndex: 0, controller: null, pendingUserTexts: [] };

interface SessionFlags {
	typedCount: number;
	initialUserMessages: number;
	advisorRan: boolean;
}

let sessionFlags: SessionFlags = { typedCount: 0, initialUserMessages: 0, advisorRan: false };

function resetAdvisor(): void {
	adv.controller?.abort();
	adv = { running: false, stepIndex: 0, controller: null, pendingUserTexts: [] };
}

function mirrorBrief(pi: ExtensionAPI, text: string): void {
	try {
		pi.sendMessage({ customType: "muse-brief", content: text, display: true });
	} catch {
		// mirror chỉ phục vụ context/transcript
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
	appendEntrySafe(pi, EXT_ID, { kind: "finished", message: label });
	notify(ctx, `Muse Review: ${label}`, level);
}

function museStatus(ctx: ExtensionContext, index: number, extra = ""): void {
	const step = stepAt(index);
	const n = Math.min(index + 1, TOTAL_STEPS);
	setStatus(ctx, `[Muse] Bước ${n}/${TOTAL_STEPS} · ${step.title}${extra}`);
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

	try {
		if (!model) throw new Error("không có model đang chọn");
		museStatus(ctx, 0);
		appendEntrySafe(pi, EXT_ID, {
			kind: "start",
			message: `đề tài: "${truncate(firstUserText, 80)}" · model ${modelId} · ${TOTAL_STEPS} bước · STOP_REVIEW để hủy`,
		});
		messages.push(userMsg(firstUserText));

		while (true) {
			// Fold các tin nhắn người dùng gõ thêm giữa chừng.
			if (adv.pendingUserTexts.length > 0) {
				const list = adv.pendingUserTexts
					.splice(0)
					.map((t) => `- ${t}`)
					.join("\n");
				messages.push(
					userMsg(`YÊU CẦU BỔ SUNG từ người dùng (bắt buộc tôn trọng khi thực hiện):\n${list}`),
				);
			}

			// Guard maxSteps: dừng và trả về bản gần hoàn chỉnh nhất.
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
					appendEntrySafe(pi, EXT_ID, { kind: "error", message: `đạt giới hạn ${CONFIG.maxSteps} bước, không có nội dung` });
				}
				return;
			}

			const step = stepAt(stepIndex);
			museStatus(ctx, stepIndex);
			messages.push(userMsg(buildStepTask(stepIndex, retries > 0)));
			const callStart = Date.now();
			const { signal, isTimeout } = makeStepSignal(controller, CONFIG.stepTimeoutMs);

			let response: MessageLike;
			try {
				response = (await ctx.modelRegistry.complete(
					model,
					{ systemPrompt: ADVISOR_SYSTEM, messages },
					{ signal, cacheRetention: "none", sessionId: uuidv7() },
				)) as unknown as MessageLike;
			} catch (err) {
				if (controller.signal.aborted) {
					appendEntrySafe(pi, EXT_ID, {
						kind: "warning",
						message: `⛔ đã dừng theo STOP_REVIEW tại bước "${step.title}" — bản nháp KHÔNG được đưa vào hội thoại.`,
					});
					notify(ctx, "Muse Review: đã dừng. Bản nháp không được đưa vào hội thoại.", "info");
					return;
				}
				throw err;
			}

			stepsExecuted++;

			if (response.stopReason === "aborted" || controller.signal.aborted) {
				appendEntrySafe(pi, EXT_ID, {
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

			// Quá ngắn → retry đúng MUSE_MAX_RETRIES lần (build lại task, bỏ phản hồi xấu).
			if (outTokens < CONFIG.minTokens && retries < CONFIG.maxRetries) {
				retries++;
				messages.pop();
				appendEntrySafe(pi, EXT_ID, {
					kind: "retry",
					index: stepIndex,
					title: step.title,
					message: `phản hồi ~${outTokens} tokens — thử lại ${retries}/${CONFIG.maxRetries}`,
				});
				continue;
			}
			retries = 0;

			messages.push(response as unknown as AiMessage);
			latestDraft = body;
			appendEntrySafe(pi, EXT_ID, {
				kind: "step",
				index: stepIndex,
				title: step.title,
				words: countWords(body),
				tokens: outTokens,
				seconds: Math.round(seconds * 10) / 10,
			});

			if (stepIndex < TOTAL_STEPS - 1) {
				stepIndex++;
				adv.stepIndex = stepIndex;
				continue;
			}

			if (stepIndex === TOTAL_STEPS - 1 && FINAL_MARKER_RE.test(raw)) {
				deliver(pi, ctx, cleanFinal(raw), "hoàn tất! Bản hoàn chỉnh bên dưới.", "info");
				return;
			}

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
		appendEntrySafe(pi, EXT_ID, { kind: "error", message: `lỗi: ${truncate(msg, 160)}` });
		if (latestDraft) {
			deliver(pi, ctx, latestDraft, `lỗi giữa chừng (${truncate(msg, 100)}) — trả về bản nháp gần nhất.`, "warning");
		} else {
			notify(ctx, `Muse Review: lỗi — ${msg}. Không có nội dung để trả về, dừng.`, "error");
		}
	} finally {
		adv.running = false;
		adv.controller = null;
		adv.pendingUserTexts = [];
		setStatus(ctx, undefined);
	}
}

function startAdvisor(pi: ExtensionAPI, ctx: ExtensionContext, firstUserText: string): void {
	resetAdvisor();
	const controller = new AbortController();
	adv.running = true;
	adv.controller = controller;
	sessionFlags.advisorRan = true;
	mirrorBrief(pi, firstUserText);
	notify(
		ctx,
		`Muse Review: bắt đầu quy trình ${TOTAL_STEPS} bước. Trong lúc chạy, tin nhắn của bạn sẽ được ghi vào brief (main model không trả lời riêng). STOP_REVIEW để hủy.`,
		"info",
	);
	void runAdvisor(pi, ctx, firstUserText, controller).catch((err) => {
		notify(ctx, `Muse Review: lỗi không mong muốn — ${(err as Error)?.message ?? err}`, "error");
		adv.running = false;
		adv.controller = null;
		setStatus(ctx, undefined);
	});
}

// ═════════════════════════════ ENGINE 2 — CRITIC ═════════════════════════════

const CRITIC_SYSTEM = [
	`Bạn là CRITIC — bộ phận phản biện ĐỘC LẬP đứng sau một model khác vừa trả lời người dùng, với MỌI LOẠI VIỆC (code, văn bản, phân tích, dịch thuật, tóm tắt, kế hoạch, tư vấn...).`,
	`Bạn không phải tác giả. Bạn KHÔNG trả lời người dùng, KHÔNG viết lại đáp án, KHÔNG khen, KHÔNG chào hỏi.`,
	`Bạn chỉ có quyền phán dựa trên BẰNG CHỨNG được cung cấp. Cấm suy diễn lỗi không xuất hiện trong bằng chứng.`,
	``,
	`Cách làm việc (general, áp cho mọi loại việc):`,
	`1. Xác định việc gì được yêu cầu và tiêu chí "đúng" của nó từ phần YÊU CẦU CỦA NGƯỜI DÙNG.`,
	`2. Soi ĐÁP ÁN với tiêu chí đó + bằng chứng tool/git: kết quả có sai sót THẬT, thiếu yêu cầu, mâu thuẫn, bỏ sót bước, hay phớt lờ thất bại rõ ràng không.`,
	`3. CODE/TOOL CALL: lệnh hoặc test thất bại bị phớt lờ; lỗi logic rõ trong diff; edge case bị bỏ; thay đổi không khớp yêu cầu; phá vỡ API/contract được nhắc tới; chưa lưu file/thiếu bước áp dụng.`,
	`   VĂN BẢN: thiếu ý đã đòi; mâu thuẫn nội bộ; sai lệch với bằng chứng; lan man không trả lời đúng câu hỏi.`,
	`   LOẠI KHÁC: cùng nguyên tắc — so kết quả với yêu cầu + bằng chứng, chỉ báo lỗi thật.`,
	`CHỈ báo cáo lỗi CHẶN được (kết quả sai / hỏng / dở rõ rệt). KHÔNG báo cáo: sở thích văn phong, tối ưu vi mô, "có thể cân nhắc", điều phải chạy thêm mới biết.`,
	`Nếu bằng chứng KHÔNG ĐỦ để kết luận (vd sửa code nhưng chưa thấy kết quả test/lint/build nào) -> dùng NEED-VERIFY thay vì đoán.`,
	``,
	`Bắt buộc trả lời đúng MỘT trong 3 khuôn, KHÔNG thêm chữ nào khác:`,
	`---LGTM---`,
	`hoặc`,
	`---NEED-VERIFY---`,
	`<1..3 lệnh shell cần chạy để lấy bằng chứng, mỗi dòng 1 lệnh, không giải thích>`,
	`hoặc`,
	`---ISSUES---`,
	`- <vấn đề ngắn, trỏ bằng chứng cụ thể> → <cách sửa>`,
].join("\n");

function buildEvidence(prompt: string, answer: string, toolLog: string[], gitDiff: string): string {
	const t = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…[chặn]` : s);
	return [
		`=== YÊU CẦU CỦA NGƯỜI DÙNG ===`,
		t(prompt || "(không rõ)", 1500),
		``,
		`=== ĐÁP ÁN CẦN REVIEW ===`,
		t(answer, 5000),
		``,
		`=== BẰNG CHỨNG QUÁ TRÌNH (tool đã chạy trong lượt này) ===`,
		toolLog.length ? toolLog.map((l) => t(l, 400)).join("\n") : "(không có tool call nào)",
		``,
		`=== GIT DIFF ===`,
		gitDiff || "(không có diff — không phải repo git hoặc không sửa file)",
	].join("\n");
}

function verifyInstruction(cmds: string): string {
	return [
		`${INJECT_PREFIX} Cần bằng chứng trước khi kết luận. Hãy chạy ĐÚNG các lệnh sau và báo cáo nguyên văn kết quả. KHÔNG sửa code, KHÔNG giải thích thêm:`,
		cmds,
	].join("\n");
}

function reviseInstruction(issues: string): string {
	return [
		`${INJECT_PREFIX} Người phản biện độc lập tìm thấy các vấn đề sau trong đáp án vừa rồi:`,
		issues,
		``,
		`Yêu cầu bắt buộc:`,
		`- Kiểm chứng và sửa TỪNG vấn đề ở trên bằng tool khi cần (đọc file, chạy lại lệnh/test).`,
		`- Sau đó XUẤT LẠI TOÀN BỘ đáp án cuối cùng hoàn chỉnh cho người dùng (đây là thứ người dùng thấy).`,
		`- Không xin lỗi, không kể về quy trình review, không tóm tắt thay cho đáp án đầy đủ.`,
	].join("\n");
}

/** Lấy phần thân sau một verdict marker (dừng khi gặp marker --- khác). */
function parseVerdictLines(v: string, marker: RegExp): string {
	const lines = v.split(/\r?\n/);
	let collecting = false;
	const out: string[] = [];
	for (const line of lines) {
		if (!collecting) {
			if (marker.test(line)) collecting = true;
			continue;
		}
		if (/^\s*-{3,}/.test(line)) break;
		out.push(line);
	}
	return out.join("\n").trim();
}

interface CriticState {
	enabled: boolean;
	running: boolean;
	roundsUsed: number;
	verifyUsed: boolean;
	selfRun: boolean;
	lastRealPrompt: string;
	toolLog: string[];
	controller: AbortController | null;
	hinted: boolean;
	superseded: Set<string>;
}

function freshCriticState(): CriticState {
	return {
		enabled: CONFIG.criticAutoOn,
		running: false,
		roundsUsed: 0,
		verifyUsed: false,
		selfRun: false,
		lastRealPrompt: "",
		toolLog: [],
		controller: null,
		hinted: false,
		superseded: new Set(),
	};
}

let crit: CriticState = freshCriticState();

function criticLine(pi: ExtensionAPI, kind: "ok" | "warn" | "err" | "info", message: string): void {
	appendEntrySafe(pi, CRITIC_ENTRY_ID, { kind, message });
}

function criticStatus(ctx: ExtensionContext, text?: string): void {
	setStatus(ctx, text);
}

function inject(pi: ExtensionAPI, text: string): void {
	try {
		// custom message display:false -> vào LLM context (role user) nhưng ẩn khỏi transcript
		pi.sendMessage({ customType: "critic-instruction", content: text, display: false }, { triggerTurn: true });
		crit.selfRun = true;
	} catch (err) {
		criticLine(pi, "err", `không gửi được chỉ đạo critic: ${oneLine((err as Error)?.message ?? String(err))}`);
	}
}

async function getGitDiff(pi: ExtensionAPI): Promise<string> {
	try {
		const stat = await pi.exec("git", ["diff", "--stat"], { timeout: 5000 });
		if (stat.code !== 0) return "";
		const full = await pi.exec("git", ["diff"], { timeout: 8000 });
		if (full.code !== 0) return oneLine(stat.stdout).slice(0, 800);
		const out = `${oneLine(stat.stdout).slice(0, 800)}\n${full.stdout}`;
		return out.length > 4000 ? `${out.slice(0, 4000)}…[chặn]` : out;
	} catch {
		return "";
	}
}

function lastAssistant(ctx: ExtensionContext): { msg: MessageLike; key: string } | undefined {
	const entries = ctx.sessionManager.getBranch() as unknown as EntryLike[];
	for (let i = entries.length - 1; i >= 0; i--) {
		const e = entries[i];
		if (e?.type === "message" && e?.message?.role === "assistant") {
			const text = extractText(e.message.content);
			return { msg: e.message, key: keyOf(text) };
		}
	}
	return undefined;
}

async function runReview(pi: ExtensionAPI, ctx: ExtensionContext): Promise<void> {
	const last = lastAssistant(ctx);
	if (!last) return;
	const answer = extractText(last.msg.content);
	const selfDriven = crit.selfRun;
	crit.selfRun = false;

	if (!answer.trim()) return;
	if (last.key && crit.superseded.has(last.key)) return; // bản cũ đã bị thay
	if (adv.running || !crit.enabled || crit.running) return;
	// bỏ qua câu quá cụt và không có hành động nào ("ok", "xong", ...)
	if (!selfDriven && crit.toolLog.length === 0 && answer.length < CONFIG.criticMinAnswerChars) return;

	const model = ctx.model;
	if (!model) return;

	const seq = turn.seq;
	const controller = new AbortController();
	crit.controller = controller;
	crit.running = true;
	criticStatus(ctx, "🔍 critic: đang soi…");
	if (!crit.hinted) {
		crit.hinted = true;
		notify(ctx, `critic đang bật cho mọi lượt trả lời — tắt: CRITIC_OFF`, "info");
	}

	try {
		const gitDiff = await getGitDiff(pi);
		const evidence = buildEvidence(crit.lastRealPrompt, answer, crit.toolLog, gitDiff);

		const verdictResp = (await ctx.modelRegistry.complete(
			model,
			{ systemPrompt: CRITIC_SYSTEM, messages: [userMsg(evidence)] },
			{ signal: controller.signal, cacheRetention: "none", sessionId: uuidv7() },
		)) as unknown as MessageLike;

		if (controller.signal.aborted || seq !== turn.seq) return; // user đã sang việc khác
		if (verdictResp.stopReason === "aborted") return;
		if (verdictResp.stopReason === "error" || verdictResp.errorMessage) {
			criticLine(pi, "warn", `critic lỗi (${oneLine(verdictResp.errorMessage ?? "api error")}) — bỏ qua, giữ đáp án hiện tại.`);
			return;
		}

		const v = extractText(verdictResp.content);
		const issues = VERDICT_ISSUES.test(v) ? parseVerdictLines(v, VERDICT_ISSUES) : "";
		const verify = VERDICT_VERIFY.test(v) ? parseVerdictLines(v, VERDICT_VERIFY) : "";

		if (issues) {
			if (crit.roundsUsed >= CONFIG.criticMaxRounds) {
				criticLine(pi, "warn", `còn lỗi nhưng đã hết ${CONFIG.criticMaxRounds} vòng can thiệp — giữ đáp án hiện tại.`);
				notify(ctx, `critic thấy lỗi nhưng đã hết vòng sửa.`, "warning");
				return;
			}
			crit.roundsUsed++;
			crit.superseded.add(last.key); // đáp án cũ collapse khi bản mới về
			const bullets = issues
				.split(/\n+/)
				.map((l) => oneLine(l))
				.filter(Boolean)
				.map((l) => (l.startsWith("-") ? l : `- ${l}`))
				.join("\n");
			criticLine(pi, "warn", `thấy lỗi → bắt làm lại (vòng ${crit.roundsUsed}/${CONFIG.criticMaxRounds})`);
			inject(pi, reviseInstruction(bullets));
			return;
		}

		if (verify) {
			if (crit.verifyUsed || crit.roundsUsed >= CONFIG.criticMaxRounds) {
				criticLine(pi, "info", `critic cần thêm bằng chứng nhưng đã dùng quyền — coi như đạt, giữ đáp án.`);
				return;
			}
			crit.verifyUsed = true;
			crit.roundsUsed++;
			criticLine(pi, "info", `chưa đủ bằng chứng → yêu cầu chạy test/lint`);
			inject(pi, verifyInstruction(verify));
			return;
		}

		if (VERDICT_LGTM.test(v)) {
			// Nếu lượt này chỉ là báo cáo bằng chứng sau NEED-VERIFY → collapse nó,
			// đáp án gốc của model (phía trên) vẫn hiển thị đầy đủ.
			if (crit.verifyUsed) crit.superseded.add(last.key);
			criticLine(pi, "ok", "đạt — không có lỗi chặn được");
			return;
		}

		criticLine(pi, "warn", `verdict không đúng khuôn → coi như đạt`);
	} catch (err) {
		if (!controller.signal.aborted) {
			criticLine(pi, "err", `lỗi critic: ${oneLine((err as Error)?.message ?? String(err))}`);
		}
	} finally {
		crit.running = false;
		crit.controller = null;
		criticStatus(ctx, undefined);
	}
}

// ═════════════════════════════ State gốc (turn tracking) ═════════════════════════════

// Tăng khi user gửi tin mới -> mọi phán quyết đang chờ của critic lỗi thời.
const turn = { seq: 0 };

// ═════════════════════════════ Extension ═════════════════════════════

export default function (pi: ExtensionAPI) {
	// ---- Renderers ----

	// Brief của người dùng (mirror từ tin nhắn bị handled trong lúc advisor chạy).
	pi.registerMessageRenderer("muse-brief", (message, _options, theme) => {
		const text = typeof message.content === "string" ? message.content : "(nội dung)";
		return new Text(theme.fg("accent", `Muse brief › ${text}`), 0, 0);
	});

	// Kết quả cuối cùng của pipeline viết bài.
	pi.registerMessageRenderer("muse-review-result", (message, _options, theme) => {
		const text = typeof message.content === "string" ? message.content : "";
		return new Text(`${theme.bold(theme.fg("success", "✨ Muse Review — Bản hoàn chỉnh"))}\n\n${text}`, 0, 0);
	});

	// Chỉ đạo của critic gửi vào context — ẩn trong transcript.
	pi.registerMessageRenderer("critic-instruction", () => new Text("", 0, 0));

	// Progress lines Engine 1 (TUI-only).
	pi.registerEntryRenderer(EXT_ID, (entry, _options, theme) => {
		const d = (entry.data ?? {}) as {
			kind?: string;
			message?: string;
			index?: number;
			title?: string;
			words?: number;
			tokens?: number;
			seconds?: number;
		};
		switch (d.kind) {
			case "start":
				return new Text(theme.fg("accent", `▶ Muse Review · ${d.message ?? ""}`), 0, 0);
			case "step":
				return new Text(
					theme.fg(
						"success",
						`✍️ [${Math.min((d.index ?? 0) + 1, TOTAL_STEPS)}/${TOTAL_STEPS}] ${d.title ?? ""} · ${d.words ?? 0} từ · ~${d.tokens ?? 0} tokens · ${d.seconds ?? 0}s`,
					),
					0,
					0,
				);
			case "retry":
				return new Text(
					theme.fg("warning", `⚠️ [${Math.min((d.index ?? 0) + 1, TOTAL_STEPS)}/${TOTAL_STEPS}] ${d.title ?? ""} — ${d.message ?? ""}`),
					0,
					0,
				);
			case "warning":
				return new Text(theme.fg("warning", `⚠️ ${d.message ?? ""}`), 0, 0);
			case "error":
				return new Text(theme.fg("error", `✗ ${d.message ?? ""}`), 0, 0);
			case "finished":
				return new Text(theme.fg("success", `✔ ${d.message ?? ""}`), 0, 0);
			default:
				return new Text("", 0, 0);
		}
	});

	// Progress lines Engine 2 (TUI-only).
	pi.registerEntryRenderer(CRITIC_ENTRY_ID, (entry, _options, theme) => {
		const d = (entry.data ?? {}) as { kind?: string; message?: string };
		const label =
			d.kind === "ok"
				? theme.fg("success", "✓ critic")
				: d.kind === "warn"
					? theme.fg("warning", "⚠ critic")
					: d.kind === "err"
						? theme.fg("error", "✗ critic")
						: theme.fg("muted", "· critic");
		return new Text(`${label} · ${d.message ?? ""}`, 0, 0);
	});

	// Collapse đáp án đã bị critic bắt làm lại (display-only; context không đổi).
	pi.registerMarkdownTransformer((markdown, info) => {
		if (info?.messageType !== "assistant" || crit.superseded.size === 0) return markdown;
		if (!crit.superseded.has(keyOf(markdown))) return markdown;
		const words = markdown.split(/\s+/).filter(Boolean).length;
		return `⤷ _đáp án này đã bị critic bắt làm lại — xem bản đầy đủ phía dưới (~${words} từ đã ẩn)_`;
	});

	// ---- Lifecycle ----

	pi.on("session_start", async (_event, ctx) => {
		resetAdvisor();
		crit.controller?.abort();
		crit = freshCriticState();
		turn.seq = 0;
		sessionFlags = { typedCount: 0, initialUserMessages: countUserMessages(ctx), advisorRan: false };
		setStatus(ctx, undefined);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		resetAdvisor();
		crit.controller?.abort();
		crit = freshCriticState();
		setStatus(ctx, undefined);
	});

	// ---- Input: kill switch, keyword, fold brief, auto-start, reset critic theo lượt ----

	pi.on("input", async (event, ctx) => {
		try {
			const text = (event.text ?? "").trim();
			const upper = text.toUpperCase();

			// Kill switch tổng: hủy cả 2 engine.
			if (upper === STOP_TEXT) {
				const wasAdvisorRunning = adv.running;
				const stepTitle = wasAdvisorRunning ? stepAt(adv.stepIndex).title : "";
				resetAdvisor();
				crit.controller?.abort();
				crit.running = false;
				turn.seq++;
				setStatus(ctx, undefined);
				notify(
					ctx,
					wasAdvisorRunning
						? `Muse Review: STOP_REVIEW — đã dừng tại bước "${stepTitle}", bản nháp KHÔNG được đưa vào hội thoại.`
						: "Muse: không có việc nào đang chạy để dừng.",
					wasAdvisorRunning ? "info" : "warning",
				);
				return { action: "handled" };
			}

			if (upper === OFF_TEXT) {
				crit.controller?.abort();
				crit.enabled = false;
				criticStatus(ctx, undefined);
				notify(ctx, `critic đã TẮT cho tới khi CRITIC_ON.`, "info");
				return { action: "handled" };
			}
			if (upper === ON_TEXT) {
				crit.enabled = true;
				notify(ctx, `critic đã BẬT.`, "info");
				return { action: "handled" };
			}

			// Chỉ xử lý tin nhắn người dùng tự gõ.
			if (event.source !== "interactive") return { action: "continue" };
			sessionFlags.typedCount++;

			// Engine 1 đang chạy: ghi vào brief (main model không trả lời riêng).
			if (adv.running) {
				if (text) {
					adv.pendingUserTexts.push(text);
					mirrorBrief(pi, text);
					notify(ctx, "📎 Đã ghi nhận vào Muse Review — sẽ được tính vào bài viết.", "info");
				}
				return { action: "handled" };
			}

			// Tin nhắn mới của user = mọi phán quyết critic đang chờ trở nên lỗi thời.
			turn.seq++;
			crit.controller?.abort();

			// Auto-start Engine 1: tin đầu tự gõ của phiên mới + model trong danh sách.
			if (CONFIG.autoStart && !sessionFlags.advisorRan && sessionFlags.typedCount === 1 && sessionFlags.initialUserMessages === 0 && text && !text.startsWith("/") && modelMatches(ctx.model)) {
				startAdvisor(pi, ctx, text);
				return { action: "handled" };
			}

			// Reset vòng đếm critic cho lượt hỏi mới.
			crit.roundsUsed = 0;
			crit.verifyUsed = false;
			crit.toolLog = [];
			crit.lastRealPrompt = text;
			return { action: "continue" };
		} catch {
			return { action: "continue" };
		}
	});

	// ---- Thu thập thông tin cho critic ----

	pi.on("before_agent_start", async (event, _ctx) => {
		const p = (event.prompt ?? "").trim();
		crit.selfRun = p.startsWith(INJECT_PREFIX);
		if (!crit.selfRun && p) crit.lastRealPrompt = p;
	});

	pi.on("tool_result", async (event, _ctx) => {
		const e = event as unknown as { content?: unknown; toolName?: string; isError?: boolean; input?: unknown };
		const txt = extractText(e.content);
		const name = e.toolName ?? "tool";
		const err = e.isError ? "LỖI" : "ok";
		const input = oneLine(JSON.stringify(e.input ?? {})).slice(0, 120);
		crit.toolLog.push(`${name}(${input}) => ${err}: ${oneLine(txt)}`);
		if (crit.toolLog.length > 8) crit.toolLog.shift();
	});

	// ---- Engine 2: đánh giá sau khi agent thực sự dừng ----

	pi.on("agent_settled", async (_event, ctx) => {
		if (!crit.enabled || crit.running || adv.running) return;
		const capturedSeq = turn.seq;
		// defer: để pi kết thúc phần settle trước khi critic chạy
		setTimeout(() => {
			if (!crit.running && adv.running !== true && crit.enabled && capturedSeq === turn.seq) {
				void runReview(pi, ctx).catch(() => {
					crit.running = false;
					crit.controller = null;
				});
			}
		}, 0);
	});
}

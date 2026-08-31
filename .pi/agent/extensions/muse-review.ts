/**
 * muse-review.ts — Muse Suite cho Pi Agent: bộ "kèm cặp" 2 tầng CHO MODEL YẾU
 *
 * ⚠ TOÀN BỘ SUITE (cả 2 engine) CHỈ ÁP DỤNG CHO MODEL TRONG DANH SÁCH MUSE_MODELS
 *   (mặc định: opencode-go/muse-spark-1.2-contributor). Model khác → extension im lặng 100%.
 *
 * ═══ ENGINE 1 — MUSE REVIEW (viết bài, advisor mode) ═══
 *   Vượt giới hạn output tokens của model bằng pipeline chạy NGOÀI main session qua
 *   ctx.modelRegistry.complete():
 *     Bước 1–3 (Writing):  Mở bài → Thân bài → Kết luận  (---END OF PART n---)
 *     Bước 4–6 (Review):   Chính tả & Ngữ pháp → Logic & Lập luận → Ví dụ & Thuyết phục
 *     Bước 7   (Final):    Tổng hợp & Trau chuốt → ---FINAL VERSION---
 *     Dự phòng:            xuất lại đúng 1 lần nếu chưa thấy FINAL
 *   - CHỐNG CẮT (max output): lượt trả lời bị ngắt vì chạm giới hạn output (stopReason=length)
 *     KHÔNG bị bỏ — extension bắt model VIẾT TIẾP từ đúng chỗ dừng (tối đa
 *     MUSE_MAX_CONTINUATIONS lần) rồi mới ghép lại thành nội dung đầy đủ của bước đó.
 *   - CHẶN LƯỜI: mỗi bước có ngưỡng tối thiểu (bước viết: số từ tối thiểu cứng; bước
 *     review/tổng hợp: ≥ 70–80% độ dài bản hiện tại) — quá cụt → quát lỗi + bắt viết lại
 *     CHI TIẾT hơn (MUSE_MAX_RETRIES lần). Chi tiết trước, review sau, rồi mới trả cho bạn.
 *   - CHẠY VỚI MỌI TIN NHẮN tự gõ trên muse model (không chỉ tin đầu tiên): tin nhắn
 *     → pipeline viết → trả bản hoàn chỉnh; main model KHÔNG trả lời riêng (action handled).
 *   - Tin nhắn gõ thêm TRONG LÚC pipeline đang chạy → fold vào brief, tính vào bài viết.
 *   - Slash command (/…) không bị hijack. MUSE_AUTO_START=0 → chat bình thường.
 *   - Draft/prompt/review trung gian không bao giờ nằm trong main session.
 *
 * ═══ ENGINE 2 — CRITIC (phản biện độc lập, chỉ trên muse model) ═══
 *   Soi MỌI sản phẩm của muse model:
 *     a) BÀI VIẾT cuối của pipeline: sau khi deliver, critic đọc đề bài + bài viết và phán.
 *        Có lỗi thật → gọi thêm bước CHỈNH SỬA trong kênh ẩn (giữ phần tốt, sửa từng nhận
 *        xét) → deliver bản mới (bản cũ tự collapse). Trần CRITIC_MAX_ROUNDS vòng sửa.
 *     b) MỌI answer của main agent (khi main agent có chạy: slash command, tool loop,
 *        MUSE_AUTO_START=0...): verdict LGTM / NEED-VERIFY / ISSUES như cũ — ISSUES →
 *        đáp án cũ collapse, main agent phải kiểm chứng/sửa và XUẤT LẠI đầy đủ.
 *   - Critic KHÔNG tự chạy code của bạn (chỉ tự đọc git diff — chỉ đọc); NEED-VERIFY →
 *   chính MAIN AGENT (kẻ có tool) chạy lệnh lấy bằng chứng. Critic chỉ đòi lệnh kiểm tra
 *   RẺ NHANH (unit test/typecheck/lint, tự thoát ~30s) — CẤM đòi start server, watch,
 *   build đầy đủ, e2e, cài dependencies; việc đắt đó → tự kết luận từ bằng chứng tĩnh.
 *   Cấm đoán mò ngoài bằng chứng. User nhắn tin mới → phán quyết đang chờ bị hủy ngay.
 *
 * ═══ Điều khiển ═══
 *   STOP_REVIEW  (gõ trong chat) → hủy TẤT CẢ: pipeline viết bài + critic đang dở
 *   CRITIC_OFF / CRITIC_ON                    → tắt / bật riêng Engine 2
 *
 * ═══ Cấu hình env (tùy chọn) ═══
 *   MUSE_MODELS=list        danh sách model áp dụng suite, phân tách phẩy, wildcard *
 *                           (mặc định chính xác: opencode-go/muse-spark-1.2-contributor)
 *   MUSE_AUTO_START=1|0     1 (mặc định): mọi tin nhắn tự gõ trên muse model → pipeline.
 *                           0: chat bình thường (critic vẫn soi answer)
 *   MUSE_MAX_STEPS=14       số lần gọi model tối đa mỗi run (gồm cả lượt viết tiếp)
 *   MUSE_MIN_TOKENS=20      sàn tokens tối thiểu mỗi lượt gọi
 *   MUSE_MAX_RETRIES=2      số lần bắt viết lại khi output quá cụt
 *   MUSE_MAX_CONTINUATIONS=4    số lần bảo "viết tiếp" khi bị cắt ở giới hạn max output
 *   MUSE_STEP_TIMEOUT=180000    timeout mỗi call viết bài (ms)
 *   CRITIC_AUTO=1|0         bật/tắt Engine 2 (mặc định 1)
 *   CRITIC_MAX_ROUNDS=2     số vòng critic được can thiệp (sửa bài / bắt verify)
 *   CRITIC_TIMEOUT=60000    timeout mỗi call critic (ms)
 *   CRITIC_MIN_ANSWER=120   answer ngắn hơn + không tool call → bỏ qua khỏi soi
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

// Danh sách model áp dụng TOÀN BỘ suite — THÊM PROVIDER MỚI VÀO ĐÂY (hoặc env MUSE_MODELS).
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
	maxSteps: envInt("MUSE_MAX_STEPS", 14, 1),
	minTokens: envInt("MUSE_MIN_TOKENS", 20, 1),
	maxRetries: envInt("MUSE_MAX_RETRIES", 2, 0),
	maxContinuations: envInt("MUSE_MAX_CONTINUATIONS", 4, 0),
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
	minWords?: number; // bước viết: số từ tối thiểu (chặn lười)
}

const STEPS: StepDef[] = [
	{
		phase: "writing",
		part: 1,
		title: "Mở bài",
		task:
			"Viết MỞ BÀI của bài luận cho đề tài trong hội thoại: giới thiệu vấn đề, tạo điểm thu hút, dẫn dắt vào luận đề. Viết đầy đủ thành đoạn văn hoàn chỉnh, CHI TIẾT và CỤ THỂ. Độ dài mục tiêu: khoảng 200–350 từ (TỐI THIỂU 150 từ — ngắn hơn là bị trả lại).",
		tail: "Kết thúc phần bằng đúng dòng: ---END OF PART 1---",
		minWords: 150,
	},
	{
		phase: "writing",
		part: 2,
		title: "Thân bài",
		task:
			"Viết THÂN BÀI, tiếp nối Mở bài đã có trong hội thoại. Triển khai từng luận điểm chính thành đoạn văn hoàn chỉnh (mỗi đoạn một luận điểm, có câu chủ đề, có diễn giải và dẫn chứng). Độ dài mục tiêu: khoảng 300–450 từ (TỐI THIỂU 220 từ — ngắn hơn là bị trả lại).",
		tail: "Kết thúc phần bằng đúng dòng: ---END OF PART 2---",
		minWords: 220,
	},
	{
		phase: "writing",
		part: 3,
		title: "Kết luận",
		task:
			"Viết KẾT LUẬN, khép lại bài viết bằng cách chốt vấn đề và nâng tầm thông điệp, dựa trên Mở bài và Thân bài đã có trong hội thoại. Độ dài mục tiêu: khoảng 150–250 từ (TỐI THIỂU 100 từ — ngắn hơn là bị trả lại).",
		tail: "Kết thúc phần bằng đúng dòng: ---END OF PART 3---",
		minWords: 100,
	},
	{
		phase: "review",
		title: "Chính tả & Ngữ pháp",
		task:
			"REVIEW CHÍNH TẢ & NGỮ PHÁP: đọc toàn bộ nội dung bài viết trong hội thoại, sửa TẤT CẢ lỗi chính tả, ngữ pháp, dấu câu và dùng từ. Chỉ xuất ra toàn bộ bản đã sửa (ghép liền mạch), KHÔNG liệt kê lỗi, KHÔNG bình luận, KHÔNG được rút gọn hay tóm tắt so với bản gốc — giữ nguyên hoặc mở rộng độ dài.",
		tail: "Không thêm bất kỳ dấu hiệu kết thúc đặc biệt nào.",
	},
	{
		phase: "review",
		title: "Logic & Lập luận",
		task:
			"REVIEW LOGIC & LẬP LUẬN: đọc bản mới nhất trong hội thoại, kiểm tra mạch lập luận và tính nhất quán, thắt chặt liên kết giữa các đoạn, bổ sung luận cứ cho những chỗ còn yếu. Chỉ xuất toàn bộ bản đã cải thiện, không bình luận, KHÔNG được rút gọn hay tóm tắt so với bản gốc — giữ nguyên hoặc mở rộng độ dài.",
		tail: "Không thêm bất kỳ dấu hiệu kết thúc đặc biệt nào.",
	},
	{
		phase: "review",
		title: "Ví dụ & Thuyết phục",
		task:
			"REVIEW VÍ DỤ & TÍNH THUYẾT PHỤC: đọc bản mới nhất trong hội thoại, bổ sung dẫn chứng, ví dụ cụ thể và số liệu minh họa ở những chỗ phù hợp để tăng sức thuyết phục. Chỉ xuất toàn bộ bản đã cải thiện, không bình luận, KHÔNG được rút gọn hay tóm tắt so với bản gốc — giữ nguyên hoặc mở rộng độ dài.",
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

/** Key nội dung (djb2 + độ dài) để nhận diện bài/đáp án đã bị thay thế khi render. */
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

// ═════════════════════════════ Trạng thái chung ═════════════════════════════

interface AdvisorState {
	running: boolean;
	stepIndex: number;
	controller: AbortController | null;
	pendingUserTexts: string[];
}

let adv: AdvisorState = { running: false, stepIndex: 0, controller: null, pendingUserTexts: [] };

function resetAdvisor(): void {
	adv.controller?.abort();
	adv = { running: false, stepIndex: 0, controller: null, pendingUserTexts: [] };
}

// Tăng khi user gửi tin mới -> mọi phán quyết đang chờ của critic lỗi thời.
const turn = { seq: 0 };

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

// ═════════════════════════════ UI helpers ═════════════════════════════

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

function criticLine(pi: ExtensionAPI, kind: "ok" | "warn" | "err" | "info", message: string): void {
	appendEntrySafe(pi, CRITIC_ENTRY_ID, { kind, message });
}

function criticStatus(ctx: ExtensionContext, text?: string): void {
	setStatus(ctx, text);
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
	`- KHÔNG bình luận về quy trình, không đặt câu hỏi ngược lại, không xin hướng dẫn thêm.`,
	`- Phong cách bắt buộc: CHI TIẾT, CỤ THỂ, ĐẦY ĐỦ. CẤM tóm tắt, CẤM viết qua loa, CẤM bỏ ngang, CẤM dùng "vân vân/...", CẤM tự kết thúc sớm khi nội dung chưa xong.`,
	`- Nếu lượt trả lời bị ngắt vì giới hạn output, ở lượt kế tiếp phải viết tiếp NGAY từ chỗ dừng cho tới khi hoàn thành phần đang làm.`,
].join("\n");

function buildStepTask(index: number, isRetry: boolean, reason = ""): string {
	const step = stepAt(index);
	const n = Math.min(index + 1, TOTAL_STEPS);
	const lines: string[] = [];
	if (isRetry) {
		lines.push(
			`[MUSE REVIEW ⚠ PHẢN HỒI QUÁ CỤT — BẠN ĐANG LƯỜI TRẢ LỜI]`,
			`Câu trả lời trước của bạn${reason ? ` (${reason})` : ""} QUÁ NGẮN và THIẾU CHI TIẾT so với yêu cầu.`,
			`Hãy thực hiện LẠI bước hiện tại (${step.title}): viết CHI TIẾT, CỤ THỂ, ĐẦY ĐỦ hơn — CẤM tóm tắt, CẤM liệt kê gọn, CẤM bỏ ngang, CẤM kết thúc sớm.`,
			``,
		);
	} else {
		lines.push(`[MUSE REVIEW ▸ BƯỚC ${n}/${TOTAL_STEPS} — ${step.title.toUpperCase()}]`);
	}
	lines.push(`NHIỆM VỤ: ${step.task}`, step.tail);
	lines.push(`(Bọc nội dung trong [SECTION]...[END]; tham khảo toàn bộ hội thoại trong phiên làm việc này.)`);
	return lines.join("\n");
}

const CONTINUE_TASK = [
	`[MUSE REVIEW ⚠ LƯỢT TRƯỚC BỊ CẮT DO GIỚI HẠN OUTPUT]`,
	`Phần trả lời trước của bạn bị NGẮT GIỮA CHỪNG vì chạm giới hạn output — nội dung đang DỞ.`,
	`Hãy VIẾT TIẾP NGAY từ đúng chỗ vừa dừng: không lặp lại chữ đã viết, không tóm tắt lại, không mở đầu lại, không xin lỗi.`,
	`Viết tiếp cho tới khi hoàn thành phần đang làm. Vẫn bọc nội dung trong [SECTION]...[END].`,
].join("\n");

async function runAdvisor(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	firstUserText: string,
	controller: AbortController,
): Promise<void> {
	const model = ctx.model;
	const modelId = model ? `${model.provider}/${model.id}` : "(không rõ)";
	const messages: AiMessage[] = [];
	let fullRequest = firstUserText;
	let stepIndex = 0;
	let retries = 0;
	let retryReason = "";
	let stepsExecuted = 0;
	let essay = ""; // nội dung đầy đủ nhất hiện có (bước viết: ghép dần; bước review: thay toàn bộ)

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
				fullRequest += `\nYÊU CẦU BỔ SUNG:\n${list}`;
				messages.push(
					userMsg(`YÊU CẦU BỔ SUNG từ người dùng (bắt buộc tôn trọng khi thực hiện):\n${list}`),
				);
			}

			// Guard maxSteps: dừng và trả về bản gần hoàn chỉnh nhất.
			if (stepsExecuted >= CONFIG.maxSteps) {
				if (essay) {
					deliver(
						pi,
						ctx,
						essay,
						`đạt giới hạn ${CONFIG.maxSteps} lần gọi model — trả về bản gần hoàn chỉnh nhất (chưa qua bước trau chuốt).`,
						"warning",
					);
					await criticGateEssay(pi, ctx, fullRequest, essay);
				} else {
					notify(ctx, `Muse Review: đạt giới hạn ${CONFIG.maxSteps} bước mà chưa có nội dung — dừng.`, "error");
					appendEntrySafe(pi, EXT_ID, { kind: "error", message: `đạt giới hạn ${CONFIG.maxSteps} bước, không có nội dung` });
				}
				return;
			}

			const step = stepAt(stepIndex);
			museStatus(ctx, stepIndex);
			const baseLen = messages.length;
			messages.push(userMsg(buildStepTask(stepIndex, retries > 0, retryReason)));
			const callStart = Date.now();
			let raw = "";
			let outTokens = 0;
			let lastStop = "stop";
			let contCount = 0;

			// Vòng gọi 1 bước: nếu bị cắt vì chạm giới hạn output (stopReason=length)
			// thì bắt model VIẾT TIẾP từ chỗ dừng, tối đa MUSE_MAX_CONTINUATIONS lần.
			while (true) {
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

				const piece = extractText(response.content);
				raw += piece;
				outTokens += response.usage?.output ?? Math.ceil(piece.length / 4);
				lastStop = response.stopReason ?? "stop";
				messages.push(response as unknown as AiMessage);

				if (lastStop === "length" && contCount < CONFIG.maxContinuations) {
					contCount++;
					messages.push(userMsg(CONTINUE_TASK));
					appendEntrySafe(pi, EXT_ID, {
						kind: "continue",
						index: stepIndex,
						title: step.title,
						message: `bị cắt ở giới hạn output → bảo viết tiếp (lần ${contCount}/${CONFIG.maxContinuations})`,
					});
					continue;
				}
				break;
			}

			if (lastStop === "length") {
				appendEntrySafe(pi, EXT_ID, {
					kind: "warning",
					message: `bước "${step.title}" vẫn bị cắt sau ${CONFIG.maxContinuations} lần viết tiếp — chấp nhận phần dài nhất lấy được`,
				});
			}

			const body = coreContent(raw);
			const seconds = (Date.now() - callStart) / 1000;
			const words = countWords(body);
			const prevWordCount = countWords(essay);
			// Ngưỡng tối thiểu: bước viết = số từ cứng; review ≥ 70%, tổng hợp ≥ 80% bản hiện tại.
			const required =
				step.phase === "writing"
					? (step.minWords ?? 0)
					: Math.floor(prevWordCount * (step.phase === "final" ? 0.8 : 0.7));

			// Quá cụt → quát và bắt viết lại chi tiết (MUSE_MAX_RETRIES lần), bỏ phản hồi lười.
			if ((outTokens < CONFIG.minTokens || (required > 0 && words < required)) && retries < CONFIG.maxRetries) {
				retries++;
				retryReason =
					outTokens < CONFIG.minTokens
						? `~${outTokens} tokens`
						: `${words} từ, cần ≥ ${required} từ`;
				messages.length = baseLen; // bỏ task + các phản hồi lười
				appendEntrySafe(pi, EXT_ID, {
					kind: "retry",
					index: stepIndex,
					title: step.title,
					message: `quá cụt (${retryReason}) — bắt viết lại chi tiết (${retries}/${CONFIG.maxRetries})`,
				});
				continue;
			}
			retries = 0;
			retryReason = "";

			if (step.phase === "writing") essay = essay ? `${essay}\n\n${body}` : body;
			else essay = body;
			appendEntrySafe(pi, EXT_ID, {
				kind: "step",
				index: stepIndex,
				title: step.title,
				words,
				tokens: outTokens,
				seconds: Math.round(seconds * 10) / 10,
			});

			if (stepIndex < TOTAL_STEPS - 1) {
				stepIndex++;
				adv.stepIndex = stepIndex;
				continue;
			}

			if (FINAL_MARKER_RE.test(raw)) {
				const finalText = cleanFinal(raw);
				deliver(
					pi,
					ctx,
					finalText,
					stepIndex === TOTAL_STEPS - 1
						? "hoàn tất! Bản hoàn chỉnh bên dưới."
						: "hoàn tất sau bước dự phòng! Bản hoàn chỉnh bên dưới.",
					"info",
				);
				await criticGateEssay(pi, ctx, fullRequest, finalText);
			} else {
				deliver(
					pi,
					ctx,
					essay,
					"không tìm thấy ---FINAL VERSION--- kể cả sau bước dự phòng — trả về bản đầy đủ nhất hiện có.",
					"warning",
				);
				await criticGateEssay(pi, ctx, fullRequest, essay);
			}
			return;
		}
	} catch (err) {
		const msg = (err as Error)?.message ?? String(err);
		appendEntrySafe(pi, EXT_ID, { kind: "error", message: `lỗi: ${truncate(msg, 160)}` });
		if (essay) {
			deliver(pi, ctx, essay, `lỗi giữa chừng (${truncate(msg, 100)}) — trả về bản nháp gần nhất.`, "warning");
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
	``,
	`Về NEED-VERIFY — RẤT KÉN CHỌN, chỉ khi thiếu bằng chứng VÀ lấy được bằng lệnh RẺ:`,
	`- CHỈ đòi lệnh kiểm tra NHANH, tự thoát trong vài giây đến ~30 giây: unit test của 1-2 file liên quan, typecheck, lint file vừa sửa, đọc/grep một file để đối chiếu.`,
	`- TUYỆT ĐỐI KHÔNG đòi những việc tốn thời gian: start/dev server hoặc bất kỳ tiến trình chạy dài, watch mode, build đầy đủ, e2e suite, cài dependencies, migration DB, gọi API mạng ngoài, lệnh tương tác hoặc chờ input.`,
	`- Nếu xác minh thật sự cần những việc đắt đó -> ĐỪNG NEED-VERIFY. Tự kết luận từ bằng chứng tĩnh đang có (đọc code/diff/log trong bằng chứng): thấy lỗi rõ -> ISSUES; không thấy lỗi chặn -> LGTM.`,
	`- Tối đa 2 lệnh, mỗi dòng 1 lệnh, lệnh nào cũng phải tự thoát nhanh.`,
	``,
	`Bắt buộc trả lời đúng MỘT trong 3 khuôn, KHÔNG thêm chữ nào khác:`,
	`---LGTM---`,
	`hoặc`,
	`---NEED-VERIFY---`,
	`<tối đa 2 lệnh kiểm tra NHANH (tự thoát, không start server, không watch), mỗi dòng 1 lệnh, không giải thích>`,
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
		`${INJECT_PREFIX} Cần bằng chứng nhanh trước khi kết luận. Hãy chạy ĐÚNG các lệnh kiểm tra NHANH sau (mỗi lệnh phải tự thoát — nếu lệnh nào cần start server/chờ lâu/tương tác thì bỏ qua và ghi rõ) rồi báo cáo nguyên văn kết quả. KHÔNG sửa code, KHÔNG giải thích thêm:`,
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

/**
 * Gate critic cho BÀI VIẾT cuối của pipeline: soi đề bài + bài viết trong kênh ẩn.
 * LGTM → xong. ISSUES → gọi thêm bước CHỈNH SỬA (vẫn kênh ẩn) → deliver bản mới
 * (bản cũ collapse). Trần CONFIG.criticMaxRounds vòng sửa. NEED-VERIFY → bỏ qua
 * (bài viết không cần chạy lệnh lấy bằng chứng).
 */
async function criticGateEssay(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	request: string,
	firstEssay: string,
): Promise<void> {
	if (!crit.enabled || !modelMatches(ctx.model)) return;
	const model = ctx.model;
	if (!model || !firstEssay.trim()) return;
	const seq = turn.seq;
	let current = firstEssay;
	let revised = 0;

	criticStatus(ctx, "🔍 critic: đang soi bài viết…");
	try {
		while (true) {
			const controller = new AbortController();
			crit.controller = controller;
			const gitDiff = await getGitDiff(pi);
			const evidence = buildEvidence(
				request,
				current,
				["(bài viết được soạn bằng pipeline nhiều bước ngoài main session — không có tool call)"],
				gitDiff,
			);
			const { signal } = makeStepSignal(controller, CONFIG.criticTimeoutMs);
			const verdictResp = (await ctx.modelRegistry.complete(
				model,
				{ systemPrompt: CRITIC_SYSTEM, messages: [userMsg(evidence)] },
				{ signal, cacheRetention: "none", sessionId: uuidv7() },
			)) as unknown as MessageLike;

			if (controller.signal.aborted || seq !== turn.seq) return;
			if (verdictResp.stopReason === "aborted") return;
			if (verdictResp.stopReason === "error" || verdictResp.errorMessage) {
				criticLine(pi, "warn", `critic lỗi (${oneLine(verdictResp.errorMessage ?? "api error")}) — giữ bài hiện tại.`);
				return;
			}

			const v = extractText(verdictResp.content);
			const issues = VERDICT_ISSUES.test(v) ? parseVerdictLines(v, VERDICT_ISSUES) : "";
			const verify = VERDICT_VERIFY.test(v) ? parseVerdictLines(v, VERDICT_VERIFY) : "";

			if (!issues && !verify && VERDICT_LGTM.test(v)) {
				criticLine(pi, "ok", "bài viết đạt — critic không có ý kiến");
				return;
			}
			if (verify && !issues) {
				criticLine(pi, "info", "critic đòi bằng chứng chạy lệnh — không áp dụng cho bài viết, bỏ qua");
				return;
			}
			if (!issues) {
				criticLine(pi, "warn", "verdict không đúng khuôn → coi như đạt");
				return;
			}

			if (revised >= CONFIG.criticMaxRounds) {
				criticLine(pi, "warn", `còn ý kiến nhưng đã hết ${CONFIG.criticMaxRounds} vòng sửa — giữ bản hiện tại.`);
				notify(ctx, `critic còn ý kiến nhưng đã hết vòng sửa bài.`, "warning");
				return;
			}
			revised++;
			criticLine(pi, "warn", `critic có ý kiến → chỉnh sửa lại bài (vòng ${revised}/${CONFIG.criticMaxRounds})`);

			// Bước chỉnh sửa trong kênh ẩn: giữ phần tốt, sửa từng nhận xét, xuất lại toàn bộ.
			const bullets = issues
				.split(/\n+/)
				.map((l) => oneLine(l))
				.filter(Boolean)
				.map((l) => (l.startsWith("-") ? l : `- ${l}`))
				.join("\n");
			const revTask = [
				`[MUSE REVIEW ▸ CHỈNH SỬA THEO NGƯỜI PHẢN BIỆN ĐỘC LẬP]`,
				`Đề tài / yêu cầu gốc của người dùng:`,
				request,
				``,
				`BÀI VIẾT HIỆN TẠI:`,
				current,
				``,
				`NHẬN XÉT CỦA NGƯỜI PHẢN BIỆN (xử lý TỪNG ý, không bỏ ý nào):`,
				bullets,
				``,
				`NHIỆM VỤ: sửa bài theo từng nhận xét trên, giữ nguyên những phần đã tốt, xuất lại TOÀN BỘ bài hoàn chỉnh liền mạch. Không bình luận, không liệt kê đã sửa gì.`,
				`Kết thúc bài bằng đúng dòng: ---FINAL VERSION---`,
			].join("\n");
			const revSignal = makeStepSignal(controller, CONFIG.stepTimeoutMs);
			const revResp = (await ctx.modelRegistry.complete(
				model,
				{ systemPrompt: ADVISOR_SYSTEM, messages: [userMsg(revTask)] },
				{ signal: revSignal.signal, cacheRetention: "none", sessionId: uuidv7() },
			)) as unknown as MessageLike;

			if (controller.signal.aborted || seq !== turn.seq) return;
			if (revResp.stopReason === "aborted") return;
			if (revResp.stopReason === "error" || revResp.errorMessage) {
				criticLine(pi, "err", `lỗi khi chỉnh sửa bài: ${oneLine(revResp.errorMessage ?? "api error")}`);
				return;
			}
			const revRaw = extractText(revResp.content);
			const revBody = FINAL_MARKER_RE.test(revRaw) ? cleanFinal(revRaw) : coreContent(revRaw);
			if (!revBody) {
				criticLine(pi, "err", "bản chỉnh sửa rỗng — giữ bài hiện tại");
				return;
			}
			crit.superseded.add(keyOf(current)); // bản cũ collapse trong transcript
			current = revBody;
			appendEntrySafe(pi, EXT_ID, {
				kind: "revise",
				round: revised,
				words: countWords(revBody),
			});
			deliver(pi, ctx, current, `bài đã chỉnh sửa theo critic (vòng ${revised}/${CONFIG.criticMaxRounds}) — bản mới bên dưới.`, "info");
			// vòng lặp tiếp: review lại bản mới
		}
	} catch (err) {
		if (crit.controller?.signal.aborted !== true) {
			criticLine(pi, "err", `lỗi critic: ${oneLine((err as Error)?.message ?? String(err))}`);
		}
	} finally {
		crit.controller = null;
		criticStatus(ctx, undefined);
	}
}

/** Review answer của main agent (khi main agent thực sự chạy) — qua agent_settled. */
async function runReview(pi: ExtensionAPI, ctx: ExtensionContext): Promise<void> {
	if (!crit.enabled || crit.running || adv.running || !modelMatches(ctx.model)) return;
	const last = lastAssistant(ctx);
	if (!last) return;
	const answer = extractText(last.msg.content);
	const selfDriven = crit.selfRun;
	crit.selfRun = false;

	if (!answer.trim()) return;
	if (last.key && crit.superseded.has(last.key)) return; // bản cũ đã bị thay
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
		notify(ctx, `critic đang bật cho model trong MUSE_MODELS — tắt: CRITIC_OFF`, "info");
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

// ═════════════════════════════ Extension ═════════════════════════════

export default function (pi: ExtensionAPI) {
	// ---- Renderers ----

	// Brief của người dùng (mirror từ tin nhắn bị handled trong lúc advisor chạy).
	pi.registerMessageRenderer("muse-brief", (message, _options, theme) => {
		const text = typeof message.content === "string" ? message.content : "(nội dung)";
		return new Text(theme.fg("accent", `Muse brief › ${text}`), 0, 0);
	});

	// Kết quả cuối cùng của pipeline viết bài (bản đã bị critic sửa → collapse).
	pi.registerMessageRenderer("muse-review-result", (message, _options, theme) => {
		const text = typeof message.content === "string" ? message.content : "";
		if (text && crit.superseded.has(keyOf(text))) {
			const words = text.split(/\s+/).filter(Boolean).length;
			return new Text(
				theme.fg("muted", `⤷ _bản bài viết này đã được critic chỉnh sửa — xem bản mới phía dưới (~${words} từ đã ẩn)_`),
				0,
				0,
			);
		}
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
			round?: number;
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
			case "continue":
				return new Text(
					theme.fg("accent", `✂️ [${Math.min((d.index ?? 0) + 1, TOTAL_STEPS)}/${TOTAL_STEPS}] ${d.title ?? ""} — ${d.message ?? ""}`),
					0,
					0,
				);
			case "revise":
				return new Text(
					theme.fg("warning", `🛠 chỉnh sửa theo critic (vòng ${d.round ?? 0}) · ${d.words ?? 0} từ`),
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

	// Collapse đáp án (main agent) đã bị critic bắt làm lại (display-only; context không đổi).
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
		setStatus(ctx, undefined);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		resetAdvisor();
		crit.controller?.abort();
		crit = freshCriticState();
		setStatus(ctx, undefined);
	});

	// ---- Input: kill switch, keyword, fold brief, pipeline MỌI tin nhắn, reset critic ----

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

			// Engine 1 đang chạy: ghi vào brief (main model không trả lời riêng).
			if (adv.running) {
				if (text) {
					adv.pendingUserTexts.push(text);
					mirrorBrief(pi, text);
					notify(ctx, "📎 Đã ghi nhận vào Muse Review — sẽ được tính vào bài viết.", "info");
				}
				return { action: "handled" };
			}

			// Tin nhắn mới = phán quyết critic đang chờ lỗi thời + reset vòng đếm.
			turn.seq++;
			crit.controller?.abort();
			crit.roundsUsed = 0;
			crit.verifyUsed = false;
			crit.toolLog = [];
			crit.lastRealPrompt = text;

			// Model ngoài danh sách MUSE_MODELS → toàn bộ suite im lặng.
			if (!modelMatches(ctx.model)) return { action: "continue" };

			// MỌI tin nhắn tự gõ (không phải slash command) trên muse model → pipeline.
			if (CONFIG.autoStart && text && !text.startsWith("/")) {
				startAdvisor(pi, ctx, text);
				return { action: "handled" };
			}

			// Slash command hoặc MUSE_AUTO_START=0 → chat bình thường, critic vẫn soi answer.
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

	// ---- Engine 2: đánh giá answer của main agent sau khi agent dừng ----

	pi.on("agent_settled", async (_event, ctx) => {
		if (!crit.enabled || crit.running || adv.running || !modelMatches(ctx.model)) return;
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

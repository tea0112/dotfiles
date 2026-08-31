/**
 * critic-review.ts — Critic độc lập "đứng sau" cho MỌI tác vụ (Engine B của bộ Muse/Critic)
 *
 * Ý tưởng: sau mỗi lượt trả lời của agent (bất kể model nào, bất kể việc gì —
 * code, lệnh shell, giải thích, soạn thảo...), extension gọi MỘT LẦN model ở kênh
 * ẩn làm người phản biện KHÁCH QUAN. Critic không sửa gì, không nói chuyện với
 * người dùng — nó chỉ phán:
 *
 *   ---LGTM---        sạch → bạn chỉ thấy 1 dòng progress "✓", không tốn lượt nào
 *   ---NEED-VERIFY---  thiếu bằng chứng (test/lint chưa chạy) → chính main agent
 *                      được yêu cầu chạy các lệnh đó (extension KHÔNG tự chạy code
 *                      của bạn), kết quả quay lại critic, mới được kết luận
 *   ---ISSUES---       có lỗi thật → đáp án cũ bị "gạt" thành 1 dòng, main agent
 *                      phải kiểm chứng/sửa và XUẤT LẠI đáp án cuối đầy đủ
 *
 * Nguyên tắc:
 *   - Bằng chứng: prompt + đáp án + tool log của lượt vừa rồi + git diff (chỉ đọc).
 *     Critic bị CẤM đoán mò ngoài bằng chứng → hạn chế false-positive.
 *   - Có trần số vòng can thiệp (CRITIC_MAX_ROUNDS) → chống loop vô tận.
 *   - Invisible: tin nhắn chỉ đạo của critic gửi vào main session dạng display:false
 *     (custom message vẫn vào LLM context, người dùng không thấy trong transcript).
 *   - Đáp án bị thay thế được collapse còn 1 dòng qua markdownTransformer
 *     (display-only, không đụng context) — transcript gọn như muse-review.
 *   - Tôn trọng user: tin nhắn mới của user = hủy mọi nhận định/draft đang chờ.
 *   - Không chèn chân với muse-review: muse phát sự kiện pi.events "muse"
 *     {running}; khi muse chạy, critic im lặng hoàn toàn.
 *
 * Điều khiển:
 *   CRITIC_OFF   (gõ trong chat) → tắt critic cho tới khi bật lại
 *   CRITIC_ON    (gõ trong chat) → bật lại
 *   STOP_REVIEW  (gõ trong chat) → hủy mọi việc đang chạy dở (của critic lẫn muse;
 *                  message vẫn được chuyển cho muse handler xử lý vòng lặp viết bài)
 *
 * Cấu hình env (tùy chọn):
 *   CRITIC_AUTO=1|0          bật mặc định (mặc định 1 — vì critic áp dụng cho mọi model)
 *   CRITIC_MAX_ROUNDS=2      số lần critic được can thiệp / 1 lượt hỏi của user
 *   CRITIC_TIMEOUT=60000     timeout mỗi lần gọi critic (ms)
 *   CRITIC_MIN_ANSWER=120    đáp án ngắn hơn mức này và không có tool call -> bỏ qua
 *                            (khỏi soi câu "ok", "xong rồi")
 *
 * Chi phí: mỗi lượt có nội dung đáng kể = +1 call ẩn (system + bằng chứng, truncated);
 * khi có lỗi = +1 lượt main agent sửa. Tắt bằng CRITIC_OFF hoặc CRITIC_AUTO=0.
 *
 * Lưu ý: token call critic không vào /session của pi; transcript vẫn chứa đáp án
 * cuối đã sửa (context LLM giữ nguyên toàn bộ, chỉ hiển thị được gọn lại).
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { uuidv7 } from "@earendil-works/pi-ai";

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

const CONFIG = {
	autoOn: envBool("CRITIC_AUTO", true),
	maxRounds: envInt("CRITIC_MAX_ROUNDS", 2, 0),
	timeoutMs: envInt("CRITIC_TIMEOUT", 60_000, 1_000),
	minAnswerChars: envInt("CRITIC_MIN_ANSWER", 120, 0),
};

const EXT_ID = "critic-review";
const INJECT_PREFIX = "⚙️ [CRITIC REVIEW]";
const OFF_TEXT = "CRITIC_OFF";
const ON_TEXT = "CRITIC_ON";
const STOP_TEXT = "STOP_REVIEW";

const VERDICT_LGTM = /-{3,}\s*LGTM\s*-{3,}/i;
const VERDICT_VERIFY = /-{3,}\s*NEED-VERIFY\s*-{3,}/i;
const VERDICT_ISSUES = /-{3,}\s*ISSUES\s*-{3,}/i;

// ============================== Prompt ==============================

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

function buildEvidence(
	prompt: string,
	answer: string,
	toolLog: string[],
	gitDiff: string,
): string {
	const t = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…[chặn]` : s);
	const lines = [
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
	];
	return lines.join("\n");
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

// ============================== State ==============================

interface CriticState {
	enabled: boolean;
	running: boolean;
	roundsUsed: number; // số lần critic can thiệp trong lượt hỏi hiện tại của user
	verifyUsed: boolean; // đã từng đòi chạy lệnh ở lượt này (không đòi lần 2)
	selfRun: boolean; // lượt hiện tại là do critic kích hoạt
	lastRealPrompt: string;
	toolLog: string[];
	turnSeq: number; // tăng khi user gửi tin mới -> nhận định cũ trở nên lỗi thời
	controller: AbortController | null;
	museRunning: boolean;
	hinted: boolean;
	superseded: Set<string>; // key đáp án đã bị thay thế (collapse hiển thị)
}

function freshState(): CriticState {
	return {
		enabled: CONFIG.autoOn,
		running: false,
		roundsUsed: 0,
		verifyUsed: false,
		selfRun: false,
		lastRealPrompt: "",
		toolLog: [],
		turnSeq: 0,
		controller: null,
		museRunning: false,
		hinted: false,
		superseded: new Set(),
	};
}

let st = freshState();

// ============================== Helpers ==============================

interface MessageLike {
	role?: string;
	content?: unknown;
	stopReason?: string;
	errorMessage?: string;
}

interface EntryLike {
	type: string;
	message?: MessageLike;
}

function getBranchEntries(ctx: ExtensionContext): EntryLike[] {
	return ctx.sessionManager.getBranch() as unknown as EntryLike[];
}

function lastAssistant(ctx: ExtensionContext): { msg: MessageLike; key: string } | undefined {
	const entries = getBranchEntries(ctx);
	for (let i = entries.length - 1; i >= 0; i--) {
		const e = entries[i];
		if (e?.type === "message" && e?.message?.role === "assistant") {
			const text = extractText(e.message.content);
			return { msg: e.message, key: keyOf(text) };
		}
	}
	return undefined;
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

/** Key nội dung (djb2 + độ dài) để nhận diện đáp án đã bị thay thế khi render. */
function keyOf(text: string): string {
	let h = 5381;
	for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
	return `${text.length}:${h.toString(36)}`;
}

function oneLine(s: string): string {
	return s.replace(/\s+/g, " ").trim();
}

function notify(ctx: ExtensionContext, text: string, level: "info" | "warning" | "error" = "info"): void {
	if (!ctx.hasUI) return;
	ctx.ui.notify(`🔍 ${text}`, level);
}

function setStatus(ctx: ExtensionContext, text?: string): void {
	if (!ctx.hasUI) return;
	ctx.ui.setStatus(EXT_ID, text);
}

function appendLine(pi: ExtensionAPI, kind: "ok" | "warn" | "err" | "info", message: string): void {
	try {
		pi.appendEntry(EXT_ID, { kind, message });
	} catch {
		// progress là TUI-only, không để nó làm hỏng luồng
	}
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
		if (/^\s*-{3,}/.test(line)) break; // gặp marker khác -> dừng
		out.push(line);
	}
	return out.join("\n").trim();
}

// ============================== Review core ==============================

async function runReview(pi: ExtensionAPI, ctx: ExtensionContext): Promise<void> {
	const last = lastAssistant(ctx);
	if (!last) return;
	const answer = extractText(last.msg.content);
	const selfDriven = st.selfRun;
	st.selfRun = false;

	if (!answer.trim()) return;
	if (last.key && st.superseded.has(last.key)) return; // bản cũ đã bị thay
	if (st.museRunning || !st.enabled || st.running) return;
	// bỏ qua câu quá cụt và không có hành động gì ("ok", "xong", ...)
	if (!selfDriven && st.toolLog.length === 0 && answer.length < CONFIG.minAnswerChars) return;

	const model = ctx.model;
	if (!model) return;

	const seq = st.turnSeq;
	const controller = new AbortController();
	st.controller = controller;
	st.running = true;
	setStatus(ctx, "🔍 critic: đang soi…");
	if (!st.hinted) {
		st.hinted = true;
		notify(ctx, `critic đang bật cho mọi lượt trả lời — tắt: CRITIC_OFF`, "info");
	}

	try {
		const gitDiff = await getGitDiff(pi, ctx);
		const evidence = buildEvidence(st.lastRealPrompt, answer, st.toolLog, gitDiff);
		const userMsg = {
			role: "user" as const,
			content: [{ type: "text" as const, text: evidence }],
			timestamp: Date.now(),
		};

		const verdictResp = (await ctx.modelRegistry.complete(
			model,
			{ systemPrompt: CRITIC_SYSTEM, messages: [userMsg] },
			{
				signal: controller.signal,
				cacheRetention: "none",
				sessionId: uuidv7(),
			},
		)) as unknown as MessageLike;

		if (controller.signal.aborted || seq !== st.turnSeq) return; // user đã sang việc khác
		if (verdictResp.stopReason === "aborted") return;
		if (verdictResp.stopReason === "error" || verdictResp.errorMessage) {
			appendLine(pi, "warn", `critic lỗi (${oneLine(verdictResp.errorMessage ?? "api error")}) — bỏ qua, giữ đáp án hiện tại.`);
			return;
		}

		const v = extractText(verdictResp.content);
		const issues = VERDICT_ISSUES.test(v) ? parseVerdictLines(v, VERDICT_ISSUES) : "";
		const verify = VERDICT_VERIFY.test(v) ? parseVerdictLines(v, VERDICT_VERIFY) : "";

		if (issues) {
			if (st.roundsUsed >= CONFIG.maxRounds) {
				appendLine(pi, "warn", `còn lỗi nhưng đã hết ${CONFIG.maxRounds} vòng can thiệp — giữ đáp án hiện tại.`);
				notify(ctx, `critic thấy lỗi nhưng đã hết vòng sửa.`, "warning");
				return;
			}
			st.roundsUsed++;
			// đáp án cũ bị thay thế -> collapse hiển thị khi bản mới về
			st.superseded.add(last.key);
			const bullets = issues
				.split(/\n+/)
				.map((l) => oneLine(l))
				.filter(Boolean)
				.map((l) => (l.startsWith("-") ? l : `- ${l}`))
				.join("\n");
			appendLine(pi, "warn", `thấy lỗi → bắt làm lại (vòng ${st.roundsUsed}/${CONFIG.maxRounds})`);
			inject(pi, ctx, reviseInstruction(bullets));
			return;
		}

		if (verify) {
			if (st.verifyUsed || st.roundsUsed >= CONFIG.maxRounds) {
				appendLine(pi, "info", `critic cần thêm bằng chứng nhưng đã dùng quyền — coi như đạt, giữ đáp án.`);
				return;
			}
			st.verifyUsed = true;
			st.roundsUsed++;
			appendLine(pi, "info", `chưa đủ bằng chứng → yêu cầu chạy test/lint`);
			inject(pi, ctx, verifyInstruction(verify));
			return;
		}

		if (VERDICT_LGTM.test(v) || !verify) {
			// LGTM. Nếu lượt này chỉ là báo cáo bằng chứng sau NEED-VERIFY → collapse nó,
			// đáp án gốc của model (phía trên) vẫn hiển thị đầy đủ.
			if (st.verifyUsed) st.superseded.add(last.key);
			appendLine(pi, "ok", "đạt — không có lỗi chặn được");
			return;
		}

		appendLine(pi, "warn", `verdict không đúng khuôn → coi như đạt`);
	} catch (err) {
		if (!controller.signal.aborted) {
			appendLine(pi, "err", `lỗi critic: ${oneLine((err as Error)?.message ?? String(err))}`);
		}
	} finally {
		st.running = false;
		st.controller = null;
		setStatus(ctx, undefined);
	}
}

function inject(pi: ExtensionAPI, ctx: ExtensionContext, text: string): void {
	try {
		// custom message display:false -> vào LLM context (role user) nhưng ẩn khỏi transcript
		pi.sendMessage(
			{ customType: "critic-instruction", content: text, display: false },
			{ triggerTurn: true },
		);
		st.selfRun = true;
	} catch (err) {
		appendLine(pi, "err", `không gửi được chỉ đạo critic: ${oneLine((err as Error)?.message ?? String(err))}`);
	}
}

async function getGitDiff(pi: ExtensionAPI, ctx: ExtensionContext): Promise<string> {
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

// ============================== Extension ==============================

export default function (pi: ExtensionAPI) {
	// ---- Renderers ----

	pi.registerEntryRenderer(EXT_ID, (entry, _options, theme) => {
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
		if (info?.messageType !== "assistant" || st.superseded.size === 0) return markdown;
		if (!st.superseded.has(keyOf(markdown))) return markdown;
		const words = markdown.split(/\s+/).filter(Boolean).length;
		return `⤷ _đáp án này đã bị critic bắt làm lại — xem bản đầy đủ phía dưới (~${words} từ đã ẩn)_`;
	});

	// Chỉ đạo của critic gửi vào context — ẩn trong transcript.
	pi.registerMessageRenderer("critic-instruction", () => new Text("", 0, 0));

	// ---- Lifecycle ----

	pi.on("session_start", async (_event, _ctx) => {
		st.controller?.abort();
		st = freshState();
	});

	pi.on("session_shutdown", async (_event, _ctx) => {
		st.controller?.abort();
		st = freshState();
	});

	// Ghép với muse-review: khi muse đang chạy pipeline viết bài -> critic im lặng.
	pi.events.on("muse", (data: unknown) => {
		st.museRunning = !!(data as { running?: boolean })?.running;
	});

	// ---- Input: keyword, kill switch, reset theo lượt hỏi của user ----

	pi.on("input", async (event, ctx) => {
		try {
			const text = (event.text ?? "").trim();
			const upper = text.toUpperCase();

			if (upper === OFF_TEXT) {
				st.controller?.abort();
				st.enabled = false;
				setStatus(ctx, undefined);
				notify(ctx, `đã TẮT cho tới khi CRITIC_ON.`, "info");
				return { action: "handled" };
			}
			if (upper === ON_TEXT) {
				st.enabled = true;
				notify(ctx, `đã BẬT (mặc định vốn đã bật).`, "info");
				return { action: "handled" };
			}
			if (upper === STOP_TEXT) {
				// Hủy việc critic đang dở, nhưng KHÔNG consume: muse cần thấy nó để dừng pipeline.
				st.controller?.abort();
				st.turnSeq++;
				setStatus(ctx, undefined);
				return { action: "continue" };
			}

			if (event.source === "interactive") {
				st.turnSeq++; // mọi phán quyết đang chờ trở nên lỗi thời
				st.controller?.abort();
				st.roundsUsed = 0;
				st.verifyUsed = false;
				st.toolLog = [];
				st.lastRealPrompt = text;
			}
			return { action: "continue" };
		} catch {
			return { action: "continue" };
		}
	});

	// ---- Thu bằng chứng ----

	pi.on("before_agent_start", async (event, _ctx) => {
		const p = (event.prompt ?? "").trim();
		st.selfRun = p.startsWith(INJECT_PREFIX);
		if (!st.selfRun && p) st.lastRealPrompt = p;
	});

	pi.on("tool_result", async (event, _ctx) => {
		const txt = extractText((event as { content?: unknown }).content);
		const name = (event as { toolName?: string }).toolName ?? "tool";
		const err = (event as { isError?: boolean }).isError ? "LỖI" : "ok";
		const input = oneLine(JSON.stringify((event as { input?: unknown }).input ?? {})).slice(0, 120);
		st.toolLog.push(`${name}(${input}) => ${err}: ${oneLine(txt)}`);
		if (st.toolLog.length > 8) st.toolLog.shift();
	});

	// ---- Đánh giá sau khi agent thực sự dừng ----

	pi.on("agent_settled", async (_event, ctx) => {
		if (!st.enabled || st.running || st.museRunning) return;
		const capturedSeq = st.turnSeq;
		// defer: để pi kết thúc phần settle trước khi critic chạy
		setTimeout(() => {
			if (!st.running && !st.museRunning && st.enabled && capturedSeq === st.turnSeq) {
				void runReview(pi, ctx).catch(() => {
					st.running = false;
					st.controller = null;
				});
			}
		}, 0);
	});
}

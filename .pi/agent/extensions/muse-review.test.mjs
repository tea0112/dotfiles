// Functional smoke test cho muse-review.ts (MUSE SUITE: pipeline 8 bước + critic, muse-only).
// Mock modelRegistry.complete với gate để điều khiển từng bước deterministic.
import { createJiti } from "/home/theo/.local/share/fnm/node-versions/v24.19.0/installation/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.mjs";

const FILE = "/home/theo/.pi/agent/extensions/muse-review.ts";
const PI = "/home/theo/.local/share/fnm/node-versions/v24.19.0/installation/lib/node_modules/@earendil-works/pi-coding-agent";
const jiti = createJiti(import.meta.url, {
	moduleCache: false,
	fsCache: false,
	alias: {
		"@earendil-works/pi-tui": `${PI}/node_modules/@earendil-works/pi-tui/dist/index.js`,
		"@earendil-works/pi-ai": `${PI}/node_modules/@earendil-works/pi-ai/dist/compat.js`,
		"@earendil-works/pi-coding-agent": `${PI}/dist/index.js`,
	},
});

let pass = 0, fail = 0;
const failures = [];
function check(cond, label) {
	if (cond) { pass++; console.log(`  ✓ ${label}`); }
	else { fail++; failures.push(label); console.log(`  ✗ FAIL: ${label}`); }
}

function msgText(m) {
	const c = m?.content;
	if (typeof c === "string") return c;
	if (Array.isArray(c)) return c.map((b) => b?.text ?? "").join("\n");
	return "";
}

function userEntry(id, text) {
	return { id, type: "message", message: { role: "user", content: [{ type: "text", text }] } };
}
function asstEntry(id, text) {
	return {
		id, type: "message",
		message: { role: "assistant", content: [{ type: "text", text }], stopReason: "stop", usage: { output: 300 } },
	};
}

// Generator văn bản: mỗi lần repeat = 14 từ
const fill = (n) => "Câu văn chi tiết minh họa cho ý chính được triển khai đầy đủ. ".repeat(n).trim();
// PLAN (dàn ý, ≥60 từ); P1≥150 (168); P2≥220 (238); P3≥100 (112); review ≥70% (420); final ≥80% (392)
const PLAN = `[SECTION]\nDÀN Ý CHI TIẾT CHO ĐỀ BÀI:\n- Phần 1: giới thiệu câu nói và nêu vấn đề cần bàn.\n- Phần 2: phân tích ba tầng giá trị kèm dẫn chứng đời thường chắc chắn, không bịa số liệu.\n- Phần 3: chốt vấn đề và bài học hành động cho người trẻ.\n${fill(3)}\n---END OF PLAN---\n[END]`;
const P1 = `[SECTION]\n${fill(12)}\n---END OF PART 1---\n[END]`;
const P2 = `[SECTION]\n${fill(17)}\n---END OF PART 2---\n[END]`;
const P3 = `[SECTION]\n${fill(8)}\n---END OF PART 3---\n[END]`;
const R1 = `[SECTION]\n${fill(30)}\n[END]`;
const R2 = `[SECTION]\n${fill(30)}\n[END]`;
const R3 = `[SECTION]\n${fill(30)}\n[END]`;
const FIN = `[SECTION]\n${fill(28)}\n---FINAL VERSION---\n[END]`;
const FINAL_ESSAY = fill(28);

const LONG_ANSWER =
	"Đáp án chi tiết về câu hỏi: đây là một đoạn trả lời đủ dài để vượt ngưỡng tối thiểu của critic, " +
	"nói về cách hệ thống hoạt động, các bước đã làm, và kết luận cuối cùng cho người dùng đọc.";

async function makeHarness(env = {}) {
	for (const [k, v] of Object.entries(env)) process.env[k] = v;
	const mod = await jiti.import(FILE);
	for (const k of Object.keys(env)) delete process.env[k];

	const handlers = {};
	const sentMessages = [];
	const progress = [];
	const execCalls = [];
	const renderers = {};
	const entryRenderers = {};
	let mdt = null;

	const pi = {
		on: (n, h) => { handlers[n] = h; },
		sendMessage: (m, o) => sentMessages.push({ ...m, opts: o }),
		appendEntry: (_t, d) => progress.push(d),
		registerEntryRenderer: (id, fn) => { entryRenderers[id] = fn; },
		registerMessageRenderer: (id, fn) => { renderers[id] = fn; },
		registerMarkdownTransformer: (fn) => { mdt = fn; },
		exec: async (cmd, args) => {
			execCalls.push([cmd, args.join(" ")]);
			return { stdout: " src/app.ts | 3 ++-\n 1 file changed", stderr: "", code: 0, killed: false };
		},
	};

	const calls = [];
	let gates = [];
	const modelRegistry = {
		complete: async (_model, context, options) => {
			const call = { systemPrompt: context.systemPrompt, messages: context.messages, options };
			calls.push(call);
			return new Promise((resolve) => gates.push({ resolve }));
		},
	};

	const branch = [];
	const ctx = {
		hasUI: false,
		isIdle: () => true,
		model: { provider: "opencode-go", id: "muse-spark-1.2-contributor" },
		sessionManager: { getBranch: () => branch },
		modelRegistry,
		ui: { notify() {}, setStatus() {} },
	};
	mod.default(pi);
	const theme = { fg: (_c, s) => s, bold: (s) => s, muted: (s) => s };

	return {
		handlers, sentMessages, progress, calls, branch, ctx, pi, mdt, execCalls, renderers, entryRenderers, theme,
		resolveNext(text, opts = {}) {
			const g = gates.shift();
			if (!g) throw new Error("no pending complete() gate");
			g.resolve({
				role: "assistant",
				content: [{ type: "text", text }],
				usage: { output: opts.tokens ?? 300 },
				stopReason: opts.stop ?? "stop",
				errorMessage: opts.err,
				api: "openai-completions",
				provider: opts.provider ?? "opencode-go",
				model: opts.model ?? "muse-spark-1.2-contributor",
			});
		},
		async settle() {
			for (let i = 0; i < 40; i++) await new Promise((r) => setTimeout(r, 3));
		},
		async waitFor(fn) {
			const t0 = Date.now();
			while (Date.now() - t0 < 4000) {
				if (fn()) return true;
				await new Promise((r) => setTimeout(r, 5));
			}
			return fn();
		},
	};
}

// Chạy trọn 8 bước pipeline; gate=true thì giải thêm verdict critic cho bài viết.
async function runPipeline(t, { gate = true } = {}) {
	for (const piece of [PLAN, P1, P2, P3, R1, R2, R3, FIN]) {
		t.resolveNext(piece);
		await t.settle();
	}
	if (gate) {
		await t.waitFor(() => t.calls.length === 9);
		t.resolveNext("---LGTM---");
		await t.settle();
	}
}

// ═══════════════════════ MUSE — ENGINE 1 ═══════════════════════

// ============== A. Happy path: dàn ý trước, viết theo dàn ý, cấm bịa ==============
console.log("\n[A][MUSE] 8 bước: Hiểu đề & Dàn ý -> 3 phần -> 3 review -> final + gate");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "Viết bài về biến đổi khí hậu", source: "interactive" }, t.ctx);
	check(r?.action === "handled", "tin nhắn: handled (pipeline thay main agent)");
	await t.settle();
	check(t.calls.length === 1, "call 1 đã mở");
	check(t.calls[0].systemPrompt.includes("bịa đặt số liệu") && t.calls[0].systemPrompt.includes("TRỌNG TÂM TUYỆT ĐỐI"), "system prompt: cấm bịa + trọng tâm tuyệt đối");
	const t1 = msgText(t.calls[0].messages[1]);
	check(t1.includes("BƯỚC 1/8 — HIỂU ĐỀ & DÀN Ý") && t1.includes("CHƯA VIẾT BÀI") && t1.includes("---END OF PLAN---"), "bước 1: lập dàn ý trước, chưa viết bài");
	check(t.sentMessages.some((m) => m.customType === "muse-brief" && m.display === true && m.content.includes("biến đổi khí hậu")), "brief được mirror");

	const r2 = await t.handlers.input({ text: "thêm giọng hài hước", source: "interactive" }, t.ctx);
	check(r2?.action === "handled", "tin giữa chừng: handled (fold)");
	t.resolveNext(PLAN);
	await t.settle();
	check(t.calls.length === 2, "call 2 đã mở");
	const sung = t.calls[1].messages.find((m) => msgText(m).includes("YÊU CẦU BỔ SUNG"));
	check(!!sung && msgText(sung).includes("thêm giọng hài hước"), "tin giữa chừng được fold vào advisor context");
	const t2 = msgText(t.calls[1].messages.at(-1));
	check(t2.includes("BƯỚC 2/8 — PHẦN 1 CỦA BÀI") && t2.includes("DÀN Ý") && t2.includes("KHÔNG thêm ý ngoài dàn ý") && t2.includes("TỐI THIỂU 150 từ"), "bước 2: viết theo dàn ý + ngưỡng từ");
	check(t.calls[1].messages.some((m) => msgText(m).includes("---END OF PLAN---")), "dàn ý nằm trong context các bước sau");

	t.resolveNext(P1); await t.settle();
	check(t.calls.length === 3 && msgText(t.calls[2].messages.at(-1)).includes("BƯỚC 3/8 — PHẦN 2 CỦA BÀI"), "bước 3 (Phần 2)");
	t.resolveNext(P2); await t.settle();
	check(t.calls.length === 4 && msgText(t.calls[3].messages.at(-1)).includes("BƯỚC 4/8 — PHẦN 3 CỦA BÀI"), "bước 4 (Phần 3)");
	t.resolveNext(P3); await t.settle();
	check(t.calls.length === 5 && msgText(t.calls[4].messages.at(-1)).includes("BƯỚC 5/8 — CHÍNH TẢ"), "bước 5 (Review chính tả)");
	t.resolveNext(R1); await t.settle();
	check(t.calls.length === 6 && msgText(t.calls[5].messages.at(-1)).includes("BƯỚC 6/8 — LOGIC & TRỌNG TÂM") && msgText(t.calls[5].messages.at(-1)).includes("CẮT BỎ"), "bước 6: cắt lan man, giữ trọng tâm");
	t.resolveNext(R2); await t.settle();
	const t7 = msgText(t.calls[6].messages.at(-1));
	check(t.calls.length === 7 && t7.includes("BƯỚC 7/8 — DẪN CHỨNG & DIỆT BỊA ĐẶT") && t7.includes("bịa số liệu"), "bước 7: diệt bịa đặt số liệu");
	t.resolveNext(R3); await t.settle();
	check(t.calls.length === 8 && msgText(t.calls[7].messages.at(-1)).includes("BƯỚC 8/8 — TỔNG HỢP") && msgText(t.calls[7].messages.at(-1)).includes("đúng trọng tâm"), "bước 8 (Tổng hợp + FINAL)");

	t.resolveNext(FIN);
	const gateOpen = await t.waitFor(() => t.calls.length === 9);
	check(gateOpen, "sau deliver: critic gate mở call 9");
	const ev = t.calls[8].messages[0].content[0].text;
	check(ev.includes(FINAL_ESSAY) && ev.includes("biến đổi khí hậu"), "evidence có bài viết + đề bài");
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.calls.length === 9, "LGTM -> dừng, không gọi thêm");
	const result = t.sentMessages.find((m) => m.customType === "muse-review-result");
	check(!!result && result.display === true && result.content === FINAL_ESSAY, "kết quả cuối = bài đã làm sạch marker");
	check(t.progress.filter((p) => p.kind === "step").length === 8, "8 progress line cho 8 bước");
	check(t.progress.some((p) => p.kind === "ok" && (p.message ?? "").includes("bài viết đạt")), "critic báo bài đạt");

	const r3 = await t.handlers.input({ text: "Viết tiếp bài về năng lượng tái tạo", source: "interactive" }, t.ctx);
	check(r3?.action === "handled", "tin SAU pipeline: lại vào pipeline MỚI (mọi tin nhắn)");
	await t.settle();
	check(t.calls.length === 10 && msgText(t.calls[9].messages[0]) === "Viết tiếp bài về năng lượng tái tạo", "pipeline chạy lại với đề mới");
	const rs = await t.handlers.input({ text: "STOP_REVIEW", source: "interactive" }, t.ctx);
	check(rs?.action === "handled", "STOP_REVIEW dừng pipeline thứ 2");
	t.resolveNext("x", { stop: "aborted" });
	await t.settle();
	check(t.sentMessages.filter((m) => m.customType === "muse-review-result").length === 1, "pipeline 2 bị hủy -> không thêm kết quả");
}

// ============== B. STOP_REVIEW giữa chừng ==============
console.log("\n[B][MUSE] STOP_REVIEW -> abort; tin sau -> pipeline chạy lại");
{
	const t = await makeHarness({ CRITIC_AUTO: "0" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài XYZ", source: "interactive" }, t.ctx);
	await t.settle();
	const r = await t.handlers.input({ text: "  STOP_REVIEW  ", source: "interactive" }, t.ctx);
	check(r?.action === "handled", "STOP_REVIEW handled");
	t.resolveNext("[SECTION]\nDàn ý dở...\n---END OF PLAN---\n[END]", { stop: "aborted" });
	await t.settle();
	check(t.calls.length === 1, "dừng sau call hiện tại, không gọi tiếp");
	check(!t.sentMessages.some((m) => m.customType === "muse-review-result"), "bản nháp KHÔNG được deliver");
	check(t.progress.some((p) => p.kind === "warning" && (p.message ?? "").includes("STOP_REVIEW")), "progress ghi chú đã dừng");

	const r2 = await t.handlers.input({ text: "chuyện khác đi", source: "interactive" }, t.ctx);
	check(r2?.action === "handled", "tin sau STOP -> pipeline chạy LẠI (mọi tin nhắn)");
	await t.settle();
	check(t.calls.length === 2, "pipeline mới mở call");
	t.resolveNext("y", { stop: "aborted" });
	await t.settle();
	const r3 = await t.handlers.input({ text: "STOP_REVIEW", source: "interactive" }, t.ctx);
	check(r3?.action === "handled", "STOP khi idle: vẫn handled");
}

// ============== C. Chặn lười: retry theo tokens + theo số từ ==============
console.log("\n[C][MUSE] Quá cụt -> quát + bắt viết lại (tokens & từ)");
{
	const t = await makeHarness({ CRITIC_AUTO: "0" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài ABC", source: "interactive" }, t.ctx);
	await t.settle();
	t.resolveNext(PLAN);
	await t.settle();
	check(t.calls.length === 2, "dàn ý đạt -> sang bước viết");
	t.resolveNext("ngắn quá", { tokens: 5 });
	await t.settle();
	check(t.calls.length === 3, "retry mở call mới (quá ít tokens)");
	check(!t.calls[2].messages.some((m) => msgText(m) === "ngắn quá"), "phản hồi lười KHÔNG nằm trong context");
	const scold = msgText(t.calls[2].messages.at(-1));
	check(scold.includes("QUÁ CỤT") && scold.includes("LƯỜI") && scold.includes("~5 tokens"), "task quát: quá cụt + lý do");

	t.resolveNext(`[SECTION]\n${fill(1)}\n---END OF PART 1---\n[END]`, { tokens: 300 });
	await t.settle();
	check(t.calls.length === 4, "đủ tokens nhưng thiếu từ -> retry lần 2");
	check(t.progress.some((p) => p.kind === "retry" && (p.message ?? "").includes("cần ≥ 150 từ")), "progress nêu ngưỡng từ");

	t.resolveNext(P1);
	await t.settle();
	check(t.calls.length === 5 && msgText(t.calls[4].messages.at(-1)).includes("BƯỚC 3/8"), "đủ 168 từ -> chấp nhận, sang bước 3");
}

// ============== D. Bị cắt max output -> bắt viết tiếp ==============
console.log("\n[D][MUSE] stopReason=length -> CONTINUE: viết tiếp từ chỗ dừng");
{
	const t = await makeHarness({ CRITIC_AUTO: "0" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài DEF", source: "interactive" }, t.ctx);
	await t.settle();
	t.resolveNext("[SECTION]\nDàn ý đang lập dở giữa chừng", { stop: "length", tokens: 60 });
	await t.settle();
	check(t.calls.length === 2, "bị cắt -> mở call viết tiếp");
	const last = msgText(t.calls[1].messages.at(-1));
	check(last.includes("VIẾT TIẾP NGAY") && last.includes("GIỚI HẠN OUTPUT"), "task CONTINUE đúng");
	check(t.calls[1].messages.some((m) => msgText(m).includes("lập dở giữa chừng")), "phần dở vẫn nằm trong context");
	check(t.progress.some((p) => p.kind === "continue"), "progress dòng ✂️ viết tiếp");

	t.resolveNext(PLAN);
	await t.settle();
	check(t.calls.length === 3 && msgText(t.calls[2].messages.at(-1)).includes("BƯỚC 2/8"), "ghép xong đủ 60+ từ -> sang bước 2");
}

// ============== E. Hết lượt viết tiếp -> cảnh báo, chấp nhận phần dài nhất ==============
console.log("\n[E][MUSE] MAX_CONTINUATIONS=1 -> vẫn cắt sau 1 lần -> chấp nhận");
{
	const t = await makeHarness({ CRITIC_AUTO: "0", MUSE_MAX_CONTINUATIONS: "1" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài GHJ", source: "interactive" }, t.ctx);
	await t.settle();
	t.resolveNext(fill(10), { stop: "length", tokens: 60 });
	await t.settle();
	t.resolveNext(fill(10), { stop: "length", tokens: 60 });
	await t.settle();
	check(t.calls.length === 3, "1 lần viết tiếp rồi dừng (cap=1)");
	check(t.progress.some((p) => p.kind === "warning" && (p.message ?? "").includes("vẫn bị cắt sau 1 lần")), "progress cảnh báo vẫn cắt");
	check(msgText(t.calls[2].messages.at(-1)).includes("BƯỚC 2/8"), "280 từ -> vẫn đủ ngưỡng, sang bước 2");
}

// ============== F. maxSteps guard ==============
console.log("\n[F][MUSE] MUSE_MAX_STEPS=2 -> trả phần đã viết gần hoàn chỉnh nhất");
{
	const t = await makeHarness({ CRITIC_AUTO: "0", MUSE_MAX_STEPS: "2" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài GHI", source: "interactive" }, t.ctx);
	await t.settle();
	t.resolveNext(PLAN); await t.settle();
	t.resolveNext(P1); await t.settle();
	check(t.calls.length === 2, "dừng ở 2 call");
	const result = t.sentMessages.find((m) => m.customType === "muse-review-result");
	check(!!result && result.content.includes(fill(12)), "trả phần 1 đã viết");
	check(!result.content.includes("DÀN Ý CHI TIẾT"), "dàn ý KHÔNG bị ghép vào bài");
	check(t.progress.some((p) => p.kind === "finished" && (p.message ?? "").includes("giới hạn")), "progress ghi rõ lý do");
}

// ============== G. Lỗi API ==============
console.log("\n[G][MUSE] Lỗi model -> dừng; có draft thì trả draft");
{
	const t = await makeHarness({ CRITIC_AUTO: "0" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài MNO", source: "interactive" }, t.ctx);
	await t.settle();
	t.resolveNext("x", { stop: "error", err: "connection reset" });
	await t.settle();
	check(!t.sentMessages.some((m) => m.customType === "muse-review-result"), "chưa có gì -> không deliver");
	check(t.progress.some((p) => p.kind === "error"), "progress báo lỗi");
	check(t.calls.length === 1, "không retry vô hạn");

	const t2 = await makeHarness({ CRITIC_AUTO: "0" });
	await t2.handlers.session_start({}, t2.ctx);
	await t2.handlers.input({ text: "Đề tài PQR", source: "interactive" }, t2.ctx);
	await t2.settle();
	t2.resolveNext(PLAN);
	await t2.settle();
	t2.resolveNext(P1);
	await t2.settle();
	t2.resolveNext("y", { stop: "error", err: "rate limit" });
	await t2.settle();
	const result2 = t2.sentMessages.find((m) => m.customType === "muse-review-result");
	check(!!result2 && result2.content.includes(fill(12)), "có draft -> trả bản gần nhất kèm cảnh báo");
}

// ============== H. Model gating: chỉ muse mới được apply ==============
console.log("\n[H][MUSE] Model ngoài MUSE_MODELS -> im lặng 100%");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax-M3" };
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "Đề tài gì đó", source: "interactive" }, t.ctx);
	check(r?.action === "continue", "model khác -> tin nhắn đi qua main agent");
	await t.settle();
	check(t.calls.length === 0, "không có call nào (pipeline lẫn critic)");
	const rs = await t.handlers.input({ text: "STOP_REVIEW", source: "interactive" }, t.ctx);
	check(rs?.action === "handled", "STOP_REVIEW vẫn handled");

	const t2 = await makeHarness();
	t2.ctx.model = { provider: "opencode-go", id: "muse-spark-1.3-contributor" };
	await t2.handlers.session_start({}, t2.ctx);
	const r2 = await t2.handlers.input({ text: "Đề tài", source: "interactive" }, t2.ctx);
	check(r2?.action === "continue", "bản 1.3 -> KHÔNG chạy (exact match)");

	const t3 = await makeHarness({ MUSE_MODELS: "opencode-go/muse-spark-1.2-contributor, netgate/muse-spark-x" });
	t3.ctx.model = { provider: "netgate", id: "muse-spark-x" };
	await t3.handlers.session_start({}, t3.ctx);
	const r3 = await t3.handlers.input({ text: "Đề tài qua netgate", source: "interactive" }, t3.ctx);
	check(r3?.action === "handled", "entry trong danh sách -> chạy");
	await t3.settle();
	check(t3.calls.length === 1, "advisor start được");
	t3.resolveNext("z", { stop: "aborted" });
	await t3.settle();
}

// ============== I. Resume phiên có lịch sử -> VẪN chạy (mọi tin nhắn) ==============
console.log("\n[I][MUSE] Resume phiên có lịch sử -> vẫn vào pipeline");
{
	const t = await makeHarness({ CRITIC_AUTO: "0" });
	t.branch.push(userEntry("u-old", "câu hỏi cũ"));
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "tin nhắn mới", source: "interactive" }, t.ctx);
	check(r?.action === "handled", "phiên có lịch sử -> vẫn hijack (mọi tin nhắn)");
	await t.settle();
	check(t.calls.length === 1, "pipeline start được");
	t.resolveNext("w", { stop: "aborted" });
	await t.settle();
}

// ============== J. Shape session + gate bài viết ==============
console.log("\n[J][MUSE] Main session chỉ có brief + kết quả; gate chạy trên bài");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài STU", source: "interactive" }, t.ctx);
	await runPipeline(t, { gate: true });
	const briefs = t.sentMessages.filter((m) => m.customType === "muse-brief");
	const results = t.sentMessages.filter((m) => m.customType === "muse-review-result");
	check(briefs.length === 1 && results.length === 1, "main session chỉ có: 1 brief + 1 kết quả");
	check(results[0].content === FINAL_ESSAY, "nội dung final đúng");
	check(t.calls.length === 9, "8 bước + 1 critic gate");
}

// ============== K. Gate bài viết: ISSUES -> chỉnh sửa trong kênh ẩn ==============
console.log("\n[K][MUSE+CRITIC] Bài bị critic bắt sửa -> chỉnh sửa ẩn -> bản mới");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài VWX", source: "interactive" }, t.ctx);
	await runPipeline(t, { gate: false });
	await t.waitFor(() => t.calls.length === 9);
	t.resolveNext("---ISSUES---\n- [BLOCKING] mở bài lạc đề → viết lại mở bài bám sát đề tài");
	await t.settle();
	check(t.calls.length === 10, "ISSUES -> mở call chỉnh sửa (kênh ẩn)");
	const rev = t.calls[9];
	check(rev.systemPrompt.includes("MUSE REVIEW — CHẾ ĐỘ ADVISOR"), "bước chỉnh sửa dùng ADVISOR system");
	const task = msgText(rev.messages[0]);
	check(task.includes("CHỈNH SỬA THEO NGƯỜI PHẢN BIỆN") && task.includes("mở bài lạc đề") && task.includes(FINAL_ESSAY), "task chứa nhận xét + bài hiện tại");
	check(task.includes("Kết thúc bài bằng đúng dòng: ---FINAL VERSION---"), "yêu cầu xuất lại toàn bộ + marker");
	t.resolveNext(`[SECTION]\nBÀI ĐÃ SỬA V2 với nội dung đầy đủ hơn\n---FINAL VERSION---\n[END]`);
	await t.settle();
	check(t.sentMessages.filter((m) => m.customType === "muse-review-result").length === 2, "bản mới được deliver");
	check(t.progress.some((p) => p.kind === "revise"), "progress dòng 🛠 revise");
	const collapsed = t.renderers["muse-review-result"]({ content: FINAL_ESSAY }, {}, t.theme).text;
	check(collapsed.includes("đã được critic chỉnh sửa"), "bản CŨ collapse trong transcript");
	const fresh = t.renderers["muse-review-result"]({ content: "BÀI ĐÃ SỬA V2 với nội dung đầy đủ hơn" }, {}, t.theme).text;
	check(fresh.includes("✨ Muse Review"), "bản MỚI hiển thị bình thường");

	await t.waitFor(() => t.calls.length === 11);
	const ev2 = t.calls[10].messages[0].content[0].text;
	check(ev2.includes("BÀI ĐÃ SỬA V2"), "review lại bản mới");
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.calls.length === 11, "bản mới đạt -> dừng");
}

// ============== L. Trần vòng sửa bài ==============
console.log("\n[L][MUSE+CRITIC] CRITIC_MAX_ROUNDS=1 -> hết vòng thì giữ bản hiện tại");
{
	const t = await makeHarness({ CRITIC_MAX_ROUNDS: "1" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài YZ1", source: "interactive" }, t.ctx);
	await runPipeline(t, { gate: false });
	await t.waitFor(() => t.calls.length === 9);
	t.resolveNext("---ISSUES---\n- lỗi A → sửa A");
	await t.settle();
	t.resolveNext(`[SECTION]\nBản sửa vòng 1\n---FINAL VERSION---\n[END]`);
	await t.settle();
	await t.waitFor(() => t.calls.length === 11);
	t.resolveNext("---ISSUES---\n- vẫn còn lỗi B → sửa B");
	await t.settle();
	check(t.calls.length === 11, "hết vòng -> không gọi chỉnh sửa thêm");
	check(t.progress.some((p) => p.kind === "warn" && (p.message ?? "").includes("hết 1 vòng sửa")), "progress ghi rõ hết vòng");
}

// ============== M. NEED-VERIFY trên bài viết -> bỏ qua ==============
console.log("\n[M][MUSE+CRITIC] NEED-VERIFY cho bài viết -> không áp dụng");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài 234", source: "interactive" }, t.ctx);
	await runPipeline(t, { gate: false });
	await t.waitFor(() => t.calls.length === 9);
	t.resolveNext("---NEED-VERIFY---\nnpm test");
	await t.settle();
	check(t.calls.length === 9 && t.sentMessages.filter((m) => m.customType === "critic-instruction").length === 0, "bài viết không đòi chạy lệnh");
	check(t.progress.some((p) => p.kind === "info" && (p.message ?? "").includes("không áp dụng cho bài viết")), "progress ghi rõ bỏ qua");
}

// ============== N. STOP trong lúc critic soi bài ==============
console.log("\n[N][MUSE+CRITIC] STOP_REVIEW trong gate -> hủy chỉnh sửa");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài 567", source: "interactive" }, t.ctx);
	await runPipeline(t, { gate: false });
	await t.waitFor(() => t.calls.length === 9);
	const rs = await t.handlers.input({ text: "STOP_REVIEW", source: "interactive" }, t.ctx);
	check(rs?.action === "handled", "STOP trong gate handled");
	t.resolveNext("---ISSUES---\n- lỗi gì đó");
	await t.settle();
	check(t.calls.length === 9, "gate bị hủy -> không chỉnh sửa");
	check(t.sentMessages.filter((m) => m.customType === "muse-review-result").length === 1, "không deliver thêm");
}

// ═══════════════════════ CRITIC — ENGINE 2 (muse model) ═══════════════════════

// ============== O. CRITIC_OFF: pipeline vẫn chạy, gate im lặng ==============
console.log("\n[O][CRITIC] CRITIC_OFF -> không gate bài viết");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "CRITIC_OFF", source: "interactive" }, t.ctx);
	check(r?.action === "handled", "CRITIC_OFF bị chặn, không vào model");
	await t.handlers.input({ text: "Đề tài 890", source: "interactive" }, t.ctx);
	await runPipeline(t, { gate: false });
	check(t.calls.length === 8, "pipeline đủ 8 call, KHÔNG có critic gate");
	check(t.sentMessages.some((m) => m.customType === "muse-review-result"), "kết quả vẫn deliver");
}

// ============== P. MUSE_AUTO_START=0: chat thường + critic soi answer ==============
console.log("\n[P][CRITIC] MUSE_AUTO_START=0 -> main agent trả lời, critic soi (muse model)");
{
	const t = await makeHarness({ MUSE_AUTO_START: "0" });
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "Giải thích cách hoạt động của X", source: "interactive" }, t.ctx);
	check(r?.action === "continue", "AUTO_START=0 -> tin nhắn đi qua main agent");
	t.branch.push(userEntry("u1", "Giải thích cách hoạt động của X"));
	t.branch.push(asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	const opened = await t.waitFor(() => t.calls.length === 1);
	check(opened, "critic mở 1 call ẩn");
	check(t.calls[0].messages[0].content[0].text.includes("Giải thích cách hoạt động của X"), "evidence có yêu cầu user");
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.progress.some((p) => p.kind === "ok"), "LGTM -> dòng ✓");
}

// ============== Q. Main agent: ISSUES -> inject sửa ==============
console.log("\n[Q][CRITIC] Answer có lỗi -> inject chỉ đạo, collapse bản cũ");
{
	const t = await makeHarness({ MUSE_AUTO_START: "0" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Sửa bug X", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "Sửa bug X"));
	t.branch.push(asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 1);
	t.resolveNext("---ISSUES---\n- [BLOCKING] nhánh else chưa xử lý null → thêm guard");
	await t.settle();
	const inj = t.sentMessages.find((m) => m.customType === "critic-instruction");
	check(!!inj && inj.display === false && inj.opts?.triggerTurn === true, "inject ẩn + trigger turn");
	check(inj?.content.includes("nhánh else chưa xử lý null") && inj.content.includes("XUẤT LẠI TOÀN BỘ"), "nội dung chỉ đạo đúng");
	check(t.mdt(LONG_ANSWER, { messageType: "assistant", isStreaming: false }).includes("bắt làm lại"), "bản cũ bị collapse");

	await t.handlers.before_agent_start({ prompt: "⚙️ [CRITIC REVIEW] ..." }, t.ctx);
	t.branch.push(asstEntry("a2", "Đáp án đã sửa đầy đủ hơn, xử lý null và thêm test cho nhánh else."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 2);
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.sentMessages.length === 1, "bản sửa đạt -> dừng");
	const fresh = t.mdt("Đáp án đã sửa đầy đủ hơn, xử lý null và thêm test cho nhánh else.", { messageType: "assistant", isStreaming: false });
	check(!fresh.includes("bắt làm lại"), "bản MỚI không bị collapse");
}

// ============== R. NEED-VERIFY: CHỈ đòi lệnh rẻ, nhanh ==============
console.log("\n[R][CRITIC] NEED-VERIFY: chỉ lệnh nhanh, cấm start server");
{
	const t = await makeHarness({ MUSE_AUTO_START: "0" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Refactor module Y", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "Refactor module Y"));
	t.branch.push(asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 1);
	const sys = t.calls[0].systemPrompt;
	check(sys.includes("TUYỆT ĐỐI KHÔNG đòi") && sys.includes("start/dev server"), "prompt cấm đòi start server/watch/build/e2e");
	check(sys.includes("ĐỪNG NEED-VERIFY") && sys.includes("bằng chứng tĩnh"), "việc đắt -> tự kết luận từ bằng chứng tĩnh");
	check(sys.includes("bịa đặt"), "critic coi số liệu bịa = lỗi chặn");
	t.resolveNext("---NEED-VERIFY---\nnpm test -- --run src/app.test.ts\nnpx tsc --noEmit");
	await t.settle();
	const inj = t.sentMessages.find((m) => m.customType === "critic-instruction");
	check(!!inj && inj.content.includes("kiểm tra NHANH") && inj.content.includes("npm test"), "inject yêu cầu chạy lệnh NHANH");
	check(!t.execCalls.some(([c]) => c !== "git"), "extension KHÔNG tự chạy lệnh ngoài git diff");

	await t.handlers.before_agent_start({ prompt: "⚙️ [CRITIC REVIEW] ..." }, t.ctx);
	t.branch.push(asstEntry("a2", "Kết quả: 5 passed, 0 failed. tsc: 0 errors."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 2);
	check(t.calls[1].messages[0].content[0].text.includes("5 passed"), "báo cáo test nằm trong bằng chứng vòng 2");
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.mdt("Kết quả: 5 passed, 0 failed. tsc: 0 errors.", { messageType: "assistant", isStreaming: false }).includes("⤷"), "báo cáo verify bị collapse (đáp án gốc vẫn hiển thị)");

	const t2 = await makeHarness({ MUSE_AUTO_START: "0" });
	await t2.handlers.session_start({}, t2.ctx);
	await t2.handlers.input({ text: "Refactor Z", source: "interactive" }, t2.ctx);
	t2.branch.push(userEntry("u1", "Refactor Z"), asstEntry("a1", LONG_ANSWER));
	await t2.handlers.agent_settled({}, t2.ctx);
	await t2.waitFor(() => t2.calls.length === 1);
	t2.resolveNext("---NEED-VERIFY---\nnpm test");
	await t2.settle();
	await t2.handlers.before_agent_start({ prompt: "⚙️ [CRITIC REVIEW] ..." }, t2.ctx);
	t2.branch.push(asstEntry("a2", "Đã chạy: 2 passed."));
	await t2.handlers.agent_settled({}, t2.ctx);
	await t2.waitFor(() => t2.calls.length === 2);
	t2.resolveNext("---NEED-VERIFY---\nnpm run e2e");
	await t2.settle();
	check(t2.calls.length === 2 && t2.sentMessages.length === 1, "NEED-VERIFY lần 2 -> không đòi thêm (chống loop)");
}

// ============== S. Trần vòng main-agent ==============
console.log("\n[S][CRITIC] CRITIC_MAX_ROUNDS=1 -> hết vòng thì dừng");
{
	const t = await makeHarness({ MUSE_AUTO_START: "0", CRITIC_MAX_ROUNDS: "1" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Viết hàm sort", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "Viết hàm sort"));
	t.branch.push(asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 1);
	t.resolveNext("---ISSUES---\n- thiếu edge case mảng rỗng → thêm guard");
	await t.settle();
	check(t.sentMessages.length === 1, "vòng 1: có inject");
	await t.handlers.before_agent_start({ prompt: "⚙️ [CRITIC REVIEW] ..." }, t.ctx);
	t.branch.push(asstEntry("a2", "Bản sửa vòng 1 nhưng critic vẫn thấy lỗi khác."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 2);
	t.resolveNext("---ISSUES---\n- vẫn còn lỗi khác → sửa tiếp");
	await t.settle();
	check(t.calls.length === 2 && t.sentMessages.length === 1, "hết vòng -> không inject lần 3");
	check(t.progress.some((p) => p.kind === "warn" && (p.message ?? "").includes("hết")), "progress ghi rõ hết vòng");
}

// ============== T. User nhắn mới -> hủy phán quyết chờ ==============
console.log("\n[T][CRITIC] User nói tiếp khi critic đang soi -> bỏ phán quyết cũ");
{
	const t = await makeHarness({ MUSE_AUTO_START: "0" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "câu hỏi 1", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "câu hỏi 1"), asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 1);
	await t.handlers.input({ text: "thôi bỏ đi, làm việc khác", source: "interactive" }, t.ctx);
	t.resolveNext("---ISSUES---\n- lỗi gì đó");
	await t.settle();
	check(t.sentMessages.length === 0, "phán quyết cũ bị bỏ, không inject vào chuyện mới");
}

// ============== U. Bỏ qua đáp án cụt không tool ==============
console.log("\n[U][CRITIC] Đáp án cực ngắn, không tool -> bỏ qua");
{
	const t = await makeHarness({ MUSE_AUTO_START: "0" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "xong chưa?", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "xong chưa?"), asstEntry("a1", "Xong."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.settle();
	check(t.calls.length === 0, "câu 'Xong.' không đáng 1 call critic");
}

// ============== V. Model khác: critic KHÔNG chạy ==============
console.log("\n[V][CRITIC] Model ngoài MUSE_MODELS -> critic im lặng");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax-M3" };
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "câu hỏi trên model khác", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "câu hỏi"), asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.settle();
	check(t.calls.length === 0, "critic không chạy cho model ngoài danh sách");
}

// ============================== Kết luận ==============================
console.log(`\n========== KẾT QUẢ: ${pass} pass, ${fail} fail ==========`);
if (fail > 0) {
	console.log("Failed:");
	for (const f of failures) console.log(` - ${f}`);
	process.exit(1);
}

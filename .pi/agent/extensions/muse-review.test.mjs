// Functional smoke test cho muse-review.ts (MUSE SUITE = advisor pipeline + general critic).
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

async function makeHarness(env = {}) {
	for (const [k, v] of Object.entries(env)) process.env[k] = v;
	const mod = await jiti.import(FILE);
	for (const k of Object.keys(env)) delete process.env[k];

	const handlers = {};
	const sentMessages = []; // sendMessage
	const progress = []; // appendEntry (muse + critic)
	const execCalls = [];
	let mdt = null;

	const pi = {
		on: (n, h) => { handlers[n] = h; },
		sendMessage: (m, o) => sentMessages.push({ ...m, opts: o }),
		appendEntry: (_t, d) => progress.push(d),
		registerEntryRenderer: () => {},
		registerMessageRenderer: () => {},
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

	return {
		handlers, sentMessages, progress, calls, branch, ctx, pi, mdt, execCalls,
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

const LONG_ANSWER =
	"Đáp án chi tiết về câu hỏi: đây là một đoạn trả lời đủ dài để vượt ngưỡng tối thiểu của critic, " +
	"nói về cách hệ thống hoạt động, các bước đã làm, và kết luận cuối cùng cho người dùng đọc.";

// ═══════════════════════ MUSE — ENGINE 1 ═══════════════════════

// ============================== A. Happy path ==============================
console.log("\n[A][MUSE] Happy path: 7 call, fold tin nhắn giữa chừng, trả kết quả cuối");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "Viết bài về biến đổi khí hậu", source: "interactive" }, t.ctx);
	check(r?.action === "handled", "tin đầu: handled (main agent không trả lời đề tài)");
	await t.settle();
	check(t.calls.length === 1, "call 1 đã mở (gate)");
	check(t.calls[0].systemPrompt.includes("QUY TẮC BẮT BUỘC") && t.calls[0].systemPrompt.includes("As an AI"), "system prompt: luật + negative prompting");
	check(msgText(t.calls[0].messages[0]) === "Viết bài về biến đổi khí hậu", "brief = tin nhắn đầu");
	check(msgText(t.calls[0].messages[1]).includes("BƯỚC 1/7 — MỞ BÀI") && msgText(t.calls[0].messages[1]).includes("---END OF PART 1---"), "task bước 1 đúng");
	check(t.sentMessages.some((m) => m.customType === "muse-brief" && m.display === true && m.content.includes("biến đổi khí hậu")), "brief được mirror vào main session");

	const r2 = await t.handlers.input({ text: "thêm giọng hài hước", source: "interactive" }, t.ctx);
	check(r2?.action === "handled", "tin giữa chừng: handled");
	t.resolveNext("[SECTION]\nMở bài...\n---END OF PART 1---\n[END]");
	await t.settle();
	check(t.calls.length === 2, "call 2 đã mở");
	const sung = t.calls[1].messages.find((m) => msgText(m).includes("YÊU CẦU BỔ SUNG"));
	check(!!sung && msgText(sung).includes("thêm giọng hài hước"), "tin giữa chừng được fold vào advisor context");
	check(msgText(t.calls[1].messages.at(-1)).includes("BƯỚC 2/7 — THÂN BÀI"), "task bước 2 đúng");

	t.resolveNext("[SECTION]\nThân bài...\n---END OF PART 2---\n[END]");
	await t.settle();
	check(t.calls.length === 3 && msgText(t.calls[2].messages.at(-1)).includes("BƯỚC 3/7 — KẾT LUẬN"), "bước 3 (Kết luận)");
	t.resolveNext("[SECTION]\nKết luận...\n---END OF PART 3---\n[END]");
	await t.settle();
	check(t.calls.length === 4 && msgText(t.calls[3].messages.at(-1)).includes("BƯỚC 4/7 — CHÍNH TẢ"), "bước 4 (Review chính tả)");
	t.resolveNext("[SECTION]\nBản sửa ngữ pháp...\n[END]");
	await t.settle();
	check(t.calls.length === 5 && msgText(t.calls[4].messages.at(-1)).includes("BƯỚC 5/7 — LOGIC"), "bước 5 (Review logic)");
	t.resolveNext("[SECTION]\nBản chặt chẽ...\n[END]");
	await t.settle();
	check(t.calls.length === 6 && msgText(t.calls[5].messages.at(-1)).includes("BƯỚC 6/7 — VÍ DỤ"), "bước 6 (Review ví dụ)");
	t.resolveNext("[SECTION]\nBản có dẫn chứng...\n[END]");
	await t.settle();
	check(t.calls.length === 7 && msgText(t.calls[6].messages.at(-1)).includes("BƯỚC 7/7 — TỔNG HỢP") && msgText(t.calls[6].messages.at(-1)).includes("---FINAL VERSION---"), "bước 7 (Tổng hợp + FINAL)");

	t.resolveNext("[SECTION]\nBÀI HOÀN CHỈNH XINH ĐẸP\n---FINAL VERSION---\n[END]");
	await t.settle();
	check(t.calls.length === 7, "thấy FINAL -> dừng, không gọi thêm");
	const result = t.sentMessages.find((m) => m.customType === "muse-review-result");
	check(!!result && result.display === true, "kết quả cuối được gửi (display:true)");
	check(result?.content === "BÀI HOÀN CHỈNH XINH ĐẸP", "marker được làm sạch khỏi kết quả");
	check(result?.opts === undefined, "kết quả KHÔNG trigger turn thừa");
	check(t.progress.filter((p) => p.kind === "step").length === 7, "7 progress line cho 7 bước");

	const r3 = await t.handlers.input({ text: "sửa đoạn 2 giúp tôi", source: "interactive" }, t.ctx);
	check(r3?.action === "continue", "sau khi xong: tin nhắn đi qua main agent bình thường");
	await t.settle();
	check(t.calls.length === 7, "không có call mới");
}

// ============================== B. STOP_REVIEW giữa chừng ==============================
console.log("\n[B][MUSE] STOP_REVIEW -> abort, bản nháp KHÔNG vào hội thoại");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài XYZ", source: "interactive" }, t.ctx);
	await t.settle();
	const r = await t.handlers.input({ text: "  STOP_REVIEW  ", source: "interactive" }, t.ctx);
	check(r?.action === "handled", "STOP_REVIEW handled");
	t.resolveNext("[SECTION]\nMở bài dở...\n---END OF PART 1---\n[END]", { stop: "aborted" });
	await t.settle();
	check(t.calls.length === 1, "dừng sau call hiện tại, không gọi tiếp");
	check(!t.sentMessages.some((m) => m.customType === "muse-review-result"), "bản nháp KHÔNG được deliver");
	check(t.progress.some((p) => p.kind === "warning" && (p.message ?? "").includes("STOP_REVIEW")), "progress ghi chú đã dừng");
	const r2 = await t.handlers.input({ text: "chuyện khác chăng?", source: "interactive" }, t.ctx);
	check(r2?.action === "continue", "sau STOP: chat bình thường, không start lại");
	const r3 = await t.handlers.input({ text: "STOP_REVIEW", source: "interactive" }, t.ctx);
	check(r3?.action === "handled", "STOP khi idle: vẫn handled");
}

// ============================== C. Phản hồi quá ngắn -> retry ==============================
console.log("\n[C][MUSE] Phản hồi quá ngắn -> retry đúng 1 lần");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài ABC", source: "interactive" }, t.ctx);
	await t.settle();
	t.resolveNext("ngắn quá", { tokens: 5 });
	await t.settle();
	check(t.calls.length === 2, "retry mở call mới");
	check(!t.calls[1].messages.some((m) => msgText(m) === "ngắn quá"), "phản hồi xấu KHÔNG nằm trong context");
	check(msgText(t.calls[1].messages.at(-1)).includes("PHẢN HỒI QUÁ NGẮN"), "task retry được build lại");
	t.resolveNext("[SECTION]\nMở bài đầy đủ...\n---END OF PART 1---\n[END]");
	await t.settle();
	check(t.calls.length === 3 && msgText(t.calls[2].messages.at(-1)).includes("BƯỚC 2/7"), "retry xong -> bước 2");
	t.resolveNext("vẫn ngắn", { tokens: 3 });
	await t.settle();
	check(t.calls.length === 4 && msgText(t.calls[3].messages.at(-1)).includes("PHẢN HỒI QUÁ NGẮN"), "bước mới -> có lại 1 lượt retry");
	t.resolveNext("vẫn ngắn nữa", { tokens: 3 });
	await t.settle();
	check(t.calls.length === 5 && msgText(t.calls[4].messages.at(-1)).includes("BƯỚC 3/7 — KẾT LUẬN"), "hết retry -> chấp nhận, đi tiếp");
}

// ============================== D. maxSteps guard ==============================
console.log("\n[D][MUSE] MUSE_MAX_STEPS=2 -> trả bản gần hoàn chỉnh nhất");
{
	const t = await makeHarness({ MUSE_MAX_STEPS: "2" });
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài GHI", source: "interactive" }, t.ctx);
	await t.settle();
	t.resolveNext("[SECTION]\nPhần 1...\n---END OF PART 1---\n[END]");
	await t.settle();
	t.resolveNext("[SECTION]\nPhần 2...\n---END OF PART 2---\n[END]");
	await t.settle();
	check(t.calls.length === 2, "dừng ở 2 call");
	const result = t.sentMessages.find((m) => m.customType === "muse-review-result");
	check(!!result && result.content.includes("Phần 2"), "trả về bản gần hoàn chỉnh nhất");
	check(t.progress.some((p) => p.kind === "finished" && (p.message ?? "").includes("giới hạn")), "progress ghi rõ lý do");
}

// ============================== E. Lỗi API / timeout ==============================
console.log("\n[E][MUSE] Lỗi model -> dừng, có draft thì trả draft");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài MNO", source: "interactive" }, t.ctx);
	await t.settle();
	t.resolveNext("x", { stop: "error", err: "connection reset" });
	await t.settle();
	check(!t.sentMessages.some((m) => m.customType === "muse-review-result"), "chưa có gì -> không deliver");
	check(t.progress.some((p) => p.kind === "error"), "progress báo lỗi");
	check(t.calls.length === 1, "không retry vô hạn");

	const t2 = await makeHarness();
	await t2.handlers.session_start({}, t2.ctx);
	await t2.handlers.input({ text: "Đề tài PQR", source: "interactive" }, t2.ctx);
	await t2.settle();
	t2.resolveNext("[SECTION]\nPhần 1 ok\n---END OF PART 1---\n[END]");
	await t2.settle();
	t2.resolveNext("y", { stop: "error", err: "rate limit" });
	await t2.settle();
	const result2 = t2.sentMessages.find((m) => m.customType === "muse-review-result");
	check(!!result2 && result2.content.includes("Phần 1 ok"), "có draft -> trả bản nháp gần nhất kèm cảnh báo");
}

// ============================== F. Model gating ==============================
console.log("\n[F][MUSE] Model khác -> không hijack; exact match; list qua env");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax-M3" };
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "Đề tài gì đó", source: "interactive" }, t.ctx);
	check(r?.action === "continue", "model khác -> tin nhắn đi qua main agent");
	await t.settle();
	check(t.calls.length === 0, "không có call nào");
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
}

// ============================== G. Resume phiên có lịch sử ==============================
console.log("\n[G][MUSE] Resume phiên có lịch sử -> không hijack");
{
	const t = await makeHarness();
	t.branch.push(userEntry("u-old", "câu hỏi cũ"));
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "tin nhắn mới", source: "interactive" }, t.ctx);
	check(r?.action === "continue", "phiên có lịch sử -> không start");
}

// ============================== H. Shape session: brief + result ==============================
console.log("\n[H][MUSE] Main session chỉ có brief + kết quả cuối");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài STU", source: "interactive" }, t.ctx);
	await t.settle();
	for (const part of ["P1\n---END OF PART 1---", "P2\n---END OF PART 2---", "P3\n---END OF PART 3---", "R1", "R2", "R3"]) {
		t.resolveNext(`[SECTION]\n${part}\n[END]`);
		await t.settle();
	}
	t.resolveNext("[SECTION]\nBÀI FINAL ĐẸP\n---FINAL VERSION---\n[END]");
	await t.settle();
	const briefs = t.sentMessages.filter((m) => m.customType === "muse-brief");
	const results = t.sentMessages.filter((m) => m.customType === "muse-review-result");
	check(briefs.length === 1 && results.length === 1, "main session chỉ có: 1 brief + 1 kết quả (không có draft/prompt)");
	check(results[0].content === "BÀI FINAL ĐẸP", "nội dung final đúng");
}

// ═══════════════════════ CRITIC — ENGINE 2 ═══════════════════════

// ============================== I. LGTM ==============================
console.log("\n[I][CRITIC] Đáp án ổn -> LGTM, không can thiệp");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax/MiniMax-M3" }; // model BẤT KỲ
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Giải thích cách hoạt động của X", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "Giải thích cách hoạt động của X"));
	t.branch.push(asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	const opened = await t.waitFor(() => t.calls.length === 1);
	check(opened, "critic mở 1 call ẩn");
	check(t.calls[0].systemPrompt.includes("MỌI LOẠI VIỆC"), "system prompt general (mọi loại việc)");
	check(t.calls[0].messages[0].content[0].text.includes("Giải thích cách hoạt động của X"), "evidence có yêu cầu user");
	check(t.calls[0].messages[0].content[0].text.includes("=== GIT DIFF ==="), "evidence có mục git diff");
	check(t.execCalls.some(([c, a]) => c === "git" && a.includes("diff")), "extension tự đọc git diff (chỉ đọc)");
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.sentMessages.length === 0, "LGTM -> không inject gì cả");
	check(t.progress.some((p) => p.kind === "ok"), "progress dòng ✓");
	check(t.mdt(LONG_ANSWER, { messageType: "assistant", isStreaming: false }) === LONG_ANSWER, "đáp án KHÔNG bị collapse");
}

// ============================== J. ISSUES -> gạt đáp án cũ, bắt làm lại ==============================
console.log("\n[J][CRITIC] Có lỗi -> inject chỉ đạo sửa, collapse bản cũ");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax/MiniMax-M3" };
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Sửa bug X", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "Sửa bug X"));
	t.branch.push(asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 1);
	t.resolveNext("---ISSUES---\n- [BLOCKING] nhánh else chưa xử lý null → thêm guard");
	await t.settle();
	const inj = t.sentMessages.find((m) => m.customType === "critic-instruction");
	check(!!inj && inj.display === false, "chỉ đạo sửa gửi ẩn (display:false)");
	check(inj?.opts?.triggerTurn === true, "inject trigger turn mới");
	check(inj?.content.includes("nhánh else chưa xử lý null") && inj.content.includes("XUẤT LẠI TOÀN BỘ"), "nội dung chỉ đạo đúng");
	check(t.mdt(LONG_ANSWER, { messageType: "assistant", isStreaming: false }).includes("bắt làm lại"), "bản cũ bị collapse còn 1 dòng");
	check(t.progress.some((p) => p.kind === "warn"), "progress cảnh báo");

	await t.handlers.before_agent_start({ prompt: "⚙️ [CRITIC REVIEW] ..." }, t.ctx);
	t.branch.push(asstEntry("a2", "Đáp án đã sửa đầy đủ hơn, xử lý null và thêm test cho nhánh else."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 2);
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.sentMessages.length === 1, "bản sửa đạt -> dừng, không inject thêm");
	check(t.mdt("Đáp án đã sửa đầy đủ hơn, xử lý null và thêm test cho nhánh else.", { messageType: "assistant", isStreaming: false }) !== "collapsed" && !t.mdt("Đáp án đã sửa đầy đủ hơn, xử lý null và thêm test cho nhánh else.", { messageType: "assistant", isStreaming: false }).includes("bắt làm lại"), "bản MỚI không bị collapse");
}

// ============================== K. NEED-VERIFY: đòi bằng chứng test ==============================
console.log("\n[K][CRITIC] Thiếu bằng chứng -> bắt chạy lệnh, không tự chạy thay");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax/MiniMax-M3" };
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Refactor module Y", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "Refactor module Y"));
	t.branch.push(asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 1);
	t.resolveNext("---NEED-VERIFY---\nnpm test\nnpx tsc --noEmit");
	await t.settle();
	const inj = t.sentMessages.find((m) => m.customType === "critic-instruction");
	check(!!inj && inj.content.includes("npm test") && inj.content.includes("KHÔNG sửa code"), "inject lệnh verify cho main agent");
	check(!t.execCalls.some(([c]) => c !== "git"), "extension KHÔNG tự chạy lệnh ngoài git diff");

	await t.handlers.before_agent_start({ prompt: "⚙️ [CRITIC REVIEW] ..." }, t.ctx);
	t.branch.push(asstEntry("a2", "Kết quả: 5 passed, 0 failed. tsc: 0 errors."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 2);
	check(t.calls[1].messages[0].content[0].text.includes("5 passed"), "báo cáo test nằm trong bằng chứng vòng 2");
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.sentMessages.length === 1, "có bằng chứng, đạt -> dừng");
	check(t.mdt("Kết quả: 5 passed, 0 failed. tsc: 0 errors.", { messageType: "assistant", isStreaming: false }).includes("⤷"), "báo cáo verify bị collapse (đáp án gốc vẫn hiển thị)");

	const t2 = await makeHarness();
	t2.ctx.model = { provider: "netgate", id: "MiniMax/MiniMax-M3" };
	await t2.handlers.session_start({}, t2.ctx);
	await t2.handlers.input({ text: "Refactor Z", source: "interactive" }, t2.ctx);
	t2.branch.push(userEntry("u1", "Refactor Z"));
	t2.branch.push(asstEntry("a1", LONG_ANSWER));
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

// ============================== L. Trần số vòng ==============================
console.log("\n[L][CRITIC] CRITIC_MAX_ROUNDS=1 -> hết vòng thì dừng");
{
	const t = await makeHarness({ CRITIC_MAX_ROUNDS: "1" });
	t.ctx.model = { provider: "netgate", id: "MiniMax/MiniMax-M3" };
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

// ============================== M. Tắt / bật bằng keyword ==============================
console.log("\n[M][CRITIC] CRITIC_OFF / CRITIC_ON");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax/MiniMax-M3" };
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "CRITIC_OFF", source: "interactive" }, t.ctx);
	check(r?.action === "handled", "CRITIC_OFF bị chặn, không vào model");
	t.branch.push(userEntry("u1", "câu hỏi"), asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.settle();
	check(t.calls.length === 0, "tắt -> không gọi critic");
	await t.handlers.input({ text: "CRITIC_ON", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u2", "câu hỏi khác"), asstEntry("a2", "Đáp án khác cũng đủ dài để được review bởi critic: trình bày nhiều ý, phân tích ưu nhược điểm từng phương án, kèm ví dụ minh họa cụ thể và kết luận rõ ràng cho người dùng đọc."));
	await t.handlers.agent_settled({}, t.ctx);
	const opened = await t.waitFor(() => t.calls.length === 1);
	check(opened, "bật lại -> critic chạy lại");
	t.resolveNext("---LGTM---");
	await t.settle();
}

// ============================== N. User nhắn tin mới -> hủy phán quyết chờ ==============================
console.log("\n[N][CRITIC] User nói tiếp khi critic đang soi -> bỏ phán quyết cũ");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax/MiniMax-M3" };
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

// ============================== O. Bỏ qua đáp án cụt không tool ==============================
console.log("\n[O][CRITIC] Đáp án cực ngắn, không tool -> bỏ qua cho đỡ tốn");
{
	const t = await makeHarness();
	t.ctx.model = { provider: "netgate", id: "MiniMax/MiniMax-M3" };
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "xong chưa?", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "xong chưa?"), asstEntry("a1", "Xong."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.settle();
	check(t.calls.length === 0, "câu 'Xong.' không đáng 1 call critic");
}

// ============================== P. Tích hợp: 2 engine phối hợp ==============================
console.log("\n[P][TÍCH HỢP] Muse chạy -> critic nhường; muse xong -> critic soi bình thường");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài hội nhập", source: "interactive" }, t.ctx);
	await t.settle();
	check(t.calls.length === 1 && t.calls[0].systemPrompt.includes("MUSE REVIEW — CHẾ ĐỘ ADVISOR"), "advisor bắt đầu (call 1)");

	// main agent "settled" trong lúc advisor chạy -> critic phải NHƯỜNG
	t.branch.push(userEntry("u-x", "nhiễu"), asstEntry("a-x", "nhiễu"));
	await t.handlers.agent_settled({}, t.ctx);
	await t.settle();
	check(t.calls.length === 1, "muse đang chạy -> critic im lặng");

	// chạy nốt pipeline
	t.resolveNext("[SECTION]\nP1\n---END OF PART 1---\n[END]");
	await t.settle();
	t.resolveNext("[SECTION]\nP2\n---END OF PART 2---\n[END]");
	await t.settle();
	t.resolveNext("[SECTION]\nP3\n---END OF PART 3---\n[END]");
	await t.settle();
	t.resolveNext("[SECTION]\nR1\n[END]");
	await t.settle();
	t.resolveNext("[SECTION]\nR2\n[END]");
	await t.settle();
	t.resolveNext("[SECTION]\nR3\n[END]");
	await t.settle();
	t.resolveNext("[SECTION]\nBÀI FINAL\n---FINAL VERSION---\n[END]");
	await t.settle();
	check(t.sentMessages.some((m) => m.customType === "muse-review-result"), "pipeline xong, có kết quả cuối");

	// giờ chat thường (model vẫn muse) -> critic hoạt động
	await t.handlers.input({ text: "giải thích thêm về đoạn 2", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u2", "giải thích thêm về đoạn 2"), asstEntry("a2", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 8);
	check(t.calls[7].systemPrompt.includes("CRITIC"), "muse xong -> critic soi lượt chat thường");
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.progress.some((p) => p.kind === "ok"), "critic báo ✓");
}

// ============================== Kết luận ==============================
console.log(`\n========== KẾT QUẢ: ${pass} pass, ${fail} fail ==========`);
if (fail > 0) {
	console.log("Failed:");
	for (const f of failures) console.log(` - ${f}`);
	process.exit(1);
}

// Functional smoke test cho muse-review.ts (ADVISOR MODE) — mock modelRegistry.complete với gate.
import { createJiti } from "/home/theo/.local/share/fnm/node-versions/v24.19.0/installation/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.mjs";

const FILE = "/home/theo/.pi/agent/extensions/muse-review.ts";
// Replicate alias của pi runtime (loader.ts: getAliases()) để jiti resolve được runtime imports.
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

function userEntry(id, text) {
	return { id, type: "message", message: { role: "user", content: [{ type: "text", text }] } };
}

function msgText(m) {
	const c = m?.content;
	if (typeof c === "string") return c;
	if (Array.isArray(c)) return c.map((b) => b?.text ?? "").join("\n");
	return "";
}

async function makeHarness(env = {}) {
	for (const [k, v] of Object.entries(env)) process.env[k] = v;
	const mod = await jiti.import(FILE);
	for (const k of Object.keys(env)) delete process.env[k];

	const handlers = {};
	const sentMessages = []; // pi.sendMessage
	const progress = []; // appendEntry data
	const pi = {
		on: (n, h) => { handlers[n] = h; },
		sendMessage: (m, o) => sentMessages.push({ ...m, opts: o }),
		appendEntry: (_t, d) => progress.push(d),
		registerMessageRenderer: () => {},
		registerEntryRenderer: () => {},
		registerCommand: () => {},
		registerTool: () => {},
		events: { on: () => () => {}, emit: () => {} },
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
		handlers, sentMessages, progress, calls, branch, ctx, pi,
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
				provider: "opencode-go",
				model: "muse-spark-1.2-contributor",
			});
		},
		async settle() {
			for (let i = 0; i < 30; i++) await new Promise((r) => setTimeout(r, 2));
		},
	};
}

// ============================== A. Happy path ==============================
console.log("\n[A] Happy path: 7 call, fold tin nhắn giữa chừng, trả kết quả cuối");
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

	// user gõ thêm giữa chừng
	const r2 = await t.handlers.input({ text: "thêm giọng hài hước", source: "interactive" }, t.ctx);
	check(r2?.action === "handled", "tin giữa chừng: handled");
	t.resolveNext("[SECTION]\nMở bài...\n---END OF PART 1---\n[END]");
	await t.settle();
	check(t.calls.length === 2, "call 2 đã mở");
	const sung = t.calls[1].messages.find((m) => msgText(m).includes("YÊU CẦU BỔ SUNG"));
	check(!!sung && msgText(sung).includes("thêm giọng hài hước"), "tin giữa chừng được fold vào advisor context");
	check(msgText(t.calls[1].messages.at(-1)).includes("BƯỚC 2/7 — THÂN BÀI"), "task bước 2 đúng");
	check(t.calls[1].messages.some((m) => m.role === "assistant" && msgText(m).includes("Mở bài")), "phần 1 nằm trong advisor context");

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
	check(t.progress.some((p) => p.kind === "finished"), "progress finished entry");
	check(t.progress.filter((p) => p.kind === "step").length === 7, "7 progress line cho 7 bước");
	check(t.calls.every((c) => c.options?.signal instanceof AbortSignal), "mỗi call nhận abort signal (STOP/timeout)");

	// sau khi xong: chat bình thường
	const r3 = await t.handlers.input({ text: "sửa đoạn 2 giúp tôi", source: "interactive" }, t.ctx);
	check(r3?.action === "continue", "sau khi xong: tin nhắn đi qua main agent bình thường");
	await t.settle();
	check(t.calls.length === 7, "không có call mới");
}

// ============================== B. STOP_REVIEW giữa chừng ==============================
console.log("\n[B] STOP_REVIEW -> abort, bản nháp KHÔNG vào hội thoại");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài XYZ", source: "interactive" }, t.ctx);
	await t.settle();
	const r = await t.handlers.input({ text: "STOP_REVIEW", source: "interactive" }, t.ctx);
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

// ============================== C. Phản hồi quá ngắn -> retry, không giữ phản hồi xấu ==============================
console.log("\n[C] Phản hồi quá ngắn -> retry đúng 1 lần");
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
	// hết retry trong một bước -> chấp nhận và đi tiếp
	t.resolveNext("vẫn ngắn", { tokens: 3 });
	await t.settle();
	check(t.calls.length === 4 && msgText(t.calls[3].messages.at(-1)).includes("PHẢN HỒI QUÁ NGẮN"), "bước mới -> có lại 1 lượt retry");
	t.resolveNext("vẫn ngắn nữa", { tokens: 3 });
	await t.settle();
	check(t.calls.length === 5 && msgText(t.calls[4].messages.at(-1)).includes("BƯỚC 3/7 — KẾT LUẬN"), "hết retry -> chấp nhận, đi tiếp");
}

// ============================== D. maxSteps guard ==============================
console.log("\n[D] MUSE_MAX_STEPS=2 -> trả bản gần hoàn chỉnh nhất");
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
console.log("\n[E] Lỗi model -> dừng, có draft thì trả draft");
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
console.log("\n[F] Model khác -> không hijack; exact match; list qua env");
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
console.log("\n[G] Resume phiên có lịch sử -> không hijack");
{
	const t = await makeHarness();
	t.branch.push(userEntry("u-old", "câu hỏi cũ"));
	await t.handlers.session_start({}, t.ctx);
	const r = await t.handlers.input({ text: "tin nhắn mới", source: "interactive" }, t.ctx);
	check(r?.action === "continue", "phiên có lịch sử -> không start");
}

// ============================== H. Kết quả cuối nằm đúng shape cho context tương lai ==============================
console.log("\n[H] Brief + kết quả là custom message trong main session");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "Đề tài STU", source: "interactive" }, t.ctx);
	await t.settle();
	// chạy nhanh 7 bước
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

// ============================== Kết luận ==============================
console.log(`\n========== KẾT QUẢ: ${pass} pass, ${fail} fail ==========`);
if (fail > 0) {
	console.log("Failed:");
	for (const f of failures) console.log(` - ${f}`);
	process.exit(1);
}

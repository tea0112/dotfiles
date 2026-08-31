// Functional smoke test cho critic-review.ts — mock modelRegistry.complete + pi.exec với gate.
import { createJiti } from "/home/theo/.local/share/fnm/node-versions/v24.19.0/installation/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.mjs";

const FILE = "/home/theo/.pi/agent/extensions/critic-review.ts";
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
	const sentMessages = []; // sendMessage (injection)
	const progress = []; // appendEntry
	const execCalls = [];
	let mdt = null;
	const eventListeners = {};

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
		events: {
			on: (ch, h) => { (eventListeners[ch] ??= []).push(h); return () => {}; },
			emit: (ch, d) => { for (const h of eventListeners[ch] ?? []) h(d); },
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
		model: { provider: "netgate", id: "MiniMax/MiniMax-M3" }, // model BẤT KỲ cũng chạy
		sessionManager: { getBranch: () => branch },
		modelRegistry,
		ui: { notify() {}, setStatus() {} },
	};
	mod.default(pi);

	return {
		handlers, sentMessages, progress, calls, branch, ctx, pi, mdt, execCalls, eventListeners,
		resolveNext(text, opts = {}) {
			const g = gates.shift();
			if (!g) throw new Error("no pending complete() gate");
			g.resolve({
				role: "assistant",
				content: [{ type: "text", text }],
				usage: { output: opts.tokens ?? 120 },
				stopReason: opts.stop ?? "stop",
				errorMessage: opts.err,
				api: "openai-completions",
				provider: "netgate",
				model: "MiniMax/MiniMax-M3",
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
		emitMuse(running) {
			for (const h of eventListeners["muse"] ?? []) h({ running });
		},
	};
}

const LONG_ANSWER =
	"Đáp án chi tiết về câu hỏi: đây là một đoạn trả lời đủ dài để vượt ngưỡng tối thiểu của critic, " +
	"nói về cách hệ thống hoạt động, các bước đã làm, và kết luận cuối cùng cho người dùng đọc.";

// ============================== A. LGTM: sạch thì im lặng ==============================
console.log("\n[A] Đáp án ổn -> LGTM, không can thiệp");
{
	const t = await makeHarness();
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

// ============================== B. ISSUES -> gạt đáp án cũ, bắt làm lại ==============================
console.log("\n[B] Có lỗi -> inject chỉ đạo sửa, collapse bản cũ");
{
	const t = await makeHarness();
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

	// main agent trả lời lại (self-run) -> critic soi lại
	await t.handlers.before_agent_start({ prompt: "⚙️ [CRITIC REVIEW] ..." }, t.ctx);
	t.branch.push(asstEntry("a2", "Đáp án đã sửa đầy đủ hơn, xử lý null và thêm test cho nhánh else."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 2);
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.sentMessages.length === 1, "bản sửa đạt -> dừng, không inject thêm");
	check(t.mdt("Đáp án đã sửa đầy đủ hơn, xử lý null và thêm test cho nhánh else.", { messageType: "assistant", isStreaming: false }) !== "collapsed", "bản MỚI không bị collapse");
}

// ============================== C. NEED-VERIFY: đòi bằng chứng test ==============================
console.log("\n[C] Thiếu bằng chứng -> bắt chạy lệnh, không tự chạy thay");
{
	const t = await makeHarness();
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

	// main agent chạy test và báo cáo -> critic soi báo cáo
	await t.handlers.before_agent_start({ prompt: "⚙️ [CRITIC REVIEW] ..." }, t.ctx);
	t.branch.push(asstEntry("a2", "Kết quả: 5 passed, 0 failed. tsc: 0 errors."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 2);
	check(t.calls[1].messages[0].content[0].text.includes("5 passed"), "báo cáo test nằm trong bằng chứng vòng 2");
	t.resolveNext("---LGTM---");
	await t.settle();
	check(t.sentMessages.length === 1, "có bằng chứng, đạt -> dừng");

	// NEED-VERIFY lần 2 -> không đòi nữa (chống loop)
	const t2 = await makeHarness();
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

// ============================== D. Trần số vòng ==============================
console.log("\n[D] CRITIC_MAX_ROUNDS=1 -> hết vòng thì dừng");
{
	const t = await makeHarness({ CRITIC_MAX_ROUNDS: "1" });
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

// ============================== E. Tắt / bật bằng keyword ==============================
console.log("\n[E] CRITIC_OFF / CRITIC_ON");
{
	const t = await makeHarness();
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

// ============================== F. User nhắn tin mới -> hủy nhận định đang chờ ==============================
console.log("\n[F] User nói tiếp khi critic đang soi -> bỏ phán quyết cũ");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "câu hỏi 1", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "câu hỏi 1"), asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 1);
	// user nhắn tiếp TRƯỚC khi critic kịp kết luận
	await t.handlers.input({ text: "thôi bỏ đi, làm việc khác", source: "interactive" }, t.ctx);
	t.resolveNext("---ISSUES---\n- lỗi gì đó");
	await t.settle();
	check(t.sentMessages.length === 0, "phán quyết cũ bị bỏ, không inject vào chuyện mới");
}

// ============================== G. Muse đang chạy -> critic im lặng ==============================
console.log("\n[G] Muse Review đang chạy -> critic nhường");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	t.emitMuse(true);
	t.branch.push(userEntry("u1", "đề tài"), asstEntry("a1", LONG_ANSWER));
	await t.handlers.agent_settled({}, t.ctx);
	await t.settle();
	check(t.calls.length === 0, "muse đang chạy -> không soi");
	t.emitMuse(false);
	await t.handlers.agent_settled({}, t.ctx);
	await t.waitFor(() => t.calls.length === 1);
	check(true, "muse xong -> critic hoạt động trở lại");
	t.resolveNext("---LGTM---");
	await t.settle();
}

// ============================== H. Bỏ qua đáp án cụt không có tool ==============================
console.log("\n[H] Đáp án cực ngắn, không tool -> bỏ qua cho đỡ tốn");
{
	const t = await makeHarness();
	await t.handlers.session_start({}, t.ctx);
	await t.handlers.input({ text: "xong chưa?", source: "interactive" }, t.ctx);
	t.branch.push(userEntry("u1", "xong chưa?"), asstEntry("a1", "Xong."));
	await t.handlers.agent_settled({}, t.ctx);
	await t.settle();
	check(t.calls.length === 0, "câu 'Xong.' không đáng 1 call critic");
}

// ============================== Kết luận ==============================
console.log(`\n========== KẾT QUẢ: ${pass} pass, ${fail} fail ==========`);
if (fail > 0) {
	console.log("Failed:");
	for (const f of failures) console.log(` - ${f}`);
	process.exit(1);
}

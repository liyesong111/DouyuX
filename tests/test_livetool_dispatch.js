const fs = require("fs");
const path = require("path");
const assert = require("assert");
let JSDOM;
try {
    JSDOM = require("jsdom").JSDOM;
} catch (e) {
    console.error("[测试] 缺少依赖 jsdom，请先执行：npm install");
    throw e;
}

/**
 * P0-2 回归：弹幕派发链的「单点异常隔离」。
 *
 * 派发链中多个后台处理器逐项隔离执行：任何单个处理器抛错或异步 reject，
 * 排在后面的其它处理器（如核心的弹幕回执 BarrageSendCheck）必须照常执行。
 *
 * 本测试挂载真实源码（LiveTool / BarrageLoop / BarragePanel）。
 */
const SRC_DIR = process.env.LIVETOOL_SRC_DIR || path.join(__dirname, "..");
function readSrc(rel) {
    const full = path.join(SRC_DIR, rel);
    const text = fs.readFileSync(full, "utf8");
    assert.ok(text.length > 0, "源码读取为空: " + full);
    return text;
}

const LIVETOOL_SRC = readSrc("src/packages/LiveTool/LiveTool.js");
const LOOP_SRC = readSrc("src/packages/BarrageLoop/BarrageLoop.js");
const PANEL_SRC = readSrc("src/packages/BarragePanel/BarragePanel.js");

const COMMON_SRC = readSrc("src/common.js");
const G_START = COMMON_SRC.indexOf("function getStrMiddle(str, before, after) {");
assert.ok(G_START !== -1, "未能从 src/common.js 定位 getStrMiddle");
const G_END = COMMON_SRC.indexOf("\n}", G_START);
assert.ok(G_END !== -1, "未能从 src/common.js 定位 getStrMiddle 结尾");
const GET_STR_MIDDLE_SRC = COMMON_SRC.slice(G_START, G_END + 2);
assert.ok(
    GET_STR_MIDDLE_SRC.indexOf("return m ? m[1] : false;") !== -1,
    "getStrMiddle 抽取结果异常，可能是 common.js 结构变了"
);

function chatmsg(txt, nick, uid) {
    return "type@=chatmsg/rid@=9999/uid@=" + (uid || "88888") + "/nn@=" + (nick || "路人甲") +
        "/txt@=" + txt + "/level@=12/";
}

const STUB_NAMES = [
    "initPkg_LiveTool_LiveNotice_Handle",
    "initPkg_LiveTool_Treasure_Handle",
    "initPkg_LiveTool_BarrageSpeed_Handle",
    "initPkg_LiveTool_RankList_Handle",
    "initPkg_LiveTool_BarrageSendCheck_Handle"
];
const STUBS = STUB_NAMES.map(function (name) {
    return "function " + name + "(ret) { ExTest_calls.push(" + JSON.stringify(name) + "); }";
}).join("\n");

function makeDispatchSandbox() {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://www.douyu.com/9999"
    });
    const win = dom.window;
    const sent = [];
    const calls = [];
    const errors = [];
    const warnings = [];

    const quietConsole = {
        log: function () {},
        warn: function () { warnings.push(Array.prototype.join.call(arguments, " ")); },
        error: function () { errors.push(Array.prototype.join.call(arguments, " ")); }
    };

    const wsCbs = [];
    const factory = new Function(
        "window", "document", "localStorage", "console",
        "setTimeout", "clearTimeout", "getRandom",
        "rid", "my_uid", "sendBarrage", "showMessage", "showMessageWindow",
        "dateFormat", "ExTest_calls", "Ex_WebSocket_UnLogin",
        STUBS + "\n" + GET_STR_MIDDLE_SRC + "\n" + LIVETOOL_SRC + `
        return {
            dispatch: typeof LiveTool_dispatchBarrage === "function" ? LiveTool_dispatchBarrage : null,
            handlers: typeof LiveTool_barrageHandlers === "function" ? LiveTool_barrageHandlers : null,
            overrideTreasure: function (fn) { initPkg_LiveTool_Treasure_Handle = fn; },
            startWs: function () { initPkg_LiveTool_HandleFunc(); }
        };
        `
    );

    const api = factory(
        win, win.document, win.localStorage, quietConsole,
        win.setTimeout, win.clearTimeout, function (min, max) { return max; },
        "9999", "99999999",
        function (text) { sent.push(text); },
        function () {},
        function () {},
        function () { return "2026年10月26日00时00分00秒"; },
        calls,
        function (roomid, cb) { wsCbs.push(cb); }
    );

    return { dom, win, api, sent, calls, errors, warnings, wsCbs };
}

function waitTick() {
    return new Promise(function (resolve) { setTimeout(resolve, 0); });
}

/* ============================ ① 派发链隔离：一个炸了，别人照跑 ============================ */

function testDispatchIsolation() {
    console.log("=== ① 派发链隔离：某处理器抛错，其余后台处理器必须照常执行 ===");
    const { dom, api, calls, errors } = makeDispatchSandbox();

    assert.strictEqual(typeof api.dispatch, "function", "缺少 LiveTool_dispatchBarrage：派发链仍未做逐项隔离");
    assert.strictEqual(typeof api.handlers, "function", "缺少 LiveTool_barrageHandlers：派发表不可枚举");
    const names = api.handlers().map(function (h) { return h[0]; });
    ["开播提醒", "自动抢宝箱", "弹幕时速", "排行榜", "弹幕回执"].forEach(function (n) {
        assert.ok(names.indexOf(n) !== -1, "派发表缺少处理器: " + n + "，实际 " + JSON.stringify(names));
    });

    // 模拟某处理器炸掉
    api.overrideTreasure(function () {
        throw new TypeError("宝箱接口异常测试抛错");
    });

    const failed = api.dispatch(chatmsg("随便一句"));

    assert.deepStrictEqual(failed, ["自动抢宝箱"], "失败的处理器必须被如实记下来: " + JSON.stringify(failed));
    assert.ok(
        calls.indexOf("initPkg_LiveTool_BarrageSendCheck_Handle") !== -1,
        "弹幕回执处理器必须照常执行: " + JSON.stringify(calls)
    );
    assert.ok(
        calls.indexOf("initPkg_LiveTool_LiveNotice_Handle") !== -1,
        "开播提醒处理器必须照常执行: " + JSON.stringify(calls)
    );
    assert.strictEqual(
        calls.length,
        STUB_NAMES.length - 1,
        "其余处理器一个都不能少: 期望 " + (STUB_NAMES.length - 1) + " 个，实际 " + JSON.stringify(calls)
    );
    assert.ok(
        errors.some(function (e) { return e.indexOf("自动抢宝箱") !== -1; }),
        "处理器异常必须留 error 线索（自证信息），实际 " + JSON.stringify(errors)
    );

    console.log("✓ ① 通过: 单个处理器抛错只记日志，其余 " + STUB_NAMES.length + " 个照跑");
    dom.window.close();
}

/* ==================== ② 真实入口：ws 回调本身就是派发链的起点 ==================== */

function testRealWebSocketEntry() {
    console.log("=== ② 真实入口：ws 回调收到弹幕，顺利触发完整派发链 ===");
    const { dom, api, calls, wsCbs } = makeDispatchSandbox();

    api.startWs();
    assert.strictEqual(wsCbs.length, 1, "ws 回调必须完成注册");

    assert.doesNotThrow(function () {
        wsCbs[0](chatmsg("测试弹幕", "路人甲"));
    }, "ws 回调入口不得抛错");

    assert.strictEqual(
        calls.length,
        STUB_NAMES.length,
        "全部后台处理器必须全部执行: " + JSON.stringify(calls)
    );

    console.log("✓ ② 通过: 从 ws 入口进来的弹幕顺利派发全链");
    dom.window.close();
}

/* ============================ ③ async 处理器的 rejection 也要兜住 ============================ */

async function testAsyncHandlerRejection() {
    console.log("=== ③ async 处理器 reject 不得变成无人接的异常 ===");
    const { dom, api, calls, errors } = makeDispatchSandbox();

    api.overrideTreasure(function () {
        return Promise.reject(new Error("异步任务请求失败"));
    });

    const failed = api.dispatch(chatmsg("随便一句"));
    await waitTick();

    assert.deepStrictEqual(failed, [], "async 处理器是 reject 而不是同步抛错，不该记进 failed 数组");
    assert.ok(
        errors.some(function (e) { return e.indexOf("自动抢宝箱") !== -1 && e.indexOf("异步任务请求失败") !== -1; }),
        "async 处理器的 reject 必须被接住并留 error 线索: " + JSON.stringify(errors)
    );
    assert.strictEqual(calls.length, STUB_NAMES.length - 1, "async 处理器 reject 后其余处理器仍须跑完");

    console.log("✓ ③ 通过: async rejection 被捕获，派发链不受影响");
    dom.window.close();
}

/* ============================ ④ BarrageLoop：循环发送稳定运行 ============================ */

function makeLoopSandbox() {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
        <div class="bloop">
            <input type="checkbox" id="bloop__checkbox_changeColor">
            <input type="checkbox" id="bloop__checkbox_random">
            <input type="checkbox" id="bloop__checkbox_startSend">
            <input id="bloop__text_speed1" value="2000">
            <input id="bloop__text_speed2" value="2000">
            <input id="bloop__text_stoptime" value="5">
            <textarea id="bloop__textarea"></textarea>
        </div>
        <div class="ChatSend-txt"></div>
        <div class="ChatSend-button"></div>
    </body></html>`, { url: "https://www.douyu.com/9999" });
    const win = dom.window;

    const timers = [];
    const warnings = [];

    const factory = new Function(
        "window", "document", "localStorage", "console",
        "setTimeout", "clearTimeout", "getRandom", "GM_xmlhttpRequest",
        "rid", "my_uid", "showMessage", "showMessageWindow",
        LOOP_SRC + `
        return {
            doLoop: doLoopBarrage,
            setChangeColor: function (v) { isChangeColor = v; },
            setArr: function (arr) { barrageArr = arr; barrageLength = arr.length - 1; },
            sentHint: function () { return document.getElementsByClassName("ChatSend-txt")[0].innerText; }
        };
        `
    );

    const api = factory(
        win, win.document, win.localStorage,
        { log: function () {}, warn: function () { warnings.push(Array.prototype.join.call(arguments, " ")); }, error: function () {} },
        function (fn, ms) { timers.push({ fn: fn, ms: ms }); return timers.length; },
        function () {},
        function (min, max) { return max; },
        function () {},
        "9999", "99999999",
        function () {},
        function () {}
    );

    return { dom, win, api, timers, warnings };
}

async function testBarrageLoopKeepsRunning() {
    console.log("=== ④ 弹幕发送小助手：循环发送与轮询机制稳定运行 ===");
    const { dom, api, timers } = makeLoopSandbox();
    api.setChangeColor(false);
    api.setArr(["第1条", "第2条"]);

    // ① 执行一轮循环发送
    await api.doLoop();
    assert.strictEqual(api.sentHint(), "第1条", "首条弹幕必须正确发送");
    assert.strictEqual(timers.length, 1, "发送后必须自动排入下一轮定时器");

    // ② 执行第二轮循环发送
    timers.length = 0;
    await api.doLoop();
    assert.strictEqual(api.sentHint(), "第2条", "第二条弹幕必须顺序发送");
    assert.strictEqual(timers.length, 1, "下一轮定时器必须就绪");

    console.log("✓ ④ 通过: 弹幕小助手循环发送与定时轮换正常");
    dom.window.close();
}

/* ============================ ⑤ BarragePanel：查弹幕不得点了没反应 ============================ */

async function testBarragePanelUserUid() {
    console.log("=== ⑤ 查弹幕：接口失败/返回体缺字段必须给出结果，不能让按钮点了没反应 ===");
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { url: "https://www.douyu.com/9999" });
    const win = dom.window;
    const warnings = [];
    const requests = [];

    const factory = new Function(
        "window", "document", "localStorage", "console", "setTimeout", "clearTimeout",
        "GM_xmlhttpRequest", "rid", "showMessage", "openPage", "getLocalDateStr",
        PANEL_SRC + `
        return { getUserUid: getUserUid };
        `
    );
    const api = factory(
        win, win.document, win.localStorage,
        { log: function () {}, warn: function () { warnings.push(Array.prototype.join.call(arguments, " ")); }, error: function () {} },
        win.setTimeout, win.clearTimeout,
        function (req) { requests.push(req); },
        "9999", function () {}, function () {}, function () { return "2026-10-26"; }
    );

    // ① 请求失败
    const p1 = api.getUserUid("某观众");
    await waitTick();
    requests[0].onerror({ message: "blocked" });
    assert.strictEqual(await p1, "", "请求失败必须 resolve 成空串（旧实现永不 resolve）");

    // ② 返回体为 null / 缺 suggest / fan 为空 / 昵称对不上
    const cases = [
        { response: null },
        { response: {} },
        { response: { suggest: {} } },
        { response: { suggest: { fan: [] } } },
        { response: { suggest: { fan: [{ nickname: "别人", user_id: "123" }] } } }
    ];
    for (let i = 0; i < cases.length; i++) {
        const p = api.getUserUid("某观众");
        await waitTick();
        assert.doesNotThrow(function () {
            requests[requests.length - 1].onload(cases[i]);
        }, "返回体异常时 onload 不得抛错: " + JSON.stringify(cases[i]));
        assert.strictEqual(await p, "", "异常返回体必须 resolve 成空串: " + JSON.stringify(cases[i]));
    }

    // ③ 正常命中
    const ok = api.getUserUid("某观众");
    await waitTick();
    requests[requests.length - 1].onload({ response: { suggest: { fan: [{ nickname: "某观众", user_id: "abc123" }] } } });
    assert.strictEqual(await ok, "abc123", "命中时必须返回 user_id（回归保护）");

    assert.ok(
        warnings.some(function (w) { return w.indexOf("查弹幕接口") !== -1; }),
        "请求失败必须留 warn 线索: " + JSON.stringify(warnings)
    );

    console.log("✓ ⑤ 通过: 失败/超时/畸形返回体全部安全落地，正常查询不受影响");
    dom.window.close();
}

(async function main() {
    testDispatchIsolation();
    testRealWebSocketEntry();
    await testAsyncHandlerRejection();
    await testBarrageLoopKeepsRunning();
    await testBarragePanelUserUid();
    console.log("=== 弹幕派发链隔离与后台监听回归测试 100% 通过 ===");
})().catch(function (e) {
    console.error("测试失败:", e && e.stack ? e.stack : e);
    process.exit(1);
});

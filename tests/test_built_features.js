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
 * 构建产物级验收（用户反馈 1/2/3/4 的端到端冒烟）。
 *
 * 为什么还要这一层：四个包的单元测试都是「直接注入 src 源码」跑的，
 * 它们证明不了「main.js 真的把它接线了」「压缩/摇树没有把入口摘掉」
 * 「产物里 ex-title-time / extool__monitor_open 真的会被建出来」。
 * 这里执行的是 ./dist/douyuex.user.js（构建产物），在 jsdom 里等路由初始化，
 * 然后按用户能看到的四个落点逐项断言：
 *   ① 标题栏「复制直播流」右边出现「观看时间 / 开播时间」，且口径数据真的渲染；
 *   ② 同屏面板主按钮操作区 sticky 且没有白色渐变背景；
 *   ③ 签到 / 续牌 / 版本更新三个面板的主按钮操作区同样 sticky；
 *   ④ 扩展功能面板里有「在线弹幕助手」按钮，胶囊条上不再有 .ex-monitor 图标。
 */

const ROOT = path.join(__dirname, "..");
const bundlePath = fs.existsSync(path.join(ROOT, "DouyuX.user.js"))
    ? path.join(ROOT, "DouyuX.user.js")
    : (fs.existsSync(path.join(ROOT, "dist/DouyuX.user.js"))
        ? path.join(ROOT, "dist/DouyuX.user.js")
        : path.join(ROOT, "dist/douyuex.user.js"));
const code = fs.readFileSync(bundlePath, "utf8");
const SHOW_TIME = Math.floor(new Date(2026, 9, 27, 18, 30, 0).getTime() / 1000);

function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function main() {
    console.log("=== 构建产物四落点验收（反馈 1/2/3/4） ===");

    const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
        <div class="layout-Player-videoEntity"><video></video></div>
        <div class="Barrage-main"><ul id="js-barrage-list" class="Barrage-list"></ul></div>
        <div class="BackpackButton"></div>
        <div class="Title">
            <div class="Title-col"><span class="Title-row-text">c1</span></div>
            <div class="Title-col"><span class="Title-row-text">c2</span></div>
            <div class="Title-col"><span class="Title-row-text">c3</span></div>
            <div class="Title-col"><span class="Title-row-text">c4</span></div>
            <div class="Title-col"><span class="Title-row-text">c5</span><span class="Title-row-text">尾部</span></div>
        </div>
    </body></html>`, {
        url: "https://www.douyu.com/9999",
        runScripts: "dangerously",
    });
    const win = dom.window;

    win.URL.createObjectURL = function () { return "blob:mock"; };
    win.URL.revokeObjectURL = function () {};
    win.unsafeWindow = win;
    win.fetch = async function (url) {
        if (typeof url === "string" && url.indexOf("/swf_api/h5room/9999") !== -1) {
            return { json: async () => ({ error: 0, data: { show_time: SHOW_TIME, show_status: 1 } }) };
        }
        if (typeof url === "string" && url.indexOf("fsjk/getCardTaskInfo?rid=9999") !== -1) {
            return { json: async () => ({ error: 0, data: { todayWatch: 3725 } }) };
        }
        return {
            json: async () => ({ error: 0, data: { list: [], taskIds: [] } }),
            text: async () => JSON.stringify({ error: 0, data: { list: [], taskIds: [] } }),
        };
    };
    const metaVer = (code.match(/\/\/\s*@version\s+([^\r\n]+)/) || [])[1] || "";
    win.GM_info = { script: { version: String(metaVer).trim() } };
    win.GM_getValue = function () { return null; };
    win.GM_setValue = function () {};
    win.GM_deleteValue = function () {};
    win.GM_openInTab = function () {};
    win.GM_setClipboard = function () {};
    win.GM_xmlhttpRequest = function () {};
    win.GM_cookie = function () {};
    win.GM_registerMenuCommand = function () {};
    win.room_id = "9999";
    win.document.cookie = "acf_uid=888888; acf_nickname=%E6%B5%8B%E8%AF%95;";

    const errors = [];
    win.addEventListener("error", function (e) {
        errors.push(e.message || (e.error && e.error.stack) || e.error);
    });
    win.eval(code);
    // 路由：1s 轮询门槛 + 1.5s 延时初始化（与 test_built_bundle 同一节奏）
    await wait(3400);
    assert.strictEqual(errors.length, 0, "初始化期间不得有未捕获异常: " + JSON.stringify(errors));

    /* ---------- ① 标题栏：复制直播流 → 右边观看时间 / 开播时间 ---------- */
    const copyBtn = win.document.getElementById("copy-real-live");
    assert.ok(copyBtn, "「复制直播流」必须被 CopyRealLive 插出来（前置）");
    const titleTime = win.document.querySelector(".ex-title-time");
    assert.ok(titleTime, "产物里必须真的建出 .ex-title-time（main.js 接线 / 摇树都要过）");
    assert.strictEqual(copyBtn.nextElementSibling, titleTime, "观看/开播时间必须紧跟在「复制直播流」右边");
    assert.strictEqual(titleTime.parentNode, copyBtn.parentNode, "必须与「复制直播流」同一父节点");
    assert.strictEqual(win.document.querySelectorAll(".ex-title-time").length, 1, "只允许一份");
    const watchVal = titleTime.querySelector('[data-title-time="watch"] .ex-title-time__value');
    const startVal = titleTime.querySelector('[data-title-time="start"] .ex-title-time__value');
    assert.ok(watchVal && startVal, "必须有两项数值节点");
    assert.strictEqual(String(watchVal.textContent), "1小时2分5秒", "观看时间必须取 fsjk 的 todayWatch，实际 " + watchVal.textContent);
    assert.strictEqual(String(startVal.textContent), "10-27 18:30", "开播时间必须取 h5room 的 show_time，实际 " + startVal.textContent);
    assert.ok(String(titleTime.textContent).indexOf("观看时间") !== -1 && String(titleTime.textContent).indexOf("开播时间") !== -1,
        "两个前缀文案必须都在，实际 " + JSON.stringify(titleTime.textContent));
    assert.ok(String(titleTime.title).indexOf("2026-10-27 18:30") !== -1, "悬停必须给完整开播时间，实际 " + JSON.stringify(titleTime.title));
    console.log("✓ ① 标题栏：复制直播流右边是观看时间 + 开播时间，数据来自官方接口");

    /* ---------- ② 同屏面板：主按钮粘底且没有白色渐变 ---------- */
    assert.doesNotThrow(function () { win.createPopupPlayerPanel(); }, "同屏面板必须能建出来");
    const popPanel = win.document.querySelector(".popup-player-panel");
    assert.ok(popPanel, "同屏面板必须存在（前置）");
    const popWrap = popPanel.querySelector(".popup-panel__action-wrap");
    assert.ok(popWrap, "同屏面板必须有主操作区");
    const popStyle = popWrap.getAttribute("style") || "";
    assert.strictEqual(popWrap.style.position, "sticky", "同屏主操作区必须 sticky，实际 " + popStyle);
    assert.strictEqual(popWrap.style.zIndex, "3", "同屏主操作区必须盖在最上层，实际 " + popStyle);
    assert.ok(!/linear-gradient|background/i.test(popStyle), "同屏主操作区不得再带白色渐变/任何背景，实际 " + popStyle);
    const cs = win.getComputedStyle(popWrap);
    assert.ok(!/gradient/i.test(String(cs.backgroundImage || "")), "计算样式里也不得有渐变，实际 " + cs.backgroundImage);
    console.log("✓ ② 同屏面板：先加一个房间按钮粘底置顶，白色渐变已去掉");

    /* ---------- ③ 检查更新 / 开始签到 / 立即开始续牌：同样的粘底主按钮 ---------- */
    const CASE3 = [
        { label: "版本更新", create: function () { win.createExUpdatePanel(); }, panel: ".exupdate-panel", wrap: ".exupdate-panel__action-wrap", btn: "#exupdate-action-btn" },
        { label: "一键签到", create: function () { win.createSignPanel(); }, panel: ".sign-panel", wrap: ".fans-panel__action-wrap", btn: "#sign-panel-start-btn" },
        { label: "一键续牌", create: function () { win.createFansContinuePanel(); }, panel: ".fans-continue-panel", wrap: ".fans-panel__action-wrap", btn: "#fans-panel-start-btn" },
    ];
    CASE3.forEach(function (item) {
        assert.doesNotThrow(item.create, item.label + "面板必须能建出来");
        const panel = win.document.querySelector(item.panel);
        assert.ok(panel, item.label + "面板必须存在");
        const wrap = panel.querySelector(item.wrap);
        assert.ok(wrap, item.label + "面板必须有主操作区");
        assert.ok(wrap.querySelector(item.btn), item.label + "主按钮必须在操作区里");
        const style = wrap.getAttribute("style") || "";
        assert.strictEqual(wrap.style.position, "sticky", item.label + "主操作区必须 sticky，实际 " + style);
        assert.strictEqual(wrap.style.zIndex, "3", item.label + "主操作区必须盖在最上层，实际 " + style);
        assert.ok(!/linear-gradient|background/i.test(style), item.label + "主操作区不得带背景/渐变，实际 " + style);
    });
    console.log("✓ ③ 版本更新 / 一键签到 / 一键续牌：三个主按钮同样常驻面板底部");

    /* ---------- ④ 扩展功能旧版在线工具已剔除，主 Dock 栏新增在线工具与驴酱杯导航 ---------- */
    const extool = win.document.querySelector(".extool");
    assert.ok(extool, "扩展功能面板必须存在（前置）");
    const oldMonitorBtn = extool.querySelector("#extool__monitor_open");
    assert.strictEqual(oldMonitorBtn, null, "扩展功能面板内旧版在线工具必须已彻底删除");
    assert.strictEqual(extool.querySelector("#extool__monitor_card"), null, "扩展功能面板内旧版在线工具卡片必须已彻底删除");

    const onlineToolsDockIcon = win.document.querySelector(".online-tools");
    assert.ok(onlineToolsDockIcon, "底部主 Dock 栏必须具备「在线工具」图标入口 .online-tools");

    // 触发或直接检查面板
    if (typeof win.createOnlineToolsPanel === "function") win.createOnlineToolsPanel();
    const onlineToolsPanel = win.document.querySelector(".online-tools-panel");
    assert.ok(onlineToolsPanel, "在线工具独立面板必须已渲染（.online-tools-panel）");
    assert.ok(onlineToolsPanel.textContent.indexOf("驴酱杯") !== -1, "面板内必须包含「驴酱杯」模块标题");
    const links = onlineToolsPanel.querySelectorAll(".online-tool-btn");
    assert.strictEqual(links.length, 4, "驴酱杯模块下方必须有 4 个快捷按钮");
    assert.ok(onlineToolsPanel.querySelector('a[href*="xinlvjiang.icu/schedule"]'), "必须包含赛程链接");
    assert.ok(onlineToolsPanel.querySelector('a[href*="xinlvjiang.icu/teams"]'), "必须包含阵容链接");
    assert.ok(onlineToolsPanel.querySelector('a[href*="xinlvjiang.icu/players"]'), "必须包含选手链接");
    assert.ok(onlineToolsPanel.querySelector('a[href*="xinlvjiang.icu/leaderboards"]'), "必须包含选手榜链接");
    links.forEach(a => {
        assert.strictEqual(a.getAttribute("target"), "_blank", "快捷按钮必须在新标签页打开（target=_blank）");
    });

    // 验证监控室查询入口与独立查询面板
    const monitorBtn = onlineToolsPanel.querySelector("#online-tool__monitor-btn");
    assert.ok(monitorBtn, "在线工具面板内必须包含监控室查询入口按钮 #online-tool__monitor-btn");
    assert.ok(monitorBtn.textContent.includes("查询"), "入口按钮文本必须包含「查询」");
    assert.ok(onlineToolsPanel.textContent.indexOf("弹幕/礼物查询") !== -1, "必须包含「弹幕/礼物查询」卡片标题");
    const streamerCards = onlineToolsPanel.querySelectorAll(".online-tool-streamer-card");
    assert.strictEqual(streamerCards.length, 16, "在线工具面板内必须包含 16 个赛事直播间跳转卡片");

    if (typeof win.openMonitorQueryPanel === "function") {
        win.openMonitorQueryPanel(monitorBtn);
    } else {
        monitorBtn.dispatchEvent(new win.Event("click", { bubbles: true }));
    }

    const monitorPanel = win.document.querySelector(".monitor-query-panel");
    assert.ok(monitorPanel, "点击入口按钮后必须渲染独立监控室查询面板 .monitor-query-panel");
    assert.ok(monitorPanel.classList.contains("miuix-modal"), "监控室面板必须继承 miuix-modal 基类");

    const tabs = monitorPanel.querySelectorAll(".monitor-query__tab");
    assert.strictEqual(tabs.length, 2, "监控室面板必须包含两个查询 Tab");
    assert.strictEqual(tabs[0].textContent.trim(), "弹幕查询");
    assert.strictEqual(tabs[1].textContent.trim(), "礼物统计");

    const input = monitorPanel.querySelector(".monitor-query__input");
    assert.ok(input, "监控室面板必须包含搜索输入框");
    assert.strictEqual(input.getAttribute("placeholder"), "请输入用户昵称或UID");

    const searchBtn = monitorPanel.querySelector(".monitor-query__submit-btn");
    assert.ok(searchBtn, "监控室面板必须包含查询按钮");
    assert.strictEqual(searchBtn.textContent.trim(), "查询");

    const ths = monitorPanel.querySelectorAll(".monitor-query__table thead th");
    assert.strictEqual(ths.length, 6, "表头预设必须为 6 列");
    const headers = ["序号", "主播", "昵称", "UID", "内容/礼物", "时间"];
    ths.forEach((th, idx) => {
        assert.strictEqual(th.textContent.trim(), headers[idx]);
    });

    assert.strictEqual(typeof win.fetchMonitorData, "function", "全局必须导出 fetchMonitorData 接口骨架");

    assert.strictEqual(errors.length, 0, "全流程结束后仍不得有未捕获异常: " + JSON.stringify(errors));
    console.log("✓ ④ 扩展功能旧版在线工具已剔除，主 Dock 在线工具、驴酱杯导航与监控室查询面板就位");
    console.log("=== 构建产物四落点验收 100% 通过 ===");
    process.exit(0);
}

main().catch(function (e) {
    console.error("产物验收失败:", e && e.stack ? e.stack : e);
    process.exit(1);
});

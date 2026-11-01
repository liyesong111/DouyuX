const fs = require("fs");
const path = require("path");
const assert = require("assert");
let JSDOM, VirtualConsole;
try {
    ({ JSDOM, VirtualConsole } = require("jsdom"));
} catch (e) {
    console.error("[测试] 缺少依赖 jsdom，请先执行：npm install");
    throw e;
}

const ROOT = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const EXPANDTOOL_SRC = read("src/packages/ExpandTool/ExpandTool.js");
const ONLINETOOL_SRC = read("src/packages/OnlineTool/OnlineTool.js");
const EXPANEL_SRC = read("src/packages/XPanel/XPanel.js");
const EXPANEL_CSS = read("src/packages/XPanel/XPanel.css");
const POPUPPLAYER_SRC = read("src/packages/PopupPlayer/PopupPlayer.js");

function stripComments(src) {
    return String(src).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const SIBLING_MODULES = [
    "initPkg_ExpandTool_Treasure", "initPkg_ExpandTool_RedPacket_Room", "initPkg_ExpandTool_AutoFish",
    "initPkg_ExpandTool_ClearBag", "initPkg_ExpandTool_SendGift", "initPkg_ExpandTool_TabSwitch",
    "initPkg_ExpandTool_P2P", "initPkg_ExpandTool_FullScreen", "initPkg_ExpandTool_AutoBarrageColor",
    "initPkg_ExpandTool_Shield"
];

const PAGE_HTML = `<!DOCTYPE html><html><body>
    <div class="ex-panel"><div class="ex-panel__wrap"></div></div>
    <div class="layout-Player-chat"></div>
</body></html>`;

function loadExpandTool(opts) {
    opts = opts || {};
    const vc = new VirtualConsole();
    const jsdomErrors = [];
    vc.on("jsdomError", (e) => jsdomErrors.push(e));
    const dom = new JSDOM(PAGE_HTML, { url: "https://www.douyu.com/9999", virtualConsole: vc });
    const win = dom.window;

    const messages = [];
    const warns = [];
    const rightPanels = [];
    const dbg = { log: () => {}, info: () => {}, warn: () => {}, error: () => {} };

    const stubShowMessage = opts.noHelpers ? undefined : function (msg, type) {
        messages.push([String(msg), String(type)]);
    };
    const stubWarn = opts.noHelpers ? undefined : function (tag, msg) {
        warns.push([String(tag), String(msg)]);
    };
    const stubRightPanel = function (name) { rightPanels.push(String(name)); };
    const stubModules = SIBLING_MODULES.map(function (name) {
        return function () {
            if (opts.throwOn === name) throw new Error(name + " boom");
        };
    });

    const factory = new Function(
        "document", "window", "localStorage", "console",
        "showMessage", "ExGuard_warn", "openPage", "rid", "showExRightPanel",
        SIBLING_MODULES.join(", "),
        EXPANDTOOL_SRC + `
        return {
            dom: initPkg_ExpandTool_Dom,
            func: initPkg_ExpandTool_Func,
            mod: initPkg_ExpandTool_Module
        };`
    );

    const api = factory(
        win.document, win, win.localStorage, dbg,
        stubShowMessage, stubWarn, function () {},
        ("rid" in opts) ? opts.rid : 9999,
        stubRightPanel,
        ...stubModules
    );

    return { dom, win, api, messages, warns, rightPanels, jsdomErrors };
}

/* ------------------------------------------------------------------ */
/* 场景 1: 扩展功能面板已彻底剔除旧版「在线工具」卡片与废弃按钮         */
/* ------------------------------------------------------------------ */
function testExpandToolCardRemoved() {
    const env = loadExpandTool({ rid: 9999 });
    env.api.dom();
    env.api.mod();
    const doc = env.win.document;
    const panel = doc.querySelector(".extool");
    assert.ok(panel, "扩展功能面板必须插出来（.extool）");

    // 旧卡片与按钮彻底消失
    assert.strictEqual(doc.getElementById("extool__monitor_open"), null, "旧版「在线弹幕助手」按钮必须彻底移除");
    assert.strictEqual(doc.getElementById("extool__monitor_card"), null, "旧版「在线工具」卡片容器必须彻底移除");
    assert.strictEqual(stripComments(panel.innerHTML).indexOf("在线工具"), -1, "扩展功能面板渲染内容中不得再包含「在线工具」");

    // 源码中不得残留旧版跳转函数
    assert.strictEqual(stripComments(EXPANDTOOL_SRC).indexOf("initPkg_ExpandTool_MonitorLink"), -1,
        "ExpandTool 源码中不得再声明或调用 initPkg_ExpandTool_MonitorLink");

    assert.strictEqual(env.jsdomErrors.length, 0, "渲染与模块加载无异常");
    env.dom.window.close();
    console.log("✓ 场景 1 通过: 扩展功能面板旧版「在线工具」分类及其所有下属选项已彻底删除");
}

/* ------------------------------------------------------------------ */
/* 场景 2: 扩展功能面板幂等性与兄弟模块隔离保持正常                     */
/* ------------------------------------------------------------------ */
function testInsertIsIdempotent() {
    const env = loadExpandTool({});
    env.api.dom();
    env.api.dom();
    const doc = env.win.document;
    assert.strictEqual(doc.querySelectorAll(".extool").length, 1, "重复初始化不得插出第二个面板");
    assert.strictEqual(env.jsdomErrors.length, 0, "初始化过程不得有未捕获异常");
    env.dom.window.close();
    console.log("✓ 场景 2 通过: 扩展功能面板重复初始化幂等");
}

/* ------------------------------------------------------------------ */
/* 场景 3: 新增底部 Dock「在线工具」图标与独立暗夜毛玻璃面板             */
/* ------------------------------------------------------------------ */
function testNewOnlineToolsDockAndPanel() {
    const dom = new JSDOM(PAGE_HTML, { url: "https://www.douyu.com/9999" });
    const win = dom.window;

    let centeredOpened = false;
    win.openMiuixPanelCentered = function (panel, btn) {
        centeredOpened = true;
        panel.style.display = "flex";
    };
    win.ensureMiuixPanelHeader = function (el, title) {
        el.classList.add("miuix-modal");
    };

    const factory = new Function(
        "document", "window", "openMiuixPanelCentered", "ensureMiuixPanelHeader",
        ONLINETOOL_SRC + `
        return {
            init: initPkg_OnlineTool,
            dom: initPkg_OnlineTool_Dom,
            func: initPkg_OnlineTool_Func,
            createPanel: createOnlineToolsPanel
        };`
    );

    const api = factory(win.document, win, win.openMiuixPanelCentered, win.ensureMiuixPanelHeader);
    api.init();

    // 检查 Dock 图标入口
    const dockIcon = win.document.querySelector(".online-tools");
    assert.ok(dockIcon, "Dock 栏中必须插入 .online-tools 图标入口");
    assert.ok(dockIcon.querySelector(".ex-panel__icon"), "必须有 .ex-panel__icon 链接");
    assert.strictEqual(dockIcon.querySelector(".ex-panel__icon").getAttribute("title"), "在线工具", "图标提示文本必须是「在线工具」");

    // 点击图标触发面板弹出
    dockIcon.dispatchEvent(new win.Event("click", { bubbles: true }));
    assert.ok(centeredOpened, "点击图标必须调用 openMiuixPanelCentered 弹出居中吸附面板");

    const panel = win.document.querySelector(".online-tools-panel");
    assert.ok(panel, "必须渲染出独立的 .online-tools-panel 面板");
    assert.ok(panel.classList.contains("miuix-modal"), "面板必须继承 miuix-modal 基类");

    // 检查二级模块大标题「驴酱杯」
    const cardTitle = panel.querySelector(".fans-panel__card-title");
    assert.ok(cardTitle, "必须有卡片标题元素");
    assert.strictEqual(cardTitle.textContent.trim(), "驴酱杯", "大标题必须是「驴酱杯」");

    // 检查 5 个精致快捷按钮与链接
    const linksWrap = panel.querySelector(".online-tool-links");
    assert.ok(linksWrap, "必须有 .online-tool-links 容器");

    const btns = panel.querySelectorAll(".online-tool-btn");
    assert.strictEqual(btns.length, 5, "必须横排渲染 5 个快捷按钮");

    const expected = [
        { text: "赛程", url: "https://xinlvjiang.icu/schedule/?event=lvjiangbeiS3" },
        { text: "阵容", url: "https://xinlvjiang.icu/teams/?event=lvjiangbeiS3" },
        { text: "选手", url: "https://xinlvjiang.icu/players/?event=lvjiangbeiS3&page_size=20" },
        { text: "选手榜", url: "https://xinlvjiang.icu/leaderboards/?event=lvjiangbeiS3" },
        { text: "直播", url: "https://xinlvjiang.icu/live/?event=lvjiangbeiS3" }
    ];

    expected.forEach((item, idx) => {
        const btn = btns[idx];
        assert.ok(btn.textContent.includes(item.text), `第 ${idx + 1} 个按钮文本必须包含「${item.text}」`);
        assert.strictEqual(btn.getAttribute("href"), item.url, `第 ${idx + 1} 个按钮链接必须为 ${item.url}`);
        assert.strictEqual(btn.getAttribute("target"), "_blank", `第 ${idx + 1} 个按钮必须 target="_blank" 在新标签页打开`);
    });

    dom.window.close();
    console.log("✓ 场景 3 通过: 底部 Dock「在线工具」总栏目就位，弹出毛玻璃面板且包含「驴酱杯」5 项快捷导航（含直播）");
}

/* ------------------------------------------------------------------ */
/* 场景 4: 三级面板统一清单与 ExPanel 接线完整                          */
/* ------------------------------------------------------------------ */
function testExPanelIntegration() {
    assert.ok(EXPANEL_SRC.indexOf(".online-tools-panel") !== -1,
        "ExPanel.js 中三级面板清单必须已登记 .online-tools-panel");
    assert.ok(EXPANEL_SRC.indexOf('"online-tools"') !== -1,
        "ExPanel.js 中 Dock 映射必须登记 online-tools");
    assert.ok(EXPANEL_SRC.indexOf(".monitor-query-panel") !== -1,
        "ExPanel.js 中三级面板清单必须已登记 .monitor-query-panel");
    console.log("✓ 场景 4 通过: ExPanel 清单与 Dock 映射完整登记新面板");
}

/* ------------------------------------------------------------------ */
/* 场景 5: 监控室查询入口与独立面板交互验证                              */
/* ------------------------------------------------------------------ */
function testMonitorQueryFeature() {
    const dom = new JSDOM(PAGE_HTML, { url: "https://www.douyu.com/9999" });
    const win = dom.window;

    let centeredOpened = false;
    let openedPanel = null;
    win.openMiuixPanelCentered = function (panel, btn) {
        centeredOpened = true;
        openedPanel = panel;
        panel.style.display = "flex";
    };
    win.ensureMiuixPanelHeader = function (el, title) {
        el.classList.add("miuix-modal");
        let header = el.querySelector(".miuix-modal__header");
        if (!header) {
            header = win.document.createElement("div");
            header.className = "miuix-modal__header";
            header.innerHTML = '<span class="miuix-modal__title">' + title + '</span>';
            el.insertBefore(header, el.firstChild);
        }
    };

    const factory = new Function(
        "document", "window", "openMiuixPanelCentered", "ensureMiuixPanelHeader",
        ONLINETOOL_SRC + `
        return {
            init: initPkg_OnlineTool,
            createPanel: createOnlineToolsPanel,
            createMonitorPanel: createMonitorQueryPanel,
            openMonitorPanel: openMonitorQueryPanel,
            fetchData: fetchMonitorData
        };`
    );

    const api = factory(win.document, win, win.openMiuixPanelCentered, win.ensureMiuixPanelHeader);
    api.createPanel();

    const onlineToolsPanel = win.document.querySelector(".online-tools-panel");
    assert.ok(onlineToolsPanel, "在线工具面板必须存在");

    // 1. 验证“查询”入口按钮
    const monitorBtn = onlineToolsPanel.querySelector("#online-tool__monitor-btn");
    assert.ok(monitorBtn, "在线工具面板中必须存在 #online-tool__monitor-btn 入口按钮");
    assert.ok(monitorBtn.textContent.includes("查询"), "入口按钮文本必须包含「查询」");

    // 2. 点击按钮触发独立查询面板
    monitorBtn.dispatchEvent(new win.Event("click", { bubbles: true }));
    assert.ok(centeredOpened, "点击监控室入口必须调用 openMiuixPanelCentered 打开面板");

    const monitorPanel = win.document.querySelector(".monitor-query-panel");
    assert.ok(monitorPanel, "必须渲染出独立的 .monitor-query-panel 面板");
    assert.ok(monitorPanel.classList.contains("miuix-modal"), "监控室面板必须继承 miuix-modal");

    // 3. 顶部 Tabs 验证：“弹幕查询”与“礼物查询”
    const tabs = monitorPanel.querySelectorAll(".monitor-query__tab");
    assert.strictEqual(tabs.length, 2, "必须包含两个查询 Tab");
    assert.strictEqual(tabs[0].textContent.trim(), "弹幕查询");
    assert.ok(tabs[1].textContent.trim() === "礼物统计" || tabs[1].textContent.trim() === "礼物查询", "第二个 Tab 必须为礼物统计或礼物查询");
    assert.ok(tabs[0].classList.contains("is-active"), "默认选中的是弹幕查询");

    // 切换 Tab 测试
    tabs[1].dispatchEvent(new win.Event("click", { bubbles: true }));
    assert.ok(!tabs[0].classList.contains("is-active"), "切换后弹幕查询不再激活");
    assert.ok(tabs[1].classList.contains("is-active"), "切换后礼物查询处于激活状态");

    // 4. 搜索交互区验证：输入框与查询按钮
    const input = monitorPanel.querySelector(".monitor-query__input");
    assert.ok(input, "必须包含搜索输入框");
    assert.strictEqual(input.getAttribute("placeholder"), "请输入用户昵称或UID", "placeholder 必须是「请输入用户昵称或UID」");

    const submitBtn = monitorPanel.querySelector(".monitor-query__submit-btn");
    assert.ok(submitBtn, "必须包含「查询」按钮");
    assert.strictEqual(submitBtn.textContent.trim(), "查询");

    // 5. 数据表格与表头验证
    const tableWrap = monitorPanel.querySelector(".monitor-query__table-wrap");
    assert.ok(tableWrap, "必须有表格滚动容器 .monitor-query__table-wrap");
    const ths = monitorPanel.querySelectorAll(".monitor-query__table thead th");
    assert.strictEqual(ths.length, 6, "表头必须有 6 列");
    const expectedHeaders = ["序号", "主播", "昵称", "UID", "内容/礼物", "时间"];
    ths.forEach((th, idx) => {
        assert.strictEqual(th.textContent.trim(), expectedHeaders[idx], `第 ${idx + 1} 列必须是「${expectedHeaders[idx]}」`);
    });

    // 6. 验证点击「查询」后渲染“数据加载中...”及调用 fetchMonitorData
    let fetchCalledWith = null;
    win.fetchMonitorData = function (keyword, type) {
        fetchCalledWith = { keyword, type };
        return new Promise(() => {}); // 挂起
    };

    input.value = "测试用户123";
    submitBtn.dispatchEvent(new win.Event("click", { bubbles: true }));

    const tbody = monitorPanel.querySelector(".monitor-query__tbody");
    assert.ok(tbody.textContent.includes("数据加载中..."), "点击查询后表格必须渲染「数据加载中...」状态");
    assert.ok(fetchCalledWith, "点击查询后必须调用 fetchMonitorData");
    assert.strictEqual(fetchCalledWith.keyword, "测试用户123", "调用参数 keyword 必须与输入框一致");
    assert.strictEqual(fetchCalledWith.type, "gift", "调用参数 type 必须与当前选中的 tab 一致");

    dom.window.close();
    console.log("✓ 场景 5 通过: 监控室查询入口、Tab 切换、搜索区、表头与接口骨架调用全流程验证通过");
}

/* 场景 6: 监控室真实 API 对接、Headers 伪装、两步查询与表格渲染验证 */
function testMonitorApiIntegration() {
    console.log("=== 正在运行监控室真实 API 对接与两步查询逻辑验证 ===");
    const buildJsSrc = read("build.js");
    const mainJsSrc = read("src/main.js");

    // 1. 验证特权声明
    assert.ok(
        buildJsSrc.includes("@grant GM_xmlhttpRequest") || buildJsSrc.includes("@grant        GM_xmlhttpRequest"),
        "build.js 中必须声明 @grant GM_xmlhttpRequest"
    );
    assert.ok(
        buildJsSrc.includes("@connect xn--wbt59p7locqcy71c.xyz") || buildJsSrc.includes("@connect      xn--wbt59p7locqcy71c.xyz"),
        "build.js 中必须声明 @connect xn--wbt59p7locqcy71c.xyz"
    );
    assert.ok(
        mainJsSrc.includes("@connect      xn--wbt59p7locqcy71c.xyz"),
        "src/main.js 头部中必须声明 @connect xn--wbt59p7locqcy71c.xyz"
    );

    // 2. 模拟环境测试核心请求函数与伪装 Headers
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://www.douyu.com/9999",
        userAgent: "DouyuX-Agent-Test/1.0"
    });
    const win = dom.window;
    win.$ROOM = { room_id: "9999" };

    const capturedRequests = [];
    win.GM_xmlhttpRequest = function (cfg) {
        capturedRequests.push(cfg);
        if (cfg.url.includes("/users")) {
            setTimeout(() => {
                if (cfg.onload) {
                    cfg.onload({
                        status: 200,
                        responseText: JSON.stringify({
                            code: 200,
                            candidates: [{ uid: "654321", nicknames: ["小飞棍"] }],
                            items: [{ uid: "654321", nickname: "小飞棍" }]
                        })
                    });
                }
            }, 0);
        } else if (cfg.url.includes("/api/chat")) {
            setTimeout(() => {
                if (cfg.onload) {
                    cfg.onload({
                        status: 200,
                        responseText: JSON.stringify({
                            page: 1,
                            total: 15,
                            items: [
                                {
                                    anchor: "大司马",
                                    nick: "测试粉丝",
                                    uid: "654321",
                                    txt: "芜湖起飞！",
                                    time: "2026-10-31 22:30:00"
                                }
                            ]
                        })
                    });
                }
            }, 0);
        } else {
            setTimeout(() => {
                if (cfg.onload) cfg.onload({ status: 200, responseText: "{}" });
            }, 0);
        }
    };

    const factory = new Function(
        "document", "window", "openMiuixPanelCentered", "ensureMiuixPanelHeader", "GM_xmlhttpRequest", "navigator",
        ONLINETOOL_SRC + `
        return {
            createMonitorPanel: createMonitorQueryPanel,
            fetchMonitorData: fetchMonitorData,
            renderMonitorData: renderMonitorData,
            requestMonitorApi: requestMonitorApi
        };`
    );

    const api = factory(
        win.document,
        win,
        function () {},
        function () {},
        win.GM_xmlhttpRequest,
        win.navigator
    );

    api.createMonitorPanel();
    const panel = win.document.querySelector(".monitor-query-panel");
    assert.ok(panel, "监控室面板必须成功创建");

    // 测试核心请求函数附带伪装 Headers
    return api.requestMonitorApi("https://xn--wbt59p7locqcy71c.xyz/api/test").then(() => {
        assert.ok(capturedRequests.length > 0, "必须发送了 GM_xmlhttpRequest 请求");
        const req0 = capturedRequests[0];
        assert.strictEqual(req0.headers["Origin"], "https://xn--wbt59p7locqcy71c.xyz", "请求头 Origin 必须伪装正确");
        assert.strictEqual(req0.headers["Referer"], "https://xn--wbt59p7locqcy71c.xyz/", "请求头 Referer 必须伪装正确");
        assert.strictEqual(req0.headers["Content-Type"], "application/json", "请求头 Content-Type 必须为 application/json");
        assert.strictEqual(req0.headers["User-Agent"], win.navigator.userAgent, "请求头 User-Agent 必须取自 navigator.userAgent");

        capturedRequests.length = 0;

        // 场景 A: 纯数字 UID 直接查询第二步（不请求 /api/users）
        return api.fetchMonitorData("123456", "danmaku");
    }).then((resA) => {
        assert.strictEqual(capturedRequests.length, 1, "纯数字 UID 查询只需 1 次请求");
        assert.ok(capturedRequests[0].url.includes("/api/chat?room_id=9999"), "请求 URL 包含正确 room_id");
        assert.ok(capturedRequests[0].url.includes("uid=123456"), "请求 URL 包含正确 uid");
        assert.strictEqual(resA.total, 15, "返回数据格式正确");

        capturedRequests.length = 0;

        // 场景 B: 昵称查询两步走（先 /api/users 转换，再 /api/chat）
        return api.fetchMonitorData("小飞棍", "danmaku");
    }).then((resB) => {
        assert.strictEqual(capturedRequests.length, 2, "昵称查询必须分为 2 步连续请求");
        assert.ok(capturedRequests[0].url.includes("/users?room_id=9999"), "第 1 步必须请求 /api/chat/users 或 /api/users 转换 UID");
        assert.ok(capturedRequests[0].url.includes("nickname=%E5%B0%8F%E9%A3%9E%E6%A3%8D"), "第 1 步请求参数必须编码昵称");
        assert.ok(capturedRequests[1].url.includes("/api/chat?room_id=9999"), "第 2 步必须请求 /api/chat 获取弹幕");
        assert.ok(capturedRequests[1].url.includes("uid=654321"), "第 2 步必须使用转换后的真实 UID");

        // 验证表格数据渲染
        api.renderMonitorData(resB);
        const tbody = panel.querySelector(".monitor-query__tbody");
        const rows = tbody.querySelectorAll("tr");
        assert.strictEqual(rows.length, 1, "表格体中必须插入 1 行 <tr>");
        const tds = rows[0].querySelectorAll("td");
        assert.strictEqual(tds.length, 6, "每行必须有 6 列 <td>");
        assert.strictEqual(tds[0].textContent.trim(), "1", "第 1 列为序号 1");
        assert.strictEqual(tds[1].textContent.trim(), "大司马", "第 2 列为主播名");
        assert.strictEqual(tds[2].textContent.trim(), "测试粉丝", "第 3 列为昵称");
        assert.strictEqual(tds[3].textContent.trim(), "654321", "第 4 列为 UID");
        assert.strictEqual(tds[4].textContent.trim(), "芜湖起飞！", "第 5 列为发言内容");
        assert.strictEqual(tds[5].textContent.trim(), "2026-10-31 22:30:00", "第 6 列为发言时间");

        // 验证空数据渲染
        api.renderMonitorData({ items: [] });
        assert.ok(tbody.textContent.includes("未查询到相关数据"), "空数据时必须显示未查询到相关数据");

        dom.window.close();
        console.log("✓ 场景 6 通过: 监控室真实 API 对接、Headers 伪装、两步查询逻辑与表格渲染全流程通过");
    });
}

/* 场景 7: 监控室居中、同屏状态清空、主播下拉框接口对接与礼物条形图渲染全链路验证 */
function testMonitorAndPopupPlayerFourFixes() {
    console.log("=== 正在运行监控室查询与同屏播放 4 项深度修复验证 ===");

    // 【1. UI 修复：居中对齐“监控室查询”按钮】
    assert.ok(
        EXPANEL_CSS.includes(".online-tool-actions") && EXPANEL_CSS.includes("justify-content: center !important;"),
        ".online-tool-actions 样式中必须包含 justify-content: center !important 确保水平居中"
    );
    assert.ok(
        EXPANEL_CSS.includes(".online-tool-action-btn") && EXPANEL_CSS.includes("margin: 0 auto !important;"),
        ".online-tool-action-btn 样式中必须包含 margin: 0 auto !important 确保在卡片中居中"
    );

    // 【2. 逻辑修复：同屏播放状态残留】
    const domPopup = new JSDOM("<!DOCTYPE html><html><body><div class=\"popup-player-panel\"><div id=\"popup-ms-results\">" +
        "<button type=\"button\" class=\"popup-ms__result is-on\" data-rid=\"1126960\"><span class=\"popup-ms__flag is-on\">同屏里</span></button>" +
        "<button type=\"button\" class=\"popup-ms__result is-on\" data-rid=\"3168536\"><span class=\"ex-in-screen-tag\">同屏里</span></button>" +
        "</div></div></body></html>");
    const winPopup = domPopup.window;

    const popupFactory = new Function(
        "document", "window", "MultiScreen_getList",
        POPUPPLAYER_SRC + `
        return {
            clearStatus: PopupPlayer_clearInScreenStatus,
            updateStatus: PopupPlayer_updateInScreenStatus
        };`
    );
    winPopup.MultiScreen_getList = function () {
        return [{ rid: "1126960" }];
    };
    const popupApi = popupFactory(winPopup.document, winPopup, winPopup.MultiScreen_getList);
    assert.strictEqual(typeof popupApi.clearStatus, "function", "PopupPlayer_clearInScreenStatus 必须导出为函数");
    assert.strictEqual(typeof popupApi.updateStatus, "function", "PopupPlayer_updateInScreenStatus 必须导出为函数");

    popupApi.clearStatus();
    const remainingFlags = winPopup.document.querySelectorAll(".popup-ms__flag.is-on, .ex-in-screen-tag");
    assert.strictEqual(remainingFlags.length, 0, "调用 clearStatus 后所有「同屏里」标签必须被移除");
    const activeBtns = winPopup.document.querySelectorAll(".popup-ms__result.is-on");
    assert.strictEqual(activeBtns.length, 0, "调用 clearStatus 后所有按钮的 is-on 高亮状态必须被清空");

    // 验证 updateStatus 恢复状态
    popupApi.updateStatus();
    const restoredBtn = winPopup.document.querySelector('.popup-ms__result[data-rid="1126960"]');
    assert.ok(restoredBtn.classList.contains("is-on"), "在同屏里的房间必须恢复 is-on 样式");
    const restoredFlag = restoredBtn.querySelector(".popup-ms__flag.is-on");
    assert.ok(restoredFlag, "在同屏里的房间必须重新打上「同屏里」徽标");
    domPopup.window.close();

    // 【3 & 4. 接口修复（主播下拉框）与礼物统计图表结构】
    const domMonitor = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "https://www.douyu.com/9999",
        userAgent: "DouyuX-Agent-Test/1.0"
    });
    const winMonitor = domMonitor.window;
    winMonitor.$ROOM = { room_id: "9999" };

    const captured = [];
    winMonitor.GM_xmlhttpRequest = function (cfg) {
        captured.push(cfg);
        setTimeout(() => {
            if (cfg.onload) {
                cfg.onload({
                    status: 200,
                    responseText: JSON.stringify({ items: [] })
                });
            }
        }, 0);
    };

    const monitorFactory = new Function(
        "document", "window", "openMiuixPanelCentered", "ensureMiuixPanelHeader", "GM_xmlhttpRequest", "navigator",
        ONLINETOOL_SRC + `
        return {
            createMonitorPanel: createMonitorQueryPanel,
            fetchMonitorData: fetchMonitorData,
            renderGiftChart: renderMonitorGiftChart
        };`
    );

    const monitorApi = monitorFactory(
        winMonitor.document,
        winMonitor,
        function () {},
        function () {},
        winMonitor.GM_xmlhttpRequest,
        winMonitor.navigator
    );

    monitorApi.createMonitorPanel();
    const panel = winMonitor.document.querySelector(".monitor-query-panel");
    assert.ok(panel, "监控室查询面板必须成功创建");

    // 3.1 验证主播下拉框
    const anchorSelect = panel.querySelector(".monitor-query__anchor-select");
    assert.ok(anchorSelect, "输入框上方必须存在主播下拉框 .monitor-query__anchor-select");
    const options = Array.from(anchorSelect.options).map(o => ({ value: o.value, text: o.text }));
    assert.ok(options.some(o => o.value === "1126960" && o.text.includes("余小C")), "必须包含主播 余小C (1126960)");
    assert.ok(options.some(o => o.value === "3168536" && o.text.includes("Xleft小叮当")), "必须包含主播 Xleft小叮当 (3168536)");

    // 3.2 验证选择不同主播后，请求读取的是下拉框选中的 room_id
    anchorSelect.value = "3168536";
    return monitorApi.fetchMonitorData("654321", "danmaku").then(() => {
        assert.ok(captured.length > 0, "必须触发网络请求");
        assert.ok(captured[0].url.includes("room_id=3168536"), "请求 URL 中必须包含下拉框选中的主播房间号 3168536");
        assert.ok(!captured[0].url.includes("room_id=9999"), "不得盲目使用当前网页的 room_id (9999)");

        // 4.1 验证礼物 Tab 切换逻辑
        const tabs = panel.querySelectorAll(".monitor-query__tab");
        const danmakuContent = panel.querySelector(".monitor-query__content-danmaku");
        const giftContent = panel.querySelector(".monitor-query__content-gift");
        assert.ok(danmakuContent && giftContent, "必须包含弹幕与礼物内容分栏容器");

        // 默认弹幕激活
        assert.strictEqual(danmakuContent.style.display !== "none", true, "默认弹幕内容可见");
        assert.strictEqual(giftContent.style.display, "none", "默认礼物内容隐藏");

        // 切换到礼物 Tab
        tabs[1].dispatchEvent(new winMonitor.Event("click", { bubbles: true }));
        assert.strictEqual(danmakuContent.style.display, "none", "切换后弹幕内容隐藏");
        assert.strictEqual(giftContent.style.display, "flex", "切换后礼物内容显示");

        // 4.2 验证礼物条形图容器与渲染骨架
        const chartContainer = panel.querySelector(".monitor-query__chart-container");
        assert.ok(chartContainer, "必须存在条形图容器 .monitor-query__chart-container");

        // 测试骨架渲染函数接收 [{name: '火星包', val: 12928}, ...]
        const mockGiftData = [
            { name: "火星包", val: 10000 },
            { name: "洞主", val: 5000 },
            { name: "余小C", val: 2500 }
        ];
        monitorApi.renderGiftChart(mockGiftData);

        const rows = chartContainer.querySelectorAll(".monitor-chart__row");
        assert.strictEqual(rows.length, 3, "必须渲染出 3 个图表行");
        assert.strictEqual(rows[0].querySelector(".monitor-chart__name").textContent, "火星包");
        assert.strictEqual(rows[0].querySelector(".monitor-chart__bar-fill").style.height, "100%", "最大值对应 100% 高度");
        assert.strictEqual(rows[1].querySelector(".monitor-chart__bar-fill").style.height, "50%", "半数对应 50% 高度");
        assert.strictEqual(rows[2].querySelector(".monitor-chart__bar-fill").style.height, "25%", "四分之一对应 25% 高度");

        // 验证 CSS 中适配整体的橙色渐变背景
        assert.ok(EXPANEL_CSS.includes(".monitor-chart__bar-fill"), "ExPanel.css 中必须包含 .monitor-chart__bar-fill 样式");
        assert.ok(
            EXPANEL_CSS.includes("linear-gradient") && (
                (EXPANEL_CSS.includes("#FFA033") && EXPANEL_CSS.includes("#FF6000")) ||
                (EXPANEL_CSS.includes("#9D92FF") && EXPANEL_CSS.includes("#6D5DFC"))
            ),
            ".monitor-chart__bar-fill 必须配置适配整体的渐变背景 (linear-gradient)"
        );

        domMonitor.window.close();
        console.log("✓ 场景 7 通过: 监控室居中、同屏状态清空、主播下拉框接口对接与礼物条形图渲染 4 项深度修复全链路验证通过");
    });
}

try {
    testExpandToolCardRemoved();
    testInsertIsIdempotent();
    testNewOnlineToolsDockAndPanel();
    testExPanelIntegration();
    testMonitorQueryFeature();
    testMonitorApiIntegration().then(() => {
        return testMonitorAndPopupPlayerFourFixes();
    }).then(() => {
        console.log("=== 「在线工具」重构与监控室查询 7 组场景全部通过 ===");
    }).catch((e) => {
        console.error("测试失败:", e && e.stack ? e.stack : e);
        process.exit(1);
    });
} catch (e) {
    console.error("测试失败:", e && e.stack ? e.stack : e);
    process.exit(1);
}

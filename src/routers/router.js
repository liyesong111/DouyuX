function initRouter(href) {
    if (String(href).indexOf("xinlvjiang.icu") !== -1) {
        initRouter_Xinlvjiang();
        return;
    }
    // 路由转发
    if (String(href).indexOf("yuba.douyu.com") !== -1) {
        // 鱼吧
        if (String(href).indexOf("?exRestore") !== -1) {
            initPkg_RestoreYuba_restore();
        } else if (String(href).indexOf("?exClean") !== -1) {
            initRouter_CleanYuba();
        } else {
            initRouter_Yuba();
        }
    } else if (String(href).indexOf("passport.douyu.com") !== -1 && String(href).indexOf("exid=chun") !== -1) {
        // 账号
        initRouter_Passport();
    } else if (String(href).indexOf("msg.douyu.com") !== -1) {
        if (href.indexOf("?exClean") !== -1) {
            initRouter_CleanMsg();
        }
    } else if (String(href).indexOf("v.douyu.com") !== -1) {
        // 视频
        if (String(href).indexOf("?exClean") !== -1) {
            initRouter_CleanVideo();
        } else if (String(href).indexOf("show/") !== -1) {
            initRouter_Video();
        }
    } else if (String(href).indexOf("cz.douyu.com") !== -1) {
        // 充值
        if (String(href).indexOf("?exClean") !== -1) {
            initRouter_CleanCz();
        }
    } else if (String(href).indexOf("getFansBadgeList") !== -1) {
        // 粉丝牌
        initRouter_FansBadgeList();
    } else {
        if (String(href).indexOf("exid=chun") !== -1) {
            // 主站
            initRouter_DouyuRoom_Popup();
        } else {
            if (String(href).indexOf("template/") !== -1 || String(href).indexOf("h5/") !== -1) {
                return;
            }
            initRouter_DouyuRoom_Main();
        }
    }
}

function initRouter_DouyuRoom_Popup() {
    // 画中画
    removeAD();
    let intID = setInterval(() => {
        if (typeof (document.querySelector('div.wfs-2a8e83')) !== "undefined") {
            document.querySelector('div.wfs-2a8e83').click();
            document.querySelector('label.layout-Player-asidetoggleButton').click();
            let l = document.querySelectorAll(".tip-e3420a > ul > li").length;
            document.querySelectorAll(".tip-e3420a > ul > li")[l - 1].click();
            clearInterval(intID);
        }
    }, 1000);
}


function initRouter_DouyuRoom_Main() {
    // 主要
    document.domain = "douyu.com";
    init();
    // ⚠ 这里是**整份插件唯一的初始化入口**，所以这道门槛必须"一定会打开"。
    // 原实现要求「弹幕区」与「背包入口（.BackpackButton 或 #js-backpack-enter）」同时在场，
    // 否则只是每秒空跑一次、永不放弃 —— 而背包入口跟插件毫无关系：页面版式一变，
    // 或用户装了清理页面元素/广告拦截类扩展把它去掉，整份插件就永远不会初始化，
    // 用户看到的就是"脚本没加载出来"，刷新一次可能又好了（取决于那次它渲染没渲染）。
    // 现在：最多等 15 秒，到点无论元素齐不齐都继续初始化（单包异常已由 initPkg_Safe 隔离），
    // 宁可少几个入口，也不能整份插件不加载；等不到时留一条线索便于定位。
    let waited = 0;
    let intID = setInterval(() => {
        let dom1 = document.getElementsByClassName("BackpackButton")[0];
        let dom2 = document.getElementsByClassName("Barrage-main")[0];
        let dom3 = document.querySelector("#js-backpack-enter")
        waited++;
        const ready = !!dom2 && (!!dom1 || !!dom3);
        if (!ready && waited < 15) {
            return;
        }
        if (!ready) {
            console.warn(
                "[DouyuX] 未等到预期页面元素（弹幕区: " + !!dom2 +
                "，背包入口: " + (!!dom1 || !!dom3) +
                "），已等待 " + waited + " 秒，仍继续初始化"
            );
        }
        setTimeout(() => {
            initStyles();
            initPkg();
            initPkgSpecial();
            initTimer();
        }, 1500)
        clearInterval(intID);
    }, 1000);
}

function initPkgSpecial() {
}

// function initRouter_Novel() {
//     startWatchNovel();
// }

function initRouter_Yuba() {
    document.domain = "douyu.com";
    RestoreYuba_checkRedirect();
}

function initRouter_Passport() {
    let cmd = getStrMiddle(window.location.href, "cmd=", "&");
    let uid = getStrMiddle(window.location.href, "uid=", "&");
    let domain = getStrMiddle(window.location.href, "domain=", "&");
    if (cmd !== "clean") {
        addAccountPassport(uid);
    }
    switch (cmd) {
        case "clean":
            // 清空cookie，用于重新登录
            cleanCookie(() => {
                window.parent.postMessage("cleanOver", decodeURIComponent(domain));
            });
            break;
        case "switch":
            // 切换用户
            switchAccountPassport(uid, () => {
                window.parent.postMessage("switchOver", decodeURIComponent(domain));
            });
            break;
        case "delete":
            // 删除用户
            deleteAccountPassport(uid, () => {
                window.parent.postMessage("deleteOver", decodeURIComponent(domain));
            });
            break;
        default:
            break;
    }
    return;
}

function initRouter_CleanMsg() {
    let domain = getStrMiddle(window.location.href, "domain=", "&");
    cleanCookie(() => {
        window.parent.postMessage("msgCleanOver", decodeURIComponent(domain));
    });
}

function initRouter_CleanYuba() {
    let domain = getStrMiddle(window.location.href, "domain=", "&");
    cleanCookie(() => {
        window.parent.postMessage("yubaCleanOver", decodeURIComponent(domain));
    });
}

function initRouter_CleanVideo() {
    let domain = getStrMiddle(window.location.href, "domain=", "&");
    cleanCookie(() => {
        window.parent.postMessage("videoCleanOver", decodeURIComponent(domain));
    });
}

function initRouter_CleanCz() {
    let domain = getStrMiddle(window.location.href, "domain=", "&");
    cleanCookie(() => {
        window.parent.postMessage("czCleanOver", decodeURIComponent(domain));
    });
}

function initRouter_Video() {
    if (unsafeWindow.$DATA && "ROOM" in unsafeWindow.$DATA) {
        // 在视频观看页面
        initStyles();
        initPkg_VideoTime();
        initPkg_VideoTools_Camera_Video();
        initPkg_DyVideoDownload();
        initPkg_DyVideoBarrageLine();
    }
}

function initRouter_FansBadgeList() {
    initPkg_FansBadgeList();
}

function initRouter_Xinlvjiang() {
    try {
        window.localStorage.setItem("lvjiang-cup:theme", "dark");
        window.localStorage.setItem("lvjiang-cup:palette", "crimson");
        window.localStorage.setItem("lvjiang-cup:appearance", "fortress");
    } catch (_) {}

    function applyDarkTheme() {
        try {
            if (document.documentElement) {
                document.documentElement.setAttribute("data-theme", "dark");
                document.documentElement.dataset.theme = "dark";
                document.documentElement.dataset.palette = "crimson";
                document.documentElement.dataset.appearance = "fortress";
                document.documentElement.style.setProperty("color-scheme", "dark", "important");
                document.documentElement.style.setProperty("background", "#141518", "important");
            }
            if (document.body) {
                document.body.setAttribute("data-theme", "dark");
                document.body.dataset.theme = "dark";
                document.body.dataset.palette = "crimson";
                document.body.dataset.appearance = "fortress";
                document.body.style.setProperty("color-scheme", "dark", "important");
                document.body.style.setProperty("background", "#141518", "important");
            }
        } catch (_) {}
    }
    applyDarkTheme();

    // 早期同步注入暗色兜底样式，从源头消灭页面卸载/加载间隙的任何白色闪烁
    (function injectEarlyDarkStyle() {
        var s = document.getElementById("douyux-early-dark") || document.createElement("style");
        s.id = "douyux-early-dark";
        s.textContent = ":root, html, body, dialog, dialog.profile-preview-dialog, .site-main, .player-page, [data-profile-page], .player-dossier, .teams-page, .players-page { background: #141518 !important; color-scheme: dark !important; color: #E2E8F0 !important; }";
        if (!s.parentNode) {
            (document.head || document.documentElement).appendChild(s);
        }
    })();

    function injectXinlvjiangStyles() {
        if (document.getElementById("douyux-xinlvjiang-style")) return;
        var style = document.createElement("style");
        style.id = "douyux-xinlvjiang-style";
        style.textContent = [
            ":root, html, body, .site-main, .player-page, [data-profile-page], .player-dossier, .teams-page, .players-page, .team-workspace, .lineup-five, .catalog-results {",
            "    background: #141518 !important;",
            "    color: #E2E8F0 !important;",
            "    color-scheme: dark !important;",
            "    scrollbar-width: thin !important;",
            "    scrollbar-color: rgba(255, 102, 0, 0.4) transparent !important;",
            "}",
            "::-webkit-scrollbar {",
            "    width: 6px !important;",
            "    height: 6px !important;",
            "}",
            "::-webkit-scrollbar-thumb {",
            "    background: rgba(255, 102, 0, 0.35) !important;",
            "    border-radius: 3px !important;",
            "}",
            "::-webkit-scrollbar-thumb:hover {",
            "    background: rgba(255, 102, 0, 0.65) !important;",
            "}",
            "/* 战队阵容页隐藏原站冗余顶栏与装饰，让大视野服务于战队与选手内容 */",
            ".teams-page .site-header,",
            ".site-scenery,",
            ".navigation-progress,",
            ".skip-link {",
            "    display: none !important;",
            "}",
            "/* 阵容页（teams）优化：隐藏左侧 16 战队冗余列表，阵容居中大视野展示 */",
            ".teams-page .team-workspace {",
            "    display: block !important;",
            "    grid-template-columns: none !important;",
            "    max-width: 1240px !important;",
            "    margin: 0 auto !important;",
            "    padding: 16px 20px 40px !important;",
            "    background: transparent !important;",
            "}",
            ".teams-page .team-selector-rail {",
            "    display: none !important;",
            "}",
            ".teams-page .team-detail {",
            "    width: 100% !important;",
            "    max-width: 100% !important;",
            "    background: transparent !important;",
            "}",
            ".teams-page .team-identity {",
            "    background: rgba(26, 28, 34, 0.9) !important;",
            "    border: 1px solid rgba(215, 184, 117, 0.28) !important;",
            "    border-radius: 12px !important;",
            "    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;",
            "    backdrop-filter: blur(12px) !important;",
            "    padding: 14px 20px !important;",
            "    margin-bottom: 20px !important;",
            "}",
            ".teams-page .team-identity h2 {",
            "    color: #F8FAFC !important;",
            "}",
            ".teams-page .team-record .team-milestone {",
            "    color: #D7B875 !important;",
            "}",
            ".teams-page .roster-five,",
            ".teams-page .lineup-five {",
            "    display: flex !important;",
            "    justify-content: center !important;",
            "    align-items: flex-start !important;",
            "    gap: 24px !important;",
            "    flex-wrap: wrap !important;",
            "    padding: 10px 0 30px !important;",
            "    background: transparent !important;",
            "}",
            ".teams-page .lineup-slot {",
            "    display: flex !important;",
            "    justify-content: center !important;",
            "    min-width: 200px !important;",
            "    background: transparent !important;",
            "}",
            "/* 选手列表页（players）布局优化 */",
            ".players-page .site-main {",
            "    max-width: 1300px !important;",
            "    margin: 0 auto !important;",
            "    padding: 16px 20px 40px !important;",
            "    background: transparent !important;",
            "}",
            ".players-page .catalog-style-gallery {",
            "    background: rgba(26, 28, 34, 0.85) !important;",
            "    border: 1px solid rgba(255, 255, 255, 0.08) !important;",
            "    border-radius: 12px !important;",
            "}",
            ".players-page .catalog-results {",
            "    padding-top: 16px !important;",
            "    background: transparent !important;",
            "}",
            "/* 选手详情页（player-dossier）官方标准布局保真与视窗适配 */",
            ".player-dossier {",
            "    max-width: 1360px !important;",
            "    margin: 0 auto !important;",
            "    padding: 0 16px 40px !important;",
            "}",
            "/* 赛程页（schedule）官方布局保真与视窗适配 */",
            ".schedule-page .site-main {",
            "    max-width: 1400px !important;",
            "    margin: 0 auto !important;",
            "    padding: 10px 16px 40px !important;",
            "    background: transparent !important;",
            "}",
            ".schedule-stagebar {",
            "    background: rgba(26, 28, 34, 0.9) !important;",
            "    border: 1px solid rgba(255, 255, 255, 0.08) !important;",
            "    border-radius: 12px !important;",
            "    padding: 8px 16px !important;",
            "    margin-bottom: 16px !important;",
            "    backdrop-filter: blur(12px) !important;",
            "}",
            ".profile-return-row {",
            "    background: rgba(26, 28, 34, 0.95) !important;",
            "    border: 1px solid rgba(215, 184, 117, 0.35) !important;",
            "    border-radius: 12px !important;",
            "    padding: 10px 20px !important;",
            "    margin: 10px auto 16px !important;",
            "    max-width: 1360px !important;",
            "    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;",
            "    display: flex !important;",
            "    align-items: center !important;",
            "    justify-content: space-between !important;",
            "    position: sticky !important;",
            "    top: 6px !important;",
            "    z-index: 50 !important;",
            "}",
            ".profile-return-row .back-link {",
            "    color: #FF8800 !important;",
            "    font-weight: 700 !important;",
            "    font-size: 14px !important;",
            "    display: inline-flex !important;",
            "    align-items: center !important;",
            "    gap: 6px !important;",
            "    text-decoration: none !important;",
            "    cursor: pointer !important;",
            "    transition: all 0.2s ease !important;",
            "}",
            ".profile-return-row .back-link:hover {",
            "    color: #FFAA33 !important;",
            "    text-decoration: none !important;",
            "    transform: translateX(-3px) !important;",
            "}",
            "/* 选手卡片交互：悬停微浮发光、手型指针 */",
            ".player-card,",
            ".player-card *,",
            ".player-card-link,",
            ".player-card-link * {",
            "    cursor: pointer !important;",
            "}",
            ".player-card {",
            "    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease !important;",
            "}",
            ".player-card:hover {",
            "    transform: translateY(-4px) scale(1.015) !important;",
            "    box-shadow: 0 10px 28px rgba(215, 184, 117, 0.35) !important;",
            "    z-index: 5 !important;",
            "}",
            "/* 资料快览弹窗（简洁介绍）：暗黑质感、金边微光、视窗自适应与平滑居中 */",
            "dialog.profile-preview-dialog,",
            "[data-profile-dialog] {",
            "    position: fixed !important;",
            "    top: 50% !important;",
            "    left: 50% !important;",
            "    transform: translate(-50%, -50%) !important;",
            "    width: min(1040px, calc(100vw - 32px)) !important;",
            "    max-height: calc(100vh - 40px) !important;",
            "    background: #14161B !important;",
            "    color: #E2E8F0 !important;",
            "    color-scheme: dark !important;",
            "    border: 1px solid rgba(215, 184, 117, 0.45) !important;",
            "    border-radius: 16px !important;",
            "    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.95), 0 0 35px rgba(215, 184, 117, 0.12) !important;",
            "    overflow-y: auto !important;",
            "    padding: 0 !important;",
            "    margin: 0 !important;",
            "    z-index: 2147483647 !important;",
            "}",
            "dialog.profile-preview-dialog::backdrop,",
            "[data-profile-dialog]::backdrop {",
            "    background: rgba(8, 10, 14, 0.85) !important;",
            "    backdrop-filter: blur(10px) !important;",
            "    -webkit-backdrop-filter: blur(10px) !important;",
            "}",
            ".profile-preview-dialog .profile-preview-toolbar {",
            "    background: rgba(26, 28, 34, 0.98) !important;",
            "    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;",
            "    position: sticky !important;",
            "    top: 0 !important;",
            "    z-index: 10 !important;",
            "    display: flex !important;",
            "    align-items: center !important;",
            "    justify-content: space-between !important;",
            "    padding: 12px 20px !important;",
            "}",
            ".profile-preview-dialog .profile-preview-toolbar span {",
            "    color: #CBD5E1 !important;",
            "    font-weight: 700 !important;",
            "    font-size: 15px !important;",
            "}",
            "/* 简洁介绍弹窗右下角「查看详情」高亮与手型指针 */",
            ".profile-preview-actions .button,",
            ".profile-preview-actions a {",
            "    cursor: pointer !important;",
            "    font-weight: 600 !important;",
            "    transition: all 0.2s ease !important;",
            "}",
            ".profile-preview-actions .button:hover,",
            ".profile-preview-actions a:hover {",
            "    transform: translateY(-1px) !important;",
            "    box-shadow: 0 6px 20px rgba(184, 50, 72, 0.45) !important;",
            "}",
            "/* 选手大厅筛选表单与提交按钮强力优化：杜绝假死与红字报错 */",
            ".catalog-has-error .catalog-live-status {",
            "    display: none !important;",
            "}",
            ".catalog-filter-actions .catalog-submit,",
            ".catalog-submit {",
            "    display: inline-flex !important;",
            "    visibility: visible !important;",
            "    opacity: 1 !important;",
            "    cursor: pointer !important;",
            "}",
            ".catalog-reset,",
            "[data-catalog-reset] {",
            "    cursor: pointer !important;",
            "}",
            "@keyframes ex-spin {",
            "    0% { transform: rotate(0deg); }",
            "    100% { transform: rotate(360deg); }",
            "}"
        ].join("\n");
        (document.head || document.documentElement).appendChild(style);
    }

    function syncScheduleStateToParent() {
        if (!window.parent || window.parent === window) return;
        try {
            var href = window.location.href;
            if (href.indexOf("/schedule") !== -1) {
                var stage = "swiss";
                var view = "bracket";
                if (href.indexOf("stage=playoff") !== -1) stage = "playoff";
                else if (href.indexOf("stage=swiss") !== -1) stage = "swiss";
                if (href.indexOf("view=list") !== -1) view = "list";
                else if (href.indexOf("view=bracket") !== -1) view = "bracket";

                window.parent.postMessage({
                    type: "lvjiang_schedule_sync",
                    stage: stage,
                    view: view
                }, "*");
            }
            window.parent.postMessage({
                type: "lvjiang_url_change",
                url: href,
                pathname: window.location.pathname
            }, "*");
        } catch (_) {}
    }

    var interactionsBound = false;
    function bindInteractions() {
        syncScheduleStateToParent();
        if (interactionsBound) return;
        interactionsBound = true;

        function getCleanSearch() {
            try {
                var search = window.location.search || "";
                return search.replace(/[?&]_t=\d+/g, "").replace(/^\?&/, "?");
            } catch (_) {
                return window.location.search || "";
            }
        }

        function safeNavigate(url) {
            if (!url) return;
            url = String(url).replace(/&amp;/g, "&");
            if (typeof window !== "undefined" && typeof window.__TEST_NAVIGATE__ === "function") {
                window.__TEST_NAVIGATE__(url);
                return;
            }

            var targetFullUrl = "";
            try {
                targetFullUrl = new URL(url, window.location.origin).href;
            } catch (_) {
                targetFullUrl = url;
            }

            // 1. 若当前快览模态框处于 open 状态，先关闭以解除模态事件循环锁
            try {
                var d = document.querySelector("dialog.profile-preview-dialog, [data-profile-dialog]");
                if (d && typeof d.close === "function" && d.open) {
                    d.close();
                }
            } catch (_) {}

            // 2. 向父页面（斗鱼）派发新路由通知，保持外部“新标签页打开”按钮与 URL 状态同步
            if (window.parent && window.parent !== window) {
                try {
                    window.parent.postMessage({
                        type: "lvjiang_url_change",
                        url: targetFullUrl,
                        pathname: new URL(targetFullUrl).pathname
                    }, "*");
                } catch (_) {}
            }

            try {
                if (document.body) {
                    document.body.style.opacity = "0.75";
                    document.body.style.transition = "opacity 0.15s ease";
                }
            } catch (_) {}

            // 3. 动态原生 <a> 点击通道：在所有跨域/油猴沙箱 iframe 中原生权重最高、兼容性最强
            try {
                var navA = document.createElement("a");
                navA.href = targetFullUrl;
                navA.target = "_self";
                navA.style.display = "none";
                (document.body || document.documentElement).appendChild(navA);
                navA.click();
                setTimeout(function () {
                    try { navA.remove(); } catch (_) {}
                }, 300);
            } catch (_) {}

            // 4. window.location 与 unsafeWindow.location 双重通道保障
            try {
                window.location.href = targetFullUrl;
            } catch (err1) {
                try {
                    var realWin = typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window;
                    realWin.location.href = targetFullUrl;
                } catch (err2) {
                    try {
                        window.location.assign(targetFullUrl);
                    } catch (_) {}
                }
            }
        }

        function extractEntrantId(card) {
            if (!card) return "";
            var id = card.getAttribute("data-entrant-card") ||
                     card.getAttribute("data-player-id") ||
                     card.getAttribute("data-profile-entrant") ||
                     card.getAttribute("data-player") ||
                     card.getAttribute("data-id");
            if (id && /^\d+$/.test(id)) return id;

            var link = card.tagName === "A" ? card : (
                (card.closest ? card.closest("a[href*='/players/'], a[href*='/previews/players/']") : null) ||
                card.querySelector("a.player-card-link, a[href*='/players/'], a[href*='/previews/players/']")
            );
            var href = link ? (link.href || link.getAttribute("href") || "") : "";
            var m = href.match(/\/players\/(\d+)/) || href.match(/\/previews\/players\/(\d+)/);
            if (m && m[1]) return m[1];

            var previewAttr = (card.getAttribute && card.getAttribute("data-profile-preview")) ||
                              (link ? link.getAttribute("data-profile-preview") : "");
            if (previewAttr) {
                var pm = previewAttr.match(/\/players\/(\d+)/) || previewAttr.match(/\/previews\/players\/(\d+)/);
                if (pm && pm[1]) return pm[1];
            }
            return "";
        }

        function ensureReturnBar() {
            if (document.querySelector(".profile-return-row, .back-link")) return;
            var container = document.querySelector("#main, .player-dossier, .site-main");
            if (!container) return;

            var returnUrl = "";
            try {
                var sp = new URLSearchParams(window.location.search);
                returnUrl = sp.get("return_to") || "";
            } catch (_) {}
            if (!returnUrl) {
                returnUrl = "/teams/?event=lvjiangbeiS3";
            }

            var row = document.createElement("div");
            row.className = "profile-return-row";
            row.innerHTML = '<a class="back-link" href="' + returnUrl + '">← 返回（战队阵容 / 选手列表）</a>';
            container.insertBefore(row, container.firstChild);
        }

        if (window.location.pathname.indexOf("/players/") !== -1 || document.querySelector(".player-dossier")) {
            ensureReturnBar();
        }

        function buildCatalogFilterUrl(form) {
            if (!form) return "";
            var basePath = form.getAttribute("action") || window.location.pathname || "/players/";
            if (basePath.indexOf("/players") === -1) basePath = "/players/";
            var sp = new URLSearchParams();
            sp.set("event", "lvjiangbeiS3");

            try {
                var formData = new FormData(form);
                formData.forEach(function (val, key) {
                    var v = String(val || "").trim();
                    if (!v) return;
                    if (key === "event") return;
                    if (key === "ascending" && v === "0") return;
                    sp.set(key, v);
                });
            } catch (_) {
                var elements = form.elements || [];
                for (var j = 0; j < elements.length; j++) {
                    var el = elements[j];
                    if (!el.name || el.type === "submit" || el.name === "event") continue;
                    var val2 = String(el.value || "").trim();
                    if (!val2) continue;
                    if (el.type === "checkbox") {
                        if (el.checked) sp.set(el.name, "1");
                    } else {
                        sp.set(el.name, val2);
                    }
                }
            }

            var ascCheck = form.querySelector('input[name="ascending"][type="checkbox"]');
            if (ascCheck) {
                if (ascCheck.checked) sp.set("ascending", "1");
                else sp.delete("ascending");
            }

            if (!sp.has("page_size")) {
                sp.set("page_size", "24");
            }

            return basePath + (basePath.endsWith("/") ? "" : "/") + "?" + sp.toString();
        }

        function setupPlayerCatalogFilter() {
            var form = document.querySelector("[data-catalog-form], .catalog-filter");
            if (!form) return;

            var workspace = form.closest("[data-player-catalog], .catalog-workspace") || document.body;
            if (workspace && workspace.classList) {
                workspace.classList.remove("catalog-has-error");
            }
            var status = document.querySelector("[data-catalog-status], .catalog-live-status");
            if (status && (status.textContent.indexOf("失败") !== -1 || status.textContent.indexOf("超时") !== -1)) {
                status.textContent = "";
            }

            if (form.__douyux_filter_bound) return;
            form.__douyux_filter_bound = true;

            form.addEventListener("submit", function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
                var url = buildCatalogFilterUrl(form);
                if (url) safeNavigate(url);
            }, true);

            form.addEventListener("change", function (ev) {
                if (!ev.target) return;
                var tag = (ev.target.tagName || "").toUpperCase();
                if (tag === "SELECT" || (tag === "INPUT" && ev.target.type === "checkbox")) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
                    var url = buildCatalogFilterUrl(form);
                    if (url) safeNavigate(url);
                }
            }, true);
        }

        function stripPreviewAttributes() {
            try {
                var cards = document.querySelectorAll(".player-card, [data-entrant-card], [data-player-id]");
                for (var i = 0; i < cards.length; i++) {
                    var card = cards[i];
                    card.removeAttribute("data-profile-preview");
                    card.removeAttribute("aria-haspopup");
                    var link = card.querySelector("a.player-card-link, a[href*='/players/'], a[href*='/previews/players/']");
                    if (link) {
                        link.removeAttribute("data-profile-preview");
                        link.removeAttribute("aria-haspopup");
                        var eid = extractEntrantId(card);
                        if (eid) {
                            var curSearch = getCleanSearch();
                            var curRet = encodeURIComponent(window.location.pathname + curSearch);
                            link.setAttribute("href", "/players/" + eid + "/?event=lvjiangbeiS3&return_to=" + curRet);
                        }
                    }
                }
            } catch (_) {}
        }

        // 委托点击事件：全场景无缝分流与选手卡片直达详情
        function handleDelegateClick(e) {
            if (!e.target) return;

            // ① 直播间外链放行，供用户在新标签页打开主播房间
            if (e.target.closest && e.target.closest(".card-room-entry, .profile-live-link")) {
                return;
            }

            // ② 筛选提交按钮（"筛选" / "应用筛选"）：拦截并统一走 safeNavigate 干净导航
            var submitBtn = e.target.closest && e.target.closest(".catalog-submit, button[type='submit'], input[type='submit']");
            if (submitBtn) {
                var cForm = submitBtn.closest("form") || document.querySelector("[data-catalog-form], .catalog-filter");
                if (cForm) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                    var fUrl = buildCatalogFilterUrl(cForm);
                    if (fUrl) safeNavigate(fUrl);
                    return;
                }
            }

            // ③ 筛选重置按钮：拦截并直达默认选手列表
            var resetBtn = e.target.closest && e.target.closest(".catalog-reset, [data-catalog-reset]");
            if (resetBtn) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                safeNavigate("/players/?event=lvjiangbeiS3&page_size=24");
                return;
            }

            // ④ 能力维度排序按钮（KDA, 参团率, 伤害占比等）
            var dimBtn = e.target.closest && e.target.closest("button[data-catalog-dimension-sort]");
            if (dimBtn) {
                var dimForm = dimBtn.closest("form") || document.querySelector("[data-catalog-form], .catalog-filter");
                var dimVal = dimBtn.getAttribute("data-catalog-dimension-sort") || dimBtn.value || "";
                if (dimVal && dimForm) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                    var sortSelect = dimForm.querySelector("select[name='sort']");
                    if (sortSelect) sortSelect.value = dimVal;
                    var ascField = dimForm.querySelector("input[name='ascending']");
                    if (ascField) {
                        if (ascField.type === "checkbox") ascField.checked = false;
                        else ascField.value = "0";
                    }
                    var dimUrl = buildCatalogFilterUrl(dimForm);
                    if (dimUrl) safeNavigate(dimUrl);
                    return;
                }
            }

            // ⑤ 评级样式预览卡筛选链接（S+, S, A, B, C, D）
            var gradeLink = e.target.closest && e.target.closest("[data-grade-filter], .catalog-style-card a");
            if (gradeLink) {
                var gHref = gradeLink.getAttribute("href") || gradeLink.href || "";
                if (gHref) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                    safeNavigate(gHref);
                    return;
                }
            }

            // ⑥ 分页链接（上一页、下一页、第N页）
            var pageLink = e.target.closest && e.target.closest("a[data-catalog-page], nav.pagination a");
            if (pageLink) {
                var pHref = pageLink.getAttribute("href") || pageLink.href || "";
                if (pHref) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                    safeNavigate(pHref);
                    return;
                }
            }

            // ⑦ 表单输入文本、对比选择复选框放行交互
            if (e.target.closest && e.target.closest("input, select, textarea, label.catalog-compare-choice")) {
                return;
            }

            // ⑧ 简洁介绍弹窗（资料快览）右下角「查看详情」：点击直达该选手官方详情页，并精准拼接双层 return_to
            var actionLink = e.target.closest && e.target.closest(".profile-preview-actions a, .profile-preview-actions .button, [data-preview-actions] a");
            if (actionLink) {
                var rawHref = actionLink.getAttribute("href") || actionLink.href || "";
                var m = rawHref.match(/\/players\/(\d+)/);
                var entrantId = m && m[1] ? m[1] : "";
                if (!entrantId) {
                    var dossier = actionLink.closest ? actionLink.closest("[data-profile-dialog], .profile-preview-dialog, .profile-preview-player") : null;
                    if (dossier) entrantId = extractEntrantId(dossier);
                }

                var curSearch = getCleanSearch();
                var currentReturn = encodeURIComponent(window.location.pathname + curSearch);
                var destUrl = "";
                if (entrantId) {
                    destUrl = "/players/" + entrantId + "/?event=lvjiangbeiS3&return_to=" + currentReturn;
                } else if (rawHref) {
                    try {
                        var u = new URL(rawHref, window.location.origin);
                        u.searchParams.set("return_to", window.location.pathname + curSearch);
                        destUrl = u.pathname + u.search;
                    } catch (_) {
                        destUrl = rawHref;
                    }
                }

                if (destUrl) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                    actionLink.href = destUrl;
                    actionLink.target = "_self";
                    safeNavigate(destUrl);
                }
                return;
            }

            // ⑨ 选手详情页中的返回链接（← 返回战队阵容 / ← 返回选手）平滑回退
            var backBtn = e.target.closest && e.target.closest(".back-link, .profile-return-row a");
            if (backBtn) {
                var backTarget = backBtn.getAttribute("href") || backBtn.href;
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                if (backTarget) {
                    safeNavigate(backTarget);
                } else {
                    var realWin = typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window;
                    if (realWin.history && realWin.history.length > 1) {
                        realWin.history.back();
                    } else {
                        safeNavigate("/teams/?event=lvjiangbeiS3");
                    }
                }
                return;
            }

            // ⑩ 处于选手卡片区域内的点击：无论是阵容页还是选手大厅，一律直达该选手详情页面
            var card = e.target.closest && e.target.closest(".player-card, .catalog-player-card, [data-entrant-card], [data-player-id]");
            if (!card) return;

            // 评级样式预览卡（S+, S, A... 纯卡面展示）放行已由上述 ⑤ 截获，未匹配则跳过
            if (card.classList && card.classList.contains("catalog-style-card")) {
                return;
            }

            // 当前已在选手自身详情页左侧主卡（.dossier-identity）内时，无需重复操作
            if (card.closest && card.closest(".dossier-identity")) {
                return;
            }

            var eid = extractEntrantId(card);
            var destHref = "";
            var curSearch2 = getCleanSearch();
            var curRet2 = encodeURIComponent(window.location.pathname + curSearch2);

            if (eid) {
                destHref = "/players/" + eid + "/?event=lvjiangbeiS3&return_to=" + curRet2;
            } else {
                var playerLink = card.querySelector("a.player-card-link, a[href*='/players/']");
                destHref = playerLink ? (playerLink.getAttribute("href") || playerLink.href || "") : "";
            }

            if (destHref) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") {
                    e.stopImmediatePropagation();
                }
                safeNavigate(destHref);
            }
        }

        document.addEventListener("click", handleDelegateClick, true);
        setupPlayerCatalogFilter();
        stripPreviewAttributes();
    }

    applyDarkTheme();
    injectXinlvjiangStyles();
    bindInteractions();
    syncScheduleStateToParent();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            applyDarkTheme();
            injectXinlvjiangStyles();
            bindInteractions();
            syncScheduleStateToParent();
        });
    }

    if (typeof MutationObserver !== "undefined") {
        try {
            var mutObserver = new MutationObserver(function () {
                bindInteractions();
            });
            mutObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
        } catch (_) {}
    }

    var checkCount = 0;
    var themeTimer = setInterval(function () {
        applyDarkTheme();
        injectXinlvjiangStyles();
        bindInteractions();
        syncScheduleStateToParent();
        checkCount++;
        if (checkCount > 15) clearInterval(themeTimer);
    }, 300);
}

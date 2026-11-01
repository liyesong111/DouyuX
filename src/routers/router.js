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
        s.textContent = ":root, html, body, .site-main, .player-page, [data-profile-page], .teams-page, .players-page { background: #141518 !important; color-scheme: dark !important; color: #E2E8F0 !important; }";
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
            "/* 隐藏原站顶栏与全屏装饰，让 iframe 内部空间全部服务于赛事内容 */",
            ".site-header,",
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
            "/* 彻底屏蔽快览弹窗（dialog / profile-preview-dialog），杜绝任何简略快览弹窗产生 */",
            "dialog,",
            "dialog.profile-preview-dialog,",
            "[data-profile-dialog] {",
            "    display: none !important;",
            "    visibility: hidden !important;",
            "    opacity: 0 !important;",
            "    pointer-events: none !important;",
            "}",
            "dialog::backdrop,",
            "dialog.profile-preview-dialog::backdrop,",
            "[data-profile-dialog]::backdrop {",
            "    display: none !important;",
            "    background: transparent !important;",
            "}"
        ].join("\n");
        (document.head || document.documentElement).appendChild(style);
    }

    function stripPreviewAttributes() {
        try {
            var previews = document.querySelectorAll("[data-profile-preview], [aria-haspopup='dialog']");
            for (var i = 0; i < previews.length; i++) {
                previews[i].removeAttribute("data-profile-preview");
                previews[i].removeAttribute("aria-haspopup");
            }
            var links = document.querySelectorAll("a.player-card-link, a[href*='/players/'], a[href*='/previews/players/']");
            for (var k = 0; k < links.length; k++) {
                var lk = links[k];
                lk.removeAttribute("data-profile-preview");
                lk.removeAttribute("aria-haspopup");
                lk.target = "_self";
                var curHref = lk.getAttribute("href") || "";
                if (curHref.indexOf("/previews/players/") !== -1) {
                    lk.setAttribute("href", curHref.replace(/\/previews\/players\//, "/players/"));
                }
            }
            var dialogs = document.querySelectorAll("dialog.profile-preview-dialog, [data-profile-dialog]");
            for (var j = 0; j < dialogs.length; j++) {
                if (typeof dialogs[j].close === "function" && dialogs[j].open) {
                    dialogs[j].close();
                }
                dialogs[j].style.setProperty("display", "none", "important");
            }
        } catch (_) {}
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
        stripPreviewAttributes();
        syncScheduleStateToParent();
        if (interactionsBound) return;
        interactionsBound = true;

        function safeNavigate(url) {
            if (!url) return;
            url = String(url).replace(/&amp;/g, "&");
            var absoluteUrl = url;
            try {
                absoluteUrl = new URL(url, window.location.origin).href;
            } catch (_) {}
            try {
                if (document.body) {
                    document.body.style.opacity = "0.75";
                    document.body.style.transition = "opacity 0.15s ease";
                }
            } catch (_) {}

            // 1. 创建合成 <a> 标签并以 target="_self" 原生点击直达，穿透任何代理沙箱
            try {
                var a = document.createElement("a");
                a.href = absoluteUrl;
                a.target = "_self";
                a.rel = "noopener noreferrer";
                a.setAttribute("data-douyux-nav", "1");
                a.style.display = "none";
                (document.body || document.documentElement).appendChild(a);
                a.click();
                setTimeout(function () {
                    try { a.remove(); } catch (_) {}
                }, 300);
            } catch (_) {}

            // 2. 标准 window.location.href 赋值
            try {
                window.location.href = absoluteUrl;
            } catch (_) {}

            // 3. window.location.assign 兜底
            try {
                window.location.assign(absoluteUrl);
            } catch (_) {}

            // 4. unsafeWindow 兜底
            try {
                if (typeof unsafeWindow !== "undefined" && unsafeWindow && unsafeWindow.location) {
                    unsafeWindow.location.href = absoluteUrl;
                }
            } catch (_) {}
        }

        function extractEntrantId(card) {
            if (!card) return "";
            var id = card.getAttribute("data-entrant-card") ||
                     card.getAttribute("data-player-id") ||
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

        function extractTargetUrl(card) {
            if (!card) return "";

            // 0. 若卡片本身即为 <a> 标签且指向选手
            if (card.tagName === "A" && card.href) {
                var href0 = card.href || card.getAttribute("href") || "";
                if (href0 && (href0.indexOf("/players/") !== -1 || href0.indexOf("/previews/players/") !== -1)) {
                    return href0.replace(/\/previews\/players\//, "/players/").replace(/&amp;/g, "&");
                }
            }

            // 1. 若卡片处于外部 <a> 链接内
            var parentLink = card.closest ? card.closest("a[href*='/players/'], a.player-card-link") : null;
            if (parentLink) {
                var hrefP = parentLink.href || parentLink.getAttribute("href") || "";
                if (hrefP && (hrefP.indexOf("/players/") !== -1 || hrefP.indexOf("/previews/players/") !== -1)) {
                    return hrefP.replace(/\/previews\/players\//, "/players/").replace(/&amp;/g, "&");
                }
            }

            // 2. 优先直接获取卡片内部的选手资料链接（DOM属性 link.href 天然解码 HTML 实体）
            var link = card.querySelector("a.player-card-link, a[href*='/players/'], a[href*='/previews/players/']");
            var href = link ? (link.href || link.getAttribute("href") || "") : "";
            if (href && (href.indexOf("/players/") !== -1 || href.indexOf("/previews/players/") !== -1)) {
                return href.replace(/\/previews\/players\//, "/players/").replace(/&amp;/g, "&");
            }

            // 3. 从 data 属性中解析 entrantId
            var entrantId = extractEntrantId(card);
            if (entrantId) {
                var currentReturn = encodeURIComponent(window.location.pathname + window.location.search);
                return "/players/" + entrantId + "/?event=lvjiangbeiS3&return_to=" + currentReturn;
            }
            return "";
        }

        // 委托点击事件：拦截卡片与返回链接，平滑直达选手官方详情页
        function handleDelegateClick(e) {
            if (!e.target) return;

            // 0. 我们自己触发的合成导航链接直接放行，执行原生跳转
            if (e.target && e.target.getAttribute && e.target.getAttribute("data-douyux-nav")) {
                return;
            }

            // ① 直播间外链放行
            if (e.target.closest && e.target.closest(".card-room-entry, .profile-live-link")) {
                return;
            }

            // ② 表单输入控件、对比选择复选框放行
            if (e.target.closest && e.target.closest("input, select, textarea, label.catalog-compare-choice, button[data-catalog-dimension-sort]")) {
                return;
            }

            // ③ 选手详情页中的返回链接（← 返回选手 / ← 返回阵容）平滑回退
            var backBtn = e.target.closest && e.target.closest(".back-link, .profile-return-row a");
            if (backBtn) {
                var backTarget = backBtn.href || backBtn.getAttribute("href");
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                if (backTarget) {
                    safeNavigate(backTarget);
                } else {
                    if (window.history && window.history.length > 1) {
                        window.history.back();
                    } else {
                        safeNavigate("/?event=lvjiangbeiS3");
                    }
                }
                return;
            }

            // ④ 处于选手卡片区域内的点击（覆盖各类类名与属性）
            var card = e.target.closest && e.target.closest(".player-card, .catalog-player-card, [data-entrant-card], [data-player-id], a[href*='/players/'], a.player-card-link");
            if (!card) return;

            // 评级样式预览卡（S+, S, A... 纯卡面展示）放行，交由原站样式筛选
            if (card.classList && card.classList.contains("catalog-style-card")) {
                return;
            }

            // 当前已在选手独立资料页（.player-dossier）内时，左侧自身卡片无需重复跳转
            if (document.querySelector(".player-dossier") && card.closest(".dossier-identity")) {
                return;
            }

            var destUrl = extractTargetUrl(card);
            if (destUrl) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") {
                    e.stopImmediatePropagation();
                }
                safeNavigate(destUrl);
            }
        }

        window.addEventListener("click", handleDelegateClick, true);
        document.addEventListener("click", handleDelegateClick, true);
    }

    try {
        var obs = new MutationObserver(function () {
            stripPreviewAttributes();
        });
        obs.observe(document.documentElement || document.body, {
            childList: true,
            subtree: true
        });
    } catch (_) {}

    applyDarkTheme();
    injectXinlvjiangStyles();
    bindInteractions();
    stripPreviewAttributes();
    syncScheduleStateToParent();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            applyDarkTheme();
            injectXinlvjiangStyles();
            bindInteractions();
            stripPreviewAttributes();
            syncScheduleStateToParent();
        });
    }

    var checkCount = 0;
    var themeTimer = setInterval(function () {
        applyDarkTheme();
        injectXinlvjiangStyles();
        stripPreviewAttributes();
        syncScheduleStateToParent();
        checkCount++;
        if (checkCount > 15) clearInterval(themeTimer);
    }, 300);
}

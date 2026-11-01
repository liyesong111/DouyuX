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
                "[DouyuEx] 未等到预期页面元素（弹幕区: " + !!dom2 +
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
                document.documentElement.style.colorScheme = "dark";
            }
            if (document.body) {
                document.body.setAttribute("data-theme", "dark");
                document.body.dataset.theme = "dark";
                document.body.dataset.palette = "crimson";
            }
        } catch (_) {}
    }
    applyDarkTheme();

    function injectXinlvjiangStyles() {
        if (document.getElementById("douyux-xinlvjiang-style")) return;
        var style = document.createElement("style");
        style.id = "douyux-xinlvjiang-style";
        style.textContent = [
            "html, body, .teams-page, .players-page, .site-main, .team-workspace, .lineup-five, .catalog-results {",
            "    background: #141518 !important;",
            "    color: #E2E8F0 !important;",
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
            "/* 阵容页优化：隐藏左侧 16 战队冗余列表，阵容居中大视野展示 */",
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
            "/* 选手页（players）布局优化 */",
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
            "/* 选手卡片交互与质感：悬停发光、手型指针与微浮起 */",
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
            "    transform: translateY(-5px) scale(1.02) !important;",
            "    box-shadow: 0 10px 28px rgba(215, 184, 117, 0.35) !important;",
            "    z-index: 5 !important;",
            "}",
            "/* 资料快览弹窗（图 2 模态框）：强制绝对固定居中、暗黑毛玻璃背景、金边与大阴影 */",
            ".profile-preview-dialog,",
            "dialog.profile-preview-dialog,",
            "[data-profile-dialog] {",
            "    position: fixed !important;",
            "    top: 50% !important;",
            "    left: 50% !important;",
            "    transform: translate(-50%, -50%) !important;",
            "    width: min(980px, calc(100vw - 24px)) !important;",
            "    max-height: calc(100vh - 36px) !important;",
            "    background: rgba(20, 22, 27, 0.98) !important;",
            "    border: 1px solid rgba(215, 184, 117, 0.4) !important;",
            "    border-radius: 16px !important;",
            "    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.92) !important;",
            "    backdrop-filter: blur(24px) !important;",
            "    -webkit-backdrop-filter: blur(24px) !important;",
            "    z-index: 2147483647 !important;",
            "    overflow-y: auto !important;",
            "    padding: 0 !important;",
            "    margin: 0 !important;",
            "}",
            "/* 自建高兼容遮罩层 */",
            ".lvjiang-custom-backdrop {",
            "    position: fixed !important;",
            "    inset: 0 !important;",
            "    background: rgba(0, 0, 0, 0.78) !important;",
            "    backdrop-filter: blur(6px) !important;",
            "    -webkit-backdrop-filter: blur(6px) !important;",
            "    z-index: 2147483646 !important;",
            "    display: none;",
            "}",
            ".lvjiang-custom-backdrop.is-active {",
            "    display: block !important;",
            "}",
            ".profile-preview-toolbar {",
            "    background: rgba(26, 28, 34, 0.96) !important;",
            "    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;",
            "    position: sticky !important;",
            "    top: 0 !important;",
            "    z-index: 10 !important;",
            "    display: flex !important;",
            "    align-items: center !important;",
            "    justify-content: space-between !important;",
            "    padding: 12px 20px !important;",
            "}",
            ".profile-preview-toolbar span {",
            "    color: #CBD5E1 !important;",
            "    font-weight: 600 !important;",
            "    font-size: 15px !important;",
            "}",
            ".profile-preview-close {",
            "    background: rgba(255, 255, 255, 0.08) !important;",
            "    border: 1px solid rgba(255, 255, 255, 0.15) !important;",
            "    color: #CBD5E1 !important;",
            "    width: 32px !important;",
            "    height: 32px !important;",
            "    border-radius: 50% !important;",
            "    cursor: pointer !important;",
            "    display: inline-flex !important;",
            "    align-items: center !important;",
            "    justify-content: center !important;",
            "    font-size: 18px !important;",
            "    line-height: 1 !important;",
            "}",
            ".profile-preview-close:hover {",
            "    background: rgba(255, 102, 0, 0.25) !important;",
            "    border-color: #FF6600 !important;",
            "    color: #FF6600 !important;",
            "}",
            "/* 查看详情按钮高质感橙金渐变 */",
            ".profile-preview-actions .button,",
            ".profile-preview-actions a.button,",
            ".profile-preview-actions a {",
            "    background: linear-gradient(135deg, #FF7700, #E65100) !important;",
            "    color: #FFFFFF !important;",
            "    border: 1px solid rgba(255, 255, 255, 0.25) !important;",
            "    border-radius: 8px !important;",
            "    font-weight: 600 !important;",
            "    box-shadow: 0 4px 14px rgba(230, 81, 0, 0.45) !important;",
            "    cursor: pointer !important;",
            "    padding: 8px 18px !important;",
            "    text-decoration: none !important;",
            "    display: inline-block !important;",
            "    transition: all 0.2s ease !important;",
            "}",
            ".profile-preview-actions .button:hover,",
            ".profile-preview-actions a.button:hover,",
            ".profile-preview-actions a:hover {",
            "    background: linear-gradient(135deg, #FF8800, #F57C00) !important;",
            "    box-shadow: 0 6px 18px rgba(255, 136, 0, 0.65) !important;",
            "    transform: translateY(-1px) !important;",
            "}",
            "/* 选手详情页返回条美化 */",
            ".profile-return-row {",
            "    background: rgba(26, 28, 34, 0.85) !important;",
            "    border: 1px solid rgba(255, 255, 255, 0.08) !important;",
            "    border-radius: 10px !important;",
            "    padding: 12px 18px !important;",
            "    margin-bottom: 20px !important;",
            "}",
            ".back-link {",
            "    color: #FF8800 !important;",
            "    font-weight: 600 !important;",
            "    text-decoration: none !important;",
            "    cursor: pointer !important;",
            "}",
            ".back-link:hover {",
            "    text-decoration: underline !important;",
            "    color: #FFAA33 !important;",
            "}",
            "@keyframes ex-spin {",
            "    0% { transform: rotate(0deg); }",
            "    100% { transform: rotate(360deg); }",
            "}"
        ].join("\n");
        (document.head || document.documentElement).appendChild(style);
    }

    function bindInteractions() {
        // 统一可靠的页面跳转执行器（覆盖 unsafeWindow / window / location 三重沙箱环境）
        function jumpToPlayer(destUrl) {
            if (!destUrl) return;
            var fullUrl = destUrl;
            try {
                fullUrl = new URL(destUrl, window.location.href).href;
            } catch (_) {
                fullUrl = destUrl;
            }
            try {
                if (typeof unsafeWindow !== "undefined" && unsafeWindow.location) {
                    unsafeWindow.location.href = fullUrl;
                    return;
                }
            } catch (_) {}
            try {
                window.location.href = fullUrl;
                return;
            } catch (_) {}
            try {
                window.location.assign(fullUrl);
                return;
            } catch (_) {}
            try {
                location.href = fullUrl;
            } catch (_) {}
        }

        // 彻底拆除原站对 a[data-profile-preview] 的弹窗劫持，确保链接直接回落或被接管直达详情
        function neutraliseProfilePreview(root) {
            var scope = root || document;
            var previewLinks = scope.querySelectorAll("[data-profile-preview]");
            for (var i = 0; i < previewLinks.length; i++) {
                previewLinks[i].removeAttribute("data-profile-preview");
                previewLinks[i].removeAttribute("aria-haspopup");
            }
        }
        neutraliseProfilePreview();

        // 监听动态渲染卡片（如翻页、切换分组、筛选），持续剥离弹窗标记
        if (typeof MutationObserver !== "undefined") {
            try {
                var observer = new MutationObserver(function (mutations) {
                    for (var m = 0; m < mutations.length; m++) {
                        var mutation = mutations[m];
                        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                            for (var n = 0; n < mutation.addedNodes.length; n++) {
                                var node = mutation.addedNodes[n];
                                if (node.nodeType === 1) {
                                    neutraliseProfilePreview(node);
                                }
                            }
                        }
                    }
                });
                observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
            } catch (_) {}
        }

        // 核心：捕获阶段拦截卡片点击，100% 穿透直达选手详细资料页
        document.addEventListener("click", function (e) {
            if (!e.target) return;

            // 1. 直播间跳转按钮（.card-room-entry）放行，确保正常打开主播房间
            if (e.target.closest && e.target.closest(".card-room-entry")) {
                return;
            }

            // 2. 表单输入控件、对比选择复选框放行，供用户正常交互
            if (e.target.closest && e.target.closest("input, select, textarea, label.catalog-compare-choice, button[data-catalog-dimension-sort]")) {
                return;
            }

            // 3. 选手详情页中的返回链接（← 返回选手 / ← 返回阵容）平滑回退
            var backBtn = e.target.closest && e.target.closest(".back-link, .profile-return-row a");
            if (backBtn) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
                var backTarget = backBtn.href || backBtn.getAttribute("href");
                if (backTarget) {
                    jumpToPlayer(backTarget);
                } else if (window.history && window.history.length > 1) {
                    window.history.back();
                }
                return;
            }

            // 4. 处于选手卡片（.player-card）区域内的点击
            var card = e.target.closest && e.target.closest(".player-card");
            if (!card) return;

            // 评级样式预览卡（S+, S, A... 纯卡面展示）放行，交由原站样式筛选
            if (card.classList && card.classList.contains("catalog-style-card")) {
                return;
            }

            // 当前已在选手独立资料页（.player-dossier）内时，左侧卡片无需重复跳转自身
            if (document.querySelector(".player-dossier") && card.closest(".dossier-identity")) {
                return;
            }

            // 提取目标选手详细信息 URL
            var link = card.querySelector("a.player-card-link") || card.querySelector("a[href*='/players/']");
            var destUrl = link ? (link.href || link.getAttribute("href")) : "";

            // 如果链接未挂载 href，通过卡片的 data-entrant-card 构建官方标准直达链接
            if (!destUrl && card.dataset && card.dataset.entrantCard) {
                var entrantId = card.dataset.entrantCard;
                var currentReturn = encodeURIComponent(window.location.pathname + window.location.search);
                destUrl = "https://xinlvjiang.icu/players/" + entrantId + "/?event=lvjiangbeiS3&return_to=" + currentReturn;
            }

            if (destUrl) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") {
                    e.stopImmediatePropagation();
                }
                jumpToPlayer(destUrl);
            }
        }, true);

        // 双击兜底保障：双击卡片同样直接直达选手详细资料页
        document.addEventListener("dblclick", function (e) {
            var card = e.target.closest && e.target.closest(".player-card");
            if (card && (!card.classList || !card.classList.contains("catalog-style-card"))) {
                var link = card.querySelector("a.player-card-link") || card.querySelector("a[href*='/players/']");
                var destUrl = link ? (link.href || link.getAttribute("href")) : "";
                if (!destUrl && card.dataset && card.dataset.entrantCard) {
                    destUrl = "https://xinlvjiang.icu/players/" + card.dataset.entrantCard + "/?event=lvjiangbeiS3";
                }
                if (destUrl) {
                    e.preventDefault();
                    jumpToPlayer(destUrl);
                }
            }
        }, true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            applyDarkTheme();
            injectXinlvjiangStyles();
            bindInteractions();
        });
    } else {
        injectXinlvjiangStyles();
        bindInteractions();
    }

    // 防御性定期确保暗色模式与弹窗解除
    var checkCount = 0;
    var themeTimer = setInterval(function () {
        applyDarkTheme();
        injectXinlvjiangStyles();
        checkCount++;
        if (checkCount > 10) clearInterval(themeTimer);
    }, 400);
}
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
    } catch (_) {}

    function applyDarkTheme() {
        try {
            if (document.documentElement) {
                document.documentElement.setAttribute("data-theme", "dark");
                document.documentElement.dataset.theme = "dark";
                document.documentElement.style.colorScheme = "dark";
            }
            if (document.body) {
                document.body.setAttribute("data-theme", "dark");
            }
        } catch (_) {}
    }
    applyDarkTheme();

    function injectXinlvjiangStyles() {
        if (document.getElementById("douyux-xinlvjiang-style")) return;
        var style = document.createElement("style");
        style.id = "douyux-xinlvjiang-style";
        style.textContent = [
            "html, body {",
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
            "/* 阵容页优化：隐藏左侧 16 战队冗余列表（大屏顶栏已支持秒切战队），阵容居中大视野展示 */",
            ".teams-page .team-workspace {",
            "    display: block !important;",
            "    grid-template-columns: none !important;",
            "    max-width: 1240px !important;",
            "    margin: 0 auto !important;",
            "    padding: 16px 20px 40px !important;",
            "}",
            ".teams-page .team-selector-rail {",
            "    display: none !important;",
            "}",
            ".teams-page .team-detail {",
            "    width: 100% !important;",
            "    max-width: 100% !important;",
            "}",
            ".teams-page .team-identity {",
            "    background: rgba(26, 28, 34, 0.85) !important;",
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
            ".teams-page .roster-five {",
            "    display: flex !important;",
            "    justify-content: center !important;",
            "    align-items: flex-start !important;",
            "    gap: 24px !important;",
            "    flex-wrap: wrap !important;",
            "    padding: 10px 0 30px !important;",
            "}",
            ".teams-page .lineup-slot {",
            "    display: flex !important;",
            "    justify-content: center !important;",
            "    min-width: 200px !important;",
            "}",
            "/* 选手页（players）布局优化 */",
            ".players-page .site-main {",
            "    max-width: 1300px !important;",
            "    margin: 0 auto !important;",
            "    padding: 16px 20px 40px !important;",
            "}",
            ".players-page .catalog-style-gallery {",
            "    background: rgba(26, 28, 34, 0.8) !important;",
            "    border: 1px solid rgba(255, 255, 255, 0.08) !important;",
            "    border-radius: 12px !important;",
            "}",
            ".players-page .catalog-results {",
            "    padding-top: 16px !important;",
            "}",
            "/* 选手卡片交互与质感：悬停发光、手型指针与微浮起 */",
            ".player-card {",
            "    cursor: pointer !important;",
            "    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease !important;",
            "}",
            ".player-card:hover {",
            "    transform: translateY(-5px) scale(1.02) !important;",
            "    box-shadow: 0 10px 28px rgba(215, 184, 117, 0.35) !important;",
            "    z-index: 5 !important;",
            "}",
            ".player-card-link,",
            ".player-card-link * {",
            "    cursor: pointer !important;",
            "}",
            "/* 资料快览弹窗美化（图 2 模态框）：强制居中、高质感暗黑毛玻璃背景、金边与大阴影 */",
            ".profile-preview-dialog {",
            "    position: fixed !important;",
            "    top: 50% !important;",
            "    left: 50% !important;",
            "    transform: translate(-50%, -50%) !important;",
            "    width: min(1080px, calc(100vw - 32px)) !important;",
            "    max-height: calc(100vh - 48px) !important;",
            "    background: rgba(22, 24, 29, 0.96) !important;",
            "    border: 1px solid rgba(215, 184, 117, 0.35) !important;",
            "    border-radius: 16px !important;",
            "    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.85) !important;",
            "    backdrop-filter: blur(20px) !important;",
            "    -webkit-backdrop-filter: blur(20px) !important;",
            "    z-index: 99999 !important;",
            "    overflow-y: auto !important;",
            "    padding: 0 !important;",
            "}",
            ".profile-preview-dialog::backdrop {",
            "    background: rgba(0, 0, 0, 0.75) !important;",
            "    backdrop-filter: blur(6px) !important;",
            "    -webkit-backdrop-filter: blur(6px) !important;",
            "}",
            ".profile-preview-toolbar {",
            "    background: rgba(26, 28, 34, 0.95) !important;",
            "    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;",
            "    position: sticky !important;",
            "    top: 0 !important;",
            "    z-index: 10 !important;",
            "}",
            ".profile-preview-toolbar span {",
            "    color: #CBD5E1 !important;",
            "    font-weight: 600 !important;",
            "}",
            ".profile-preview-close {",
            "    background: rgba(255, 255, 255, 0.08) !important;",
            "    border-color: rgba(255, 255, 255, 0.15) !important;",
            "    color: #CBD5E1 !important;",
            "}",
            ".profile-preview-close:hover {",
            "    background: rgba(255, 102, 0, 0.2) !important;",
            "    border-color: #FF6600 !important;",
            "    color: #FF6600 !important;",
            "}",
            ".profile-preview-actions .button,",
            ".profile-preview-actions a.button {",
            "    background: linear-gradient(135deg, #FF7700, #E65100) !important;",
            "    color: #FFFFFF !important;",
            "    border: 1px solid rgba(255, 255, 255, 0.2) !important;",
            "    border-radius: 8px !important;",
            "    font-weight: 600 !important;",
            "    box-shadow: 0 4px 14px rgba(230, 81, 0, 0.4) !important;",
            "    cursor: pointer !important;",
            "    transition: all 0.2s ease !important;",
            "}",
            ".profile-preview-actions .button:hover,",
            ".profile-preview-actions a.button:hover {",
            "    background: linear-gradient(135deg, #FF8800, #F57C00) !important;",
            "    box-shadow: 0 6px 18px rgba(255, 136, 0, 0.6) !important;",
            "    transform: translateY(-1px) !important;",
            "}",
            "/* 选手详情页返回条美化 */",
            ".profile-return-row {",
            "    background: rgba(26, 28, 34, 0.8) !important;",
            "    border: 1px solid rgba(255, 255, 255, 0.08) !important;",
            "    border-radius: 10px !important;",
            "    padding: 12px 18px !important;",
            "    margin-bottom: 20px !important;",
            "}",
            ".back-link {",
            "    color: #FF8800 !important;",
            "    font-weight: 600 !important;",
            "    text-decoration: none !important;",
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
        function ensureDialog() {
            var dlg = document.querySelector("[data-profile-dialog]");
            if (!dlg) {
                dlg = document.createElement("dialog");
                dlg.className = "profile-preview-dialog";
                dlg.setAttribute("aria-label", "资料快览");
                dlg.setAttribute("data-profile-dialog", "");
                dlg.innerHTML = [
                    '<header class="profile-preview-toolbar">',
                    '  <button type="button" class="text-link" data-preview-back hidden>← 返回阵容</button>',
                    '  <span>资料快览</span>',
                    '  <button type="button" class="profile-preview-close" data-preview-close aria-label="关闭资料快览">×</button>',
                    '</header>',
                    '<div class="profile-preview-content" data-preview-content aria-live="polite"></div>'
                ].join("\n");
                (document.body || document.documentElement).appendChild(dlg);
            }
            var closeBtn = dlg.querySelector("[data-preview-close], .profile-preview-close");
            if (closeBtn && !closeBtn._exBound) {
                closeBtn._exBound = true;
                closeBtn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    if (typeof dlg.close === "function") {
                        try { dlg.close(); } catch (_) { dlg.style.display = "none"; }
                    } else {
                        dlg.style.display = "none";
                    }
                });
            }
            if (!dlg._exBackdropBound) {
                dlg._exBackdropBound = true;
                dlg.addEventListener("click", function (e) {
                    if (e.target === dlg) {
                        if (typeof dlg.close === "function") {
                            try { dlg.close(); } catch (_) { dlg.style.display = "none"; }
                        } else {
                            dlg.style.display = "none";
                        }
                    }
                });
            }
            return dlg;
        }

        var cachedPreviews = {};

        function showProfilePreview(endpointUrl, fallbackUrl) {
            var dlg = ensureDialog();
            var content = dlg.querySelector("[data-preview-content]");
            if (!content) return;

            content.innerHTML = [
                '<div style="padding:48px 24px;text-align:center;color:#CBD5E1;font-size:15px;">',
                '  <div style="display:inline-block;width:32px;height:32px;border:3px solid rgba(255,102,0,0.25);border-top-color:#FF6600;border-radius:50%;animation:ex-spin 0.8s linear infinite;margin-bottom:14px;"></div>',
                '  <div style="font-weight:600;letter-spacing:0.5px;">正在加载选手资料快览与能力雷达…</div>',
                '</div>'
            ].join("\n");

            try {
                if (typeof dlg.showModal === "function") {
                    if (!dlg.open) dlg.showModal();
                } else {
                    dlg.style.display = "block";
                    dlg.setAttribute("open", "");
                }
            } catch (_) {
                dlg.style.display = "block";
                dlg.setAttribute("open", "");
            }

            var targetUrl = "";
            try {
                targetUrl = new URL(endpointUrl, location.href).href;
            } catch (_) {
                targetUrl = endpointUrl;
            }

            if (cachedPreviews[targetUrl]) {
                renderPreviewHtml(cachedPreviews[targetUrl], content, fallbackUrl);
                return;
            }

            fetch(targetUrl, { credentials: "same-origin", headers: { Accept: "text/html" } })
                .then(function (res) {
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    return res.text();
                })
                .then(function (html) {
                    cachedPreviews[targetUrl] = html;
                    renderPreviewHtml(html, content, fallbackUrl);
                })
                .catch(function (err) {
                    var safeLink = fallbackUrl || targetUrl || location.href;
                    content.innerHTML = [
                        '<div style="padding:40px 24px;text-align:center;color:#CBD5E1;">',
                        '  <p style="margin-bottom:18px;font-size:15px;">暂时无法加载选手资料快览，可直接打开完整资料页：</p>',
                        '  <a class="button" href="' + safeLink + '" style="background:linear-gradient(135deg,#FF7700,#E65100);color:#FFFFFF;padding:10px 22px;border-radius:8px;font-weight:600;text-decoration:none;display:inline-block;box-shadow:0 4px 14px rgba(230,81,0,0.4);">打开完整资料 →</a>',
                        '</div>'
                    ].join("\n");
                });
        }

        function renderPreviewHtml(html, content, fallbackUrl) {
            content.innerHTML = html;
            try {
                if (window.LvjiangPlayerProfiles && typeof window.LvjiangPlayerProfiles.mount === "function") {
                    window.LvjiangPlayerProfiles.mount(content);
                }
            } catch (_) {}

            // 查看详情按钮点击直达
            var detailBtn = content.querySelector(".profile-preview-actions a.button, .profile-preview-actions a");
            if (detailBtn) {
                detailBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    if (detailBtn.href) {
                        location.href = detailBtn.href;
                    }
                });
            }
        }

        document.addEventListener("click", function (e) {
            if (!e.target) return;
            // 点击直播间跳转外链、关闭按钮、表单输入直接放行
            if (e.target.closest && e.target.closest(".card-room-entry, .profile-preview-close, input, select, textarea")) {
                return;
            }

            // 在快览弹窗内的点击放行
            if (e.target.closest && e.target.closest("[data-profile-dialog]")) {
                var actionBtn = e.target.closest(".profile-preview-actions a");
                if (actionBtn && actionBtn.href) {
                    e.preventDefault();
                    location.href = actionBtn.href;
                }
                return;
            }

            var card = e.target.closest && e.target.closest(".player-card");
            if (!card) return;

            var link = card.querySelector("a.player-card-link") || card.querySelector("a");
            if (!link) return;

            // 1. 如果带有 data-profile-preview（如阵容 teams 页），呼出资料快览模态框
            if (link.dataset && link.dataset.profilePreview) {
                e.preventDefault();
                e.stopPropagation();
                showProfilePreview(link.dataset.profilePreview, link.href);
                return;
            }

            // 2. 如果是选手页（players）卡片（无 data-profile-preview），点击整卡直达选手详情页
            if (link.href) {
                e.preventDefault();
                e.stopPropagation();
                location.href = link.href;
                return;
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

    // 防御性定期确保暗色模式
    var checkCount = 0;
    var themeTimer = setInterval(function () {
        applyDarkTheme();
        injectXinlvjiangStyles();
        checkCount++;
        if (checkCount > 10) clearInterval(themeTimer);
    }, 400);
}
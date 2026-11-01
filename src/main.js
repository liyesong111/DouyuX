// ==UserScript==
// @name         DouyuX-斗鱼直播间增强(驴酱版)
// @namespace    https://github.com/liyesong111/DouyuX
// @homepageURL  https://github.com/liyesong111/DouyuX
// @supportURL   https://github.com/liyesong111/DouyuX/issues
// @icon         https://raw.githubusercontent.com/liyesong111/DouyuX/main/icon.png
// @version      2026.11.01.16
// @description  DouyuX 纯净版：斗鱼直播间纯净增强，支持最高画质秒开、同屏多路分屏播放、驴酱杯赛事数据与日常签到。
// @author       liyesong
// @match			*://*.douyu.com/0*
// @match			*://*.douyu.com/1*
// @match			*://*.douyu.com/2*
// @match			*://*.douyu.com/3*
// @match			*://*.douyu.com/4*
// @match			*://*.douyu.com/5*
// @match			*://*.douyu.com/6*
// @match			*://*.douyu.com/7*
// @match			*://*.douyu.com/8*
// @match			*://*.douyu.com/9*
// @match			*://*.douyu.com/beta/*
// @match			*://*.douyu.com/topic/*
// @match        *://www.douyu.com/member/cp/getFansBadgeList
// @match        *://passport.douyu.com/*
// @match        *://msg.douyu.com/*
// @match        *://yuba.douyu.com/*
// @match        *://v.douyu.com/*
// @match        *://cz.douyu.com/*
// @require      https://registry.npmmirror.com/flv.js/1.6.2/files/dist/flv.min.js
// @require      https://fastly.jsdelivr.net/npm/svgaplayerweb@2.3.1/build/svga.min.js
// @require      https://registry.npmmirror.com/gif.js/0.2.0/files/dist/gif.js
// @require      https://registry.npmmirror.com/three/0.80.0/files/build/three.min.js
// @require      https://registry.npmmirror.com/xlsx/0.16.4/files/dist/xlsx.full.min.js
// @require      https://registry.npmmirror.com/dompurify/2.3.6/files/dist/purify.min.js
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_cookie
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @run-at       document-start
// @allFrames    true
// @connect      douyucdn.cn
// @connect      douyu.com
// @connect      qq.com
// @connect      douyuex.com
// @connect      bilibili.com
// @connect      huya.com
// @connect      shadiao.app
// @connect      registry.npmmirror.com
// @connect      fastly.jsdelivr.net
// @connect      cdn.jsdelivr.net
// @connect      raw.githubusercontent.com
// @connect      xn--wbt59p7locqcy71c.xyz
// @connect      xinlvjiang.icu
// @license      MIT
// ==/UserScript==

// 核心层标记 勿删

function init() {
  // 与 initPkg() 同一口径的逐项隔离。
  // 这 16 步此前是裸平铺直调：任何一处抛异常，它**后面**的初始化就全部不再执行 ——
  // 而失联的恰好是排在末尾的 Console / Menu / Reset / FollowList，
  // 用户侧只看到「某几个功能没了，刷新一次可能又好了」（抛不抛取决于当时的 DOM 时机），
  // 且日志里没有任何线索。现在每一句都过 initPkg_Safe：失败报出包名后继续往下走。
  // ⚠ 调用顺序与本行语义必须与改造前逐行一致，不要在这里顺手重排。
  initPkg_Safe("PopupPlayer_MergeDanmaku_ScriptHook", initPkg_PopupPlayer_MergeDanmaku_ScriptHook);
  initPkg_Safe("Shield_RemoveRepeatedDanmaku_ScriptHook", initPkg_Shield_RemoveRepeatedDanmaku_ScriptHook);
  initPkg_Safe("ShowDanmaku_ScriptHook", initPkg_ShowDanmaku_ScriptHook);
  initPkg_Safe("ScriptHook", initScriptHook);
  initPkg_Safe("ResponseHook", initResponseHook);
  initPkg_Safe("ShowDanmaku", initPkg_ShowDanmaku);
  initPkg_Safe("Update_checkVersion", Update_checkVersion);
  initPkg_Safe("KillP2P", initKillP2P);
  initPkg_Safe("FullScreen", initFullScreen);
  initPkg_Safe("HighestVideoQuality", initHighestVideoQuality);
  initPkg_Safe("NoLogin", initPkg_NoLogin);
  initPkg_Safe("RemoveAD", removeAD);
  initPkg_Safe("Console", initPkg_Console);
  initPkg_Safe("Menu", initPkg_Menu);
  initPkg_Safe("Reset", initPkg_Reset);
  initPkg_Safe("FollowList", initPkg_FollowList);
}
function initPkg() {
  // 单个包初始化失败不得拖垮其余包。
  // 此前这里是 30 多个平铺直调：任何一处抛异常，它**后面**的包就全部不再初始化，
  // 表现就是"脚本没加载出来"（而刷新一次页面可能又好了 —— 抛不抛取决于当时的 DOM 时机），
  // 且完全没有任何线索。逐项隔离 + 报出包名，既保住其余功能，也让偶发问题可定位。
  initPkg_Safe("DanmakuTail", initPkg_DanmakuTail);
  initPkg_Safe("ExIcon", initPkg_ExIcon);
  initPkg_Safe("XPanel", initPkg_XPanel);
  initPkg_Safe("RealAudience", initPkg_RealAudience);
  initPkg_Safe("CopyRealLive", initPkg_CopyRealLive);
  /* 观看时间 / 开播时间挂在「复制直播流」右边的标题栏里：必须先有 CopyRealLive 的 #copy-real-live，
     故紧随其后接线；节点晚渲染时由包内的有上限等待兜底，等不到只留一条日志。 */
  initPkg_Safe("TitleTime", initPkg_TitleTime);
  initPkg_Safe("RemoveAD", initPkg_RemoveAD);
  initPkg_Safe("Shield", initPkg_Shield);
  initPkg_Safe("BagInfo", initPkg_BagInfo);
  initPkg_Safe("Update", initPkg_Update);
  initPkg_Safe("Monitor", initPkg_Monitor);
  initPkg_Safe("PopupPlayer", initPkg_PopupPlayer);
  initPkg_Safe("PopupPlayer_MultiScreen", initPkg_PopupPlayer_MultiScreen);
  initPkg_Safe("PopupPlayer_MergeDanmaku", initPkg_PopupPlayer_MergeDanmaku);
  initPkg_Safe("LiveTool", initPkg_LiveTool);
  initPkg_Safe("VideoTools", initPkg_VideoTools);
  initPkg_Safe("ExpandTool", initPkg_ExpandTool);
  initPkg_Safe("OnlineTool", initPkg_OnlineTool);
  initPkg_Safe("Refresh", initPkg_Refresh);
  initPkg_Safe("BarrageLoop", initPkg_BarrageLoop);
  initPkg_Safe("FansContinue", initPkg_FansContinue);
  initPkg_Safe("Sign", initPkg_Sign);
  initPkg_Safe("BarragePanel", initPkg_BarragePanel);
  initPkg_Safe("DanmakuHistory", initPkg_DanmakuHistory);
  initPkg_Safe("AccountList", initPkg_AccountList);
  initPkg_Safe("ChatTools", initPkg_ChatTools);
  initPkg_Safe("MonthCost", initPkg_MonthCost);
  initPkg_Safe("RoomVip", initPkg_RoomVip);
  initPkg_Safe("DanmakuCollect", initPkg_DanmakuCollect);
  initPkg_Safe("RestoreYuba", initPkg_RestoreYuba);
  initPkg_Safe("ChangeDanmakuLengthLimit", initPkg_ChangeDanmakuLengthLimit);
  initPkg_Safe("CheckAnchorPocket", initPkg_CheckAnchorPocket);
  initPkg_Safe("LastLiveTime", initPkg_LastLiveTime);
  /* 粉丝牌表格有两种形态：独立页（router 里直接调）与房间内的粉丝牌浮层（异步渲染、点开才出现）。
     以前只在独立页接线，房间浮层里这功能等于不存在。包侧已改成「先试一次 → 没命中就有上限轮询等它，
     行级幂等标记」，这里补上房间侧的入口即可；等不到只留一条日志，不会刷屏。 */
  initPkg_Safe("FansBadgeList", initPkg_FansBadgeList);
  initPkg_Safe("VolumeMouseScrolling", initPkg_VolumeMouseScrolling);
}
function initPkg_Safe(name, fn) {
  try {
    if (typeof fn === "function") fn();
  } catch (e) {
    const err = e || {};
    console.error("[DouyuX] 初始化失败：" + name + " —— " + (err.message || err));
  }
}
function initPkg_Timer() {
  initPkg_LevelTask_Timer();
  initPkg_DisableCloseJump_Timer();
}
function initTimer() {
  initPkg_Timer();
}

function initStyles() {
  let style = document.createElement("style");
  style.appendChild(
    document.createTextNode(`
		body{position:relative;}
		/*编译器标记 勿删*/
		`)
  );
  document.head.appendChild(style);
}

// 编译器标记 勿删

(async function () {
  initRouter(window.location.href);
})();

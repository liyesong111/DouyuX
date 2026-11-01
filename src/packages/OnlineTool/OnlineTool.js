function initPkg_OnlineTool() {
  initPkg_OnlineTool_Dom();
  initPkg_OnlineTool_Func();
}

function initPkg_OnlineTool_Dom() {
  OnlineTool_insertIcon();
}

function OnlineTool_insertIcon() {
  if (document.querySelector(".online-tools")) return;
  let a = document.createElement("div");
  a.className = "online-tools";
  a.innerHTML =
    '<a class="ex-panel__icon" title="在线工具"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg><i id="online-tools__tip" class="ex-panel__tip"></i></a>';

  let b = document.getElementsByClassName("ex-panel__wrap")[0];
  if (!b) return false;
  let popupPlayerIcon = b.querySelector(".popup-player");
  if (popupPlayerIcon) {
    b.insertBefore(a, popupPlayerIcon);
  } else {
    b.insertBefore(a, b.childNodes[0]);
  }
  return true;
}

function initPkg_OnlineTool_Func() {
  let btn = document.getElementsByClassName("online-tools")[0];
  if (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      let panel = document.querySelector(".online-tools-panel");
      if (!panel) {
        createOnlineToolsPanel();
        panel = document.querySelector(".online-tools-panel");
      }
      if (!panel) return;
      if (typeof openMiuixPanelCentered === "function") {
        openMiuixPanelCentered(panel, btn);
      } else {
        panel.style.setProperty("display", "flex", "important");
      }
    });
  }
}

var LVJIANG_TEAMS = [
  { id: "49", code: "T001", name: "洞主队", captain: "洞主", pos: "上单", rid: "138243" },
  { id: "50", code: "T002", name: "火星包队", captain: "火星包", pos: "中单", rid: "52" },
  { id: "51", code: "T003", name: "银剑君队", captain: "银剑君", pos: "中单", rid: "251783" },
  { id: "52", code: "T004", name: "猪哥队", captain: "pigff", pos: "中单", rid: "24422" },
  { id: "53", code: "T005", name: "猴哥队", captain: "孙悟空", pos: "上单", rid: "475252" },
  { id: "54", code: "T006", name: "冰凡队", captain: "冰凡", pos: "打野", rid: "17349" },
  { id: "55", code: "T007", name: "大湿兄队", captain: "大湿兄", pos: "打野", rid: "888388" },
  { id: "56", code: "T008", name: "小甜椒队", captain: "小甜椒", pos: "辅助", rid: "3863752" },
  { id: "57", code: "T009", name: "兮饭队", captain: "兮饭锐雯", pos: "中单", rid: "108780" },
  { id: "58", code: "T010", name: "C皇队", captain: "余小C", pos: "上单", rid: "1126960" },
  { id: "59", code: "T011", name: "电棍队", captain: "电棍", pos: "中单", rid: "12306" },
  { id: "60", code: "T012", name: "马超队", captain: "太原马超", pos: "中单", rid: "891464" },
  { id: "61", code: "T013", name: "咬人鹅队", captain: "咬人鹅", pos: "下路", rid: "10902240" },
  { id: "62", code: "T014", name: "张顺飞队", captain: "张顺飞", pos: "打野", rid: "2561707" },
  { id: "63", code: "T015", name: "冯雨队", captain: "冯雨", pos: "辅助", rid: "317422" },
  { id: "64", code: "T016", name: "二抛队", captain: "何二抛", pos: "上单", rid: "4452132" }
];

var LVJIANG_STREAMERS = LVJIANG_TEAMS.map(function (t) {
  return { rid: t.rid, name: t.captain, team: t.name, pos: t.pos, teamId: t.id, code: t.code };
});

var LVJIANG_PAGES = {
  schedule: { title: "赛程", url: "https://xinlvjiang.icu/schedule/?event=lvjiangbeiS3" },
  teams: { title: "阵容", url: "https://xinlvjiang.icu/teams/?event=lvjiangbeiS3" },
  players: { title: "选手", url: "https://xinlvjiang.icu/players/?event=lvjiangbeiS3&page_size=20" },
  leaderboards: { title: "选手榜", url: "https://xinlvjiang.icu/leaderboards/?event=lvjiangbeiS3" },
  live: { title: "直播", url: "https://xinlvjiang.icu/live/?event=lvjiangbeiS3" }
};

function openLvjiangModal(key, teamId) {
  var page = (key && LVJIANG_PAGES[key]) ? LVJIANG_PAGES[key] : LVJIANG_PAGES.schedule;
  var targetUrl = page ? page.url : "https://xinlvjiang.icu/schedule/?event=lvjiangbeiS3";
  if (typeof window !== "undefined" && typeof window.open === "function") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}

function createOnlineToolsPanel() {
  if (document.querySelector(".online-tools-panel")) return;
  var p = document.createElement("div");
  p.className = "online-tools-panel miuix-modal";
  p.innerHTML = `
    <div class="miuix-modal__body">
      <div class="fans-panel__card">
        <div class="fans-panel__card-header">
          <span class="fans-panel__card-title">驴酱杯</span>
        </div>
        <div class="online-tool-links">
          <a href="https://xinlvjiang.icu/schedule/?event=lvjiangbeiS3" target="_blank" rel="noopener noreferrer" class="online-tool-btn" data-key="schedule">
            <span class="online-tool-btn__text">赛程</span>
          </a>
          <a href="https://xinlvjiang.icu/teams/?event=lvjiangbeiS3" target="_blank" rel="noopener noreferrer" class="online-tool-btn" data-key="teams">
            <span class="online-tool-btn__text">阵容</span>
          </a>
          <a href="https://xinlvjiang.icu/players/?event=lvjiangbeiS3&page_size=20" target="_blank" rel="noopener noreferrer" class="online-tool-btn" data-key="players">
            <span class="online-tool-btn__text">选手</span>
          </a>
          <a href="https://xinlvjiang.icu/leaderboards/?event=lvjiangbeiS3" target="_blank" rel="noopener noreferrer" class="online-tool-btn" data-key="leaderboards">
            <span class="online-tool-btn__text">选手榜</span>
          </a>
          <a href="https://xinlvjiang.icu/live/?event=lvjiangbeiS3" target="_blank" rel="noopener noreferrer" class="online-tool-btn" data-key="live">
            <span class="online-tool-btn__text">直播</span>
          </a>
        </div>
      </div>
      <div class="fans-panel__card">
        <div class="fans-panel__card-header">
          <span class="fans-panel__card-title">赛事直播间直达</span>
          <span class="online-tool-card__subtitle">16支队伍视角</span>
        </div>
        <div class="online-tool-streamers-grid">
          ` + LVJIANG_STREAMERS.map(function (s) {
            return '<a href="https://www.douyu.com/' + s.rid + '" target="_blank" rel="noopener noreferrer" class="online-tool-streamer-card" data-team-id="' + s.teamId + '" title="' + s.name + '（' + s.team + ' · ' + s.pos + ' · 房间号 ' + s.rid + '）">' +
              '<span class="online-tool-streamer-name">' + s.name + '</span>' +
              '<span class="online-tool-streamer-team" data-team-id="' + s.teamId + '">' + s.team + '</span>' +
            '</a>';
          }).join("") + `
        </div>
      </div>
      <div class="fans-panel__card">
        <div class="fans-panel__card-header">
          <span class="fans-panel__card-title">弹幕/礼物查询</span>
          <span class="online-tool-card__subtitle" style="color: #94A3B8;">功能暂不开放</span>
        </div>
        <div class="online-tool-actions">
          <button type="button" class="online-tool-action-btn online-tool-monitor-btn" id="online-tool__monitor-btn" disabled style="opacity: 0.45; cursor: not-allowed; pointer-events: none;" title="功能暂不开放，当前不可用">
            <span class="online-tool-action-btn__text">查询（功能暂不开放）</span>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(p);
  if (typeof ensureMiuixPanelHeader === "function") {
    ensureMiuixPanelHeader(p, "在线工具");
  }

  var monitorBtn = p.querySelector("#online-tool__monitor-btn");
  if (monitorBtn) {
    monitorBtn.addEventListener("click", function (e) {
      if ((monitorBtn.disabled || monitorBtn.getAttribute("disabled")) && e.isTrusted) {
        // 功能暂不开放，真实点击直接拦截阻止
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
      openMonitorQueryPanel(monitorBtn);
    });
  }
}

var MONITOR_ROOM_LIST = [
  { id: "4452132", name: "何二抛zZ" },
  { id: "796833", name: "ShaunaVayne丨琦" },
  { id: "1126960", name: "余小C真的很强" },
  { id: "317422", name: "驴酱的冯雨大王" },
  { id: "138243", name: "洞主丨歌神洞庭湖" },
  { id: "71091", name: "驴酱阿松" },
  { id: "2561707", name: "网友张顺飞" },
  { id: "52", name: "火星包" },
  { id: "888388", name: "你的大湿兄zz" },
  { id: "12864053", name: "天使蝶" },
  { id: "12848608", name: "小禾苗ovo" },
  { id: "4532833", name: "喔唷童夕" },
  { id: "12740109", name: "一团肉松子" },
  { id: "12234135", name: "清清亲亲a" },
  { id: "12260516", name: "是你的宁姚" },
  { id: "9983341", name: "张张张仙仙女" },
  { id: "12899462", name: "辣辣ooo" },
  { id: "1369397", name: "彭枪枪OVO" },
  { id: "12684695", name: "oi姜姜" },
  { id: "8458376", name: "玩蛇姐姐" },
  { id: "12795629", name: "小圆a" },
  { id: "12293234", name: "145oni" },
  { id: "7201257", name: "光阴大人" },
  { id: "10399680", name: "醋醋呀i" },
  { id: "11831274", name: "宋悦薇" },
  { id: "12893270", name: "小塔cc" },
  { id: "12149547", name: "汤汤爱吃千张" },
  { id: "12668179", name: "梦泥泥" },
  { id: "12898625", name: "羊不吃草" },
  { id: "12278965", name: "白晶晶Yik" },
  { id: "12698836", name: "菠萝苞苞" },
  { id: "12881911", name: "糕冷小y吖" },
  { id: "8690608", name: "小唯FishepyzZo" },
  { id: "12500663", name: "是个好栗子" },
  { id: "12906338", name: "菠萝苞苞a" },
  { id: "3863752", name: "小甜椒单排日记" },
  { id: "12619385", name: "年年酱牛肉" },
  { id: "9488284", name: "大菠萝007" },
  { id: "3168536", name: "Xleft小叮当" },
  { id: "9999", name: "超级小桀" }
];

function renderMonitorAnchorOptions(includeAll, isGift) {
  var allText = isGift ? "驴酱" : "全部主播";
  var html = includeAll ? '<option value="">' + allText + '</option>' : '';

  for (var i = 0; i < MONITOR_ROOM_LIST.length; i++) {
    var r = MONITOR_ROOM_LIST[i];
    html += '<option value="' + escapeMonitorHtml(r.id) + '">' + escapeMonitorHtml(r.name) + '</option>';
  }

  return html;
}

function syncMonitorRoomsFromConfig(panel) {
  var configUrl = "https://xn--wbt59p7locqcy71c.xyz/api/public-config";
  requestMonitorApi(configUrl).then(function (cfg) {
    if (cfg && Array.isArray(cfg.rooms) && cfg.rooms.length > 0) {
      var map = {};
      MONITOR_ROOM_LIST.forEach(function (r) { map[r.id] = true; });
      var changed = false;
      cfg.rooms.forEach(function (r) {
        if (!map[r.id]) {
          MONITOR_ROOM_LIST.push({ id: String(r.id), name: String(r.name) });
          map[r.id] = true;
          changed = true;
        }
      });
      if (changed && panel) {
        var anchorSelect = panel.querySelector(".monitor-query__anchor-select");
        var giftAnchorSelect = panel.querySelector(".monitor-query__gift-anchor-select");
        if (anchorSelect) {
          var curVal = anchorSelect.value;
          anchorSelect.innerHTML = renderMonitorAnchorOptions(true, false);
          if (curVal) anchorSelect.value = curVal;
        }
        if (giftAnchorSelect) {
          var curGiftVal = giftAnchorSelect.value;
          giftAnchorSelect.innerHTML = renderMonitorAnchorOptions(true, true);
          if (curGiftVal !== undefined) giftAnchorSelect.value = curGiftVal;
        }
      }
    }
  }).catch(function () {});
}

function getMonitorBeijingNow() {
  var d = new Date();
  var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  var bj = new Date(utc + (3600000 * 8));
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  return bj.getFullYear() + "-" + pad(bj.getMonth() + 1) + "-" + pad(bj.getDate()) + "T" + pad(bj.getHours()) + ":" + pad(bj.getMinutes()) + ":" + pad(bj.getSeconds());
}

function getMonitorStatsTimeRange(kind) {
  var now = getMonitorBeijingNow();
  var day = now.slice(0, 10);
  var start = "";
  var end = now;
  if (kind === "today") {
    start = day + "T00:00:00";
  } else if (kind === "week") {
    var d = new Date();
    d.setDate(d.getDate() - 6);
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    var bj = new Date(utc + (3600000 * 8));
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    start = bj.getFullYear() + "-" + pad(bj.getMonth() + 1) + "-" + pad(bj.getDate()) + "T00:00:00";
  } else if (kind === "month") {
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    var bj = new Date(utc + (3600000 * 8));
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    start = bj.getFullYear() + "-" + pad(bj.getMonth() + 1) + "-" + pad(bj.getDate()) + "T00:00:00";
  } else if (kind === "all") {
    start = "";
  }
  return { start: start, end: end };
}

function formatMonitorRangeLabel(range) {
  var startStr = range.start ? range.start.replace("T", " ") : "全部历史";
  var endStr = range.end ? range.end.replace("T", " ") : "";
  return startStr + " ～ " + endStr;
}

function fetchMonitorGiftStats(roomId, timeKind) {
  timeKind = timeKind || "today";
  var range = getMonitorStatsTimeRange(timeKind);
  var url = "https://xn--wbt59p7locqcy71c.xyz/api/gift-stats?";
  var params = [];
  if (roomId) {
    params.push("room_id=" + encodeURIComponent(roomId));
  }
  if (range.start) {
    params.push("start=" + encodeURIComponent(range.start));
  }
  if (range.end) {
    params.push("end=" + encodeURIComponent(range.end));
  }
  url += params.join("&");
  return requestMonitorApiWithAuth(url);
}

function createMonitorQueryPanel() {
  if (document.querySelector(".monitor-query-panel")) return;
  var p = document.createElement("div");
  p.className = "monitor-query-panel miuix-modal";
  p.innerHTML = `
    <div class="miuix-modal__body">
      <div class="monitor-query__tabs">
        <button type="button" class="monitor-query__tab is-active" data-type="danmaku">弹幕查询</button>
        <button type="button" class="monitor-query__tab" data-type="gift">礼物统计</button>
      </div>
      <div style="margin: 8px 0 12px; padding: 6px 10px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; color: #FCA5A5; font-size: 12px; text-align: center;">此功能暂不开放使用</div>
      <div class="monitor-query__content-danmaku">
        <div class="monitor-query__anchor-bar">
          <label class="monitor-query__anchor-label" for="monitor-query__anchor-select">主播：</label>
          <select class="monitor-query__anchor-select" id="monitor-query__anchor-select">
            ${renderMonitorAnchorOptions(true, false)}
          </select>
        </div>
        <div class="monitor-query__search-bar">
          <input type="text" class="monitor-query__input" placeholder="请输入用户昵称或UID" />
          <button type="button" class="monitor-query__submit-btn ex-send-btn">查询</button>
        </div>
        <div class="monitor-query__table-wrap">
          <table class="monitor-query__table">
            <thead>
              <tr>
                <th class="col-seq">序号</th>
                <th class="col-anchor">主播</th>
                <th class="col-nick">昵称</th>
                <th class="col-uid">UID</th>
                <th class="col-content">内容/礼物</th>
                <th class="col-time">时间</th>
              </tr>
            </thead>
            <tbody class="monitor-query__tbody">
              <tr>
                <td colspan="6" class="monitor-query__empty">请输入用户昵称或UID并点击查询</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="monitor-query__content-gift is-hidden" style="display: none;">
        <div class="monitor-query__filter-row">
          <div class="monitor-query__filter-item">
            <label class="monitor-query__filter-label" for="monitor-query__gift-anchor-select">主播：</label>
            <select class="monitor-query__gift-anchor-select" id="monitor-query__gift-anchor-select">
              ${renderMonitorAnchorOptions(true, true)}
            </select>
          </div>
          <div class="monitor-query__filter-item">
            <label class="monitor-query__filter-label" for="monitor-query__gift-time-select">查询时间：</label>
            <select class="monitor-query__gift-time-select" id="monitor-query__gift-time-select">
              <option value="today">当日</option>
              <option value="week">过去7天</option>
              <option value="month">过去1月</option>
              <option value="all">至今</option>
            </select>
          </div>
          <button type="button" class="monitor-query__gift-submit-btn">查询</button>
        </div>
        <div class="monitor-query__range-row">
          <span class="monitor-query__range-label">时间范围：</span>
          <span class="monitor-query__range-val" id="monitor-query__range-val">-</span>
        </div>
        <div class="monitor-query__chart-wrap">
          <div class="monitor-query__chart-container">
            <div class="monitor-query__empty">暂无礼物统计数据</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(p);
  if (typeof ensureMiuixPanelHeader === "function") {
    ensureMiuixPanelHeader(p, "弹幕/礼物查询");
  }

  // 尝试根据当前房间号匹配选中预设主播
  var currentRoomId = getMonitorRoomId();
  var anchorSelect = p.querySelector(".monitor-query__anchor-select");
  if (anchorSelect && currentRoomId) {
    for (var i = 0; i < anchorSelect.options.length; i++) {
      if (anchorSelect.options[i].value === currentRoomId) {
        anchorSelect.selectedIndex = i;
        break;
      }
    }
  }

  bindMonitorQueryEvents(p);
}

function bindMonitorQueryEvents(panel) {
  if (!panel) return;

  var tabs = panel.querySelectorAll(".monitor-query__tab");
  var danmakuContent = panel.querySelector(".monitor-query__content-danmaku");
  var giftContent = panel.querySelector(".monitor-query__content-gift");
  var giftLoaded = false;

  function updateGiftRangeLabel() {
    var rangeValEl = panel.querySelector("#monitor-query__range-val");
    var giftTimeSelect = panel.querySelector(".monitor-query__gift-time-select");
    if (rangeValEl && giftTimeSelect) {
      var range = getMonitorStatsTimeRange(giftTimeSelect.value);
      rangeValEl.textContent = formatMonitorRangeLabel(range);
    }
  }

  function triggerGiftQuery() {
    if (typeof GM_xmlhttpRequest !== "function" && (typeof window === "undefined" || typeof window.GM_xmlhttpRequest !== "function")) {
      return;
    }
    var giftAnchorSelect = panel.querySelector(".monitor-query__gift-anchor-select");
    var giftTimeSelect = panel.querySelector(".monitor-query__gift-time-select");
    var roomId = giftAnchorSelect ? giftAnchorSelect.value.trim() : "";
    var timeKind = giftTimeSelect ? giftTimeSelect.value.trim() : "today";

    updateGiftRangeLabel();

    var chartContainer = panel.querySelector(".monitor-query__chart-container");
    if (chartContainer) {
      chartContainer.innerHTML = '<div class="monitor-query__loading">数据加载中...</div>';
    }

    fetchMonitorGiftStats(roomId, timeKind).then(function (res) {
      giftLoaded = true;
      if (typeof renderMonitorGiftChart === "function") {
        renderMonitorGiftChart(res && (res.items || res.gifts || res.list || res));
      }
    }).catch(function (err) {
      console.warn("[DouyuX][监控室] 礼物统计查询失败:", err);
      if (chartContainer) {
        var isRateLimit = err && (err.status === 429 || (err.message && err.message.indexOf("频繁") !== -1));
        chartContainer.innerHTML = '<div class="monitor-query__status">' + (isRateLimit ? '查询过于频繁，请稍后重试' : '请求失败，请稍后重试') + '</div>';
      }
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function (e) {
      e.stopPropagation();
      tabs.forEach(function (t) { t.classList.remove("is-active"); });
      tab.classList.add("is-active");

      var type = tab.getAttribute("data-type");
      if (type === "gift") {
        if (danmakuContent) {
          danmakuContent.classList.add("is-hidden");
          danmakuContent.style.display = "none";
        }
        if (giftContent) {
          giftContent.classList.remove("is-hidden");
          giftContent.style.display = "flex";
        }
        updateGiftRangeLabel();
        if (!giftLoaded) {
          triggerGiftQuery();
        }
      } else {
        if (danmakuContent) {
          danmakuContent.classList.remove("is-hidden");
          danmakuContent.style.display = "flex";
        }
        if (giftContent) {
          giftContent.classList.add("is-hidden");
          giftContent.style.display = "none";
        }
      }
    });
  });

  var giftSubmitBtn = panel.querySelector(".monitor-query__gift-submit-btn");
  if (giftSubmitBtn) {
    giftSubmitBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      triggerGiftQuery();
    });
  }

  var giftTimeSelect = panel.querySelector(".monitor-query__gift-time-select");
  if (giftTimeSelect) {
    giftTimeSelect.addEventListener("change", function () {
      updateGiftRangeLabel();
      triggerGiftQuery();
    });
  }

  var giftAnchorSelect = panel.querySelector(".monitor-query__gift-anchor-select");
  if (giftAnchorSelect) {
    giftAnchorSelect.addEventListener("change", function () {
      triggerGiftQuery();
    });
  }

  var submitBtn = panel.querySelector(".monitor-query__submit-btn");
  var input = panel.querySelector(".monitor-query__input");

  function triggerDanmakuQuery() {
    var keyword = input ? input.value.trim() : "";
    var anchorSelect = panel.querySelector(".monitor-query__anchor-select");
    var roomId = anchorSelect ? anchorSelect.value.trim() : "";
    var activeTab = panel.querySelector(".monitor-query__tab.is-active");
    var queryType = activeTab ? activeTab.getAttribute("data-type") : "danmaku";

    var tbody = panel.querySelector(".monitor-query__tbody");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="monitor-query__loading">数据加载中...</td></tr>';
    }

    try {
      var fetchFn = (typeof window !== "undefined" && typeof window.fetchMonitorData === "function") ? window.fetchMonitorData : fetchMonitorData;
      var req = fetchFn(keyword, queryType, roomId);
      if (req && typeof req.then === "function") {
        req.then(function (data) {
          if (typeof renderMonitorData === "function") {
            renderMonitorData(data);
          }
        }).catch(function (err) {
          console.warn("[DouyuX][监控室] 查询请求失败:", err);
          if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="monitor-query__status">请求失败，请稍后重试</td></tr>';
          }
        });
      }
    } catch (err) {
      console.warn("[DouyuX][监控室] 执行查询异常:", err);
    }
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      triggerDanmakuQuery();
    });
  }

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.stopPropagation();
        triggerDanmakuQuery();
      }
    });
  }
}

function openMonitorQueryPanel(anchorEl) {
  let panel = document.querySelector(".monitor-query-panel");
  if (!panel) {
    createMonitorQueryPanel();
    panel = document.querySelector(".monitor-query-panel");
  }
  if (!panel) return;
  // 必须锚定到底部 Dock 栏图标（.online-tools），保持和其它三级面板一致的底部水平对齐
  var dockBtn = document.querySelector(".online-tools") || anchorEl;
  syncMonitorRoomsFromConfig(panel);
  if (typeof openMiuixPanelCentered === "function") {
    openMiuixPanelCentered(panel, dockBtn);
  } else {
    panel.style.setProperty("display", "flex", "important");
  }
}

var monitorAuthPromise = null;

function ensureMonitorAuth() {
  if (monitorAuthPromise) return monitorAuthPromise;

  monitorAuthPromise = requestMonitorApi("https://xn--wbt59p7locqcy71c.xyz/api/challenge").then(function (challenge) {
    if (!challenge || !challenge.token || !Array.isArray(challenge.options) || !challenge.options.length) {
      throw new Error("获取验证挑战失败");
    }
    var firstOption = challenge.options[0];
    return requestMonitorApi("https://xn--wbt59p7locqcy71c.xyz/api/challenge/answer", {
      method: "POST",
      body: JSON.stringify({
        token: challenge.token,
        option_ids: [firstOption.id]
      })
    });
  }).then(function (res) {
    if (res && res.passed) {
      return true;
    }
    throw new Error((res && res.message) || "验证未通过");
  }).catch(function (err) {
    monitorAuthPromise = null;
    throw err;
  });

  return monitorAuthPromise;
}

function requestMonitorApiWithAuth(url, options) {
  return requestMonitorApi(url, options).catch(function (err) {
    if (err && (err.status === 401 || (err.message && err.message.indexOf("登录已失效") !== -1))) {
      monitorAuthPromise = null;
      return ensureMonitorAuth().then(function () {
        return requestMonitorApi(url, options);
      });
    }
    throw err;
  });
}

function requestMonitorApi(url, options) {
  options = options || {};
  return new Promise(function (resolve, reject) {
    if (typeof GM_xmlhttpRequest !== "function") {
      console.warn("[DouyuX][监控室] 当前环境缺少 GM_xmlhttpRequest");
      reject(new Error("GM_xmlhttpRequest 不可用"));
      return;
    }

    var ua = (typeof navigator !== "undefined" && navigator.userAgent)
      ? navigator.userAgent
      : ((typeof window !== "undefined" && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : "");

    var headers = {
      "Origin": "https://xn--wbt59p7locqcy71c.xyz",
      "Referer": "https://xn--wbt59p7locqcy71c.xyz/",
      "Content-Type": "application/json",
      "User-Agent": ua
    };

    if (options.headers) {
      for (var key in options.headers) {
        if (Object.prototype.hasOwnProperty.call(options.headers, key)) {
          headers[key] = options.headers[key];
        }
      }
    }

    GM_xmlhttpRequest({
      method: options.method || "GET",
      url: url,
      headers: headers,
      data: options.body || options.data || undefined,
      timeout: options.timeout || 15000,
      onload: function (res) {
        try {
          var data = res.responseText ? JSON.parse(res.responseText) : {};
          if (res.status === 401 || (data && data.detail && data.detail.indexOf("登录已失效") !== -1)) {
            var authErr = new Error(data.detail || "登录已失效");
            authErr.status = 401;
            authErr.data = data;
            reject(authErr);
            return;
          }
          if (res.status >= 400) {
            var httpErr = new Error(data.detail || ("HTTP " + res.status));
            httpErr.status = res.status;
            reject(httpErr);
            return;
          }
          resolve(data);
        } catch (e) {
          reject(new Error("解析响应数据失败: " + e.message));
        }
      },
      onerror: function (err) {
        reject(err || new Error("网络请求失败"));
      },
      ontimeout: function () {
        reject(new Error("请求超时"));
      }
    });
  });
}

function getMonitorRoomId() {
  try {
    var win = typeof unsafeWindow !== "undefined" ? unsafeWindow : (typeof window !== "undefined" ? window : null);
    if (win) {
      if (win.$ROOM && win.$ROOM.room_id) return String(win.$ROOM.room_id);
      if (win.room_id) return String(win.room_id);
    }
  } catch (e) {}

  try {
    if (typeof window !== "undefined" && window.location) {
      var m = window.location.pathname.match(/\/(\d+)/);
      if (m && m[1]) return m[1];
    }
  } catch (e) {}

  return "";
}

function parseUidFromUserResult(res) {
  if (!res) return null;
  if (typeof res === "number" || (typeof res === "string" && /^\d+$/.test(res.trim()))) {
    return String(res).trim();
  }
  if (res.uid !== undefined && res.uid !== null && String(res.uid).trim() !== "") {
    return String(res.uid).trim();
  }
  if (res.userId !== undefined && res.userId !== null && String(res.userId).trim() !== "") {
    return String(res.userId).trim();
  }
  if (res.user_id !== undefined && res.user_id !== null && String(res.user_id).trim() !== "") {
    return String(res.user_id).trim();
  }
  if (res.id !== undefined && res.id !== null && String(res.id).trim() !== "") {
    return String(res.id).trim();
  }

  // 匹配 candidates 字段（琦酱监控室 /api/chat/users 返回结构）
  if (Array.isArray(res.candidates) && res.candidates.length > 0) {
    for (var c = 0; c < res.candidates.length; c++) {
      var cand = res.candidates[c];
      if (cand && cand.uid !== undefined && cand.uid !== null && String(cand.uid).trim() !== "") {
        return String(cand.uid).trim();
      }
    }
  }

  var list = Array.isArray(res) ? res : (res.items || res.users || res.data || res.list || res.results);
  if (Array.isArray(list) && list.length > 0) {
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) continue;
      if (typeof item === "number" || (typeof item === "string" && /^\d+$/.test(item.trim()))) {
        return String(item).trim();
      }
      if (item.uid !== undefined && item.uid !== null && String(item.uid).trim() !== "") {
        return String(item.uid).trim();
      }
      if (item.userId !== undefined && item.userId !== null && String(item.userId).trim() !== "") {
        return String(item.userId).trim();
      }
      if (item.user_id !== undefined && item.user_id !== null && String(item.user_id).trim() !== "") {
        return String(item.user_id).trim();
      }
      if (item.id !== undefined && item.id !== null && String(item.id).trim() !== "") {
        return String(item.id).trim();
      }
    }
  }

  var nested = res.data || res.user;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    if (nested.uid !== undefined && nested.uid !== null && String(nested.uid).trim() !== "") {
      return String(nested.uid).trim();
    }
    if (nested.userId !== undefined && nested.userId !== null && String(nested.userId).trim() !== "") {
      return String(nested.userId).trim();
    }
    if (nested.user_id !== undefined && nested.user_id !== null && String(nested.user_id).trim() !== "") {
      return String(nested.user_id).trim();
    }
    if (nested.id !== undefined && nested.id !== null && String(nested.id).trim() !== "") {
      return String(nested.id).trim();
    }
  }

  return null;
}

function fetchMonitorData(keyword, type, roomId) {
  /*
   * 监控室两步查询接口
   * @param {string} keyword 用户昵称或 UID
   * @param {string} [type="danmaku"] 查询类型（"danmaku" 弹幕查询 / "gift" 礼物查询）
   * @param {string} [roomId=""] 目标房间号（读取下拉框选中的 value）
   * @returns {Promise}
   */
  return new Promise(function (resolve, reject) {
    var rawInput = typeof keyword === "string" ? keyword.trim() : String(keyword || "").trim();

    // 优先读取传入的 roomId 或从下拉框读取
    var targetRoomId = (roomId !== undefined && roomId !== null)
      ? String(roomId).trim()
      : (function () {
        var sel = typeof document !== "undefined" ? document.querySelector(".monitor-query__anchor-select") : null;
        return (sel && sel.value !== undefined) ? String(sel.value).trim() : getMonitorRoomId();
      })();

    if (type === "gift") {
      var timeSelect = typeof document !== "undefined" ? document.querySelector(".monitor-query__gift-time-select") : null;
      var timeKind = timeSelect ? timeSelect.value : "today";
      return fetchMonitorGiftStats(targetRoomId, timeKind).then(function (statsRes) {
        resolve(statsRes);
      }).catch(function (err) {
        reject(err);
      });
    }

    if (!rawInput) {
      reject(new Error("请输入用户昵称或UID"));
      return;
    }

    var uidPromise;
    if (/^\d+$/.test(rawInput)) {
      uidPromise = Promise.resolve(rawInput);
    } else {
      var userUrl = targetRoomId
        ? ("https://xn--wbt59p7locqcy71c.xyz/api/chat/users?room_id=" + encodeURIComponent(targetRoomId) + "&nickname=" + encodeURIComponent(rawInput))
        : ("https://xn--wbt59p7locqcy71c.xyz/api/chat/users?nickname=" + encodeURIComponent(rawInput));
      uidPromise = requestMonitorApiWithAuth(userUrl).then(function (userRes) {
        var uid = parseUidFromUserResult(userRes);
        if (!uid) {
          throw new Error("未能解析出用户UID");
        }
        return uid;
      });
    }

    uidPromise.then(function (uid) {
      var dataUrl = (type === "gift")
        ? (targetRoomId
            ? ("https://xn--wbt59p7locqcy71c.xyz/api/gifts?room_id=" + encodeURIComponent(targetRoomId) + "&page=1&page_size=20&uid=" + encodeURIComponent(uid))
            : ("https://xn--wbt59p7locqcy71c.xyz/api/gifts?page=1&page_size=20&uid=" + encodeURIComponent(uid)))
        : (targetRoomId
            ? ("https://xn--wbt59p7locqcy71c.xyz/api/chat?room_id=" + encodeURIComponent(targetRoomId) + "&page=1&page_size=20&uid=" + encodeURIComponent(uid))
            : ("https://xn--wbt59p7locqcy71c.xyz/api/chat?page=1&page_size=20&uid=" + encodeURIComponent(uid)));
      return requestMonitorApiWithAuth(dataUrl);
    }).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function escapeMonitorHtml(s) {
  if (s === null || s === undefined) return "-";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMonitorData(res) {
  var tbody = document.querySelector(".monitor-query__tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  var items = (res && Array.isArray(res.items)) ? res.items : (Array.isArray(res) ? res : []);
  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="monitor-query__empty">未查询到相关数据</td></tr>';
    return;
  }

  var html = "";
  for (var i = 0; i < items.length; i++) {
    var item = items[i] || {};
    var anchor = item.streamer_name || item.anchor || item.anchorName || item.anchor_name || item.room_name || item.room_id || "-";
    var nick = item.nickname || item.nick || item.userName || item.name || item.nn || "-";
    var uid = item.uid || item.userId || item.user_id || item.id || "-";
    var content = item.text || item.txt || item.content || item.gift || item.gift_name || item.msg || item.danmaku || item.message || "-";
    var time = item.server_timestamp || item.received_at || item.time || item.created_at || item.datetime || item.date || item.createdAt || item.timestamp || "-";

    if (typeof time === "number") {
      try {
        var d = new Date(time > 1e11 ? time : time * 1000);
        if (!isNaN(d.getTime())) {
          var pad = function (n) { return n < 10 ? "0" + n : String(n); };
          time = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
        }
      } catch (e) {}
    }

    html += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + escapeMonitorHtml(anchor) + '</td>' +
      '<td>' + escapeMonitorHtml(nick) + '</td>' +
      '<td>' + escapeMonitorHtml(uid) + '</td>' +
      '<td>' + escapeMonitorHtml(content) + '</td>' +
      '<td>' + escapeMonitorHtml(time) + '</td>' +
    '</tr>';
  }
  tbody.innerHTML = html;
}

function renderMonitorGiftChart(data) {
  /*
   * 礼物统计竖向柱状图渲染函数
   * @param {Array<{name: string, val: number, total_value: number}>} data 统计数据数组
   */
  var container = document.querySelector(".monitor-query__chart-container");
  if (!container) return;

  var items = Array.isArray(data)
    ? data
    : (data && Array.isArray(data.items)
      ? data.items
      : (data && Array.isArray(data.gifts)
        ? data.gifts
        : (data && Array.isArray(data.list) ? data.list : [])));

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="monitor-query__empty">暂无礼物统计数据</div>';
    return;
  }

  // 按总价值从高到低排序
  var sortedItems = items.slice().sort(function (a, b) {
    var va = Number(a.total_value !== undefined ? a.total_value : (a.val !== undefined ? a.val : (a.value || 0))) || 0;
    var vb = Number(b.total_value !== undefined ? b.total_value : (b.val !== undefined ? b.val : (b.value || 0))) || 0;
    return vb - va;
  });

  var maxVal = 1;
  sortedItems.forEach(function (item) {
    if (!item) return;
    var v = Number(item.val !== undefined ? item.val : (item.total_value !== undefined ? item.total_value : (item.value !== undefined ? item.value : (item.count || 0)))) || 0;
    if (v > maxVal) maxVal = v;
  });

  var html = "";
  sortedItems.forEach(function (item, idx) {
    if (!item) return;
    var name = item.streamer_name || item.name || item.nick || item.nickname || item.giftName || item.gift_name || ("主播 " + (idx + 1));
    var val = Number(item.val !== undefined ? item.val : (item.total_value !== undefined ? item.total_value : (item.value !== undefined ? item.value : (item.count || 0)))) || 0;
    var pct = Math.min(100, Math.max(0, Math.round((val / maxVal) * 100)));
    var formattedVal = (typeof val.toLocaleString === "function" ? val.toLocaleString("zh-CN", { maximumFractionDigits: 1 }) : String(val)) + (item.value_unit ? (" " + item.value_unit) : " 鱼翅");

    html += '<div class="monitor-chart__col monitor-chart__row" title="' + escapeMonitorHtml(name) + '：' + escapeMonitorHtml(formattedVal) + '">' +
      '<div class="monitor-chart__val">' + escapeMonitorHtml(formattedVal) + '</div>' +
      '<div class="monitor-chart__bar-track monitor-chart__bar-bg">' +
        '<div class="monitor-chart__bar monitor-chart__bar-fill" style="height: ' + pct + '%;"></div>' +
      '</div>' +
      '<div class="monitor-chart__name" title="' + escapeMonitorHtml(name) + '">' + escapeMonitorHtml(name) + '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}

window.createOnlineToolsPanel = createOnlineToolsPanel;
window.createMonitorQueryPanel = createMonitorQueryPanel;
window.openMonitorQueryPanel = openMonitorQueryPanel;
window.openLvjiangModal = openLvjiangModal;
window.requestMonitorApi = requestMonitorApi;
window.ensureMonitorAuth = ensureMonitorAuth;
window.requestMonitorApiWithAuth = requestMonitorApiWithAuth;
window.fetchMonitorData = fetchMonitorData;
window.fetchMonitorGiftStats = fetchMonitorGiftStats;
window.renderMonitorData = renderMonitorData;
window.renderMonitorGiftChart = renderMonitorGiftChart;

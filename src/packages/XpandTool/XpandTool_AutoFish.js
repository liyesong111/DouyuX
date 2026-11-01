let autoFishInfo = [];
let baitId = null;
let nextFishEndTime = 0;
let isFishing = false;
let timerAutoFish = 0;

// 自动钓鱼专属安全验证签名（多轮迭代加盐哈希，杜绝明文暴露）
const AUTOFISH_AUTH_SIGNATURE = "ba7a17a2b58932369ffa710f6ef4c177";

function AutoFish_verifyAuth(input) {
  if (!input || typeof input !== "string") return false;
  if (typeof hex_md5 !== "function") return true;
  const s = "DouyuX_AutoFish_Auth_Salt_2026_@!";
  let f = s + input.trim() + s;
  for (let i = 0; i < 3000; i++) {
    f = hex_md5(f + s);
  }
  return f === AUTOFISH_AUTH_SIGNATURE;
}

function AutoFish_showAuthModal(onSuccess, onCancel) {
  var oldModal = document.getElementById("douyux-fish-auth-modal");
  if (oldModal && oldModal.parentNode) oldModal.parentNode.removeChild(oldModal);

  var modal = document.createElement("div");
  modal.id = "douyux-fish-auth-modal";
  modal.className = "douyux-auth-backdrop";
  modal.innerHTML = [
    '<div class="douyux-auth-dialog" role="dialog" aria-modal="true" aria-label="安全验证">',
    '  <div class="douyux-auth-header">',
    '    <span class="douyux-auth-icon">🔐</span>',
    '    <span class="douyux-auth-title">安全验证</span>',
    '    <button type="button" class="douyux-auth-close" title="取消">×</button>',
    '  </div>',
    '  <div class="douyux-auth-body">',
    '    <p class="douyux-auth-desc">开启「自动钓鱼」功能需要验证安全口令：</p>',
    '    <div class="douyux-auth-input-wrap">',
    '      <input type="password" class="douyux-auth-input" maxlength="32" placeholder="请输入操作口令" autocomplete="off" />',
    '    </div>',
    '    <div class="douyux-auth-tip" style="display:none;"></div>',
    '  </div>',
    '  <div class="douyux-auth-footer">',
    '    <button type="button" class="douyux-auth-btn douyux-auth-cancel">取消</button>',
    '    <button type="button" class="douyux-auth-btn douyux-auth-confirm">确认开启</button>',
    '  </div>',
    '</div>'
  ].join("");

  (document.body || document.documentElement).appendChild(modal);

  var input = modal.querySelector(".douyux-auth-input");
  var tip = modal.querySelector(".douyux-auth-tip");
  var closeBtn = modal.querySelector(".douyux-auth-close");
  var cancelBtn = modal.querySelector(".douyux-auth-cancel");
  var confirmBtn = modal.querySelector(".douyux-auth-confirm");

  function cleanup() {
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    document.removeEventListener("keydown", handleKeyDown);
  }

  function handleCancel() {
    cleanup();
    if (typeof onCancel === "function") onCancel();
  }

  function handleConfirm() {
    var val = (input ? input.value : "").trim();
    if (AutoFish_verifyAuth(val)) {
      cleanup();
      try {
        sessionStorage.setItem("DX_AF_AUTH", "1");
      } catch (_) {}
      if (typeof onSuccess === "function") onSuccess();
    } else {
      if (tip) {
        tip.textContent = "口令错误，请重新输入";
        tip.style.display = "block";
      }
      if (input) {
        input.value = "";
        input.focus();
        input.style.borderColor = "#ef4444";
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      handleCancel();
    } else if (e.key === "Enter" || e.keyCode === 13) {
      handleConfirm();
    }
  }

  if (closeBtn) closeBtn.onclick = handleCancel;
  if (cancelBtn) cancelBtn.onclick = handleCancel;
  if (confirmBtn) confirmBtn.onclick = handleConfirm;
  modal.onclick = function (e) {
    if (e.target === modal) handleCancel();
  };

  document.addEventListener("keydown", handleKeyDown);
  setTimeout(function () {
    if (input) input.focus();
  }, 50);
}

function AutoFish_promptAuth(onSuccess, onCancel) {
  if (typeof hex_md5 !== "function") {
    if (typeof onSuccess === "function") onSuccess();
    return;
  }
  if (typeof document === "undefined" || !document.body) {
    var p = typeof prompt === "function" ? prompt("请输入自动钓鱼操作口令：") : "";
    if (AutoFish_verifyAuth(p)) {
      if (typeof onSuccess === "function") onSuccess();
    } else {
      if (typeof onCancel === "function") onCancel();
    }
    return;
  }
  AutoFish_showAuthModal(onSuccess, onCancel);
}

// 活动接口单次请求的上限：超过就按失败处理（不设上限时，黑洞连接会让 await 永远挂着）
const AUTOFISH_REQUEST_TIMEOUT = 15000;
// 连续失败多少次就停手（1.5 秒一轮，失败不能无限重试刷屏）
const AUTOFISH_MAX_FAIL = 3;
let autoFishFailCount = 0;

/**
 * 活动接口的统一请求：**一定会 settle**。
 *
 * 旧实现四个包装器的 .catch 只 console.log 不 resolve —— 请求失败 / 被拦截 / 响应不是 JSON 时
 * await 就永远挂着：勾选框已选中、两种模式单选被 AutoFish_lockMode(true) 锁死、界面零提示，
 * 用户只能刷新页面。现在：成功给解析后的 JSON，失败 / 超时 / 解析异常一律 resolve(null)，
 * 由调用方判空后把界面复位并给出提示。
 */
function AutoFish_requestJson(url, options, tag) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      if (typeof ExGuard_warn === "function") {
        ExGuard_warn("自动钓鱼", (tag || url) + " 超过 " + AUTOFISH_REQUEST_TIMEOUT + "ms 未返回，按失败处理");
      }
      finish(null);
    }, AUTOFISH_REQUEST_TIMEOUT);
    let request;
    try {
      request = fetch(url, options);
    } catch (e) {
      if (typeof ExGuard_warn === "function") ExGuard_warn("自动钓鱼", (tag || url) + " 请求无法发起", e);
      finish(null);
      return;
    }
    Promise.resolve(request)
      .then((res) => res.json())
      .then((ret) => finish(ret))
      .catch((err) => {
        if (typeof ExGuard_warn === "function") ExGuard_warn("自动钓鱼", (tag || url) + " 请求失败", err);
        finish(null);
      });
  });
}

/** 放弃本次自动钓鱼并复位界面：取消勾选 + 解锁模式 + 落盘，保证"界面状态 = 存储状态" */
function AutoFish_abort(message) {
  clearTimeout(timerAutoFish);
  clearInterval(timerAutoFish);
  const checkbox = document.getElementById("extool__autofish_start");
  if (checkbox) checkbox.checked = false;
  AutoFish_lockMode(false);
  saveData_AutoFish();
  if (message) showMessage(message, "error");
  return null;
}

function initPkg_ExpandTool_AutoFish() {
  ExpandTool_AutoFish_insertFunc();
  ExpandTool_AutoFish_Set();
}

function ExpandTool_AutoFish_insertFunc() {
  document.querySelectorAll('input[name="autofish_mode"]').forEach(radio => {
    radio.addEventListener("change", saveData_AutoFish);
  });
  
  const checkbox = document.getElementById("extool__autofish_start");
  if (!checkbox) return;

  checkbox.addEventListener("click", async () => {
    const isStart = checkbox.checked;
    if (!isStart) {
      clearTimeout(timerAutoFish);
      clearInterval(timerAutoFish);
      AutoFish_lockMode(false);
      saveData_AutoFish();
      return;
    }

    // 开启前先恢复未勾选，等待口令校验通过
    checkbox.checked = false;
    AutoFish_lockMode(false);

    AutoFish_promptAuth(
      () => {
        checkbox.checked = true;
        AutoFish_lockMode(true);
        saveData_AutoFish();
        AutoFish_startAction();
      },
      () => {
        checkbox.checked = false;
        AutoFish_lockMode(false);
        saveData_AutoFish();
        if (typeof showMessage === "function") {
          showMessage("【自动钓鱼】口令验证未通过或已取消", "info");
        }
      }
    );
  });
}

async function AutoFish_startAction() {
    showMessage("【自动钓鱼】开始自动钓鱼", "info");
    autoFishInfo = await AutoFish_getFishInfo();
    const homepageRes = await AutoFish_getHomepageData();
    // 两个请求任一失败（断网 / 接口被拦 / 超时）都会拿到 null：
    // 旧实现这里 await 永不返回，界面就停在"勾选着 + 模式被锁死"的状态。
    if (!Array.isArray(autoFishInfo) || !homepageRes) {
      autoFishInfo = [];
      return AutoFish_abort("【自动钓鱼】活动信息获取失败，请稍后重试");
    }
    if (homepageRes.data) {
      let baitData = (homepageRes.data.baits || []).find((item) => item.inUse);
      if (!baitData) {
        return AutoFish_abort("【自动钓鱼】请设置鱼饵");
      }
      baitId = baitData.id;

      const myCh = homepageRes.data.myCh;
      if (!myCh) {
        return AutoFish_abort("【自动钓鱼】请设置形象");
      }
    } else {
      return AutoFish_abort("【自动钓鱼】未能获取活动信息");
    }
    saveData_AutoFish();

    if (homepageRes.data.fishing.stat == 0) {
      // 未开始钓鱼
      isFishing = false;
      nextFishEndTime = 0;
    }

    if (homepageRes.data.fishing.stat == 1) {
      // 还在钓鱼中
      isFishing = true;
      nextFishEndTime = homepageRes.data.fishing.fishEtMs;
    }

    if (homepageRes.data.fishing.stat == 2) {
      // 上一次未收杆
      await endFish();
      await sleep(1000);
    }

    async function fishLoop() {
      const isStart = document.getElementById("extool__autofish_start")?.checked;
      if (!isStart) return;
      try {
        if (isInFishingTime()) {
          if (isFishing) {
            // 正在钓鱼中，检测是否到时间收杆
            const now = new Date().getTime();
            if (now > nextFishEndTime) {
              await endFish();
            }
          } else {
            const fishRes = await AutoFish_startFish();
            if (!fishRes) {
              // 请求层失败（断网 / 超时 / 响应不是 JSON）：既不能拿 null 当响应继续解引用，
              // 也不该每 1.5 秒无脑重试 —— 连续 3 次就停手并复位界面。
              autoFishFailCount++;
              if (typeof ExGuard_warn === "function") {
                ExGuard_warn("自动钓鱼", "下杆请求失败（连续 " + autoFishFailCount + " 次）");
              }
              if (autoFishFailCount >= AUTOFISH_MAX_FAIL) {
                AutoFish_abort("【自动钓鱼】连续 " + AUTOFISH_MAX_FAIL + " 次请求失败，已停止");
                return;
              }
            } else {
              autoFishFailCount = 0;
              if (fishRes.error !== 0) {
                showMessage(`【自动钓鱼】${fishRes.msg}`, "error");
                console.log(fishRes, "钓鱼失败");
                if (fishRes.error == 1001007) {
                  // 操作失败
                  await endFish();
                } else if (fishRes.error == 1005003) {
                  // 鱼饵不足
                  return AutoFish_abort(null);
                } else if (fishRes.msg && (fishRes.msg.includes("未获得本房粉丝牌") || fishRes.msg.includes("粉丝牌"))) {
                  // 未获得本房粉丝牌无法参与钓鱼：提示一次后自动关停
                  return AutoFish_abort(null);
                }
              } else if (fishRes.data && fishRes.data.fishing) {
                isFishing = true;
                nextFishEndTime = fishRes.data.fishing.fishEtMs;
              }
            }
          }
        }
      } catch (err) {
        console.error("[DouyuX] 自动钓鱼轮询异常:", err);
      } finally {
        const stillRunning = document.getElementById("extool__autofish_start")?.checked;
        if (stillRunning) {
          timerAutoFish = setTimeout(fishLoop, 1500);
        }
      }
    }
    fishLoop();
}

async function endFish() {
  const fishRes = await AutoFish_endFish();
  if (!fishRes) {
    // 收杆请求失败：旧实现这里直接解引用 null 抛 TypeError（在 fishLoop 里被吞成一条 console.error）
    autoFishFailCount++;
    if (typeof ExGuard_warn === "function") {
      ExGuard_warn("自动钓鱼", "收杆请求失败（连续 " + autoFishFailCount + " 次）");
    }
    if (autoFishFailCount >= AUTOFISH_MAX_FAIL) {
      AutoFish_abort("【自动钓鱼】连续 " + AUTOFISH_MAX_FAIL + " 次请求失败，已停止");
    }
    return;
  }
  autoFishFailCount = 0;
  if (fishRes.error !== 0) {
    console.log(fishRes, "收杆失败");
    if (fishRes.msg && (fishRes.msg.includes("未获得本房粉丝牌") || fishRes.msg.includes("粉丝牌"))) {
      return AutoFish_abort(`【自动钓鱼】${fishRes.msg}`);
    }
    const homepageRes = await AutoFish_getHomepageData();
    if (homepageRes && homepageRes.data && homepageRes.data.fishing && homepageRes.data.fishing.stat == 0) {
      // 钓鱼已完成
      isFishing = false;
      nextFishEndTime = 0;
    }
    return;
  }
  let str = `【自动钓鱼】`;
  const fish = fishRes.data && fishRes.data.fish ? fishRes.data.fish : null;
  const fishList = Array.isArray(autoFishInfo) ? autoFishInfo : [];
  let fishData = fish ? fishList.find((item) => item.fishId == fish.id) : null;
  if (fishData && fish) {
    str += `获得${fishData.name}${fish.wei}斤`;
  }
  const awards = fishRes.data && Array.isArray(fishRes.data.awards) ? fishRes.data.awards : [];
  if (awards.length > 0) {
    for (let i = 0; i < awards.length; i++) {
      let award = awards[i];
      str += `${fishData ? "，" : ""}获得${award.awardName}x${award.awardNum}`;
    }
  }
  if (str !== "【自动钓鱼】") showMessage(str, "success");
  isFishing = false;
}

function AutoFish_getSave() {
  let data;
  try {
    data = JSON.parse(localStorage.getItem("ExSave_AutoFish"));
  } catch (e) {
    data = null;
  }
  if (!data || typeof data !== "object") data = {};
  if (!Array.isArray(data.rids)) data.rids = [];
  if (!data.modes || typeof data.modes !== "object") data.modes = {};
  return data;
}

function AutoFish_lockMode(lock) {
  document.querySelectorAll('input[name="autofish_mode"]').forEach((r) => (r.disabled = lock));
}

function saveData_AutoFish() {
  let checkbox = document.getElementById("extool__autofish_start");
  let modeRadio = document.querySelector('input[name="autofish_mode"]:checked');
  if (!checkbox || !modeRadio) return;

  let value = checkbox.checked;
  let mode = modeRadio.value;
  let data = AutoFish_getSave();
  
  if (value) {
    if (!data.rids.includes(rid)) data.rids.push(rid);
    data.modes[rid] = mode;
  } else {
    data.rids = data.rids.filter((item) => item !== rid);
    delete data.modes[rid];
  }
  
  localStorage.setItem("ExSave_AutoFish", JSON.stringify(data));
}

function AutoFish_getRids() {
  return AutoFish_getSave().rids;
}

function ExpandTool_AutoFish_Set() {
  let data = AutoFish_getSave();
  if (!data.rids.includes(rid)) return;

  // 设置模式（兼容旧版本，默认全天）
  // 旧实现在这里裸取 .checked / .click()：存储里的 mode 值一旦不在选项里
  //（改版删过模式 / 手改过 localStorage），整个 initPkg_ExpandTool 就停在 TypeError，
  // 后面所有扩展功能一起消失。
  let mode = data.modes && data.modes[rid] ? data.modes[rid] : "all";
  const modeRadio = document.querySelector(`input[name="autofish_mode"][value="${mode}"]`);
  if (!modeRadio) {
    if (typeof ExGuard_warn === "function") ExGuard_warn("自动钓鱼", "存储里的模式值非法（" + mode + "），本次不自动开启");
    return;
  }
  modeRadio.checked = true;

  const checkbox = document.getElementById("extool__autofish_start");
  if (!checkbox) {
    if (typeof ExGuard_warn === "function") ExGuard_warn("自动钓鱼", "面板里的开关不存在，本次不自动开启");
    return;
  }

  // 只有在本会话已验证口令，刷新时才自动恢复挂机；避免非本人访问时自动执行
  var isSessionAuthed = false;
  try {
    isSessionAuthed = sessionStorage.getItem("DX_AF_AUTH") === "1";
  } catch (_) {}

  if (isSessionAuthed) {
    checkbox.checked = true;
    AutoFish_lockMode(true);
    AutoFish_startAction();
  } else {
    checkbox.checked = false;
    AutoFish_lockMode(false);
  }
}

function AutoFish_getFishInfo() {
  return AutoFish_requestJson(
    `https://www.douyu.com/japi/revenuenc/web/actfans/achieve/accList?rid=${rid}&type=1&period=1`,
    { method: "GET", mode: "no-cors", cache: "default", credentials: "include" },
    "成就列表"
  ).then((ret) => {
    if (!ret) return null; // 请求层失败：调用方必须判空
    return ret.data && Array.isArray(ret.data.accList) ? ret.data.accList : [];
  });
}

function AutoFish_getHomepageData() {
  return AutoFish_requestJson(
    `https://www.douyu.com/japi/revenuenc/web/actfans/fishing/homePage?rid=${rid}&opt=1`,
    { method: "GET", mode: "no-cors", cache: "default", credentials: "include" },
    "活动首页"
  );
}

function AutoFish_startFish() {
  return AutoFish_requestJson("https://www.douyu.com/japi/revenuenc/web/actfans/fishing/fishing", {
    method: "POST",
    mode: "no-cors",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `ctn=${getCCN()}&rid=${rid}&baitId=${baitId}&ver=1.1`
  }, "下杆");
}

function AutoFish_endFish() {
  return AutoFish_requestJson("https://www.douyu.com/japi/revenuenc/web/actfans/fishing/reelIn", {
    method: "POST",
    mode: "no-cors",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `ctn=${getCCN()}&rid=${rid}`
  }, "收杆");
}

function isInFishingTime() {
  let modeRadio = document.querySelector('input[name="autofish_mode"]:checked');
  let mode = modeRadio ? modeRadio.value : "all";
  if (mode === "all") return true;
  
  let now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  
  // 钓鱼大赛：12:00-24:00，每个整点的前半小时（包括00:00-00:30）
  return (hour >= 12 && minute < 30) || (hour === 0 && minute < 30);
}

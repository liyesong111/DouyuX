function initPkg_ExpandTool() {
  // 逐步兜底（与 LiveTool_tryInit / main.js 的 initPkg_Safe 同一口径）：
  // 历史上任一步 DOM 缺失（页面少一个容器类名、面板被裁剪）都会抛错并中断后面的初始化，
  // 而外层 initPkg_Safe 只兜一次 —— 用户看到的是"扩展功能整块没了"，日志里只有一行。
  ExpandTool_tryInit("面板", initPkg_ExpandTool_Dom);
  ExpandTool_tryInit("交互", initPkg_ExpandTool_Func);
  ExpandTool_tryInit("模块", initPkg_ExpandTool_Module);
}

/** 单步隔离：失败报出模块名后继续，不影响同一批里的其它模块 */
function ExpandTool_tryInit(name, fn) {
  try {
    if (typeof fn === "function") fn();
    return true;
  } catch (e) {
    if (typeof ExGuard_warn === "function") {
      ExGuard_warn("扩展功能", name + " 初始化失败（其余模块照常）", e);
    } else {
      console.error("[DouyuX] 扩展功能初始化失败：" + name + " —— " + ((e && e.message) || e));
    }
    return false;
  }
}

function initPkg_ExpandTool_Module() {
  // 逐个兜底：某个模块的开关元素缺失 / 结构变更只影响它自己，不连坐后面的模块
  const modules = [
    ["自动宝箱", initPkg_ExpandTool_Treasure],
    ["礼物红包", initPkg_ExpandTool_RedPacket_Room],
    ["自动钓鱼", initPkg_ExpandTool_AutoFish],
    ["清理背包", initPkg_ExpandTool_ClearBag],
    ["打榜送礼", initPkg_ExpandTool_SendGift],
    ["Tab 切换", initPkg_ExpandTool_TabSwitch],
    ["P2P", initPkg_ExpandTool_P2P],
    ["网页全屏", initPkg_ExpandTool_FullScreen],
    ["弹幕颜色", initPkg_ExpandTool_AutoBarrageColor],
    ["弹幕屏蔽", initPkg_ExpandTool_Shield]
  ];
  for (let i = 0; i < modules.length; i++) {
    ExpandTool_tryInit(modules[i][0], modules[i][1]);
  }
}

function initPkg_ExpandTool_Dom() {
  ExpandTool_insertModal();
  ExpandTool_insertIcon();
}

function ExpandTool_insertModal() {
  let existing = document.querySelector(".extool");
  if (existing) return;

  let a = document.createElement("div");
  a.className = "extool miuix-modal";
  a.innerHTML = `
    <div class="miuix-modal__body">
      <!-- 卡片 1: 播放与性能 -->
      <div class="fans-panel__card">
        <div class="fans-panel__card-header">
          <span class="fans-panel__card-title">播放与性能</span>
          <span style="font-size: 11px; color: #0066ff; font-weight: 600;">极速秒开</span>
        </div>
        <div class="sign-options-list">
          <label class="sign-option-item" title="自动锁定最高原画画质，开播无缝秒开">
            <div class="sign-option-text">
              <span class="sign-option-title">自动最高画质</span>
              <span class="sign-option-desc">源头锁定原画秒开，杜绝二次切流卡顿</span>
            </div>
            <input id="extool__highestvideoquality" class="sign-checkbox" type="checkbox">
          </label>
          <label class="sign-option-item" title="自动展开网页全屏观播">
            <div class="sign-option-text">
              <span class="sign-option-title">自动网页全屏</span>
              <span class="sign-option-desc">进入直播间自动铺满网页全屏</span>
            </div>
            <input id="extool__fullscreen" class="sign-checkbox" type="checkbox">
          </label>
          <label class="sign-option-item" title="阻断 WebRTC P2P 后台上传带宽占用">
            <div class="sign-option-text">
              <span class="sign-option-title">阻止P2P上传</span>
              <span class="sign-option-desc">阻止后台偷跑上行带宽，显著降低延迟</span>
            </div>
            <input id="extool__p2p" class="sign-checkbox" type="checkbox">
          </label>
          <label class="sign-option-item" title="后台播放保活，阻止浏览器页签睡眠冻结">
            <div class="sign-option-text">
              <span class="sign-option-title">防页签冻结</span>
              <span class="sign-option-desc">阻止浏览器休眠后台挂机页签</span>
            </div>
            <input id="extool__tabSwitch" class="sign-checkbox" type="checkbox">
          </label>
          <label class="sign-option-item" title="进房后自动选择已解锁的最高档粉丝弹幕颜色">
            <div class="sign-option-text">
              <span class="sign-option-title">自动最高弹幕色</span>
              <span class="sign-option-desc">自动匹配当前佩戴粉丝牌最高弹幕色</span>
            </div>
            <input id="extool__autobarragecolor" class="sign-checkbox" type="checkbox">
          </label>
        </div>
      </div>

      <!-- 卡片 1.5: 弹幕屏蔽 -->
      <div class="fans-panel__card">
        <div class="fans-panel__card-header">
          <span class="fans-panel__card-title">弹幕屏蔽</span>
          <span style="font-size: 11px; color: #64748b;">发言框上方那行「XXX 来了」也在这里关</span>
        </div>
        <div class="sign-options-list">
          <label class="sign-option-item" title="隐藏发言框上方那行「XXX 来了」进场提示">
            <div class="sign-option-text">
              <span class="sign-option-title">屏蔽进场弹幕</span>
              <span class="sign-option-desc">发言框上方的「XXX 来了」不再显示</span>
            </div>
            <input id="extool__removeEnter" class="sign-checkbox" type="checkbox">
          </label>
          <div class="sign-option-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div class="sign-option-text">
                <span class="sign-option-title">屏蔽重复弹幕</span>
                <span class="sign-option-desc">同一条弹幕只留一条，并标出重复次数</span>
              </div>
              <input id="extool__removeRepeated" class="sign-checkbox" type="checkbox">
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #64748b;">
              <span>窗口：</span>
              <input id="extool__repeatedSeconds" type="number" min="1" max="300" style="width: 65px; height: 26px; text-align: center;" value="5" />
              <span>秒（1-300）</span>
              <label style="display:inline-flex;align-items:center;gap:4px;margin-left:6px;">
                <input id="extool__enlargeDanmaku" type="checkbox" /> 放大重复弹幕
              </label>
            </div>
          </div>
          <label class="sign-option-item" title="去掉弹幕黑底与描边背景">
            <div class="sign-option-text">
              <span class="sign-option-title">屏蔽弹幕背景</span>
              <span class="sign-option-desc">去掉弹幕黑底与描边，画面更干净</span>
            </div>
            <input id="extool__removeDanmakuBg" class="sign-checkbox" type="checkbox">
          </label>
        </div>
      </div>

      <!-- 卡片 2: 挂机与福利 -->
      <div class="fans-panel__card">
        <div class="fans-panel__card-header">
          <span class="fans-panel__card-title">挂机与福利</span>
          <span style="font-size: 11px; color: #64748b;">自动化活动</span>
        </div>
        <div class="sign-options-list">
          <div class="sign-option-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div class="sign-option-text">
                <span class="sign-option-title">自动钓鱼</span>
                <span class="sign-option-desc">自动抛竿收杆，智能避免风控重入</span>
              </div>
              <input id="extool__autofish_start" class="sign-checkbox" type="checkbox">
            </div>
            <div class="miuix-seg">
              <label class="miuix-seg__item"><input name="autofish_mode" type="radio" value="all" checked><span class="miuix-seg__label">全天挂机</span></label>
              <label class="miuix-seg__item"><input name="autofish_mode" type="radio" value="contest"><span class="miuix-seg__label">仅钓鱼大赛</span></label>
            </div>
          </div>

          <div class="sign-option-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div class="sign-option-text">
                <span class="sign-option-title">半自动抢宝箱</span>
                <span class="sign-option-desc">遇验证码自动弹出，手动完成后领取</span>
              </div>
              <input id="extool__treasure_start" class="sign-checkbox" type="checkbox">
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #64748b;">
              <span>延迟补偿：</span>
              <input id="extool__treasure_delay" type="number" style="width: 65px; height: 26px; text-align: center;" value="3200" />
              <span>ms</span>
            </div>
          </div>

          <label class="sign-option-item">
            <div class="sign-option-text">
              <span class="sign-option-title">自动抢礼物红包</span>
              <span class="sign-option-desc">实时监听房间红包广播并自动领取</span>
            </div>
            <input id="extool__redpacekt_room_start" class="sign-checkbox" type="checkbox">
          </label>
        </div>
      </div>

      <!-- 卡片 3: 送礼与背包 -->
      <div class="fans-panel__card">
        <div class="fans-panel__card-header">
          <span class="fans-panel__card-title">送礼与背包</span>
          <span style="font-size: 11px; color: #64748b;">点击图标更换</span>
        </div>
        <div class="sign-options-list">
          <!-- 背包送礼 -->
          <div class="sign-option-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="sign-option-title">背包道具赠送</span>
              <span style="font-size: 10.5px; color: #64748b;">支持道具一键拉取</span>
            </div>
            <div class="miuix-gift-row">
              <div class="miuix-gift-badge" id="extool__clearbag_badge" title="点击选择背包道具">
                <input type="hidden" id="extool__clearbag_id" value="268" />
                <img class="miuix-gift-badge__icon" id="extool__clearbag_icon" src="https://gfs-op.douyucdn.cn/dygift/1806/08/01/2fa7f551b9e54d310cae7992cb59ff0b.png" alt="荧光棒" />
                <span class="miuix-gift-badge__name" id="extool__clearbag_name">荧光棒</span>
                <span class="miuix-gift-badge__arrow">›</span>
              </div>
              <div class="miuix-gift-action-wrap">
                <span style="font-size: 11.5px; color: #475569;">数量:</span>
                <input id="extool__clearbag_cnt" type="number" min="1" style="width: 44px; text-align: center;" value="1" />
                <button type="button" class="ex-send-btn" id="extool__clearbag_sendbtn">送出</button>
              </div>
            </div>
          </div>

          <!-- 打榜送礼 -->
          <div class="sign-option-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="sign-option-title">打榜批量送礼</span>
              <span style="font-size: 10.5px; color: #64748b;">全站大盘礼物池</span>
            </div>
            <div class="miuix-gift-row">
              <div class="miuix-gift-badge" id="extool__sendgift_badge" title="点击选择打榜礼物">
                <input type="hidden" id="extool__sendgift_id" value="20000" />
                <img class="miuix-gift-badge__icon" id="extool__sendgift_icon" src="https://gfs-op.douyucdn.cn/dygift/2019/05/30/ed7b5926f169266173584bbd11139815.gif" alt="弱鸡" />
                <span class="miuix-gift-badge__name" id="extool__sendgift_name">弱鸡</span>
                <span class="miuix-gift-badge__arrow">›</span>
              </div>
              <div class="miuix-gift-action-wrap">
                <span style="font-size: 11.5px; color: #475569;">数量:</span>
                <input id="extool__sendgift_cnt" type="number" min="1" style="width: 38px; text-align: center;" value="1" />
                <span style="font-size: 11.5px; color: #475569;">间隔:</span>
                <input id="extool__sendgift_delay" type="number" min="0" style="width: 38px; text-align: center;" value="0" title="间隔毫秒数" />
                <button type="button" class="ex-send-btn" id="extool__sendgift_btn">送出</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  let b = document.body;
  if (b) b.appendChild(a);
  if (typeof ensureMiuixPanelHeader === "function") {
    ensureMiuixPanelHeader(a, "扩展功能");
  }
}

function ExpandTool_insertIcon() {
  let a = document.createElement("div");
  a.className = "extool-icon";
  a.innerHTML =
    '<a class="ex-panel__icon" title="扩展功能"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect></svg><i id="extool__tip" class="ex-panel__tip"></i></a>';

  let b = document.getElementsByClassName("ex-panel__wrap")[0];
  if (b) b.insertBefore(a, b.childNodes[0]);
}

function initPkg_ExpandTool_Func() {
  let icon = document.getElementsByClassName("extool-icon")[0];
  if (icon) {
    icon.addEventListener("click", function () {
      showExRightPanel("扩展功能", this);
    });
  }
}

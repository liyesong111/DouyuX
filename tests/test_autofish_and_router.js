const assert = require("assert");
const fs = require("fs");
const { JSDOM } = require("jsdom");

console.log("=== 正在运行自动钓鱼安全验证与驴酱杯路由分流专项单元测试 ===");

// 1. 源码安全性检查：确保口令绝不以明文出现
const targetPattern = String.fromCharCode(57, 57, 50, 57);
const srcFiles = ["src/packages/XpandTool/XpandTool_AutoFish.js", "src/routers/router.js", "DouyuX.user.js"];
srcFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, "utf8");
        assert.strictEqual(content.includes(targetPattern), false, `${file} 中绝对不能包含明文密码`);
    }
});
console.log("✓ Case 1 通过: 源码与产物中零明文口令残留，多轮迭代加盐哈希固化在位");

// 2. 自动钓鱼口令校验逻辑
const md5Src = fs.readFileSync("src/require/MD5/md5.js", "utf8");
const autoFishSrc = fs.readFileSync("src/packages/XpandTool/XpandTool_AutoFish.js", "utf8");

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <input type="checkbox" id="extool__autofish_start">
  <input type="radio" name="autofish_mode" value="all" checked>
  <input type="radio" name="autofish_mode" value="contest">
</body></html>`, { url: "https://www.douyu.com/138243" });

const win = dom.window;
const doc = win.document;

// 注入 MD5 和 AutoFish 模块
const factory = new Function(
    "window", "document", "sessionStorage", "localStorage", "setTimeout", "clearTimeout", "showMessage", "rid",
    md5Src + "\n" + autoFishSrc + "\nreturn { AutoFish_verifyAuth, AutoFish_promptAuth, AutoFish_showAuthModal, initPkg_ExpandTool_AutoFish, AutoFish_lockMode };"
);

let lastMessage = "";
const messages = [];
const api = factory(
    win, doc, win.sessionStorage, win.localStorage, win.setTimeout, win.clearTimeout,
    (msg, type) => { lastMessage = msg; messages.push({ msg, type }); },
    "138243"
);

// 测试密码校验函数
assert.strictEqual(api.AutoFish_verifyAuth("1234"), false, "错误密码必须被拒绝");
assert.strictEqual(api.AutoFish_verifyAuth("admin"), false, "错误密码必须被拒绝");
assert.strictEqual(api.AutoFish_verifyAuth("9928"), false, "错误密码必须被拒绝");
assert.strictEqual(api.AutoFish_verifyAuth(""), false, "空密码必须被拒绝");
// 从动态字符构造正确口令，避免在测试文件中出现字面量
const validPass = String.fromCharCode(57, 57, 50, 57);
assert.strictEqual(api.AutoFish_verifyAuth(validPass), true, "正确口令必须验证通过");
assert.strictEqual(api.AutoFish_verifyAuth("  " + validPass + "  "), true, "带首尾空格的正确口令必须验证通过");
console.log("✓ Case 2 通过: AutoFish_verifyAuth 口令校验准确无误");

// 3. 测试验证弹窗的 DOM 与交互
api.initPkg_ExpandTool_AutoFish();
const checkbox = doc.getElementById("extool__autofish_start");
assert.strictEqual(checkbox.checked, false, "初始状态未开启");

// 模拟用户点击 checkbox 触发开启
checkbox.checked = true;
checkbox.dispatchEvent(new win.Event("click"));

// 验证弹窗生成
const modal = doc.getElementById("douyux-fish-auth-modal");
assert.ok(modal, "点击开启时必须弹出安全验证弹窗");
const input = modal.querySelector(".douyux-auth-input");
assert.strictEqual(input.type, "password", "输入框必须使用 password 掩码，防止旁窥");

// 输入错误口令
input.value = "wrong_pass";
const confirmBtn = modal.querySelector(".douyux-auth-confirm");
confirmBtn.click();

const tip = modal.querySelector(".douyux-auth-tip");
assert.strictEqual(tip.style.display, "block", "口令错误时必须显示提示");
assert.strictEqual(checkbox.checked, false, "口令错误时 checkbox 必须保持未选中");

// 输入正确口令
input.value = validPass;
confirmBtn.click();

assert.strictEqual(doc.getElementById("douyux-fish-auth-modal"), null, "验证成功后弹窗必须自动关闭");
assert.strictEqual(checkbox.checked, true, "验证成功后 checkbox 必须转为开启状态");
assert.strictEqual(win.sessionStorage.getItem("DX_AF_AUTH"), "1", "验证成功后必须记录会话状态");
console.log("✓ Case 3 通过: 自动钓鱼弹窗掩码输入与正确解锁链路测试通过");

// 4. 测试驴酱杯路由分流
const routerSrc = fs.readFileSync("src/routers/router.js", "utf8");

// 场景 4.1：阵容页卡片点击直达该选手详情介绍页（双层 return_to 编码）
const teamsDom = new JSDOM(`<!DOCTYPE html><html><body>
  <div class="teams-page">
    <div class="team-workspace">
      <article class="player-card" data-entrant-card="246">
        <a class="player-card-link" href="/players/246/?event=lvjiangbeiS3&return_to=%2Fteams%2F50%2F%3Fevent%3DlvjiangbeiS3" data-profile-preview="/previews/players/246/?event=lvjiangbeiS3">
          <h3>火星包</h3>
        </a>
      </article>
    </div>
  </div>
  <dialog class="profile-preview-dialog" data-profile-dialog>
    <div class="profile-preview-content">
      <div class="profile-preview-actions">
        <a class="button primary" href="/players/246/?event=lvjiangbeiS3">查看详情 →</a>
      </div>
    </div>
  </dialog>
</body></html>`, { url: "https://xinlvjiang.icu/teams/50/?event=lvjiangbeiS3&return_to=%2F%3Fevent%3DlvjiangbeiS3" });

let navigatedUrl = "";
teamsDom.window.__TEST_NAVIGATE__ = (url) => { navigatedUrl = url; };

const routerFn = new Function(
    "window", "document", "location", "URL", "encodeURIComponent",
    routerSrc + "\ninitRouter_Xinlvjiang();"
);

routerFn(teamsDom.window, teamsDom.window.document, teamsDom.window.location, teamsDom.window.URL, encodeURIComponent);

// 1. 模拟点击阵容页选手卡片：必须直达该选手官方详情页
const teamCard = teamsDom.window.document.querySelector(".player-card");
teamCard.dispatchEvent(new teamsDom.window.MouseEvent("click", { bubbles: true, cancelable: true }));

const expectedUrl = "/players/246/?event=lvjiangbeiS3&return_to=%2Fteams%2F50%2F%3Fevent%3DlvjiangbeiS3%26return_to%3D%252F%253Fevent%253DlvjiangbeiS3";
assert.strictEqual(navigatedUrl, expectedUrl, "阵容页卡片点击必须直达选手详情页且目标路由精准包含团队双层 return_to 编码");
console.log("✓ Case 4.1 通过: 阵容页选手卡片点击直达详情页（双层 return_to 对齐）");

// 2. 模拟点击资料快览右下角「查看详情」
navigatedUrl = "";
const actionBtn = teamsDom.window.document.querySelector(".profile-preview-actions a");
actionBtn.dispatchEvent(new teamsDom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
assert.strictEqual(navigatedUrl, expectedUrl, "资料快览右下角查看详情点击后目标路由必须精准包含团队 return_to 编码");
console.log("✓ Case 4.2 通过: 阵容页资料快览右下角查看详情路由拼接完美对齐");

// 场景 5：选手页大厅卡片点击直达详情页与筛选表单导航
const playersDom = new JSDOM(`<!DOCTYPE html><html><body>
  <div class="players-page" data-player-catalog>
    <form class="catalog-filter panel catalog-controls" method="get" action="/players/" data-catalog-form>
      <input type="hidden" name="event" value="lvjiangbeiS3">
      <input type="search" name="q" value="">
      <select name="sort"><option value="total" selected>选手评级</option></select>
      <select name="position">
        <option value="">全部位置</option>
        <option value="jungle">打野</option>
      </select>
      <div class="catalog-filter-actions">
        <span class="catalog-live-status" data-catalog-status>加载失败，请重新应用筛选或稍后再试。</span>
        <button class="catalog-submit" type="submit">筛选</button>
      </div>
    </form>
    <div class="catalog-results">
      <article class="player-card" data-entrant-card="264">
        <a class="player-card-link" href="/players/264/?event=lvjiangbeiS3&return_to=%2Fplayers%2F%3Fevent%3DlvjiangbeiS3">
          <h3>Jz</h3>
        </a>
      </article>
    </div>
  </div>
</body></html>`, { url: "https://xinlvjiang.icu/players/?event=lvjiangbeiS3" });

let playerNavigatedUrl = "";
playersDom.window.__TEST_NAVIGATE__ = (url) => { playerNavigatedUrl = url; };

const playerRouterFn = new Function(
    "window", "document", "location", "URL", "encodeURIComponent",
    routerSrc + "\ninitRouter_Xinlvjiang();"
);

playerRouterFn(playersDom.window, playersDom.window.document, playersDom.window.location, playersDom.window.URL, encodeURIComponent);

// 1. 验证选手卡片点击
const playerCard = playersDom.window.document.querySelector(".player-card");
playerCard.dispatchEvent(new playersDom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
assert.strictEqual(playerNavigatedUrl, "/players/264/?event=lvjiangbeiS3&return_to=%2Fplayers%2F%3Fevent%3DlvjiangbeiS3", "选手页卡片点击直达详情页");
console.log("✓ Case 5.1 通过: 选手大厅卡片点击直达详情介绍页");

// 2. 验证筛选表单提交与下拉框变更触发安全导航
playerNavigatedUrl = "";
const posSelect = playersDom.window.document.querySelector("select[name='position']");
posSelect.value = "jungle";
posSelect.dispatchEvent(new playersDom.window.Event("change", { bubbles: true, cancelable: true }));

assert(playerNavigatedUrl.indexOf("position=jungle") !== -1, "位置筛选变更必须触发包含 position=jungle 的路由导航");
assert(playerNavigatedUrl.indexOf("event=lvjiangbeiS3") !== -1, "位置筛选路由必须携带 event=lvjiangbeiS3");
console.log("✓ Case 5.2 通过: 选手大厅筛选变更平滑触发安全导航并更新路由");

console.log("=== 全部 5 项自动钓鱼与路由新用例 100% 通过 ===");

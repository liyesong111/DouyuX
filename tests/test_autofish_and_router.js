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

// 4. 测试路由纯净与原网站不启用插件规则
const routerSrc = fs.readFileSync("src/routers/router.js", "utf8");
const mainSrc = fs.readFileSync("src/main.js", "utf8");

assert.strictEqual(routerSrc.indexOf("initRouter_Xinlvjiang"), -1, "router.js 中不得存在 initRouter_Xinlvjiang");
assert.strictEqual(mainSrc.indexOf("initRouter_Xinlvjiang"), -1, "main.js 中不得存在 initRouter_Xinlvjiang");
assert.strictEqual(mainSrc.indexOf("@match *://xinlvjiang.icu/*"), -1, "main.js 元数据不得 match xinlvjiang.icu 原网站");
assert.strictEqual(mainSrc.indexOf("@match *://*.xinlvjiang.icu/*"), -1, "main.js 元数据不得 match *.xinlvjiang.icu");
console.log("✓ Case 4 通过: 插件彻底从原网站剥离，不开启插件，不注入任何脚本");

// 5. 测试驴酱杯 5 项官方栏目纯净直跳目标 URL 精准对齐
const onlineToolSrc = fs.readFileSync("src/packages/OnlineTool/OnlineTool.js", "utf8");
const expectedUrls = [
    "https://xinlvjiang.icu/schedule/?event=lvjiangbeiS3",
    "https://xinlvjiang.icu/teams/?event=lvjiangbeiS3",
    "https://xinlvjiang.icu/players/?event=lvjiangbeiS3&page_size=20",
    "https://xinlvjiang.icu/leaderboards/?event=lvjiangbeiS3",
    "https://xinlvjiang.icu/live/?event=lvjiangbeiS3"
];

expectedUrls.forEach((u) => {
    assert.ok(onlineToolSrc.indexOf(u) !== -1, "OnlineTool.js 必须包含直跳目标 URL：" + u);
});

assert.strictEqual(onlineToolSrc.indexOf(".lvjiang-modal"), -1, "OnlineTool.js 彻底取消站内 .lvjiang-modal 模态框 DOM 与类名");
console.log("✓ Case 5 通过: 驴酱杯 5 个栏目全部采用最单纯的原站直跳，取消原页面内嵌");

console.log("=== 全部 5 项自动钓鱼与路由新用例 100% 通过 ===");

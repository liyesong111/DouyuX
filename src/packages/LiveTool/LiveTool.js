function initPkg_LiveTool() {
	LiveTool_tryInit("Module", initPkg_LiveTool_Module);
	LiveTool_tryInit("HandleFunc", initPkg_LiveTool_HandleFunc);
}

function LiveTool_tryInit(name, fn) {
	try {
		if (typeof fn === "function") fn();
	} catch (e) {
		console.error("[DouyuX] 直播间工具初始化失败：" + name + " —— " + ((e && e.message) || e));
	}
}

function initPkg_LiveTool_Module() {
	// 添加模块（逐个兜底：某个模块的容器缺失 / 结构变更只影响它自己，不连坐后面的模块）
	let modules = [
		["Treasure", initPkg_LiveTool_Treasure],
		["BarrageSpeed", initPkg_LiveTool_BarrageSpeed],
		["RankList", initPkg_LiveTool_RankList],
		["BarrageSendCheck", initPkg_LiveTool_BarrageSendCheck]
	];
	for (let i = 0; i < modules.length; i++) {
		LiveTool_tryInit(modules[i][0], modules[i][1]);
	}
}

function initPkg_LiveTool_HandleFunc() {
	// 开启ws，并且设置处理函数的入口
	// 是否生效由每个处理函数决定，可以设置一个变量保存开启状态，判断是否要执行
	let ws = new Ex_WebSocket_UnLogin(rid, (ret) => {
		// 派发链逐项隔离：任何单个处理器抛错都不再影响排在后面的人（回执 / 抢宝箱…）
		LiveTool_dispatchBarrage(ret);
	});
}

/**
 * 弹幕处理器派发表（顺序即真实执行顺序，名字只用于日志定位）。
 *
 * 在派发时现取，而不是写成顶层常量数组：处理器都是同作用域的函数声明，
 * 现取既没有「顶层常量先于函数声明求值」的时序问题，也方便单测按名替换。
 */
function LiveTool_barrageHandlers() {
	return [
		["开播提醒", initPkg_LiveTool_LiveNotice_Handle],
		["自动抢宝箱", initPkg_LiveTool_Treasure_Handle],
		["弹幕时速", initPkg_LiveTool_BarrageSpeed_Handle],
		["排行榜", initPkg_LiveTool_RankList_Handle],
		["弹幕回执", initPkg_LiveTool_BarrageSendCheck_Handle]
	];
}

function LiveTool_reportHandlerError(name, err) {
	let e = err || {};
	console.error("[DouyuX] 弹幕处理器异常：" + name + " —— " + (e.message || e));
}

/**
 * 弹幕派发：逐个处理器隔离执行。
 *
 * 历史问题（P0-2）：处理器是按顺序裸调的，关键词回复里 `regObj.exec(txt).length`
 * 在正则不命中时拿到 null 并抛 TypeError，同一个回调里排在后面的弹幕回执、
 * 投票、谢礼物…全部不会再执行 —— 一条弹幕就能打崩整条链。
 * 现在每个处理器各自 try/catch，async 处理器的 reject 也兜住，只记日志、不中断后续。
 *
 * 返回本次出错的处理器名字数组（给测试和线上自证用，正常为空数组）。
 */
function LiveTool_dispatchBarrage(ret) {
	let handlers = LiveTool_barrageHandlers();
	let failed = [];
	for (let i = 0; i < handlers.length; i++) {
		let name = handlers[i][0];
		let fn = handlers[i][1];
		if (typeof fn !== "function") continue;
		try {
			let out = fn(ret);
			if (out && typeof out.then === "function") {
				out.catch(function (err) {
					LiveTool_reportHandlerError(name + "（async）", err);
				});
			}
		} catch (err) {
			failed.push(name);
			LiveTool_reportHandlerError(name, err);
		}
	}
	return failed;
}

/**
 * 关键词规则解析（关键词回复 / 关键词禁言共用）。
 *
 * 面板写法（placeholder 已按此对齐）：
 *   普通词            —— 弹幕文本包含该子串即命中；
 *   re(正则)=期望匹配 —— 用「正则」匹配弹幕，且正则的首个匹配必须与「期望匹配」完全相等才算命中。
 *   例：re(^\d+$)=666 表示弹幕正好是 666；只写 re(正则) 不写「=期望匹配」的规则视为无效（不命中）。
 */
function LiveTool_parseKeywordRule(key) {
	let text = String(key == null ? "" : key);
	let open = text.indexOf("re(");
	if (open === -1) {
		return { kind: "literal", word: text };
	}
	let close = text.indexOf(")=", open + 3);
	if (close === -1) {
		return { kind: "invalid", source: text, reason: "缺少 )=期望匹配" };
	}
	return {
		kind: "regex",
		source: text.slice(open + 3, close),
		expect: text.slice(close + 2)
	};
}

/**
 * 判断一条弹幕是否命中某条关键词规则。
 * 任何异常（正则写错、exec 不命中返回 null）都只算「不命中」，绝不向外抛。
 */
function LiveTool_keywordRuleHit(key, txt) {
	let rule = LiveTool_parseKeywordRule(key);
	if (rule.kind === "literal") {
		if (rule.word === "") return false;
		return String(txt).indexOf(rule.word) !== -1;
	}
	if (rule.kind === "regex") {
		let regObj;
		try {
			regObj = new RegExp(rule.source, "g");
		} catch (e) {
			console.warn("[DouyuX] 无效的正则关键词规则（已跳过）：" + key + " —— " + ((e && e.message) || e));
			return false;
		}
		// 正则不命中时 exec 返回 null —— 必须先判空，再取 result[0]
		let result = regObj.exec(String(txt));
		return !!(result && result[0] === rule.expect);
	}
	return false;
}

function getType(str) {
	return getStrMiddle(str, "type@=", "/");
}

function selectOptionByValue(selectId, checkValue) {
// 根据value值选择option 
	let select = document.getElementById(selectId);  
	for(let i=0; i<select.options.length; i++){  
			if(select.options[i].value == checkValue){  
					select.options[i].selected = true;  
					break;
			}  
	}  
}
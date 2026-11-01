let barrageColorArr = [];
let barrageArr = [];
let barrageColorLength = 0;
let barrageLength = 0;
let bloopTimer;
let barrageOffset = 0;
let barrageColorOffset = 0;
let isChangeColor = true;
let isMatch = false; //是否为赛事直播间
let bloopStopTimer;
let barrageOptions = [];

function initPkg_BarrageLoop() {
	// 逐项隔离（audit-wave4 A5）：面板容器缺失、ensureMiuixPanelHeader 中途抛错等
	// 都不许把后面的步骤一起带走 —— 旧实现是三步裸调，Dom 一抛 Func/Set 就全不执行。
	BarrageLoop_tryInit("Dom", initPkg_BarrageLoop_Dom);
	BarrageLoop_tryInit("Func", initPkg_BarrageLoop_Func);
	BarrageLoop_tryInit("Set", initPkg_BarrageLoop_Set);
}

function BarrageLoop_tryInit(name, fn) {
	try {
		if (typeof fn === "function") fn();
	} catch (e) {
		if (typeof ExGuard_warn === "function") {
			ExGuard_warn("弹幕小助手", "初始化失败：" + name, e);
		} else {
			console.error("[DouyuX] 弹幕小助手初始化失败：" + name, e);
		}
	}
}

function BarrageLoop_insertModal() {
	let existing = document.querySelector(".bloop");
	if (existing) return;

	let a = document.createElement("div");
	a.className = "bloop miuix-modal";
	a.innerHTML = `
		<div class="miuix-modal__body">
			<!-- 卡片 1: 预设弹幕库与内容 -->
			<div class="fans-panel__card">
				<div class="fans-panel__card-header">
					<span class="fans-panel__card-title">弹幕词库</span>
					<span style="font-size: 11px; color: #64748b;">一行一条</span>
				</div>
				<div class="bloop__preset_row">
					<select id="bloop__select"></select>
					<input type="button" id="bloop__save" value="保存"/>
					<input type="button" id="bloop__delete" value="删除"/>
				</div>
				<textarea placeholder="一行一个" id="bloop__textarea" rows="4"></textarea>
			</div>

			<!-- 卡片 2: 发送速率与限时 -->
			<div class="fans-panel__card">
				<div class="fans-panel__card-header">
					<span class="fans-panel__card-title">速率与限时</span>
				</div>
				<div class="bloop__param_grid">
					<div class="bloop__param_item">
						<span>速度：</span>
						<input id="bloop__text_speed1" type="text" style="width:46px;text-align:center;" value="2000" />~<input id="bloop__text_speed2" type="text" style="width:46px;text-align:center;" value="3000" />
						<span>ms</span>
					</div>
					<div class="bloop__param_item">
						<span>限时：</span>
						<input id="bloop__text_stoptime" type="text" style="width:46px;text-align:center;" value="1" />
						<span>min</span>
					</div>
				</div>
			</div>

			<!-- 卡片 3: 发送策略与开关 -->
			<div class="fans-panel__card">
				<div class="fans-panel__card-header">
					<span class="fans-panel__card-title">发送策略与开关</span>
				</div>
				<div class="sign-options-list">
					<label class="sign-option-item">
						<div class="sign-option-text">
							<span class="sign-option-title">自动变色</span>
							<span class="sign-option-desc">发送时随机切换已解锁的粉丝弹幕色</span>
						</div>
						<input id="bloop__checkbox_changeColor" class="sign-checkbox" type="checkbox" name="checkbox_changeColor" checked>
					</label>
					<label class="sign-option-item">
						<div class="sign-option-text">
							<span class="sign-option-title">随机发送</span>
							<span class="sign-option-desc">打乱弹幕文本顺序随机轮换发送</span>
						</div>
						<input id="bloop__checkbox_random" class="sign-checkbox" type="checkbox">
					</label>
					<label class="sign-option-item" style="background: rgba(0, 102, 255, 0.08); border-color: rgba(0, 102, 255, 0.25); margin-top: 2px;">
						<div class="sign-option-text">
							<span class="sign-option-title" style="color: #0066ff; font-size: 13px;">循环发送弹幕</span>
							<span class="sign-option-desc">开启后按设定速度与限时循环自动发送</span>
						</div>
						<input id="bloop__checkbox_startSend" class="sign-checkbox" type="checkbox">
					</label>
				</div>
			</div>
		</div>
	`;
	
	let b = document.body;
	if (b) b.appendChild(a);
	if (typeof ensureMiuixPanelHeader === "function") {
		ensureMiuixPanelHeader(a, "弹幕小助手");
	}
}
function BarrageLoop_insertIcon() {
	let a = document.createElement("div");
	a.className = "bloop-icon";
	a.innerHTML = '<a class="ex-panel__icon" title="弹幕发送小助手"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><circle cx="8" cy="11" r="1.2" class="ex-bloop-dot"></circle><circle cx="12" cy="11" r="1.2" class="ex-bloop-dot"></circle><circle cx="16" cy="11" r="1.2" class="ex-bloop-dot"></circle></svg><i id="bloop__tip" class="ex-panel__tip"></i></a>';
	
	let b = document.getElementsByClassName("ex-panel__wrap")[0];
	if (b) {
		b.insertBefore(a, b.childNodes[0]);
	} else {
		ExGuard_warn("弹幕小助手", "未找到 .ex-panel__wrap 容器，图标未插入（面板入口不显示）");
	}
}

function getBarrageColorArr() {
	// 获取已解锁的弹幕颜色
	barrageColorArr.length = 0;// 清空数组
	barrageColorLength = 0;
	let a = document.getElementsByClassName("FansBarrageSwitcher");
	let nobleIcon = document.getElementsByClassName("NobleBarrageSwitcher is-active");
	let isNoble = false;
	if (nobleIcon.length > 0) {
		isNoble = true;
	}
	if (a.length == 0) {
		isMatch = true;
		let b = document.getElementsByClassName("MatchSystemFansBarrageSwitcher")[0];
		if (b != undefined) {
			b.click();
			a = document.getElementsByClassName("MatchSystemFansBarrageColor-item");
		} else {
			isMatch = false;
		}
		
	} else {
		a[0].click();
		a = document.getElementsByClassName("FansBarrageColor-item");
		isMatch = false;
	}
	
	for (let i = 0; i < a.length; i++) {
		let itemClassName = a[i].className;
		if (itemClassName.indexOf("is-lock") == -1) {
			barrageColorArr.push(i);
			barrageColorLength++;
		}
	}
	barrageColorLength = barrageColorLength - 1;
	
	if (isNoble == true) {
		// 页面可能在两次查询之间重绘：取不到就跳过还原，别让一次空引用打断取色
		let nobleSwitcher = document.getElementsByClassName("NobleBarrageSwitcher")[0];
		if (nobleSwitcher) {
			nobleSwitcher.click();
		} else {
			ExGuard_warn("弹幕小助手", "未找到贵族弹幕切换按钮，跳过颜色还原");
		}
	}
}


function getBarrageArr() {
	// 获取即将发送的弹幕数组
	barrageArr.length = 0;
	barrageLength = 0;
	let a = document.getElementById("bloop__textarea").value;
	barrageArr = a.split("\n");
	barrageLength = barrageArr.length - 1;
	
}

function selectBarrageColor(index) {
	// 选择粉丝弹幕
	let a;
	if (isMatch == false) {
		let switcher = document.getElementsByClassName("FansBarrageSwitcher")[0];
		if (!switcher) {
			ExGuard_warn("弹幕小助手", "未找到粉丝弹幕切换按钮，本条跳过改色");
			return;
		}
		switcher.click();
		a = document.getElementsByClassName("FansBarrageColor-item")[index];
	} else{
		let switcher = document.getElementsByClassName("MatchSystemFansBarrageSwitcher")[0];
		if (!switcher) {
			ExGuard_warn("弹幕小助手", "未找到赛事弹幕切换按钮，本条跳过改色");
			return;
		}
		switcher.click();
		a = document.getElementsByClassName("MatchSystemFansBarrageColor-item")[index];
	}
	
	if (a != undefined) {
		a.click();
	}
}

/**
 * 发送一条弹幕。
 * 返回 true = 已点发送；false = 聊天区节点不在（输入框 / 发送按钮缺失），本条没发出去。
 * 这两处原本都是 .ChatSend-txt / .ChatSend-button 的 [0] 裸解引用，
 * 页面切房重绘时整套按钮会短暂消失，一点就抛 —— 现在只留一条告警，调用方继续跑。
 */
function sendBarrage(text) {
	// 发送弹幕
	let chatDom = document.getElementsByClassName("ChatSend-txt")[0];
	if (!chatDom) {
		ExGuard_warn("弹幕发送", "未找到聊天输入框（.ChatSend-txt），本条未发送");
		return false;
	}
	if (chatDom.tagName == "TEXTAREA") {
		chatDom.value = text;
	} else {
		chatDom.innerText = text;
	}
	let sendBtn = document.getElementsByClassName("ChatSend-button")[0];
	if (!sendBtn) {
		ExGuard_warn("弹幕发送", "未找到发送按钮（.ChatSend-button），本条未发送");
		return false;
	}
	sendBtn.click();
	return true;
}

function getSpeed() {
	let min = document.getElementById("bloop__text_speed1").value;
	let max = document.getElementById("bloop__text_speed2").value;
	let ret = getRandom(Number(min), Number(max));
	return ret;
}

function saveData_BarrageLoop() {
	let speed1 = document.getElementById("bloop__text_speed1").value;
	let speed2 = document.getElementById("bloop__text_speed2").value;
	let stopTime = document.getElementById("bloop__text_stoptime").value;
	if (speed1 == "undefined") {
		speed1 = 2000;
	}
	if (speed2 == "undefined") {
		speed2 = 3000;
	}
	if (stopTime == "undefined") {
		stopTime = 5;
	}
	let data = {
		text: barrageOptions,
		speed1: speed1,
		speed2: speed2,
		stopTime: stopTime,
		isChangeColor: isChangeColor
	}
	
	localStorage.setItem("ExSave_BarrageLoopOptions", JSON.stringify(data).replace(/\\n/g, "\\r")); // 存储弹幕列表
}


function getStopTime() {
	let a = document.getElementById("bloop__text_stoptime").value;
	return Number(a) * 60 * 1000;
}

async function doLoopBarrage() {
	if (isChangeColor == true) {
		selectBarrageColor(barrageColorOffset);
		barrageColorOffset++;
		if (barrageColorOffset > barrageColorLength) {
			barrageColorOffset = 0;
		}
	}

	// 判断是否开启随机模式
	if (document.getElementById("bloop__checkbox_random").checked == true) {
		barrageOffset = Math.floor(Math.random() * barrageArr.length);
	}
	sendBarrage(barrageArr[barrageOffset]);
	
	// 如果不是随机模式，则顺序发送
	if (document.getElementById("bloop__checkbox_random").checked != true) {
		barrageOffset++;
		if (barrageOffset > barrageArr.length - 1) {
			barrageOffset = 0;
		}
	}
	
	bloopTimer = setTimeout(doLoopBarrage, getSpeed());
}


function initPkg_BarrageLoop_Func() {
	// 函数初始化
	// 将onclick事件绑定在这里
	let icon = document.getElementsByClassName("bloop-icon")[0];
	if (!icon) {
		// 图标没插进来（容器缺失）就把整段绑定整体跳过：面板入口本来也就没有
		ExGuard_warn("弹幕小助手", "未找到小助手图标，入口事件未绑定");
		return;
	}
	icon.addEventListener("click", function() {
		showExRightPanel("弹幕发送小助手", this);
	});
	document.getElementById("bloop__checkbox_changeColor").addEventListener("click", function() {
		isChangeColor = document.getElementById("bloop__checkbox_changeColor").checked;
	});
	document.getElementById("bloop__checkbox_startSend").addEventListener("click", function() {
		let ischecked = document.getElementById("bloop__checkbox_startSend").checked;
		if (ischecked == true) {
			// 开始发送
			getBarrageArr();
			getBarrageColorArr();
			if (document.getElementById("bloop__checkbox_random").checked == true) {
				barrageOffset = Math.floor(Math.random() * barrageArr.length);
				barrageColorOffset = Math.floor(Math.random() * barrageColorArr.length);
			} else {
				barrageOffset = 0;
				barrageColorOffset = 0;
			}
			saveData_BarrageLoop();
			bloopTimer = setTimeout(doLoopBarrage, getSpeed());
			bloopStopTimer = setTimeout(() => {
				document.getElementById("bloop__checkbox_startSend").checked = false;
				clearTimeout(bloopTimer);
			}, getStopTime());
		} else{
			// 停止发送
			clearTimeout(bloopTimer);
			clearTimeout(bloopStopTimer);
			// clearInterval(bloopTimer);
		}
	});

  document.getElementById("bloop__select").onclick = function() {
    if (this.options.length == 0) {
      return;
    }
    let area = document.getElementById("bloop__textarea");
    let text = this.options[this.selectedIndex].text;
    area.value = text;
    area.value = area.value.replace(/\\r/g, "\r");
  };

	document.getElementById("bloop__save").addEventListener("click", () => {
		// ExSave_BarrageLoopOptions
    let select_bloop = document.getElementById("bloop__select");
    let text = document.getElementById("bloop__textarea").value;
    if (text == "") return;
    barrageOptions.push(text);
    select_bloop.options.add(new Option(text.replace(/\n/g, "\\r"), true));
    saveData_BarrageLoop();
	});

	document.getElementById("bloop__delete").addEventListener("click", () => {
		let select_bloop = document.getElementById("bloop__select");
    let index = select_bloop.options[select_bloop.selectedIndex];
    if (!index) return;
    let text = index.text.replace(/\\r/g, "\n");
    barrageOptions = barrageOptions.filter(item => item !== text && item !== index.text);
    select_bloop.options.remove(select_bloop.selectedIndex);
    saveData_BarrageLoop();
	});
	
	document.getElementById("bloop__checkbox_random").addEventListener("click", () => {
		saveData_BarrageLoop();
	});
	document.getElementById("bloop__text_speed1").addEventListener("change", () => {
		saveData_BarrageLoop();
	});
	document.getElementById("bloop__text_speed2").addEventListener("change", () => {
		saveData_BarrageLoop();
	});
	document.getElementById("bloop__text_stoptime").addEventListener("change", () => {
		saveData_BarrageLoop();
	});
	document.getElementById("bloop__checkbox_changeColor").addEventListener("click", () => {
		saveData_BarrageLoop();
	});
}


function initPkg_BarrageLoop_Dom() {
	// Dom初始化
	BarrageLoop_insertModal();
	BarrageLoop_insertIcon();
}

function initPkg_BarrageLoop_Set() {
	// 设置初始化
	let ret = localStorage.getItem("ExSave_BarrageLoopOptions");
	
	if (ret != null) {
		let retJson = JSON.parse(ret);
		if ("speed1" in retJson == false) {
			retJson.speed1 = 2000;
		}
		if ("speed2" in retJson == false) {
			retJson.speed2 = 3000;
		}
		if ("stopTime" in retJson == false) {
			retJson.stopTime = 5;
		}
    let select_bloop = document.getElementById("bloop__select");
    retJson.text.forEach(item => {
      select_bloop.options.add(new Option(item.replace(/\r/g, "\\r"), ""));
    });
    barrageOptions = retJson.text;
		document.getElementById("bloop__checkbox_changeColor").checked = retJson.isChangeColor;
		isChangeColor = Boolean(retJson.isChangeColor);
		document.getElementById("bloop__text_speed1").value = retJson.speed1;
		document.getElementById("bloop__text_speed2").value = retJson.speed2;
		document.getElementById("bloop__text_stoptime").value = retJson.stopTime;
	}
}
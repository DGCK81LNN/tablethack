// ggbApplet.enableShiftDragZoom(true);
// ggbApplet.enableRightClick(true);
 
var data = {
  guideModeHints:
    [ null
    , "注意右上角的两个指示条：如果“<samp>Wi-Fi信号评分</samp>”清空了，说明Wi-Fi断了，请确保信号稳定；如果“<samp>网络访问评分</samp>”完全红了，说明bug没卡出来，请再重新登录。<span class=p1>如果条左边显示“<samp>连接成功</samp>”就说明bug卡出来了。</span>"
    , "连接成功了，但是<del>没有完全成功，</del>稍后可能会失效。如果“<samp>网络访问评分</samp>”完全变红了，你可能需要重新登录。"
    , "现在“<samp>网络访问评分</samp>”完全变红了，你可能需要重新登录。<span class=p1>注意保证Wi-Fi信号良好，否则红条会误判！</span>"
    , "如果“<samp>网络访问评分</samp>”变紫并且持续增加到一半以上，说明很可能已经出现了持续性的bug。"
    , "“<samp>网络访问评分</samp>”已经到70%了，很可能已经出现了持续性的bug。恭喜！<button onclick=\"tbhk3.updateStatus()\">退出向导</button>"
    ],
  tips:
    [ "“<samp>最近</samp>”只能记录你在上方的地址栏输入的内容，并不能记录你在网页上点击的链接。"
    , "Wi-Fi连接或断开时，GeoGebra可能会卡住几秒，这时TabletHack也会卡住，通过右上角的时间可以看出来。"
    ],
};
/*
if (typeof myDiv === "undefined" || !myDiv) {
  myDiv = document.body.appendChild(document.createElement("div"))
}
if (typeof text === "undefined" || !text) {
  text = main.appendChild(code.cloneNode())
  text.placeholder = "text"
  text.onblur = function () { myDiv.innerHTML = text.value }
}
else myDiv.innerHTML = text.value;
 */
if (typeof tbhk3 !== "undefined" && tbhk3) {
  clearInterval(tbhk3.updateHandle);
}
 
window.tbhk3 = {
  switchPage: function (id) {
    Array.prototype.forEach.call(document.getElementById("tbhk").children, function (el) {
      el.hidden = true;
    });
    var el = document.getElementById("tbhk-" + id);
    if (el) el.hidden = false;
    tbhk3.page = id;
  },
  updateStatus: function (newGuideState) {
    if (newGuideState && newGuideState === tbhk3.guideMode) return;
    tbhk3.guideMode = newGuideState || 0;
    var el = document.getElementById("tbhk-app-tips");
    if (newGuideState) el.innerHTML = data.guideModeHints[newGuideState];
    else el.innerHTML = data.tips[0 | (data.tips.length * Math.random())];
  },
  guideMode: 0,
  connectionScore: 10,
  signalScore: 30,
  stat: "wait",
  loading: false,
  updateHandle: undefined,
  page: "homepage",
  bookmarks: [],
  history: []
};
 
try {
var saved = JSON.parse(localStorage.tbhk3);
for (key in saved) tbhk3[key] = saved[key];
} catch (_) { }
 
var pingImg = new Image();
pingImg.onload = function() {
  tbhk3.stat = "ok";
  tbhk3.loading = false;
  if (tbhk3.connectionScore < 0) tbhk3.connectionScore = 1;
  else if (tbhk3.connectionScore < 40) ++tbhk3.connectionScore;
  if (tbhk3.guideMode === 1
  || tbhk3.guideMode === 3
  ) tbhk3.updateStatus(tbhk3.guideMode + 1);
  else if (tbhk3.connectionScore >= 28) tbhk3.updateStatus(5);
};
pingImg.onerror = function() {
  if (tbhk3.stat !== "offline") tbhk3.stat = "error";
  tbhk3.loading = false;
};
 
var procedure7Count = 0;
function procedure7() {
  if (tbhk3.loading) {
    tbhk3.stat = "fail";
    if (tbhk3.connectionScore > 7) tbhk3.connectionScore -= 7;
    else if (tbhk3.connectionScore > 0) tbhk3.connectionScore = -1;
    else if (tbhk3.connectionScore > -4) --tbhk3.connectionScore;
    if (tbhk3.guideMode === 2 && tbhk3.connectionScore === -3) tbhk3.updateStatus(tbhk3.guideMode + 1);
  }
  tbhk3.loading = true;
  pingImg.src = "https://www.baidu.com/favicon.ico?_=" + Date.now();
}
 
function procedure1() {
  if (navigator.onLine) {
    if (tbhk3.signalScore < 60) ++tbhk3.signalScore;
  } else {
    if (tbhk3.connectionScore > 0) --tbhk3.connectionScore;
    else tbhk3.connectionScore = 0;
  }
  if (document.hidden) {
    if (tbhk3.connectionScore < 0) tbhk3.connectionScore = 0;
    if (tbhk3.page === "guide-3") tbhk3.switchPage("app"), tbhk3.guideMode = 1;
  }
  if (document.hidden || !navigator.onLine)
    procedure7Count = 0;
  else
    if (procedure7Count++ % 7 === 0) procedure7();
}
 
if (!navigator.onLine) (window.onoffline = function () {
  tbhk3.signalScore = 0;
  tbhk3.stat = "offline";
})();
 
function $$$(id) {
  return document.getElementById(id)
}
var els = {
  guideDone: $$$("tbhk-guide-donebtn"),
  signalMeter: $$$("tbhk-app-meters-signal"),
  connectionMeter: $$$("tbhk-app-meters-connection"),
  time: $$$("tbhk-app-time"),
  stat: $$$("tbhk-app-stat"),
  spinner: $$$("tbhk-app-spinner")
};
 
var procedure1Count = 0;
function update() {
  if (procedure1Count++ % 4 === 0) procedure1();
  els.guideDone.hidden = tbhk3.connectionScore <= 0;
  els.signalMeter.style.backgroundPosition = tbhk3.signalScore / -0.6 + "% 0%";
  els.connectionMeter.style.backgroundPosition = tbhk3.connectionScore / (tbhk3.connectionScore < 0 ? 0.04 : -0.4) + "% 0%";
  els.connectionMeter.style.color = tbhk3.connectionScore < 0 ? "#c55" : "";
  els.time.textContent = new Date().toLocaleTimeString();
  els.stat.textContent = {
    "wait": "欢迎使用",
    "ok": "连接成功",
    "fail": tbhk3.connectionScore === -4 && tbhk3.signalScore >= 30 ? "请重新登录" : "连接超时",
    "error": "连接中止",
    "offline": "网络断开"
  }[tbhk3.stat];
  els.spinner.hidden = !tbhk3.loading;
}
tbhk3.updateHandle = setInterval(update, 250);
 
function updateBookmarks() {
   var bookmarksEl = document.getElementById("tbhk-bookmarks");
}
 
tbhk3.updateStatus(0);
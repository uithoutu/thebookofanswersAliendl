// 全局元素
const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");

// Page1 提示文案
const hint1 = document.getElementById("hint1");
const hint2 = document.getElementById("hint2");

// Page2 元素
const infoLocation = document.getElementById("current-location");
const infoTime     = document.getElementById("current-time");
const infoDate     = document.getElementById("current-date");
const answerText   = document.getElementById("answer-text");

// 按钮
const btnDownload   = document.getElementById("download-button");
const btnRegenerate = document.getElementById("regenerate-button");
const btnVisit      = document.getElementById("visit-button");

// 1️⃣ Page1 文案加载
fetch("texts/page1_hint.txt")
  .then(r => r.text())
  .then(text => {
    const lines = text.trim().split("\n");
    setTimeout(() => { hint1.textContent = lines[0] || ""; }, 1000);
    setTimeout(() => { hint2.textContent = lines[1] || ""; }, 4000);
  });

// 2️⃣ 预加载背景图 & 阿拉伯文案
let imageUrls = [], arabicTexts = [];
fetch("texts/image_urls.json").then(r => r.json()).then(arr => imageUrls = arr);
fetch("texts/arabic_texts.json").then(r => r.json()).then(arr => {
  arabicTexts = arr.map(s => s.replace(/^\d+\.\s*/, "").trim());
});

// 3️⃣ 时间/日期/地点 更新
function updateDateTime() {
  const now = new Date();
  infoTime.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  infoDate.textContent = now.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
}
function updateLocation() {
  if (!navigator.geolocation) {
    infoLocation.textContent = "Unavailable"; return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      infoLocation.textContent = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    },
    () => { infoLocation.textContent = "Unavailable"; }
  );
}

// 4️⃣ showPage2
function showPage2() {
  if (imageUrls.length) {
    const url = imageUrls[Math.floor(Math.random()*imageUrls.length)];
    document.getElementById("card").style.backgroundImage = `url('${url}')`;
  }
  if (arabicTexts.length) {
    answerText.textContent = arabicTexts[Math.floor(Math.random()*arabicTexts.length)];
  }
  updateDateTime();
  updateLocation();
  page1.style.display = "none";
  page2.style.display = "block";
}

// 5️⃣ 8 秒后才允许点击进入
setTimeout(() => page1.addEventListener("click", showPage2), 8000);

// 6️⃣ 按钮按下态 & 功能
[btnDownload, btnRegenerate, btnVisit].forEach(btn => {
  const normal  = btn.src;
  const pressed = btn.dataset.pressed;
  btn.addEventListener("touchstart", () => pressed && (btn.src = pressed));
  btn.addEventListener("touchend",   () => btn.src = normal);
});
btnDownload.addEventListener("click", downloadCurrent);
btnRegenerate.addEventListener("click", () => window.location.reload());
btnVisit.addEventListener("click", () => window.open("https://aliendl.com", "_blank"));

// 7️⃣ 所见即所得截图下载
function downloadCurrent() {
  const page2El   = document.getElementById("page2");
  const buttonsEl = document.getElementById("buttons");

  // 隐藏按钮
  buttonsEl.style.visibility = "hidden";

  // 使用 html2canvas，高分辨率截图
  html2canvas(page2El, {
    useCORS: true,
    // scale 设置为 devicePixelRatio，可根据测试再调大一点，比如 *1.5
    scale: window.devicePixelRatio || 1
  }).then(canvas => {
    // 还原按钮
    buttonsEl.style.visibility = "visible";

    // 触发下载
    canvas.toBlob(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "aliendl-answer.png";
      a.click();
      // 释放
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }).catch(err => {
    console.error("截图失败，尝试原图 Canvas 绘制：", err);
    // 恢复按钮并回退旧逻辑……
    buttonsEl.style.visibility = "visible";
  });
}

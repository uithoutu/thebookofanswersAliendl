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

// 1️⃣ 加载 Page1 的文案：1s 后出现第一行，4s 后出现第二行
fetch("texts/page1_hint.txt")
  .then(res => res.text())
  .then(text => {
    const lines = text.trim().split("\n");
    setTimeout(() => { hint1.textContent = lines[0] || ""; }, 1000);
    setTimeout(() => { hint2.textContent = lines[1] || ""; }, 4000);
  });

// 2️⃣ 预加载图片 & 文案数据
let imageUrls = [];
let arabicTexts = [];
Promise.all([
  fetch("texts/image_urls.json").then(r => r.json()),
  fetch("texts/arabic_texts.json").then(r => r.json())
]).then(([imgs, texts]) => {
  imageUrls = imgs;
  arabicTexts = texts;
});

// 3️⃣ 时间/日期/地点 更新函数
function updateDateTime() {
  const now = new Date();
  // 时间
  infoTime.textContent = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit"
  });
  // 日期
  infoDate.textContent = now.toLocaleDateString("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit"
  });
}
function updateLocation() {
  if (!navigator.geolocation) {
    infoLocation.textContent = "Unavailable";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      infoLocation.textContent = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    },
    () => { infoLocation.textContent = "Unavailable"; }
  );
}

// 4️⃣ 显示 Page2 的主逻辑
function showPage2() {
  // 随机背景
  if (imageUrls.length) {
    const url = imageUrls[Math.floor(Math.random()*imageUrls.length)];
    page2.style.backgroundImage = `url('${url}')`;
  }
  // 随机答案
  if (arabicTexts.length) {
    answerText.textContent = arabicTexts[
      Math.floor(Math.random()*arabicTexts.length)
    ];
  }
  // 更新 info
  updateDateTime();
  updateLocation();

  // 切换视图
  page1.style.display = "none";
  page2.style.display = "block";
}

// 5️⃣ 绑定 Page1 点击 → showPage2（8秒后才允许点击）  
setTimeout(() => {
  page1.addEventListener("click", showPage2);
}, 8000);

// 6️⃣ 按钮按下态 + 功能绑定
[btnDownload, btnRegenerate, btnVisit].forEach(btn => {
  const normal  = btn.src;
  const pressed = btn.dataset.pressed;
  btn.addEventListener("touchstart", () => btn.src = pressed);
  btn.addEventListener("touchend",   () => btn.src = normal);
});

btnDownload.addEventListener("click", downloadCurrent);
btnRegenerate.addEventListener("click", () => window.location.reload());
btnVisit.addEventListener("click", () => window.open("https://aliendl.com","_blank"));

// 7️⃣ 下载当前卡片内容（Page2 中的 #card 区域）
function downloadCurrent() {
  // 动态载入 html2canvas
  if (!window.html2canvas) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    script.onload = () => captureAndSave();
    document.body.appendChild(script);
  } else {
    captureAndSave();
  }

  function captureAndSave() {
    const card = document.getElementById("card");
    html2canvas(card, { useCORS: true }).then(canvas => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "aliendl-answer.png";
      link.click();
    });
  }
}

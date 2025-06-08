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

// 2️⃣ 预加载背景图（JSON 数组）和阿拉伯文案（JSON 数组）
let imageUrls = [];
let arabicTexts = [];

fetch("texts/image_urls.json")
  .then(r => r.json())
  .then(arr => {
    imageUrls = arr;
  });

fetch("texts/arabic_texts.json")
  .then(r => r.json())
  .then(arr => {
    // 去掉每条开头可能的 “数字. ” 前缀
    arabicTexts = arr.map(s => s.replace(/^\d+\.\s*/, "").trim());
  });

// 3️⃣ 时间／日期／地点 更新
function updateDateTime() {
  const now = new Date();
  infoTime.textContent = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit"
  });
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

// 4️⃣ 切换到 Page2 主逻辑
function showPage2() {
  // 随机背景
  if (imageUrls.length) {
    const url = imageUrls[Math.floor(Math.random() * imageUrls.length)];
document.getElementById("card").style.backgroundImage = `url('${url}')`;
  }
  // 随机答案
  if (arabicTexts.length) {
    answerText.textContent = arabicTexts[
      Math.floor(Math.random() * arabicTexts.length)
    ];
  }
  // 更新信息栏
  updateDateTime();
  updateLocation();
  // 切换视图
  page1.style.display = "none";
  page2.style.display = "block";
}

// 5️⃣ 8 秒后才允许点击进入
setTimeout(() => {
  page1.addEventListener("click", showPage2);
}, 8000);

// 6️⃣ 按钮按下效果 & 功能绑定
[btnDownload, btnRegenerate, btnVisit].forEach(btn => {
  const normal  = btn.src;
  const pressed = btn.dataset.pressed;
  btn.addEventListener("touchstart", () => pressed && (btn.src = pressed));
  btn.addEventListener("touchend",   () => btn.src = normal);
});

btnDownload.addEventListener("click", downloadCurrent);
btnRegenerate.addEventListener("click", () => window.location.reload());
btnVisit.addEventListener("click", () => window.open("https://aliendl.com","_blank"));

// 7️⃣ 下载卡片，不含按钮
function downloadCurrent() {
  const cardEl    = document.getElementById("card");
  const buttonsEl = document.getElementById("buttons");
  buttonsEl.style.visibility = "hidden";

  // 1️⃣ 拿背景图 URL & 载入原始大图
  const bgUrl = cardEl.style.backgroundImage.slice(5, -2);
  const img   = new Image();
  img.crossOrigin = "anonymous";
  img.src         = bgUrl;

  img.onload = () => {
    // 2️⃣ 画布按原始图大小 & DPR
    const W   = img.naturalWidth;
    const H   = img.naturalHeight;
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // 3️⃣ 计算“页面上 card 的实际宽度” 和 缩放比例
    const displayW = cardEl.clientWidth;
    const scale    = W / displayW;

    // 4️⃣ 先把背景画上去
    ctx.drawImage(img, 0, 0, W, H);

    // 5️⃣ 绘制顶部信息栏（地点／时间／日期）——我们用百分比定位，不用测量具体 DOM
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    // 取页面上渲染时的 font-size
    const infoFontDisplayPx = parseFloat(
      getComputedStyle(document.querySelector("#info-bar .frame"))
        .fontSize
    );
    // 等比放大到原图上
    const infoFontPx = infoFontDisplayPx * scale;
    ctx.font       = `italic ${infoFontPx}px Bodoni MT`;
    const yInfo    = H * 0.06;  // 6% 处
    ctx.fillText(infoLocation.textContent, W * 0.25, yInfo);
    ctx.fillText(infoTime.textContent,     W * 0.50, yInfo);
    ctx.fillText(infoDate.textContent,     W * 0.75, yInfo);

    // 6️⃣ 绘制阿拉伯文案
    const answerFontDisplayPx = parseFloat(
      getComputedStyle(answerText).fontSize
    );
    const answerFontPx = answerFontDisplayPx * scale;
    ctx.font          = `${answerFontPx}px Traditional Arabic`;
    ctx.fillStyle     = "white";
    ctx.textAlign     = "right";
    ctx.lineWidth     = answerFontPx * 0.05;
    ctx.strokeStyle   = "rgba(0,0,0,0.6)";
    ctx.shadowColor   = "white";
    ctx.shadowBlur    = answerFontPx * 0.1;

    // 文案在页面上大概是从 35% 高度开始
    let textY = H * 0.35;
    const textX = W * 0.95; // 右侧 5%
    answerText.textContent.split("\n").forEach(line => {
      ctx.strokeText(line, textX, textY);
      ctx.fillText(line,   textX, textY);
      textY += answerFontPx * 1.2;
    });

    // 7️⃣ 绘制水印（等比缩放、等比定位）
    const wmDisplayW = document.getElementById("watermark-img").clientWidth;
    const wmDisplayH = document.getElementById("watermark-img").clientHeight;
    const wmImg = new Image();
    wmImg.crossOrigin = "anonymous";
    wmImg.src = document.getElementById("watermark-img").src;
    wmImg.onload = () => {
      const wmW = wmDisplayW * scale;
      const wmH = wmDisplayH * scale;
      // 页面上它大概贴在 “底部 10%” 处
      const wmX = W - wmW - W * 0.05;
      const wmY = H - wmH - H * 0.10;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(wmImg, wmX, wmY, wmW, wmH);
      ctx.globalAlpha = 1;

      // 8️⃣ 完成 → 恢复按钮并下载
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    };
  };

  // 如果跨域或加载失败，就回退 html2canvas（也加了 scale）
  img.onerror = () => {
    console.warn("CORS/加载失败，回退 html2canvas + DPR");
    html2canvas(cardEl, {
      useCORS: true,
      scale: window.devicePixelRatio || 1
    }).then(canvas => {
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    });
  };
}


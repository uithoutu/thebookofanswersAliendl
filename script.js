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
  const buttonsEl = document.getElementById("buttons");
  buttonsEl.style.visibility = "hidden";

  // 取背景图地址
  const bgUrl = document.getElementById("card").style.backgroundImage
    .slice(5, -2);

  // 取文本
  const locText   = infoLocation.textContent;
  const timeText  = infoTime.textContent;
  const dateText  = infoDate.textContent;
  const answerStr = answerText.textContent; // <-- 用这个

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = bgUrl;

  img.onload = () => {
    const W = img.naturalWidth,
          H = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // 1️⃣ 背景
    ctx.drawImage(img, 0, 0, W, H);

    // 2️⃣ 顶栏
    ctx.fillStyle   = "white";
    ctx.textAlign   = "center";
    const infoFs    = Math.round(W * 0.03);
    ctx.font        = `italic ${infoFs}px Bodoni MT`;
    const yInfo     = Math.round(H * 0.06);
    ctx.fillText(locText,  W * 0.25, yInfo);
    ctx.fillText(timeText, W * 0.50, yInfo);
    ctx.fillText(dateText, W * 0.75, yInfo);

    // 3️⃣ 阿拉伯文案
    const textX           = W * 0.95;
    let   textY           = Math.round(H * 0.35);
    const answerFs        = Math.round(W * 0.05);
    ctx.font              = `${answerFs}px Traditional Arabic`;
    ctx.fillStyle         = "white";
    ctx.textAlign         = "right";
    ctx.lineWidth         = 2;
    ctx.strokeStyle       = "rgba(0,0,0,0.6)";
    ctx.shadowColor       = "white";
    ctx.shadowBlur        = answerFs * 0.1;

    answerStr.split("\n").forEach(line => {
      ctx.strokeText(line, textX, textY);
      ctx.fillText(line,   textX, textY);
      textY += answerFs * 1.2;
    });

    // 4️⃣ 水印
    const wmImg = new Image();
    wmImg.crossOrigin = "anonymous";
    wmImg.src         = document.getElementById("watermark-img").src;
    wmImg.onload = () => {
      const wmW = wmImg.naturalWidth * 0.3;
      const wmH = wmImg.naturalHeight * 0.3;
      const wmX = W - wmW - W * 0.05;
      const wmY = H - wmH - H * 0.10;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(wmImg, wmX, wmY, wmW, wmH);
      ctx.globalAlpha = 1;

      // 恢复按钮，再下载
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    };
    wmImg.onerror = () => {
      // 水印加载失败也继续
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    };
  };

  img.onerror = () => {
    console.warn("绘制跨域图片失败，回退 html2canvas");
    buttonsEl.style.visibility = "visible";
    html2canvas(document.getElementById("card"), { useCORS: true }).then(canvas => {
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    });
  };
}


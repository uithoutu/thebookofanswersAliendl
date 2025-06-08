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

  // 1. grab the background URL
  const bgUrl = document.getElementById("card")
    .style.backgroundImage.slice(5, -2);

  // 2. grab all the text
  const locText   = infoLocation.textContent;
  const timeText  = infoTime .textContent;
  const dateText  = infoDate .textContent;
  const answerStr = answerText.textContent;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = bgUrl;

  img.onload = () => {
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const dpr = window.devicePixelRatio || 1;

    // 3. create a high-res canvas
    const canvas = document.createElement("canvas");
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    // if you want it to show 1:1 in the DOM you can also:
    // canvas.style.width  = W + "px";
    // canvas.style.height = H + "px";

    const ctx = canvas.getContext("2d");
    // 4. scale everything so 1 CSS-pixel === 1 canvas unit
    ctx.scale(dpr, dpr);

    // 5. draw the background
    ctx.drawImage(img, 0, 0, W, H);

    // 6. draw the info-bar using its computed CSS font-size
    const frame = document.querySelector("#info-bar .frame");
    const infoFontPx = parseFloat(
      window.getComputedStyle(frame).fontSize
    );
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = `italic ${infoFontPx}px Bodoni MT`;
    const yInfo = H * 0.06;
    ctx.fillText(locText,  W * 0.25, yInfo);
    ctx.fillText(timeText, W * 0.50, yInfo);
    ctx.fillText(dateText, W * 0.75, yInfo);

    // 7. draw the Arabic text using its computed CSS font-size
    const answerFontPx = parseFloat(
      window.getComputedStyle(answerText).fontSize
    );
    ctx.font        = `${answerFontPx}px Traditional Arabic`;
    ctx.fillStyle   = "white";
    ctx.textAlign   = "right";
    ctx.lineWidth   = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.shadowColor = "white";
    ctx.shadowBlur  = answerFontPx * 0.1;

    let textY = H * 0.35;
    const textX = W * 0.95;
    answerStr.split("\n").forEach(line => {
      ctx.strokeText(line, textX, textY);
      ctx.fillText  (line, textX, textY);
      textY += answerFontPx * 1.2;
    });

    // 8. draw watermark at the bottom
    const wmImg = new Image();
    wmImg.crossOrigin = "anonymous";
    wmImg.src = document.getElementById("watermark-img").src;
    wmImg.onload = () => {
      const wmW = wmImg.naturalWidth  * 0.3;
      const wmH = wmImg.naturalHeight * 0.3;
      const wmX = W - wmW - W * 0.05;
      const wmY = H - wmH - H * 0.10;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(wmImg, wmX, wmY, wmW, wmH);
      ctx.globalAlpha = 1;

      // 9. restore buttons and download
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    };

    wmImg.onerror = () => {
      // even if watermark fails, still allow download
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    };
  };

  img.onerror = () => {
    // fallback to html2canvas at high scale
    console.warn("CORS error, falling back to html2canvas");
    buttonsEl.style.visibility = "visible";
    html2canvas(document.getElementById("card"), {
      useCORS: true,
      scale: window.devicePixelRatio
    }).then(canvas => {
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    });
  };
}

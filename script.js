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
  const buttonsEl = document.getElementById("buttons");
  buttonsEl.style.visibility = "hidden";

  // 1) grab background URL
  const bgUrl = document
    .getElementById("card")
    .style.backgroundImage.slice(5, -2);

  // 2) grab on-screen text
  const locText   = document.getElementById("current-location").textContent;
  const timeText  = document.getElementById("current-time").textContent;
  const dateText  = document.getElementById("current-date").textContent;
  const answerStr = document.getElementById("answer-text").textContent;

  // 3) load the full-res image
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

    // draw the full background
    ctx.drawImage(img, 0, 0, W, H);

    // draw info-bar at 6% down
    const infoFs = Math.round(W * 0.03);
    ctx.font      = `italic ${infoFs}px Bodoni MT`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    const yInfo   = H * 0.06;
    ctx.fillText(locText,  W * 0.25, yInfo);
    ctx.fillText(timeText, W * 0.50, yInfo);
    ctx.fillText(dateText, W * 0.75, yInfo);

    // draw Arabic text at ~35% down, right-aligned with 5% margin
    const answerFs = Math.round(W * 0.05);
    ctx.font        = `${answerFs}px Traditional Arabic`;
    ctx.fillStyle   = "white";
    ctx.textAlign   = "right";
    ctx.lineWidth   = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.shadowColor = "white";
    ctx.shadowBlur  = answerFs * 0.1;
    let textY       = H * 0.35;
    answerStr.split("\n").forEach(line => {
      ctx.strokeText(line, W * 0.95, textY);
      ctx.fillText  (line, W * 0.95, textY);
      textY += answerFs * 1.2;
    });

    // draw watermark at bottom-right, 10% up from bottom
    const wmImg = new Image();
    wmImg.crossOrigin = "anonymous";
    wmImg.src = document.getElementById("watermark-img").src;
    wmImg.onload = () => {
      const wmW = wmImg.naturalWidth * 0.3;
      const wmH = wmImg.naturalHeight * 0.3;
      const wmX = W - wmW - W * 0.05;
      const wmY = H - wmH - H * 0.10;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(wmImg, wmX, wmY, wmW, wmH);
      ctx.globalAlpha = 1;

      // restore buttons & download
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    };
  };

  img.onerror = () => {
    // fallback to html2canvas if cross-origin fails
    buttonsEl.style.visibility = "visible";
    html2canvas(document.getElementById("page2"), {
      useCORS: true,
      scale: window.devicePixelRatio
    }).then(canvas => {
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    });
  };
}

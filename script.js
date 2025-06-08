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
  const cardEl    = document.getElementById("card");
  const buttonsEl = document.getElementById("buttons");

  // 1) hide the buttons so they don’t appear on the final
  buttonsEl.style.visibility = "hidden";

  // 2) pull out the background-image URL
  const bgUrl = cardEl.style.backgroundImage.slice(5, -2);

  // 3) measure the on-screen size of #card
  const cardRect = cardEl.getBoundingClientRect();
  const cardW    = cardRect.width;
  const cardH    = cardRect.height;

  // 4) load the full-res image
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src         = bgUrl;
  img.onload      = () => {
    const W     = img.naturalWidth;
    const H     = img.naturalHeight;
    const scale = W / cardW;

    // 5) make a canvas at the full-res dimensions
    const canvas = document.createElement("canvas");
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // 6) draw the background at full size
    ctx.drawImage(img, 0, 0, W, H);

    // 7) helper to draw any on-screen element’s text
    function drawTextFrom(el, options = {}) {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);

      // font
      const cssFontSize = parseFloat(cs.fontSize);
      const fontFamily  = cs.fontFamily.replace(/["']/g, "");
      const fontStyle   = cs.fontStyle;
      ctx.font          = `${fontStyle} ${cssFontSize * scale}px ${fontFamily}`;
      ctx.fillStyle     = cs.color;
      ctx.textAlign     = options.align || "left";
      if (options.stroke) {
        ctx.lineWidth   = options.strokeWidth * scale;
        ctx.strokeStyle = options.strokeColor;
      }
      if (options.shadow) {
        ctx.shadowColor = options.shadowColor;
        ctx.shadowBlur  = options.shadowBlur * scale;
      }

      // position
      const x = (r.left - cardRect.left + (options.xOffset || 0)) * scale;
      const y = (r.top  - cardRect.top  + (options.yOffset || cssFontSize)) * scale;

      const lines = el.textContent.trim().split("\n");
      const lineHeight = parseFloat(cs.lineHeight) * scale;
      lines.forEach(line => {
        if (options.stroke) ctx.strokeText(line, x, y);
        ctx.fillText(line, x, y);
        y += lineHeight;
      });

      // clear shadow
      ctx.shadowBlur = 0;
    }

    // 8) draw the three info-bar spans, center-aligned
    const infoSpans = document.querySelectorAll("#info-bar .frame");
    infoSpans.forEach(span => {
      drawTextFrom(span, {
        align:    "center",
        xOffset:  span.getBoundingClientRect().width / 2,
      });
    });

    // 9) draw the Arabic answer, right-aligned
    drawTextFrom(
      document.getElementById("answer-text"), {
        align:       "right",
        stroke:      true,
        strokeWidth: 0.2,               // your CSS stroke
        strokeColor: "rgba(0,0,0,0.6)",
        shadow:      true,
        shadowColor: "white",
        shadowBlur:  4,                 // your CSS blur
        xOffset:     document.getElementById("answer-text").getBoundingClientRect().width,
      }
    );

    // 10) draw the watermark image at its on-screen spot
    const wmEl = document.getElementById("watermark-img");
    const wmR  = wmEl.getBoundingClientRect();
    const wmImg = new Image();
    wmImg.crossOrigin = "anonymous";
    wmImg.src         = wmEl.src;
    wmImg.onload      = () => {
      const wmW  = wmR.width  * scale;
      const wmH  = wmR.height * scale;
      const wmX  = (wmR.left - cardRect.left) * scale;
      const wmY  = (wmR.top  - cardRect.top ) * scale;
      ctx.globalAlpha = parseFloat(window.getComputedStyle(wmEl).opacity);
      ctx.drawImage(wmImg, wmX, wmY, wmW, wmH);
      ctx.globalAlpha = 1;

      // 11) restore buttons & trigger the download
      buttonsEl.style.visibility = "visible";
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    };
  };

  // 12) error fallback: if CORS fails, just html2canvas the entire #page2
  img.onerror = () => {
    buttonsEl.style.visibility = "visible";
    html2canvas(document.getElementById("page2"), {
      useCORS: true,
      scale:   window.devicePixelRatio
    }).then(canvas => {
      const a = document.createElement("a");
      a.href    = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    });
  };
}

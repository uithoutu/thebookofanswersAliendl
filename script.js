// ========= 脚本开始 =========

// 全局元素
const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");
const hint1 = document.getElementById("hint1");
const hint2 = document.getElementById("hint2");
const infoLocation = document.getElementById("current-location");
const infoTime     = document.getElementById("current-time");
const infoDate     = document.getElementById("current-date");
const answerText   = document.getElementById("answer-text");
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

// 2️⃣ 预加载背景图 & 文案
let imageUrls = [], arabicTexts = [];
fetch("texts/image_urls.json").then(r => r.json()).then(arr => imageUrls = arr);
fetch("texts/arabic_texts.json").then(r => r.json()).then(arr => {
  arabicTexts = arr.map(s => s.replace(/^\d+\.\s*/, "").trim());
});

// 3️⃣ 时间／地点 更新
function updateDateTime() {
  const now = new Date();
  infoTime.textContent = now.toLocaleTimeString("en-GB", {hour:"2-digit",minute:"2-digit",hour12: false});
  infoDate.textContent = now.toLocaleDateString("en-GB", {year:"numeric",month:"2-digit",day:"2-digit"});
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

// 5️⃣ 8 秒后自动跳转
window.addEventListener("load", () => {
  setTimeout(showPage2, 8000);
});


// 6️⃣ 按钮按下态 & 功能
[btnDownload, btnRegenerate, btnVisit].forEach(btn => {
  const normal  = btn.src;
  const pressed = btn.dataset.pressed;
  btn.addEventListener("touchstart", () => pressed && (btn.src = pressed));
  btn.addEventListener("touchend",   () => btn.src = normal);
});
btnRegenerate.addEventListener("click", () => window.location.reload());
btnVisit.addEventListener("click", () => window.open("https://aliendl.com","_blank"));
btnDownload.addEventListener("click", downloadCurrent);

// 7️⃣ 所见即所得截图下载
function downloadCurrent() {
  const page2El   = document.getElementById("page2");
  const buttonsEl = document.getElementById("buttons");

  // 隐藏按钮
  buttonsEl.style.visibility = "hidden";

  html2canvas(page2El, {
    useCORS: true,
    scale: (window.devicePixelRatio || 1) * 1.5
  }).then(canvas => {
    // 恢复按钮
    buttonsEl.style.visibility = "visible";

    // 把 canvas 转成 Blob
    canvas.toBlob(blob => {
      const file = new File([blob], 'aliendl-answer.png', { type: 'image/png' });

      // Web Share API 优先
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'Aliendl 答案卡',
          text: '这里是你的 Aliendl 回答'
        }).catch(() => {
          // 分享失败再回退到下载
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = 'aliendl-answer.png';
          a.click();
          URL.revokeObjectURL(a.href);
        });
      } else {
        // 不支持分享，走下载
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = 'aliendl-answer.png';
        a.click();
        URL.revokeObjectURL(a.href);
      }
    }, 'image/png');
  }).catch(err => {
    console.error("截图失败：", err);
    buttonsEl.style.visibility = "visible";
  });
}

// ========= 脚本结束 =========

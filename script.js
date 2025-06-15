// ========= script.js =========

// —— 0️⃣ （可选）拦截 ?share=DataURL ——  
(function handleShareParam(){
  const p = new URLSearchParams(location.search);
  if (p.has('share')) {
    document.body.innerHTML = `
      <img src="${p.get('share')}"
           style="display:block;width:100%;height:auto;margin:0" />
    `;
    return;  // 停止后续脚本
  }
})();

// —— ① 阿拉伯标点修正 —— 
function fixArabicPunctuation(text) {
  return text
    .replace(/\./g, '\u06D4')
    .replace(/[\u2013\u2014]/g, m => '\u200F' + m);
}

// —— 全局缓存和元素获取 —— 
let page1Hints = [];
fetch("texts/page1_hint.txt")
  .then(r => r.text())
  .then(t => page1Hints = t.trim().split("\n"));

let imageUrls = [], arabicTexts = [];
fetch("texts/image_urls.json")
  .then(r => r.json())
  .then(a => imageUrls = a);
fetch("texts/arabic_texts.json")
  .then(r => r.json())
  .then(a => arabicTexts = a.map(s => s.replace(/^\d+\.\s*/, "").trim()));

// —— 获取 DOM 元素 —— 
const card       = document.getElementById("card");
const page1      = document.getElementById("page1");
const page2      = document.getElementById("page2");
const hint1      = document.getElementById("hint1");
const hint2      = document.getElementById("hint2");
const infoLoc    = document.getElementById("current-location");
const infoTime   = document.getElementById("current-time");
const infoDate   = document.getElementById("current-date");
const answerText = document.getElementById("answer-text");
const btnDownload   = document.getElementById("download-button");
const btnRegenerate = document.getElementById("regenerate-button");
const btnVisit      = document.getElementById("visit-button");

// —— A. 预加载 pressed 图，避免切换时闪白 —— 
[btnDownload, btnRegenerate, btnVisit].forEach(btn => {
  const url = btn.dataset.pressed;
  if (url) {
    const img = new Image();
    img.src = url;
  }
});

// —— B. 阻止 iOS 默认触摸高亮 & 手动触发点击 —— 
const tapElements = [
  btnDownload,
  btnRegenerate,
  btnVisit,
  ...document.querySelectorAll('#info-bar .frame')
];
tapElements.forEach(el => {
  el.addEventListener('touchstart', e => {
    e.preventDefault();
  }, { passive: false });
  el.addEventListener('touchend', e => {
    e.preventDefault();
    el.click();
  });
});

// —— 时间／地点 更新函数 —— 
function updateDateTime() {
  const now = new Date();
  infoTime.textContent = now.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false
  });
  infoDate.textContent = now.toLocaleDateString("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit"
  });
}
function updateLocation() {
  if (!navigator.geolocation) {
    infoLoc.textContent = "Unavailable";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    p => infoLoc.textContent = `${p.coords.latitude.toFixed(2)},${p.coords.longitude.toFixed(2)}`,
    () => infoLoc.textContent = "Unavailable"
  );
}

// —— 展示 Page2 的函数 —— 
async function showPage2(){
  if (imageUrls.length) {
    // 抓背景图转成 DataURL 以防 CORS 被跳过
    const url = imageUrls[Math.floor(Math.random()*imageUrls.length)];
    const resp = await fetch(url);
    const blob = await resp.blob();
    const dataURL = await new Promise(r => {
      const rd = new FileReader();
      rd.onloadend = () => r(rd.result);
      rd.readAsDataURL(blob);
    });
    Object.assign(card.style, {
      backgroundImage:   `url('${dataURL}')`,
      backgroundSize:    '100% auto',
      backgroundPosition:'top center',
      backgroundRepeat:  'no-repeat'
    });
  }
  if (arabicTexts.length) {
    const raw = arabicTexts[Math.floor(Math.random()*arabicTexts.length)];
    answerText.textContent = fixArabicPunctuation(raw);
  }
  updateDateTime();
  updateLocation();
  page1.style.display = "none";
  page2.style.display = "block";
  requestAnimationFrame(() => page2.classList.add("show"));
}

// —— Page1 加载逻辑 —— 
window.addEventListener("load", () => {
  setTimeout(() => {
    hint1.textContent = fixArabicPunctuation(page1Hints[0] || "");
    hint2.textContent = fixArabicPunctuation(page1Hints[1] || "");
    document.getElementById("center-wrapper").classList.add("fade-in-load");
    hint1.classList.add("fade-in-load");
    hint2.classList.add("fade-in-load");
    setTimeout(showPage2, 7000);
  }, 1500);
});

// —— 按钮功能绑定 —— 
btnRegenerate.addEventListener("click", () => location.reload());
btnVisit.addEventListener("click", () => window.open("https://aliendl.com", "_blank"));
btnDownload.addEventListener("click", downloadCurrent);

// —— 下载并分享完整长图 —— 
async function downloadCurrent() {
  // 离屏克隆 page2
  const clone = page2.cloneNode(true);
  document.body.appendChild(clone);
  Object.assign(clone.style, {
    position: "absolute",
    top:      "-9999px",
    left:     "-9999px",
    width:    page2.clientWidth + "px",
    overflow: "visible"
  });

  // 取克隆的背景 DataURL 并加载拿到原始尺寸
  const cardClone = clone.querySelector("#card");
  const bgCSS = getComputedStyle(cardClone).backgroundImage;
  const bgURL = bgCSS.slice(5, -2);
  const img = new Image();
  img.src = bgURL;
  await img.decode();

  // 计算 9:16 完整高度，并应用
  const bgH = clone.clientWidth * img.naturalHeight / img.naturalWidth;
  cardClone.style.height = bgH + "px";
  clone.style.height     = bgH + "px";

  // 把 info-bar 贴底 +5vh
  const infoClone = clone.querySelector("#info-bar");
  const { left, width } = document.getElementById("info-bar").getBoundingClientRect();
  Object.assign(infoClone.style, {
    position: "absolute",
    bottom:   "5vh",
    top:      "auto",
    left:     `${left}px`,
    width:    `${width}px`
  });

  // 文案和水印恢复原位
  ["answer-text","watermark-img"].forEach(id => {
    const eC = clone.querySelector("#"+id);
    const r  = document.getElementById(id).getBoundingClientRect();
    Object.assign(eC.style, {
      position:  "absolute",
      top:       `${r.top}px`,
      left:      `${r.left}px`,
      transform: "none",
      width:     `${r.width}px`
    });
  });

  // 离屏截图
  const canvas = await html2canvas(clone, {
    useCORS: true,
    scale:   (devicePixelRatio || 1) * 1.5,
    width:   clone.clientWidth,
    height:  bgH
  });

  // 清理离屏 clone
  document.body.removeChild(clone);

  // 分享或展示
  canvas.toBlob(async blob => {
    const file = new File([blob], "aliendl-answer.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Aliendl 答案卡",
          text:  "这是我的 Aliendl 回应，长按图片保存。"
        });
      } catch (e) {
        console.warn(e);
      }
    } else {
      const rd = new FileReader();
      rd.onloadend = () => window.open(rd.result, "_blank");
      rd.readAsDataURL(blob);
    }
  }, "image/png");
}

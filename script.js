// ========= 脚本开始 =========

// —— 0️⃣ 处理 ?share=DataURL 参数 —— 
(function handleShareParam(){
  const params = new URLSearchParams(location.search);
  if (params.has('share')) {
    document.body.innerHTML = `
      <img src="${params.get('share')}" 
           style="width:100%;height:auto;display:block;margin:0 auto;" />
    `;
  }
})();

function fixArabicPunctuation(text) {
  return text
    .replace(/\./g, '\u06D4')
    .replace(/[\u2013\u2014]/g, m => '\u200F' + m);
}

// ——— 将跨域 URL 转成内联 DataURI
async function toDataURL(url) {
  const blob = await fetch(url).then(r => r.blob());
  return new Promise(res => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.readAsDataURL(blob);
  });
}

// 全局缓存 Page1 的文案
let page1Hints = [];

// 全局元素
const card = document.getElementById("card");
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



// 1️⃣ Page1 文案加载（只读不写）
 fetch("texts/page1_hint.txt")
   .then(r => r.text())
   .then(text => {
     page1Hints = text.trim().split("\n");
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
async function showPage2() {
  if (imageUrls.length) {
    const url  = imageUrls[Math.floor(Math.random() * imageUrls.length)];
    const card = document.getElementById("card");    // ← 一行搞定
    card.style.backgroundImage   = `url('${url}')`;
    card.style.backgroundSize    = '100% auto';
    card.style.backgroundPosition= 'top center';
    card.style.backgroundRepeat  = 'no-repeat';
 }

  // 阿拉伯文案 + 标点修正
  if (arabicTexts.length) {
    const raw = arabicTexts[Math.floor(Math.random()*arabicTexts.length)];
    answerText.textContent = fixArabicPunctuation(raw);
  }

  updateDateTime();
  updateLocation();

  page1.style.display = "none";
  page2.style.display = "block";
  requestAnimationFrame(() => {
  page2.classList.add("show");
});
}

// 5️⃣ 8 秒后自动跳转
window.addEventListener("load", () => {
  setTimeout(() => {
    // 写入并修正文案
    hint1.textContent = fixArabicPunctuation(page1Hints[0] || "");
    hint2.textContent = fixArabicPunctuation(page1Hints[1] || "");

    // 一次性淡入加载区＋两行提示
    document.getElementById("center-wrapper").classList.add("fade-in-load");
    hint1.classList.add("fade-in-load");
    hint2.classList.add("fade-in-load");

    // 然后 8s 后跳转
    setTimeout(showPage2, 7000);
  }, 1500);
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
async function downloadCurrent() {
  const origPage2 = document.getElementById("page2");

  // 1️⃣ 深度克隆 page2，并移出视口
  const clone = origPage2.cloneNode(true);
  document.body.appendChild(clone);
  Object.assign(clone.style, {
    position:      "absolute",
    top:          "-10000px",
    left:         "-10000px",
    width:         origPage2.clientWidth + "px",
    height:        "auto",
    overflow:      "visible",
    pointerEvents: "none",
  });

  // 2️⃣ 展开背景容器到全高
  const cardClone = clone.querySelector("#card");
  const fullH     = cardClone.scrollHeight;
  cardClone.style.height    = fullH + "px";
  cardClone.style.overflowY = "visible";
  clone.style.height        = fullH + "px";

  // 3️⃣ 在克隆体中，把 fixed 元素改为 absolute
  // — info-bar 貼到底部 —
  const infoClone = clone.querySelector("#info-bar");
  const origInfo  = document.getElementById("info-bar");
  const { left: infoL, width: infoW } = origInfo.getBoundingClientRect();
  Object.assign(infoClone.style, {
    position: "absolute",
    bottom:   "5vh",
    top:      "auto",
    left:     `${infoL}px`,
    width:    `${infoW}px`
  });

  // — 其余保持原位 —
  ["answer-text", "watermark-img"].forEach(id => {
    const elClone = clone.querySelector(`#${id}`);
    const elOrig  = document.getElementById(id);
    const { top, left, width } = elOrig.getBoundingClientRect();
    Object.assign(elClone.style, {
      position:  "absolute",
      top:       `${top}px`,
      left:      `${left}px`,
      transform: "none",
      width:     `${width}px`
    });
  });

  // 4️⃣ 离屏截图
  const canvas = await html2canvas(clone, {
    useCORS: true,
    scale:   (window.devicePixelRatio || 1) * 1.5,
    width:   clone.clientWidth,
    height:  fullH
  });

// 5️⃣ 清理并导出改为：Web Share API 分享文件，fallback 新标签展示
document.body.removeChild(clone);
canvas.toBlob(async blob => {
  // 1️⃣ 先把 blob 包装成一个 File
  const file = new File([blob], 'aliendl-answer.png', { type: 'image/png' });

  // 2️⃣ 如果浏览器支持分享文件，就直接调用系统分享面板
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Aliendl 答案卡',
        text: '这是我的 Aliendl 回应，长按图片可保存。',
      });
      return;
    } catch (e) {
      // 用户取消或分享失败，继续走 fallback
    }
  }

  // 3️⃣ fallback：在新标签打开图片，用户再长按「保存图像」
  const reader = new FileReader();
  reader.onloadend = () => {
    window.open(reader.result, '_blank');
  };
  reader.readAsDataURL(blob);
}, 'image/png');



// ========= 脚本结束 =========

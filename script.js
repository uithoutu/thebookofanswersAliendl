// —— 0️⃣ 拦截 share 参数 —— 
;(function handleShareParam() {
  const p = new URLSearchParams(location.search);
  if (p.has('share')) {
    document.body.innerHTML = `
      <img src="${p.get('share')}"
           style="display:block;width:100%;height:auto;margin:0"/>
    `;
    return;
  }
})();

// —— ① 阿拉伯标点修正 —— 
function fixArabicPunctuation(text) {
  return text
    .replace(/\./g, '\u06D4')
    .replace(/[\u2013\u2014]/g, m => '\u200F' + m);
}

// —— 文本/图片数据加载 —— 
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

// —— ② 按下态切换 & 预加载 pressed 图 —— 
[btnDownload, btnRegenerate, btnVisit].forEach(btn => {
  const normal  = btn.src;
  const pressed = btn.dataset.pressed;

  // 预加载
  if (pressed) new Image().src = pressed;

  // 切换态
  btn.addEventListener("touchstart", () => {
    if (pressed) btn.src = pressed;
  });
  btn.addEventListener("touchend", () => {
    btn.src = normal;
  });
});

// —— ③ 阻止 iOS 点按高亮 & 手动触发 click —— 
[btnDownload, btnRegenerate, btnVisit,
  ...document.querySelectorAll('#info-bar .frame')
].forEach(el => {
  el.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  el.addEventListener('touchend',   e => { e.preventDefault(); el.click(); });
});

// —— ④ 时间/地点 更新 —— 
function updateDateTime() {
  const n = new Date();
  infoTime.textContent = n.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false
  });
  infoDate.textContent = n.toLocaleDateString("en-GB", {
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

// —— ⑤ showPage2 —— 
async function showPage2() {
  if (imageUrls.length) {
    const url  = imageUrls[Math.floor(Math.random() * imageUrls.length)];
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
    const raw = arabicTexts[Math.floor(Math.random() * arabicTexts.length)];
    answerText.textContent = fixArabicPunctuation(raw);
  }
  updateDateTime();
  updateLocation();
  page1.style.display = "none";
  page2.style.display = "block";
  requestAnimationFrame(() => page2.classList.add("show"));
}

// —— ⑥ Page1 加载动画 & 跳转 —— 
window.addEventListener("load", () => {
  setTimeout(() => {
    hint1.textContent = fixArabicPunctuation(page1Hints[0] || "");
    hint2.textContent = fixArabicPunctuation(page1Hints[1] || "");
    document.getElementById("center-wrapper").classList.add("fade-in-load");
    hint1.classList.add("fade-in-load");
    hint2.classList.add("fade-in-load");

    // 原始节奏：1.2s 后提示，7s 后跳转
    setTimeout(showPage2, 7000);
  }, 1200);
});

// —— ⑦ 按钮功能绑定 —— 
btnRegenerate.addEventListener("click", () => location.reload());
btnVisit.addEventListener("click", () => window.open("https://aliendl.com","_blank"));
btnDownload.addEventListener("click", downloadCurrent);

// —— ⑧ downloadCurrent —— 
async function downloadCurrent() {
  // 离屏克隆
  const clone = page2.cloneNode(true);
  document.body.appendChild(clone);
  Object.assign(clone.style, {
    position: "absolute",
    top:      "-9999px",
    left:     "-9999px",
    width:    page2.clientWidth + "px",
    overflow: "visible"
  });

  // 取背景，并获取原图尺寸
  const cardClone = clone.querySelector("#card");
  const bgCSS = getComputedStyle(cardClone).backgroundImage;
  const bgURL = bgCSS.slice(5, -2);
  const img   = new Image();
  img.src = bgURL;
  await img.decode();

  // 计算 9:16 对应高度
  const bgH = clone.clientWidth * img.naturalHeight / img.naturalWidth;
  cardClone.style.height = bgH + "px";
  clone.style.height     = bgH + "px";

  // Info-Bar 底部 +5vh
  const infoClone = clone.querySelector("#info-bar");
  const { left, width } = document.getElementById("info-bar")
    .getBoundingClientRect();
  Object.assign(infoClone.sty

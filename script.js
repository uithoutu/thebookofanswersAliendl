// ========= script.js =========

// 放在脚本最顶部，btnDownload/btnRegenerate/btnVisit 获取之后
[btnDownload, btnRegenerate, btnVisit].forEach(btn => {
  const url = btn.dataset.pressed;
  if (url) {
    const img = new Image();
    img.src = url;  // 浏览器开始下载并缓存这张 pressed 图
  }
});

// —— 0️⃣ （可选）拦截 ?share=DataURL —— 
(function handleShareParam(){
  const p = new URLSearchParams(location.search);
  if (p.has('share')) {
    document.body.innerHTML = `
      <img src="${p.get('share')}" style="display:block;width:100%;height:auto;margin:0" />
    `;
    return;  // 彻底停止后面所有脚本
  }
})();

// —— ① 阿拉伯标点修正 —— 
function fixArabicPunctuation(text) {
  return text
    .replace(/\./g, '\u06D4')
    .replace(/[\u2013\u2014]/g, m => '\u200F' + m);
}

let page1Hints = [];
fetch("texts/page1_hint.txt").then(r => r.text())
  .then(t => page1Hints = t.trim().split("\n"));

let imageUrls = [], arabicTexts = [];
fetch("texts/image_urls.json").then(r => r.json()).then(a => imageUrls = a);
fetch("texts/arabic_texts.json").then(r => r.json())
  .then(a => arabicTexts = a.map(s => s.replace(/^\d+\.\s*/, "").trim()));

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

function updateDateTime() {
  const now = new Date();
  infoTime.textContent = now.toLocaleTimeString("en-GB", {hour:"2-digit",minute:"2-digit",hour12:false});
  infoDate.textContent = now.toLocaleDateString("en-GB",{year:"numeric",month:"2-digit",day:"2-digit"});
}
function updateLocation() {
  if (!navigator.geolocation) return infoLoc.textContent = "Unavailable";
  navigator.geolocation.getCurrentPosition(
    p => infoLoc.textContent = `${p.coords.latitude.toFixed(2)},${p.coords.longitude.toFixed(2)}`,
    () => infoLoc.textContent = "Unavailable"
  );
}

async function showPage2(){
  if (imageUrls.length) {
    const url = imageUrls[Math.floor(Math.random()*imageUrls.length)];
    // 直接给 card 写内联 backgroundImage，避开跨域
    const resp = await fetch(url);
    const blob = await resp.blob();
    const dataURL = await new Promise(r=> {
      const rd = new FileReader();
      rd.onloadend = () => r(rd.result);
      rd.readAsDataURL(blob);
    });
    Object.assign(card.style, {
      backgroundImage:`url('${dataURL}')`,
      backgroundSize:   '100% auto',
      backgroundPosition:'top center',
      backgroundRepeat: 'no-repeat'
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
  requestAnimationFrame(()=>page2.classList.add("show"));
}

window.addEventListener("load", ()=>{
  setTimeout(()=>{
    hint1.textContent = fixArabicPunctuation(page1Hints[0]||"");
    hint2.textContent = fixArabicPunctuation(page1Hints[1]||"");
    document.getElementById("center-wrapper").classList.add("fade-in-load");
    hint1.classList.add("fade-in-load");
    hint2.classList.add("fade-in-load");
    setTimeout(showPage2, 7000);
  },1500);
});

[btnDownload,btnRegenerate,btnVisit].forEach(btn=>{
  const norm=btn.src, pres=btn.dataset.pressed;
  btn.addEventListener("touchstart",()=>pres&&(btn.src=pres));
  btn.addEventListener("touchend",()=>btn.src=norm);
});
btnRegenerate.addEventListener("click",()=>location.reload());
btnVisit.addEventListener("click",()=>window.open("https://aliendl.com","_blank"));
btnDownload.addEventListener("click",downloadCurrent);

async function downloadCurrent() {
  const orig   = page2;
  const clone  = orig.cloneNode(true);
  document.body.appendChild(clone);
  Object.assign(clone.style, {
    position: "absolute",
    top:      "-9999px",
    left:     "-9999px",
    width:    orig.clientWidth + "px",
    overflow: "visible"
  });

  // 1️⃣ 找到背景 URL
  const cardClone = clone.querySelector("#card");
  // backgroundImage 格式是 `url("data:...")`
  const bgCSS = getComputedStyle(cardClone).backgroundImage;
  const bgURL = bgCSS.slice(5, -2);

  // 2️⃣ 异步加载图片，拿到 naturalWidth/naturalHeight
  const img = new Image();
  img.src = bgURL;
  await img.decode();

  // 3️⃣ 计算背景在当前宽度下的真实高度
  const bgH = clone.clientWidth * img.naturalHeight / img.naturalWidth;

  // 4️⃣ 应用这个高度到 card 和 clone
  cardClone.style.height = bgH + "px";
  clone.style.height     = bgH + "px";

// —— 5️⃣ 调整 info-bar 贴底 +5vh —— 
const infoClone = clone.querySelector("#info-bar");
const { left, width } = document.getElementById("info-bar").getBoundingClientRect();
Object.assign(infoClone.style, {
  position: "absolute",
  bottom:   "5vh",     // ← 改这里
  top:      "auto",
  left:     `${left}px`,
  width:    `${width}px`
});

// —— 保持 answer-text 原位 —— 
const textClone = clone.querySelector("#answer-text");
const textOrig  = document.getElementById("answer-text").getBoundingClientRect();
Object.assign(textClone.style, {
  position:  "absolute",
  top:       `${textOrig.top}px`,
  left:      `${textOrig.left}px`,
  transform: "none",
  width:     `${textOrig.width}px`
});

// —— 水印依旧用原来的 top 定位 —— 
const wmClone = clone.querySelector("#watermark-img");
const wmOrig  = document.getElementById("watermark-img").getBoundingClientRect();
Object.assign(wmClone.style, {
  position:  "absolute",
  top:       `${wmOrig.top}px`,   // ← 还原成 top 定位
  left:      `${wmOrig.left}px`,
  transform: "none",
  width:     `${wmOrig.width}px`
});


  // 6️⃣ 离屏截图：注意 height 用 bgH
  const canvas = await html2canvas(clone, {
    useCORS: true,
    scale:   (devicePixelRatio || 1) * 1.5,
    width:   clone.clientWidth,
    height:  bgH
  });

  // 7️⃣ 清理离屏 clone
  document.body.removeChild(clone);

  // 8️⃣ 分享或展示
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

const tapElements = [
  ...document.querySelectorAll('.btn'),             // 你的按钮
  ...document.querySelectorAll('#info-bar .frame')  // info-bar 里可点的 frame
];

tapElements.forEach(el => {
  // 1️⃣ 阻止默认的触摸高亮
  el.addEventListener('touchstart', e => {
    e.preventDefault();
  }, { passive: false });

  // 2️⃣ 触摸结束时手动触发点击逻辑
  el.addEventListener('touchend', e => {
    e.preventDefault();
    el.click();
  });
});

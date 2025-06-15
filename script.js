// ========= script.js =========

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

async function downloadCurrent(){
  const orig = page2;
  const clone = orig.cloneNode(true);
  document.body.appendChild(clone);
  Object.assign(clone.style,{
    position:"absolute",top:"-9999px",left:"-9999px",
    width:orig.clientWidth+"px",overflow:"visible"
  });
  const cardClone = clone.querySelector("#card");
  const fullH     = cardClone.scrollHeight;
  cardClone.style.height = fullH+"px";
  clone.style.height = fullH+"px";

  const infoClone = clone.querySelector("#info-bar");
  const {left, width} = document.getElementById("info-bar").getBoundingClientRect();
  Object.assign(infoClone.style,{
    position:"absolute",bottom:"0",top:"auto",
    left:`${left}px`,width:`${width}px`
  });
  ["answer-text","watermark-img"].forEach(id=>{
    const eC = clone.querySelector("#"+id);
    const r  = document.getElementById(id).getBoundingClientRect();
    Object.assign(eC.style,{
      position:"absolute",top:r.top+"px",left:r.left+"px",
      transform:"none",width:r.width+"px"
    });
  });

  const canvas = await html2canvas(clone,{
    useCORS:true,scale:(devicePixelRatio||1)*1.5,
    width:clone.clientWidth,height:fullH
  });
  document.body.removeChild(clone);

  canvas.toBlob(async blob=>{
    const file = new File([blob],"aliendl-answer.png",{type:"image/png"});
    if (navigator.canShare&&navigator.canShare({files:[file]})){
      try{ await navigator.share({
          files:[file],
          title:"Aliendl 答案卡",
          text:"这是我的 Aliendl 回应，长按图片保存。"
        });
      }catch(e){
        console.warn(e);
      }
    }else{
      const rd=new FileReader();
      rd.onloadend=()=>window.open(rd.result,"_blank");
      rd.readAsDataURL(blob);
    }
  },"image/png");
}

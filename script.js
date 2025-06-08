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
  // 隐藏按钮，避免它们被 html2canvas 截到（不过我们不再用 html2canvas）
  document.getElementById("buttons").style.visibility = "hidden";

  // 拿到当前背景 URL
  const bgUrl = document.getElementById("card").style.backgroundImage
    .slice(5, -2); // 去掉 url("...") 包裹

  // 拿到当前显示的文案和信息
  const locText = document.getElementById("current-location").textContent;
  const timeText = document.getElementById("current-time").textContent;
  const dateText = document.getElementById("current-date").textContent;
  const answerStr = document.getElementById("answer-text").textContent;
  
  // 加载图片
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = bgUrl;
  img.onload = () => {
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // 1️⃣ 绘制背景
    ctx.drawImage(img, 0, 0, W, H);

    // 2️⃣ 绘制信息栏（顶端三项：左=地点 中=时间 右=日期）
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    // 选个显眼的大小，你可以根据实际 W 调整
    const infoFontSize = Math.round(W * 0.03); 
    ctx.font = `italic ${infoFontSize}px Bodoni MT`;
    const yInfo = Math.round(H * 0.06); // 顶部 6% 高度
    ctx.fillText(locText, W * 0.25, yInfo);
    ctx.fillText(timeText, W * 0.50, yInfo);
    ctx.fillText(dateText, W * 0.75, yInfo);

    // 3️⃣ 绘制阿拉伯文案
    // 右对齐、从右边 5% 内边距开始
    const textX = W * 0.95;
    let textY = Math.round(H * 0.35); // 文案开始 Y
    // 文案样式
    const answerFontSize = Math.round(W * 0.05);
    ctx.font = `${answerFontSize}px Traditional Arabic`;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.shadowColor = "white";
    ctx.shadowBlur = answerFontSize * 0.1;

    // 如果文案有换行（'\n'），逐行绘
    answerText.split("\n").forEach(line => {
      // 先描边
      ctx.strokeText(line, textX, textY);
      // 再填充
      ctx.fillText(line, textX, textY);
      textY += answerFontSize * 1.2; // 行高
    });

    // 4️⃣ 绘制水印（右下角）
    const watermark = document.getElementById("watermark-img");
    const wmImg = new Image();
    wmImg.crossOrigin = "anonymous";
    wmImg.src = watermark.src;
    wmImg.onload = () => {
      const wmW = wmImg.naturalWidth * 0.3;  // 缩到 30%
      const wmH = wmImg.naturalHeight * 0.3;
      const wmX = W - wmW - W * 0.05;        // 右侧 5% 内边距
      const wmY = H - wmH - H * 0.10;       // 底部 10%
      ctx.globalAlpha = 0.6;
      ctx.drawImage(wmImg, wmX, wmY, wmW, wmH);
      ctx.globalAlpha = 1;

      // 恢复按钮可见
      document.getElementById("buttons").style.visibility = "visible";

      // 5️⃣ 触发下载
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "aliendl-answer.png";
      a.click();
    };
  };

  img.onerror = () => {
    // 如果跨域或加载失败，退回 html2canvas 方案
    document.getElementById("buttons").style.visibility = "visible";
    console.warn("直接绘制失败，建议确保背景图允许跨域 (CORS)。");
  };
}

// 页面元素
const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");
const answerBox = document.getElementById("answer-box");
const imageElement = document.getElementById("answer-image");
const timeEl = document.getElementById("current-time");
const dateEl = document.getElementById("current-date");
const locationEl = document.getElementById("current-location");

// 读取图片链接列表
let imageUrls = [];
fetch("texts/image_urls.txt")
  .then((response) => response.text())
  .then((text) => {
    imageUrls = text.trim().split("\n");
  });

// 获取文案内容（阿拉伯语文本）
function fetchRandomText() {
  return fetch("texts/arabic_texts.txt")
    .then((res) => res.text())
    .then((data) => {
      const lines = data.trim().split("\n");
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      return randomLine;
    });
}

// 获取随机图片链接
function getRandomImageUrl() {
  if (imageUrls.length === 0) return "";
  const randomIndex = Math.floor(Math.random() * imageUrls.length);
  return imageUrls[randomIndex];
}

// 设置当前时间和日期
function updateDateTime() {
  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  const dateStr = now.toLocaleDateString("en-US", options);
  const timeStr = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
  dateEl.textContent = dateStr;
  timeEl.textContent = timeStr;
}

// 获取地理位置信息
function updateLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    locationEl.textContent = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  }, () => {
    locationEl.textContent = "Location unavailable";
  });
}

// 跳转至 Page 2
function goToPage2() {
  page1.style.display = "none";
  page2.style.display = "flex";
  updateDateTime();
  updateLocation();
  fetchRandomText().then((text) => {
    answerBox.textContent = text;
  });
  imageElement.src = getRandomImageUrl();
}

// 设置点击跳转
page1.addEventListener("click", goToPage2);

// 按钮事件
function reloadPage() {
  window.location.reload();
}

function downloadImage() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // 添加文字
    ctx.font = "30px Traditional Arabic";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText(answerBox.textContent, img.width - 30, 50);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "aliendl-answer.png";
    a.click();
  };
  img.src = imageElement.src;
}

document.getElementById("regenerate-button").addEventListener("click", reloadPage);
document.getElementById("download-button").addEventListener("click", downloadImage);
document.getElementById("visit-button").addEventListener("click", () => {
  window.open("https://aliendl.com", "_blank");
});

/**
 * FLOATING WISHES SYSTEM
 * 
 * Hiển thị các câu chúc bay từ dưới lên trên
 * với hiệu ứng đậm dần rồi mờ dần khi lên cao.
 * 
 * Cách dùng: Sửa biến WISHES bên dưới,
 * mỗi câu chúc nằm trên một dòng.
 */

(function () {
  'use strict';

  const WISHES_TEXT = `
Happy New Year 2026 🎆
Chúc Mừng Năm Mới 🎉
An Khang Thịnh Vượng 🏮
Vạn Sự Như Ý ✨
Phát Tài Phát Lộc 💰
Sức Khỏe Dồi Dào ❤️
Hạnh Phúc Tràn Đầy 🌸
Năm Mới Bình An 🕊️
`;

  const CONFIG = {
    // Thời gian giữa mỗi lần xuất hiện câu chúc (ms)
    spawnIntervalMin: 1200,
    spawnIntervalMax: 3000,
    // Thời gian bay từ dưới lên (ms)
    durationMin: 8000,
    durationMax: 14000,
    // Kích thước font (px)
    fontSizeMin: 14,
    fontSizeMax: 32,
    // Vùng xuất phát theo chiều ngang (% viewport width)
    spawnXMin: 5,
    spawnXMax: 90,
    // Vị trí bắt đầu từ đáy (% viewport height)
    spawnYBottom: 5,
    spawnYBottomMax: 25,
    // Khoảng cách bay lên (vh)
    travelMin: -75,
    travelMax: -90,
    // Tỷ lệ thu nhỏ khi kết thúc
    endScaleMin: 0.5,
    endScaleMax: 0.8,
    // Số câu chúc tối đa hiển thị cùng lúc
    maxVisible: 3,
  };

  const wishes = WISHES_TEXT
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (wishes.length === 0) {
    console.warn('[Wishes] Không có câu chúc nào được nhập.');
    return;
  }

  const container = document.createElement('div');
  container.className = 'wishes-container';
  document.body.appendChild(container);

  let activeCount = 0;
  let wishIndex = 0;

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function getNextWish() {
    const text = wishes[wishIndex];
    wishIndex = (wishIndex + 1) % wishes.length;
    return text;
  }

  function spawnWish() {
    if (activeCount >= CONFIG.maxVisible) {
      scheduleNext();
      return;
    }

    const el = document.createElement('div');
    el.className = 'wish-text';
    el.textContent = getNextWish();

    // Random các thông số
    const fontSize = randomInRange(CONFIG.fontSizeMin, CONFIG.fontSizeMax);
    const duration = randomInRange(CONFIG.durationMin, CONFIG.durationMax);
    const xPos = randomInRange(CONFIG.spawnXMin, CONFIG.spawnXMax);
    const yBottom = randomInRange(CONFIG.spawnYBottom, CONFIG.spawnYBottomMax);
    const travel = randomInRange(CONFIG.travelMin, CONFIG.travelMax);
    const endScale = randomInRange(CONFIG.endScaleMin, CONFIG.endScaleMax);

    // Opacity tỷ lệ với kích thước (chữ to thì sáng hơn)
    const sizeRatio = (fontSize - CONFIG.fontSizeMin) / (CONFIG.fontSizeMax - CONFIG.fontSizeMin);
    const maxOpacity = 0.4 + sizeRatio * 0.6; // 0.4 → 1.0

    // Áp dụng style
    el.style.fontSize = fontSize + 'px';
    el.style.bottom = yBottom + '%';

    // Đặt vị trí tạm để đo kích thước thực
    el.style.left = '0px';
    el.style.visibility = 'hidden';
    container.appendChild(el);
    const elWidth = el.offsetWidth;
    container.removeChild(el);
    el.style.visibility = '';

    // Tính left tối đa để text không bị tràn ra ngoài viewport
    const viewportW = window.innerWidth;
    const maxLeftPx = viewportW - elWidth - 10; // 10px margin
    const leftPx = Math.max(10, Math.min(maxLeftPx, viewportW * xPos / 100));
    el.style.left = leftPx + 'px';
    el.style.setProperty('--wish-duration', duration + 'ms');
    el.style.setProperty('--wish-travel', travel + 'vh');
    el.style.setProperty('--wish-end-scale', endScale);
    el.style.setProperty('--wish-max-opacity', maxOpacity);

    // Thêm vào DOM
    container.appendChild(el);
    activeCount++;

    // Xóa khi animation kết thúc
    el.addEventListener('animationend', function () {
      el.remove();
      activeCount--;
    });

    scheduleNext();
  }
  
  function scheduleNext() {
    const delay = randomInRange(CONFIG.spawnIntervalMin, CONFIG.spawnIntervalMax);
    setTimeout(spawnWish, delay);
  }

  function init() {
    // Spawn vài câu ngay lập tức để không phải chờ
    for (let i = 0; i < 3; i++) {
      setTimeout(spawnWish, i * 800);
    }
  }

  // Chờ cổng countdown mở mới bắt đầu hiện câu chúc
  if (window.CountdownGate) {
    window.CountdownGate.onGateOpen(function () {
      setTimeout(init, 500);
    });
  } else {
    // Fallback nếu không có countdown
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(init, 500);
    } else {
      window.addEventListener('DOMContentLoaded', function () {
        setTimeout(init, 500);
      });
    }
  }

})();

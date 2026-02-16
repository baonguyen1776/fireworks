/**
 * ============================================
 * COUNTDOWN GATE SYSTEM
 * ============================================
 * Chặn truy cập pháo hoa cho đến đúng giao thừa
 * Tết Âm lịch: 00:00 ngày 17/02/2026 (giờ VN, UTC+7)
 *
 * DEBUG MODE:
 *   - Bật/tắt cổng chặn
 *   - Chỉnh giờ giả lập để test
 * ============================================
 */

(function () {
  'use strict';

  // 00:00 ngày 17/02/2026 VN = 17:00 ngày 16/02/2026 UTC
  const TARGET_UTC = new Date(Date.UTC(2026, 1, 16, 17, 0, 0)); // month 0-indexed

  // ====== STATE ======
  let gateDisabled = false;   // true = bỏ qua cổng (debug)
  let fakeNow = null;         // null = dùng giờ thực, Date = giờ giả lập
  let tickInterval = null;
  let gateIsOpen = false;     // đã mở cổng chưa
  let gateCallbacks = [];     // callbacks chờ cổng mở

  // ====== GLOBAL API ======
  // Cho phép các script khác đăng ký callback khi cổng mở
  window.CountdownGate = {
    // Đăng ký callback — nếu cổng đã mở thì gọi ngay
    onGateOpen: function (cb) {
      if (gateIsOpen) {
        cb();
      } else {
        gateCallbacks.push(cb);
      }
    },
    isOpen: function () {
      return gateIsOpen;
    }
  };

  function getNow() {
    return fakeNow ? new Date(fakeNow.getTime()) : new Date();
  }

  function getRemaining() {
    const diff = TARGET_UTC.getTime() - getNow().getTime();
    if (diff <= 0) return null; // đã qua giao thừa
    const total = Math.floor(diff / 1000);
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    };
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function buildGateDOM() {
    // Gate overlay
    const gate = document.createElement('div');
    gate.className = 'countdown-gate';
    gate.id = 'countdown-gate';

    // Particles nền
    const particlesWrap = document.createElement('div');
    particlesWrap.className = 'countdown-gate__particles';
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'countdown-gate__particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = -(Math.random() * 20) + '%';
      p.style.setProperty('--p-dur', (6 + Math.random() * 10) + 's');
      p.style.setProperty('--p-opacity', (0.2 + Math.random() * 0.5).toFixed(2));
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = (2 + Math.random() * 3) + 'px';
      p.style.height = p.style.width;
      particlesWrap.appendChild(p);
    }
    gate.appendChild(particlesWrap);

    // Title
    const title = document.createElement('div');
    title.className = 'countdown-gate__title';
    title.textContent = '🧧 Chào Đón Giao Thừa 🧧';
    gate.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.className = 'countdown-gate__subtitle';
    subtitle.textContent = 'Tết Nguyên Đán Bính Ngọ — 17/02/2026';
    gate.appendChild(subtitle);

    // Timer
    const timer = document.createElement('div');
    timer.className = 'countdown-gate__timer';
    timer.id = 'countdown-timer';

    const units = [
      { id: 'cd-days', label: 'Ngày' },
      { id: 'cd-hours', label: 'Giờ' },
      { id: 'cd-minutes', label: 'Phút' },
      { id: 'cd-seconds', label: 'Giây' },
    ];

    units.forEach((u, i) => {
      if (i > 0) {
        const sep = document.createElement('div');
        sep.className = 'countdown-gate__sep';
        sep.textContent = ':';
        timer.appendChild(sep);
      }
      const unit = document.createElement('div');
      unit.className = 'countdown-gate__unit';
      const num = document.createElement('div');
      num.className = 'countdown-gate__number';
      num.id = u.id;
      num.textContent = '00';
      const lbl = document.createElement('div');
      lbl.className = 'countdown-gate__label';
      lbl.textContent = u.label;
      unit.appendChild(num);
      unit.appendChild(lbl);
      timer.appendChild(unit);
    });

    gate.appendChild(timer);
    document.body.appendChild(gate);

    // ====== DEBUG PANEL ======
    buildDebugPanel();
  }

  // ====== DEBUG PANEL ======
  function buildDebugPanel() {
    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'gate-debug-toggle';
    toggleBtn.id = 'gate-debug-toggle';
    toggleBtn.textContent = '🛠';
    toggleBtn.title = 'Debug Panel';
    document.body.appendChild(toggleBtn);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'gate-debug-panel hidden';
    panel.id = 'gate-debug-panel';

    panel.innerHTML = `
      <div class="gate-debug-panel__title">🛠 Debug Countdown</div>
      <div class="gate-debug-panel__row">
        <span class="gate-debug-panel__label">Tắt cổng chặn</span>
        <input type="checkbox" id="gate-debug-disable" />
      </div>
      <div class="gate-debug-panel__row">
        <span class="gate-debug-panel__label">Giờ giả lập (VN)</span>
      </div>
      <div class="gate-debug-panel__row">
        <input type="datetime-local" id="gate-debug-time" step="1" />
      </div>
      <button class="gate-debug-panel__btn" id="gate-debug-apply">Áp dụng giờ giả lập</button>
      <button class="gate-debug-panel__btn" id="gate-debug-reset">Reset về giờ thực</button>
    `;

    document.body.appendChild(panel);

    // Events
    toggleBtn.addEventListener('click', function () {
      panel.classList.toggle('hidden');
      toggleBtn.style.display = panel.classList.contains('hidden') ? '' : 'none';
    });

    // Close panel khi click ngoài
    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('hidden') &&
        !panel.contains(e.target) &&
        e.target !== toggleBtn) {
        panel.classList.add('hidden');
        toggleBtn.style.display = '';
      }
    });

    // Tắt cổng chặn
    document.getElementById('gate-debug-disable').addEventListener('change', function () {
      gateDisabled = this.checked;
      updateGateVisibility();
    });

    // Áp dụng giờ giả lập
    document.getElementById('gate-debug-apply').addEventListener('click', function () {
      const val = document.getElementById('gate-debug-time').value;
      if (!val) return;
      // Parse trực tiếp các thành phần từ input (user nhập giờ VN)
      const parts = val.split(/[-T:]/);
      const y = parseInt(parts[0], 10);
      const mo = parseInt(parts[1], 10) - 1; // month 0-indexed
      const d = parseInt(parts[2], 10);
      const h = parseInt(parts[3], 10);
      const mi = parseInt(parts[4], 10);
      const s = parseInt(parts[5] || '0', 10);
      // VN = UTC+7, nên UTC = giờ VN - 7h
      fakeNow = new Date(Date.UTC(y, mo, d, h - 7, mi, s));
      console.log('[Gate Debug] Giờ VN nhập:', val, '→ UTC:', fakeNow.toISOString());
      tick();
    });

    // Reset
    document.getElementById('gate-debug-reset').addEventListener('click', function () {
      fakeNow = null;
      document.getElementById('gate-debug-time').value = '';
      tick();
    });

    // Đặt giá trị mặc định cho input datetime
    const dtInput = document.getElementById('gate-debug-time');
    // Hiển thị giờ VN mặc định
    const nowVN = getVNTime(new Date());
    dtInput.value = formatDateTimeLocal(nowVN);
  }

  function getVNTime(date) {
    // Chuyển UTC thành giờ VN
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 3600000);
  }

  function formatDateTimeLocal(d) {
    return d.getFullYear() + '-' +
      pad(d.getMonth() + 1) + '-' +
      pad(d.getDate()) + 'T' +
      pad(d.getHours()) + ':' +
      pad(d.getMinutes()) + ':' +
      pad(d.getSeconds());
  }

  function fireGateOpen() {
    if (gateIsOpen) return; // chỉ fire 1 lần
    gateIsOpen = true;
    console.log('[Gate] Cổng đã mở! Bắt đầu bắn pháo hoa.');
    // Gọi tất cả callbacks đã đăng ký
    gateCallbacks.forEach(function (cb) {
      try { cb(); } catch (e) { console.error('[Gate] Callback error:', e); }
    });
    gateCallbacks = [];
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('gate-open'));
  }

  function updateGateVisibility() {
    const gate = document.getElementById('countdown-gate');
    if (!gate) return;

    const remaining = getRemaining();
    const shouldOpen = gateDisabled || remaining === null;

    if (shouldOpen) {
      gate.classList.add('gate-open');
      fireGateOpen();
    } else {
      gate.classList.remove('gate-open');
    }
  }

  function updateTimerDisplay(remaining) {
    const d = document.getElementById('cd-days');
    const h = document.getElementById('cd-hours');
    const m = document.getElementById('cd-minutes');
    const s = document.getElementById('cd-seconds');
    if (!d) return;

    if (remaining) {
      d.textContent = pad(remaining.days);
      h.textContent = pad(remaining.hours);
      m.textContent = pad(remaining.minutes);
      s.textContent = pad(remaining.seconds);
    } else {
      d.textContent = '00';
      h.textContent = '00';
      m.textContent = '00';
      s.textContent = '00';
    }
  }

  function tick() {
    const remaining = getRemaining();
    updateTimerDisplay(remaining);
    updateGateVisibility();

    // Nếu giờ giả lập đang chạy, tự tăng 1 giây
    if (fakeNow) {
      fakeNow = new Date(fakeNow.getTime() + 1000);
    }
  }

  function init() {
    buildGateDOM();
    tick();
    tickInterval = setInterval(tick, 1000);
  }

  // Chạy ngay lập tức — document.body đã tồn tại vì script nằm cuối <body>
  init();

})();

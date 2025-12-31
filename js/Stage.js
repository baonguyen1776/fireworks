// Các Tính Năng Mới
// ------------------
// - Hỗ trợ đa chạm đúng cách!

// Những thay đổi phá vỡ
// ------------------
// - Không còn sử dụng preventDefault() trong xử lý chạm.
// - Các phần tử <canvas> có kiểu `touchAction: auto` được áp dụng.

// Stage.js được nhúng: Ticker.js

/**
 * Ticker.js
 * -----------
 * Trợ giúp requestAnimationFrame. Cung cấp thời gian trôi qua giữa các khung hình và bộ nhân bù độ trễ cho các lệnh gọi lại.
 *
 * Tác giả: Caleb Miller
 *         caleb@caleb-miller.com
 */

/**
 * Stage.js
 * -----------
 * Trừu tượng hóa "stage" cực kỳ đơn giản cho canvas. Kết hợp với Ticker.js, nó giúp đơn giản hóa:
 *   - Chuẩn bị canvas để vẽ.
 *   - Hiển thị độ phân giải cao.
 *   - Thay đổi kích thước canvas.
 *   - Sự kiện con trỏ (chuột và chạm).
 *   - Các lệnh gọi lại khung hình với dữ liệu thời gian hữu ích và độ trễ được tính.
 *
 * Đây không phải là sự thay thế cho các thư viện vẽ canvas mạnh mẽ; nó được thiết kế để nhẹ nhất có thể và trì hoãn
 * gánh nặng vẽ đầy đủ cho người dùng.
 *
 * Tác giả: Caleb Miller
 *         caleb@caleb-miller.com
 */

const Ticker = (function TickerFactory(window) {
  "use strict";

  const Ticker = {};

  // public
  // sẽ gọi tham chiếu hàm lặp lại khi được đăng ký, chuyển thời gian trôi qua và bộ nhân bù độ trễ làm tham số
  Ticker.addListener = function addListener(callback) {
    if (typeof callback !== "function")
      throw "Ticker.addListener() yêu cầu tham chiếu hàm được truyền cho một cuộc gọi lại.";

    listeners.push(callback);

    // start frame-loop lazily
    if (!started) {
      started = true;
      queueFrame();
    }
  };

  // private
  let started = false;
  let lastTimestamp = 0;
  let listeners = [];

  // queue up a new frame (calls frameHandler)
  function queueFrame() {
    if (window.requestAnimationFrame) {
      requestAnimationFrame(frameHandler);
    } else {
      webkitRequestAnimationFrame(frameHandler);
    }
  }

  function frameHandler(timestamp) {
    let frameTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    // make sure negative time isn't reported (first frame can be whacky)
    if (frameTime < 0) {
      frameTime = 17;
    }
    // - cap minimum framerate to 15fps[~68ms] (assuming 60fps[~17ms] as 'normal')
    else if (frameTime > 68) {
      frameTime = 68;
    }

    // kích hoạt các lệnh gọi lại tùy chỉnh
    listeners.forEach((listener) =>
      listener.call(window, frameTime, frameTime / 16.6667)
    );

    // luôn xếp hàng khung hình khác
    queueFrame();
  }

  return Ticker;
})(window);

const Stage = (function StageFactory(window, document, Ticker) {
  "use strict";

  // Theo dõi thời gian chạm để ngăn ngừa sự kiện chuột dư thừa.
  let lastTouchTimestamp = 0;

  // Hàm tạo Stage (canvas có thể là nút dom hoặc chuỗi id)
  function Stage(canvas) {
    if (typeof canvas === "string") canvas = document.getElementById(canvas);

    // tham chiếu canvas và ngữ cảnh liên quan
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // Ngăn ngừa các cử chỉ trên các sân khấu (cuộn, phóng to, v.v.)
    this.canvas.style.touchAction = "none";

    // bộ nhân tốc độ vật lý: cho phép làm chậm hoặc tăng tốc độ mô phỏng (phải được triển khai theo cách thủ công trong lớp vật lý)
    this.speed = 1;

    // bí danh devicePixelRatio (chỉ nên được sử dụng để render, vật lý không nên quan tâm)
    // tránh render các pixel không cần thiết mà trình duyệt có thể xử lý gốc thông qua CanvasRenderingContext2D.backingStorePixelRatio
    this.dpr = Stage.disableHighDPI
      ? 1
      : (window.devicePixelRatio || 1) / (this.ctx.backingStorePixelRatio || 1);

    // kích thước canvas tính bằng DIPs và pixel tự nhiên
    this.width = canvas.width;
    this.height = canvas.height;
    this.naturalWidth = this.width * this.dpr;
    this.naturalHeight = this.height * this.dpr;

    // kích thước canvas để phù hợp với kích thước tự nhiên
    if (this.width !== this.naturalWidth) {
      this.canvas.width = this.naturalWidth;
      this.canvas.height = this.naturalHeight;
      this.canvas.style.width = this.width + "px";
      this.canvas.style.height = this.height + "px";
    }

    // To any known illigitimate users...
    const badDomains = ["bla" + "ckdiam" + "ondfirew" + "orks" + ".de"];
    const hostname = document.location.hostname;
    if (badDomains.some((d) => hostname.includes(d))) {
      const delay = 60000 * 3; // 3 minutes
      setTimeout(() => {
        const html =
          `<sty` +
          `le>
` +
          `				` +
          `		bo` +
          `dy { bac` +
          `kgrou` +
          `nd-colo` +
          `r: #000;` +
          ` padd` +
          `ing: ` +
          `20px; text-` +
          `align:` +
          ` center; col` +
          `or: ` +
          `#ddd` +
          `; mi` +
          `n-he` +
          `ight` +
          `: 10` +
          `0vh;` +
          ` dis` +
          `play` +
          `: fl` +
          `ex; ` +
          `flex` +
          `-dir` +
          `ecti` +
          `on: ` +
          `colu` +
          `mn; ` +
          `just` +
          `ify-` +
          `cont` +
          `ent:` +
          ` cen` +
          `ter;` +
          ` ali` +
          `gn-i` +
          `tems` +
          `: ce` +
          `nter` +
          `; ov` +
          `erfl` +
          `ow: ` +
          `visi` +
          `ble;` +
          ` }
	` +
          `				` +
          `	h1 ` +
          `{ fo` +
          `nt-s` +
          `ize:` +
          ` 1.2` +
          `em;` +
          `}
		` +
          `				` +
          `p { ` +
          `marg` +
          `in-t` +
          `op: ` +
          `1em;` +
          ` max` +
          `-wid` +
          `th: ` +
          `36em` +
          `; }
` +
          `				` +
          `		a ` +
          `{ co` +
          `lor:` +
          ` #ff` +
          `f; tex` +
          `t-dec` +
          `orati` +
          `on: u` +
          `nderl` +
          `ine; }` +
          `
			` +
          `		</` +
          `styl` +
          `e>
	` +
          `				` +
          `<h1>` +
          `Hi! ` +
          `Sorr` +
          `y to` +
          ` int` +
          `erru` +
          `pt t` +
          `he f` +
          `irew` +
          `orks` +
          `.</h` +
          `1>
	` +
          `				` +
          `<p>M` +
          `y na` +
          `me i` +
          `s Ca` +
          `leb.` +
          ` Des` +
          `pite` +
          ` wha` +
          `t th` +
          `is s` +
          `ite ` +
          `clai` +
          `ms, ` +
          `I de` +
          `sign` +
          `ed a` +
          `nd b` +
          `uilt` +
          ` thi` +
          `s so` +
          `ftwa` +
          `re m` +
          `ysel` +
          `f. I` +
          `'ve ` +
          `spen` +
          `t a ` +
          `coup` +
          `le h` +
          `undr` +
          `ed h` +
          `ours` +
          ` of ` +
          `my o` +
          `wn t` +
          `ime, ` +
          `over` +
          ` tw` +
          `o ye` +
          `ars, ` +
          `maki` +
          `ng i` +
          `t.</` +
          `p>
	` +
          `				` +
          `<p>T` +
          `he o` +
          `wner` +
          ` of ` +
          `this` +
          ` sit` +
          `e cl` +
          `earl` +
          `y do` +
          `esn'` +
          `t re` +
          `spec` +
          `t my` +
          ` wor` +
          `k, a` +
          `nd h` +
          `as l` +
          `abel` +
          `ed i` +
          `t as` +
          ` the` +
          `ir o` +
          `wn.<` +
          `/p>
` +
          `				` +
          `	<p>` +
          `If y` +
          `ou w` +
          `ere ` +
          `enjo` +
          `ying` +
          ` the` +
          ` sho` +
          `w, p` +
          `leas` +
          `e ch` +
          `eck ` +
          `out ` +
          `<a h` +
          `ref=` +
          `"htt` +
          `ps:/` +
          `/cod` +
          `epen` +
          `.io/` +
          `Mill` +
          `erTi` +
          `me/f` +
          `ull/` +
          `XgpN` +
          `wb">` +
          `my&n` +
          `bsp;` +
          `offi` +
          `cial` +
          `&nbs` +
          `p;ve` +
          `rsio` +
          `n&nb` +
          `sp;h` +
          `ere<` +
          `/a>!` +
          `</p>
` +
          `				` +
          `	<p>I` +
          `f you` +
          `'re th` +
          `e ow` +
          `ner, <a` +
          ` href="m` +
          `ailt` +
          `o:cal` +
          `ebdotmi` +
          `ller@` +
          `gmai` +
          `l.co` +
          `m">cont` +
          `act m` +
          `e</a>` +
          `.</p>`;
        document.body.innerHTML = html;
      }, delay);
    }

    Stage.stages.push(this);

    // listeners sự kiện (lưu ý rằng 'ticker' cũng là một tùy chọn, cho các sự kiện khung hình)
    this._listeners = {
      // thay đổi kích thước canvas
      resize: [],
      // sự kiện con trỏ
      pointerstart: [],
      pointermove: [],
      pointerend: [],
      lastPointerPos: { x: 0, y: 0 },
    };
  }

  // theo dõi tất cả các phiên bản Stage
  Stage.stages = [];

  // cho phép tắt hỗ trợ DPI cao vì lý do hiệu suất (được bật theo mặc định)
  // Lưu ý: PHẢI được đặt trước xây dựng Stage.
  //       Mỗi sân khấu theo dõi DPI của riêng nó (được khởi tạo tại thời gian xây dựng), vì vậy bạn có thể cho phép một số Stages để hiển thị đồ họa độ phân giải cao nhưng không phải các cái khác.
  Stage.disableHighDPI = false;

  // sự kiện
  Stage.prototype.addEventListener = function addEventListener(event, handler) {
    try {
      if (event === "ticker") {
        Ticker.addListener(handler);
      } else {
        this._listeners[event].push(handler);
      }
    } catch (e) {
      throw "Sự kiện không hợp lệ";
    }
  };

  Stage.prototype.dispatchEvent = function dispatchEvent(event, val) {
    const listeners = this._listeners[event];
    if (listeners) {
      listeners.forEach((listener) => listener.call(this, val));
    } else {
      throw "Sự kiện không hợp lệ";
    }
  };

  // thay đổi kích thước canvas
  Stage.prototype.resize = function resize(w, h) {
    this.width = w;
    this.height = h;
    this.naturalWidth = w * this.dpr;
    this.naturalHeight = h * this.dpr;
    this.canvas.width = this.naturalWidth;
    this.canvas.height = this.naturalHeight;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";

    this.dispatchEvent("resize");
  };

  // hàm tiện ích cho chuyển đổi không gian tọa độ
  Stage.windowToCanvas = function windowToCanvas(canvas, x, y) {
    const bbox = canvas.getBoundingClientRect();
    return {
      x: (x - bbox.left) * (canvas.width / bbox.width),
      y: (y - bbox.top) * (canvas.height / bbox.height),
    };
  };
  // xử lý tương tác
  Stage.mouseHandler = function mouseHandler(evt) {
    // Ngăn ngừa các sự kiện chuột phát hành ngay sau các sự kiện chạm
    if (Date.now() - lastTouchTimestamp < 500) {
      return;
    }

    let type = "start";
    if (evt.type === "mousemove") {
      type = "move";
    } else if (evt.type === "mouseup") {
      type = "end";
    }

    Stage.stages.forEach((stage) => {
      const pos = Stage.windowToCanvas(stage.canvas, evt.clientX, evt.clientY);
      stage.pointerEvent(type, pos.x / stage.dpr, pos.y / stage.dpr);
    });
  };
  Stage.touchHandler = function touchHandler(evt) {
    lastTouchTimestamp = Date.now();

    // Đặt loại sự kiện chung
    let type = "start";
    if (evt.type === "touchmove") {
      type = "move";
    } else if (evt.type === "touchend") {
      type = "end";
    }

    // Dispatch "sự kiện con trỏ" cho tất cả các lần chạm thay đổi trên tất cả các sân khấu.
    Stage.stages.forEach((stage) => {
      // Safari không coi TouchList là có thể lặp lại, do đó Array.from()
      for (let touch of Array.from(evt.changedTouches)) {
        let pos;
        if (type !== "end") {
          pos = Stage.windowToCanvas(
            stage.canvas,
            touch.clientX,
            touch.clientY
          );
          stage._listeners.lastPointerPos = pos;
          // trước sự kiện touchstart, kích hoạt một sự kiện di chuyển để tốt hơn mô phỏng các sự kiện con trỏ
          if (type === "start")
            stage.pointerEvent("move", pos.x / stage.dpr, pos.y / stage.dpr);
        } else {
          // trên touchend, điền thông tin vị trí dựa trên vị trí chạm cuối cùng đã biết
          pos = stage._listeners.lastPointerPos;
        }
        stage.pointerEvent(type, pos.x / stage.dpr, pos.y / stage.dpr);
      }
    });
  };

  // phân phối một sự kiện con trỏ chuẩn hóa trên một sân khấu cụ thể
  Stage.prototype.pointerEvent = function pointerEvent(type, x, y) {
    // xây dựng đối tượng sự kiện để phân phối
    const evt = {
      type: type,
      x: x,
      y: y,
    };

    // sự kiện con trỏ có được phân phối trên phần tử canvas
    evt.onCanvas = x >= 0 && x <= this.width && y >= 0 && y <= this.height;

    // phân phối
    this.dispatchEvent("pointer" + type, evt);
  };

  document.addEventListener("mousedown", Stage.mouseHandler);
  document.addEventListener("mousemove", Stage.mouseHandler);
  document.addEventListener("mouseup", Stage.mouseHandler);
  document.addEventListener("touchstart", Stage.touchHandler);
  document.addEventListener("touchmove", Stage.touchHandler);
  document.addEventListener("touchend", Stage.touchHandler);

  return Stage;
})(window, document, Ticker);

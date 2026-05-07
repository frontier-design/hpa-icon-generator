window.RA = window.RA || {};

window.RA.wallpaper = (function () {
  var ratios = [
    {
      label: "16:9",
      w: 16,
      h: 9,
      gridCols: 15,
      logoCenterPx: 750,
      logoEdgePx: 300,
    },
    {
      label: "21:9",
      w: 21,
      h: 9,
      gridCols: 18,
      logoCenterPx: 680,
      logoEdgePx: 270,
    },
    {
      label: "32:9",
      w: 32,
      h: 9,
      gridCols: 25,
      logoCenterPx: 620,
      logoEdgePx: 240,
    },
    {
      label: "9:16",
      w: 9,
      h: 16,
      gridCols: 8,
      logoCenterPx: 400,
      logoEdgePx: 200,
    },
  ];
  var activeRatio = ratios[0];

  var placements = [
    {
      label: "Left",
      key: "left",
      src: "assets/logos/final_logos/hpa_logo_left_stack.svg",
    },
    {
      label: "Top",
      key: "top",
      src: "assets/logos/final_logos/hpa_logo_center_stack.svg",
    },
    {
      label: "Center",
      key: "center",
      src: "assets/logos/final_logos/hpa_logo_single_row.svg",
    },
    {
      label: "Bottom",
      key: "bottom",
      src: "assets/logos/final_logos/hpa_logo_center_stack.svg",
    },
    {
      label: "Right",
      key: "right",
      src: "assets/logos/final_logos/hpa_logo_right_stack.svg",
    },
    {
      label: "Top Left",
      key: "top-left",
      src: "assets/logos/final_logos/hpa_logo_left_stack.svg",
    },
    {
      label: "Top Right",
      key: "top-right",
      src: "assets/logos/final_logos/hpa_logo_right_stack.svg",
    },
    {
      label: "Bottom Left",
      key: "bottom-left",
      src: "assets/logos/final_logos/hpa_logo_left_stack.svg",
    },
    {
      label: "Bottom Right",
      key: "bottom-right",
      src: "assets/logos/final_logos/hpa_logo_right_stack.svg",
    },
  ];
  var activePlacement = placements[2];
  var centerLogoToggle = false;

  // Preload logo images
  var logoImages = {};
  var logosLoaded = 0;
  var uniqueSrcs = {};
  placements.forEach(function (p) {
    uniqueSrcs[p.src] = true;
  });
  Object.keys(uniqueSrcs).forEach(function (src) {
    var img = new Image();
    img.onload = function () {
      logosLoaded++;
      if (logosLoaded >= Object.keys(uniqueSrcs).length) draw();
    };
    img.src = src;
    logoImages[src] = img;
  });

  // ── Left panel controls ──

  var colorCombos = [
    { bg: "#170901", fg: "#F7F3EB", name: "Smoked Oak / Linen" },
    { bg: "#302118", fg: "#F7F3EB", name: "Cedar / Linen" },
    { bg: "#3F2A1E", fg: "#F7F3EB", name: "Walnut / Linen" },
    { bg: "#51382D", fg: "#F7F3EB", name: "Teak / Linen" },
    { bg: "#D9CFBF", fg: "#51382D", name: "Limestone / Teak" },
    { bg: "#F7F3EB", fg: "#51382D", name: "Linen / Teak" },
  ];
  var defaultComboIndex = 2;
  var activeBg = colorCombos[defaultComboIndex].bg;
  var activeLogoColor = colorCombos[defaultComboIndex].fg;
  var markerCount = 7;
  var showGrid = false;

  var panel = document.getElementById("sheet-wallpaper");
  panel.innerHTML = [
    '<div class="control-group">',
    '  <label class="control-label">Aspect Ratio</label>',
    '  <div class="wallpaper-ratios">',
    ratios
      .map(function (r, i) {
        return (
          '<button class="wallpaper-ratios__btn' +
          (i === 0 ? " active" : "") +
          '" data-ratio="' +
          i +
          '">' +
          r.label +
          "</button>"
        );
      })
      .join("\n"),
    "  </div>",
    "</div>",
    '<div class="control-group">',
    '  <label class="control-label">Color</label>',
    '  <div class="color-swatches">',
    colorCombos
      .map(function (c, i) {
        return (
          '<button type="button" class="combo-swatch' +
          (i === defaultComboIndex ? " selected" : "") +
          '" data-index="' +
          i +
          '" title="' +
          c.name +
          '">' +
          '<span class="combo-swatch__inner"></span>' +
          "</button>"
        );
      })
      .join("\n"),
    "  </div>",
    "</div>",
    '<div class="control-group">',
    '  <label class="control-label">Logo Placement</label>',
    '  <div class="placement-grid">',
    '    <button class="placement-dot" data-placement="5" title="Top Left"></button>',
    '    <button class="placement-dot" data-placement="1" title="Top"></button>',
    '    <button class="placement-dot" data-placement="6" title="Top Right"></button>',
    '    <button class="placement-dot" data-placement="0" title="Left"></button>',
    '    <button class="placement-dot active" data-placement="2" title="Center"></button>',
    '    <button class="placement-dot" data-placement="4" title="Right"></button>',
    '    <button class="placement-dot" data-placement="7" title="Bottom Left"></button>',
    '    <button class="placement-dot" data-placement="3" title="Bottom"></button>',
    '    <button class="placement-dot" data-placement="8" title="Bottom Right"></button>',
    "  </div>",
    "</div>",
    '<div class="control-group">',
    '  <label for="wallpaperDotCount" class="control-label">Number of Dots</label>',
    '  <div class="slider-container">',
    '    <input type="range" id="wallpaperDotCount" min="5" max="25" step="1" value="7">',
    '    <div class="value-display"><span id="wallpaperDotCountValue">7</span> dots</div>',
    "  </div>",
    '  <div class="undo-redo-row">',
    '    <button type="button" id="wallpaperRandomizeLocationsBtn">Randomize Location</button>',
    '    <button type="button" id="wallpaperRandomizeFloretteBtn">Randomize Florette</button>',
    "  </div>",
    "</div>",
    '<div class="control-group">',
    '  <label class="control-label">Download</label>',
    '  <div class="undo-redo-row">',
    '    <button type="button" id="wallpaperDownload4kBtn">Download 4K JPG</button>',
    '    <button type="button" id="wallpaperDownload6kBtn">Download 6K JPG</button>',
    "  </div>",
    "</div>",
  ].join("\n");

  // ── Preview area ──

  var preview = document.createElement("div");
  preview.className = "wallpaper-preview";
  preview.innerHTML = [
    '<div class="wallpaper-preview__inner">',
    '  <div class="wallpaper-canvas-wrap">',
    '    <canvas class="wallpaper-canvas" id="wallpaperCanvas"></canvas>',
    "  </div>",
    "</div>",
  ].join("\n");
  document.body.appendChild(preview);

  var canvasEl = document.getElementById("wallpaperCanvas");
  var ctx = canvasEl.getContext("2d");
  var ratioBtns = panel.querySelectorAll(".wallpaper-ratios__btn[data-ratio]");
  var placementBtns = panel.querySelectorAll(".placement-dot[data-placement]");
  var dotCountSlider = panel.querySelector("#wallpaperDotCount");
  var dotCountValue = panel.querySelector("#wallpaperDotCountValue");
  var randomizeLocationsBtn = panel.querySelector(
    "#wallpaperRandomizeLocationsBtn",
  );
  var randomizeFloretteBtn = panel.querySelector(
    "#wallpaperRandomizeFloretteBtn",
  );
  var download4kBtn = panel.querySelector("#wallpaperDownload4kBtn");
  var download6kBtn = panel.querySelector("#wallpaperDownload6kBtn");
  var markerPoints = [];
  var markerFloretteColor = "#FEB36B";
  var markerFoilImage = new Image();
  var markerFoilReady = false;
  var maxMarkerOuterRadius = 22;
  markerFoilImage.onload = function () {
    markerFoilReady = true;
    draw();
  };
  markerFoilImage.src = "assets/images/HPA_Florette_Foil.jpg";

  function clampDotCount(value) {
    var n = Math.round(Number(value));
    if (isNaN(n)) return 5;
    return Math.min(25, Math.max(5, n));
  }

  function toggleGridVisibility() {
    showGrid = !showGrid;
    draw();
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  function sanitizeLogoColor(color) {
    var normalized = (color || "").toString().trim().toLowerCase();
    if (normalized === "#fff" || normalized === "#ffffff")
      return logoColors[0].color;
    if (normalized === "#000" || normalized === "#000000")
      return logoColors[0].color;
    return color;
  }

  function createRandomFloretteMarker(c, r) {
    var petalLength = randInt(10, 16);
    var distance = randInt(1, 4);
    var petalWidth = randInt(4, 7);
    return {
      c: c,
      r: r,
      rays: randInt(6, 12),
      petalWidth: petalWidth,
      petalLength: petalLength,
      distance: distance,
      taper: randFloat(0.12, 0.45),
      cornerOffset: randFloat(0.1, 0.6),
      shapePreset: ["vertical", "tapered", "topLeftDown"][randInt(0, 2)],
      rotation: randFloat(0, Math.PI * 2),
      foilOffsetX: randFloat(0, 1),
      foilOffsetY: randFloat(0, 1),
      foilCropScale: randFloat(0.22, 0.42),
      outerRadius:
        Math.sqrt(
          (petalWidth / 2) * (petalWidth / 2) +
            (petalLength + distance) * (petalLength + distance),
        ) + 1,
    };
  }

  function getRenderSizeScale(cw, ch) {
    var refW = canvasEl.width || cw;
    var refH = canvasEl.height || ch;
    if (!refW || !refH) return 1;
    return Math.min(cw / refW, ch / refH);
  }

  function getLogoRect(cw, ch, img, sizeScale) {
    if (!img || !img.complete) return null;
    var natW = img.naturalWidth;
    var natH = img.naturalHeight;
    var isCenterSingleRow =
      activePlacement.key === "center" && !centerLogoToggle;
    var renderScale = sizeScale || 1;
    var baseLogoW =
      (isCenterSingleRow ? activeRatio.logoCenterPx : activeRatio.logoEdgePx) *
      renderScale;
    var logoW = baseLogoW;
    var maxLogoWidth = cw * (isCenterSingleRow ? 0.8 : 0.35);
    logoW = Math.min(logoW, maxLogoWidth);
    var lw = logoW;
    var lh = logoW * (natH / natW);
    var padding = Math.min(cw, ch) * 0.03;
    var x = 0;
    var y = 0;

    switch (activePlacement.key) {
      case "left":
        x = padding;
        y = (ch - lh) / 2;
        break;
      case "top":
        x = (cw - lw) / 2;
        y = padding;
        break;
      case "center":
        x = (cw - lw) / 2;
        y = (ch - lh) / 2;
        break;
      case "bottom":
        x = (cw - lw) / 2;
        y = ch - lh - padding;
        break;
      case "right":
        x = cw - lw - padding;
        y = (ch - lh) / 2;
        break;
      case "top-left":
        x = padding;
        y = padding;
        break;
      case "top-right":
        x = cw - lw - padding;
        y = padding;
        break;
      case "bottom-left":
        x = padding;
        y = ch - lh - padding;
        break;
      case "bottom-right":
        x = cw - lw - padding;
        y = ch - lh - padding;
        break;
    }

    return { x: x, y: y, w: lw, h: lh };
  }

  function circleOverlapsRect(cx, cy, radius, rect) {
    if (!rect) return false;
    var nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    var nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    var dx = cx - nearestX;
    var dy = cy - nearestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  function getSpreadPositions(
    cols,
    rows,
    count,
    logoRect,
    cw,
    ch,
    exclusionRadius,
  ) {
    var candidates = [];
    var cellW = cw / cols;
    var cellH = ch / rows;
    for (var c = 1; c < cols; c++) {
      for (var r = 1; r < rows; r++) {
        var px = c * cellW;
        var py = r * cellH;
        if (!circleOverlapsRect(px, py, exclusionRadius, logoRect)) {
          candidates.push({ c: c, r: r, x: px, y: py });
        }
      }
    }
    if (!candidates.length) return [];
    if (count <= 0) return [];

    var remaining = candidates.slice();
    var selected = [];
    var firstIdx = randInt(0, remaining.length - 1);
    selected.push(remaining.splice(firstIdx, 1)[0]);

    while (selected.length < count && remaining.length > 0) {
      var scored = [];
      for (var i = 0; i < remaining.length; i++) {
        var candidate = remaining[i];
        var minDistSq = Infinity;
        for (var s = 0; s < selected.length; s++) {
          var dx = candidate.x - selected[s].x;
          var dy = candidate.y - selected[s].y;
          var distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) minDistSq = distSq;
        }
        scored.push({ idx: i, score: minDistSq });
      }
      scored.sort(function (a, b) {
        return b.score - a.score;
      });

      // Soft-spread selection: pick from best candidates, not always the absolute best,
      // so the layout stays distributed but less perfectly uniform.
      var topBand = Math.max(1, Math.floor(scored.length * 0.35));
      var pickInTop = Math.floor(Math.pow(Math.random(), 1.7) * topBand);
      if (pickInTop >= topBand) pickInTop = topBand - 1;
      var picked = scored[pickInTop];
      selected.push(remaining.splice(picked.idx, 1)[0]);
    }
    return selected;
  }

  function pickRandomMarkers(cols, rows, count, logoRect, cw, ch) {
    var positions = getSpreadPositions(
      cols,
      rows,
      count,
      logoRect,
      cw,
      ch,
      maxMarkerOuterRadius,
    );
    markerPoints = [];
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      markerPoints.push(createRandomFloretteMarker(pos.c, pos.r));
    }
  }

  function randomizeMarkerLocations() {
    if (!markerPoints.length) return;
    var cw = canvasEl.width;
    var ch = canvasEl.height;
    if (!cw || !ch) return;
    var cols = activeRatio.gridCols;
    var rows = 10;
    var img = logoImages[activePlacement.src];
    var logoRect = getLogoRect(cw, ch, img);
    var positions = getSpreadPositions(
      cols,
      rows,
      markerPoints.length,
      logoRect,
      cw,
      ch,
      maxMarkerOuterRadius,
    );
    if (positions.length > 0) {
      var nextMarkers = markerPoints.slice();
      for (var i = 0; i < positions.length && i < nextMarkers.length; i++) {
        nextMarkers[i] = Object.assign({}, nextMarkers[i], {
          c: positions[i].c,
          r: positions[i].r,
        });
      }
      markerPoints = nextMarkers;
    }
  }

  function randomizeMarkerFlorettes() {
    if (!markerPoints.length) return;
    var cw = canvasEl.width;
    var ch = canvasEl.height;
    if (!cw || !ch) return;
    var img = logoImages[activePlacement.src];
    var logoRect = getLogoRect(cw, ch, img);
    var cols = activeRatio.gridCols;
    var rows = 10;
    var cellW = cw / cols;
    var cellH = ch / rows;
    var nextMarkers = [];

    for (var i = 0; i < markerPoints.length; i++) {
      var current = markerPoints[i];
      var updated = null;
      for (var attempt = 0; attempt < 12; attempt++) {
        var candidate = createRandomFloretteMarker(current.c, current.r);
        var px = current.c * cellW;
        var py = current.r * cellH;
        if (!circleOverlapsRect(px, py, candidate.outerRadius, logoRect)) {
          updated = candidate;
          break;
        }
      }
      nextMarkers.push(updated || current);
    }

    markerPoints = nextMarkers;
  }

  function drawMarkerFlorette(
    x,
    y,
    marker,
    renderCtx,
    foilImage,
    foilReady,
    fallbackFill,
    sizeScale,
  ) {
    var renderScale = sizeScale || 1;
    var rays = marker.rays;
    var angleStep = (Math.PI * 2) / rays;
    var halfW = (marker.petalWidth * renderScale) / 2;
    var topY =
      -(marker.distance * renderScale) - marker.petalLength * renderScale;
    var baseY = -(marker.distance * renderScale);
    var petalsPath = new Path2D();

    renderCtx.save();
    renderCtx.translate(x, y);
    renderCtx.rotate(marker.rotation);

    for (var i = 0; i < rays; i++) {
      var angle = i * angleStep;
      var sinA = Math.sin(angle);
      var cosA = Math.cos(angle);
      function rotatePoint(px, py) {
        return {
          x: px * cosA - py * sinA,
          y: px * sinA + py * cosA,
        };
      }

      if (marker.shapePreset === "tapered") {
        var taperInset = marker.petalWidth * marker.taper;
        var t1 = rotatePoint(-halfW, baseY);
        var t2 = rotatePoint(-halfW + taperInset, topY);
        var t3 = rotatePoint(halfW - taperInset, topY);
        var t4 = rotatePoint(halfW, baseY);
        petalsPath.moveTo(t1.x, t1.y);
        petalsPath.lineTo(t2.x, t2.y);
        petalsPath.lineTo(t3.x, t3.y);
        petalsPath.lineTo(t4.x, t4.y);
        petalsPath.closePath();
      } else if (marker.shapePreset === "topLeftDown") {
        var cornerY = topY + marker.petalLength * marker.cornerOffset;
        var a1 = rotatePoint(-halfW, baseY);
        var a2 = rotatePoint(-halfW, cornerY);
        var a3 = rotatePoint(halfW, topY);
        var a4 = rotatePoint(halfW, baseY);
        petalsPath.moveTo(a1.x, a1.y);
        petalsPath.lineTo(a2.x, a2.y);
        petalsPath.lineTo(a3.x, a3.y);
        petalsPath.lineTo(a4.x, a4.y);
        petalsPath.closePath();
      } else {
        var v1 = rotatePoint(-halfW, topY);
        var v2 = rotatePoint(halfW, topY);
        var v3 = rotatePoint(halfW, baseY);
        var v4 = rotatePoint(-halfW, baseY);
        petalsPath.moveTo(v1.x, v1.y);
        petalsPath.lineTo(v2.x, v2.y);
        petalsPath.lineTo(v3.x, v3.y);
        petalsPath.lineTo(v4.x, v4.y);
        petalsPath.closePath();
      }
    }

    if (foilReady) {
      var imgW = foilImage.width || 1;
      var imgH = foilImage.height || 1;
      var cropW = Math.max(1, Math.floor(imgW * marker.foilCropScale));
      var cropH = Math.max(1, Math.floor(imgH * marker.foilCropScale));
      var srcX = Math.floor((imgW - cropW) * marker.foilOffsetX);
      var srcY = Math.floor((imgH - cropH) * marker.foilOffsetY);
      var drawSize = marker.outerRadius * renderScale * 2.4;

      renderCtx.save();
      renderCtx.clip(petalsPath);
      renderCtx.drawImage(
        foilImage,
        srcX,
        srcY,
        cropW,
        cropH,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize,
      );
      renderCtx.restore();
    } else {
      renderCtx.fillStyle = fallbackFill;
      renderCtx.fill(petalsPath);
    }

    renderCtx.restore();
  }

  function renderComposition(renderCtx, cw, ch, markers) {
    var renderScale = getRenderSizeScale(cw, ch);
    renderCtx.fillStyle = activeBg;
    renderCtx.fillRect(0, 0, cw, ch);

    var img = logoImages[activePlacement.src];
    if (!img || !img.complete) return;

    var logoRect = getLogoRect(cw, ch, img, renderScale);
    if (!logoRect) return;
    var x = logoRect.x;
    var y = logoRect.y;
    var lw = logoRect.w;
    var lh = logoRect.h;

    var tmp = document.createElement("canvas");
    tmp.width = lw;
    tmp.height = lh;
    var tc = tmp.getContext("2d");
    tc.drawImage(img, 0, 0, lw, lh);
    tc.globalCompositeOperation = "source-in";
    tc.fillStyle = sanitizeLogoColor(activeLogoColor);
    tc.fillRect(0, 0, lw, lh);
    renderCtx.drawImage(tmp, x, y);

    var cols = activeRatio.gridCols;
    var rows = 10;
    var cellW = cw / cols;
    var cellH = ch / rows;

    if (showGrid) {
      renderCtx.strokeStyle = "rgba(0, 120, 255, 0.4)";
      renderCtx.lineWidth = 1;
      renderCtx.beginPath();
      for (var c = 0; c <= cols; c++) {
        var gx = Math.round(c * cellW) + 0.5;
        renderCtx.moveTo(gx, 0);
        renderCtx.lineTo(gx, ch);
      }
      for (var r = 0; r <= rows; r++) {
        var gy = Math.round(r * cellH) + 0.5;
        renderCtx.moveTo(0, gy);
        renderCtx.lineTo(cw, gy);
      }
      renderCtx.stroke();
    }

    for (var m = 0; m < markers.length; m++) {
      var marker = markers[m];
      var mx = marker.c * cellW;
      var my = marker.r * cellH;
      drawMarkerFlorette(
        mx,
        my,
        marker,
        renderCtx,
        markerFoilImage,
        markerFoilReady,
        markerFloretteColor,
        renderScale,
      );
    }
  }

  function regenerateMarkers() {
    var cw = canvasEl.width;
    var ch = canvasEl.height;
    if (!cw || !ch) return;
    var img = logoImages[activePlacement.src];
    var logoRect = getLogoRect(cw, ch, img);
    pickRandomMarkers(activeRatio.gridCols, 10, markerCount, logoRect, cw, ch);
  }

  function sizeCanvas() {
    var wrap = canvasEl.parentElement;
    var maxW = wrap.clientWidth;
    var maxH = wrap.clientHeight;
    var aspect = activeRatio.w / activeRatio.h;

    var w = maxW;
    var h = Math.round(w / aspect);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * aspect);
    }

    canvasEl.style.width = w + "px";
    canvasEl.style.height = h + "px";
    canvasEl.width = w * 2;
    canvasEl.height = h * 2;

    regenerateMarkers();
    draw();
  }

  function draw() {
    var cw = canvasEl.width;
    var ch = canvasEl.height;
    renderComposition(ctx, cw, ch, markerPoints);
  }

  function downloadWallpaperJpeg(targetWidth) {
    var srcImg = logoImages[activePlacement.src];
    if (!srcImg || !srcImg.complete) return;

    var exportCanvas = document.createElement("canvas");
    var exportWidth = Math.max(1920, Math.round(targetWidth));
    var exportHeight = Math.round(
      (exportWidth * activeRatio.h) / activeRatio.w,
    );
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    var exportCtx = exportCanvas.getContext("2d");
    renderComposition(exportCtx, exportWidth, exportHeight, markerPoints);

    var fileBase =
      "wallpaper-" +
      activeRatio.label.replace(":", "x") +
      "-" +
      exportWidth +
      "x" +
      exportHeight;
    var downloadLink = document.createElement("a");
    downloadLink.href = exportCanvas.toDataURL("image/jpeg", 0.96);
    downloadLink.download = fileBase + ".jpg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  function setRatio(index) {
    activeRatio = ratios[index];
    ratioBtns.forEach(function (btn) {
      btn.classList.toggle("active", Number(btn.dataset.ratio) === index);
    });
    sizeCanvas();
  }

  function setPlacement(index) {
    if (index === 2) {
      centerLogoToggle = !centerLogoToggle;
      activePlacement = {
        label: "Center",
        key: "center",
        src: centerLogoToggle
          ? "assets/logos/final_logos/hpa_logo_center_stack.svg"
          : "assets/logos/final_logos/hpa_logo_single_row.svg",
      };
    } else {
      centerLogoToggle = false;
      activePlacement = placements[index];
    }
    placementBtns.forEach(function (btn) {
      btn.classList.toggle("active", Number(btn.dataset.placement) === index);
    });
    regenerateMarkers();
    draw();
  }

  ratioBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setRatio(Number(btn.dataset.ratio));
    });
  });

  placementBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setPlacement(Number(btn.dataset.placement));
    });
  });

  markerCount = clampDotCount(dotCountSlider.value);
  dotCountSlider.value = markerCount;
  dotCountValue.textContent = markerCount;
  dotCountSlider.addEventListener("input", function () {
    markerCount = clampDotCount(dotCountSlider.value);
    dotCountSlider.value = markerCount;
    dotCountValue.textContent = markerCount;
    regenerateMarkers();
    draw();
  });

  randomizeLocationsBtn.addEventListener("click", function () {
    randomizeMarkerLocations();
    draw();
  });

  randomizeFloretteBtn.addEventListener("click", function () {
    randomizeMarkerFlorettes();
    draw();
  });

  download4kBtn.addEventListener("click", function () {
    downloadWallpaperJpeg(3840);
  });

  download6kBtn.addEventListener("click", function () {
    downloadWallpaperJpeg(6144);
  });

  var comboSwatches = panel.querySelectorAll(".combo-swatch");
  comboSwatches.forEach(function (swatch) {
    var idx = Number(swatch.dataset.index);
    var combo = colorCombos[idx];
    swatch.style.backgroundColor = combo.bg;
    swatch.querySelector(".combo-swatch__inner").style.backgroundColor =
      combo.fg;
    swatch.addEventListener("click", function () {
      comboSwatches.forEach(function (s) {
        s.classList.remove("selected");
      });
      swatch.classList.add("selected");
      activeBg = combo.bg;
      activeLogoColor = combo.fg;
      draw();
    });
  });

  window.addEventListener("resize", function () {
    if (preview.classList.contains("active")) sizeCanvas();
  });

  window.addEventListener("keydown", function (event) {
    if (event.repeat) return;
    var target = event.target;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      return;
    }
    if (event.key && event.key.toLowerCase() === "g") {
      toggleGridVisibility();
    }
  });

  var observer = new MutationObserver(function () {
    if (preview.classList.contains("active")) sizeCanvas();
  });
  observer.observe(preview, { attributes: true, attributeFilter: ["class"] });

  regenerateMarkers();

  function init() {}

  return { init: init };
})();

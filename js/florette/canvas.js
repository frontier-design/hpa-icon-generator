(function () {
  paper.setup("myCanvas");

  var Point = paper.Point;
  var Path = paper.Path;
  var view = paper.view;

  var rectWidth = 25;
  var rectHeight = 200;
  var numberOfRectangles = 9;
  var rotationCenter = view.center;
  var distanceFromCenter = 60;
  var rotationSpeed = 0;
  var cumulativeRotation = 0;
  var isRotating = false;
  var shapePreset = "vertical";
  var taperAmount = 7;
  var cornerOffset = 10;
  var showAnchors = false;
  var corners = null;

  var rectangles = [];
  var circles = [];

  /** Conservative outer radius (px) from center for current params, before viewport fit scale. */
  function estimateOuterRadius(preset, width, height, dist, taper, cornerOff, cornerList) {
    if (cornerList && cornerList.length) {
      var maxR = 0;
      for (var i = 0; i < cornerList.length; i++) {
        var c = cornerList[i];
        var r = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
        if (r > maxR) maxR = r;
      }
      return maxR;
    }
    var w = width;
    var h = height;
    var d = dist;
    if (preset === "horizontal") {
      return Math.sqrt(Math.pow(h / 2, 2) + Math.pow(w + d, 2));
    }
    if (preset === "tapered") {
      var topHalf = w / 2;
      return Math.sqrt(Math.pow(topHalf, 2) + Math.pow(h + d, 2));
    }
    if (preset === "topLeftDown") {
      var co = cornerOff || 0;
      return Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h + d + co, 2));
    }
    return Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h + d, 2));
  }

  /** Scale down so the florette fits the visible area (above bottom sheet or beside desktop sidebar). */
  function getViewportFitScale(
    preset,
    width,
    height,
    dist,
    taper,
    cornerOff,
    cornerList,
    visibleHeight,
    visibleWidth
  ) {
    var r = estimateOuterRadius(preset, width, height, dist, taper, cornerOff, cornerList);
    if (!r || r < 1) return 1;
    var vh =
      visibleHeight != null && visibleHeight > 0
        ? visibleHeight
        : view.bounds.height;
    var vw =
      visibleWidth != null && visibleWidth > 0
        ? visibleWidth
        : view.bounds.width;
    var minSide = Math.min(vw, vh);
    if (!minSide || minSide < 8) return 1;
    var maxRadius = minSide * 0.42;
    return Math.min(1, maxRadius / r);
  }

  function createShapeForPreset(preset, width, height, basePoint, taper, corner, fillColor) {
    var fc = fillColor != null ? fillColor : "#FEB36B";
    var path;
    if (preset === "vertical") {
      path = new Path.Rectangle({
        point: basePoint,
        size: [width, height],
        fillColor: fc,
      });
    } else if (preset === "horizontal") {
      path = new Path.Rectangle({
        point: basePoint,
        size: [height, width],
        fillColor: fc,
      });
    } else if (preset === "tapered") {
      path = new Path({
        segments: [
          [basePoint.x + taper, basePoint.y],
          [basePoint.x + width - taper, basePoint.y],
          [basePoint.x + width, basePoint.y + height],
          [basePoint.x, basePoint.y + height],
        ],
        fillColor: fc,
        closed: true,
      });
    } else if (preset === "topLeftDown") {
      path = new Path.Rectangle({
        point: basePoint,
        size: [width, height],
        fillColor: fc,
      });
      path.segments[1].point.y += corner;
    } else {
      path = new Path.Rectangle({
        point: basePoint,
        size: [width, height],
        fillColor: fc,
      });
    }
    return path;
  }

  /** Preload the foil texture so it's ready when gradient mode is used. */
  var foilImage = new Image();
  foilImage.src = "assets/images/HPA_Florette_Foil.jpg";
  var foilLoaded = false;
  foilImage.onload = function () {
    foilLoaded = true;
  };

  function removeItem(item) {
    if (item instanceof paper.Group) {
      var children = item.children.slice();
      for (var c = 0; c < children.length; c++) {
        removeItem(children[c]);
      }
    }
    item.remove();
  }

  function createRectangles() {
    for (var i = 0; i < rectangles.length; i++) {
      removeItem(rectangles[i]);
    }
    for (var i = 0; i < circles.length; i++) {
      circles[i].remove();
    }
    rectangles = [];
    circles = [];

    var visibleMetrics =
      window.RA &&
      window.RA.sheet &&
      typeof window.RA.sheet.getVisibleMetrics === "function"
        ? window.RA.sheet.getVisibleMetrics()
        : null;
    rotationCenter = visibleMetrics
      ? new Point(
          visibleMetrics.centerX != null
            ? visibleMetrics.centerX
            : view.bounds.width / 2,
          visibleMetrics.centerY != null
            ? visibleMetrics.centerY
            : view.center.y
        )
      : view.center;

    var fit = getViewportFitScale(
      shapePreset,
      rectWidth,
      rectHeight,
      distanceFromCenter,
      taperAmount,
      cornerOffset,
      corners,
      visibleMetrics ? visibleMetrics.visibleHeight : null,
      visibleMetrics ? visibleMetrics.visibleWidth : null
    );
    var width = rectWidth * fit;
    var height = rectHeight * fit;
    var dist = distanceFromCenter * fit;
    var taper = taperAmount * fit;
    var corner = cornerOffset * fit;
    var basePoint;

    if (shapePreset === "horizontal") {
      basePoint = new Point(
        rotationCenter.x - height / 2,
        rotationCenter.y - width - dist
      );
    } else {
      basePoint = new Point(
        rotationCenter.x - width / 2,
        rotationCenter.y - height - dist
      );
    }

    var petals = [];
    var solidFill = "#FEB36B";

    for (var i = 0; i < numberOfRectangles; i++) {
      var angle = (360 / numberOfRectangles) * i;
      var shape;

      if (corners) {
        shape = new Path({
          segments: corners.map(function (c) {
            return [
              rotationCenter.x + c[0] * fit,
              rotationCenter.y + c[1] * fit,
            ];
          }),
          fillColor: solidFill,
          closed: true,
        });
      } else {
        shape = createShapeForPreset(
          shapePreset,
          width,
          height,
          basePoint,
          taper,
          corner,
          solidFill
        );
      }

      shape.rotate(angle, rotationCenter);
      shape.selected = showAnchors;
      petals.push(shape);
    }

    if (petals.length > 0) {
      try {
        // Use CompoundPath instead of unite() to avoid boolean-operation
        // artifacts (tiny nubs at corners visible on some GPUs).
        var compound = new paper.CompoundPath({
          fillRule: "nonzero",
          fillColor: "#FEB36B",
        });
        for (var p = 0; p < petals.length; p++) {
          compound.addChild(petals[p]);
        }

        var outerR = estimateOuterRadius(
          shapePreset, rectWidth, rectHeight, distanceFromCenter,
          taperAmount, cornerOffset, corners
        ) * fit;
        var diameter = outerR * 2.5;

        var foilRaster = new paper.Raster(foilImage);
        foilRaster.position = rotationCenter;
        var imgScale = Math.max(
          diameter / (foilRaster.width || 1),
          diameter / (foilRaster.height || 1)
        );
        foilRaster.scale(imgScale);

        compound.clipMask = true;
        var masked = new paper.Group([compound, foilRaster]);
        masked.clipped = true;
        rectangles.push(masked);
      } catch (err) {
        for (var k = 0; k < petals.length; k++) {
          petals[k].fillColor = "#FEB36B";
          rectangles.push(petals[k]);
        }
      }
    }

    var centerMarker = new Path.Circle({
      center: rotationCenter,
      radius: 4,
      fillColor: "red",
    });
    centerMarker.visible = showAnchors;
    circles.push(centerMarker);
  }

  function applyRotation() {
    for (var i = 0; i < rectangles.length; i++) {
      rectangles[i].rotate(cumulativeRotation, rotationCenter);
    }
  }

  createRectangles();

  view.onResize = function () {
    createRectangles();
    applyRotation();
  };

  view.onFrame = function () {
    if (!isRotating) return;
    cumulativeRotation += 0.025;
    for (var i = 0; i < rectangles.length; i++) {
      rectangles[i].rotate(0.025, rotationCenter);
    }
  };

  window.addEventListener("updateRays", function (event) {
    rectWidth = Math.min(130, Math.max(10, Number(event.detail.rectWidth) || 25));
    rectHeight = Math.min(
      345,
      Math.max(10, Number(event.detail.rectHeight) || 200)
    );
    var nRect = Math.round(Number(event.detail.numberOfRectangles));
    if (isNaN(nRect)) nRect = 9;
    numberOfRectangles = Math.min(25, Math.max(5, nRect));
    var distRaw = Number(event.detail.distanceFromCenter);
    if (isNaN(distRaw)) distRaw = 60;
    distanceFromCenter = Math.min(150, Math.max(0, distRaw));
    rotationSpeed = event.detail.rotationSpeed;
    shapePreset = event.detail.shapePreset;
    var taperRaw = Number(event.detail.taperAmount);
    if (isNaN(taperRaw)) taperRaw = 7;
    var taperMax = Math.floor(rectWidth / 2);
    taperAmount = Math.min(Math.max(0, taperRaw), taperMax);
    var cornerRaw = Number(event.detail.cornerOffset);
    if (isNaN(cornerRaw)) cornerRaw = 10;
    var cornerMax = Math.max(0, rectHeight - 1);
    cornerOffset = Math.min(Math.max(0, cornerRaw), cornerMax);
    corners = event.detail.corners || null;
    createRectangles();
    applyRotation();
  });

  window.addEventListener("sheetLayout", function () {
    createRectangles();
    applyRotation();
  });

  window.addEventListener("playbackStarted", function () {
    isRotating = true;
    cumulativeRotation = 0;
  });

  window.addEventListener("playbackStopped", function () {
    isRotating = false;
    cumulativeRotation = 0;
  });

  // ── Export ──

  function drawFloretteToCtx(tCtx, sz, state, rot, bgColor) {
    tCtx.clearRect(0, 0, sz, sz);
    var corners = state.corners;
    var count = state.numberOfRectangles || 9;
    if (!corners && window.RA && window.RA.states) {
      corners = window.RA.states.getCornerOffsets(state);
    }
    if (!corners) return;

    var maxR = 0;
    for (var i = 0; i < corners.length; i++) {
      var r = Math.sqrt(corners[i][0] * corners[i][0] + corners[i][1] * corners[i][1]);
      if (r > maxR) maxR = r;
    }
    var scale = maxR > 0 ? (sz * 0.42) / maxR : 1;

    tCtx.save();
    tCtx.translate(sz / 2, sz / 2);
    tCtx.rotate(rot);
    for (var i = 0; i < count; i++) {
      var angle = ((Math.PI * 2) / count) * i;
      tCtx.save();
      tCtx.rotate(angle);
      tCtx.beginPath();
      tCtx.moveTo(corners[0][0] * scale, corners[0][1] * scale);
      for (var j = 1; j < corners.length; j++) {
        tCtx.lineTo(corners[j][0] * scale, corners[j][1] * scale);
      }
      tCtx.closePath();
      tCtx.fillStyle = "#FEB36B";
      tCtx.fill();
      tCtx.restore();
    }
    if (foilLoaded) {
      tCtx.globalCompositeOperation = "source-in";
      tCtx.drawImage(foilImage, -sz / 2, -sz / 2, sz, sz);
      tCtx.globalCompositeOperation = "source-over";
    }
    tCtx.restore();

    // Fill background behind the florette (skip for transparent export)
    if (!isBgTransparent(bgColor)) {
      tCtx.globalCompositeOperation = "destination-over";
      tCtx.fillStyle = bgColor || "#ffffff";
      tCtx.fillRect(0, 0, sz, sz);
      tCtx.globalCompositeOperation = "source-over";
    }
  }

  function isBgTransparent(bg) {
    if (!bg) return false;
    var v = bg.trim().toLowerCase();
    return v === "transparent" || v === "rgba(0, 0, 0, 0)";
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportStatic(format, multiplier) {
    var baseSz = 512;
    var sz = baseSz * multiplier;
    var c = document.createElement("canvas");
    c.width = sz;
    c.height = sz;
    var ctx = c.getContext("2d");
    var snap = window.RA.controls.snapshot();
    var bg = document.body.style.backgroundColor || "#170901";

    if (format === "jpg") {
      drawFloretteToCtx(ctx, sz, snap, 0, isBgTransparent(bg) ? "#ffffff" : bg);
      c.toBlob(function (blob) {
        downloadBlob(blob, "florette-" + sz + "x" + sz + ".jpg");
      }, "image/jpeg", 0.95);
    } else {
      drawFloretteToCtx(ctx, sz, snap, 0, bg);
      c.toBlob(function (blob) {
        downloadBlob(blob, "florette-" + sz + "x" + sz + ".png");
      }, "image/png");
    }
  }

  var exportToast = null;

  function showExportToast(msg) {
    if (!exportToast) {
      exportToast = document.createElement("div");
      exportToast.className = "state-toast";
      exportToast.setAttribute("role", "status");
      exportToast.setAttribute("aria-live", "polite");
      document.body.appendChild(exportToast);
    }
    exportToast.textContent = msg;
    exportToast.classList.add("state-toast--visible");
  }

  function hideExportToast() {
    if (exportToast) exportToast.classList.remove("state-toast--visible");
  }

  function exportGif(totalFrames) {
    var statesArr = window.RA.states.getStates();
    if (statesArr.length < 2) {
      statesArr = [window.RA.controls.snapshot()];
    }

    showExportToast("Generating GIF...");

    var bg = document.body.style.backgroundColor || "#170901";
    var fillBg = isBgTransparent(bg) ? "transparent" : bg;
    var gifSize = 400;
    var gifCanvas = document.createElement("canvas");
    gifCanvas.width = gifSize;
    gifCanvas.height = gifSize;
    var gifCtx = gifCanvas.getContext("2d", { willReadFrequently: true });

    setTimeout(function () {
      var encoder = new MiniGIF.Encoder(gifSize, gifSize);

      if (statesArr.length >= 2) {
        // Match live playback timing exactly
        var segDurationMs = window.RA.states.TRANSITION_DURATION_MS;
        var totalSegments = statesArr.length;
        var totalDurationMs = segDurationMs * totalSegments;
        // fps derived from frame count and total duration
        var frameDelayMs = totalDurationMs / totalFrames;
        // Live canvas rotates 0.025 deg per frame at ~60fps = 1.5 deg/sec
        // Convert to radians per ms, then per gif frame
        var degPerSec = 0.025 * 60;
        var radPerMs = (degPerSec * Math.PI) / (180 * 1000);

        for (var f = 0; f < totalFrames; f++) {
          var timeMs = f * frameDelayMs;
          var segFloat = timeMs / segDurationMs;
          var seg = Math.floor(segFloat) % totalSegments;
          var localT = segFloat - Math.floor(segFloat);
          var sA = statesArr[seg];
          var sB = statesArr[(seg + 1) % totalSegments];
          var state = window.RA.states.interpolateStates(sA, sB, localT);
          var rot = radPerMs * timeMs;
          drawFloretteToCtx(gifCtx, gifSize, state, rot, fillBg);
          encoder.addFrame(gifCtx, Math.round(frameDelayMs));
        }
      } else {
        drawFloretteToCtx(gifCtx, gifSize, statesArr[0], 0, fillBg);
        encoder.addFrame(gifCtx, 100);
      }

      showExportToast("Encoding...");

      setTimeout(function () {
        var gifBlob = encoder.render();
        downloadBlob(gifBlob, "florette-" + totalFrames + "f.gif");
        showExportToast("GIF exported!");
        setTimeout(hideExportToast, 1500);
      }, 50);
    }, 50);
  }

  window.addEventListener("exportFlorette", function (event) {
    var val = event.detail.format;
    if (val.indexOf("gif") === 0) {
      var gifParts = val.split("-");
      var frames = gifParts[1] ? parseInt(gifParts[1], 10) : 60;
      exportGif(frames);
    } else {
      var parts = val.split("-");
      var fmt = parts[0];
      var multiplier = parseInt(parts[1], 10) || 1;
      exportStatic(fmt, multiplier);
    }
  });
})();

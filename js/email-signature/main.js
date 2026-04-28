window.RA = window.RA || {};

window.RA.emailSignature = (function () {
  var preview = document.createElement("div");
  preview.className = "sig-preview";
  preview.innerHTML = [
    '<div class="sig-preview__card">',
    '  <img class="sig-preview__logo" src="assets/images/HPA_Logo_Mar.svg" alt="Hariri Pontarini Architects">',
    '  <div class="sig-preview__florette">',
    '    <canvas class="sig-preview__florette-canvas" id="sigFloretteCanvas" width="120" height="120"></canvas>',
    "  </div>",
    '  <p class="sig-preview__address">235 CARLAW AV., <em>Suite 301,</em> TORONTO, CANADA M4M 2S1</p>',
    '  <p class="sig-preview__url">www.hariripontarini.com</p>',
    "</div>",
    '<div class="sig-preview__export">',
    '  <button type="button" class="sig-export-btn" id="sigGenerateBtn">Generate Signature</button>',
    "</div>",
    '<div class="sig-preview__progress" id="sigProgress" style="display:none;">',
    '  <div class="sig-progress-bar"><div class="sig-progress-fill" id="sigProgressFill"></div></div>',
    '  <span class="sig-progress-text" id="sigProgressText">Generating...</span>',
    "</div>",
    '<div class="sig-export-result" id="sigResult" style="display:none;">',
    '  <div class="sig-result__actions">',
    '    <button type="button" class="sig-export-btn" id="sigCopySignature">Copy Signature</button>',
    '    <button type="button" class="sig-export-btn" id="sigOpenSignature">Open Signature</button>',
    '    <button type="button" class="sig-export-btn" id="sigDownloadGif">Download GIF</button>',
    "  </div>",
    '  <div class="sig-result__preview" id="sigResultPreview"></div>',
    "</div>",
  ].join("\n");
  document.body.appendChild(preview);

  // ── Florette canvas ──

  var canvas = document.getElementById("sigFloretteCanvas");
  var ctx = canvas.getContext("2d");
  var SIZE = 120;
  var cx = SIZE / 2;
  var cy = SIZE / 2;

  var foilImage = new Image();
  foilImage.src = "assets/images/HPA_Florette_Foil.jpg";
  var foilLoaded = false;
  foilImage.onload = function () {
    foilLoaded = true;
  };

  var animActive = false;
  var animRafId = null;
  var segmentIndex = 0;
  var segmentStart = 0;
  var cumulativeRotation = 0;

  function drawState(state) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    var corners = state.corners;
    var count = state.numberOfRectangles || 9;
    if (!corners) corners = window.RA.states.getCornerOffsets(state);

    var maxR = 0;
    for (var i = 0; i < corners.length; i++) {
      var r = Math.sqrt(
        corners[i][0] * corners[i][0] + corners[i][1] * corners[i][1],
      );
      if (r > maxR) maxR = r;
    }
    var scale = maxR > 0 ? (SIZE * 0.42) / maxR : 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(cumulativeRotation);
    for (var i = 0; i < count; i++) {
      var angle = ((Math.PI * 2) / count) * i;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(corners[0][0] * scale, corners[0][1] * scale);
      for (var j = 1; j < corners.length; j++) {
        ctx.lineTo(corners[j][0] * scale, corners[j][1] * scale);
      }
      ctx.closePath();
      ctx.fillStyle = "#FEB36B";
      ctx.fill();
      ctx.restore();
    }
    if (foilLoaded) {
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(foilImage, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
  }

  function drawStateToCtx(tCtx, sz, state, rot) {
    tCtx.clearRect(0, 0, sz, sz);
    var corners = state.corners;
    var count = state.numberOfRectangles || 9;
    if (!corners) corners = window.RA.states.getCornerOffsets(state);

    var maxR = 0;
    for (var i = 0; i < corners.length; i++) {
      var r = Math.sqrt(
        corners[i][0] * corners[i][0] + corners[i][1] * corners[i][1],
      );
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
  }

  function drawDefault() {
    drawState({
      rectWidth: 25,
      rectHeight: 200,
      numberOfRectangles: 9,
      distanceFromCenter: 60,
      shapePreset: "vertical",
      taperAmount: 7,
      cornerOffset: 10,
    });
  }

  var currentStaticState = null;

  function animFrame(timestamp) {
    if (!animActive) return;
    var statesArr = window.RA.states.getStates();
    cumulativeRotation += (0.025 * Math.PI) / 180;

    if (statesArr.length >= 2) {
      if (segmentStart === 0) segmentStart = timestamp;
      var duration = window.RA.states.TRANSITION_DURATION_MS;
      var t = Math.min((timestamp - segmentStart) / duration, 1);
      var stateA = statesArr[segmentIndex];
      var stateB = statesArr[(segmentIndex + 1) % statesArr.length];
      drawState(window.RA.states.interpolateStates(stateA, stateB, t));
      if (t >= 1) {
        segmentIndex = (segmentIndex + 1) % statesArr.length;
        segmentStart = timestamp;
      }
    } else if (statesArr.length === 1) {
      drawState(statesArr[0]);
    } else if (currentStaticState) {
      drawState(currentStaticState);
    } else {
      drawDefault();
    }
    animRafId = requestAnimationFrame(animFrame);
  }

  function startAnimation() {
    if (animActive) return;
    animActive = true;
    segmentIndex = 0;
    segmentStart = 0;
    cumulativeRotation = 0;
    animRafId = requestAnimationFrame(animFrame);
  }

  function stopAnimation() {
    animActive = false;
    if (animRafId) {
      cancelAnimationFrame(animRafId);
      animRafId = null;
    }
  }

  window.addEventListener("sigVisible", function () {
    startAnimation();
  });
  window.addEventListener("sigHidden", function () {
    stopAnimation();
  });

  window.addEventListener("updateRays", function (event) {
    var d = event.detail;
    currentStaticState = {
      rectWidth: d.rectWidth != null ? Number(d.rectWidth) : 25,
      rectHeight: d.rectHeight != null ? Number(d.rectHeight) : 200,
      numberOfRectangles:
        d.numberOfRectangles != null ? Number(d.numberOfRectangles) : 9,
      distanceFromCenter:
        d.distanceFromCenter != null ? Number(d.distanceFromCenter) : 60,
      shapePreset: d.shapePreset || "vertical",
      taperAmount: d.taperAmount != null ? Number(d.taperAmount) : 7,
      cornerOffset: d.cornerOffset != null ? Number(d.cornerOffset) : 10,
      corners: d.corners || null,
    };
  });

  // ── Render logo SVG to PNG data URI ──

  function renderLogoToJpeg(callback) {
    var img = new Image();
    img.onload = function () {
      var w = 1200;
      var h = Math.round(w * (img.naturalHeight / img.naturalWidth));
      var c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      var lx = c.getContext("2d");
      lx.fillStyle = "#ffffff";
      lx.fillRect(0, 0, w, h);
      lx.drawImage(img, 0, 0, w, h);
      callback(c.toDataURL("image/jpeg", 0.95));
    };
    img.src = "assets/images/HPA_Logo_Mar.svg";
  }

  // ── Render address text in Bradford to PNG data URI ──

  function renderAddressToPng() {
    var scale = 3; // 3x for retina sharpness
    var fontSize = 14 * scale;
    var lineHeight = fontSize * 1.6;
    var cw = 500 * scale;
    var ch = Math.ceil(lineHeight * 2 + 4 * scale);

    var c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    var ax = c.getContext("2d");

    // Line 1: "235 CARLAW AV., " + italic "Suite 301, " + "TORONTO, CANADA M4M 2S1"
    ax.fillStyle = "#3B2314";
    ax.textBaseline = "top";

    var y = 0;
    var x = 0;

    ax.font = fontSize + "px Bradford, Georgia, serif";
    var part1 = "235 CARLAW AV., ";
    ax.fillText(part1, x, y);
    x += ax.measureText(part1).width;

    ax.font = "italic " + fontSize + "px Bradford, Georgia, serif";
    var part2 = "Suite 301, ";
    ax.fillText(part2, x, y);
    x += ax.measureText(part2).width;

    ax.font = fontSize + "px Bradford, Georgia, serif";
    var part3 = "TORONTO, CANADA M4M 2S1";
    ax.fillText(part3, x, y);

    // Line 2: www.hariripontarini.com
    ax.font = fontSize + "px Bradford, Georgia, serif";
    ax.fillText("www.hariripontarini.com", 0, lineHeight);

    // Fill white background for JPEG (no transparency)
    var out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    var ox = out.getContext("2d");
    ox.fillStyle = "#ffffff";
    ox.fillRect(0, 0, cw, ch);
    ox.drawImage(c, 0, 0);
    return out.toDataURL("image/jpeg", 0.95);
  }

  // ── Export ──

  var generateBtn = document.getElementById("sigGenerateBtn");
  var progressEl = document.getElementById("sigProgress");
  var progressFill = document.getElementById("sigProgressFill");
  var progressText = document.getElementById("sigProgressText");
  var resultEl = document.getElementById("sigResult");
  var resultPreview = document.getElementById("sigResultPreview");
  var copySigBtn = document.getElementById("sigCopySignature");
  var openSigBtn = document.getElementById("sigOpenSignature");
  var downloadGifBtn = document.getElementById("sigDownloadGif");

  var lastGifBlobUrl = null;
  var lastSignaturePageHtml = "";

  generateBtn.addEventListener("click", function () {
    var statesArr = window.RA.states.getStates();
    if (statesArr.length < 1) {
      statesArr = [window.RA.controls.snapshot()];
    }

    generateBtn.disabled = true;
    progressEl.style.display = "";
    progressFill.style.width = "0%";
    progressText.textContent = "Generating frames...";
    resultEl.style.display = "none";

    var gifSize = 240;
    var gifCanvas = document.createElement("canvas");
    gifCanvas.width = gifSize;
    gifCanvas.height = gifSize;
    var gifCtx = gifCanvas.getContext("2d", { willReadFrequently: true });

    var encoder = new MiniGIF.Encoder(gifSize, gifSize);

    if (statesArr.length >= 2) {
      var fps = 8;
      var segDurationMs = 3000;
      var totalSegments = statesArr.length;
      var framesPerSeg = Math.round((segDurationMs / 1000) * fps);
      var totalFrames = framesPerSeg * totalSegments;
      if (totalFrames > 20) {
        framesPerSeg = Math.max(3, Math.floor(20 / totalSegments));
        totalFrames = framesPerSeg * totalSegments;
      }
      var frameDelay = segDurationMs / framesPerSeg;
      var rotPerFrame = (0.025 * Math.PI) / 180;

      for (var f = 0; f < totalFrames; f++) {
        var seg = Math.floor(f / framesPerSeg) % totalSegments;
        var localT = (f % framesPerSeg) / framesPerSeg;
        var sA = statesArr[seg];
        var sB = statesArr[(seg + 1) % totalSegments];
        var state = window.RA.states.interpolateStates(sA, sB, localT);
        drawStateToCtx(gifCtx, gifSize, state, rotPerFrame * f);
        encoder.addFrame(gifCtx, Math.round(frameDelay));
      }
    } else {
      drawStateToCtx(gifCtx, gifSize, statesArr[0], 0);
      encoder.addFrame(gifCtx, 100);
    }

    progressText.textContent = "Encoding...";
    progressFill.style.width = "50%";

    setTimeout(function () {
      var gifBlob = encoder.render();

      if (lastGifBlobUrl) URL.revokeObjectURL(lastGifBlobUrl);
      lastGifBlobUrl = URL.createObjectURL(gifBlob);

      // Upload GIF to Vercel Blob
      progressText.textContent = "Uploading GIF...";
      progressFill.style.width = "60%";

      fetch("/api/upload-gif", {
        method: "POST",
        headers: { "Content-Type": "image/gif" },
        body: gifBlob,
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Upload failed");
          return res.json();
        })
        .then(function (data) {
          var gifUrl = data.url;

          // Render address text as PNG in Bradford
          var addressDataUri = renderAddressToPng();

          // Render logo SVG to PNG
          renderLogoToJpeg(function (logoDataUri) {
            // Build standalone HTML page — GIF uses hosted URL, rest are data URIs
            lastSignaturePageHtml = [
              "<!DOCTYPE html>",
              '<html><head><meta charset="UTF-8"><style>body{margin:40px;background:#fff;}</style></head>',
              "<body>",
              '<table cellpadding="0" cellspacing="0" border="0">',
              "  <tr>",
              '    <td style="padding-bottom: 12px;">',
              '      <img src="' +
                logoDataUri +
                '" width="475" alt="Hariri Pontarini Architects" style="display:block;height:auto;" />',
              "    </td>",
              "  </tr>",
              '  <tr><td style="line-height:0;font-size:0;height:20px;">&nbsp;</td></tr>',
              "  <tr>",
              '    <td style="padding-bottom: 8px;">',
              '      <img src="' +
                gifUrl +
                '" width="30" height="30" alt="" style="display:block;" />',
              "    </td>",
              "  </tr>",
              "  <tr>",
              "    <td>",
              '      <img src="' +
                addressDataUri +
                '" width="500" alt="235 Carlaw Av., Suite 301, Toronto, Canada M4M 2S1 — www.hariripontarini.com" style="display:block;height:auto;" />',
              "    </td>",
              "  </tr>",
              "</table>",
              "</body></html>",
            ].join("\n");

            // Show preview in the panel
            resultPreview.innerHTML = [
              '<table cellpadding="0" cellspacing="0" border="0">',
              '  <tr><td style="padding-bottom:12px;">',
              '    <img src="' +
                logoDataUri +
                '" width="360" style="display:block;height:auto;" />',
              "  </td></tr>",
              '  <tr><td style="line-height:0;font-size:0;height:20px;">&nbsp;</td></tr>',
              '  <tr><td style="padding-bottom:8px;">',
              '    <img src="' +
                gifUrl +
                '" width="30" height="30" style="display:block;" />',
              "  </td></tr>",
              "  <tr><td>",
              '    <img src="' +
                addressDataUri +
                '" width="350" style="display:block;height:auto;" />',
              "  </td></tr>",
              "</table>",
            ].join("");

            progressFill.style.width = "100%";
            progressText.textContent = "Done!";
            resultEl.style.display = "";
            generateBtn.disabled = false;
            setTimeout(function () {
              progressEl.style.display = "none";
            }, 1000);
          });
        })
        .catch(function (err) {
          progressText.textContent = "Upload failed — " + err.message;
          generateBtn.disabled = false;
        });
    }, 50);
  });

  // Copy signature HTML to clipboard
  copySigBtn.addEventListener("click", function () {
    if (!lastSignaturePageHtml) return;
    // Extract just the table from the full HTML page
    var match = lastSignaturePageHtml.match(/<table[\s\S]*<\/table>/i);
    var tableHtml = match ? match[0] : lastSignaturePageHtml;

    var clipBlob = new Blob([tableHtml], { type: "text/html" });
    var clipItem = new ClipboardItem({ "text/html": clipBlob });
    navigator.clipboard.write([clipItem]).then(function () {
      var orig = copySigBtn.textContent;
      copySigBtn.textContent = "Copied!";
      setTimeout(function () { copySigBtn.textContent = orig; }, 2000);
    });
  });

  // Open signature in new tab for copy-paste
  openSigBtn.addEventListener("click", function () {
    if (!lastSignaturePageHtml) return;
    var blob = new Blob([lastSignaturePageHtml], { type: "text/html" });
    var url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  });

  // Download GIF
  downloadGifBtn.addEventListener("click", function () {
    if (!lastGifBlobUrl) return;
    var a = document.createElement("a");
    a.href = lastGifBlobUrl;
    a.download = "hpa-florette.gif";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  function init() {}

  return { init: init };
})();

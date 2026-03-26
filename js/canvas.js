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
        var united = petals[0];
        for (var j = 1; j < petals.length; j++) {
          var prev = united;
          united = prev.unite(petals[j]);
          if (prev !== petals[0]) {
            prev.remove();
          }
        }
        for (var r = 0; r < petals.length; r++) {
          petals[r].remove();
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

        united.clipMask = true;
        var masked = new paper.Group([united, foilRaster]);
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

  createRectangles();

  view.onResize = function () {
    createRectangles();
  };

  view.onFrame = function () {
    if (rectangles.length === 1) {
      rectangles[0].rotate(rotationSpeed, rotationCenter);
      return;
    }
    for (var i = 0; i < rectangles.length; i++) {
      rectangles[i].rotate(rotationSpeed, rotationCenter);
    }
  };

  window.addEventListener("updateRectangles", function (event) {
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
  });

  window.addEventListener("sheetLayout", function () {
    createRectangles();
  });
})();

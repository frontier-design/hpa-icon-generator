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
  var rotationSpeed = 0.5;
  var shapePreset = "vertical";
  var taperAmount = 7;
  var cornerOffset = 10;
  var showAnchors = true;
  var corners = null;

  var rectangles = [];
  var circles = [];

  function createShapeForPreset(preset, width, height, basePoint) {
    var path;
    if (preset === "vertical") {
      path = new Path.Rectangle({
        point: basePoint,
        size: [width, height],
        fillColor: "#FEB36B",
      });
    } else if (preset === "horizontal") {
      path = new Path.Rectangle({
        point: basePoint,
        size: [height, width],
        fillColor: "#FEB36B",
      });
    } else if (preset === "tapered") {
      path = new Path({
        segments: [
          [basePoint.x + taperAmount, basePoint.y],
          [basePoint.x + width - taperAmount, basePoint.y],
          [basePoint.x + width, basePoint.y + height],
          [basePoint.x, basePoint.y + height],
        ],
        fillColor: "#FEB36B",
        closed: true,
      });
    } else if (preset === "topLeftDown") {
      path = new Path.Rectangle({
        point: basePoint,
        size: [width, height],
        fillColor: "#FEB36B",
      });
      path.segments[1].point.y += cornerOffset;
    } else {
      path = new Path.Rectangle({
        point: basePoint,
        size: [width, height],
        fillColor: "#FEB36B",
      });
    }
    return path;
  }

  function createRectangles() {
    for (var i = 0; i < rectangles.length; i++) {
      rectangles[i].remove();
    }
    for (var i = 0; i < circles.length; i++) {
      circles[i].remove();
    }
    rectangles = [];
    circles = [];

    var width = rectWidth;
    var height = rectHeight;
    var basePoint;

    if (shapePreset === "horizontal") {
      basePoint = new Point(
        rotationCenter.x - rectHeight / 2,
        rotationCenter.y - rectWidth - distanceFromCenter
      );
    } else {
      basePoint = new Point(
        rotationCenter.x - rectWidth / 2,
        rotationCenter.y - rectHeight - distanceFromCenter
      );
    }

    for (var i = 0; i < numberOfRectangles; i++) {
      var angle = (360 / numberOfRectangles) * i;
      var shape;

      if (corners) {
        shape = new Path({
          segments: corners.map(function (c) {
            return [rotationCenter.x + c[0], rotationCenter.y + c[1]];
          }),
          fillColor: "#FEB36B",
          closed: true,
        });
      } else {
        shape = createShapeForPreset(shapePreset, width, height, basePoint);
      }

      shape.rotate(angle, rotationCenter);
      shape.selected = showAnchors;
      rectangles.push(shape);
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

  view.onFrame = function () {
    for (var i = 0; i < rectangles.length; i++) {
      rectangles[i].rotate(rotationSpeed, rotationCenter);
    }
  };

  window.addEventListener("toggleAnchorVisibility", function () {
    showAnchors = !showAnchors;
    for (var i = 0; i < rectangles.length; i++) {
      rectangles[i].selected = showAnchors;
    }
    for (var i = 0; i < circles.length; i++) {
      circles[i].visible = showAnchors;
    }
  });

  window.addEventListener("updateRectangles", function (event) {
    rectWidth = event.detail.rectWidth;
    rectHeight = event.detail.rectHeight;
    numberOfRectangles = event.detail.numberOfRectangles;
    distanceFromCenter = event.detail.distanceFromCenter;
    rotationSpeed = event.detail.rotationSpeed;
    shapePreset = event.detail.shapePreset;
    taperAmount = event.detail.taperAmount;
    cornerOffset = event.detail.cornerOffset;
    corners = event.detail.corners || null;
    createRectangles();
  });
})();

/**
 * Minimal animated GIF encoder. No dependencies, no workers.
 * Builds an adaptive 255-color palette from frame data using median cut.
 */
var MiniGIF = (function () {
  function Encoder(width, height) {
    this.width = width;
    this.height = height;
    this.frames = [];
  }

  Encoder.prototype.addFrame = function (ctx, delay) {
    var imageData = ctx.getImageData(0, 0, this.width, this.height);
    this.frames.push({
      data: new Uint8Array(imageData.data),
      delay: delay || 100,
    });
  };

  Encoder.prototype.render = function () {
    var w = this.width;
    var h = this.height;
    var frames = this.frames;

    // Collect all opaque pixel colors from all frames for palette building
    var colors = [];
    for (var fi = 0; fi < frames.length; fi++) {
      var d = frames[fi].data;
      for (var p = 0; p < d.length; p += 4) {
        if (d[p + 3] >= 128) {
          colors.push([d[p], d[p + 1], d[p + 2]]);
        }
      }
    }

    // Subsample if too many pixels (keep it fast)
    if (colors.length > 50000) {
      var step = Math.ceil(colors.length / 50000);
      var sampled = [];
      for (var i = 0; i < colors.length; i += step) {
        sampled.push(colors[i]);
      }
      colors = sampled;
    }

    var palette = medianCut(colors, 255);
    // Pad to 255 entries, index 255 = transparent
    while (palette.length < 255) {
      palette.push([0, 0, 0]);
    }
    palette.push([0, 0, 0]); // index 255 = transparent

    // Build flat palette array and lookup cache
    var flatPal = new Uint8Array(256 * 3);
    for (var i = 0; i < 256; i++) {
      flatPal[i * 3] = palette[i][0];
      flatPal[i * 3 + 1] = palette[i][1];
      flatPal[i * 3 + 2] = palette[i][2];
    }

    var buf = [];

    // Header
    writeStr(buf, "GIF89a");
    writeU16(buf, w);
    writeU16(buf, h);
    buf.push(0xf7); // GCT, 8-bit, 256 colors
    buf.push(0);
    buf.push(0);

    // Global Color Table
    for (var i = 0; i < 768; i++) {
      buf.push(flatPal[i]);
    }

    // Netscape looping extension
    buf.push(0x21, 0xff, 0x0b);
    writeStr(buf, "NETSCAPE2.0");
    buf.push(0x03, 0x01);
    writeU16(buf, 0);
    buf.push(0x00);

    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      var indices = quantize(frame.data, palette, w * h);

      // Graphic Control Extension
      buf.push(0x21, 0xf9, 0x04);
      buf.push(0x09); // dispose to bg + transparency
      writeU16(buf, Math.round(frame.delay / 10));
      buf.push(255); // transparent index
      buf.push(0x00);

      // Image Descriptor
      buf.push(0x2c);
      writeU16(buf, 0);
      writeU16(buf, 0);
      writeU16(buf, w);
      writeU16(buf, h);
      buf.push(0x00);

      // LZW
      buf.push(8); // min code size
      var compressed = lzwEncode(indices, 8);
      var off = 0;
      while (off < compressed.length) {
        var chunk = Math.min(255, compressed.length - off);
        buf.push(chunk);
        for (var j = 0; j < chunk; j++) buf.push(compressed[off + j]);
        off += chunk;
      }
      buf.push(0x00);
    }

    buf.push(0x3b);
    return new Blob([new Uint8Array(buf)], { type: "image/gif" });
  };

  // ── Median cut palette generation ──

  function medianCut(colors, maxColors) {
    if (colors.length === 0) {
      var pal = [];
      for (var i = 0; i < maxColors; i++) pal.push([0, 0, 0]);
      return pal;
    }

    var buckets = [colors];

    while (buckets.length < maxColors) {
      // Find bucket with largest range
      var bestIdx = 0;
      var bestRange = -1;
      for (var b = 0; b < buckets.length; b++) {
        if (buckets[b].length < 2) continue;
        var range = bucketRange(buckets[b]);
        if (range.maxRange > bestRange) {
          bestRange = range.maxRange;
          bestIdx = b;
        }
      }
      if (bestRange <= 0) break;

      var bucket = buckets[bestIdx];
      var range = bucketRange(bucket);
      var channel = range.channel;

      bucket.sort(function (a, b) {
        return a[channel] - b[channel];
      });
      var mid = Math.floor(bucket.length / 2);
      buckets.splice(bestIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
    }

    // Average each bucket
    var result = [];
    for (var b = 0; b < buckets.length; b++) {
      var bk = buckets[b];
      if (bk.length === 0) {
        result.push([0, 0, 0]);
        continue;
      }
      var sr = 0,
        sg = 0,
        sb = 0;
      for (var i = 0; i < bk.length; i++) {
        sr += bk[i][0];
        sg += bk[i][1];
        sb += bk[i][2];
      }
      result.push([
        Math.round(sr / bk.length),
        Math.round(sg / bk.length),
        Math.round(sb / bk.length),
      ]);
    }
    return result;
  }

  function bucketRange(bucket) {
    var minR = 255,
      maxR = 0,
      minG = 255,
      maxG = 0,
      minB = 255,
      maxB = 0;
    for (var i = 0; i < bucket.length; i++) {
      var c = bucket[i];
      if (c[0] < minR) minR = c[0];
      if (c[0] > maxR) maxR = c[0];
      if (c[1] < minG) minG = c[1];
      if (c[1] > maxG) maxG = c[1];
      if (c[2] < minB) minB = c[2];
      if (c[2] > maxB) maxB = c[2];
    }
    var rr = maxR - minR,
      rg = maxG - minG,
      rb = maxB - minB;
    var ch = 0,
      mr = rr;
    if (rg > mr) {
      ch = 1;
      mr = rg;
    }
    if (rb > mr) {
      ch = 2;
      mr = rb;
    }
    return { channel: ch, maxRange: mr };
  }

  // ── Quantize pixels to nearest palette color ──

  function quantize(pixels, palette, n) {
    var indices = new Uint8Array(n);
    var cache = {};
    for (var i = 0; i < n; i++) {
      var off = i * 4;
      if (pixels[off + 3] < 128) {
        indices[i] = 255;
        continue;
      }
      var r = pixels[off],
        g = pixels[off + 1],
        b = pixels[off + 2];
      // Quantize to 5-bit for cache key
      var key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      if (cache[key] !== undefined) {
        indices[i] = cache[key];
        continue;
      }
      var bestDist = Infinity,
        bestIdx = 0;
      for (var p = 0; p < 255; p++) {
        var pr = palette[p][0],
          pg = palette[p][1],
          pb = palette[p][2];
        var dr = r - pr,
          dg = g - pg,
          db = b - pb;
        var dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = p;
        }
      }
      cache[key] = bestIdx;
      indices[i] = bestIdx;
    }
    return indices;
  }

  // ── LZW encoder ──

  function lzwEncode(indices, minCodeSize) {
    var clearCode = 1 << minCodeSize;
    var eoiCode = clearCode + 1;
    var codeSize = minCodeSize + 1;
    var nextCode = eoiCode + 1;
    var maxCode = 1 << codeSize;

    var table = {};

    var output = [];
    var bitBuf = 0,
      bitPos = 0;

    function writeBits(code, size) {
      bitBuf |= code << bitPos;
      bitPos += size;
      while (bitPos >= 8) {
        output.push(bitBuf & 0xff);
        bitBuf >>= 8;
        bitPos -= 8;
      }
    }

    writeBits(clearCode, codeSize);
    if (indices.length === 0) {
      writeBits(eoiCode, codeSize);
      if (bitPos > 0) output.push(bitBuf & 0xff);
      return output;
    }

    var current = indices[0];
    for (var i = 1; i < indices.length; i++) {
      var px = indices[i];
      var combined = (current << 8) | px;
      if (table[combined] !== undefined) {
        current = table[combined];
      } else {
        writeBits(current, codeSize);
        if (nextCode < 4096) {
          table[combined] = nextCode++;
          if (nextCode > maxCode && codeSize < 12) {
            codeSize++;
            maxCode = 1 << codeSize;
          }
        } else {
          writeBits(clearCode, codeSize);
          codeSize = minCodeSize + 1;
          nextCode = eoiCode + 1;
          maxCode = 1 << codeSize;
          table = {};
        }
        current = px;
      }
    }

    writeBits(current, codeSize);
    writeBits(eoiCode, codeSize);
    if (bitPos > 0) output.push(bitBuf & 0xff);
    return output;
  }

  function writeU16(buf, val) {
    buf.push(val & 0xff, (val >> 8) & 0xff);
  }

  function writeStr(buf, str) {
    for (var i = 0; i < str.length; i++) buf.push(str.charCodeAt(i));
  }

  return { Encoder: Encoder };
})();

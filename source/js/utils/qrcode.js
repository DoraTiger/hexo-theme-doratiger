// QR 码生成器（纯 ES6 实现）
// 参考 ISO/IEC 18004 标准 + qrcode-generator 库

const QRCode = (() => {
  // === GF(2^8) 有限域 ===
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  (() => {
    let x = 1;
    for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x = (x << 1) ^ ((x >>> 7) * 0x11d); }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  const gfMul = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;

  // === Reed-Solomon ===
  const rsGenPoly = (nsym) => {
    let g = [1];
    for (let i = 0; i < nsym; i++) {
      const gNew = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) { gNew[j] ^= g[j]; gNew[j + 1] ^= gfMul(g[j], EXP[i]); }
      g = gNew;
    }
    return g;
  };
  const rsEncode = (data, nsym) => {
    const gen = rsGenPoly(nsym);
    const enc = new Uint8Array(data.length + nsym);
    enc.set(data);
    for (let i = 0; i < data.length; i++) {
      const c = enc[i];
      if (c) for (let j = 0; j < gen.length; j++) enc[i + j] ^= gfMul(gen[j], c);
    }
    return enc.slice(data.length);
  };

  // === BCH 编码 ===
  const BCH_G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | 1;
  const BCH_G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | 1;
  const BCH_G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

  const bchDigit = (d) => { let n = 0; while (d) { n++; d >>>= 1; } return n; };

  const bchTypeInfo = (data) => {
    let d = data << 10;
    while (bchDigit(d) - bchDigit(BCH_G15) >= 0) d ^= BCH_G15 << (bchDigit(d) - bchDigit(BCH_G15));
    return ((data << 10) | d) ^ BCH_G15_MASK;
  };

  const bchTypeNumber = (data) => {
    let d = data << 12;
    while (bchDigit(d) - bchDigit(BCH_G18) >= 0) d ^= BCH_G18 << (bchDigit(d) - bchDigit(BCH_G18));
    return (data << 12) | d;
  };

  // === 掩码函数 ===
  const MASK_FUNCS = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];

  // === 版本信息 ===
  const ECL_INDEX = { L: 1, M: 0, Q: 3, H: 2 };
  const VERSIONS = {
    1: { capacity: { L: 17, M: 14, Q: 11, H: 7 }, align: [] },
    2: { capacity: { L: 32, M: 26, Q: 20, H: 14 }, align: [6, 18] },
    3: { capacity: { L: 53, M: 42, Q: 32, H: 24 }, align: [6, 22] },
    4: { capacity: { L: 78, M: 62, Q: 46, H: 34 }, align: [6, 26] },
    5: { capacity: { L: 106, M: 84, Q: 60, H: 44 }, align: [6, 30] },
    6: { capacity: { L: 134, M: 106, Q: 74, H: 58 }, align: [6, 34] },
    7: { capacity: { L: 154, M: 122, Q: 86, H: 64 }, align: [6, 22, 38] },
    8: { capacity: { L: 192, M: 152, Q: 108, H: 84 }, align: [6, 24, 42] },
    9: { capacity: { L: 230, M: 180, Q: 130, H: 98 }, align: [6, 26, 46] },
    10: { capacity: { L: 271, M: 213, Q: 151, H: 119 }, align: [6, 28, 50] },
  };

  // [count, totalCount, dataCount, ...]
  const RS_BLOCKS = {
    1: { L: [1, 26, 19], M: [1, 26, 16], Q: [1, 26, 13], H: [1, 26, 9] },
    2: { L: [1, 44, 34], M: [1, 44, 28], Q: [1, 44, 22], H: [1, 44, 16] },
    3: { L: [1, 70, 55], M: [1, 70, 44], Q: [2, 35, 17], H: [2, 35, 13] },
    4: { L: [1, 100, 80], M: [2, 50, 32], Q: [2, 50, 24], H: [4, 25, 9] },
    5: { L: [1, 134, 108], M: [2, 67, 43], Q: [2, 33, 15, 2, 34, 16], H: [2, 33, 11, 2, 34, 12] },
    6: { L: [2, 86, 68], M: [4, 43, 27], Q: [4, 43, 19], H: [4, 43, 15] },
    7: { L: [2, 98, 78], M: [4, 49, 31], Q: [2, 32, 14, 4, 33, 15], H: [4, 39, 13, 1, 40, 14] },
    8: { L: [2, 121, 97], M: [2, 60, 38, 2, 61, 39], Q: [4, 40, 18, 2, 41, 19], H: [4, 40, 14, 2, 41, 15] },
    9: { L: [2, 146, 116], M: [3, 58, 36, 2, 59, 37], Q: [4, 36, 16, 4, 37, 17], H: [4, 36, 12, 4, 37, 13] },
    10: { L: [2, 86, 68, 2, 87, 69], M: [4, 69, 43, 1, 70, 44], Q: [6, 43, 19, 2, 44, 20], H: [6, 43, 15, 2, 44, 16] },
  };

  const getSize = (v) => v * 4 + 17;
  const getAlignPos = (v) => VERSIONS[v].align;

  const getRSBlocks = (version, ecl) => {
    const spec = RS_BLOCKS[version][ecl];
    const blocks = [];
    for (let i = 0; i < spec.length; i += 3) {
      const count = spec[i];
      const totalCount = spec[i + 1];
      const dataCount = spec[i + 2];
      for (let c = 0; c < count; c++) blocks.push({ totalCount, dataCount });
    }
    return blocks;
  };

  // === 数据编码 ===
  const encodeData = (text, version, ecl) => {
    const bytes = new TextEncoder().encode(text);
    const ccBits = version < 10 ? 8 : 16;
    const rsBlocks = getRSBlocks(version, ecl);
    const totalDataCount = rsBlocks.reduce((sum, b) => sum + b.dataCount, 0);

    let bits = "0100"; // Byte mode
    bits += bytes.length.toString(2).padStart(ccBits, "0");
    for (const b of bytes) bits += b.toString(2).padStart(8, "0");

    const totalBits = totalDataCount * 8;
    if (bits.length > totalBits) {
      throw new Error("QR content too long for supported versions/ecl");
    }

    // terminator
    bits += "0000";
    if (bits.length > totalBits) bits = bits.slice(0, totalBits);

    // align to byte
    while (bits.length % 8 !== 0) bits += "0";

    // 转为字节
    const dataBytes = [];
    for (let i = 0; i < bits.length; i += 8) dataBytes.push(parseInt(bits.substring(i, i + 8), 2));

    // pad bytes
    const PAD_BYTES = [0xec, 0x11];
    let padIdx = 0;
    while (dataBytes.length < totalDataCount) {
      dataBytes.push(PAD_BYTES[padIdx % 2]);
      padIdx++;
    }

    // block split + RS + interleave
    const dcData = [];
    const ecData = [];
    let offset = 0;
    let maxDc = 0;
    let maxEc = 0;

    for (const block of rsBlocks) {
      const dc = dataBytes.slice(offset, offset + block.dataCount);
      offset += block.dataCount;
      const ec = Array.from(rsEncode(new Uint8Array(dc), block.totalCount - block.dataCount));
      dcData.push(dc);
      ecData.push(ec);
      maxDc = Math.max(maxDc, dc.length);
      maxEc = Math.max(maxEc, ec.length);
    }

    const all = [];
    for (let i = 0; i < maxDc; i++) {
      for (const dc of dcData) if (i < dc.length) all.push(dc[i]);
    }
    for (let i = 0; i < maxEc; i++) {
      for (const ec of ecData) if (i < ec.length) all.push(ec[i]);
    }

    return all;
  };

  // === 选择版本 ===
  const selectVersion = (text, ecl) => {
    const len = new TextEncoder().encode(text).length;
    for (let v = 1; v <= 10; v++) {
      if (VERSIONS[v].capacity[ecl] >= len) return v;
    }
    return 10;
  };

  // === 生成 QR 码 ===
  const generate = (text, options = {}) => {
    const ecl = options.ecl || "M";
    const version = selectVersion(text, ecl);
    const size = getSize(version);
    const alignPos = getAlignPos(version);
    const allBytes = encodeData(text, version, ecl);

    const makeMatrix = (maskIdx) => {
      const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
      const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
      const maskFunc = MASK_FUNCS[maskIdx];

      // 放置查找图案
      const placeFinder = (r, c) => {
        const p = [[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]];
        for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { matrix[r+i][c+j] = p[i][j]; reserved[r+i][c+j] = true; }
        for (let i = -1; i <= 7; i++) {
          if (r+i>=0&&r+i<size) { if(c-1>=0){matrix[r+i][c-1]=0;reserved[r+i][c-1]=true;} if(c+7<size){matrix[r+i][c+7]=0;reserved[r+i][c+7]=true;} }
          if (c+i>=0&&c+i<size) { if(r-1>=0){matrix[r-1][c+i]=0;reserved[r-1][c+i]=true;} if(r+7<size){matrix[r+7][c+i]=0;reserved[r+7][c+i]=true;} }
        }
      };
      placeFinder(0, 0); placeFinder(0, size-7); placeFinder(size-7, 0);

      // 对齐图案
      for (const ar of alignPos) for (const ac of alignPos) {
        if (reserved[ar][ac]) continue;
        const ap = [[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]];
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { matrix[ar+i][ac+j]=ap[i+2][j+2]; reserved[ar+i][ac+j]=true; }
      }

      // 时间图案
      for (let i = 8; i < size-8; i++) { matrix[6][i]=i%2===0?1:0; matrix[i][6]=i%2===0?1:0; reserved[6][i]=true; reserved[i][6]=true; }

      // 暗模块
      matrix[size-8][8] = 1; reserved[size-8][8] = true;

      // 格式信息（BCH 编码）
      const formatData = (ECL_INDEX[ecl] << 3) | maskIdx;
      const formatBits = bchTypeInfo(formatData);

      for (let i = 0; i < 15; i++) {
        const bit = ((formatBits >> i) & 1) === 1;
        if (i < 6) { matrix[i][8] = bit; reserved[i][8] = true; }
        else if (i < 8) { matrix[i+1][8] = bit; reserved[i+1][8] = true; }
        else { matrix[size-15+i][8] = bit; reserved[size-15+i][8] = true; }

        if (i < 8) { matrix[8][size-i-1] = bit; reserved[8][size-i-1] = true; }
        else if (i < 9) { matrix[8][15-i] = bit; reserved[8][15-i] = true; }
        else { matrix[8][15-i-1] = bit; reserved[8][15-i-1] = true; }
      }

      // 版本信息（version >= 7）
      if (version >= 7) {
        const versionBits = bchTypeNumber(version);
        for (let i = 0; i < 18; i++) {
          const bit = ((versionBits >> i) & 1) === 1;
          const r = Math.floor(i / 3);
          const c = i % 3;
          matrix[r][size - 11 + c] = bit;
          reserved[r][size - 11 + c] = true;
          matrix[size - 11 + c][r] = bit;
          reserved[size - 11 + c][r] = true;
        }
      }

      // 填充数据（蛇形 + 掩码）
      let byteIdx = 0, bitIdx = 7, col = size-1, upward = true;
      while (col > 0) {
        if (col === 6) col = 5;
        for (let row = upward ? size-1 : 0; upward ? row >= 0 : row < size; upward ? row-- : row++) {
          for (let c = 0; c < 2; c++) {
            const cc = col - c;
            if (!reserved[row][cc]) {
              let dark = false;
              if (byteIdx < allBytes.length) {
                dark = ((allBytes[byteIdx] >> bitIdx) & 1) === 1;
                bitIdx--;
                if (bitIdx < 0) { bitIdx = 7; byteIdx++; }
              }
              if (maskFunc(row, cc)) dark = !dark;
              matrix[row][cc] = dark;
            }
          }
        }
        upward = !upward; col -= 2;
      }

      return matrix;
    };

    // 选择最佳掩码
    let bestMask = 0, bestScore = Infinity;
    for (let m = 0; m < 8; m++) {
      const mat = makeMatrix(m);
      // 简单评分：相邻同色模块越少越好
      let score = 0;
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (c > 0 && mat[r][c] === mat[r][c-1]) score++;
        if (r > 0 && mat[r][c] === mat[r-1][c]) score++;
      }
      if (score < bestScore) { bestScore = score; bestMask = m; }
    }

    return { matrix: makeMatrix(bestMask), size, version };
  };

  // === 渲染 ===
  return {
    generate,
    toDataURL(text, options = {}) {
      const qr = generate(text, options);
      const s = options.size || 200;
      const dark = options.dark || "#1a1a2e";
      const light = options.light || "#ffffff";
      const margin = options.margin || 4;
      const ms = s / (qr.size + margin * 2);

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">`;
      svg += `<rect width="${s}" height="${s}" fill="${light}"/>`;
      for (let r = 0; r < qr.size; r++)
        for (let c = 0; c < qr.size; c++)
          if (qr.matrix[r][c])
            svg += `<rect x="${(c+margin)*ms}" y="${(r+margin)*ms}" width="${ms}" height="${ms}" fill="${dark}"/>`;
      svg += "</svg>";
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    }
  };
})();

export default QRCode;

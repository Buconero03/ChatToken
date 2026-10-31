const lookup = [];
const revLookup = [];
const Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;

const code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (let i = 0; i < code.length; i += 1) {
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
}

revLookup["-".charCodeAt(0)] = 62;
revLookup["_".charCodeAt(0)] = 63;

function getLens(b64) {
  const len = b64.length;

  if (len % 4 > 0) {
    throw new Error("Invalid string. Length must be a multiple of 4");
  }

  let validLen = b64.indexOf("=");
  if (validLen === -1) {
    validLen = len;
  }

  const placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4);
  return [validLen, placeHoldersLen];
}

function byteLength(b64) {
  const [validLen, placeHoldersLen] = getLens(b64);
  return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
}

function toByteArray(b64) {
  let tmp;
  const [validLen, placeHoldersLen] = getLens(b64);
  const arr = new Arr(byteLength(b64));

  let curByte = 0;
  const len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  let i = 0;

  for (; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)];
    arr[curByte] = (tmp >> 16) & 0xff;
    curByte += 1;
    arr[curByte] = (tmp >> 8) & 0xff;
    curByte += 1;
    arr[curByte] = tmp & 0xff;
    curByte += 1;
  }

  if (placeHoldersLen === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
    arr[curByte] = tmp & 0xff;
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2);
    arr[curByte] = (tmp >> 8) & 0xff;
    curByte += 1;
    arr[curByte] = tmp & 0xff;
  }

  return arr;
}

export default {
  byteLength,
  toByteArray
};

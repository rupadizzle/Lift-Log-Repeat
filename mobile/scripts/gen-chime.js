// One-off generator for assets/rest-chime.wav — two short sine chimes,
// matching the frequencies/envelope the prototype synthesized live via
// WebAudio (784Hz then 1046.5Hz, ~150ms each, quick attack/decay).
const fs = require('fs');
const path = require('path');

const SR = 22050;
const totalSec = 0.42;
const numSamples = Math.round(SR * totalSec);
const data = new Int16Array(numSamples);

function addTone(startSec, freq, durSec, peak) {
  const startN = Math.round(startSec * SR);
  const durN = Math.round(durSec * SR);
  for (let i = 0; i < durN; i++) {
    const t = i / SR;
    const n = startN + i;
    if (n < 0 || n >= numSamples) continue;
    // quick attack (~15ms) then exponential-ish decay to the tail
    const attack = Math.min(1, t / 0.015);
    const decay = Math.exp(-t * 14);
    const env = attack * decay;
    const sample = Math.sin(2 * Math.PI * freq * t) * peak * env;
    data[n] += Math.max(-32767, Math.min(32767, sample * 32767));
  }
}

addTone(0, 784, 0.16, 0.5);
addTone(0.18, 1046.5, 0.16, 0.5);

const byteLength = data.length * 2;
const buffer = Buffer.alloc(44 + byteLength);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + byteLength, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // PCM chunk size
buffer.writeUInt16LE(1, 20); // PCM format
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(SR, 24);
buffer.writeUInt32LE(SR * 2, 28); // byte rate
buffer.writeUInt16LE(2, 32); // block align
buffer.writeUInt16LE(16, 34); // bits per sample
buffer.write('data', 36);
buffer.writeUInt32LE(byteLength, 40);
for (let i = 0; i < data.length; i++) {
  buffer.writeInt16LE(data[i], 44 + i * 2);
}

const outDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'rest-chime.wav'), buffer);
console.log('wrote', path.join(outDir, 'rest-chime.wav'), buffer.length, 'bytes');

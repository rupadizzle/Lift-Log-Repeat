import { createAudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

const chimeSource = require('../assets/rest-chime.wav');

/** Two short chimes, synthesized offline into assets/rest-chime.wav (see
 * scripts/gen-chime.js) — the mobile stand-in for the prototype's live
 * WebAudio oscillator (there's no oscillator API on-device). */
export function playRestChime() {
  try {
    const player = createAudioPlayer(chimeSource);
    player.play();
    // The chime is ~0.42s (see gen-chime.js); release the native player
    // shortly after it finishes so repeated rest completions across a long
    // session don't accumulate player instances.
    setTimeout(() => { try { player.remove(); } catch {} }, 1000);
  } catch {
    // audio unavailable — the visual cue still fires
  }
}

/** RN's Vibration.vibrate accepts the same on/off-ms pattern array as the
 * prototype's navigator.vibrate([90,60,90]). */
export function playRestBuzz() {
  try {
    Vibration.vibrate([90, 60, 90]);
  } catch {
    // unsupported — no-op
  }
}

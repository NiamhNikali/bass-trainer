// Bass tuning E1, A1, D2, G2
const tuning = [28, 33, 38, 43]; // MIDI note numbers for open strings
export const fretCount = 20;

// Note names
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Create all notes (string, fret, midi)
export const allNotes: { string: number; fret: number; midi: number; }[] = [];
for (let string = 0; string < 4; string++) {
  for (let fret = 0; fret <= fretCount; fret++) {
    allNotes.push({
      string,
      fret,
      midi: tuning[string] + fret,
    });
  }
}

// Utility: convert MIDI to frequency
export function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Utility: get note name + octave
export function midiToNoteName(midi: number) {
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi / 12);
  return `${name}${octave}`;
}


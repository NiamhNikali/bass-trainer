import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Bass tuning E1, A1, D2, G2
const tuning = [28, 33, 38, 43]; // MIDI note numbers for open strings
const fretCount = 20;

// Note names
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Create all notes (string, fret, midi)
const allNotes = [];
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
function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Utility: get note name + octave
function midiToNoteName(midi) {
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi / 12);
  return `${name}${octave}`;
}

export default function BassTrainer() {
  const [delay, setDelay] = useState(3); // seconds
  const [currentNote, setCurrentNote] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [maxFret, setMaxFret] = useState(5);
  const [oscillator, setOscillator] = useState(null);
  const [stats, setStats] = useState(() => {
    const initial = {};
    allNotes.forEach(n => {
      initial[`${n.string}-${n.fret}`] = [];
    });
    return initial;
  });
  const audioCtx = useRef(null);

  useEffect(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

function chooseNote() {
  const candidateNotes = allNotes.filter(n => n.fret <= maxFret);

  const weights = candidateNotes.map(n => {
    const key = `${n.string}-${n.fret}`;
    const history = stats[key];
    const successRate = history.length
      ? history.reduce((a, b) => a + b, 0) / history.length
      : 0.5;
    const difficulty = 1 - successRate;
    const fretWeight = (fretCount - n.fret + 1) / fretCount;
    return difficulty * 0.7 + fretWeight * 0.3;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidateNotes.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidateNotes[i];
  }
  return candidateNotes[candidateNotes.length - 1];
}


function playNote(note) {
  const freq = midiToFreq(note.midi);
  const ctx = audioCtx.current;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  osc.start();
  setOscillator({ osc, gain });
}

function stopNote() {
  if (oscillator) {
    const ctx = audioCtx.current;
    oscillator.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.osc.stop(ctx.currentTime + 0.3);
    setOscillator(null);
  }
}

  function startQuiz() {
    const note = chooseNote();
    setCurrentNote(note);
    setRevealed(false);
    setTimeout(() => {
      playNote(note);
      revealAnswer();
    }, delay * 1000);
  }

  function revealAnswer() {
    setRevealed(true);
  }

function mark(correct) {
  if (!currentNote) return;
  stopNote();

  const key = `${currentNote.string}-${currentNote.fret}`;
  setStats(prev => {
    const history = [...prev[key], correct ? 1 : 0].slice(-10);
    return { ...prev, [key]: history };
  });

  // Calculate overall accuracy
  const attempts = Object.values(stats).flat();
  if (attempts.length >= 10) {
    const accuracy = attempts.reduce((a, b) => a + b, 0) / attempts.length;
    if (accuracy > 0.8 && maxFret < 20) {
      setMaxFret(prev => Math.min(20, prev + 2));
    }
  }

  // Next round
  startQuiz();
}

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <h1 className="text-xl font-bold">Bass Note Trainer</h1>

          <div className="flex items-center space-x-2">
            <label>Delay (seconds):</label>
            <input
              type="number"
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
              className="border rounded p-1 w-16"
            />
          </div>

          {!currentNote && <Button onClick={startQuiz}>Start</Button>}

          {currentNote && (
            <div className="mt-4">
<p>
  Note: <strong>{midiToNoteName(currentNote.midi)}</strong> — String {currentNote.string + 1}
  {revealed && <> , Fret {currentNote.fret}</>}
</p>
              {revealed && (
                <div className="flex space-x-2 mt-2">
                  <Button onClick={() => mark(true)} variant="default">
                    ✅ Correct
                  </Button>
                  <Button onClick={() => mark(false)} variant="destructive">
                    ❌ Wrong
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


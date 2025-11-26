import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Zap, Music, BookOpen, Clock, HeartHandshake, TrendingUp } from 'lucide-react';

// --- APP DATA ---

const WARMUP_EXERCISES = [
  "Long Tones (4 counts)",
  "Chromatic Scale (Slow)",
  "Right/Left Hand Independence",
  "Arpeggios in C Major",
  "Finger Gymnastics (Trills)",
  "Sight-reading simple melody",
];

const SYMBOLS_QUIZ_DATA = [
  { term: "Allegro", definition: "Fast, quickly and bright" },
  { term: "Adagio", definition: "Slow and stately" },
  { term: "Crescendo", definition: "Gradually get louder" },
  { term: "Decrescendo", definition: "Gradually get softer" },
  { term: "Pizzicato", definition: "Plucking strings with finger" },
  { term: "Fermata", definition: "Hold note longer than usual" },
  { term: "Staccato", definition: "Short and detached" },
  { term: "Tempo Rubato", definition: "Flexible tempo" },
];

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const getNoteFrequency = (midiNote) => 440.0 * Math.pow(2.0, (midiNote - 69.0) / 12.0);
const PITCH_NOTES = NOTES.map((note, index) => ({ 
  name: `${note}4`, 
  midi: 60 + index 
})).concat([
  { name: "C3", midi: 48 }, { name: "E3", midi: 52 }, { name: "A3", midi: 57 },
  { name: "C5", midi: 72 }
]);

// --- COMPONENTS ---

const Card = ({ title, icon: Icon, children }) => (
  <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
    <div className="flex items-center space-x-3 mb-4 text-white">
      {Icon && <Icon className="w-6 h-6 text-indigo-400" />}
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

// 1. Timer
const Timer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${Math.floor(totalSeconds / 3600)}:${m}:${s}`;
  };

  return (
    <Card title="Timer" icon={Clock}>
      <div className="text-5xl font-mono text-indigo-400 my-4 text-center">
        {formatTime(time)}
      </div>
      <div className="flex justify-center space-x-2">
        <button onClick={() => setIsRunning(!isRunning)} 
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold">
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={() => { setIsRunning(false); setTime(0); }} 
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-bold">
          Reset
        </button>
      </div>
    </Card>
  );
};

// 2. Warmup
const WarmupSelector = () => {
  const [exercise, setExercise] = useState(WARMUP_EXERCISES[0]);
  
  const shuffle = () => {
    const random = WARMUP_EXERCISES[Math.floor(Math.random() * WARMUP_EXERCISES.length)];
    setExercise(random);
  };

  return (
    <Card title="Warmup" icon={HeartHandshake}>
      <div className="h-24 flex items-center justify-center text-center text-lg font-bold text-white mb-2">
        {exercise}
      </div>
      <button onClick={shuffle} className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full flex justify-center items-center font-bold">
        <RefreshCw className="w-4 h-4 mr-2" /> Shuffle
      </button>
    </Card>
  );
};

// 3. Metronome
const Metronome = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBpm] = useState(120);
  const audioCtx = useRef(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef(null);

  const schedule = useCallback(() => {
    const secondsPerBeat = 60.0 / bpm;
    while (nextNoteTime.current < audioCtx.current.currentTime + 0.1) {
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.5;
      gain.gain.exponentialRampToValueAtTime(0.0001, nextNoteTime.current + 0.05);
      osc.start(nextNoteTime.current);
      osc.stop(nextNoteTime.current + 0.05);
      nextNoteTime.current += secondsPerBeat;
    }
    timerID.current = requestAnimationFrame(schedule);
  }, [bpm]);

  useEffect(() => {
    if (isRunning) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      nextNoteTime.current = audioCtx.current.currentTime;
      schedule();
    } else {
      if (timerID.current) cancelAnimationFrame(timerID.current);
      if (audioCtx.current) audioCtx.current.close();
    }
    return () => { if (timerID.current) cancelAnimationFrame(timerID.current); };
  }, [isRunning, bpm, schedule]);

  return (
    <Card title="Metronome" icon={Zap}>
      <div className="text-center mb-4">
        <span className="text-6xl font-mono text-white">{bpm}</span>
        <span className="text-gray-400 ml-2">BPM</span>
      </div>
      <input type="range" min="40" max="220" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full mb-4 accent-indigo-500"/>
      <button onClick={() => setIsRunning(!isRunning)} 
        className={`w-full py-3 font-bold rounded-full text-white ${isRunning ? 'bg-red-600' : 'bg-green-600'}`}>
        {isRunning ? 'Stop' : 'Start'}
      </button>
    </Card>
  );
};

// 4. Pitch Trainer
const PitchTrainer = () => {
  const [status, setStatus] = useState('ready');
  const [target, setTarget] = useState(null);
  const [result, setResult] = useState(null);
  const audioCtx = useRef(null);

  const play = (note) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = getNoteFrequency(note.midi);
    gain.gain.setValueAtTime(0, audioCtx.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.current.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 1);
    osc.start();
    osc.stop(audioCtx.current.currentTime + 1);
  };

  const start = () => {
    const note = PITCH_NOTES[Math.floor(Math.random() * PITCH_NOTES.length)];
    setTarget(note);
    setStatus('guessing');
    setResult(null);
    play(note);
  };

  const handleGuess = (note) => {
    if (note.name === target.name) {
      setResult("Correct!");
      setTimeout(start, 1500);
    } else {
      setResult(`Wrong! It was ${target.name}`);
      setTimeout(start, 2000);
    }
  };

  return (
    <Card title="Pitch Trainer" icon={Music}>
      {status === 'ready' ? (
        <button onClick={start} className="w-full py-3 bg-indigo-600 rounded-full font-bold text-white">Start</button>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PITCH_NOTES.slice(0, 12).map(n => (
              <button key={n.name} onClick={() => handleGuess(n)} className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-white text-xs font-bold">
                {n.name}
              </button>
            ))}
          </div>
          <div className="h-8 text-center font-bold text-white">{result}</div>
          <button onClick={() => play(target)} className="w-full mt-2 py-2 bg-gray-600 rounded-full text-white text-sm">Replay Sound</button>
        </>
      )}
    </Card>
  );
};

// 5. Symbols Trainer
const SymbolsTrainer = () => {
  const [item, setItem] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { if(!item) next(); }, [item]);

  const next = () => {
    setItem(SYMBOLS_QUIZ_DATA[Math.floor(Math.random() * SYMBOLS_QUIZ_DATA.length)]);
    setRevealed(false);
  };

  if(!item) return null;

  return (
    <Card title="Symbols" icon={BookOpen}>
      <div className="h-24 flex flex-col items-center justify-center text-center">
        <h3 className="text-2xl font-serif text-indigo-300 font-bold">{item.term}</h3>
        {revealed && <p className="text-gray-300 mt-2">{item.definition}</p>}
      </div>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="w-full py-2 bg-indigo-600 rounded-full text-white font-bold">Reveal</button>
      ) : (
        <button onClick={next} className="w-full py-2 bg-gray-600 rounded-full text-white font-bold">Next Card</button>
      )}
    </Card>
  );
};

// --- MAIN APP ---

const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 font-sans">
      <header className="mb-6 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-indigo-400">Practice Companion</h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Metronome />
        <Timer />
        <WarmupSelector />
        <PitchTrainer />
        <SymbolsTrainer />
        
        <Card title="Notes" icon={TrendingUp}>
          <p className="text-gray-400">Login to save your progress (Coming Soon)</p>
        </Card>
      </main>
    </div>
  );
};

export default App;

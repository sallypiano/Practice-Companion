import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Zap, Music, BookOpen, Clock, HeartHandshake, TrendingUp, LogIn, LogOut, Loader, Timer as TimerIcon } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// --- CONFIG AND INITIALIZATION ---
// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app;
let db;
let auth;

if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

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
  { term: "Staccato", "definition": "Short and detached" },
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
  <div className="relative bg-gray-800/70 p-6 rounded-3xl shadow-2xl border border-gray-700/50 transition duration-300 hover:bg-gray-700/80 hover:shadow-indigo-900/50 overflow-hidden">
    {/* Decorative corner accent */}
    <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-3xl bg-indigo-500/20 opacity-30"></div>
    
    <div className="flex items-center space-x-3 mb-4 text-white">
      {Icon && <Icon className="w-7 h-7 text-cyan-400" />}
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    </div>
    {children}
  </div>
);

// 1. Timer (Now supports Stopwatch)
const Timer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('stopwatch'); // 'stopwatch' or 'timer'

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
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  
  const reset = () => { setIsRunning(false); setTime(0); };

  return (
    <Card title="Practice Timer" icon={Clock}>
      <div className="flex justify-center mb-4 space-x-2">
        <button onClick={() => setMode('stopwatch')} 
          className={`px-3 py-1 rounded-full text-sm font-semibold transition ${mode === 'stopwatch' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
          Stopwatch
        </button>
        <button onClick={() => setMode('timer')} 
          className={`px-3 py-1 rounded-full text-sm font-semibold transition ${mode === 'timer' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
          Countdown (WIP)
        </button>
      </div>

      <div className="text-6xl md:text-7xl font-mono text-cyan-400 my-6 text-center tracking-tight">
        {formatTime(time)}
      </div>
      
      {mode === 'stopwatch' && (
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => setIsRunning(!isRunning)} 
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-full font-bold shadow-md transition duration-150 text-base md:text-lg"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button 
            onClick={reset} 
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded-full font-bold shadow-md transition duration-150 text-base md:text-lg"
          >
            Reset
          </button>
        </div>
      )}
      {mode === 'timer' && (
         <div className="text-center text-gray-400 py-3">Countdown feature coming soon!</div>
      )}
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
    <Card title="Daily Warmup" icon={HeartHandshake}>
      <div className="h-24 flex items-center justify-center text-center text-xl md:text-2xl font-extrabold text-indigo-300 mb-4">
        {exercise}
      </div>
      <button 
        onClick={shuffle} 
        className="w-full py-3 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white rounded-full flex justify-center items-center font-bold shadow-lg transition duration-150"
      >
        <RefreshCw className="w-5 h-5 mr-2" /> Shuffle Exercise
      </button>
    </Card>
  );
};

// 3. Metronome (Fix applied for continuous sound)
const Metronome = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBpm] = useState(120);
  const audioCtx = useRef(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef(null);

  const playBeat = (time) => {
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.frequency.value = 880; 
    gain.gain.setValueAtTime(0.5, time); // Constant volume
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05); // Quick decay
    osc.start(time);
    osc.stop(time + 0.05);
  };

  const scheduler = useCallback(() => {
    // Schedule notes ahead of time
    const lookahead = 0.1; // seconds
    const secondsPerBeat = 60.0 / bpm;

    while (nextNoteTime.current < audioCtx.current.currentTime + lookahead) {
      playBeat(nextNoteTime.current);
      nextNoteTime.current += secondsPerBeat;
    }
    
    // Use setTimeout for accurate timing (instead of requestAnimationFrame for audio scheduling)
    timerID.current = setTimeout(scheduler, 25); 
  }, [bpm]);

  useEffect(() => {
    if (isRunning) {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
      nextNoteTime.current = audioCtx.current.currentTime;
      scheduler();
    } else {
      if (timerID.current) clearTimeout(timerID.current);
    }
    return () => { 
      if (timerID.current) clearTimeout(timerID.current);
    };
  }, [isRunning, bpm, scheduler]);

  return (
    <Card title="Metronome" icon={Zap}>
      <div className="text-center mb-4 mt-2">
        <span className="text-6xl md:text-7xl font-mono text-white">{bpm}</span>
        <span className="text-gray-400 ml-2 text-xl">BPM</span>
      </div>
      <input 
        type="range" 
        min="40" 
        max="220" 
        value={bpm} 
        onChange={(e) => setBpm(Number(e.target.value))} 
        className="w-full h-2 mb-6 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
      <button 
        onClick={() => setIsRunning(!isRunning)} 
        className={`w-full py-3 font-bold rounded-full text-white text-lg shadow-lg transition duration-150 ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {isRunning ? 'Stop Metronome' : 'Start Metronome'}
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
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();

    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = getNoteFrequency(note.midi);
    
    gain.gain.setValueAtTime(0, audioCtx.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.current.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 0.8);

    osc.start(audioCtx.current.currentTime);
    osc.stop(audioCtx.current.currentTime + 0.8);
  };

  const start = () => {
    const note = PITCH_NOTES[Math.floor(Math.random() * PITCH_NOTES.length)];
    setTarget(note);
    setStatus('guessing');
    setResult(null);
    play(note);
  };

  const handleGuess = (note) => {
    if (!target) return;
    if (note.name === target.name) {
      setResult("✅ Correct!");
      setTimeout(start, 1500);
    } else {
      setResult(`❌ Wrong! It was ${target.name}`);
      setTimeout(start, 2000);
    }
  };

  return (
    <Card title="Ear Training" icon={Music}>
      <div className="h-10 text-center text-xl font-bold mb-4 text-indigo-300">
        {result || (status === 'guessing' ? 'Listen and Guess' : 'Ready to Start')}
      </div>
      {status === 'ready' ? (
        <button 
          onClick={start} 
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-full font-bold text-white shadow-lg text-lg"
        >
          Start Quiz
        </button>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PITCH_NOTES.slice(0, 12).map(n => (
              <button 
                key={n.name} 
                onClick={() => handleGuess(n)} 
                className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 active:bg-gray-500 text-white font-bold transition duration-150 shadow-inner text-sm md:text-base"
                disabled={!!result}
              >
                {n.name}
              </button>
            ))}
          </div>
          <button 
            onClick={() => play(target)} 
            className="w-full mt-2 py-2 bg-gray-600 rounded-full text-white text-base hover:bg-gray-500 transition duration-150"
            disabled={!!result}
          >
            Replay Sound
          </button>
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
    <Card title="Music Vocabulary" icon={BookOpen}>
      <div className="h-28 flex flex-col items-center justify-center text-center">
        <h3 className="text-3xl font-serif text-cyan-300 font-bold mb-2">{item.term}</h3>
        {revealed && <p className="text-gray-300 px-2 text-lg">{item.definition}</p>}
      </div>
      {!revealed ? (
        <button 
          onClick={() => setRevealed(true)} 
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-full text-white font-bold shadow-lg transition duration-150 text-lg"
        >
          Reveal Definition
        </button>
      ) : (
        <button 
          onClick={next} 
          className="w-full py-3 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 rounded-full text-white font-bold shadow-lg transition duration-150 text-lg"
        >
          Next Term
        </button>
      )}
    </Card>
  );
};

// --- AUTH COMPONENT ---
const AuthStatus = ({ user, isAuthReady }) => {
    const handleLogin = async () => {
        if (!auth) {
            console.error("Firebase Auth not initialized.");
            return;
        }
        try {
            // Attempt to sign in using the custom token if provided, otherwise anonymously
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Authentication failed:", error);
        }
    };

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (!isAuthReady) {
        return (
            <div className="flex items-center space-x-2 text-gray-400">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Initializing...</span>
            </div>
        );
    }
    
    // Check if the user is authenticated (not null)
    if (user) {
        const isAnon = user.isAnonymous;
        return (
             <div className="flex items-center space-x-3">
                <span className={`text-sm ${isAnon ? 'text-yellow-400' : 'text-cyan-300'}`}>
                    {isAnon ? "Anonymous ID: " : "User ID: "}
                    <span className="font-mono text-xs break-all">{user.uid}</span>
                </span>
                <button 
                    onClick={handleLogout} 
                    title="Logout"
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition duration-150 shadow-md"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <button 
            onClick={handleLogin} 
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-full font-bold transition duration-150 shadow-md"
        >
            <LogIn className="w-5 h-5" />
            <span>Sign In</span>
        </button>
    );
};


// --- MAIN APP ---

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Auth Listener and sign in
  useEffect(() => {
    if (!auth) {
      console.error("Authentication service is unavailable.");
      setIsAuthReady(true); 
      return;
    }

    // Attempt to sign in on component mount
    const authenticate = async () => {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (e) {
            console.error("Initial sign-in failed:", e);
        }
    };
    authenticate();

    // Set up persistent auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans antialiased">
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-sm shadow-2xl p-4 md:p-6 border-b border-indigo-900/50 flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
          Practice Companion
        </h1>
        <AuthStatus user={user} isAuthReady={isAuthReady} />
      </header>

      {/* Responsive Grid Layout */}
      <main className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <Metronome />
        <Timer />
        <WarmupSelector />
        <PitchTrainer />
        <SymbolsTrainer />
        
        {/* Progress Tracker / Notes */}
        <Card title="Progress Tracker" icon={TrendingUp}>
          <div className="h-24 flex flex-col justify-center text-center">
            {isAuthReady && user ? (
              <p className="text-gray-400 text-lg">
                You are authenticated! User ID is displayed above. Let's build the notes feature next.
              </p>
            ) : (
              <p className="text-gray-400 text-lg">
                Sign in to save your session data and practice goals here.
              </p>
            )}
          </div>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 p-4 border-t border-gray-800">
        Built with React, Tailwind CSS, and Firebase.
      </footer>
    </div>
  );
};

export default App;

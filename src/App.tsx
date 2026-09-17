import { useState, useEffect, useCallback, useRef } from 'react';

// Types
type Section = 'game' | 'results' | 'about';
type ColorKey = 'red' | 'blue' | 'green' | 'yellow';
type GamePhase = 'start' | 'playing' | 'ended';

interface GameState {
  phase: GamePhase;
  score: number;
  currentRound: number;
  totalRounds: number;
  timeLeft: number;
  correctAnswers: number;
  responseTimes: number[];
  currentWord: string;
  currentColor: ColorKey;
  startTime: number | null;
  streak: number;
  bestStreak: number;
  animation: '' | 'shake' | 'correct';
}

// Constants
const COLORS: ColorKey[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_NAMES: Record<ColorKey, string> = {
  red: 'КРАСНЫЙ',
  blue: 'СИНИЙ',
  green: 'ЗЕЛЁНЫЙ',
  yellow: 'ЖЁЛТЫЙ',
};

const COLOR_VALUES: Record<ColorKey, string> = {
  red: '#ff4757',
  blue: '#3742fa',
  green: '#2ed573',
  yellow: '#ffa502',
};

const INITIAL_STATE: GameState = {
  phase: 'start',
  score: 0,
  currentRound: 0,
  totalRounds: 20,
  timeLeft: 60,
  correctAnswers: 0,
  responseTimes: [],
  currentWord: '',
  currentColor: 'red',
  startTime: null,
  streak: 0,
  bestStreak: 0,
  animation: '',
};

// Helper functions
function generateRound() {
  const wordIndex = Math.floor(Math.random() * COLORS.length);
  let colorIndex = Math.floor(Math.random() * COLORS.length);
  while (colorIndex === wordIndex) {
    colorIndex = Math.floor(Math.random() * COLORS.length);
  }
  return {
    word: COLOR_NAMES[COLORS[wordIndex]],
    color: COLORS[colorIndex],
  };
}

function getCognitiveLevel(accuracy: number, avgTime: number) {
  if (accuracy >= 90 && avgTime < 1.5) {
    return {
      level: '🏆 Мастер когнитивного контроля',
      description:
        'Потрясающий результат! Ваш мозг отлично справляется с подавлением автоматических реакций и переключением внимания. Вы обладаете высоким уровнем когнитивной гибкости и концентрации.',
    };
  } else if (accuracy >= 75 && avgTime < 2) {
    return {
      level: '⭐ Отличный уровень',
      description:
        'Очень хороший результат! Ваш когнитивный контроль хорошо развит. Вы быстро переключаетесь между задачами и эффективно подавляете автоматические реакции.',
    };
  } else if (accuracy >= 60 && avgTime < 2.5) {
    return {
      level: '✅ Хороший уровень',
      description:
        'Неплохой результат! Ваш когнитивный контроль находится на среднем уровне. С практикой вы сможете улучшить свои показатели.',
    };
  } else {
    return {
      level: '📚 Требуется тренировка',
      description:
        'Результат показывает, что есть пространство для улучшения. Регулярная практика подобных тестов поможет развить когнитивный контроль и скорость реакции.',
    };
  }
}

// Components
function Header() {
  return (
    <header className="text-center py-10 px-5 animate-fadeInDown">
      <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">
        🧠 Цветовой тест Струпа
      </h1>
      <p className="text-[#a0a0a0] text-lg md:text-xl">
        Проверь свой когнитивный контроль и скорость реакции!
      </p>
    </header>
  );
}

function Navigation({
  activeSection,
  onNavigate,
}: {
  activeSection: Section;
  onNavigate: (section: Section) => void;
}) {
  const buttons: { id: Section; label: string; icon: string }[] = [
    { id: 'game', label: 'Игра', icon: '🎮' },
    { id: 'results', label: 'Результаты', icon: '📊' },
    { id: 'about', label: 'О проекте', icon: 'ℹ️' },
  ];

  return (
    <nav className="flex justify-center gap-4 mb-10 flex-wrap">
      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={() => onNavigate(btn.id)}
          className={`px-7 py-3 rounded-full cursor-pointer transition-all duration-300 border border-white/10 backdrop-blur-md ${
            activeSection === btn.id
              ? 'bg-[#6C63FF] -translate-y-0.5 shadow-[0_10px_30px_rgba(108,99,255,0.3)]'
              : 'bg-white/5 hover:bg-[#6C63FF] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(108,99,255,0.3)]'
          } text-white`}
        >
          {btn.icon} {btn.label}
        </button>
      ))}
    </nav>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <h2 className="text-center text-2xl font-bold mb-5">Добро пожаловать!</h2>
      <p className="text-[#a0a0a0] leading-relaxed mb-8">
        На экране появится слово, обозначающее цвет, но написанное другим цветом.
        <br />
        Ваша задача — нажать на кнопку с <strong>правильным ЦВЕТОМ</strong>, а не
        словом.
        <br />
        <br />
        Например: если написано{' '}
        <span style={{ color: '#ff4757', fontWeight: 'bold' }}>"СИНИЙ"</span>{' '}
        красным цветом,
        <br />
        нужно нажать кнопку <strong>КРАСНЫЙ</strong>.
      </p>
      <button
        onClick={onStart}
        className="w-full py-5 rounded-2xl btn-gradient text-white text-xl font-bold cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(108,99,255,0.4)]"
      >
        Начать тест
      </button>
    </div>
  );
}

function GameScreen({
  gameState,
  onAnswer,
}: {
  gameState: GameState;
  onAnswer: (color: ColorKey) => void;
}) {
  const wordClass =
    gameState.animation === 'shake'
      ? 'animate-shake'
      : gameState.animation === 'correct'
      ? 'animate-correct'
      : 'animate-pulse-word';

  return (
    <div>
      {/* Stats Bar */}
      <div className="flex justify-around mb-8 p-5 glass-dark rounded-2xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-[#6C63FF]">{gameState.score}</div>
          <div className="text-[#a0a0a0] text-sm">Очки</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[#6C63FF]">{gameState.timeLeft}</div>
          <div className="text-[#a0a0a0] text-sm">Секунд</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[#6C63FF]">
            {gameState.currentRound}/{gameState.totalRounds}
          </div>
          <div className="text-[#a0a0a0] text-sm">Раунд</div>
        </div>
      </div>

      {/* Word Display */}
      <div className="text-center py-16 px-5 mb-8 glass-dark rounded-2xl min-h-[200px] flex items-center justify-center">
        <div
          className={`text-5xl md:text-6xl font-bold uppercase ${wordClass}`}
          style={{ color: COLOR_VALUES[gameState.currentColor] }}
        >
          {gameState.currentWord}
        </div>
      </div>

      {/* Color Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onAnswer(color)}
            className="py-6 rounded-2xl text-lg font-bold text-white uppercase cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-95"
            style={{ background: COLOR_VALUES[color] }}
          >
            {COLOR_NAMES[color]}
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-5 glass-dark rounded-xl overflow-hidden">
        <div
          className="h-2.5 progress-gradient transition-all duration-300"
          style={{
            width: `${(gameState.currentRound / gameState.totalRounds) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

function ResultsScreen({
  gameState,
  onRestart,
}: {
  gameState: GameState;
  onRestart: () => void;
}) {
  const accuracy = Math.round(
    (gameState.correctAnswers / gameState.totalRounds) * 100
  );
  const avgTime =
    gameState.responseTimes.length > 0
      ? parseFloat(
          (
            gameState.responseTimes.reduce((a, b) => a + b, 0) /
            gameState.responseTimes.length
          ).toFixed(2)
        )
      : 0;

  const { level, description } = getCognitiveLevel(accuracy, avgTime);

  return (
    <div className="glass-card rounded-3xl p-8 md:p-10 max-w-[600px] mx-auto text-center animate-fadeIn">
      <h2 className="text-2xl font-bold mb-4">Ваши результаты</h2>
      <div className="text-6xl md:text-7xl font-bold text-gradient my-5">
        {accuracy}%
      </div>
      <div className="text-2xl mb-5 text-[#4CAF50]">{level}</div>
      <p className="text-[#a0a0a0] leading-relaxed mb-8">{description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-8">
        <div className="glass-dark p-5 rounded-2xl">
          <h3 className="text-[#a0a0a0] text-sm mb-2">Правильных ответов</h3>
          <div className="text-3xl font-bold text-[#6C63FF]">
            {gameState.correctAnswers}/{gameState.totalRounds}
          </div>
        </div>
        <div className="glass-dark p-5 rounded-2xl">
          <h3 className="text-[#a0a0a0] text-sm mb-2">Среднее время</h3>
          <div className="text-3xl font-bold text-[#6C63FF]">{avgTime}с</div>
        </div>
        <div className="glass-dark p-5 rounded-2xl">
          <h3 className="text-[#a0a0a0] text-sm mb-2">Точность</h3>
          <div className="text-3xl font-bold text-[#6C63FF]">{accuracy}%</div>
        </div>
        <div className="glass-dark p-5 rounded-2xl">
          <h3 className="text-[#a0a0a0] text-sm mb-2">Лучшая серия</h3>
          <div className="text-3xl font-bold text-[#6C63FF]">
            {gameState.bestStreak}
          </div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full py-5 rounded-2xl btn-gradient text-white text-xl font-bold cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(108,99,255,0.4)]"
      >
        Пройти ещё раз
      </button>
    </div>
  );
}

function AboutScreen() {
  return (
    <div className="glass-card rounded-3xl p-8 md:p-10 animate-fadeIn">
      {/* What is Stroop */}
      <section className="mb-10">
        <h2 className="text-[#6C63FF] text-2xl md:text-3xl font-bold mb-5">
          📖 Что такое тест Струпа?
        </h2>
        <p className="text-[#a0a0a0] leading-relaxed mb-4">
          <strong>Эффект Струпа</strong> — это психологический феномен, открытый
          американским психологом Джоном Ридли Струпом в 1935 году. Он
          демонстрирует интерференцию в обработке информации, когда мозг получает
          противоречивые сигналы.
        </p>
        <p className="text-[#a0a0a0] leading-relaxed">
          Когда вы видите слово «СИНИЙ», написанное красным цветом, ваш мозг
          автоматически читает слово (что быстрее), но задача требует назвать цвет
          (что медленнее). Это создаёт когнитивный конфликт, который нужно
          преодолеть.
        </p>
      </section>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-[#6C63FF] text-2xl md:text-3xl font-bold mb-5">
          ⚙️ Как это работает?
        </h2>
        <p className="text-[#a0a0a0] leading-relaxed mb-4">
          Тест измеряет вашу способность подавлять автоматические реакции и
          переключать внимание. Чем быстрее и точнее вы отвечаете, тем лучше
          развит ваш <strong>когнитивный контроль</strong> — способность мозга
          управлять вниманием и подавлять ненужные импульсы.
        </p>
        <p className="text-[#a0a0a0] leading-relaxed">
          В игре используется 20 раундов со случайной комбинацией слов и цветов.
          Система замеряет время реакции и точность ответов, чтобы оценить уровень
          вашего когнитивного контроля.
        </p>
      </section>

      {/* Design */}
      <section className="mb-10">
        <h2 className="text-[#6C63FF] text-2xl md:text-3xl font-bold mb-5">
          🎨 Дизайн и цвета
        </h2>
        <p className="text-[#a0a0a0] leading-relaxed mb-5">
          Проект выполнен в современном тёмном стиле с яркими акцентами.
          Используется градиентный фон и полупрозрачные карточки с эффектом
          размытия (glassmorphism).
        </p>
        <div className="flex gap-4 flex-wrap">
          {[
            { color: '#6C63FF', label: '#6C63FF' },
            { color: '#4CAF50', label: '#4CAF50' },
            { color: '#FF6B6B', label: '#FF6B6B' },
            { color: '#1a1a2e', label: '#1a1a2e' },
            { color: '#ff4757', label: '#ff4757' },
            { color: '#3742fa', label: '#3742fa' },
            { color: '#2ed573', label: '#2ed573' },
            { color: '#ffa502', label: '#ffa502' },
          ].map((swatch) => (
            <div
              key={swatch.label}
              className="w-20 h-20 rounded-2xl flex items-end justify-center pb-2.5 text-xs font-bold text-white"
              style={{
                background: swatch.color,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {swatch.label}
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-10">
        <h2 className="text-[#6C63FF] text-2xl md:text-3xl font-bold mb-5">
          💻 Технический стек
        </h2>
        <p className="text-[#a0a0a0] leading-relaxed mb-5">
          Проект создан с использованием React, TypeScript и Tailwind CSS —
          современных инструментов для создания быстрых и красивых веб-приложений.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'React', desc: 'UI библиотека от Facebook' },
            { title: 'TypeScript', desc: 'Типизированный JavaScript' },
            { title: 'Tailwind CSS', desc: 'Utility-first CSS фреймворк' },
            { title: 'Vite', desc: 'Быстрый сборщик проектов' },
            { title: 'CSS Animations', desc: 'Плавные переходы и эффекты' },
            { title: 'Glassmorphism', desc: 'Современный стиль дизайна' },
          ].map((tech) => (
            <div
              key={tech.title}
              className="glass-dark p-5 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:bg-[#6C63FF]/10"
            >
              <h3 className="text-[#4CAF50] font-bold mb-2">{tech.title}</h3>
              <p className="text-[#a0a0a0] text-sm">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-[#6C63FF] text-2xl md:text-3xl font-bold mb-5">
          🚀 Особенности проекта
        </h2>
        <ul className="text-[#a0a0a0] leading-loose list-disc pl-5 space-y-1">
          <li>✨ Плавные анимации и переходы</li>
          <li>📱 Адаптивный дизайн для всех устройств</li>
          <li>🎯 Точный замер времени реакции</li>
          <li>📊 Детальная статистика результатов</li>
          <li>🧠 Научно обоснованный психологический тест</li>
          <li>🌐 Полностью бесплатный и открытый код</li>
          <li>⚡ Мгновенная загрузка без зависимостей</li>
          <li>⌨️ Поддержка клавиатурного управления</li>
        </ul>
      </section>
    </div>
  );
}

// Main App
export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('game');
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (gameState.phase === 'playing') {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            return { ...prev, timeLeft: 0, phase: 'ended' };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.phase]);

  // End game when time runs out or rounds complete
  useEffect(() => {
    if (
      gameState.phase === 'playing' &&
      (gameState.timeLeft <= 0 || gameState.currentRound >= gameState.totalRounds)
    ) {
      setGameState((prev) => ({ ...prev, phase: 'ended' }));
    }
  }, [gameState.timeLeft, gameState.currentRound, gameState.phase, gameState.totalRounds]);

  // Auto-switch to results when game ends
  useEffect(() => {
    if (gameState.phase === 'ended') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setActiveSection('results');
    }
  }, [gameState.phase]);

  const startGame = useCallback(() => {
    const round = generateRound();
    setGameState({
      ...INITIAL_STATE,
      phase: 'playing',
      currentWord: round.word,
      currentColor: round.color,
      startTime: Date.now(),
    });
  }, []);

  const nextRound = useCallback(() => {
    const round = generateRound();
    setGameState((prev) => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      currentWord: round.word,
      currentColor: round.color,
      startTime: Date.now(),
      animation: '',
    }));
  }, []);

  const checkAnswer = useCallback(
    (selectedColor: ColorKey) => {
      if (gameState.phase !== 'playing') return;

      const responseTime = (Date.now() - (gameState.startTime || Date.now())) / 1000;
      const isCorrect = selectedColor === gameState.currentColor;

      setGameState((prev) => {
        const newState = { ...prev };
        newState.responseTimes = [...prev.responseTimes, responseTime];

        if (isCorrect) {
          newState.correctAnswers = prev.correctAnswers + 1;
          newState.score = prev.score + Math.max(10 - Math.floor(responseTime), 1);
          newState.streak = prev.streak + 1;
          newState.bestStreak = Math.max(prev.streak + 1, prev.bestStreak);
          newState.animation = 'correct';
        } else {
          newState.streak = 0;
          newState.animation = 'shake';
        }

        return newState;
      });

      // Move to next round after brief animation delay
      setTimeout(() => {
        nextRound();
      }, 300);
    },
    [gameState.phase, gameState.startTime, gameState.currentColor, nextRound]
  );

  const restartGame = useCallback(() => {
    setGameState(INITIAL_STATE);
    setActiveSection('game');
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.phase !== 'playing') return;

      switch (e.key.toLowerCase()) {
        case '1':
        case 'r':
        case 'к':
          checkAnswer('red');
          break;
        case '2':
        case 'b':
        case 'с':
          checkAnswer('blue');
          break;
        case '3':
        case 'g':
        case 'з':
          checkAnswer('green');
          break;
        case '4':
        case 'y':
        case 'ж':
          checkAnswer('yellow');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gameState.phase, checkAnswer]);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-5">
      <Header />
      <Navigation activeSection={activeSection} onNavigate={setActiveSection} />

      {/* Game Section */}
      {activeSection === 'game' && (
        <div className="animate-fadeIn">
          <div className="glass-card rounded-3xl p-8 md:p-10 max-w-[600px] mx-auto">
            {gameState.phase === 'start' ? (
              <StartScreen onStart={startGame} />
            ) : (
              <GameScreen gameState={gameState} onAnswer={checkAnswer} />
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {activeSection === 'results' && (
        <ResultsScreen gameState={gameState} onRestart={restartGame} />
      )}

      {/* About Section */}
      {activeSection === 'about' && <AboutScreen />}
    </div>
  );
}

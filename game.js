const { useState, useEffect, useRef } = React;

// Simplified AlertDialog components
const AlertDialog = ({ open, children }) => open ? <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">{children}</div> : null;
const AlertDialogContent = ({ children, className }) => <div className={`bg-gray-800 p-6 rounded-lg ${className}`}>{children}</div>;
const AlertDialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
const AlertDialogFooter = ({ children }) => <div className="mt-4 flex justify-end space-x-2">{children}</div>;
const AlertDialogTitle = ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>;
const AlertDialogDescription = ({ children }) => <p>{children}</p>;
const AlertDialogAction = ({ children, ...props }) => <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" {...props}>{children}</button>;

const estimatePar = (grid) => {
  let par = 0;
  let currentColor = grid[0][0];
  
  while (!grid.every(row => row.every(cell => cell === currentColor))) {
    const colorCounts = COLORS.map(color => 
      grid.flat().filter(cell => cell === color).length
    );
    const bestColor = COLORS[colorCounts.indexOf(Math.max(...colorCounts))];
    
    grid = grid.map(row => row.map(cell => 
      cell === currentColor ? bestColor : cell
    ));
    
    currentColor = bestColor;
    par++;
  }

  return par;
};

// Simplified Button component
const Button = React.forwardRef(({ className, ...props }, ref) => (
  <button
    className={`px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 ${className}`}
    ref={ref}
    {...props}
  />
));

const COLORS = ['#FF6B6B', '#2ecc71', '#3498db', '#FED766', '#8A4FFF'];
const MAX_MOVES = 25;
const GRID_SIZE = 14;

const ColorCascadePuzzle = () => {
  const [grid, setGrid] = useState([]);
  const [moves, setMoves] = useState(MAX_MOVES);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('menu');
  const [level, setLevel] = useState(1);
  const [completionColor, setCompletionColor] = useState(null);
  const [gameOverAnimation, setGameOverAnimation] = useState(false);
  const containerRef = useRef(null);
const [baseScore, setBaseScore] = useState(0);
const [speedBonus, setSpeedBonus] = useState(0);
const [showingScore, setShowingScore] = useState(false);

  const initializeGrid = () => {
  const newGrid = Array(GRID_SIZE).fill().map(() => 
    Array(GRID_SIZE).fill().map(() => COLORS[Math.floor(Math.random() * COLORS.length)])
  );
  setGrid(newGrid);
};

  const initializeGame = () => {
  initializeGrid();
  setMoves(MAX_MOVES);
  setScore(0);
  setBaseScore(0);
  setSpeedBonus(0);
  setGameState('playing');
  setLevel(1);
  setCompletionColor(null);
  setGameOverAnimation(false);
  setShowingScore(false);
};

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState === 'playing') {
        const key = e.key.toLowerCase();
        const colorIndex = ['r', 'g', 'b', 'y', 'p'].indexOf(key);
        if (colorIndex !== -1) {
          floodFill(COLORS[colorIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, grid]);

  const floodFill = (newColor) => {
  if (moves <= 0) return;

  const startColor = grid[0][0];
  if (startColor === newColor) return;

  const newGrid = grid.map(row => [...row]);
  const stack = [[0, 0]];
  let changedCells = 0;

  while (stack.length > 0) {
    const [x, y] = stack.pop();

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || newGrid[y][x] !== startColor) {
      continue;
    }

    newGrid[y][x] = newColor;
    changedCells++;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  setGrid(newGrid);
  setMoves(moves - 1);
  setBaseScore(baseScore + changedCells);

  if (newGrid.every(row => row.every(cell => cell === newColor))) {
  setCompletionColor(newColor);
  const speedBonus = (MAX_MOVES - (moves - 1)) * 25;
  setSpeedBonus(speedBonus);
  setScore(score + baseScore + speedBonus);
  setTimeout(() => {
    setGameState('levelComplete');
    setShowingScore(true);
    setHighScore(Math.max(highScore, score + baseScore + speedBonus));
  }, 2000);
} else if (moves <= 1) {
  setGameOverAnimation(true);
  setTimeout(() => {
    setGameState('gameOver');
    setHighScore(Math.max(highScore, score + baseScore));
  }, 2000);
}
};

  const nextLevel = () => {
  setLevel(level + 1);
  initializeGrid();
  setMoves(MAX_MOVES);
  setBaseScore(0);
  setSpeedBonus(0);
  setGameState('playing');
  setCompletionColor(null);
  setShowingScore(false);
};

  const renderGrid = () => (
    <div 
      className="grid gap-0.5" 
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
    >
      {grid.map((row, rowIndex) => 
        row.map((color, colIndex) => {
          const index = rowIndex * GRID_SIZE + colIndex;
          const completionDelay = completionColor ? (rowIndex + colIndex) * 50 : 0;
          const fallDelay = gameOverAnimation ? ((2 * GRID_SIZE) - (rowIndex + colIndex)) * 50 : 0;
          return (
            <div 
              key={`${rowIndex}-${colIndex}`}
              className={`aspect-square rounded-sm relative ${index === 0 ? 'ring-2 ring-white' : ''} 
                ${completionColor ? 'animate-flip' : ''} 
                ${gameOverAnimation ? 'animate-fall' : ''}`}
              style={{ 
                backgroundColor: color,
                animationDelay: `${completionDelay}ms, ${fallDelay}ms`,
              }}
            >
              {index === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  Start
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderGameInfo = () => (
    <div className="mt-4 text-center">
      <div className="flex justify-between mb-4">
        <div className="text-left">
          <p className="text-xl font-bold">Level: {level}</p>
          <p className="text-lg">Move(s) left: {moves}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">Score: {score}</p>
          <p className="text-lg">High Score: {highScore}</p>
        </div>
      </div>
      <div className="flex justify-center space-x-2 mb-4">
        {COLORS.map((color, index) => (
          <button 
            key={color} 
            className="w-10 h-10 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-transform duration-200 hover:scale-110 active:scale-90"
            style={{ backgroundColor: color }}
            onClick={() => floodFill(color)}
          />
        ))}
      </div>
      <p className="text-sm opacity-70">Press R, G, B, Y, P keys to play</p>
    </div>
  );

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-5xl font-bold mb-6 text-gradient">Sean's Colour Cascade</h1>
      <p className="text-xl mb-8 opacity-80">Fill the grid with a single colour in limited moves!</p>
      <Button 
        onClick={initializeGame}
        className="px-8 py-4 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
      >
        Start Game
      </Button>
    </div>
  );

  const renderLevelComplete = () => (
  <AlertDialog open={gameState === 'levelComplete'}>
    <AlertDialogContent className="bg-gray-800 text-white">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl font-bold">Level {level} Complete!</AlertDialogTitle>
        <AlertDialogDescription className="text-lg opacity-80">
          {showingScore ? (
            <div className="space-y-2">
              <p>Base Score: <AnimatedNumber value={baseScore} /></p>
              <p>Speed Bonus: <AnimatedNumber value={speedBonus} /></p>
              <p className="font-bold mt-4">Total Score: <AnimatedNumber value={score} /></p>
            </div>
          ) : (
            <p>Calculating score...</p>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        {showingScore && (
          <AlertDialogAction onClick={nextLevel} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
            Next Level
          </AlertDialogAction>
        )}
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

  const renderGameOver = () => (
    <AlertDialog open={gameState === 'gameOver'}>
      <AlertDialogContent className="bg-gray-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">Game Over</AlertDialogTitle>
          <AlertDialogDescription className="text-lg opacity-80">
            You've run out of moves. Final score: {score}
            {score === highScore && <p className="text-green-400 mt-2">New High Score!</p>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setGameState('menu')} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
            Main Menu
          </AlertDialogAction>
          <AlertDialogAction onClick={initializeGame} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            Play Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

       const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;

    let timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start === end) clearInterval(timer);
    }, 10);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};      

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div ref={containerRef} className="w-full max-w-3xl aspect-square">
        <div className="p-4 rounded-lg shadow-2xl bg-gray-800 border border-gray-700 h-full flex flex-col">
          {gameState === 'menu' ? renderMenu() : (
            <>
              <div className="flex-grow">{renderGrid()}</div>
              {renderGameInfo()}
            </>
          )}
          {renderLevelComplete()}
          {renderGameOver()}
        </div>
      </div>
      <style jsx global>{`
        .text-gradient {
          background: linear-gradient(to right, #FF6B6B, #2ecc71, #3498db, #FED766, #8A4FFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes flip {
          0% { transform: perspective(400px) rotateY(0); }
          100% { transform: perspective(400px) rotateY(180deg); }
        }
        .animate-flip {
          animation: flip 0.6s ease-out forwards;
          animation-delay: var(--delay, 0ms);
        }
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100%) rotate(20deg); opacity: 0; }
        }
        .animate-fall {
          animation: fall 0.6s ease-in forwards;
          animation-delay: var(--delay, 0ms);
        }
      `}</style>
    </div>
  );
};

ReactDOM.render(<ColorCascadePuzzle />, document.getElementById('root'));

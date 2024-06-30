const { useState, useEffect, useRef } = React;

// Simplified AlertDialog components
const AlertDialog = ({ open, children }) => open ? <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">{children}</div> : null;
const AlertDialogContent = ({ children, className }) => <div className={`bg-gray-800 p-6 rounded-lg ${className}`}>{children}</div>;
const AlertDialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
const AlertDialogFooter = ({ children }) => <div className="mt-4 flex justify-center space-x-2">{children}</div>;
const AlertDialogTitle = ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>;
const AlertDialogDescription = ({ children }) => <p>{children}</p>;
const AlertDialogAction = ({ children, ...props }) => <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" {...props}>{children}</button>;

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
const STAR_CHANCE = 0.2; // 1 in 5 chance

const CELL_TYPES = {
  NORMAL: 'normal',
  STAR: 'star',
  OBSTACLE: 'obstacle'
};

const isWithinRange = (x1, y1, x2, y2, range) => {
  return Math.abs(x1 - x2) <= range && Math.abs(y1 - y2) <= range;
};

const getAdjacentCells = (grid, x, y) => {
  return [
    [x-1, y], [x+1, y], [x, y-1], [x, y+1]
  ].filter(([nx, ny]) => nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE);
};

const ColorCascadePuzzle = () => {
  const [grid, setGrid] = useState([]);
  const [moves, setMoves] = useState(MAX_MOVES);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('menu');
  const [level, setLevel] = useState(1);
  const [completionColor, setCompletionColor] = useState(null);
  const [gameOverAnimation, setGameOverAnimation] = useState(false);
  const [baseScore, setBaseScore] = useState(0);
  const [moveRemainingBonus, setMoveRemainingBonus] = useState(0);
  const [showingScore, setShowingScore] = useState(false);
  const [multiplierTurnsLeft, setMultiplierTurnsLeft] = useState(0);
  const containerRef = useRef(null);

  const initializeGrid = () => {
    const newGrid = Array(GRID_SIZE).fill().map(() => 
      Array(GRID_SIZE).fill().map(() => ({
        type: CELL_TYPES.NORMAL,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      }))
    );
    
    // Place obstacles
    const obstacleCount = Math.min(Math.floor(level / 4), 3);
    placeObstacles(newGrid, obstacleCount);
    
    // Place star cell
    if (Math.random() < STAR_CHANCE) {
      placeStarCell(newGrid);
    }
    
    setGrid(newGrid);
  };

  const placeObstacles = (grid, count) => {
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);
      } while (!isValidObstaclePosition(grid, x, y));
      
      grid[y][x] = { type: CELL_TYPES.OBSTACLE, color: 'gray' };
    }
  };

  const isValidObstaclePosition = (grid, x, y) => {
    if (x === 0 && y === 0) return false;
    if (x <= 1 && y <= 1) return false;
    
    const adjacentCells = getAdjacentCells(grid, x, y);
    const obstacleCount = adjacentCells.filter(([nx, ny]) => grid[ny][nx].type === CELL_TYPES.OBSTACLE).length;
    return obstacleCount === 0;
  };

  const placeStarCell = (grid) => {
    let x, y;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    } while (!isValidStarPosition(grid, x, y));
    
    grid[y][x].type = CELL_TYPES.STAR;
  };

  const isValidStarPosition = (grid, x, y) => {
    if (isWithinRange(x, y, 0, 0, 5)) return false;
    if (isWithinRange(x, y, GRID_SIZE-1, GRID_SIZE-1, 3)) return false;
    return grid[y][x].type === CELL_TYPES.NORMAL;
  };

  const initializeGame = () => {
    initializeGrid();
    setMoves(MAX_MOVES);
    setScore(0);
    setBaseScore(0);
    setMoveRemainingBonus(0);
    setGameState('playing');
    setLevel(1);
    setCompletionColor(null);
    setGameOverAnimation(false);
    setShowingScore(false);
    setMultiplierTurnsLeft(0);
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

    const startColor = grid[0][0].color;
    if (startColor === newColor) return;

    const newGrid = grid.map(row => row.map(cell => ({...cell})));
    const stack = [[0, 0]];
    let changedCells = 0;

    while (stack.length > 0) {
      const [x, y] = stack.pop();

      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || 
          newGrid[y][x].type === CELL_TYPES.OBSTACLE || 
          newGrid[y][x].color !== startColor) {
        continue;
      }

      newGrid[y][x].color = newColor;
      changedCells++;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    setGrid(newGrid);
    setMoves(moves - 1);

    const pointsEarned = changedCells * (multiplierTurnsLeft > 0 ? 2 : 1);
    setScore(score + pointsEarned);
    setBaseScore(baseScore + pointsEarned);

    checkStarCapture(newGrid);

    if (multiplierTurnsLeft > 0) {
      setMultiplierTurnsLeft(multiplierTurnsLeft - 1);
    }

    if (isLevelComplete(newGrid)) {
      setCompletionColor(newColor);
      const moveRemainingBonus = moves * 25;
      setMoveRemainingBonus(moveRemainingBonus);
      setTimeout(() => {
        setGameState('levelComplete');
        setShowingScore(true);
      }, 2000);
    } else if (moves <= 1) {
      setGameOverAnimation(true);
      setTimeout(() => {
        setGameState('gameOver');
      }, 2000);
    }
  };

  const checkStarCapture = (grid) => {
    const starCell = grid.flat().find(cell => cell.type === CELL_TYPES.STAR);
    if (!starCell) return;

    const [starX, starY] = grid.reduce((acc, row, y) => {
      const x = row.findIndex(cell => cell.type === CELL_TYPES.STAR);
      return x !== -1 ? [x, y] : acc;
    }, [-1, -1]);

    const adjacentCells = getAdjacentCells(grid, starX, starY);
    const isCaptured = adjacentCells.every(([x, y]) => 
      grid[y][x].type === CELL_TYPES.OBSTACLE || 
      (grid[y][x].color === grid[0][0].color && isConnectedToStart(grid, x, y))
    );

    if (isCaptured) {
      const starBonus = 150 * (multiplierTurnsLeft > 0 ? 2 : 1);
      setScore(score + starBonus);
      setBaseScore(baseScore + starBonus);
      setMultiplierTurnsLeft(3);
      grid[starY][starX].type = CELL_TYPES.NORMAL;
    }
  };

  const isConnectedToStart = (grid, x, y) => {
    const startColor = grid[0][0].color;
    const visited = new Set();
    const stack = [[x, y]];

    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      const key = `${cx},${cy}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (cx === 0 && cy === 0) return true;

      const adjacentCells = getAdjacentCells(grid, cx, cy);
      for (const [nx, ny] of adjacentCells) {
        if (grid[ny][nx].color === startColor && grid[ny][nx].type !== CELL_TYPES.OBSTACLE) {
          stack.push([nx, ny]);
        }
      }
    }

    return false;
  };

  const isLevelComplete = (grid) => {
    const startColor = grid[0][0].color;
    return grid.every(row => row.every(cell => 
      cell.type === CELL_TYPES.OBSTACLE || 
      cell.type === CELL_TYPES.STAR || 
      cell.color === startColor
    ));
  };

  const nextLevel = () => {
    setScore(score + moveRemainingBonus);
    setBaseScore(0);
    setLevel(level + 1);
    initializeGrid();
    setMoves(MAX_MOVES);
    setMoveRemainingBonus(0);
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
      row.map((cell, colIndex) => {
        const index = rowIndex * GRID_SIZE + colIndex;
        const completionDelay = completionColor ? (rowIndex + colIndex) * 50 : 0;
        const fallDelay = gameOverAnimation ? ((2 * GRID_SIZE) - (rowIndex + colIndex)) * 50 : 0;
        const showStart = index === 0 && !completionColor && !gameOverAnimation;
        return (
          <div 
            key={`${rowIndex}-${colIndex}`}
            className={`aspect-square rounded-sm relative 
              ${index === 0 ? 'ring-2 ring-white' : ''} 
              ${completionColor ? 'animate-flip' : ''} 
              ${gameOverAnimation ? 'animate-fall' : ''}
              ${cell.type === CELL_TYPES.OBSTACLE ? 'bg-gray-600' : ''}
              ${cell.type === CELL_TYPES.STAR ? 'bg-yellow-400 star-cell' : ''}
            `}
            style={{ 
              backgroundColor: cell.type === CELL_TYPES.NORMAL ? cell.color : undefined,
              animationDelay: `${completionDelay}ms, ${fallDelay}ms`,
            }}
          >
            {showStart && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                Start
              </div>
            )}
            {cell.type === CELL_TYPES.STAR && (
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white animate-pulse">
                ★
              </div>
            )}
            {multiplierTurnsLeft > 0 && (
              <div className="absolute top-0 right-0 text-xs font-bold text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
                2x
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

  const renderLevelComplete = () => {
    return (
      <AlertDialog open={gameState === 'levelComplete'}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-600 to-blue-700 text-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-4xl font-bold text-center mb-6">Level {level} Complete!</AlertDialogTitle>
            <AlertDialogDescription className="text-xl space-y-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <p className="font-semibold">Level Score: <span className="float-right">{baseScore}</span></p>
                <p className="font-semibold">Moves Remaining: <span className="float-right">{moves}</span></p>
                <p className="font-semibold">Bonus: <span className="float-right">{moveRemainingBonus}</span></p>
                <div className="border-t border-white my-2"></div>
                <p className="font-bold text-2xl">Total Score: <span className="float-right">{score + moveRemainingBonus}</span></p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex justify-center">
            <AlertDialogAction 
              onClick={nextLevel} 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-200 transform hover:scale-105"
            >
              Next Level
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

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
      <style jsx="true" global="true">{`
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
  .star-cell {
    box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.7);
    z-index: 10;
  }
  @keyframes twinkle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .star-cell > div {
    animation: twinkle 1.5s infinite ease-in-out;
  }
`}</style>
    </div>
  );
};

ReactDOM.render(<ColorCascadePuzzle />, document.getElementById('root'));

import { useEffect, useState } from 'react';
import { LevelMap } from './components/LevelMap';
import { Game } from './components/Game';
import { getSeed, parseLevelId } from './logic/levels';

function App() {
  const [view, setView] = useState<'map' | 'game'>('map');
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  const [levelScores, setLevelScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedLevels = localStorage.getItem('freecell_completed_levels');
    const savedScores = localStorage.getItem('freecell_level_scores');

    if (savedLevels) {
      try {
        setCompletedLevels(JSON.parse(savedLevels));
      } catch (e) {
        console.error('Failed to parse completed levels', e);
      }
    }

    if (savedScores) {
      try {
        setLevelScores(JSON.parse(savedScores));
      } catch (e) {
        console.error('Failed to parse level scores', e);
      }
    }
  }, []);

  const handleLevelSelect = (levelId: string) => {
    setCurrentLevelId(levelId);
    setView('game');
  };

  const handleLevelComplete = (score: number) => {
    if (currentLevelId) {
      const newCompleted = [...completedLevels];
      if (!newCompleted.includes(currentLevelId)) {
        newCompleted.push(currentLevelId);
        setCompletedLevels(newCompleted);
        localStorage.setItem('freecell_completed_levels', JSON.stringify(newCompleted));
      }

      // Update score if it's the first time OR if the new score is lower (better)
      // Actually user said high usage = high difficulty. 
      // But typically for scoring we want to show the "best" performance.
      // If "difficulty" implies how hard it was *that run*, we might want to just overwrite?
      // Or maybe keep the lowest "difficulty score" achieved (meaning most efficient run)?
      // Let's keep the lowest score (fewest freecell moves).

      const currentBest = levelScores[currentLevelId];
      if (currentBest === undefined || score < currentBest) {
        const newScores = { ...levelScores, [currentLevelId]: score };
        setLevelScores(newScores);
        localStorage.setItem('freecell_level_scores', JSON.stringify(newScores));
      }
    }
    setView('map');
    setCurrentLevelId(null);
  };

  const handleBackToMap = () => {
    setView('map');
    setCurrentLevelId(null);
  };

  if (view === 'map') {
    return (
      <LevelMap
        completedLevels={completedLevels}
        levelScores={levelScores}
        onSelectLevel={handleLevelSelect}
      />
    );
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Freecell Quest</h1>
      <Game
        seed={(() => {
          if (!currentLevelId) return undefined;
          const parsed = parseLevelId(currentLevelId);
          return parsed ? getSeed(parsed.depth, parsed.side) : undefined;
        })()}
        onComplete={handleLevelComplete}
        onBack={handleBackToMap}
      />
    </div>
  );
}

export default App;

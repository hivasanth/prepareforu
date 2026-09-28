import './memoryGames.css'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/common/AntigravityCard'
import { getMemoryGameCatalogEntry, MEMORY_GAME_CATALOG } from '../../../config/memoryGames'

/**
 * Memory Games landing — the `/memory-games` home listing every shipped title
 * as a card (data-driven from the catalog, so a future game auto-appears here).
 */
export function MemoryGamesLanding() {
  const navigate = useNavigate()

  return (
    <div className="nmr-page">
      <div className="nmr-column nmr-landing-column">
        <header className="nmr-landing-header">
          <h1 className="nmr-landing-title">Memory Games</h1>
          <p className="nmr-landing-subtitle">
            Improve your working memory with quick, timed challenges — pick a
            title and go.
          </p>
        </header>

        <div className="memory-games-grid">
          {MEMORY_GAME_CATALOG.map((entry) => {
            const catalog = getMemoryGameCatalogEntry(entry.id)
            return (
              <Card key={entry.id} variant="elevated" className="memory-game-card">
                <button
                  type="button"
                  className="memory-game-card-link"
                  onClick={() => navigate(entry.route)}
                  aria-label={`Play ${entry.title}`}
                >
                  <span className="memory-game-card-icon" aria-hidden>
                    {catalog.icon}
                  </span>
                  <span className="memory-game-card-title">{entry.title}</span>
                  <span className="memory-game-card-subtitle">{entry.subtitle}</span>
                  <span className="memory-game-card-desc">{entry.description}</span>
                  <span className="memory-game-card-cta">
                    Play <span aria-hidden>→</span>
                  </span>
                </button>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
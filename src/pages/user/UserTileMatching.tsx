import './../../components/user/memory-games/memoryGames.css'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/common/AntigravityUI'
import { TileMatching } from '../../components/user/memory-games/TileMatching'

/** Tile Matching as a routed user page (wraps the game with a back link). */
export default function UserTileMatching() {
  const navigate = useNavigate()

  return (
    <div className="nmr-page">
      <div className="nmr-column">
        <div className="nmr-page-back">
          <Button variant="soft" size="sm" onClick={() => navigate('/memory-games')}>
            <ArrowLeft size={16} /> All memory games
          </Button>
        </div>
        <TileMatching />
      </div>
    </div>
  )
}
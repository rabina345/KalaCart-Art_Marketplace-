import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function Favorites({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data, error } = await supabase
        .from('favorites')
        .select('artwork_id, artworks(*, profiles!artworks_artist_id_fkey(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) console.error(error)
      else setItems(data.filter((f) => f.artworks))
      setLoading(false)
    }
    load()
  }, [user?.id])

  async function remove(artworkId) {
    setItems((prev) => prev.filter((f) => f.artwork_id !== artworkId))
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('artwork_id', artworkId)
  }

  if (!user) return <p>Please <Link to="/login">log in</Link> to see your favorites.</p>
  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h2>My Favorites</h2>
      {items.length === 0 ? (
        <p>
          You haven't saved anything yet. Tap the ♡ on an artwork to save it.{' '}
          <Link to="/">Browse art</Link>
        </p>
      ) : (
        <div className="gallery-grid">
          {items.map(({ artworks: a }) => (
            <div key={a.id} className="art-card">
              <Link to={`/artwork/${a.id}`} className="art-thumb">
                <img src={a.image_url} alt={a.title} />
                <span className="price-badge">
                  NRs {Number(a.price).toLocaleString('en-IN')}
                </span>
                {a.status !== 'available' && (
                  <span className={`status-label badge-${a.status}`}>
                    {a.status}
                  </span>
                )}
              </Link>
              <button
                className="heart active"
                onClick={() => remove(a.id)}
                aria-label="Remove from favorites"
                title="Remove from favorites"
              >
                ♥
              </button>
              <div className="art-body">
                <Link to={`/artwork/${a.id}`} className="art-title">
                  {a.title}
                </Link>
                <p className="muted">
                  {a.category} ·{' '}
                  <Link to={`/artist/${a.artist_id}`} className="artist-link">
                    {a.profiles?.name}
                  </Link>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
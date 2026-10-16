import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import useFavorites from './useFavorites'

const CATEGORIES = ['All', 'Drawing', 'Painting', 'Crochet', 'Sculpture', 'Other']

export default function Gallery({ refreshKey, user }) {
  const navigate = useNavigate()
  const { ids: favIds, toggle } = useFavorites(user)

  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('newest')
  const [hideSold, setHideSold] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('artworks')
        .select('*, profiles!artworks_artist_id_fkey(name)')
        .order('created_at', { ascending: false })
      if (error) console.error(error)
      else setArtworks(data)
      setLoading(false)
    }
    load()
  }, [refreshKey])

  const term = search.trim().toLowerCase()

  const visible = artworks
    .filter((a) => category === 'All' || a.category === category)
    .filter((a) => !hideSold || a.status === 'available')
    .filter(
      (a) =>
        !term ||
        a.title.toLowerCase().includes(term) ||
        (a.description || '').toLowerCase().includes(term) ||
        (a.profiles?.name || '').toLowerCase().includes(term)
    )
    .sort((a, b) => {
      if (sort === 'low') return a.price - b.price
      if (sort === 'high') return b.price - a.price
      return 0
    })

  if (loading) return <p>Loading...</p>

  return (
    <div id="gallery">
      <h2>Gallery</h2>

      <div className="filters">
        <input
          placeholder="Search title, description or artist"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={hideSold}
            onChange={(e) => setHideSold(e.target.checked)}
          />{' '}
          Available only
        </label>
      </div>

      <p className="muted">
        {visible.length} {visible.length === 1 ? 'artwork' : 'artworks'}
      </p>

      {visible.length === 0 ? (
        <p>No artworks match your search.</p>
      ) : (
        <div className="gallery-grid">
          {visible.map((a) => (
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
                className={`heart ${favIds.includes(a.id) ? 'active' : ''}`}
                onClick={() => (user ? toggle(a.id) : navigate('/login'))}
                aria-label="Save to favorites"
                title="Save to favorites"
              >
                {favIds.includes(a.id) ? '♥' : '♡'}
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
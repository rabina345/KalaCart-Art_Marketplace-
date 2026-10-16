import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import useFavorites from './useFavorites'

export default function ArtworkDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ids: favIds, toggle } = useFavorites(user)

  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('artworks')
        .select('*, profiles!artworks_artist_id_fkey(name)')
        .eq('id', id)
        .single()
      if (error) console.error(error)
      else setArtwork(data)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!user || !artwork) {
      setWhatsapp('')
      return
    }
    supabase
      .from('contacts')
      .select('whatsapp')
      .eq('id', artwork.artist_id)
      .maybeSingle()
      .then(({ data }) => setWhatsapp(data?.whatsapp || ''))
  }, [user, artwork])

  async function handleInquire(e) {
    e.preventDefault()
    setSending(true)
    setStatus('')
    const { error } = await supabase.from('orders').insert({
      artwork_id: artwork.id,
      buyer_id: user.id,
      message,
    })
    setStatus(error ? error.message : 'Request sent! The artist will see it.')
    if (!error) setMessage('')
    setSending(false)
  }

  async function handleDelete() {
    const ok = window.confirm(
      'Delete this artwork? Any requests for it will be deleted too. This cannot be undone.'
    )
    if (!ok) return

    const { error } = await supabase.from('artworks').delete().eq('id', artwork.id)
    if (error) return setStatus(error.message)

    const path = artwork.image_url.split('/artworks/')[1]
    if (path) await supabase.storage.from('artworks').remove([path])

    navigate('/')
  }

  if (loading) return <p>Loading...</p>
  if (!artwork) return <p>Artwork not found. <Link to="/">Back to gallery</Link></p>

  const isOwner = user && user.id === artwork.artist_id

  return (
    <div>
      <Link to="/">← Back to gallery</Link>

      <div className="artwork-page">
        <div className="artwork-image">
          <img src={artwork.image_url} alt={artwork.title} />
        </div>

        <div className="artwork-info">
          <p className="artwork-category">{artwork.category}</p>
          <h2>{artwork.title}</h2>
          <p className="artwork-price">
            NRs {Number(artwork.price).toLocaleString('en-IN')}
          </p>
          <span className={`badge badge-${artwork.status}`}>{artwork.status}</span>

          {!isOwner && (
            <button
              className={`btn-fav ${favIds.includes(artwork.id) ? 'active' : ''}`}
              onClick={() => (user ? toggle(artwork.id) : navigate('/login'))}
            >
              {favIds.includes(artwork.id) ? '♥ Saved' : '♡ Save to favorites'}
            </button>
          )}

          {artwork.description && (
            <p className="artwork-description">{artwork.description}</p>
          )}

          <p>
            <strong>Artist:</strong>{' '}
            <Link to={`/artist/${artwork.artist_id}`}>{artwork.profiles?.name}</Link>
          </p>

          {!isOwner && user && whatsapp && (
            <p>
              <a
                className="btn btn-outline"
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Hi! I'm interested in your artwork "${artwork.title}" on KalaCart.`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                💬 Chat on WhatsApp
              </a>
            </p>
          )}

          {isOwner ? (
            <div>
              <Link to={`/artwork/${artwork.id}/edit`} className="btn">Edit</Link>{' '}
              <button className="danger" onClick={handleDelete}>Delete</button>
              <p>{status}</p>
            </div>
          ) : !user ? (
            <p>
              <Link to="/login">Log in</Link> to send an inquiry.
            </p>
          ) : artwork.status !== 'available' ? (
            <p>This artwork is no longer available.</p>
          ) : (
            <form onSubmit={handleInquire}>
              <h3>Interested? Send a request</h3>
              <textarea
                placeholder="Write a message to the artist (e.g. your phone number, delivery location)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <button type="submit" disabled={sending}>
                {sending ? 'Sending...' : 'Send inquiry'}
              </button>
              <p>{status}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function ArtistProfile({ user }) {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: p } = await supabase
        .from('profiles')
        .select('id, name, bio, avatar_url, created_at')
        .eq('id', id)
        .maybeSingle()

      const { data: a } = await supabase
        .from('artworks')
        .select('*')
        .eq('artist_id', id)
        .order('created_at', { ascending: false })

      setProfile(p)
      setArtworks(a || [])
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!user) {
      setWhatsapp('')
      return
    }
    supabase
      .from('contacts')
      .select('whatsapp')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setWhatsapp(data?.whatsapp || ''))
  }, [user, id])

  if (loading) return <p>Loading...</p>
  if (!profile) {
    return (
      <p>
        Artist not found. <Link to="/">Back to gallery</Link>
      </p>
    )
  }

  const isOwner = user && user.id === profile.id
  const joined = new Date(profile.created_at).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <Link to="/">← Back to gallery</Link>

      <div className="artist-header">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="artist-avatar" />
        ) : (
          <div className="artist-avatar artist-initial">
            {(profile.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 style={{ margin: 0 }}>{profile.name}</h2>
          <p className="muted">
            Member since {joined} · {artworks.length}{' '}
            {artworks.length === 1 ? 'artwork' : 'artworks'}
          </p>
          {profile.bio && <p>{profile.bio}</p>}

          {isOwner ? (
            <Link to="/profile">Edit your profile</Link>
          ) : user && whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                `Hi ${profile.name}! I found your work on KalaCart.`
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              💬 Chat on WhatsApp
            </a>
          ) : !user ? (
            <p className="muted">Log in to contact this artist.</p>
          ) : null}
        </div>
      </div>

      <h3 style={{ marginTop: '28px' }}>Artworks by {profile.name}</h3>
      {artworks.length === 0 ? (
        <p>No artworks yet.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {artworks.map((a) => (
            <Link
              key={a.id}
              to={`/artwork/${a.id}`}
              className="art-card"
              style={{ width: '220px', textDecoration: 'none', color: 'inherit' }}
            >
              <img
                src={a.image_url}
                alt={a.title}
                style={{ width: '100%', height: '220px', objectFit: 'cover' }}
              />
              <h3>{a.title}</h3>
              <p>
                {a.category} · NRs {Number(a.price).toLocaleString('en-IN')}
              </p>
              {a.status !== 'available' && <p><strong>{a.status}</strong></p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
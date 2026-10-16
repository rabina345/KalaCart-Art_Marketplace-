import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

const CATEGORIES = ['Drawing', 'Painting', 'Crochet', 'Sculpture', 'Other']

export default function EditArtwork({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Drawing')
  const [status, setStatus] = useState('available')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (data) {
        setArtwork(data)
        setTitle(data.title)
        setDescription(data.description || '')
        setPrice(String(data.price))
        setCategory(data.category || 'Other')
        setStatus(data.status)
      }
      setLoading(false)
    }
    load()
  }, [id])

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      return setMessage('Please choose an image file.')
    }
    if (f.size > 5 * 1024 * 1024) {
      return setMessage('Photo must be smaller than 5 MB.')
    }
    setMessage('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setSaving(true)

    let imageUrl = artwork.image_url

    // 1. If a new photo was chosen, upload it first
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('artworks')
        .upload(path, file)
      if (upErr) {
        setSaving(false)
        return setMessage(upErr.message)
      }
      imageUrl = supabase.storage.from('artworks').getPublicUrl(path).data.publicUrl
    }

    // 2. Update the row
    const { error } = await supabase
      .from('artworks')
      .update({
        title: title.trim(),
        description,
        price: Number(price),
        category,
        status,
        image_url: imageUrl,
      })
      .eq('id', artwork.id)

    if (error) {
      setSaving(false)
      return setMessage(error.message)
    }

    // 3. Remove the old photo from storage (only after the update worked)
    if (file) {
      const oldPath = artwork.image_url.split('/artworks/')[1]
      if (oldPath) await supabase.storage.from('artworks').remove([oldPath])
    }

    setSaving(false)
    navigate(`/artwork/${artwork.id}`)
  }

  if (loading) return <p>Loading...</p>
  if (!artwork) {
    return <p>Artwork not found. <Link to="/">Back to gallery</Link></p>
  }
  if (!user || user.id !== artwork.artist_id) {
    return <p>You can only edit your own artworks.</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <Link to={`/artwork/${artwork.id}`}>← Cancel</Link>
      <h2>Edit artwork</h2>

      <img
        src={preview || artwork.image_url}
        alt={title}
        style={{ width: '200px', height: '200px', objectFit: 'cover', marginBottom: '10px' }}
      />
      <label>Change photo (optional, max 5 MB)</label>
      <input type="file" accept="image/*" onChange={handleFile} />

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        min="1"
        step="0.01"
        placeholder="Price (NRs)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <label>Status</label>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="available">Available</option>
        <option value="reserved">Reserved</option>
        <option value="sold">Sold</option>
      </select>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </button>
      <p>{message}</p>
    </form>
  )
}
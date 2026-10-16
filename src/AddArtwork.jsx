import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function AddArtwork({ user, onAdded }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Drawing')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setMessage('Please choose a photo.')
      return
    }
    setLoading(true)
    setMessage('')

    // 1. Upload the photo into a folder named after the user
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(path, file)

    if (uploadError) {
      setMessage(uploadError.message)
      setLoading(false)
      return
    }

    // 2. Get the public link to the photo
    const { data } = supabase.storage.from('artworks').getPublicUrl(path)

    // 3. Save the artwork in the database
    const { error: insertError } = await supabase.from('artworks').insert({
      artist_id: user.id,
      title,
      description,
      price: Number(price),
      category,
      image_url: data.publicUrl,
    })

    if (insertError) {
      setMessage(insertError.message)
    } else {
      setMessage('Artwork added!')
      setTitle('')
      setDescription('')
      setPrice('')
      setFile(null)
      e.target.reset()
      onAdded()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add an artwork</h2>
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
        min="0"
        step="0.01"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option>Drawing</option>
        <option>Painting</option>
        <option>Crochet</option>
        <option>Sculpture</option>
        <option>Other</option>
      </select>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Add artwork'}
      </button>
      <p>{message}</p>
    </form>
  )
}
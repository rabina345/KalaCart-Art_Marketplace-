import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function normalize(num) {
  let digits = num.replace(/\D/g, '')
  if (digits.startsWith('977')) digits = digits.slice(3)
  return digits
}

function isValid(local) {
  return /^9[678]\d{8}$/.test(local)
}

export default function ProfileSettings({ user }) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: p } = await supabase
        .from('profiles')
        .select('name, bio, avatar_url')
        .eq('id', user.id)
        .single()
      const { data: c } = await supabase
        .from('contacts')
        .select('whatsapp')
        .eq('id', user.id)
        .maybeSingle()
      setName(p?.name || '')
      setBio(p?.bio || '')
      setAvatarUrl(p?.avatar_url || '')
      setWhatsapp(c?.whatsapp ? c.whatsapp.replace(/^977/, '') : '')
      setLoading(false)
    }
    load()
  }, [user])

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Photo must be smaller than 2 MB.')
      return
    }
    setMessage('')
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    setMessage('')

    const local = normalize(whatsapp)
    const hasNumber = whatsapp.trim() !== ''
    if (hasNumber && !isValid(local)) {
      return setMessage(
        'Please enter a valid 10-digit Nepali mobile number, e.g. 98XXXXXXXX'
      )
    }

    setSaving(true)
    let newAvatarUrl = avatarUrl

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile)
      if (upErr) {
        setSaving(false)
        return setMessage(upErr.message)
      }
      newAvatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    }

    const { error: e1 } = await supabase
      .from('profiles')
      .update({ name, bio, avatar_url: newAvatarUrl || null })
      .eq('id', user.id)
    if (e1) {
      setSaving(false)
      return setMessage(e1.message)
    }

    const { error: e2 } = await supabase
      .from('contacts')
      .upsert({ id: user.id, whatsapp: hasNumber ? '977' + local : null })
    if (e2) {
      setSaving(false)
      return setMessage(e2.message)
    }

    setAvatarUrl(newAvatarUrl)
    setAvatarFile(null)
    setWhatsapp(local)
    setSaving(false)
    setMessage('Saved!')
  }

  if (!user) return <p>Please log in to edit your profile.</p>
  if (loading) return <p>Loading...</p>

  const shown = preview || avatarUrl

  return (
    <form onSubmit={handleSave}>
      <h2>My Profile</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        {shown ? (
          <img src={shown} alt="" className="artist-avatar" />
        ) : (
          <div className="artist-avatar artist-initial">
            {(name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <label>Profile photo (max 2 MB)</label>
          <input type="file" accept="image/*" onChange={handleFile} />
        </div>
      </div>

      <input
        placeholder="Display name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <textarea
        placeholder="About you / your art"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />
      <input
        type="tel"
        inputMode="numeric"
        maxLength={14}
        placeholder="WhatsApp number (e.g. 98XXXXXXXX)"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
      />
      <p>Your number is only visible to logged-in users.</p>
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      <p>{message}</p>
    </form>
  )
}
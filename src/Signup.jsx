import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function handleReset() {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirm('')
    setMessage('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    if (fullName.trim().length < 2) {
      return setMessage('Please enter your full name.')
    }
    if (password.length < 6) {
      return setMessage('Password must be at least 6 characters.')
    }
    if (password !== confirm) {
      return setMessage('Passwords do not match.')
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    setLoading(false)

    if (error) return setMessage(error.message)

    if (data.session) {
      navigate('/') // logged in straight away
    } else {
      setMessage('Account created! Check your email to confirm, then log in.')
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <img src="/kalacart.png" alt="KalaCart" className="auth-logo" />
      <h2>Create Your Account</h2>
      <p className="auth-sub">A marketplace where creativity finds its people.</p>

      <label>Full Name *</label>
      <input
        placeholder="Your full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      <label>Email *</label>
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label>Password *</label>
      <input
        type="password"
        placeholder="Min 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <label>Confirm Password *</label>
      <input
        type="password"
        placeholder="Repeat your password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      <div className="auth-buttons">
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : '✓ Create Account'}
        </button>
        <button type="button" className="secondary" onClick={handleReset}>
          Reset
        </button>
      </div>

      {message && <p className="auth-message">{message}</p>}

      <p className="auth-footer">
        Already have an account? <Link to="/login">Log in here</Link>
      </p>
    </form>
  )
}
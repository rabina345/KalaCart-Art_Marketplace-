import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function Auth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage(error.message)
    else navigate('/')
  }

  return (
    <form className="auth-card" onSubmit={handleLogin}>
      <img src="/kalacart.png" alt="KalaCart" className="auth-logo" />
      <h2>Welcome Back</h2>
      <p className="auth-sub">Log in to your KalaCart account</p>

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
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="auth-buttons">
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </div>

      {message && <p className="auth-message">{message}</p>}

      <p className="auth-footer">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </form>
  )
}
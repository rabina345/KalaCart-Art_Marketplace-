import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import useNotifications from './useNotifications'
import Auth from './Auth'
import Signup from './Signup'
import AddArtwork from './AddArtwork'
import EditArtwork from './EditArtwork'
import Gallery from './Gallery'
import ArtworkDetail from './ArtworkDetail'
import ArtistProfile from './ArtistProfile'
import Favorites from './Favorites'
import MyOrders from './MyOrders'
import MyShop from './MyShop'
import ProfileSettings from './ProfileSettings'

function Hero() {
  return (
    <section className="hero">
      <h2>Handmade art from Nepal</h2>
      <p>
        Drawings, paintings, crochet and sculptures, straight from the artists
        who made them.
      </p>
      <div className="hero-buttons">
        <a href="#gallery" className="btn">Browse art</a>
        <Link to="/signup" className="btn btn-outline">Start selling</Link>
      </div>
    </section>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const user = session?.user
  const { shopCount, orderCount, refresh } = useNotifications(user)

  return (
    <div>
      <header className="site-header">
        <h1>
          <Link to="/" className="brand">
            <img src="/kalacart.png" alt="" width="60" height="60" />
            <span>KalaCart</span>
          </Link>
        </h1>
        <p className="tagline">Discover Art. Own What You Love.</p>
      </header>

      <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link to="/">Browse</Link>
        {user && <Link to="/add">+ Add artwork</Link>}
        {user && <Link to="/favorites">♥ Favorites</Link>}
        {user && (
          <Link to="/my-orders">
            My Orders {orderCount > 0 && <b className="notif">{orderCount}</b>}
          </Link>
        )}
        {user && (
          <Link to="/my-shop">
            My Shop {shopCount > 0 && <b className="notif">{shopCount}</b>}
          </Link>
        )}
        {user && <Link to={`/artist/${user.id}`}>My Profile</Link>}
        {!user && <Link to="/login">Log in</Link>}
        {!user && <Link to="/signup">Sign up</Link>}
        {user && <span>{user.email}</span>}
        {user && <button onClick={() => supabase.auth.signOut()}>Log out</button>}
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              {!user && <Hero />}
              <Gallery user={user} />
            </div>
          }
        />
        <Route
          path="/add"
          element={
            user ? (
              <AddArtwork user={user} onAdded={() => navigate('/')} />
            ) : (
              <p>Please log in to add an artwork.</p>
            )
          }
        />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        <Route path="/artwork/:id" element={<ArtworkDetail user={user} />} />
        <Route path="/artwork/:id/edit" element={<EditArtwork user={user} />} />
        <Route path="/artist/:id" element={<ArtistProfile user={user} />} />
        <Route path="/favorites" element={<Favorites user={user} />} />
        <Route path="/my-orders" element={<MyOrders user={user} onSeen={refresh} />} />
        <Route path="/my-shop" element={<MyShop user={user} onSeen={refresh} />} />
        <Route path="/profile" element={<ProfileSettings user={user} />} />
      </Routes>
    </div>
  )
}

export default App
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function MyShop({ user, onSeen }) {
  const [orders, setOrders] = useState([])
  const [newIds, setNewIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(first = false) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, artworks!inner(id, title, image_url, price, artist_id), profiles(name)')
      .eq('artworks.artist_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setOrders(data)
      if (first) {
        const unseen = data.filter((o) => !o.seller_seen).map((o) => o.id)
        if (unseen.length) {
          setNewIds(unseen)
          await supabase.rpc('mark_shop_orders_seen')
          onSeen()
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) load(true)
  }, [user?.id])

  async function updateStatus(order, orderStatus, artworkStatus) {
    setError('')
    // buyer_seen: false tells the buyer there is an update
    const { error: e1 } = await supabase
      .from('orders')
      .update({ status: orderStatus, buyer_seen: false })
      .eq('id', order.id)
    if (e1) return setError(e1.message)

    if (artworkStatus) {
      const { error: e2 } = await supabase
        .from('artworks')
        .update({ status: artworkStatus })
        .eq('id', order.artworks.id)
      if (e2) return setError(e2.message)
    }
    load()
  }

  if (!user) return <p>Please log in to see your shop.</p>
  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h2>My Shop: incoming requests</h2>
      {error && <p>{error}</p>}
      {orders.length === 0 && <p>No requests yet.</p>}
      {orders.map((o) => (
        <div
          key={o.id}
          className={`order-row ${newIds.includes(o.id) ? 'order-new' : ''}`}
        >
          <img src={o.artworks.image_url} alt="" />
          <div>
            {newIds.includes(o.id) && <span className="new-tag">New</span>}
            <Link to={`/artwork/${o.artworks.id}`}>{o.artworks.title}</Link>
            <p>NRs {Number(o.artworks.price).toLocaleString('en-IN')}</p>
            <p>
              From: <Link to={`/artist/${o.buyer_id}`}>{o.profiles?.name}</Link>
            </p>
            <p>Message: {o.message}</p>
            <p><strong>Status:</strong> {o.status}</p>

            {o.status === 'pending' && (
              <>
                <button onClick={() => updateStatus(o, 'accepted', 'reserved')}>
                  Accept
                </button>
                <button onClick={() => updateStatus(o, 'declined', null)}>
                  Decline
                </button>
              </>
            )}
            {o.status === 'accepted' && (
              <button onClick={() => updateStatus(o, 'completed', 'sold')}>
                Mark as sold
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
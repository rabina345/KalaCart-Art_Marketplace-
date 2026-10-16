import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

const STATUS_TEXT = {
  pending: 'Waiting for the artist to respond',
  accepted: 'Accepted! The artist has reserved it for you',
  declined: 'Declined by the artist',
  completed: 'Completed',
}

export default function MyOrders({ user, onSeen }) {
  const [orders, setOrders] = useState([])
  const [newIds, setNewIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, artworks(id, title, image_url, price)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setOrders(data)
        const unseen = data.filter((o) => !o.buyer_seen).map((o) => o.id)
        if (unseen.length) {
          setNewIds(unseen)
          await supabase.rpc('mark_my_orders_seen')
          onSeen()
        }
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  if (!user) return <p>Please log in to see your orders.</p>
  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h2>My Orders</h2>
      {orders.length === 0 && <p>You haven't requested anything yet.</p>}
      {orders.map((o) => (
        <div
          key={o.id}
          className={`order-row ${newIds.includes(o.id) ? 'order-new' : ''}`}
        >
          <img src={o.artworks?.image_url} alt="" />
          <div>
            {newIds.includes(o.id) && <span className="new-tag">Updated</span>}
            <Link to={`/artwork/${o.artworks?.id}`}>{o.artworks?.title}</Link>
            <p>NRs {Number(o.artworks?.price).toLocaleString('en-IN')}</p>
            <p>Your message: {o.message}</p>
            <p>
              <strong>Status:</strong> {STATUS_TEXT[o.status] || o.status}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
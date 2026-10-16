import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function useNotifications(user) {
  const uid = user?.id
  const location = useLocation()
  const [shopCount, setShopCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!uid) {
      setShopCount(0)
      setOrderCount(0)
      return
    }

    // New requests for my artworks
    const shop = await supabase
      .from('orders')
      .select('id, artworks!inner(artist_id)', { count: 'exact', head: true })
      .eq('artworks.artist_id', uid)
      .eq('seller_seen', false)

    // Updates on orders I placed
    const mine = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', uid)
      .eq('buyer_seen', false)

    setShopCount(shop.count || 0)
    setOrderCount(mine.count || 0)
  }, [uid])

  // Refresh on login and whenever the page changes
  useEffect(() => {
    refresh()
  }, [refresh, location.pathname])

  // Also check every 30 seconds
  useEffect(() => {
    const timer = setInterval(refresh, 30000)
    return () => clearInterval(timer)
  }, [refresh])

  return { shopCount, orderCount, refresh }
}
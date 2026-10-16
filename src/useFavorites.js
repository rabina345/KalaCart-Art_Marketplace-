import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function useFavorites(user) {
  const uid = user?.id
  const [ids, setIds] = useState([])

  useEffect(() => {
    if (!uid) {
      setIds([])
      return
    }
    supabase
      .from('favorites')
      .select('artwork_id')
      .eq('user_id', uid)
      .then(({ data }) => setIds((data || []).map((f) => f.artwork_id)))
  }, [uid])

  const toggle = useCallback(
    async (artworkId) => {
      if (!uid) return
      const has = ids.includes(artworkId)

      // Update the heart instantly, then save
      setIds((prev) =>
        has ? prev.filter((i) => i !== artworkId) : [...prev, artworkId]
      )

      const { error } = has
        ? await supabase
            .from('favorites')
            .delete()
            .eq('user_id', uid)
            .eq('artwork_id', artworkId)
        : await supabase
            .from('favorites')
            .insert({ user_id: uid, artwork_id: artworkId })

      // If saving failed, undo the change
      if (error) {
        console.error(error)
        setIds((prev) =>
          has ? [...prev, artworkId] : prev.filter((i) => i !== artworkId)
        )
      }
    },
    [uid, ids]
  )

  return { ids, toggle }
}
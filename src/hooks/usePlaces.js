import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  orderBy, query, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'places'

function toDate(ts) {
  if (!ts) return null
  if (ts instanceof Timestamp) return ts.toDate().toISOString()
  return ts
}

function normalize(snap) {
  const d = snap.data()
  return {
    ...d,
    id: snap.id,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    photos: d.photos || [],
    videos: d.videos || [],
    tags: d.tags || [],
    comments: (d.comments || []).map(c => ({ ...c, date: toDate(c.date) })),
    gps: d.gps || { lat: '', lng: '' },
    rating: d.rating || 0,
  }
}

export function usePlaces() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setPlaces(snap.docs.map(normalize))
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addPlace = useCallback(async (data) => {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchAll()
    return ref.id
  }, [fetchAll])

  const updatePlace = useCallback(async (id, data) => {
    await updateDoc(doc(db, COL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    await fetchAll()
  }, [fetchAll])

  const deletePlace = useCallback(async (id) => {
    await deleteDoc(doc(db, COL, id))
    setPlaces(prev => prev.filter(p => p.id !== id))
  }, [])

  return { places, loading, error, addPlace, updatePlace, deletePlace, refetch: fetchAll }
}

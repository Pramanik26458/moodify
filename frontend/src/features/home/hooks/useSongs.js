import { useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'

const useSongs = () => {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // emotionLabel here is ALREADY the clean mood string e.g. "happy", "sad"
  // (FaceExpression calls getMoodValue before firing onClick, so no double-conversion needed)
  const handleGetSong = async ({ mood: moodValue }) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching songs for mood: ${moodValue}`)

      const response = await axios.get('http://localhost:3000/api/songs', {
        params: { mood: moodValue },
        withCredentials: true
      })

      if (response.data?.songs && response.data.songs.length > 0) {
        setSongs(response.data.songs)
        toast.success(`Loaded ${response.data.songs.length} songs for "${moodValue}" mood 🎵`)
      } else {
        console.warn(`No songs found for mood: ${moodValue}`)
        setSongs([])
        toast.info(`No songs found for "${moodValue}"`)
      }
    } catch (err) {
      console.error('Error fetching songs:', err)
      setError(err.message)
      setSongs([])
      toast.error(err.response?.data?.message || 'Failed to fetch songs')
    } finally {
      setLoading(false)
    }
  }

  return { songs, loading, error, handleGetSong }
}

export default useSongs

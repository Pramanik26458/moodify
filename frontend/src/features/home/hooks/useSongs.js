import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const useSongs = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetSong = async ({ mood }) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching songs for mood: ${mood}`);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/songs`,
        {
          params: { mood },
          withCredentials: true,
        }
      );

      if (response.data?.songs?.length > 0) {
        setSongs(response.data.songs);
        toast.success(
          `Loaded ${response.data.songs.length} songs for "${mood}" mood 🎵`
        );
      } else {
        setSongs([]);
        toast.info(`No songs found for "${mood}"`);
      }
    } catch (err) {
      console.error("Error fetching songs:", err);
      setError(err.message);
      setSongs([]);
      toast.error(err.response?.data?.message || "Failed to fetch songs");
    } finally {
      setLoading(false);
    }
  };

  return {
    songs,
    loading,
    error,
    handleGetSong,
  };
};

export default useSongs;
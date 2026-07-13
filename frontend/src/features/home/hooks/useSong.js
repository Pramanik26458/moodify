import { useContext } from "react";
import { toast } from "react-toastify";
import { songContext } from "../song.context";
import { getSong } from "../service/song.api";

export const useSong = () => {
  const context = useContext(songContext);

  if (!context) {
    throw new Error("useSong must be used inside SongContextProvider");
  }

  const { loading, setLoading, song, setSong } = context;

  async function handleGetSong(mood) {
    try {
      setLoading(true);
      const data = await getSong({ mood });

      if (data?.song) {
        setSong(data.song);
        return true;
      } else {
        toast.warn("No song found for this mood");
        return false;
      }
    } catch (error) {
      console.error("Error fetching song:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch song");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, song, handleGetSong };
};

import { createContext, useState } from "react";

const songContext = createContext();

const SongContextProvider = ({ children }) => {

  const [song, setSong] = useState({
    url: "https://ik.imagekit.io/devCodex/Moodify/songs/Chillgum_ZUJFLTC8J.mp3",
    posterUrl: "https://ik.imagekit.io/devCodex/Moodify/poster/Chillgum_uRbLsoRcL.jpeg",
    title: "Chillgum",
    mood: "happy",
  });

  const [loading, setLoading] = useState(false);

  return (
    <songContext.Provider
      value={{
        loading,
        setLoading,
        song,
        setSong,
      }}
    >
      {children}
    </songContext.Provider>
  );
};

export { songContext, SongContextProvider };
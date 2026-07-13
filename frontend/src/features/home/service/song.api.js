import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export async function getSong({ mood }) {
  const response = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/songs`,
  {
    params: { mood: moodValue },
    withCredentials: true,
  }
);
  return response.data;
}
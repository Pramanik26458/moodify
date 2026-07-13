import { useContext } from "react";

import { toast } from "react-toastify";

import { AuthContext } from "../auth.context";

import { register, login, logout } from "../services/auth.api";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  const { user, setUser, loading, setLoading } = context;

  // ================= REGISTER =================

  async function handleRegister({ username, email, password }) {
    try {
      setLoading(true);

      const data = await register({
        username,
        email,
        password,
      });

      setUser(data.user);

      toast.success("Registration successful 🎉");

      return true;
    } catch (error) {
      console.log(error);

      toast.error(error?.response?.data?.message || "Registration failed");

      return false;
    } finally {
      setLoading(false);
    }
  }

  // ================= LOGIN =================

  async function handleLogin({ email, password }) {
    try {
      setLoading(true);

      const data = await login({
        email,
        password,
      });

      setUser(data.user);

      toast.success("Login successful 🚀");

      return true;
    } catch (error) {
      console.log(error);

      toast.error(
        error?.response?.data?.message || "Invalid email or password",
      );

      return false;
    } finally {
      setLoading(false);
    }
  }

  // ================= LOGOUT =================

  async function handleLogout() {
    try {
      setLoading(true);

      await logout();

      setUser(null);

      toast.success("Logged out successfully 👋");

      return true;
    } catch (error) {
      console.log(error);

      toast.error("Logout failed");

      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    user,
    loading,
    handleRegister,
    handleLogin,
    handleLogout,
  };
};


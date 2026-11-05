import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));

  const setToken = useCallback((token) => {
    setAccessToken(token);
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, []);

  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Try to refresh
        try {
          const res = await authService.refresh();
          setToken(res.data.accessToken);
          const meRes = await authService.getMe();
          setUser(meRes.data.user);
        } catch {
          setToken(null);
          setUser(null);
        }
      } else {
        try {
          const res = await authService.getMe();
          setUser(res.data.user);
        } catch (err) {
          if (err.response?.status === 401) {
            try {
              const refreshRes = await authService.refresh();
              setToken(refreshRes.data.accessToken);
              const meRes = await authService.getMe();
              setUser(meRes.data.user);
            } catch {
              setToken(null);
              setUser(null);
            }
          }
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    const { accessToken: token, user: userData } = res.data;
    setToken(token);
    setUser(userData);
    return userData;
  }, [setToken]);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    return res.data;
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const res = await authService.googleLogin(credential);
    const { accessToken: token, user: userData } = res.data;
    setToken(token);
    setUser(userData);
    return userData;
  }, [setToken]);

  const facebookLogin = useCallback(async (data) => {
    const res = await authService.facebookLogin(data);
    const { accessToken: token, user: userData } = res.data;
    setToken(token);
    setUser(userData);
    return userData;
  }, [setToken]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors during logout
    }
    setToken(null);
    setUser(null);
  }, [setToken]);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = {
    user,
    loading,
    accessToken,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    googleLogin,
    facebookLogin,
    logout,
    updateUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

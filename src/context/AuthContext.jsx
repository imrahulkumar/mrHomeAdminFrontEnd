import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api
      .get('/auth/me')
      .then(({ user }) => (user.role === 'admin' ? setUser(user) : logout()))
      .catch(logout)
      .finally(() => setChecking(false));
  }, [logout]);

  const login = async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    if (user.role !== 'admin') throw new Error('This account does not have admin access.');
    tokenStore.set(token);
    setUser(user);
  };

  return <AuthContext.Provider value={{ user, checking, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

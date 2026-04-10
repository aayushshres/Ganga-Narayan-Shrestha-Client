import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/index';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((data) => {
        setIsAuthenticated(true);
        setUsername(data.username);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (u: string, password: string) => {
    const data = await apiLogin(u, password);
    setIsAuthenticated(true);
    setUsername(data.username);
  };

  const logout = async () => {
    await apiLogout().catch(() => {});
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

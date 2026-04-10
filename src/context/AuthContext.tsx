import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, setToken } from '../api/index';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!sessionStorage.getItem("admin_token"),
  );
  const [username, setUsername] = useState<string | null>(
    () => sessionStorage.getItem("admin_username"),
  );

  const login = async (u: string, password: string) => {
    const data = await apiLogin(u, password);
    setToken(data.token);
    sessionStorage.setItem("admin_username", data.username);
    setIsAuthenticated(true);
    setUsername(data.username);
  };

  const logout = async () => {
    await apiLogout().catch(() => {});
    setToken(null);
    sessionStorage.removeItem("admin_username");
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading: false, username, login, logout }}>
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

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { useSession } from 'next-auth/react';

// Define the shape of your decoded JWT payload for type safety
interface UserPayload {
  email: string; // Or whatever data you put in your JWT
  iat: number;
  exp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserPayload | null;
  token: string | null;
  isLoading: boolean; // Crucial for initial page load
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session } = useSession();
  const [user, setUser] = useState<UserPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      if (session?.token) {
        const token = session.token;
        try {
          const decoded = jwtDecode<UserPayload>(token);
          if (decoded.exp * 1000 > Date.now()) {
            setToken(token);
            setUser(decoded);
            localStorage.setItem('token', token);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('AuthProvider: Invalid token from session', error);
          localStorage.removeItem('token');
        }
        setIsLoading(false);
        return;
      } else {
        const localToken = localStorage.getItem('token');
        if (localToken) {
          try {
            const decoded = jwtDecode<UserPayload>(localToken);
            if (decoded.exp * 1000 > Date.now()) {
              setToken(localToken);
              setUser(decoded);
            } else {
              console.log('AuthProvider: Token from localStorage expired.');
              localStorage.removeItem('token');
            }
          } catch (error) {
            console.error('AuthProvider: Invalid token in localStorage', error);
            localStorage.removeItem('token');
          }
        }
        setIsLoading(false);
        return;
      }
    };

    initializeAuth();
  }, [session]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

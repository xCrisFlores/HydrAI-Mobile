import { API_URL_LOCAL } from '@/urls/urls';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';


type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
  id: number | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [id, setId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, password: string): Promise<boolean> => {

    const url = API_URL_LOCAL;
    
    
    console.log("=== LOGIN DEBUG ===");
    console.log("URL:", url);
    console.log("Email:", email);
    
    setIsLoading(true);
    
    try {
      console.log("Enviando petición...");
      
      const response = await fetch(url+'/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log("Status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Data recibida:", data);
        setToken(data.token);
        setId(data.user.id);
        console.log(data.user.id);
        
        setIsLoading(false);
        return true;
      } else {
        const errorText = await response.text();
        console.log("Error:", errorText);
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setId(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      token, 
      id,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
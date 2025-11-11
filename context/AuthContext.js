import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);

  // Charger le token au démarrage de l'app
  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
      }
    };
    loadToken();
  }, []);

  // ---- LOGIN ----
 const login = async (email, password) => {
  console.log('🔹 Attempting to connect with:', email, password);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`,{
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('🔹 Status HTTP:', response.status);
    const data = await response.json();
    console.log('🔹 Backend response:', data);

    if (response.ok) {
      await AsyncStorage.setItem('token', data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      console.log('✅ Authentication successful! Token saved.');
    } else {
      console.warn('⚠️ Login failed:', data.message || 'Invalid credentials');
      alert(data.message || 'Invalid credentials');
    }
  } catch (error) {
    console.error('🔥 Network error:', error);
    alert('Server connection error');
  }
};


  // ---- LOGOUT ----
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      await AsyncStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

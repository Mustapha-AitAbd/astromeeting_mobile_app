import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  console.log('🔹 Tentative de connexion avec:', email, password);

  try {
    const response = await fetch('https://puny-insects-wash.loca.lt/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('🔹 Status HTTP:', response.status);
    const data = await response.json();
    console.log('🔹 Réponse backend:', data);

    if (response.ok) {
      await AsyncStorage.setItem('token', data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      console.log('✅ Authentification réussie ! Token enregistré.');
    } else {
      console.warn('⚠️ Échec du login:', data.message || 'Invalid credentials');
      alert(data.message || 'Identifiants invalides');
    }
  } catch (error) {
    console.error('🔥 Erreur réseau:', error);
    alert('Erreur de connexion au serveur');
  }
};


  // ---- LOGOUT ----
  const logout = async () => {
    try {
      if (token) {
        await fetch('https://puny-insects-wash.loca.lt/api/auth/logout', {
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

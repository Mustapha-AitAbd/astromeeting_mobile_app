import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_API_URL } from '@env';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le token au démarrage de l'app
  useEffect(() => {
    loadUserData();
  }, []);

  // Charger les données utilisateur depuis AsyncStorage
  const loadUserData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUser = await AsyncStorage.getItem('user');

      console.log('📱 Loading stored data...');
      console.log('Token:', storedToken ? 'EXISTS' : 'NOT FOUND');
      console.log('UserId:', storedUserId);

      if (storedToken) {
        setToken(storedToken);
        
        // Si on a le userId, on est authentifié
        if (storedUserId) {
          setIsAuthenticated(true);
          
          // Charger les infos user si disponibles
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          
          // Récupérer les infos à jour depuis l'API
          await fetchUserProfile(storedToken);
        } else {
          // On a le token mais pas le userId, il faut le récupérer
          console.log('⚠️ Token found but no userId, fetching user profile...');
          await fetchUserProfile(storedToken);
        }
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer le profil utilisateur depuis l'API
  const fetchUserProfile = async (authToken) => {
    try {
      console.log('🔍 Fetching user profile...');
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User profile fetched:', userData);
        
        // Sauvegarder les données utilisateur
        await AsyncStorage.setItem('userId', userData._id);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ UserId saved:', userData._id);
      } else {
        console.error('❌ Failed to fetch user profile:', response.status);
        // Token invalide, déconnecter
        await logout();
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  // ---- LOGIN WITH EMAIL/PASSWORD ----
  const login = async (email, password) => {
    console.log('🔹 Attempting to connect with:', email);

    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "true"
         },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔹 Status HTTP:', response.status);
      const data = await response.json();
      console.log('🔹 Backend response:', data);

      if (response.ok) {
        // Sauvegarder le token
        await AsyncStorage.setItem('token', data.token);
        setToken(data.token);
        
        console.log('✅ Token saved, fetching user profile...');
        
        // Récupérer le profil utilisateur
        await fetchUserProfile(data.token);
        
        console.log('✅ Authentication successful!');
        return { success: true };
      } else {
        console.warn('⚠️ Login failed:', data.message || 'Invalid credentials');
        return { success: false, message: data.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('🔥 Network error:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  // ✅ NOUVELLE FONCTION - LOGIN WITH EXISTING TOKEN
  const loginWithToken = async (authToken) => {
    console.log('🔹 Logging in with existing token...');

    try {
      // Sauvegarder le token
      await AsyncStorage.setItem('token', authToken);
      setToken(authToken);
      
      console.log('✅ Token saved, fetching user profile...');
      
      // Récupérer le profil utilisateur
      await fetchUserProfile(authToken);
      
      console.log('✅ Authentication with token successful!');
      return { success: true };
    } catch (error) {
      console.error('🔥 Error logging in with token:', error);
      return { success: false, message: 'Failed to authenticate with token' };
    }
  };

  // ---- LOGOUT ----
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Nettoyer tout AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ Logged out successfully');
    }
  };

  // ---- REGISTER ----
  const register = async (userData) => {
    console.log('🔹 Attempting to register...');

    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "true"
         },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('🔹 Registration response:', data);

      if (response.ok) {
        // Après l'inscription, connecter automatiquement
        if (data.token) {
          await AsyncStorage.setItem('token', data.token);
          setToken(data.token);
          await fetchUserProfile(data.token);
          console.log('✅ Registration successful!');
          return { success: true };
        }
      } else {
        console.warn('⚠️ Registration failed:', data.message);
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('🔥 Registration error:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login,
      loginWithToken, // ✅ Ajouter cette nouvelle fonction
      logout, 
      register,
      token,
      user,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
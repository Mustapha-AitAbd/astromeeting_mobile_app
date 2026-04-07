import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// ✅ FIX 1 : valeur par défaut complète — évite le crash useContext
export const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  loginWithToken: async () => ({ success: false }),
  logout: async () => {},
  register: async () => ({ success: false }),
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken]                     = useState(null);
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);

  // ── Clear session (sans appel API) ─────────────────────────
  // ✅ FIX 2 : séparé de logout pour éviter la boucle infinie
  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'userId', 'user']);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ── Fetch profile ───────────────────────────────────────────
  const fetchUserProfile = useCallback(async (authToken) => {
    try {
      console.log('🔍 Fetching user profile...');
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        await AsyncStorage.setItem('userId', userData._id);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ User profile fetched:', userData._id);
      } else {
        // ✅ FIX 3 : on appelle clearSession et non logout
        // pour éviter la boucle infinie fetch → erreur → logout → fetch
        console.warn('❌ Token invalide, clearing session...');
        await clearSession();
      }
    } catch (error) {
      // Erreur réseau : on ne déconnecte pas, le token peut être valide
      console.warn('⚠️ Network error fetching profile (keeping session):', error.message);
    }
  }, [clearSession]);

  // ── Load session au démarrage ───────────────────────────────
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedToken  = await AsyncStorage.getItem('token');
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUser   = await AsyncStorage.getItem('user');

        console.log('📱 Token:', storedToken ? 'EXISTS' : 'NOT FOUND');

        if (storedToken) {
          setToken(storedToken);

          if (storedUserId) {
            setIsAuthenticated(true);
            if (storedUser) setUser(JSON.parse(storedUser));
          }

          // Rafraîchit le profil en arrière-plan
          await fetchUserProfile(storedToken);
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      } finally {
        // ✅ FIX 4 : TOUJOURS appelé — débloque le loading
        setLoading(false);
      }
    };

    loadUserData();
  }, [fetchUserProfile]);

  // ── Login ───────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);
        setToken(data.token);
        await fetchUserProfile(data.token);
        return { success: true };
      }

      return { success: false, message: data.message || 'Invalid credentials' };
    } catch (error) {
      console.error('🔥 Network error:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  // ── Login with token ────────────────────────────────────────
  const loginWithToken = async (authToken) => {
    try {
      await AsyncStorage.setItem('token', authToken);
      setToken(authToken);
      await fetchUserProfile(authToken);
      return { success: true };
    } catch (error) {
      console.error('🔥 Error logging in with token:', error);
      return { success: false, message: 'Failed to authenticate with token' };
    }
  };

  // ── Logout ──────────────────────────────────────────────────
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('Logout API call failed (continuing anyway):', err.message);
    } finally {
      await clearSession();
      console.log('✅ Logged out successfully');
    }
  };

  // ── Register ────────────────────────────────────────────────
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        await AsyncStorage.setItem('token', data.token);
        setToken(data.token);
        await fetchUserProfile(data.token);
        return { success: true };
      }

      return { success: false, message: data.message || 'Registration failed' };
    } catch (error) {
      console.error('🔥 Registration error:', error);
      return { success: false, message: 'Server connection error' };
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      token,
      user,
      loading,
      login,
      loginWithToken,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
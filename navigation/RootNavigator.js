import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import HomeNavigator from './HomeNavigator';
import { AuthContext } from '../context/AuthContext';

export default function RootNavigator() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  // null  = not checked yet
  // true  = user has already seen onboarding
  // false = first launch, show onboarding
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding'); // ← TEMP : force l'onboarding
      setHasSeenOnboarding(false);
    } catch (_) {
      setHasSeenOnboarding(false);
    }
  };
  // Show loader while auth OR onboarding flag are still loading
  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B3A8B" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated
        ? <HomeNavigator />
        // Pass hasSeenOnboarding so AuthNavigator picks the right initial route
        : <AuthNavigator hasSeenOnboarding={hasSeenOnboarding} />
      }
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B3A8B',   // matches app theme
  },
});
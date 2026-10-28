/**
 * SMART ATTENDANCE & SHIFT MANAGER
 * Entry Point ứng dụng React Native + TypeScript
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md & Master Prompt
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationProvider } from './src/navigation/NavigationContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { MainAppScreen } from './src/screens/MainAppScreen';
import { EmployeeAppScreen } from './src/screens/employee/EmployeeAppScreen';
import { subscribeToAuthState } from './src/services/firebase/authService';
import { User } from './src/types/user';
import { COLORS } from './src/constants/colors';

function App() {
  const [initializing, setInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Theo dõi trạng thái phiên đăng nhập của Admin
    // Theo dõi trạng thái phiên đăng nhập của Admin & Employee
    const unsubscribe = subscribeToAuthState(state => {
      if (state.isAuthenticated && state.user) {
        setCurrentUser(state.user);
      } else {
        setCurrentUser(null);
      }
      setInitializing(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang kết nối hệ thống Firebase...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationProvider>
        {currentUser ? (
          currentUser.role === 'admin' ? (
            <MainAppScreen user={currentUser} />
          ) : (
            <EmployeeAppScreen user={currentUser} />
          )
        ) : (
          <LoginScreen />
        )}
      </NavigationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.slate300,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default App;

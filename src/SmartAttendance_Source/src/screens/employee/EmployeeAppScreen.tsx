import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { User } from '../../types/user';
import { logout } from '../../services/firebase/authService';
import { EmployeeDashboardScreen } from './EmployeeDashboardScreen';
import { EmployeeHistoryScreen } from './EmployeeHistoryScreen';
import { EmployeeProfileScreen } from './EmployeeProfileScreen';
import { EmployeeShiftsScreen } from './EmployeeShiftsScreen';

interface EmployeeAppScreenProps {
  user: User;
}

export type EmployeeScreenView = 'MENU' | 'HISTORY' | 'PROFILE' | 'SHIFTS';

export const EmployeeAppScreen: React.FC<EmployeeAppScreenProps> = ({ user }) => {
  const [view, setView] = useState<EmployeeScreenView>('MENU');

  const employeeId = user.employeeId || 'NV001';

  const renderCurrentView = () => {
    switch (view) {
      case 'HISTORY':
        return (
          <EmployeeHistoryScreen
            employeeId={employeeId}
            onBack={() => setView('MENU')}
          />
        );
      case 'PROFILE':
        return (
          <EmployeeProfileScreen
            employeeId={employeeId}
            onBack={() => setView('MENU')}
          />
        );
      case 'SHIFTS':
        return (
          <EmployeeShiftsScreen
            employeeId={employeeId}
            uid={user.uid}
            onBack={() => setView('MENU')}
          />
        );
      case 'MENU':
      default:
        return (
          <EmployeeDashboardScreen
            employeeId={employeeId}
            onLogout={logout}
            onNavigate={setView}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderCurrentView()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

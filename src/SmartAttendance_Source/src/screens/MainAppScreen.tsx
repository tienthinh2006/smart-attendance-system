import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Header } from '../components/common/Header';
import { BottomTabBar } from '../components/common/BottomTabBar';
import { DashboardScreen } from './DashboardScreen';
import { EmployeesScreen } from './EmployeesScreen';
import { ShiftsScreen } from './ShiftsScreen';
import { AttendanceHistoryScreen } from './AttendanceHistoryScreen';
import { ReportsScreen } from './ReportsScreen';
import { useNavigation } from '../navigation/NavigationContext';
import { User } from '../types/user';
import { COLORS } from '../constants/colors';

interface MainAppScreenProps {
  user: User | null;
}

export const MainAppScreen: React.FC<MainAppScreenProps> = ({ user }) => {
  const { activeTab } = useNavigation();

  const getScreenTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Tổng quan vận hành';
      case 'employees':
        return 'Quản lý nhân viên';
      case 'shifts':
        return 'Quản lý ca làm';
      case 'history':
        return 'Lịch sử chấm công';
      case 'reports':
        return 'Báo cáo & Thống kê';
      default:
        return 'Smart Attendance';
    }
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'employees':
        return <EmployeesScreen />;
      case 'shifts':
        return <ShiftsScreen />;
      case 'history':
        return <AttendanceHistoryScreen />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Top Header */}
      <Header title={getScreenTitle()} user={user} />

      {/* Main Tab Screen Content */}
      <View style={styles.content}>{renderActiveScreen()}</View>

      {/* Bottom Navigation */}
      <BottomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
});

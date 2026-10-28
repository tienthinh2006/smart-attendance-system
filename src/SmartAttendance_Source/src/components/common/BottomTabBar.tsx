import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { useNavigation, MainTab } from '../../navigation/NavigationContext';

interface TabItem {
  key: MainTab;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: '📊' },
  { key: 'employees', label: 'Nhân viên', icon: '👥' },
  { key: 'shifts', label: 'Ca làm', icon: '⏰' },
  { key: 'history', label: 'Chấm công', icon: '📋' },
  { key: 'reports', label: 'Báo cáo', icon: '📈' },
];

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigation();

  return (
    <View style={styles.tabBar}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingVertical: 8,
    paddingBottom: 16,
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  tabButtonActive: {},
  tabIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 3,
  },
});


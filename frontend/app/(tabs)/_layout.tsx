import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

function TabButton({ children, onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected;
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.tabButton,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 },
      ]}
    >
      {children}
      <View style={[styles.dot, focused && styles.dotActive]} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#3D4A5C',
        tabBarStyle: [styles.tabBar, { height: 64 + insets.bottom }],
        tabBarLabelStyle: styles.label,
        tabBarButton: (props) => <TabButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color }) => (
            <Feather name="pie-chart" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#050A14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.12)',
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  dotActive: {
    backgroundColor: '#10B981',
  },
});
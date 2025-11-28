import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../../screens/HomeScreen';
import CalendarScreen from '../../screens/CalendarScreen';
import TaskScreen from '../../screens/TaskScreen';
import RewardsScreen from '../../screens/RewardsScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import AuthScreen from '../../screens/AuthScreen'; // Assuming you have an AuthScreen
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { User } from '../../types/users';

// Define Tab Navigator types
export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Tasks: undefined;
  Rewards: undefined;
  Profile: undefined;
  Auth: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Define Stack Navigator types (if needed for nested screens within tabs)
export type MainStackParamList = {
    MainTabs: undefined;
    // Add other screens here that might be navigated to from tabs
};

const MainStack = createStackNavigator<MainStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthScreen />
      ) : (
        <MainStack.Navigator screenOptions={{ headerShown: false }}>
            <MainStack.Screen name="MainTabs" component={MainTabsNavigator} />
            {/* Other screens that don't belong in the tab bar can be defined here */}
        </MainStack.Navigator>
      )}
    </NavigationContainer>
  );
};

const MainTabsNavigator: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Determine which tabs to show based on user role
  const showTasksAndRewards = currentUser?.role === 'child'; // Example: only children see these prominently
  const showProfile = true; // Everyone sees profile

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Rewards') {
            iconName = focused ? 'gift' : 'gift-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // You can return any component that displays a symbol
          return <Ionicons name={iconName!} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          display: route.name === 'Auth' ? 'none' : 'flex', // Hide tab bar if on Auth screen
        },
        headerShown: false, // We'll handle headers within each screen if needed
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      {currentUser?.role === 'parent' && (
         <Tab.Screen name="Tasks" component={TaskScreen} />
      )}
       {currentUser?.role === 'child' && (
          <Tab.Screen name="Rewards" component={RewardsScreen} />
       )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;

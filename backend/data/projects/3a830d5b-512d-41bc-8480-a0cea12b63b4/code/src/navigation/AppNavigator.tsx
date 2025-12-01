import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { View, Text, Button } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectCurrentUser, logoutUser } from '../store/auth';
import AuthNavigator from './AuthNavigator';
import { useAppDispatch } from '../store/hooks';

// Import necessary screens for the main app flow
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import CreateHabitScreen from '../screens/Habits/CreateHabitScreen';

// Define the navigator for the main app section
const MainAppStack = createNativeStackNavigator<RootStackParamList>();

const MainAppNavigator: React.FC = () => {
  return (
    <MainAppStack.Navigator
      initialRouteName="Dashboard" // Set Dashboard as the initial screen after login
      screenOptions={{ headerShown: true, headerStyle: { backgroundColor: 'rgb(59, 130, 246)' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}
    >
      <MainAppStack.Screen 
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }} // Hide header for the dashboard itself if preferred
      />
      <MainAppStack.Screen 
        name="CreateHabit"
        component={CreateHabitScreen}
        options={{ title: 'New Habit'}}
      />
      {/* Add other main app screens here */}
    </MainAppStack.Navigator>
  );
}


const AppNavigator: React.FC = () => {
  // Get the current user from the Redux store using the selector
  const user = useSelector(selectCurrentUser);

  return (
    <NavigationContainer>
      {
        // Conditionally render either the AuthNavigator or the Main App Navigator
        // based on whether the user is currently logged in.
        user ? <MainAppNavigator /> : <AuthNavigator /> 
      }
    </NavigationContainer>
  );
};

export default AppNavigator;

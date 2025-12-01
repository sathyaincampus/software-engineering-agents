import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from './types';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

// Create the stack navigator for authentication-related screens
const AuthStack = createNativeStackNavigator<RootStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    // Configure the navigator
    <AuthStack.Navigator 
      initialRouteName="Login" // Start with the Login screen
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f0f0f0', // Example header background color
        },
        headerTintColor: '#333', // Example header text color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Define each screen */} 
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false // Hide header for the login screen itself
        }} 
      />
      <AuthStack.Screen 
        name="SignUp" 
        component={SignUpScreen}
        options={{ 
          title: 'Sign Up'
        }} 
      />
      <AuthStack.Screen 
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ 
          title: 'Reset Password'
        }} 
      />
      {/* Add other auth-related screens here if needed */}
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;

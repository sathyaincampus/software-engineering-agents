import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import AuthLoadingScreen from './AuthLoadingScreen';
import { RootStackParamList } from '../../navigation/AppNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const AuthNavigator: React.FC = () => {
    return (
        <Stack.Navigator 
            screenOptions={{ headerShown: false }} 
            initialRouteName="AuthLoading"
        >
            <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            {/* Add other auth-related screens like ForgotPassword, VerifyEmail etc. here */}
        </Stack.Navigator>
    );
};

export default AuthNavigator;

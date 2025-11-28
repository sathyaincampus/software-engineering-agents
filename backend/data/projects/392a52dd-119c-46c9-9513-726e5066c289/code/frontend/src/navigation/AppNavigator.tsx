import React from 'react';
import {
    NavigationContainer,
    useNavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import AuthLoadingScreen from '../screens/Auth/AuthLoadingScreen';
import MainAppNavigator from '../screens/MainApp/MainAppNavigator'; 
import { AppState } from '../store/store';

export type RootStackParamList = {
    AuthLoading: undefined;
    Login: undefined;
    Signup: undefined;
    MainApp: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
    const navigationRef = useNavigationContainerRef();
    const { isAuthenticated, loading } = useSelector((state: AppState) => state.auth);

    if (loading === 'pending') {
        return <AuthLoadingScreen />; 
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <RootStack.Screen name="MainApp" component={MainAppNavigator} />
                ) : (
                    <RootStack.Screen name="AuthLoading" component={AuthLoadingScreen} />
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;

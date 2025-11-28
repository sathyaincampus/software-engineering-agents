import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { checkAuthStatus } from '../../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AuthLoadingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AuthLoading'>;

const AuthLoadingScreen: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<AuthLoadingScreenNavigationProp>();
    const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const bootstrapAsync = async () => {
            // Check if token exists and is potentially valid
            // In a real app, this might involve verifying the token locally or via an API call
            // For now, we just check if a token is present in the store
            let userToken: string | null = null;
            if (token) {
                userToken = token;
            }

            // Simulate checking authentication status
            // If you have a mechanism to refresh token or validate it, do it here.
            const authStatus = await dispatch(checkAuthStatus(userToken));

            if (authStatus.payload.isAuthenticated) {
                navigation.navigate('MainApp');
            } else {
                navigation.navigate('Login');
            }
        };

        bootstrapAsync();
    }, [dispatch, navigation, token]); // Add dependencies

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading App...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    }
});

export default AuthLoadingScreen;

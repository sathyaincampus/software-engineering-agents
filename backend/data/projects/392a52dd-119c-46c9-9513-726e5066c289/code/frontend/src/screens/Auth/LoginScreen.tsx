import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Title, Provider as PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { login, googleLogin } from '../../store/slices/authSlice'; // Assuming authSlice handles auth actions
import { AppDispatch } from '../../store/store';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Mock Google Sign-In function for now
const handleGoogleSignIn = async () => {
    console.log('Initiating Google Sign-In...');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    return {
        user: { displayName: 'Google User', email: 'google@example.com' },
        token: 'mock_google_token_12345'
    };
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const navigation = useNavigation<LoginScreenNavigationProp>();
    const dispatch = useDispatch<AppDispatch>();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Validation Error', 'Please enter your email and password.');
            return;
        }
        setLoading(true);
        try {
            // Dispatch login action
            await dispatch(login({ email, password })).unwrap();
            // Navigate to the main app screen upon successful login
            navigation.navigate('MainApp');
        } catch (error: any) {
            console.error('Login failed:', error);
            Alert.alert('Login Failed', error.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const googleAuthResponse = await handleGoogleSignIn();
            // Dispatch googleLogin action
            await dispatch(googleLogin(googleAuthResponse)).unwrap();
            // Navigate to the main app screen upon successful login
            navigation.navigate('MainApp'); 
        } catch (error: any) {
            console.error('Google login failed:', error);
            Alert.alert('Google Login Failed', error.message || 'Failed to log in with Google.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Title style={styles.title}>Welcome Back!</Title>
            <Text style={styles.subtitle}>Log in to your FamilyFlow account</Text>

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon name="email" />}
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon name="lock" />}
                right={
                    <TextInput.Icon 
                        name={isPasswordVisible ? 'eye-off' : 'eye'}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    />
                }
            />

            <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                icon="login"
            >
                Log In
            </Button>

            <Text style={styles.dividerText}>or</Text>

            <Button
                mode="outlined"
                onPress={handleGoogleLogin}
                loading={loading}
                disabled={loading}
                style={styles.googleButton}
                icon={() => <Icon name="google" size={20} />}
            >
                Log In with Google
            </Button>

            <View style={styles.signupContainer}>
                <Text>Don't have an account? </Text>
                <Button onPress={() => navigation.navigate('Signup')} color="#007bff">
                    Sign Up
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        textAlign: 'center',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 10,
        paddingVertical: 10,
        backgroundColor: '#007bff', // Different primary color for login
    },
    dividerText: {
        textAlign: 'center',
        marginVertical: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    googleButton: {
        marginTop: 5,
        paddingVertical: 10,
        borderColor: '#ccc',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
        alignItems: 'center',
    },
});

export default LoginScreen;

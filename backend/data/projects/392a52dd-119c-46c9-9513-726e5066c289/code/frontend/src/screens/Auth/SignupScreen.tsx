import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Title, Provider as PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { signup, googleLogin } from '../../store/slices/authSlice'; // Assuming authSlice handles auth actions
import { AppDispatch } from '../../store/store';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Mock Google Sign-In function for now
const handleGoogleSignIn = async () => {
    // In a real app, you would use a library like 'react-native-google-signin'
    // or 'expo-google-sign-in'
    console.log('Initiating Google Sign-In...');
    // Simulate a successful sign-in returning user info and a token
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    return {
        user: { displayName: 'Google User', email: 'google@example.com' },
        token: 'mock_google_token_12345'
    };
};

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const navigation = useNavigation<SignupScreenNavigationProp>();
    const dispatch = useDispatch<AppDispatch>();

    const handleSignup = async () => {
        if (!email || !password || !displayName) {
            Alert.alert('Validation Error', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            // Dispatch signup action (assuming it returns a promise)
            await dispatch(signup({ email, password, displayName })).unwrap();
            Alert.alert('Success', 'Account created successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('Login'), // Navigate to Login after signup
                },
            ]);
        } catch (error: any) {
            console.error('Signup failed:', error);
            Alert.alert('Signup Failed', error.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        try {
            const googleAuthResponse = await handleGoogleSignIn();
            // Dispatch googleLogin action with the token and user info
            await dispatch(googleLogin(googleAuthResponse)).unwrap();
            // Navigate to the main app screen (e.g., Dashboard)
            navigation.navigate('MainApp'); 
        } catch (error: any) {
            console.error('Google signup failed:', error);
            Alert.alert('Google Signup Failed', error.message || 'Failed to sign up with Google.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Title style={styles.title}>Create Your Account</Title>

            <TextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon name="account" />}
            />
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
                onPress={handleSignup}
                loading={loading}
                disabled={loading}
                style={styles.button}
                icon="account-plus"
            >
                Sign Up
            </Button>

            <Text style={styles.dividerText}>or</Text>

            <Button
                mode="outlined"
                onPress={handleGoogleSignup}
                loading={loading}
                disabled={loading}
                style={styles.googleButton}
                icon={() => <Icon name="google" size={20} />}
            >
                Sign Up with Google
            </Button>

            <View style={styles.loginContainer}>
                <Text>Already have an account? </Text>
                <Button onPress={() => navigation.navigate('Login')} color="#007bff">
                    Log In
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
        marginBottom: 30,
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#fff', // White background for inputs
    },
    button: {
        marginTop: 10,
        paddingVertical: 10,
        backgroundColor: '#6200ee', // Primary color
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
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
        alignItems: 'center',
    },
});

export default SignupScreen;

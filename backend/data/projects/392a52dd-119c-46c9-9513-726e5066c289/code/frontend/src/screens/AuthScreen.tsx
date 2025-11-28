import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppDispatch } from '../redux/store';
import { signup, login, googleSignIn } from '../redux/slices/authSlice';
import * as Google from 'expo-google-app-auth';

type AuthStackParamList = {
  Auth: undefined;
  Profile: undefined; // Add other screens as needed
};

type AuthScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Auth'>;

const AuthScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch: AppDispatch = useDispatch();
  const navigation = useNavigation<AuthScreenNavigationProp>();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await dispatch(login({ email, password })).unwrap();
        Alert.alert('Success', 'Logged in successfully!');
        // Navigate to Profile or Dashboard
        navigation.navigate('Profile'); 
      } else {
        // Signup
        await dispatch(signup({ email, password, displayName })).unwrap();
        Alert.alert('Success', 'Account created successfully!');
         // Navigate to Profile or Dashboard
        navigation.navigate('Profile'); 
      }
    } catch (error: any) {
      Alert.alert('Error', error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { type, accessToken, user } = await Google.logInAsync({
        androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual Android Client ID
        iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual iOS Client ID
        scopes: ['profile', 'email'],
      });

      if (type === 'success' && accessToken && user) {
        // Backend will handle the rest using the accessToken to verify user info
        await dispatch(googleSignIn({ token: accessToken })).unwrap();
        Alert.alert('Success', 'Logged in with Google successfully!');
        navigation.navigate('Profile'); 
      } else {
        Alert.alert('Google Sign-In Failed', 'Could not authenticate with Google.');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', error.message || 'An error occurred during Google Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.title, { color: theme.colors.text }]}>{isLogin ? 'Login' : 'Sign Up'}</Text>

      {!isLogin && (
        <TextInput
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          mode="outlined"
          style={styles.input}
          disabled={loading}
        />
      )}

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        style={styles.input}
        disabled={loading}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        disabled={loading}
      />

      <Button mode="contained" onPress={handleAuth} style={styles.button} loading={loading} disabled={loading}>
        {isLogin ? 'Login' : 'Sign Up'}
      </Button>
      
      <Button mode="outlined" onPress={handleGoogleSignIn} style={[styles.button, styles.googleButton]} icon="google" loading={loading} disabled={loading}>
        Continue with Google
      </Button>

      <Button mode="text" onPress={() => setIsLogin(!isLogin)} style={styles.toggleButton} disabled={loading}>
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 10, // Adjust button height
  },
  googleButton: {
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  toggleButton: {
    marginTop: 20,
  },
});

export default AuthScreen;

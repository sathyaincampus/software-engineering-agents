import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Input, Button, Center, Heading, VStack, Link } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { registerUser } from '../../store/auth/authThunks';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

const SignUpScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const dispatch = useAppDispatch();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      // Dispatch the registerUser thunk
      await dispatch(registerUser({ email, password })).unwrap();
      // Navigation to Dashboard/Onboarding is handled by the listener in store/auth/authSlice
      // which updates the Redux state, causing AppNavigator to switch views.
    } catch (error: any) {
      console.error("Sign up error:", error);
      Alert.alert('Sign Up Failed', error.message || 'An unknown error occurred. Please try again.');
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <Center flex={1} px="3">
      <VStack space="5" alignItems="center" w="90%" maxW="400px">
        <Heading size="lg">Create Your Account</Heading>
        <VStack space="3" w="100%">
          <Input 
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            size="lg"
            variant="filled"
          />
          <Input 
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            type="password"
            size="lg"
            variant="filled"
          />
          <Input 
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            type="password"
            size="lg"
            variant="filled"
          />
        </VStack>
        <Button onPress={handleSignUp} w="100%" size="lg">
          Sign Up
        </Button>
        <Text fontSize="sm" color="coolGray.600">Already have an account?</Text>
        <Link onPress={handleNavigateToLogin} _text={{ color: 'blue.500', fontWeight: 'bold', fontSize: 'md' }}>
          Login
        </Link>
      </VStack>
    </Center>
  );
};

export default SignUpScreen;

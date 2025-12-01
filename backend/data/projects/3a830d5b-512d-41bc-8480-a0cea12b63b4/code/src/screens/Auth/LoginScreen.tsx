import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Input, Button, Center, Heading, VStack, Link, Box, Text, Icon } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';

import { RootStackParamList } from '../../navigation/types';
import { loginUser, selectAuthError, clearAuthError } from '../../store/auth';
import { AppDispatch } from '../../store/store';

// Dummy Icon component for demonstration if react-native-vector-icons is not set up
// Replace with actual import if using the library, e.g., from 'react-native-vector-icons/Ionicons'
const DummyIcon = ({ name, size, color }) => (
  <Box style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text color={color}>{name}</Text> 
  </Box>
);

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const authError = useSelector(selectAuthError);

  // Effect to handle authentication errors
  useEffect(() => {
    if (authError) {
      Alert.alert('Login Failed', authError);
      // Optionally clear the error state after displaying it
      // dispatch(clearAuthError()); 
    }
  }, [authError, dispatch]);

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Login Error', 'Please enter both email and password.');
      return;
    }

    try {
      // Dispatch the loginUser thunk
      await dispatch(loginUser({ email, password })).unwrap();
      // Navigation is handled by AppNavigator based on the Redux state change.
    } catch (error: any) {
      // The error is already managed by the Redux state via the thunk's rejected case.
      // We catch here to prevent the default Redux error logging if needed, 
      // but the Alert is shown by the useEffect hook.
      console.error("Login attempt failed via dispatch:", error);
    }
  };

  const handleNavigateToSignUp = () => {
    dispatch(clearAuthError()); // Clear error before navigating
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    dispatch(clearAuthError()); // Clear error before navigating
    navigation.navigate('ForgotPassword');
  };

  return (
    <Center flex={1} px="3" bg="coolGray.50">
      <VStack space="5" alignItems="center" w="90%" maxW="400px">
        <Heading size="2xl" color="primary.500" mb="2">MicroHabitFlow</Heading>
        <Heading size="lg" color="coolGray.700">Welcome Back!</Heading>
        
        <VStack space="4" w="100%">
          <Input 
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            size="lg"
            variant="filled"
            focusOutlineColor="blue.500"
            // Using DummyIcon as placeholder. Replace with actual icons.
            InputLeftElement={<Box px="3"><DummyIcon name='✉️' size={20} color="muted.400" /></Box>}
          />
          <Input 
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            type="password"
            size="lg"
            variant="filled"
            focusOutlineColor="blue.500"
            // Using DummyIcon as placeholder. Replace with actual icons.
            InputLeftElement={<Box px="3"><DummyIcon name='🔒' size={20} color="muted.400" /></Box>}
          />
          <Link onPress={handleForgotPassword} _text={{ fontSize: 'sm', color: 'blue.600', fontWeight:'medium' }} alignSelf="flex-end">
            Forgot Password?
          </Link>
        </VStack>
        
        <Button onPress={handleLogin} w="100%" size="lg" colorScheme="blue">
          Login
        </Button>
        
        <Text fontSize="sm" color="coolGray.600">Don't have an account?</Text>
        <Link onPress={handleNavigateToSignUp} _text={{ color: 'blue.500', fontWeight: 'bold', fontSize: 'md' }}>
          Sign Up
        </Link>
      </VStack>
    </Center>
  );
};

export default LoginScreen;

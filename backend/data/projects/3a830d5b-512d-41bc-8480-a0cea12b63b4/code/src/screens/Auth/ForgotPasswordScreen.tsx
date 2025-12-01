import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Input, Button, Center, Heading, VStack, Box } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { sendPasswordResetEmail } from '../../store/auth/authThunks';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const dispatch = useAppDispatch();

  const handleResetPassword = async () => {
    try {
      await dispatch(sendPasswordResetEmail(email)).unwrap();
      Alert.alert(
        'Password Reset Sent',
        'Please check your email for instructions on how to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Password Reset Failed', error.message || 'Please check your email address and try again.');
    }
  };

  return (
    <Center flex={1} px="3">
      <VStack space="5" alignItems="center" w="90%">
        <Heading size="lg">Reset Your Password</Heading>
        <Box w="100%">
          <Input 
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mb="3"
          />
          <Button onPress={handleResetPassword} w="100%">
            Send Reset Link
          </Button>
        </Box>
      </VStack>
    </Center>
  );
};

export default ForgotPasswordScreen;

import React from 'react';
import { NativeBaseProvider, Center, Spinner, Box, Text, Button } from 'native-base';
import { Provider } from 'react-redux';

import { store } from './store/store';
import AppNavigator from './navigation/AppNavigator';
import { useAuth } from './hooks/useAuth'; // Import the hook to manage auth state lifecycle
import { logoutUser } from './store/auth'; // Import logoutUser action

// Define a basic theme for NativeBase if needed
// import { theme } from './theme';

// Component to handle the initial authentication check and rendering logic
const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated } = useAuth(); // Use the custom hook

  // Show a loading spinner while the initial auth state is being determined
  if (isLoading) {
    return (
      <NativeBaseProvider /* Optionally pass theme={theme} */>
        <Center flex={1} backgroundColor="coolGray.100">
          <Spinner size="lg" color="blue.500" />
          <Text mt="4" color="coolGray.600">Initializing...</Text>
        </Center>
      </NativeBaseProvider>
    );
  }

  // Once loading is complete, render the main AppNavigator
  // AppNavigator will conditionally render AuthNavigator or Main App content
  return (
    <NativeBaseProvider /* Optionally pass theme={theme} */>
      <AppNavigator />
    </NativeBaseProvider>
  );
};

// Main App component exporting the Redux Provider and AuthInitializer
export default function App() {
  return (
    <Provider store={store}>
      <AppInitializer />
    </Provider>
  );
}

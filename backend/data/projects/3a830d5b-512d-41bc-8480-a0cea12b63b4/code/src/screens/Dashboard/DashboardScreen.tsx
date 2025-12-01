import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ScrollView } from 'react-native';
import { VStack, Heading, Text, Center, Box, Button, HStack, Spacer, Spinner, Pressable, Divider, Icon, useToast } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { format, isValid, parseISO, subDays, startOfDay } from 'date-fns'; // For date formatting

import { RootStackParamList } from '../../navigation/types';
import { Habit, fetchHabits, selectHabits, selectIsHabitsLoading, selectHabitsError, clearHabitsError, setHabits } from '../../store/habits';
import { useAppDispatch } from '../../store/hooks';
import { subscribeToHabits } from '../../store/habits/habitsThunks';
import { createCompletionRecord, deleteCompletionRecord, fetchCompletionRecordsForHabits, selectCompletionStatusMap, selectIsCompletionLoading } from '../../store/completions';
import { selectToday } from '../../utils/dateUtils'; // Utility for getting current date

// Dummy Icon component for demonstration
const DummyIcon = ({ name, size, color }) => (
  <Box style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text color={color}>{name}</Text> 
  </Box>
);

// Component to display the current streak count
interface StreakIndicatorProps {
  streakCount: number;
}
const StreakIndicator: React.FC<StreakIndicatorProps> = ({ streakCount }) => (
  <Box>
    <Text fontSize="xl" fontWeight="bold" color="blue.500">
      {streakCount > 0 ? streakCount : '-'}
    </Text>
    <Text fontSize="xs" color="coolGray.500">Streak</Text>
  </Box>
);

// Component for the habit completion check button
interface HabitCheckButtonProps {
  onPress: () => void;
  isCompleted: boolean;
}
const HabitCheckButton: React.FC<HabitCheckButtonProps> = ({ onPress, isCompleted }) => {
  return (
    <Pressable 
      onPress={onPress}
      borderRadius="full"
      p="2"
      bg={isCompleted ? "blue.500" : "gray.200"}
      alignItems="center"
      justifyContent="center"
      w="35px" h="35px"
      borderWidth={isCompleted ? 0 : 1}
      borderColor="coolGray.300"
    >
      {isCompleted ? <Icon name="checkmark-sharp" size="20px" color="white" /> : null}
    </Pressable>
  );
};

// Define navigation types for the Dashboard screen
type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>; // Assuming 'Dashboard' is a route name

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  // Get habits data, loading status, and error from the Redux store using selectors
  const habits = useSelector(selectHabits);
  const isLoadingHabits = useSelector(selectIsHabitsLoading);
  const habitsError = useSelector(selectHabitsError);
  // Get completion status for all habits for the current day
  const completionStatusMap = useSelector(selectCompletionStatusMap);
  const isCompletionLoading = useSelector(selectIsCompletionLoading);
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const toast = useToast();

  const today = format(new Date(), 'yyyy-MM-dd'); // Format today's date for comparison

  // Fetch initial data and set up real-time subscription for habits
  useEffect(() => {
    dispatch(fetchHabits()); // Fetch habits for initial load
    // Set up real-time listener for habits changes. The thunk should manage the listener.
    const unsubscribeHabits = dispatch(subscribeToHabits()); 
    // Fetch completion records for today to initialize the completion status map
    dispatch(fetchCompletionRecordsForHabits({ date: today }));

    // Cleanup function to unsubscribe from the habits listener when the component unmounts
    // Note: The subscribeToHabits thunk needs to handle returning an unsubscribe function
    // or the listener needs to be managed more explicitly (e.g., using context or a global store item).
    return () => {
      // Example cleanup if subscribeToHabits returns the unsubscribe function:
      // if (unsubscribeHabits) unsubscribeHabits(); 
    };
  }, [dispatch, today]);

  // Effect to handle and display any errors related to habits fetching or subscription
  useEffect(() => {
    if (habitsError) {
      toast.show({ title: 'Error', description: habitsError, status: 'error', duration: 3000 });
      dispatch(clearHabitsError()); // Clear error after showing
    }
  }, [habitsError, dispatch, toast]);

  // Handler for toggling habit completion status
  const handleHabitToggle = useCallback(async (habit: Habit) => {
    const isCurrentlyCompleted = completionStatusMap[habit.id!]?.[today] || false;
    const completionData = {
      userId: habit.userId,
      habitId: habit.id!,
      completionDate: today,
      // recordedAt is set by the backend/thunk
    };

    // Optimistic UI update: immediately change the button state
    // The actual data update happens via dispatching the async thunk
    const updatedHabit = {...habit};
    // This is a simplification; ideally, Redux state update should reflect this change, 
    // and the UI updates based on the store.

    try {
      if (isCurrentlyCompleted) {
        // If already completed, delete the completion record for today
        await dispatch(deleteCompletionRecord({ habitId: habit.id!, date: today })).unwrap();
        toast.show({ title: 'Undo', description: `'${habit.name}' marked as incomplete.`, status: 'warning', duration: 2000 });
      } else {
        // If not completed, create a new completion record for today
        await dispatch(createCompletionRecord(completionData)).unwrap();
        toast.show({ title: 'Success', description: `'${habit.name}' marked as completed!`, status: 'success', duration: 2000 });
      }
    } catch (error: any) {
      console.error("Error toggling habit completion:", error);
      toast.show({ title: 'Error', description: error.message || 'Failed to update habit status.', status: 'error', duration: 3000 });
      // Optionally revert optimistic update if the operation failed
    }
  }, [dispatch, today, completionStatusMap, toast]);

  // Handler for navigating to the 'CreateHabit' screen
  const handleCreateHabitPress = () => {
    navigation.navigate('CreateHabit');
  };

  // Calculate streak count for a given habit using the completionStatusMap
  const calculateStreak = useCallback((habit: Habit): number => {
    if (!habit.id || !completionStatusMap[habit.id]) {
      return 0; // Return 0 if no data or habit ID is missing
    }

    let streak = 0;
    let currentDate = subDays(startOfDay(new Date()), 1); // Start checking from yesterday (start of the day)

    // Check completion status backwards from yesterday
    for (let i = 0; i < 365; i++) { // Check up to a year back for streak calculation
      const dayToCheck = format(currentDate, 'yyyy-MM-dd');
      const isCompleted = completionStatusMap[habit.id]?.[dayToCheck] ?? false;

      if (isCompleted) {
        streak++;
        currentDate = subDays(currentDate, 1); // Move to the previous day
      } else {
        break; // Stop if a day is missed
      }
    }
    return streak;
  }, [completionStatusMap, today]);

  return (
    <VStack flex={1} px="4" pt="4" bg="coolGray.100">
      <Heading size="2xl" mb="4" color="primary.600">Dashboard</Heading>
      
      {/* Button to navigate to the habit creation screen */}
      <Button 
        onPress={handleCreateHabitPress} 
        mb="6" 
        size="lg" 
        colorScheme="blue"
        leftIcon={<DummyIcon name='+' size={20} color="white" />}
      >
        Add New Habit
      </Button>

      {/* Conditional rendering based on loading state and data availability */}
      {isLoadingHabits && habits.length === 0 ? (
        // Show spinner only if loading AND no habits are present yet (initial load)
        <Center flex={1}>
          <Spinner size="lg" color="blue.500" />
          <Text mt="2" color="coolGray.600">Loading Habits...</Text>
        </Center>
      ) : habits.length === 0 ? (
        // Message to display when there are no habits yet (after initial load)
        <Center flex={1} px="5">
          <Text fontSize="lg" textAlign="center" color="coolGray.500">
            No habits added yet. Tap 'Add New Habit' to get started!
          </Text>
        </Center>
      ) : (
        // Display the list of habits if data is loaded and available
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <VStack space="4" w="100%">
            {habits.map((habit) => {
              // Get completion status for the current habit and today
              const isCompletedToday = completionStatusMap[habit.id!]?.[today] || false;
              const streak = calculateStreak(habit);

              return (
                <Box 
                  key={habit.id} // Use the unique habit ID as the key
                  bg="white"
                  p="4"
                  borderRadius="lg"
                  shadow={2}
                  // onPress={() => navigation.navigate('HabitDetail', { habitId: habit.id })} // Navigate to detail screen on press
                >
                  <HStack alignItems="center" space="3">
                    {/* Placeholder for habit icon - replace with actual icon component */}
                    <DummyIcon name='✨' size={30} color="cyan.500" /> 
                    
                    <VStack flex="1">
                      <Heading size="md" isTruncated maxW="200px">{habit.name}</Heading>
                      <Text fontSize="sm" color="coolGray.500" isTruncated maxW="200px">{habit.description || 'No description provided'}</Text>
                    </VStack>
                    
                    <Spacer /> {/* Pushes content to the sides */}
                    
                    <StreakIndicator streakCount={streak} /> 
                    
                    <HabitCheckButton 
                      onPress={() => handleHabitToggle(habit)} 
                      isCompleted={isCompletedToday}
                    />
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        </ScrollView>
      )}
    </VStack>
  );
};

export default DashboardScreen;

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl, Animated, Easing } from 'react-native';
import { Box, VStack, HStack, Heading, useTheme, Spinner, Center } from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HabitCompletion from '../components/HabitCompletion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchHabits, toggleHabitCompletion } from '../store/habitsSlice';

interface Habit {
  id: string;
  name: string;
  streak: number;
  isCompletedToday: boolean;
  color?: string;
}

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { habits, isLoading, error } = useSelector((state: RootState) => state.habits);
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [fadeAnim] = React.useState(new Animated.Value(0)); // For initial load animation

  useEffect(() => {
    dispatch(fetchHabits());
    // Animate in the screen content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [dispatch, fadeAnim]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    dispatch(fetchHabits()).then(() => setRefreshing(false));
  }, [dispatch]);

  const handleToggleComplete = (habitId: string, isCompleted: boolean) => {
    dispatch(toggleHabitCompletion({ habitId, isCompleted: !isCompleted }));
  };

  // Placeholder for habit data if none exists
  const placeholderHabits: Habit[] = [
    { id: '1', name: 'Drink Water', streak: 5, isCompletedToday: false, color: 'blue.500' },
    { id: '2', name: 'Meditate 5 Min', streak: 12, isCompletedToday: false, color: 'purple.500' },
    { id: '3', name: 'Read 10 Pages', streak: 3, isCompletedToday: false, color: 'green.500' },
  ];

  const displayedHabits = habits.length > 0 ? habits : placeholderHabits;

  return (
    <Box flex={1} bg="white" safeArea>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <VStack space={4} alignItems="center" p={5} w="100%">
          <Heading size="lg" mb={2} color="coolGray.800">Your Habits</Heading>
          
          {isLoading && (
            <Center flex={1}>
              <Spinner size="lg" color="emerald.500" />
            </Center>
          )}

          {error && (
            <Center flex={1}>
              <Text color="red.500">Error loading habits: {error}</Text>
            </Center>
          )}

          {!isLoading && !error && displayedHabits.length === 0 && (
             <Center flex={1}>
              <Text color="coolGray.500">No habits added yet. Get started by adding one!</Text>
            </Center>
          )}

          {!isLoading && !error && (  
            <VStack space={3} w="100%">
              {displayedHabits.map((habit) => (
                <HabitCompletion
                  key={habit.id}
                  isCompleted={habit.isCompletedToday}
                  onToggleComplete={() => handleToggleComplete(habit.id, habit.isCompletedToday)}
                  streak={habit.streak}
                  themeColor={habit.color} // Pass color if available
                />
              ))}
            </VStack>
          )}
        </VStack>
      </Animated.View>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default DashboardScreen;

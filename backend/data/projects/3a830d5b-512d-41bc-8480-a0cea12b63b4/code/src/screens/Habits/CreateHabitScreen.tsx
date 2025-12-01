import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { VStack, Input, Button, Heading, Text, Box, Select, CheckIcon, FormControl, HStack, Divider, Spacer, Radio, Icon } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store/hooks';
import { createHabit } from '../../store/habits/habitsThunks'; // Assuming habits thunk exists

// Dummy Icon component for demonstration
const DummyIcon = ({ name, size, color }) => (
  <Box style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text color={color}>{name}</Text> 
  </Box>
);

type CreateHabitScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateHabit'>; // Adjust stack name if needed

const CreateHabitScreen: React.FC = () => {
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0: Sun, 1: Mon, ..., 6: Sat
  const [reminderTime, setReminderTime] = useState<string | undefined>(undefined);

  const navigation = useNavigation<CreateHabitScreenNavigationProp>();
  const dispatch = useAppDispatch();

  const handleSaveHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert('Input Error', 'Habit name cannot be empty.');
      return;
    }

    const habitData = {
      name: habitName,
      description: description || undefined, // Send undefined if empty
      frequency: {
        type: frequency,
        days: frequency === 'weekly' ? selectedDays : undefined, // Only include days if frequency is weekly
      },
      reminderTime: reminderTime,
    };

    try {
      await dispatch(createHabit(habitData)).unwrap();
      Alert.alert('Success', 'Habit created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() } // Navigate back after success
      ]);
    } catch (error: any) {
      console.error("Error creating habit:", error);
      Alert.alert('Error', error.message || 'Failed to create habit. Please try again.');
    }
  };

  // Function to toggle selected day for weekly frequency
  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prevDays =>
      prevDays.includes(dayIndex)
        ? prevDays.filter(d => d !== dayIndex)
        : [...prevDays, dayIndex].sort((a, b) => a - b) // Keep sorted
    );
  };

  // Simple time formatting for input
  const formatTimeForInput = (time?: string) => {
    if (!time) return '';
    // Assuming time is like 'HH:MM' or Date object string
    // This might need a proper time picker implementation
    return time;
  };

  // Placeholder for time input - requires a TimePicker component
  const handleTimeChange = (time: string) => {
    setReminderTime(time);
  };

  // Mock days of the week for selection
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}>
      <VStack px="5" space="5" alignItems="center">
        <Heading size="xl">Create New Habit</Heading>

        <VStack w="100%" space="4">
          {/* Habit Name Input */}
          <FormControl isRequired>
            <FormControl.Label>Habit Name</FormControl.Label>
            <Input 
              placeholder="e.g., Drink 8 glasses of water"
              value={habitName}
              onChangeText={setHabitName}
              size="lg"
              variant="filled"
              focusOutlineColor="blue.500"
              InputLeftElement={<Box px="3"><DummyIcon name='📝' size={20} color="muted.400" /></Box>}
            />
          </FormControl>

          {/* Description Input */}
          <FormControl>
            <FormControl.Label>Description (Optional)</FormControl.Label>
            <Input 
              placeholder="e.g., Stay hydrated for better focus"
              value={description}
              onChangeText={setDescription}
              size="lg"
              variant="filled"
              focusOutlineColor="blue.500"
              multiline
            />
          </FormControl>

          {/* Frequency Selection */}
          <FormControl isRequired>
            <FormControl.Label>Frequency</FormControl.Label>
            <Radio.Group 
              name="frequencyGroup" 
              value={frequency}
              onChange={nextValue => {
                setFrequency(nextValue as 'daily' | 'weekly');
                if (nextValue === 'daily') {
                  setSelectedDays([]); // Reset days if switched to daily
                }
              }} 
              colorScheme="blue"
            >
              <HStack space={5} alignItems="center">
                <Radio value="daily" my={1}>Daily</Radio>
                <Radio value="weekly" my={1}>Weekly</Radio>
              </Radio.Group>
            </Radio.Group>
          </FormControl>

          {/* Weekly Days Selection (Conditional) */}
          {frequency === 'weekly' && (
            <FormControl isRequired>
              <FormControl.Label>Select Days</FormControl.Label>
              <HStack flexWrap="wrap" justifyContent="space-between">
                {daysOfWeek.map((day, index) => (
                  <Box key={index} mb="2">
                    <Button 
                      size="sm"
                      variant={selectedDays.includes(index) ? "solid" : "outline"}
                      colorScheme={selectedDays.includes(index) ? "blue" : "gray"}
                      onPress={() => toggleDay(index)}
                      borderRadius="full"
                      minW="40px"
                    >
                      {day}
                    </Button>
                  </Box>
                ))}
              </HStack>
              {selectedDays.length === 0 && <Text color="red.500" fontSize="xs">Please select at least one day.</Text>}
            </FormControl>
          )}

          {/* Reminder Time Input (Placeholder) */}
          <FormControl>
            <FormControl.Label>Reminder Time (Optional)</FormControl.Label>
            <Input 
              placeholder="e.g., 08:00 AM"
              value={formatTimeForInput(reminderTime)}
              onChangeText={handleTimeChange} // Needs a proper time picker integration
              size="lg"
              variant="filled"
              focusOutlineColor="blue.500"
              InputLeftElement={<Box px="3"><DummyIcon name='⏰' size={20} color="muted.400" /></Box>}
              // Consider adding onPress to trigger a DateTimePicker modal
              // onPressIn={() => { /* show time picker */ }} 
            />
            <FormControl.HelperText>Set a daily reminder time.</FormControl.HelperText>
          </FormControl>
        </VStack>

        <Divider />

        {/* Save Button */}
        <Button onPress={handleSaveHabit} w="100%" size="lg" colorScheme="success">
          Create Habit
        </Button>
      </VStack>
    </ScrollView>
  );
};

export default CreateHabitScreen;

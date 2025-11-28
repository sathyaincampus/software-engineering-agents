import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from './DashboardScreen';
import CalendarScreen from '../Calendar/CalendarScreen'; 
import TasksScreen from '../Tasks/TasksScreen'; 
import RewardsScreen from '../Rewards/RewardsScreen'; 
import ProfileScreen from '../Profile/ProfileScreen'; 

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export type MainAppTabParamList = {
    Dashboard: undefined;
    Calendar: undefined;
    Tasks: undefined;
    Rewards: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<MainAppTabParamList>();

// Stack Navigator for nested screens within the main app
const ProfileStackNavigator = createStackNavigator();

const ProfileStack: React.FC = () => {
    return (
        <ProfileStackNavigator.Navigator screenOptions={{ headerShown: true }}>
            <ProfileStackNavigator.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
            {/* Add other nested Profile screens here */}
        </ProfileStackNavigator.Navigator>
    );
};


const MainAppNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
                    } else if (route.name === 'Calendar') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Tasks') {
                        iconName = focused ? 'format-list-checks' : 'format-list-checks';
                    } else if (route.name === 'Rewards') {
                        iconName = focused ? 'gift' : 'gift-outline';
                    } else if (route.name === 'Profile') {
                         iconName = focused ? 'account-cog' : 'account-cog-outline';
                    }

                    return <Icon name={iconName!} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007bff',
                tabBarInactiveTintColor: 'gray',
                headerShown: false, 
                tabBarStyle: {
                    backgroundColor: '#fff',
                    paddingTop: 5, 
                }
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} />
            <Tab.Screen name="Tasks" component={TasksScreen} />
            <Tab.Screen name="Rewards" component={RewardsScreen} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

export default MainAppNavigator;

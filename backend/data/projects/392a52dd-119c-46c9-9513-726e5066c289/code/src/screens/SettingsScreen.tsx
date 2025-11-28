import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { Appbar, Card, Text, Button, Divider, Switch, ActivityIndicator, Avatar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logoutUser, fetchUser, updateUser } from '../store/auth/authSlice'; // Assuming user profile fetching and update actions exist
import api from '../services/api'; // For initiating Google Calendar connection
import { checkAuthStatus } from '../store/auth/authSlice';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userLoading = useSelector((state: RootState) => state.auth.loading);
  const userError = useSelector((state: RootState) => state.auth.error);

  // Sync preferences state
  const [syncWithGoogleCalendar, setSyncWithGoogleCalendar] = useState(false);
  const [googleSyncLoading, setGoogleSyncLoading] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<'connected' | 'not_connected' | 'error'>('not_connected');

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const loadUserProfile = async () => {
    if (currentUser?.id) {
      try {
        // Refresh user data to get latest profile info and sync status
        await dispatch(fetchUser(currentUser.id)); // Assuming fetchUser refreshes current user data
        // Check existing Google Calendar connection status - requires backend endpoint or stored preference
        // For now, we'll assume a simple toggle and initiate connection.
      } catch (error) {
        console.error('Failed to load user profile:', error);
        Alert.alert('Error', 'Could not load profile data.');
      }
    }
  };

  useEffect(() => {
    loadUserProfile();
    // Set initial sync state based on user data if available
    // This part needs a way to know the actual sync status from the backend/user profile
    // For now, assume it's managed by the toggle directly.
  }, [dispatch, currentUser?.id]);

  useEffect(() => {
      if (currentUser) {
          setDisplayName(currentUser.displayName || '');
          setAvatarUrl(currentUser.avatarUrl || '');
          // Placeholder: Assume sync status is fetched or managed elsewhere
          // setSyncWithGoogleCalendar(currentUser.syncsGoogleCalendar || false);
      }
  }, [currentUser]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            dispatch(logoutUser());
            dispatch(checkAuthStatus()); // Clear auth state
            // Navigate to Login screen or appropriate place
          },
        },
      ]
    );
  };

  const handleConnectGoogleCalendar = async () => {
    setGoogleSyncLoading(true);
    try {
      const response = await api.get('/calendar/google/connect');
      const authUrl = response.data.authUrl; // Assuming backend returns the auth URL
      if (authUrl) {
        const supported = await Linking.canOpenURL(authUrl);
        if (supported) {
          await Linking.openURL(authUrl);
          setGoogleSyncStatus('connected'); // Tentative status, actual connection confirmed via callback
        } else {
          Alert.alert('Error', 'Cannot open Google Calendar connection link.');
          setGoogleSyncStatus('error');
        }
      } else {
        Alert.alert('Error', 'Could not get Google Calendar connection link.');
        setGoogleSyncStatus('error');
      }
    } catch (error) {
      console.error('Failed to initiate Google Calendar connection:', error);
      Alert.alert('Error', 'Failed to connect to Google Calendar. Please try again.');
      setGoogleSyncStatus('error');
    } finally {
      // Note: Loading state might need careful management. The connection happens async via callback.
      // setGoogleSyncLoading(false); // Don't set loading to false here, as connection is async.
    }
  };

  const handleDisconnectGoogleCalendar = () => {
    // TODO: Implement logic to disconnect Google Calendar (revoke tokens, update backend)
    Alert.alert(
      'Disconnect Google Calendar',
      'Are you sure you want to disconnect your Google Calendar? All synced events may be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          onPress: () => {
            // Call backend API to revoke tokens and update status
            setSyncWithGoogleCalendar(false);
            setGoogleSyncStatus('not_connected');
            Alert.alert('Disconnected', 'Google Calendar has been disconnected.');
          },
        },
      ]
    );
  };

  const toggleSyncWithGoogle = (value: boolean) => {
    setSyncWithGoogleCalendar(value);
    if (value) {
      handleConnectGoogleCalendar();
    } else {
      handleDisconnectGoogleCalendar();
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !displayName.trim()) {
      Alert.alert('Invalid Input', 'Display name cannot be empty.');
      return;
    }
    try {
      await dispatch(updateUser({
        userId: currentUser.id,
        updates: {
          displayName: displayName.trim(),
          avatarUrl: avatarUrl || null, // Handle empty URL
        }
      }));
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditingProfile(false);
      loadUserProfile(); // Refresh data
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const renderProfileSection = () => (
    <Card style={styles.sectionCard}>
      <Card.Title title="Profile" />
      <Card.Content>
        {isEditingProfile ? (
          <View>
            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Avatar URL (Optional)"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.profileButtons}>
              <Button onPress={() => setIsEditingProfile(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleSaveProfile}>Save</Button>
            </View>
          </View>
        ) : (
          <View style={styles.profileView}>
            <Avatar.Image size={80} source={{ uri: currentUser?.avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text variant="titleLarge">{currentUser?.displayName}</Text>
              <Text variant="bodyMedium">Email: {currentUser?.email}</Text>
              <Text variant="bodyMedium">Role: {currentUser?.role}</Text>
              <Button icon="pencil" mode="outlined" onPress={() => setIsEditingProfile(true)} style={styles.editButton}>
                Edit Profile
              </Button>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderSyncSection = () => (
    <Card style={styles.sectionCard}>
      <Card.Title title="Integrations" />
      <Card.Content>
        <View style={styles.syncOption}>
          <Text variant="titleMedium">Sync with Google Calendar</Text>
          <View style={styles.syncControls}>
            <Text style={styles.syncStatusText(googleSyncStatus)}>
              {googleSyncStatus === 'connected' ? 'Connected' : googleSyncStatus === 'error' ? 'Error' : 'Not Connected'}
            </Text>
            {googleSyncLoading ? (
              <ActivityIndicator size="small" color="#6200ee" />
            ) : (
              <Switch
                value={syncWithGoogleCalendar || googleSyncStatus === 'connected'}
                onValueChange={toggleSyncWithGoogle}
                color="#6200ee"
              />
            )}
          </View>
        </View>
        <Divider />
        {/* Add other sync options or preferences here */}
      </Card.Content>
    </Card>
  );

  const renderAccountSection = () => (
    <Card style={styles.sectionCard}>
      <Card.Title title="Account" />
      <Card.Content>
        <Button mode="outlined" onPress={handleLogout} icon="logout">
          Logout
        </Button>
        {/* Add other account options like Delete Account, Change Password etc. */}
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => { /* Navigate back */ }} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {userLoading && <ActivityIndicator animating={true} size="large" color="#6200ee" style={styles.loadingIndicator} />}
        {userError && <Text style={styles.errorText}>Error loading settings: {userError}</Text>}
        {!userLoading && !userError && currentUser && (
          <>
            {renderProfileSection()}
            {renderSyncSection()}
            {renderAccountSection()}
          </>
        )}
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
  sectionCard: {
    marginVertical: 10,
    marginHorizontal: 15,
    elevation: 2,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  profileButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  profileView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  editButton: {
    marginTop: 10,
  },
  syncOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  syncControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusText: (status: string) => ({ // Dynamic styling for status
    marginRight: 10,
    color: status === 'connected' ? '#007bff' : status === 'error' ? '#dc3545' : 'grey',
    fontWeight: 'bold',
  }),
});

export default SettingsScreen;

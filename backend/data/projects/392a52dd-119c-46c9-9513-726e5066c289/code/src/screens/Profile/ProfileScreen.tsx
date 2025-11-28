import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Appbar, Card, Button, Title } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, logoutUser } from '../../store/slices/userSlice'; // Assuming these actions exist
import { RootState } from '../../store';
import CreateProfileForm from '../../components/UserProfile/CreateProfileForm';
import EditProfileForm from '../../components/UserProfile/EditProfileForm';
import NavigationService from '../../navigation/NavigationService'; // Assuming you have a navigation service

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state: RootState) => state.user);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Fetch user profile when the component mounts
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    NavigationService.navigate('Auth'); // Navigate to Auth screen after logout
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error loading profile: {error}</Text>
        <Button onPress={() => dispatch(fetchUserProfile())}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="My Profile" />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>
      <ScrollView style={styles.content}>
        {profile ? (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Your Profile</Title>
              {!isEditing ? (
                <View>
                  <Avatar.Image 
                    size={80}
                    source={profile.avatarUrl ? { uri: profile.avatarUrl } : require('../../assets/default-avatar.png')} // Use default avatar path
                  />
                  <Text style={styles.profileText}>Name: {profile.name}</Text>
                  <Text style={styles.profileText}>Age: {profile.age}</Text>
                  {/* Add other profile details here */}
                  <Button mode="outlined" onPress={() => setIsEditing(true)} style={styles.editButton}>
                    Edit Profile
                  </Button>
                </View>
              ) : (
                <EditProfileForm userId={profile.userId} /> // Pass the user ID to the form
              )}
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Create Your Profile</Title>
              <CreateProfileForm />
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginVertical: 10,
    elevation: 2,
  },
  profileText: {
    marginTop: 10,
    fontSize: 16,
  },
  editButton: {
    marginTop: 20,
  },
});

export default ProfileScreen;

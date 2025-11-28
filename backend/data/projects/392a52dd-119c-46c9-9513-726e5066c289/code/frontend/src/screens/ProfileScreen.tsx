import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { TextInput, Button, Text, Avatar, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchUserProfile, updateUserProfile, uploadAvatar } from '../redux/slices/userSlice';

const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch: AppDispatch = useDispatch();
  const { user, loading, error } = useSelector((state: RootState) => state.user);

  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUri(user.avatarUrl || null);
    }
  }, [user]);

  const handleChoosePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Assuming the backend expects a file object or base64
        // For simplicity, we'll pass the URI and let the uploadAvatar handle it
        setAvatarUri(asset.uri);
        // Optionally, trigger an immediate upload or save for later
        await handleUploadAvatar(asset.uri);
      }
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    try {
      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const fileName = `avatar_${Date.now()}.${fileType}`;

      formData.append('avatar', {
        uri: uri,
        name: fileName,
        type: `image/${fileType}`,
      } as any);

      await dispatch(uploadAvatar(formData)).unwrap();
      Alert.alert('Success', 'Avatar updated successfully!');
      // Fetch updated user profile to get the new avatar URL
      if (user?.id) {
         dispatch(fetchUserProfile(user.id));
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      await dispatch(updateUserProfile({
        userId: user.id,
        displayName
      })).unwrap();
      Alert.alert('Success', 'Profile updated successfully!');
      // Refresh user data after update
      dispatch(fetchUserProfile(user.id));
    } catch (err) {
      console.error('Profile update error:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Render placeholder avatar if no image is selected or available
  const renderAvatar = () => {
    if (avatarUri) {
      return <Avatar.Image size={100} source={{ uri: avatarUri }} />; 
    } else if (user?.avatarUrl) {
      return <Avatar.Image size={100} source={{ uri: user.avatarUrl }} />;
    } else {
      // Use initials if no avatar is available
      const initials = user?.displayName?.charAt(0)?.toUpperCase() || '?';
      return <Avatar.Text size={100} label={initials} />;
    }
  };

  // Fetch user profile on component mount if not already loaded
  useEffect(() => {
    if (user && !user.displayName && !user.avatarUrl) { // Fetch if profile is incomplete
       if (user.id) {
         dispatch(fetchUserProfile(user.id));
       }
    }
  }, [dispatch, user]);

  if (loading && !user) {
    return <View style={styles.centered}><Text>Loading profile...</Text></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>Error: {error}</Text></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.avatarContainer}>
        {renderAvatar()}
        <Button mode="outlined" onPress={handleChoosePhoto} style={styles.changePhotoButton}>
          Change Photo
        </Button>
      </View>

      <TextInput
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Email"
        value={user?.email || ''}
        mode="outlined"
        disabled
        style={styles.input}
      />

      {/* Add other profile fields here as needed (e.g., age, role) */}
      <TextInput
        label="Role"
        value={user?.role || ''}
        mode="outlined"
        disabled
        style={styles.input}
      />

      <Button mode="contained" onPress={handleSaveProfile} style={styles.button} loading={loading}>
        Save Profile
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  changePhotoButton: {
    marginTop: 10,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
  },
  errorText: {
    color: 'red',
  },
});

export default ProfileScreen;

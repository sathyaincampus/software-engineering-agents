import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Avatar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile, UserProfileState } from '../../store/slices/userSlice'; // Assuming you have this action and state
import { RootState } from '../../store'; // Assuming your root state type is defined here

interface EditProfileFormProps {
  userId: string; // Or appropriate user identifier
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ userId }) => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.user.profile); // Get profile from store

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setAge(userProfile.age?.toString() || '');
      setAvatarUri(userProfile.avatarUrl || null);
    }
  }, [userProfile]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewAvatarUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!name || !age) {
      Alert.alert('Missing Information', 'Please enter your name and age.');
      return;
    }

    const updatedProfileData = {
      userId, // Ensure userId is passed correctly
      name,
      age: parseInt(age, 10),
      avatarUrl: newAvatarUri || avatarUri, // Use new avatar if selected, otherwise keep the old one
    };

    // dispatch(updateUserProfile(updatedProfileData)); // Dispatch action to update profile
    console.log('Profile Updated:', updatedProfileData);
    Alert.alert('Success', 'Your profile has been updated!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar.Image 
          size={100} 
          source={newAvatarUri ? { uri: newAvatarUri } : (avatarUri ? { uri: avatarUri } : require('../../assets/default-avatar.png'))} // Use new avatar, fallback to old, then default
        />
        <Button onPress={handlePickImage} mode="outlined" style={styles.uploadButton}>
          Change Avatar
        </Button>
      </View>

      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Age"
        value={age}
        onChangeText={setAge}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />
      
      <Button mode="contained" onPress={handleSubmit} style={styles.updateButton}>
        Update Profile
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    marginTop: 10,
  },
  input: {
    marginBottom: 15,
  },
  updateButton: {
    marginTop: 20,
  },
});

export default EditProfileForm;

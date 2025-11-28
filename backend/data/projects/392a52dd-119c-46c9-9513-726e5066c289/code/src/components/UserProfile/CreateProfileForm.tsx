import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { TextInput, Button, Avatar } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { createUserProfile } from '../../store/slices/userSlice'; // Assuming you have this action

const CreateProfileForm: React.FC = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const dispatch = useDispatch();

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
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!name || !age) {
      Alert.alert('Missing Information', 'Please enter your name and age.');
      return;
    }

    // In a real app, you'd upload the avatar to a server/cloud storage
    // and get a URL back. For this example, we'll just pass the URI.
    const profileData = {
      name,
      age: parseInt(age, 10),
      avatarUrl: avatarUri,
    };

    // dispatch(createUserProfile(profileData)); // Dispatch action to save profile
    console.log('Profile Submitted:', profileData);
    Alert.alert('Success', 'Your profile has been created!');
    // Navigate to the next screen or reset form
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar.Image 
          size={100} 
          source={avatarUri ? { uri: avatarUri } : require('../../assets/default-avatar.png')} // Replace with your default avatar path
        />
        <Button onPress={handlePickImage} mode="outlined" style={styles.uploadButton}>
          Upload Avatar
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
      
      <Button mode="contained" onPress={handleSubmit} style={styles.submitButton}>
        Create Profile
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
  submitButton: {
    marginTop: 20,
  },
});

export default CreateProfileForm;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Avatar, Button, Card, TextInput, Modal, Portal, Provider as PaperProvider, DefaultTheme, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../state/store';
import { fetchUserProfile, updateUserProfile, uploadAvatar, fetchUserById } from '../state/userSlice';
import { User } from '../types/users';
import { fetchFamilyMembers } from '../state/familyMembersSlice';
import * as ImagePicker from 'expo-image-picker';
import { fetchConversations } from '../state/messagesSlice';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
  },
};

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const familyMembers = useSelector((state: RootState) => state.familyMembers.members);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<User>>({});
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchUserProfile(currentUser.user_id));
      dispatch(fetchFamilyMembers(currentUser.family_id));
      dispatch(fetchConversations(currentUser.user_id)); // Fetch conversations for messaging list
    }
  }, [currentUser, dispatch]);

  useEffect(() => {
    if (userProfile) {
      setEditedProfile({ ...userProfile });
    }
  }, [userProfile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (currentUser && editedProfile) {
      dispatch(updateUserProfile({ userId: currentUser.user_id, userData: editedProfile as User }));
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({ ...userProfile }); // Reset to original profile data
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop() || 'avatar.jpg';
      const fileType = filename.split('.').pop() || 'jpg';

      // Create a FormData object for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: localUri,
        name: filename,
        type: `image/${fileType}`,
      } as any);

      if (currentUser) {
        dispatch(uploadAvatar({ userId: currentUser.user_id, avatarData: formData }));
        setAvatarModalVisible(false);
      }
    }
  };

  const renderFamilyMember = (member: User) => (
    <TouchableOpacity key={member.user_id} onPress={() => handleSelectChildForMessage(member)} style={styles.memberItem}>
      <Avatar.Image size={40} source={{ uri: member.avatar_url || 'https://via.placeholder.com/150' }} style={styles.memberAvatar} />
      <Text style={styles.memberName}>{member.display_name}</Text>
      {member.role === 'child' && (
        <Avatar.Icon size={20} icon="chat" style={styles.chatIcon} />
      )}
    </TouchableOpacity>
  );

  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [selectedChildForMessage, setSelectedChildForMessage] = useState<User | null>(null);

  const handleSelectChildForMessage = (child: User) => {
    if (child.role === 'child') {
      setSelectedChildForMessage(child);
      setIsMessageModalVisible(true);
    }
  };

  const closeMessageModal = () => {
    setIsMessageModalVisible(false);
    setSelectedChildForMessage(null);
  };

  return (
    <PaperProvider theme={theme}>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.avatarContainer}>
              <Avatar.Image 
                size={100} 
                source={{ uri: editedProfile.avatar_url || 'https://via.placeholder.com/150' }}
                style={styles.profileAvatar}
              />
              <TouchableOpacity onPress={() => setAvatarModalVisible(true)} style={styles.editAvatarButton}>
                <Avatar.Icon size={30} icon="camera" style={styles.cameraIcon} />
              </TouchableOpacity>
            </View>

            {!isEditing ? (
              <View>
                <Text style={styles.nameText}>{userProfile?.display_name}</Text>
                <Text style={styles.roleText}>{userProfile?.role === 'parent' ? 'Parent' : 'Child'}</Text>
                {userProfile?.email && <Text style={styles.emailText}>Email: {userProfile.email}</Text>}
              </View>
            ) : (
              <View>
                <TextInput
                  label="Display Name"
                  value={editedProfile.display_name || ''}
                  onChangeText={(text) => handleInputChange('display_name', text)}
                  mode="outlined"
                  style={styles.input}
                />
                {/* Add other editable fields as needed */}
                <View style={styles.buttonContainerEdit}>
                  <Button mode="outlined" onPress={handleCancel} style={styles.buttonEditCancel}>
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={handleSave} style={styles.buttonEditSave}>
                    Save
                  </Button>
                </View>
              </View>
            )}

            {!isEditing && userProfile?.role === 'parent' && (
              <View style={styles.messagingSection}>
                <Text style={styles.messagingHeader}>Send Message To Child:</Text>
                <Divider />
                <View style={styles.memberList}>
                  {familyMembers
                    .filter(member => member.role === 'child')
                    .map(renderFamilyMember)
                  }
                  {familyMembers.filter(member => member.role === 'child').length === 0 && (
                    <Text style={styles.noChildrenText}>No children found in your family.</Text>
                  )}
                </View>
              </View>
            )}

            {!isEditing && (
              <Button mode="outlined" onPress={handleEdit} style={styles.editButton}>
                Edit Profile
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Avatar Upload Modal */}
      <Modal visible={avatarModalVisible} onDismiss={() => setAvatarModalVisible(false)} contentContainerStyle={styles.modalContainer}>
        <Text style={styles.modalTitle}>Change Profile Picture</Text>
        <Button mode="contained" onPress={pickImage} style={styles.modalButton}>
          Choose from Library
        </Button>
        {/* Add option to take photo if needed */}
        <Button mode="outlined" onPress={() => setAvatarModalVisible(false)} style={styles.modalButton}>
          Cancel
        </Button>
      </Modal>

      {/* Message Modal - placeholder, would need a proper chat interface */}
      <Modal visible={isMessageModalVisible} onDismiss={closeMessageModal} contentContainerStyle={styles.messageModalContainer}>
        <Text style={styles.modalTitle}>Message {selectedChildForMessage?.display_name}</Text>
        <View style={styles.chatInterfacePlaceholder}>
          <Text>Chat Interface Coming Soon!</Text>
          {/* This is where a chat component would go */}
        </View>
        <Button mode="outlined" onPress={closeMessageModal} style={styles.modalButton}>
          Close
        </Button>
      </Modal>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileAvatar: {
    backgroundColor: '#ccc',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -5, // Adjust as needed
    right: '30%', // Adjust to position over the avatar
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  cameraIcon: {
      backgroundColor: 'transparent',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  buttonContainerEdit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonEditCancel: {
    flex: 1,
    marginRight: 8,
  },
  buttonEditSave: {
    flex: 1,
    marginLeft: 8,
  },
  editButton: {
    marginTop: 20,
  },
  messagingSection: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  messagingHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  memberList: {
    marginTop: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    position: 'relative',
  },
  memberAvatar: {
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    flex: 1, // Allows name to take available space
  },
  chatIcon: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: theme.colors.accent,
  },
  noChildrenText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    marginVertical: 10,
  },
  messageModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    height: '70%', // Adjust height as needed
  },
  chatInterfacePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default ProfileScreen;

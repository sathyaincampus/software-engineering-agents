import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Avatar, Button, TextInput, Title, Text, Card, ActivityIndicator, Appbar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'; // For image selection
import { StackNavigationProp } from '@react-navigation/stack';

import { AppDispatch, RootState } from '../../store/store';
import { fetchUserProfile, updateProfile, uploadAvatar } from '../../store/slices/profileSlice'; // Assume profile slice exists
import { UserProfile } from '../../types/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/AppNavigator';


type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;

const ProfileScreen: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<ProfileScreenNavigationProp>();

    const user = useSelector((state: RootState) => state.auth.user);
    const profileState = useSelector((state: RootState) => state.profile);

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch profile data if user is available but profile state isn't loaded
        if (user && !profileState.user) {
            dispatch(fetchUserProfile());
        }
        // Update local state if user profile data is loaded from auth slice
        if (user) {
            setDisplayName(user.displayName || '');
            setAvatarUri(user.avatarUrl || null);
        }
    }, [user, profileState.user, dispatch]);

    const handleChoosePhoto = async () => {
        // Request permission to access the photo library
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // Assuming the first asset is the selected image
            const selectedAsset = result.assets[0];
            // Set local state immediately for preview
            setAvatarUri(selectedAsset.uri);
            setEditing(true); // Enable editing mode

            // Prepare form data for upload
            const formData = new FormData();
            formData.append('avatar', {
                uri: selectedAsset.uri,
                name: `avatar_${user?.userId || 'temp'}${selectedAsset.uri.substring(selectedAsset.uri.lastIndexOf('.'))}`,
                type: selectedAsset.type || 'image/jpeg', // Default to image/jpeg if type is missing
            } as any); // Type assertion for FormData object
            
            // Dispatch upload action
            setLoading(true);
            try {
                const uploadResult = await dispatch(uploadAvatar(formData)).unwrap();
                setAvatarUri(uploadResult.avatarUrl);
                Alert.alert('Success', 'Avatar uploaded successfully!');
            } catch (error: any) {
                Alert.alert('Upload Failed', error.message || 'Failed to upload avatar.');
                 // Revert avatarUri if upload fails
                 setAvatarUri(user?.avatarUrl || null);
            } finally {
                setLoading(false);
                setEditing(false); // Exit editing mode after upload attempt
            }
        }
    };

    const handleSaveProfile = async () => {
        if (!displayName.trim()) {
            Alert.alert('Validation Error', 'Display name cannot be empty.');
            return;
        }
        setLoading(true);
        try {
            await dispatch(updateProfile({ displayName })).unwrap();
            Alert.alert('Success', 'Profile updated successfully!');
            setEditing(false);
        } catch (error: any) {
            Alert.alert('Update Failed', error.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setDisplayName(user?.displayName || '');
        setAvatarUri(user?.avatarUrl || null);
        setEditing(false);
        setLoading(false);
    };

    if (!user) {
        // Should not happen if app flow is correct, but good for safety
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Loading User Data...</Text>
            </View>
        );
    }

    return (
        <PaperProvider>
             <Appbar.Header>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title="Profile" />
                {!editing ? (
                    <Appbar.Action icon="pencil" onPress={() => setEditing(true)} />
                ) : (
                     <Appbar.Action icon="close" onPress={handleCancelEdit} />
                )}
            </Appbar.Header>
            <ScrollView contentContainerStyle={styles.container}>
                <Card style={styles.profileCard}>
                    <Card.Content style={styles.cardContent}>
                        <TouchableOpacity onPress={handleChoosePhoto} disabled={!editing || loading}>
                            <View style={styles.avatarContainer}>
                                {avatarUri ? (
                                    <Avatar.Image size={100} source={{ uri: avatarUri }} />
                                ) : (
                                    <Avatar.Icon size={100} icon="account" />
                                )}
                                {editing && (
                                    <View style={styles.editIconOverlay}>
                                        <Icon name="camera" size={30} color="#fff" />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        <TextInput
                            label="Display Name"
                            value={displayName}
                            onChangeText={setDisplayName}
                            mode="outlined"
                            disabled={!editing || loading}
                            style={styles.input}
                            left={<Icon name="account" size={20} />} 
                        />
                        <TextInput
                            label="Email"
                            value={user.email}
                            mode="outlined"
                            disabled
                            style={styles.input}
                            left={<Icon name="email" size={20} />}
                        />
                         <TextInput
                            label="Role"
                            value={user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
                            mode="outlined"
                            disabled
                            style={styles.input}
                            left={<Icon name="account-key" size={20} />}
                        />
                        {/* Add Age field if needed */}

                        {loading && <ActivityIndicator animating={true} color="#007bff" style={{ marginTop: 20 }} />}

                        {!loading && editing && (
                            <Button mode="contained" onPress={handleSaveProfile} style={styles.saveButton} icon="content-save">
                                Save Profile
                            </Button>
                        )}
                    </Card.Content>
                </Card>

                {/* Add sections for family members, settings etc. here */}

            </ScrollView>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f0f2f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileCard: {
        borderRadius: 12,
        elevation: 4,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    cardContent: {
        alignItems: 'center',
        padding: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    editIconOverlay: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 5,
    },
    input: {
        width: '100%',
        marginVertical: 10,
        backgroundColor: '#fff',
    },
    saveButton: {
        marginTop: 25,
        width: '100%',
        paddingVertical: 12,
    },
});

export default ProfileScreen;

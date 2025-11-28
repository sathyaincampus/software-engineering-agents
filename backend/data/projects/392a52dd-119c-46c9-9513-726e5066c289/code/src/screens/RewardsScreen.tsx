import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Appbar, Card, Text, Button, FAB, Provider as PaperProvider, Modal, Portal, Divider, TextInput, Switch, ScrollView } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchRewards, Reward as RewardType, deleteReward, redeemReward } from '../store/rewards/rewardsSlice'; // Assuming Reward slice exists
import { fetchUserPoints, UserPoints } from '../store/userPoints/userPointsSlice'; // Assuming UserPoints slice exists
import api from '../services/api';

const RewardsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const rewards = useSelector((state: RootState) => state.rewards.rewards);
  const rewardsLoading = useSelector((state: RootState) => state.rewards.loading);
  const rewardsError = useSelector((state: RootState) => state.rewards.error);
  const userPoints = useSelector((state: RootState) => state.userPoints.points);
  const userPointsLoading = useSelector((state: RootState) => state.userPoints.loading);
  const userPointsError = useSelector((state: RootState) => state.userPoints.error);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.role;

  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardType | null>(null);

  // Reward creation/editing state
  const [rewardName, setRewardName] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardPoints, setRewardPoints] = useState('0');
  const [rewardRequiresApproval, setRewardRequiresApproval] = useState(false);

  const loadRewards = async () => {
    if (currentUser?.family_id) {
      setRefreshing(true);
      try {
        // Fetch rewards for the current family
        await dispatch(fetchRewards(currentUser.family_id));
      } catch (err: any) {
        console.error('Failed to fetch rewards:', err);
        Alert.alert('Error', `Failed to load rewards: ${err.message}`);
      } finally {
        setRefreshing(false);
      }
    }
  };

  const loadUserPoints = async () => {
    if (currentUser?.id) {
      try {
        await dispatch(fetchUserPoints(currentUser.id));
      } catch (err: any) {
        console.error('Failed to fetch user points:', err);
        Alert.alert('Error', `Failed to load points: ${err.message}`);
      }
    }
  };

  useEffect(() => {
    loadRewards();
    loadUserPoints();
  }, [dispatch, currentUser?.id, currentUser?.family_id]);

  const handleToggleTaskStatus = async (task: any) => { /* Placeholder if needed */ };

  const handleRedeemReward = (reward: RewardType) => {
    if (!currentUser?.id || !currentUser?.family_id) {
      Alert.alert('Login Required', 'Please log in to redeem rewards.');
      return;
    }

    if (userPoints === null || userPoints === undefined) {
        Alert.alert('Points Unavailable', 'Could not load your points balance.');
        return;
    }

    if (userPoints < reward.point_cost) {
      Alert.alert('Not Enough Points', `You need ${reward.point_cost} points to redeem this reward. You have ${userPoints}.`);
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem '${reward.name}' for ${reward.point_cost} points?`, 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              // Call the API to redeem the reward
              const response = await api.post(`/rewards/${reward.reward_id}/redeem`);
              Alert.alert('Redemption Successful', response.data.message);
              // Refresh points and potentially the reward status if applicable
              dispatch(fetchUserPoints(currentUser.id!));
              // If reward status needs update (e.g., if redemption affects reward listing),
              // you might need to refresh rewards or handle state updates.
            } catch (err: any) {
              console.error('Redemption failed:', err);
              Alert.alert('Redemption Failed', err.response?.data?.message || 'An error occurred.');
            }
          },
        },
      ]
    );
  };

  // Parent functions for managing rewards
  const openCreateModal = () => {
    setRewardName('');
    setRewardDescription('');
    setRewardPoints('0');
    setRewardRequiresApproval(false);
    setCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
  };

  const handleCreateReward = async () => {
    if (!rewardName.trim() || parseInt(rewardPoints, 10) < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid reward name and non-negative points.');
      return;
    }
    try {
      await dispatch(createReward({
        family_id: currentUser!.family_id!,
        name: rewardName.trim(),
        description: rewardDescription.trim(),
        point_cost: parseInt(rewardPoints, 10),
        requires_approval: rewardRequiresApproval,
      }));
      Alert.alert('Success', 'Reward created successfully!');
      closeCreateModal();
      loadRewards(); // Refresh list
    } catch (err: any) {
      console.error('Failed to create reward:', err);
      Alert.alert('Error', `Failed to create reward: ${err.message}`);
    }
  };

  const openEditModal = (reward: RewardType) => {
    setSelectedReward(reward);
    setRewardName(reward.name);
    setRewardDescription(reward.description || '');
    setRewardPoints(reward.point_cost.toString());
    setRewardRequiresApproval(reward.requires_approval);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedReward(null);
  };

  const handleUpdateReward = async () => {
    if (!selectedReward || !rewardName.trim() || parseInt(rewardPoints, 10) < 0) {
      Alert.alert('Invalid Input', 'Please ensure all fields are valid.');
      return;
    }
    try {
      await dispatch(updateReward({
        rewardId: selectedReward.reward_id,
        updates: {
          name: rewardName.trim(),
          description: rewardDescription.trim(),
          point_cost: parseInt(rewardPoints, 10),
          requires_approval: rewardRequiresApproval,
        }
      }));
      Alert.alert('Success', 'Reward updated successfully!');
      closeEditModal();
      loadRewards(); // Refresh list
    } catch (err: any) {
      console.error('Failed to update reward:', err);
      Alert.alert('Error', `Failed to update reward: ${err.message}`);
    }
  };

  const handleDeleteReward = (rewardId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this reward? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await dispatch(deleteReward(rewardId));
              Alert.alert('Success', 'Reward deleted successfully!');
              loadRewards(); // Refresh list
            } catch (err: any) {
              console.error('Failed to delete reward:', err);
              Alert.alert('Error', `Failed to delete reward: ${err.response?.data?.message || err.message}`);
            }
          },
        },
      ]
    );
  };

  const renderRewardItem = ({ item }: { item: RewardType }) => (
    <Card style={styles.rewardCard}>
      <Card.Content>
        <View style={styles.rewardInfoContainer}>
          <View style={styles.rewardTextContainer}>
            <Text variant="titleMedium" style={styles.rewardName}>{item.name}</Text>
            {item.description ? <Text variant="bodySmall" style={styles.rewardDescription} numberOfLines={1}>{item.description}</Text> : null}
            <Text variant="bodyMedium" style={styles.rewardPoints}>Cost: {item.point_cost} Points</Text>
            {item.requires_approval && <Text variant="bodySmall" style={styles.approvalNeeded}>Approval Required</Text>}
          </View>
          <View style={styles.rewardActions}>
            {userRole === 'child' ? (
              <Button
                mode="contained"
                onPress={() => handleRedeemReward(item)}
                disabled={userPoints === null || userPoints < item.point_cost || userPointsLoading}
                loading={userPointsLoading}
              >
                Redeem
              </Button>
            ) : (
              <View style={styles.parentActions}>
                <IconButton icon="pencil" onPress={() => openEditModal(item)} />
                <IconButton icon="delete" onPress={() => handleDeleteReward(item.reward_id)} />
              </View>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{userRole === 'parent' ? 'No rewards defined yet. Tap + to add one!' : 'No rewards available.'}</Text>
    </View>
  );

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.Content title="Rewards" />
        {userRole === 'parent' && (
          <Appbar.Action icon="plus" onPress={openCreateModal} />
        )}
      </Appbar.Header>
      <View style={styles.container}>
        {/* Display user points for children */}
        {userRole === 'child' && userPoints !== null && (
          <Card style={styles.pointsCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.pointsText}>
                My Points: {userPointsLoading ? '...' : userPoints}
              </Text>
            </Card.Content>
          </Card>
        )}

        {rewardsLoading && !refreshing && <Text>Loading rewards...</Text>}
        {rewardsError && <Text style={styles.errorText}>Error: {rewardsError}</Text>}
        {!rewardsLoading && !rewardsError && (
          <FlatList
            data={rewards}
            renderItem={renderRewardItem}
            keyExtractor={(item) => item.reward_id}
            style={styles.list}
            ListEmptyComponent={renderEmptyListComponent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRewards} />}
          />
        )}
      </View>

      {/* Create Reward Modal */} 
      <Portal>
        <Modal visible={isCreateModalVisible} onDismiss={closeCreateModal} contentContainerStyle={styles.modalContainer}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text variant="titleLarge" style={styles.modalTitle}>Create New Reward</Text>
            <TextInput
              label="Reward Name"
              value={rewardName}
              onChangeText={setRewardName}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Description (Optional)"
              value={rewardDescription}
              onChangeText={setRewardDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.modalInput}
            />
            <TextInput
              label="Points Cost"
              value={rewardPoints}
              onChangeText={setRewardPoints}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.switchContainer}>
              <Text>Requires Approval</Text>
              <Switch value={rewardRequiresApproval} onValueChange={setRewardRequiresApproval} />
            </View>
            <Button mode="contained" onPress={handleCreateReward} style={styles.modalButton}>Create Reward</Button>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Edit Reward Modal */} 
      <Portal>
        <Modal visible={isEditModalVisible} onDismiss={closeEditModal} contentContainerStyle={styles.modalContainer}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text variant="titleLarge" style={styles.modalTitle}>Edit Reward</Text>
            <TextInput
              label="Reward Name"
              value={rewardName}
              onChangeText={setRewardName}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Description (Optional)"
              value={rewardDescription}
              onChangeText={setRewardDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.modalInput}
            />
            <TextInput
              label="Points Cost"
              value={rewardPoints}
              onChangeText={setRewardPoints}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.switchContainer}>
              <Text>Requires Approval</Text>
              <Switch value={rewardRequiresApproval} onValueChange={setRewardRequiresApproval} />
            </View>
            <Button mode="contained" onPress={handleUpdateReward} style={styles.modalButton}>Update Reward</Button>
          </ScrollView>
        </Modal>
      </Portal>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  list: {
    flex: 1,
  },
  rewardCard: {
    marginVertical: 6,
    marginHorizontal: 4,
    elevation: 2,
  },
  rewardInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  rewardName: {
    fontWeight: 'bold',
  },
  rewardDescription: {
    color: 'grey',
  },
  rewardPoints: {
    fontWeight: '500',
    marginTop: 4,
  },
  approvalNeeded: {
    color: '#6200ee',
    fontStyle: 'italic',
    marginTop: 4,
  },
  rewardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: 'grey',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 10,
  },
  pointsCard: {
    marginHorizontal: 4,
    marginBottom: 10,
    elevation: 1,
    backgroundColor: '#e8d5ff',
  },
  pointsText: {
    textAlign: 'center',
    color: '#3700b3',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  modalInput: {
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  modalButton: {
    marginTop: 15,
    paddingVertical: 8,
  },
});

export default RewardsScreen;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../state/store';
import { getTimeAllocationAnalytics, getTaskCompletionTrends, getRewardSpendingTrends, resetAnalytics } from '../state/analyticsSlice';
import { User } from '../types/users';
import { UUID } from '../types/common';
// Assuming you have charting components available, e.g., from react-native-chart-kit
// import { BarChart, PieChart } from 'react-native-chart-kit'; 

// Placeholder for chart components
const BarChart = ({ data }) => <View style={styles.chartPlaceholder}><Text>Bar Chart Placeholder</Text></View>;
const PieChart = ({ data }) => <View style={styles.chartPlaceholder}><Text>Pie Chart Placeholder</Text></View>;


const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
  },
};

const AnalyticsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const timeAllocation = useSelector((state: RootState) => state.analytics.timeAllocation);
  const taskCompletion = useSelector((state: RootState) => state.analytics.taskCompletion);
  const rewardSpending = useSelector((state: RootState) => state.analytics.rewardSpending);
  const loading = useSelector((state: RootState) => state.analytics.loading);
  const error = useSelector((state: RootState) => state.analytics.error);

  // Date range for analytics (e.g., last 30 days)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (currentUser) {
      fetchAnalyticsData(currentUser.family_id, startDate, endDate);
    }
    return () => {
      // Cleanup on unmount
      dispatch(resetAnalytics());
    };
  }, [currentUser, dispatch, startDate, endDate]); // Re-fetch if dates change

  const fetchAnalyticsData = (familyId: UUID, start: string, end: string) => {
    dispatch(getTimeAllocationAnalytics({ familyId, startDate: start, endDate: end }));
    dispatch(getTaskCompletionTrends({ familyId, startDate: start, endDate: end }));
    dispatch(getRewardSpendingTrends({ familyId, startDate: start, endDate: end }));
  };

  // Dummy data transformation for charts (replace with actual data processing)
  const processTimeAllocationData = () => {
    if (!timeAllocation) return { labels: [], datasets: [] };
    
    const labels = Object.keys(timeAllocation.category_durations_minutes);
    const data = Object.values(timeAllocation.category_durations_minutes);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          colors: labels.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
        },
      ],
    };
  };

  const processTaskCompletionData = () => {
    if (!taskCompletion) return { labels: [], datasets: [] };

    const labels = Object.keys(taskCompletion.daily_completion_counts);
    const data = Object.values(taskCompletion.daily_completion_counts);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
        },
      ],
    };
  };

  const processRewardSpendingData = () => {
     if (!rewardSpending) return { labels: [], datasets: [] };

    const labels = Object.keys(rewardSpending.monthly_points_redeemed);
    const data = Object.values(rewardSpending.monthly_points_redeemed);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
        },
      ],
    };
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <PaperProvider theme={theme}>
      <ScrollView style={styles.container}>
        <Title style={styles.screenTitle}>Family Analytics</Title>

        {/* Date Range Selector - implement actual date pickers */}
        <View style={styles.dateRangeContainer}>
          <Text>Select Date Range:</Text>
          {/* Placeholder Buttons */}
          <Button onPress={() => {}} mode="outlined" style={styles.dateButton}>Start Date: {startDate}</Button>
          <Button onPress={() => {}} mode="outlined" style={styles.dateButton}>End Date: {endDate}</Button>
          <Button onPress={() => currentUser && fetchAnalyticsData(currentUser.family_id, startDate, endDate)} mode="contained" icon="refresh">Refresh</Button>
        </View>

        {loading === 'pending' && <ActivityIndicator size="large" color="#6200ee" style={styles.centered}
/>}
        {error && <Text style={styles.errorText}>Error loading analytics: {error}</Text>}

        {!error && !loading && !timeAllocation && !taskCompletion && !rewardSpending && (
           <Paragraph style={styles.noDataText}>No analytics data available for the selected period.</Paragraph>
        )}

        {/* Time Allocation Section */}
        {timeAllocation && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Time Allocation</Title>
              <Paragraph>Total Time Spent: {timeAllocation.total_duration_minutes} minutes</Paragraph>
              <PieChart data={processTimeAllocationData()} width={screenWidth - 40} height={220} />
              <View style={styles.categoryList}>
                {Object.entries(timeAllocation.category_durations_minutes).map(([category, duration]) => (
                  <View key={category} style={styles.categoryItem}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text>{duration} mins</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Task Completion Trends Section */}
        {taskCompletion && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Task Completion Trends</Title>
              <Paragraph>Total Tasks Completed: {taskCompletion.total_completed_tasks}</Paragraph>
              <BarChart data={processTaskCompletionData()} width={screenWidth - 40} height={220} />
            </Card.Content>
          </Card>
        )}

        {/* Reward Spending Trends Section */}
        {rewardSpending && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Reward Spending Trends</Title>
              <Paragraph>Total Points Redeemed: {rewardSpending.total_points_redeemed}</Paragraph>
              <BarChart data={processRewardSpendingData()} width={screenWidth - 40} height={220} />
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  dateRangeContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButton: {
    marginVertical: 8,
    width: '80%',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  chartPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 220, // Match chart height
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginVertical: 10,
  },
  categoryList: {
    marginTop: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryName: {
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
  },
});

export default AnalyticsScreen;

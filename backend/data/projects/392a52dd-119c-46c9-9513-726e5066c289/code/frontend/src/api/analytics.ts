import api from './api';
import { UUID } from '../types/common';

interface TimeAllocationAnalytics {
  total_duration_minutes: number;
  category_durations_minutes: { [categoryName: string]: number };
}

interface TaskCompletionTrends {
  daily_completion_counts: { [date: string]: number };
  total_completed_tasks: number;
}

interface RewardSpendingTrends {
  monthly_points_redeemed: { [month: string]: number }; // Month format like 'YYYY-MM'
  total_points_redeemed: number;
}

export const fetchTimeAllocationAnalytics = async (
  familyId: UUID,
  startDate: string, // expecting YYYY-MM-DD format
  endDate: string    // expecting YYYY-MM-DD format
): Promise<TimeAllocationAnalytics> => {
  try {
    const response = await api.get('/v1/analytics/time-allocation/', {
      params: { family_id: familyId, start_date: startDate, end_date: endDate },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching time allocation analytics:', error.response?.data?.detail || error.message);
    throw error;
  }
};

export const fetchTaskCompletionTrends = async (
  familyId: UUID,
  startDate: string,
  endDate: string
): Promise<TaskCompletionTrends> => {
  try {
    const response = await api.get('/v1/analytics/task-completion-trends/', {
      params: { family_id: familyId, start_date: startDate, end_date: endDate },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching task completion trends:', error.response?.data?.detail || error.message);
    throw error;
  }
};

export const fetchRewardSpendingTrends = async (
  familyId: UUID,
  startDate: string,
  endDate: string
): Promise<RewardSpendingTrends> => {
  try {
    const response = await api.get('/v1/analytics/reward-spending-trends/', {
      params: { family_id: familyId, start_date: startDate, end_date: endDate },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching reward spending trends:', error.response?.data?.detail || error.message);
    throw error;
  }
};

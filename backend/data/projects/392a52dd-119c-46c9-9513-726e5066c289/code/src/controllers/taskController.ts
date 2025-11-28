import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task';
import UserPoints from '../models/UserPoints';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import Reward from '../models/Reward'; // Import Reward model
import RewardRedemption from '../models/RewardRedemption'; // Import RewardRedemption model

// Mock function to get family_id from JWT payload - replace with actual implementation
const getFamilyIdFromToken = (req: Request): string | null => {
  // Example: return req.user.family_id; // If user object is attached to request by auth middleware
  // For now, we might need to infer it or pass it in body/params for testing
  return (req as any).user?.familyId || null; // Placeholder
};

// @desc    Get all tasks for a family (or specific user)
// @route   GET /api/v1/tasks
// @access  Private (Parent or Child)
export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const familyId = getFamilyIdFromToken(req);
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!familyId) {
      return res.status(400).json({ message: 'Family ID not found. User must belong to a family.' });
    }

    let whereClause: any = { family_id: familyId };

    // If the user is a child, filter tasks assigned to them
    if (userRole === 'child') {
      whereClause.assigned_to = userId;
    }
    // Parents can see all tasks in the family, possibly filtered by status or assignment
    // Add more filters as needed (e.g., ?status=completed, ?assignedTo=childId)

    const tasks = await Task.findAll({
      where: whereClause,
      order: [['due_date', 'ASC'], ['created_at', 'DESC']], // Order by due date, then creation date
      // Include user details for 'assigned_to' and 'created_by' if needed
      include: [
        {
          model: sequelize.models.User, // Assuming User model is registered
          as: 'assignee',
          attributes: ['user_id', 'display_name'],
        },
        {
          model: sequelize.models.User, // Assuming User model is registered
          as: 'creator',
          attributes: ['user_id', 'display_name'],
        },
        // Include reward details if task completion grants points towards a reward
      ],
    });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get tasks specifically assigned to the logged-in child
// @route   GET /api/v1/tasks/my-tasks
// @access  Private (Child)
export const getMyTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const familyId = (req as any).user.family_id;

    if (!userId || !familyId) {
      return res.status(400).json({ message: 'User ID or Family ID not found. Ensure user is authenticated and belongs to a family.' });
    }

    const tasks = await Task.findAll({
      where: {
        assigned_to: userId,
        family_id: familyId,
        // Optionally filter by status, e.g., exclude completed tasks
        // status: { [Op.ne]: 'completed' } 
      },
      order: [['due_date', 'ASC'], ['created_at', 'DESC']],
      include: [
        {
          model: sequelize.models.User, 
          as: 'assignee',
          attributes: ['user_id', 'display_name'],
        },
        {
          model: sequelize.models.User, 
          as: 'creator',
          attributes: ['user_id', 'display_name'],
        }
      ],
    });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Get a single task by ID
// @route   GET /api/v1/tasks/:id
// @access  Private (Parent or Assigned Child)
export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Fetch the task first
    const task = await Task.findByPk(id, {
      include: [
        { model: sequelize.models.User, as: 'assignee', attributes: ['user_id', 'display_name'] },
        { model: sequelize.models.User, as: 'creator', attributes: ['user_id', 'display_name'] },
      ]
    });

    if (!task) {
      return res.status(404).json({ message: `Task not found with id ${id}` });
    }

    // Authorization: Parent can see any task in their family. Child can only see tasks assigned to them.
    // This requires knowing the familyId, which should ideally be in the JWT payload or fetched.
    const familyId = (req as any).user.family_id; // Assuming family_id is available
    if (!familyId) {
        return res.status(400).json({ message: 'User family ID not found.' });
    }
    // Check if the task belongs to the user's family
    if (task.family_id !== familyId) {
      return res.status(403).json({ message: 'Task does not belong to your family.' });
    }

    if (userRole === 'child' && task.assigned_to !== userId) {
      return res.status(403).json({ message: 'You are not authorized to view this task.' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new task
// @route   POST /api/v1/tasks
// @access  Private (Parent)
export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const { title, description, assigned_to, due_date, points } = req.body;
    const createdBy = (req as any).user.userId;
    const familyId = (req as any).user.family_id; // Assuming family ID is available from auth context

    if (!familyId) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Family ID is required. Ensure user is authenticated and belongs to a family.' });
    }
    if (!title || !assigned_to) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Please provide a title and assign the task to a child.' });
    }

    // Create the task
    const task = await Task.create(
      {
        family_id: familyId,
        title,
        description: description || null,
        assigned_to,
        due_date,
        points: points !== undefined && points >= 0 ? points : 0,
        created_by: createdBy,
        status: 'pending', // Default status
      },
      { transaction }
    );

    // Update user points if the task has points and is created by a parent for a child
    // NOTE: Points are typically awarded upon COMPLETION, not creation. 
    // This logic might need to be moved to a task completion handler.
    // For now, we just create the task.

    await transaction.commit();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update task status or details
// @route   PUT /api/v1/tasks/:id
// @access  Private (Parent or Assigned Child)
export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, title, description, due_date, points } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const familyId = (req as any).user.family_id;

    if (!familyId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'User family ID not found.' });
    }

    // Find the task
    const task = await Task.findByPk(id, { transaction });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: `Task not found with id ${id}` });
    }

    // Authorization check: 
    // 1. Parent can update any task in their family.
    // 2. Child can only update status IF it's their task.
    if (task.family_id !== familyId) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Task does not belong to your family.' });
    }
    if (userRole === 'child' && task.assigned_to !== userId) {
      await transaction.rollback();
      return res.status(403).json({ message: 'You are not authorized to update this task.' });
    }

    let pointsAwarded = 0;
    let previousStatus = task.status;

    // Handle status update specifically - award points on completion
    if (status && status !== task.status) {
      if (task.status !== 'completed' && status === 'completed') {
        // Task is being marked as completed
        if (task.points > 0) {
          pointsAwarded = task.points;
          let userPoints = await UserPoints.findOne({ where: { user_id: task.assigned_to }, transaction });
          if (!userPoints) {
            // Create points entry if it doesn't exist
            userPoints = await UserPoints.create({ user_id: task.assigned_to, current_points: 0 }, { transaction });
          }
          await userPoints.addPoints(pointsAwarded);
          
          // Optional: Trigger notification for parent about task completion & points earned
          // await sendNotification(...);
        }
      } else if (task.status === 'completed' && status !== 'completed') {
        // Task is being reverted from completed (handle with care - maybe deduct points?)
        // For simplicity, we'll allow it but won't automatically deduct points here.
        // A more complex logic might be needed if point reversals are critical.
        if (task.points > 0) {
          // Logic to deduct points if needed. Requires careful handling.
          console.warn(`Task ${id} reverted from completed. Point adjustment not automatically handled.`);
        }
      }
      task.status = status;
    }

    // Update other fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (due_date !== undefined) task.due_date = due_date;
    if (points !== undefined && points >= 0) task.points = points;

    await task.save({ transaction });

    // After saving the task, if it was marked completed and earned points, 
    // and if there are associated rewards, we might want to update or notify.
    // For now, just save the task.

    await transaction.commit();
    res.status(200).json({ success: true, data: task, pointsAwarded: pointsAwarded });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/v1/tasks/:id
// @access  Private (Parent)
export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const familyId = getFamilyIdFromToken(req);

    if (!familyId) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Family ID not found.' });
    }

    // Find the task and ensure it belongs to the family
    const task = await Task.findOne({ where: { task_id: id, family_id: familyId }, transaction });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ message: `Task not found with id ${id} for this family` });
    }

    // Before deleting, consider if points were awarded and need reversal (complex)
    // For simplicity, we delete directly. Point adjustments on deletion are not implemented here.
    if (task.status === 'completed' && task.points > 0) {
      console.warn(`Task ${id} was completed and had points. Deleting without reversing points.`);
      // If point reversal is needed, logic would go here.
    }

    await task.destroy({ transaction });

    await transaction.commit();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Assign points to a task (implicitly done via task creation/update)
// @route   PUT /api/v1/tasks/:id/points
// @access  Private (Parent)
// This functionality is integrated into the updateTask controller for simplicity.
// A separate endpoint might be useful if only points need updating frequently.

// @desc    Get task completion stats for a family (optional, for dashboard/analytics)
// @route   GET /api/v1/tasks/stats
// @access  Private (Parent)
export const getTaskStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const familyId = getFamilyIdFromToken(req);
    if (!familyId) {
      return res.status(400).json({ message: 'Family ID not found.' });
    }

    const totalTasks = await Task.count({ where: { family_id: familyId } });
    const completedTasks = await Task.count({
      where: {
        family_id: familyId,
        status: 'completed',
      },
    });
    const pendingTasks = totalTasks - completedTasks;

    // Get total points awarded within the family
    // This requires summing points from completed tasks where points > 0
    // A more efficient way might be to sum from UserPoints if that's the source of truth.
    // For now, let's aggregate from tasks themselves (assuming tasks accurately reflect points awarded)
    const totalPointsAwarded = await Task.sum('points', {
      where: {
        family_id: familyId,
        status: 'completed',
        points: { [Op.gt]: 0 },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        totalPointsAwarded: totalPointsAwarded || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from backend.src.dependencies import get_db, get_current_user
from backend.src.models.users import User
from backend.src.models.events import Event, EventCategory
from backend.src.models.tasks import Task
from backend.src.models.rewards import RewardRedemption, Reward
from sqlalchemy import func, extract, cast, DATE, Integer, Interval, text
from datetime import datetime, timedelta


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get("/time-allocation/", response_model=Dict[str, Any])
def get_time_allocation_analytics(
    family_id: uuid.UUID,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Provides analytics on time allocation across different event categories for a family.

    Args:
        family_id (uuid.UUID): The ID of the family for which to generate analytics.
        start_date (datetime): The start date for the analysis period.
        end_date (datetime): The end date for the analysis period.

    Returns:
        Dict[str, Any]: A dictionary containing time allocation data.
            Example:
            {
              "total_duration_minutes": 1200,
              "category_durations_minutes": {
                "Sports": 300,
                "Study": 450,
                "Playtime": 450
              }
            }
    """
    # Authorization: Ensure the user belongs to the specified family.
    if current_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to analytics for this family."
        )

    try:
        # Calculate total duration within the specified period
        # Using EXTRACT(EPOCH FROM end_time) - EXTRACT(EPOCH FROM start_time) for duration in seconds
        total_duration_query = db.query(func.sum(
            func.extract('epoch', Event.end_time) - func.extract('epoch', Event.start_time)
        )).filter(
            Event.family_id == family_id,
            Event.start_time >= start_date,
            Event.end_time <= end_date
        )
        total_duration_seconds = total_duration_query.scalar() or 0
        total_duration_minutes = round(total_duration_seconds / 60) if total_duration_seconds else 0

        # Calculate duration per event category
        category_durations_query = db.query(
            Event.event_category_id, # Use category ID for joining
            func.sum(func.extract('epoch', Event.end_time) - func.extract('epoch', Event.start_time)).label('duration_seconds')
        ).join(EventCategory, Event.event_category_id == EventCategory.category_id).filter(
            Event.family_id == family_id,
            Event.start_time >= start_date,
            Event.end_time <= end_date,
            Event.event_category_id != None # Only consider events with categories
        ).group_by(Event.event_category_id)

        category_durations_seconds = category_durations_query.all()

        # Map category IDs to names and convert durations to minutes
        category_durations_minutes = {}
        if category_durations_seconds:
            # Fetch category names to make the output more readable
            category_ids = [cat_duration.event_category_id for cat_duration in category_durations_seconds]
            category_map = db.query(EventCategory.category_id, EventCategory.name).filter(EventCategory.category_id.in_(category_ids)).all()
            category_name_map = {cat_id: name for cat_id, name in category_map}

            for cat_duration in category_durations_seconds:
                category_name = category_name_map.get(cat_duration.event_category_id, 'Unknown Category')
                duration_minutes = round(cat_duration.duration_seconds / 60) if cat_duration.duration_seconds else 0
                category_durations_minutes[category_name] = duration_minutes

        return {
            "total_duration_minutes": total_duration_minutes,
            "category_durations_minutes": category_durations_minutes
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.get("/task-completion-trends/", response_model=Dict[str, Any])
def get_task_completion_trends(
    family_id: uuid.UUID,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Provides analytics on task completion trends over time for a family.

    Args:
        family_id (uuid.UUID): The ID of the family.
        start_date (datetime): The start date of the period.
        end_date (datetime): The end date of the period.

    Returns:
        Dict[str, Any]: A dictionary with task completion data, grouped by day.
            Example:
            {
              "daily_completion_counts": {
                "2023-10-26": 5,
                "2023-10-27": 8
              },
              "total_completed_tasks": 13
            }
    """
    # Authorization: Ensure the user belongs to the specified family.
    if current_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to analytics for this family."
        )

    try:
        # Query for completed tasks within the date range, grouped by day
        # Use DATE_TRUNC('day', ...) for PostgreSQL to group by date
        completed_tasks_query = db.query(
            func.date_trunc('day', Task.updated_at).label('completion_date'),
            func.count(Task.task_id).label('count')
        ).filter(
            Task.family_id == family_id,
            Task.status == 'completed',
            Task.updated_at >= start_date,
            Task.updated_at <= end_date
        ).group_by('completion_date').order_by('completion_date')
        
        daily_completion_counts = {}
        total_completed_tasks = 0

        for task_data in completed_tasks_query.all():
            # Format date as string YYYY-MM-DD for JSON compatibility
            date_str = task_data.completion_date.strftime('%Y-%m-%d') 
            daily_completion_counts[date_str] = task_data.count
            total_completed_tasks += task_data.count

        return {
            "daily_completion_counts": daily_completion_counts,
            "total_completed_tasks": total_completed_tasks
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.get("/reward-spending-trends/", response_model=Dict[str, Any])
def get_reward_spending_trends(
    family_id: uuid.UUID,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Provides analytics on reward spending trends (points redeemed) for a family.

    Args:
        family_id (uuid.UUID): The ID of the family.
        start_date (datetime): The start date of the period.
        end_date (datetime): The end date of the period.

    Returns:
        Dict[str, Any]: A dictionary showing reward redemption trends.
            Example:
            {
              "monthly_points_redeemed": {
                "2023-10": 250,
                "2023-11": 400
              },
              "total_points_redeemed": 650
            }
    """
    # Authorization: Ensure the user belongs to the specified family.
    if current_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to analytics for this family."
        )

    try:
        # Query for reward redemptions, join with rewards to get point cost
        # Group by month and sum the point costs
        # Use TO_CHAR for PostgreSQL to format date to 'YYYY-MM'
        redemption_trends_query = db.query(
            func.to_char(RewardRedemption.redeemed_at, 'YYYY-MM').label('month'),
            func.sum(Reward.point_cost).label('points_redeemed')
        ).join(RewardRedemption.reward).filter(
            Reward.family_id == family_id,
            RewardRedemption.status.in_(['approved', 'completed']),
            RewardRedemption.redeemed_at >= start_date,
            RewardRedemption.redeemed_at <= end_date
        ).group_by('month').order_by('month')
        
        monthly_points_redeemed = {}
        total_points_redeemed = 0

        for trend in redemption_trends_query.all():
            monthly_points_redeemed[trend.month] = trend.points_redeemed
            total_points_redeemed += trend.points_redeemed

        return {
            "monthly_points_redeemed": monthly_points_redeemed,
            "total_points_redeemed": total_points_redeemed
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")

# NOTE: Ensure models like EventCategory and UserPoints are imported and available if used in queries.
# Example imports (adjust based on your project structure):
# from backend.src.models.events import EventCategory
# from backend.src.models.user_points import UserPoints 

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from backend.src.schemas.messages import MessageCreate, Message, ConversationCreate, Conversation, ConversationWithMessages
from backend.src.crud.messages import (
    create_message_db, get_messages_in_conversation_db, create_conversation_db,
    get_conversation_db, get_conversations_by_user_db, mark_messages_as_read_db
)
from backend.src.crud.users import get_user_db
from backend.src.dependencies import get_db, get_current_user
from backend.src.models.users import User

router = APIRouter(
    prefix="/messages",
    tags=["Messages"],
)


@router.post("/conversations/", response_model=Conversation, status_code=status.HTTP_201_CREATED)
def create_conversation( 
    conversation: ConversationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new conversation between a parent and a child.
    
    - **parent_id**: The UUID of the parent user.
    - **child_id**: The UUID of the child user.
    
    Requires authentication.
    Only the parent or child involved can initiate or be part of a conversation.
    """
    try:
        # Ensure the current user is one of the participants
        if current_user.user_id not in (conversation.parent_id, conversation.child_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create or participate in conversations you are part of."
            )
        
        # Optional: Validate that parent and child belong to the same family
        parent_user = get_user_db(db, conversation.parent_id)
        child_user = get_user_db(db, conversation.child_id)
        if not parent_user or not child_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent or Child user not found.")
        if parent_user.family_id != child_user.family_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent and child must belong to the same family.")
        
        # Ensure the conversation is within the current user's family context
        if current_user.family_id != parent_user.family_id: # or child_user.family_id
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create conversations across different families.")

        return create_conversation_db(db, conversation, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.get("/conversations/me/", response_model=List[ConversationWithMessages])
def read_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all conversations the current user is part of.
    Returns a list of conversations, each including its latest message.
    """
    try:
        conversations = get_conversations_by_user_db(db, current_user.user_id)
        # Manually serialize messages if ORM model includes relationships not directly mapped by Pydantic
        # If ConversationWithMessages uses orm_mode=True and relationships are set up, this might be automatic.
        return conversations
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.get("/conversations/{conversation_id}/messages/", response_model=List[Message])
def read_messages_in_conversation(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Retrieves messages for a specific conversation.
    
    - **conversation_id**: The UUID of the conversation.
    - **limit**: Maximum number of messages to retrieve (default 20, max 100).
    - **offset**: Number of messages to skip for pagination (default 0).
    
    Requires authentication and that the user is part of the conversation.
    """
    conversation = get_conversation_db(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    # Authorization: Check if the current user is either the parent or the child in this conversation
    if current_user.user_id not in (conversation.parent_id, conversation.child_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not part of this conversation.")

    try:
        messages = get_messages_in_conversation_db(db, conversation_id, limit, offset)
        # Mark messages as read after fetching them
        mark_messages_as_read_db(db, conversation_id, current_user.user_id)
        return messages
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.post("/conversations/{conversation_id}/messages/", response_model=Message, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: uuid.UUID,
    message_create: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends a new message within an existing conversation.
    
    - **conversation_id**: The UUID of the conversation to send the message to.
    - **receiver_id**: The UUID of the intended recipient.
    - **content**: The message content.
    
    Requires authentication. The sender must be a participant in the conversation.
    The receiver must also be a participant.
    """
    conversation = get_conversation_db(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    # Authorization: Check if the current user is a participant
    if current_user.user_id not in (conversation.parent_id, conversation.child_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not part of this conversation.")

    # Authorization: Check if the specified receiver is the other participant
    sender_id = current_user.user_id
    receiver_id = message_create.receiver_id
    
    if sender_id == receiver_id:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send a message to yourself.")

    # Determine who the expected receiver is based on sender
    expected_receiver = conversation.child_id if sender_id == conversation.parent_id else conversation.parent_id
    if receiver_id != expected_receiver:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid receiver ID for this conversation.")

    try:
        # Ensure receiver also belongs to the same family
        receiver_user = get_user_db(db, receiver_id)
        if not receiver_user or receiver_user.family_id != current_user.family_id:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Receiver must exist and belong to the same family.")

        new_message = create_message_db(db, message_create, sender_id, conversation_id)
        
        # Potentially trigger a WebSocket push notification here
        
        return new_message
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import desc
import uuid

from backend.src.models.messages import Message as DBMessage, Conversation as DBConversation
from backend.src.schemas.messages import MessageCreate, ConversationCreate
from backend.src.models.users import User

def create_conversation_db(db: Session, conversation: ConversationCreate, created_by_user_id: uuid.UUID):
    """
    Creates a new conversation in the database.
    Ensures the requesting user is either the parent or child.
    """
    # Validate that the user creating the conversation is one of the participants
    if created_by_user_id not in (conversation.parent_id, conversation.child_id):
        raise ValueError("User must be a participant in the conversation to create it.")

    # Ensure parent_id and child_id are different
    if conversation.parent_id == conversation.child_id:
        raise ValueError("Parent and child cannot be the same user.")

    db_conversation = DBConversation(
        conversation_id=uuid.uuid4(),
        parent_id=conversation.parent_id,
        child_id=conversation.child_id
    )
    try:
        db.add(db_conversation)
        db.commit()
        db.refresh(db_conversation)
        return db_conversation
    except IntegrityError:
        db.rollback()
        # Check if conversation already exists (case-insensitive comparison might be needed depending on schema definition)
        existing_conv = db.query(DBConversation).filter(
            ((DBConversation.parent_id == conversation.parent_id) & (DBConversation.child_id == conversation.child_id)) |
            ((DBConversation.parent_id == conversation.child_id) & (DBConversation.child_id == conversation.parent_id))
        ).first()
        if existing_conv:
            raise ValueError("Conversation already exists between these users.")
        else:
            raise ValueError("Could not create conversation due to data integrity issue.")
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during conversation creation: {e}")


def get_conversation_db(db: Session, conversation_id: uuid.UUID):
    """
    Retrieves a specific conversation by its ID.
    """
    try:
        return db.query(DBConversation).filter(DBConversation.conversation_id == conversation_id).first()
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching conversation: {e}")

def get_conversations_by_user_db(db: Session, user_id: uuid.UUID):
    """
    Retrieves all conversations associated with a user (either as parent or child).
    Includes the latest message for each conversation.
    """
    try:
        # Fetch conversations where the user is either parent or child
        conversations = db.query(DBConversation)
        # Filter for conversations involving the user_id
        conversations = conversations.filter(
            (DBConversation.parent_id == user_id) | (DBConversation.child_id == user_id)
        )
        
        # Load related messages, ordered by sent_at descending, and limit to the latest one
        conversations = conversations.options(
            joinedload(DBConversation.messages, order_by=desc(DBMessage.sent_at), limit=1)
        )
        
        return conversations.all()
        
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching conversations: {e}")

def get_messages_in_conversation_db(db: Session, conversation_id: uuid.UUID, limit: int = 20, offset: int = 0):
    """
    Retrieves messages for a specific conversation, ordered by time.
    Supports pagination.
    """
    try:
        messages = db.query(DBMessage)
        messages = messages.filter(DBMessage.conversation_id == conversation_id)
        messages = messages.order_by(desc(DBMessage.sent_at))
        messages = messages.limit(limit).offset(offset)
        return messages.all()
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching messages: {e}")


def create_message_db(db: Session, message: MessageCreate, sender_id: uuid.UUID, conversation_id: uuid.UUID):
    """
    Creates a new message in the database.
    """
    db_message = DBMessage(
        message_id=uuid.uuid4(),
        conversation_id=conversation_id,
        sender_id=sender_id,
        receiver_id=message.receiver_id,
        content=message.content
    )
    try:
        db.add(db_message)
        # Update conversation's updated_at timestamp
        conversation = db.query(DBConversation).filter(DBConversation.conversation_id == conversation_id).first()
        if conversation:
            conversation.updated_at = func.now()

        db.commit()
        db.refresh(db_message)
        return db_message
    except IntegrityError:
        db.rollback()
        raise ValueError("Could not create message due to data integrity issue.")
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during message creation: {e}")

def mark_messages_as_read_db(db: Session, conversation_id: uuid.UUID, user_id: uuid.UUID):
    """
    Marks all unread messages in a conversation as read for a specific user.
    Ensures the user is part of the conversation.
    """
    try:
        conversation = db.query(DBConversation).filter(
            DBConversation.conversation_id == conversation_id,
            (DBConversation.parent_id == user_id) | (DBConversation.child_id == user_id)
        ).first()
        
        if not conversation:
            raise ValueError("User is not part of this conversation.")

        # Find messages in this conversation sent by the *other* participant and not yet read by user_id
        # Determine the sender_id based on the user_id
        other_participant_id = conversation.child_id if conversation.parent_id == user_id else conversation.parent_id
        
        # Update unread messages where sender is the other participant and read_at is NULL
        # We assume read_at signifies when the recipient read the message.
        # If user_id is the parent, they are reading messages sent by the child.
        # If user_id is the child, they are reading messages sent by the parent.
        
        messages_to_update = db.query(DBMessage)
        messages_to_update = messages_to_update.filter(
            DBMessage.conversation_id == conversation_id,
            DBMessage.sender_id == other_participant_id,
            DBMessage.read_at == None
        )
        
        updated_count = 0
        for msg in messages_to_update:
            msg.read_at = func.now()
            updated_count += 1
            
        if updated_count > 0:
            db.commit()
        
        return updated_count

    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred while marking messages as read: {e}")


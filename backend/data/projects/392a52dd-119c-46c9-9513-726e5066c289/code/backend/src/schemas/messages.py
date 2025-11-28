from pydantic import BaseModel, Field
import uuid
from datetime import datetime
from typing import Optional, List


class MessageBase(BaseModel):
    content: str = Field(..., example="Hi sweetie! Don't forget your soccer practice at 5 PM.")


class MessageCreate(MessageBase):
    receiver_id: uuid.UUID


class Message(MessageBase):
    message_id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    sent_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class ConversationBase(BaseModel):
    parent_id: uuid.UUID
    child_id: uuid.UUID


class ConversationCreate(ConversationBase):
    pass


class Conversation(ConversationBase):
    conversation_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ConversationWithMessages(Conversation):
    messages: List[Message] = []


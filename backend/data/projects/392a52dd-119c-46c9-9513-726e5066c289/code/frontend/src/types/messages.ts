import { UUID } from './common';

export interface MessageBase {
  content: string;
}

export interface MessageCreate extends MessageBase {
  receiver_id: UUID;
}

export interface Message extends MessageBase {
  message_id: UUID;
  conversation_id: UUID;
  sender_id: UUID;
  receiver_id: UUID;
  sent_at: string;
  read_at: string | null;
}

export interface ConversationBase {
  parent_id: UUID;
  child_id: UUID;
}

export interface ConversationCreate extends ConversationBase {}

export interface Conversation extends ConversationBase {
  conversation_id: UUID;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

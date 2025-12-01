import { TaskStatus, TaskPriority } from './enums'; // Assuming you have enums defined

// User related types
export interface User {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    // Add other relevant user fields
}

// Team related types
export interface Team {
    team_id: string;
    team_name: string;
    members?: User[]; // Optional: to include team members
    // Add other relevant team fields
}

// Project related types
export interface Project {
    project_id: string;
    team_id: string;
    project_name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    // Add other relevant project fields
}

// Task related types
export interface Task {
    task_id: string;
    project_id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
    created_at: string;
    updated_at: string;
    assignees?: User[]; // Users assigned to the task
    comments?: Comment[]; // Comments on the task
    attachments?: Attachment[]; // Attachments for the task
    // Add other relevant task fields
}

// Comment related types
export interface Comment {
    comment_id: string;
    task_id: string;
    user_id: string;
    user?: User; // Optional: Author of the comment
    comment_text: string;
    created_at: string;
    updated_at: string;
}

// Attachment related types
export interface Attachment {
    attachment_id: string;
    task_id?: string | null; // Nullable if it's a project-level attachment
    project_id?: string | null;
    user_id: string;
    file_name: string;
    file_path: string; // URL or path to the file
    file_type: string; // MIME type, e.g., 'image/png', 'application/pdf'
    file_size: number; // Size in bytes
    version?: number;
    created_at: string;
    // Add other relevant attachment fields
}

// Chat related types
export interface ChatMessage {
    message_id: number;
    sender_id: string;
    receiver_id?: string | null; // For direct messages
    chat_room_id?: string | null; // For group chats
    message_text: string;
    sent_at: string;
    sender?: User; // Optional: sender details
}

export interface ChatRoom {
    chat_room_id: string;
    room_name?: string; // For group chats
    members: User[];
    last_message?: ChatMessage; 
    created_at: string;
    // Add other relevant chat room fields
}

// API Response Types (Examples)
export interface ApiResponse<T> {
    data: T;
    message: string;
    status: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total_items: number;
    current_page: number;
    page_size: number;
    total_pages: number;
}

// Enum definitions (assuming they are in './enums')
// export enum TaskStatus { TO_DO = 'To Do', IN_PROGRESS = 'In Progress', UNDER_REVIEW = 'Under Review', DONE = 'Done' }
// export enum TaskPriority { LOW = 'Low', MEDIUM = 'Medium', HIGH = 'High', URGENT = 'Urgent' }

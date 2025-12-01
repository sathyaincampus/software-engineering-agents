-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams Table
CREATE TABLE teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Teams Mapping Table (for many-to-many relationship between users and teams)
CREATE TABLE user_teams (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- e.g., 'admin', 'member'
    PRIMARY KEY (user_id, team_id)
);

-- Projects Table (Assuming projects belong to teams)
CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_name_per_team UNIQUE (team_id, project_name)
);

-- Tasks Table
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'To Do', -- e.g., 'To Do', 'In Progress', 'Under Review', 'Done'
    priority VARCHAR(50) DEFAULT 'Medium', -- e.g., 'Low', 'Medium', 'High', 'Urgent'
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Assignees Mapping Table (for many-to-many relationship between tasks and users)
CREATE TABLE task_assignees (
    task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id)
);

-- Comments Table
CREATE TABLE comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attachments Table
CREATE TABLE attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(task_id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE, -- Attachments can be project-level too
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL, -- Path to store the file, e.g., on S3
    file_type VARCHAR(100), -- e.g., 'image/jpeg', 'application/pdf'
    file_size INT, -- in bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1 -- For basic version control
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    message_id BIGSERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- For direct messages
    chat_room_id UUID, -- For group chats, can be NULL for direct messages if receiver_id is used
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_attachments_task_id ON attachments(task_id);
CREATE INDEX idx_attachments_project_id ON attachments(project_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_chat_room_id ON chat_messages(chat_room_id);
CREATE INDEX idx_chat_messages_sent_at ON chat_messages(sent_at);
CREATE INDEX idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX idx_user_teams_team_id ON user_teams(team_id);
CREATE INDEX idx_projects_team_id ON projects(team_id);

-- Enable UUID-generated keys extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Function to update 'updated_at' timestamp automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables that have an 'updated_at' column
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'teams', 'projects', 'tasks', 'comments')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp ON %I;', tbl_name);
        EXECUTE format('CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();', tbl_name);
    END LOOP;
END;
$$;

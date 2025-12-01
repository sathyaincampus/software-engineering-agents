import React, { useState } from 'react';
import { ListItem, ListItemText, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew'; // For preview action

// Assuming Attachment type matches backend schema
interface Attachment {
    attachment_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    created_at: string;
}

interface TaskAttachmentProps {
    attachment: Attachment;
    onPreviewClick: (attachment: Attachment) => void;
    onDeleteClick: (attachmentId: string) => void;
    // Add other handlers as needed, e.g., for downloading
}

const TaskAttachment: React.FC<TaskAttachmentProps> = ({ attachment, onPreviewClick, onDeleteClick }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handlePreview = () => {
        onPreviewClick(attachment);
        handleMenuClose();
    };

    const handleDelete = () => {
        onDeleteClick(attachment.attachment_id);
        handleMenuClose();
    };

    // Helper to format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <ListItem
            secondaryAction={
                <>
                    <Tooltip title="More actions">
                        <IconButton edge="end" aria-label="more" onClick={handleMenuOpen}>
                            <MoreVertIcon />
                        </IconButton>
                    </Tooltip>
                </>
            }
            sx={{ mb: 1, border: '1px solid', borderColor: 'grey.300', borderRadius: '4px', px: 2, py: 1 }}
        >
            <InsertDriveFileIcon sx={{ mr: 2, color: 'primary.main' }} />
            <ListItemText
                primary={attachment.file_name}
                secondary={`${attachment.file_type} - ${formatFileSize(attachment.file_size)}`}
                primaryTypographyProps={{ variant: 'body1', noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Menu
                id={`attachment-menu-${attachment.attachment_id}`}
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                MenuListProps={{
                    'aria-labelledby': `attachment-button-${attachment.attachment_id}`,
                }}
            >
                <MenuItem onClick={handlePreview} disabled={!['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'].includes(attachment.file_type)}>
                    <OpenInNewIcon sx={{ mr: 1 }} />
                    Preview
                </MenuItem>
                <MenuItem onClick={() => { window.open(attachment.file_path, '_blank'); handleMenuClose(); }}>
                    <OpenInNewIcon sx={{ mr: 1 }} />
                    Open in new tab
                </MenuItem>
                 <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    {/* <DeleteIcon sx={{ mr: 1 }} /> */}
                    Delete
                </MenuItem>
            </Menu>
        </ListItem>
    );
};

export default TaskAttachment;

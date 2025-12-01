import React, { useState, useCallback } from 'react';
import { Box, Typography, List, Button, CircularProgress, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TaskAttachment from './TaskAttachment';
import DocumentPreview from '../common/DocumentPreview';
import { useApi } from '../../hooks/useApi'; // Assuming you have a custom hook for API calls
import { Attachment } from '../../types/api'; // Assuming you have defined types

interface TaskAttachmentsProps {
    taskId: string;
    attachments: Attachment[];
    onAttachmentsChange: (newAttachments: Attachment[]) => void;
    readOnly?: boolean;
}

const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId, attachments, onAttachmentsChange, readOnly = false }) => {
    const { apiClient } = useApi();
    const [uploading, setUploading] = useState<boolean>(false);
    const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('task_id', taskId); // Assuming backend needs task ID to associate attachment

        setUploading(true);
        try {
            // TODO: Implement actual file upload API call
            // const response = await apiClient.post(`/tasks/${taskId}/attachments`, formData, {
            //     headers: {
            //         'Content-Type': 'multipart/form-data'
            //     }
            // });
            
            // Mock response for now
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload time
            const mockAttachment: Attachment = {
                attachment_id: `att_${Date.now()}`,
                file_name: file.name,
                file_path: URL.createObjectURL(file), // Use temporary URL for preview, backend will provide final URL
                file_type: file.type || 'application/octet-stream',
                file_size: file.size,
                created_at: new Date().toISOString()
            };
            const newAttachments = [...attachments, mockAttachment];
            onAttachmentsChange(newAttachments);
            
            // Reset file input
            event.target.value = '';

        } catch (error) {
            console.error("Failed to upload attachment:", error);
            // TODO: Show error message to user
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
        // TODO: Implement actual delete API call
        // try {
        //     await apiClient.delete(`/attachments/${attachmentId}`);
        //     onAttachmentsChange(attachments.filter(att => att.attachment_id !== attachmentId));
        // } catch (error) {
        //     console.error("Failed to delete attachment:", error);
        //     // TODO: Show error message
        // }
        
        // Mock deletion
        console.log("Deleting attachment:", attachmentId); 
        onAttachmentsChange(attachments.filter(att => att.attachment_id !== attachmentId));
        // If the deleted attachment was open for preview, close the preview
        if (previewAttachment?.attachment_id === attachmentId) {
            handleClosePreview();
        }
    }, [attachments, onAttachmentsChange, previewAttachment]);

    const handleOpenPreview = useCallback((attachment: Attachment) => {
        // Only allow preview for supported types
        const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];
        if (supportedTypes.includes(attachment.file_type)) {
            setPreviewAttachment(attachment);
            setIsPreviewOpen(true);
        } else {
             // Optionally, trigger download or show a message
             console.log("Preview not supported for this file type.");
             // For now, let's just open it in a new tab if not supported for preview
             window.open(attachment.file_path, '_blank');
        }
    }, []);

    const handleClosePreview = useCallback(() => {
        setIsPreviewOpen(false);
        setPreviewAttachment(null);
    }, []);

    // Function to get a file URL that can be previewed/downloaded
    // In a real app, this might involve a backend endpoint to get signed URLs
    const getFileUrl = (attachment: Attachment): string => {
        // If it's a temporary URL from file input, use it directly for preview
        if (attachment.file_path.startsWith('blob:')) {
            return attachment.file_path;
        }
        // Otherwise, assume it's a path pointing to a backend endpoint or S3 URL
        // This might need adjustment based on your API structure
        return `${apiClient.defaults.baseURL || ''}/files/${attachment.attachment_id}`;
        // Or if using S3 directly: return attachment.file_path;
    };

    return (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Attachments</Typography>
                {!readOnly && (
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
                        disabled={uploading}
                        size="small"
                    >
                        {uploading ? 'Uploading...' : 'Add Attachment'}
                        <input 
                            type="file"
                            hidden 
                            onChange={handleFileChange}
                        />
                    </Button>
                )}
            </Box>
            {attachments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No attachments yet.</Typography>
            ) : (
                <List dense>
                    {attachments.map((att) => (
                        <TaskAttachment 
                            key={att.attachment_id} 
                            attachment={att}
                            onPreviewClick={handleOpenPreview}
                            onDeleteClick={handleDeleteAttachment}
                        />
                    ))}
                </List>
            )}
            
            {/* Document Preview Dialog */} 
            <DocumentPreview 
                open={isPreviewOpen}
                onClose={handleClosePreview}
                filePath={previewAttachment ? getFileUrl(previewAttachment) : ''}
                fileName={previewAttachment?.file_name || ''}
                fileType={previewAttachment?.file_type || ''}
            />
        </Paper>
    );
};

export default TaskAttachments;

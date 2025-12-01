import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, IconButton, Dialog, DialogContent, DialogTitle, AppBar, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface DocumentPreviewProps {
    filePath: string; // URL to the document
    fileName: string;
    fileType: string;
    open: boolean;
    onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ filePath, fileName, fileType, open, onClose }) => {
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !filePath) {
            setPreviewContent(null);
            setLoading(false);
            setError(null);
            return;
        }

        const fetchAndPreview = async () => {
            setLoading(true);
            setError(null);
            setPreviewContent(null); // Reset previous content

            try {
                // Determine how to handle different file types
                if (fileType.startsWith('image/')) {
                    // For images, simply use the src attribute
                    setPreviewContent(filePath);
                } else if (fileType === 'text/plain') {
                    // Fetch and display plain text
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch text file: ${response.statusText}`);
                    }
                    const text = await response.text();
                    setPreviewContent(text);
                } else if (fileType === 'application/pdf') {
                    // For PDFs, we can use an iframe or a dedicated PDF viewer library
                    // Using iframe for simplicity here. For better experience, consider pdf.js
                    setPreviewContent(filePath); // The iframe will load this URL
                } else {
                    // For unsupported types, show a message and link to download
                    setError(`Preview not supported for file type: ${fileType}. Please download the file.`);
                    setPreviewContent(filePath); // Store filePath to use in download link if error state is shown
                }
            } catch (err: any) {
                console.error("Error previewing document:", err);
                setError(`Could not load preview. ${err.message}`);
                setPreviewContent(filePath); // Still provide download link if error occurs
            } finally {
                setLoading(false);
            }
        };

        fetchAndPreview();
    }, [filePath, fileType, open]);

    const renderContent = () => {
        if (loading) {
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="70vh"
                    flexDirection="column"
                >
                    <CircularProgress />
                    <Typography variant="body1" sx={{ mt: 2 }}>Loading preview...</Typography>
                </Box>
            );
        }

        if (error) {
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="70vh"
                    flexDirection="column"
                    textAlign="center"
                    p={2}
                >
                    <Typography variant="h6" color="error" gutterBottom>{error}</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>You can download the file instead:</Typography>
                    <a href={filePath} download={fileName} style={{ color: 'inherit', textDecoration: 'underline' }}>
                        {fileName}
                    </a>
                </Box>
            );
        }

        // Render based on file type
        if (fileType.startsWith('image/')) {
            return <img src={previewContent!} alt={fileName} style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: 'auto' }} />;
        } else if (fileType === 'text/plain') {
            return (
                <Box
                    component="pre"
                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', p: 2, maxHeight: '70vh', overflowY: 'auto', fontFamily: 'monospace' }}
                >
                    {previewContent}
                </Box>
            );
        } else if (fileType === 'application/pdf') {
            // Using an iframe for PDF preview
            return (
                <Box sx={{ width: '100%', height: '70vh' }}>
                    <iframe 
                        src={previewContent!} 
                        title={fileName}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                </Box>
            );
        } 
        
        // Fallback for unexpected scenarios or if error state above was bypassed
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="70vh"
                flexDirection="column"
                textAlign="center"
                p={2}
            >
                 <Typography variant="h6" color="warning" gutterBottom>Unsupported Preview</Typography>
                 <Typography variant="body1" sx={{ mb: 2 }}>This file type cannot be previewed directly. Please download it.</Typography>
                 <a href={filePath} download={fileName} style={{ color: 'inherit', textDecoration: 'underline' }}>
                     {fileName}
                 </a>
            </Box>
        );
    };

    return (
        <Dialog 
            fullScreen 
            open={open} 
            onClose={onClose} 
            aria-labelledby="document-preview-title"
        >
            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                        {fileName}
                    </Typography>
                    <a 
                        href={filePath} 
                        download={fileName} 
                        style={{ color: 'inherit', textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()} // Prevent dialog close on download click
                    >
                        Download
                    </a>
                </Toolbar>
            </AppBar>
            <DialogContent dividers sx={{ p: 0, bgcolor: '#f5f5f5' }}>
                 {renderContent()}
            </DialogContent>
        </Dialog>
    );
};

export default DocumentPreview;

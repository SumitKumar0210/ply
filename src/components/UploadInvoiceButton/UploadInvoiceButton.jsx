import React, { useState } from "react";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Tooltip,
    IconButton,
    Snackbar,
    Alert,
    Typography,
    Box,
} from "@mui/material";
import { IoMdCloudUpload, IoMdDocument } from "react-icons/io";
import api from "../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../toast";

const UploadInvoiceButton = ({ row }) => {
    const mediaUrl = import.meta.env.VITE_MEDIA_URL;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    const [document, setDocument] = useState({ id: null, isOpen: false });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [fileError, setFileError] = useState("");
    const [uploadedFileUrl, setUploadedFileUrl] = useState(
        row?.document ? mediaUrl + row.document : null
    );
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Open modal
    const handleOpen = (id) => {
        setDocument({ id, isOpen: true });
        setFileError(""); // Clear any previous errors
    };

    // Close modal
    const handleClose = () => {
        setDocument({ id: null, isOpen: false });
        setFile(null);
        setFileError("");
    };

    // Handle file selection with validation
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        
        if (!selectedFile) {
            setFile(null);
            setFileError("");
            return;
        }

        // Validate file size
        if (selectedFile.size > MAX_FILE_SIZE) {
            setFileError(`File size must be less than 5MB. Your file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
            setFile(null);
            e.target.value = ""; // Clear the input
            
            setSnackbar({
                open: true,
                message: `File is too large! Maximum size is 5MB. Your file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`,
                severity: "error",
            });
            return;
        }

        // File is valid
        setFile(selectedFile);
        setFileError("");
    };

    // Upload document
    const submitDocument = async () => {
        if (!file) {
            setSnackbar({
                open: true,
                message: "Please select a file before submitting.",
                severity: "warning",
            });
            return;
        }

        // Double-check file size before upload
        if (file.size > MAX_FILE_SIZE) {
            setSnackbar({
                open: true,
                message: "File size exceeds 5MB limit.",
                severity: "error",
            });
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append("invoice", file);
            formData.append("id", document.id);

            // ✅ Correct endpoint (adjust to match your Laravel route)
            const res = await api.post(
                `/admin/purchase-inward/upload-invoice/${document.id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (res.data.success) {
                setUploadedFileUrl(res.data.file_url);
                successMessage("Invoice uploaded successfully!");
                setSnackbar({
                    open: true,
                    message: "Invoice uploaded successfully!",
                    severity: "success",
                });
                handleClose();
            } else {
                throw new Error(res.data.message || "Upload failed");
            }
        } catch (error) {
            errorMessage(getErrorMessage(error));
            setSnackbar({
                open: true,
                message: getErrorMessage(error) || "Something went wrong during upload.",
                severity: "error",
            });
        } finally {
            setUploading(false);
        }
    };

    // View uploaded file
    const handleViewDocument = () => {
        if (uploadedFileUrl) {
            window.open(uploadedFileUrl, "_blank");
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Format file size for display
    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    return (
        <>
            {!uploadedFileUrl ? (
                <Tooltip title="Upload Invoice">
                    <IconButton
                        color="primary"
                        onClick={() => handleOpen(row.id)} // ✅ fixed
                    >
                        <IoMdCloudUpload size={18} />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="View Uploaded Invoice">
                    <IconButton color="success" onClick={handleViewDocument}>
                        <IoMdDocument size={18} />
                    </IconButton>
                </Tooltip>
            )}

            {/* Upload Dialog */}
            <Dialog open={document.isOpen} onClose={handleClose} fullWidth maxWidth="xs">
                <DialogTitle>Upload Invoice</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            type="file"
                            fullWidth
                            onChange={handleFileChange}
                            inputProps={{ accept: "image/*,.pdf" }}
                            error={!!fileError}
                            helperText={fileError || "Maximum file size: 5MB"}
                        />
                        
                        {/* Display selected file info */}
                        {file && !fileError && (
                            <></>
                            // <Box sx={{ mt: 2, p: 1.5, bgcolor: "success.light", borderRadius: 1 }}>
                            //     <Typography variant="body2" color="success.dark">
                            //         <strong>Selected File:</strong> {file.name}
                            //     </Typography>
                            //     <Typography variant="caption" color="success.dark">
                            //         Size: {formatFileSize(file.size)}
                            //     </Typography>
                            // </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} color="error" variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={submitDocument}
                        variant="contained"
                        color="primary"
                        disabled={uploading || !!fileError || !file}
                    >
                        {uploading ? <CircularProgress size={20} color="inherit" /> : "Submit"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default UploadInvoiceButton;
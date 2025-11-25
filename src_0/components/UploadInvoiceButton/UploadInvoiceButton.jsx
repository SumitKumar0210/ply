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
} from "@mui/material";
import { IoMdCloudUpload, IoMdDocument } from "react-icons/io";
import api from "../../api";

const UploadInvoiceButton = ({ row }) => {
    const mediaUrl = import.meta.env.VITE_MEDIA_URL;
    const [document, setDocument] = useState({ id: null, isOpen: false });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedFileUrl, setUploadedFileUrl] = useState(
        row?.document ? mediaUrl + row.document : null
    ); const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Open modal
    const handleOpen = (id) => {
        setDocument({ id, isOpen: true });
    };

    // Close modal
    const handleClose = () => {
        setDocument({ id: null, isOpen: false });
        setFile(null);
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
            console.error("Upload error:", error);
            setSnackbar({
                open: true,
                message: error.message || "Something went wrong during upload.",
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
                    <TextField
                        type="file"
                        fullWidth
                        onChange={(e) => setFile(e.target.files[0])}
                        inputProps={{ accept: "image/*,.pdf" }}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} color="error" variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={submitDocument}
                        variant="contained"
                        color="primary"
                        disabled={uploading}
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

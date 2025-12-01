import React, { useState } from "react";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Typography,
    Box,
    CircularProgress,
} from "@mui/material";
import { compressImage } from "../imageCompressor/imageCompressor";

export default function FailQcModal({ open, onClose, onSubmit }) {
    const [reason, setReason] = useState("");
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [fileError, setFileError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    const handleFileChange = async (e) => {
        let selected = e.target.files[0];
        if (!selected) return;

        setFileError("");

        if (!allowedTypes.includes(selected.type)) {
            setFileError("Only JPG, PNG, WEBP images or PDF files are allowed.");
            return;
        }

        // ---------- PDF ----------
        if (selected.type === "application/pdf") {
            if (selected.size > MAX_SIZE_BYTES) {
                setFileError("PDF must be less than 5 MB.");
                return;
            }
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
            return;
        }

        // ---------- IMAGE ----------
        try {
            if (selected.size > MAX_SIZE_BYTES) {
                setFileError("Image must be less than 5 MB.");
                return;
            }

            const compressed = await compressImage(selected, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
            });

            if (compressed.size > MAX_SIZE_BYTES) {
                setFileError("Compressed image still exceeds 5 MB. Please select a smaller image.");
                return;
            }

            setFile(compressed);
            setPreviewUrl(URL.createObjectURL(compressed));
        } catch (err) {
            console.error("Compression error:", err);
            setFileError("Failed to compress image.");
        }
    };

    const handleSubmit = async () => {
        let hasError = false;

        if (!reason.trim()) {
            setReasonError("Please enter reason.");
            hasError = true;
        } else {
            setReasonError("");
        }

        if (!file) {
            setFileError("Please upload an image or PDF.");
            hasError = true;
        }

        if (hasError) return;

        const payload = {
            reason: reason.trim(),
            doc: file,
        };

        setIsSubmitting(true);

        try {
            await onSubmit(payload);
            
            // Only reset and close if submission was successful
            setReason("");
            setFile(null);
            setPreviewUrl("");
            setReasonError("");
            setFileError("");
            onClose();
        } catch (error) {
            console.error("Submit error:", error);
            setFileError("Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReasonChange = (e) => {
        setReason(e.target.value);
        if (reasonError) setReasonError("");
    };

    const handleClose = () => {
        if (isSubmitting) return; // Prevent closing while submitting
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm" 
            fullWidth
            disableEscapeKeyDown={isSubmitting}
        >
            <DialogTitle sx={{ borderBottom: "1px solid #ddd" }}>
                Fail QC
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <TextField
                        label="Reason for QC failure"
                        fullWidth
                        multiline
                        rows={3}
                        value={reason}
                        onChange={handleReasonChange}
                        error={!!reasonError}
                        helperText={reasonError}
                        disabled={isSubmitting}
                    />

                    <Box>
                        <Button 
                            variant="outlined" 
                            component="label"
                            disabled={isSubmitting}
                        >
                            Upload Image / PDF
                            <input
                                hidden
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                disabled={isSubmitting}
                            />
                        </Button>
                        {fileError && (
                            <Box
                                sx={{
                                    mt: 1,
                                    p: 1,
                                    border: "1px solid #d32f2f",
                                    borderRadius: 1,
                                    backgroundColor: "#ffebee",
                                }}
                            >
                                <Typography color="error" sx={{ fontSize: 12 }}>
                                    {fileError}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {previewUrl && (
                        <Box sx={{ border: "1px solid #ddd", p: 1, borderRadius: 1 }}>
                            {file?.type === "application/pdf" ? (
                                <Typography sx={{ fontSize: 14 }}>
                                    PDF Selected: {file.name}
                                </Typography>
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt="preview"
                                    width="100%"
                                    style={{ maxHeight: 200, objectFit: "contain" }}
                                />
                            )}
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button 
                    onClick={handleClose}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    color="error" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
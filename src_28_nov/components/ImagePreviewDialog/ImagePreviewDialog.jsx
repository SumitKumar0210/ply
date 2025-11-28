// first run this code npm install framer-motion then use blow code
import React, { useState } from "react";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";

const ImagePreviewDialog = ({
    imageUrl,
    alt = "Preview",
    thumbWidth = 50,
    thumbHeight = 50,
}) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Thumbnail image */}
            <motion.img
                src={imageUrl}
                alt={alt}
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.3 }}
                style={{
                    width: thumbWidth,
                    height: thumbHeight,
                    objectFit: "cover",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    cursor: "pointer",
                }}
                onClick={() => setOpen(true)}
            />

            {/* Zoom Dialog */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: "rgba(0,0,0,0.9)",
                        boxShadow: "none",
                    },
                }}
            >
                <DialogContent
                    sx={{
                        position: "relative",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        p: 0,
                    }}
                >
                    {/* Close button */}
                    <IconButton
                        onClick={() => setOpen(false)}
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            color: "#fff",
                            zIndex: 2,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    {/* Animated Zoom Image */}
                    <motion.img
                        src={imageUrl}
                        alt={alt}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            width: "100%",
                            height: "auto",
                            objectFit: "contain",
                            maxHeight: "90vh",
                            borderRadius: "8px",
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ImagePreviewDialog;

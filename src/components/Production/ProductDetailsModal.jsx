// components/ProductDetailsModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Button,
  Typography,
  Grid,
  Chip,
  TextareaAutosize,
  Skeleton,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { TbTruckDelivery } from "react-icons/tb";
import { FiEdit } from "react-icons/fi";
import { AiOutlineFilePdf } from "react-icons/ai";
import { ImAttachment } from "react-icons/im";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MdWarning } from "react-icons/md";

import Drawing from "../../assets/images/drawing.png";
import MessageTimeline from "../TimelineHistory/Timeline";
import { storeMessage } from "../../pages/Production/slice/messageSlice";
import { storeAttachment } from "../../pages/Production/slice/attachmentSlice";
import { compressImage } from "../imageCompressor/imageCompressor";
import { markReadyForDelivey } from "../../pages/Production/slice/productionChainSlice";
import { successMessage, errorMessage } from "../../toast";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
}));

function BootstrapDialogTitle({ children, onClose, ...other }) {
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>
  );
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const isImageFile = (file) =>
  file && file.type && file.type.startsWith("image/");
const isPdfFile = (file) => file && file.type === "application/pdf";
const isValidFile = (file) => isImageFile(file) || isPdfFile(file);
const openFileInNewTab = (url) =>
  window.open(url, "_blank", "noopener,noreferrer");

// Skeleton Loading Component
const DetailsSkeleton = () => (
  <>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Box>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={120} height={20} />
      </Box>
      <Skeleton
        variant="rectangular"
        width={180}
        height={36}
        sx={{ borderRadius: 1 }}
      />
    </Box>

    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Box>
          {[...Array(6)].map((_, idx) => (
            <Box key={idx} sx={{ display: "flex", mb: 1.5 }}>
              <Skeleton variant="text" width={120} height={24} sx={{ mr: 2 }} />
              <Skeleton variant="text" width="60%" height={24} />
            </Box>
          ))}
        </Box>
      </Grid>

      <Grid item xs={12} md={6} style={{ textAlign: "right" }}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          sx={{ maxWidth: 300, borderRadius: 1, ml: "auto" }}
        />
      </Grid>
    </Grid>

    <Grid container spacing={2} sx={{ marginTop: 2 }}>
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", mb: 1 }}>
            <Skeleton variant="text" width={100} height={24} sx={{ mr: 2 }} />
          </Box>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={80}
            sx={{ borderRadius: 1 }}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", mb: 1 }}>
            <Skeleton variant="text" width={140} height={24} sx={{ mr: 2 }} />
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[...Array(3)].map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rectangular"
                width={120}
                height={36}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", mb: 1 }}>
            <Skeleton variant="text" width={60} height={24} sx={{ mr: 2 }} />
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[...Array(4)].map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rectangular"
                width={100}
                height={36}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", mb: 1 }}>
            <Skeleton variant="text" width={80} height={24} sx={{ mr: 2 }} />
          </Box>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={80}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ display: "flex", justifyContent: "end" }}>
          <Skeleton
            variant="rectangular"
            width={80}
            height={36}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Skeleton variant="text" width={100} height={28} sx={{ mb: 1 }} />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={150}
          sx={{ borderRadius: 1 }}
        />
      </Grid>
    </Grid>
  </>
);

export default function ProductDetailsModal({
  open,
  onClose,
  product,
  onRefresh,
  onOpenTentative,
  loading = false,
}) {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();

  const { data: departments = [] } = useSelector((state) => state.department);
  const { supervisor: supervisorData = [] } = useSelector(
    (state) => state.user
  );
  const { data: materialData = [] } = useSelector((state) => state.material);

  const [message, setMessage] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Local state for attachments and messages
  const [localAttachments, setLocalAttachments] = useState([]);
  const [localMessages, setLocalMessages] = useState([]);

  const [openReadyDialog, setOpenReadyDialog] = useState(false);
  const [submittingReady, setSubmittingReady] = useState(false);

  // Initialize local state when product changes
  useEffect(() => {
    if (product) {
      setMessage("");
      setLocalAttachments(product.attachments || []);
      setLocalMessages(product.messages || []);
    }
  }, [product]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0 || !product) return;

    setUploadingFiles(true);

    try {
      const MAX_SIZE = 5 * 1024 * 1024;
      const formData = new FormData();
      formData.append("pp_id", product.id);

      for (const file of files) {

        if (file.size > MAX_SIZE) {
          errorMessage(`${file.name} exceeds the 5MB file size limit.`);
          return;
        }

        if (!isValidFile(file)) {
          errorMessage(
            `File ${file.name} is not supported. Only images and PDFs are allowed.`
          );
          return;
        }

        if (isImageFile(file)) {
          const compressed = await compressImage(file);
          formData.append("attachments", compressed, file.name);

        } else if (isPdfFile(file)) {
          formData.append("attachments", file);
        }
      }

      const res = await dispatch(storeAttachment(formData));
      if (!res.error) {
        if (res.payload) {
          const newAttachments = Array.isArray(res.payload)
            ? res.payload
            : [res.payload];

          setLocalAttachments((prev) => [...prev, ...newAttachments]);
        }
        onRefresh();
      }
    } catch (error) {
      console.error("File upload error:", error);
      errorMessage("Failed to upload files. Please try again.");
    } finally {
      setUploadingFiles(false);
      event.target.value = "";
    }
  };


  const handleReadyProduct = async () => {
    if (!product?.id) return;

    setSubmittingReady(true);
    try {
      const res = await dispatch(markReadyForDelivey(product.id));

      if (!res.error) {
        setOpenReadyDialog(false);
        onClose(); // Close parent modal
        onRefresh(); // Refresh data
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to mark as ready. Please try again.");
    } finally {
      setSubmittingReady(false);
    }
  };


  const handleSendMessage = async () => {
    if (!message.trim() || !product) return;

    const formData = new FormData();
    formData.append("pp_id", product.id);
    formData.append("message", message);

    const res = await dispatch(storeMessage(formData));
    if (!res.error) {
      // Append new message to local state
      if (res.payload && res.payload) {
        const newMessage = res.payload;
        setLocalMessages((prev) => [...prev, newMessage]);
      }

      setMessage("");
      // Still call onRefresh to update parent state if needed
      onRefresh();
    }
  };

  const currentDepartment = product
    ? departments.find((d) => d.id === product.department_id)
    : null;
  const currentSupervisor = product
    ? supervisorData.find((s) => s.id === product.supervisor_id)
    : null;

  return (
    <>
      <BootstrapDialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <BootstrapDialogTitle onClose={onClose}>
          {loading ? <Skeleton variant="text" width={150} /> : "Order Details"}
        </BootstrapDialogTitle>
        <DialogContent dividers>
          {loading || !product ? (
            <DetailsSkeleton />
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    component="h4"
                    sx={{ fontWeight: 500, m: 0 }}
                  >
                    {product.item_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.group?.trim()}
                  </Typography>
                </Box>
                {currentDepartment?.id == '8' && (
                  <Button
                  variant="outlined"
                  startIcon={<TbTruckDelivery />}
                  color="warning"
                  onClick={() => setOpenReadyDialog(true)}
                >
                  Ready For Delivery
                </Button>
                )}
                
              </Box>

              <Grid container spacing={2} justifyContent="space-between">
                <Grid item xs={12} md={6}>
                  <table className="production-status-details">
                    <tbody>
                      <tr>
                        <td className="title">
                          <strong>Department:</strong>
                        </td>
                        <td>{currentDepartment?.name || "-"}</td>
                      </tr>
                      
                      <tr>
                        <td className="title">
                          <strong>Supervisor:</strong>
                        </td>
                        <td>{currentSupervisor?.name || "-"}</td>
                      </tr>
                      <tr>
                        <td className="title">
                          <strong>Priority:</strong>
                        </td>
                        <td>
                          <Chip
                            label={product.priority || "Not Set"}
                            size="small"
                            color={
                              product.priority === "High"
                                ? "error"
                                : product.priority === "Medium"
                                  ? "warning"
                                  : "success"
                            }
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="title">
                          <strong>quantity:</strong>
                        </td>
                        <td>
                          {product?.qty || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="title">
                          <strong>Start Date:</strong>
                        </td>
                        <td>{product.start_date || "-"}</td>
                      </tr>
                      <tr>
                        <td className="title">
                          <strong>Delivery Date:</strong>
                        </td>
                        <td>{product.delivery_date || "-"}</td>
                      </tr>
                      <tr>
                        <td className="title">
                          <strong>Narration:</strong>
                        </td>
                        <td>{product.narration || "No narration available"}</td>
                      </tr>
                    </tbody>
                  </table>
                </Grid>

                <Grid item xs={12} md={6} style={{ textAlign: "right" }}>
                  {product?.product ? (
                    <img
                      src={mediaUrl + product?.product?.image}
                      alt="product"
                      style={{
                        width: "100%",
                        maxWidth: 300,
                        height: "auto",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        openFileInNewTab(mediaUrl + product?.product?.image)
                      }
                    />
                  ) : (
                    <img
                      src={Drawing}
                      alt="placeholder"
                      style={{
                        width: "100%",
                        maxWidth: 300,
                        height: "auto",
                        borderRadius: 3,
                      }}
                    />
                  )}
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ marginTop: 2 }}>
                <Grid item xs={12} className="production-status">
                  <table className="production-status-details">
                    <tbody>
                      <tr>
                        <td className="title">
                          <strong>Tentative:</strong>
                        </td>
                        <td style={{ position: "relative" }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              columnGap: 2,
                              rowGap: 1,
                              border: "1px solid #ddd",
                              padding: 1,
                              borderRadius: "4px",
                              minHeight: "40px",
                            }}
                          >
                            {product.tentative_items?.length > 0 ? (
                              product.tentative_items.map((item, idx) => {
                                const material = materialData.find(
                                  (m) => m.id == item.material_id
                                );
                                return (
                                  <Typography key={idx} fontSize={14}>
                                    {material?.name || "Unknown"} ({item.qty})
                                  </Typography>
                                );
                              })
                            ) : (
                              <Typography color="text.secondary" fontSize={14}>
                                No tentative items
                              </Typography>
                            )}
                          </Box>
                          <IconButton
                            aria-label="edit"
                            color="info"
                            onClick={() => {
                              onOpenTentative();
                            }}
                            style={{ position: "absolute", top: 5, right: 5 }}
                          >
                            <FiEdit size={16} />
                          </IconButton>
                        </td>
                      </tr>
                      <tr>
                        <td className="title">
                          <strong>Material Requests:</strong>
                        </td>
                        <td>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              columnGap: 2,
                              rowGap: 1,
                            }}
                          >
                            {product.material_request?.length > 0 ? (
                              product.material_request.map((req) => {
                                const material = materialData.find(
                                  (m) => m.id === req.material_id
                                );
                                return (
                                  <Typography
                                    key={req.id}
                                    sx={{
                                      border: "1px solid #ccc",
                                      padding: "2px 8px",
                                      fontSize: "14px",
                                      borderRadius: "4px",
                                      display: "flex",
                                      alignItems: "center",
                                      height: "36px",
                                      backgroundColor: req.status
                                        ? "success.light"
                                        : "grey.200",
                                    }}
                                  >
                                    {material?.name || "Unknown"} (Qty: {req.qty})
                                  </Typography>
                                );
                              })
                            ) : (
                              <Typography color="text.secondary" fontSize={14}>
                                No material requests
                              </Typography>
                            )}
                          </Box>
                        </td>
                      </tr>
                      <tr>
                        <td className="title">
                          <strong>Files:</strong>
                        </td>
                        <td>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              columnGap: 2,
                              rowGap: 1,
                            }}
                          >
                            {localAttachments.length > 0 &&
                              localAttachments.map((att) => (
                                <Typography
                                  key={att.id}
                                  sx={{
                                    border: "1px solid #ccc",
                                    padding: "2px 8px",
                                    fontSize: "14px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    height: "36px",
                                    cursor: "pointer",
                                    "&:hover": {
                                      backgroundColor: "grey.100",
                                    },
                                  }}
                                  onClick={() =>
                                    openFileInNewTab(mediaUrl + att.doc)
                                  }
                                >
                                  <AiOutlineFilePdf
                                    size={16}
                                    style={{ marginRight: 5 }}
                                  />
                                  {att.file_name || "Attachment"}
                                </Typography>
                              ))}
                            <Button
                              component="label"
                              variant="outlined"
                              tabIndex={-1}
                              startIcon={<ImAttachment />}
                              disabled={uploadingFiles}
                              sx={{
                                mt: 0,
                                fontWeight: 500,
                                color: "grey.600",
                                borderColor: "grey.400",
                                "&:hover": {
                                  borderColor: "grey.500",
                                  backgroundColor: "grey.50",
                                },
                              }}
                            >
                              {uploadingFiles ? "Uploading..." : "Upload files"}
                              <VisuallyHiddenInput
                                type="file"
                                onChange={handleFileUpload}
                                multiple
                                accept="image/*,.pdf"
                              />
                            </Button>
                          </Box>
                        </td>
                      </tr>
                      <tr>
                        <td className="title">
                          <strong>Message:</strong>
                        </td>
                        <td>
                          <TextareaAutosize
                            maxRows={4}
                            minRows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            style={{
                              width: "100%",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              padding: "10px",
                              outline: "none",
                              fontFamily: "inherit",
                            }}
                          />
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "end",
                                marginTop: 0,
                              }}
                            >
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSendMessage}
                                disabled={!message.trim()}
                                sx={{ marginTop: 0 }}
                              >
                                Send
                              </Button>
                            </Box>
                          </Grid>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 1, paddingLeft: 1.5 }}>
                    Messages:
                  </Typography>
                  {localMessages.length > 0 ? (
                    <MessageTimeline messages={localMessages} />
                  ) : (
                    <Typography color="text.secondary" sx={{ paddingLeft: 2 }}>
                      No messages yet
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
      </BootstrapDialog>
      <Dialog
        open={openReadyDialog}
        onClose={() => !submittingReady && setOpenReadyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MdWarning size={28} color="#ed6c02" />
            <Typography variant="h6">Confirm Ready for Delivery</Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to mark this product as <strong>Ready for Delivery</strong>?
          </DialogContentText>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important:</strong> This action cannot be undone. Once marked as ready,
            this product will be moved to the delivery queue.
          </Alert>

          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Product Details:
            </Typography>
            <Typography variant="body2">
              <strong>Item:</strong> {product?.item_name}
            </Typography>
            <Typography variant="body2">
              <strong>Group:</strong> {product?.group?.trim()}
            </Typography>
            {product?.start_date && (
              <Typography variant="body2">
                <strong>Start Date:</strong> {product.start_date}
              </Typography>
            )}
            {product?.delivery_date && (
              <Typography variant="body2">
                <strong>Delivery Date:</strong> {product.delivery_date}
              </Typography>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Please verify that:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              All production work is completed
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Quality checks have been performed
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Product is ready to ship
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenReadyDialog(false)}
            variant="outlined"
            disabled={submittingReady}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReadyProduct}
            variant="contained"
            color="warning"
            startIcon={
              submittingReady ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <TbTruckDelivery />
              )
            }
            disabled={submittingReady}
            autoFocus
          >
            {submittingReady ? "Processing..." : "Confirm Ready"}
          </Button>
        </DialogActions>
      </Dialog>
    </>

  );
}

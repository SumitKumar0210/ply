import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
} from "@mui/material";
import { AiOutlineLink } from "react-icons/ai";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import {
  generateLink,
  getLink,
  clearLinkData,
} from "./slice/linkManagementSlice";
import { sendQuotationMail } from "../../pages/Customer/slice/quotationSlice";
import { successMessage, errorMessage } from "../../toast";

const URL = import.meta.env.VITE_FRONTEND_BASE_URL;

const ENTITY_CONFIG = {
  quotation: {
    label: "Quotation",
    mailAction: sendQuotationMail,
    urlPrefix: "quotation/",
  },
  challan: {
    label: "Challan",
    mailAction: null,
    urlPrefix: "challan/",
  },
  purchase_order: {
    label: "Purchase Order",
    mailAction: null, // Add mail action if available
    urlPrefix: "purchase-order/",
  },
};

const LinkGenerator = ({ id, customerId, entity = "quotation" }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.link);

  const [openGenerate, setOpenGenerate] = useState(false);
  const [expiryDays, setExpiryDays] = useState(1);
  const [currentLink, setCurrentLink] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const entityConfig = ENTITY_CONFIG[entity] || ENTITY_CONFIG.quotation;
  const prefix = URL + entityConfig.urlPrefix;

  // Check if link already exists
  const handleGenerateableId = async () => {
    setOpenGenerate(true);
    setCurrentLink(null);

    try {
      const result = await dispatch(getLink({ id, entity })).unwrap();
      setCurrentLink(result.link);

      if (result.link) {
        successMessage(
          result.successMessage ||
          result.message ||
          `Link already exists for this ${entityConfig.label.toLowerCase()}`
        );
      }
    } catch (error) {
      setCurrentLink(null);
      if (error.errorMessage || error.message) {
        errorMessage(error.errorMessage || error.message);
      }
    }
  };

  // Generate link when form submitted
  const handleExpirySubmit = async () => {
    setIsGenerating(true);
    try {
      const result = await dispatch(
        generateLink({ id, expiry_days: expiryDays, entity })
      ).unwrap();
      setCurrentLink(result.link);

      successMessage(
        result.successMessage ||
        result.message ||
        `${entityConfig.label} link generated successfully!`
      );
    } catch (error) {
      console.error("Generate link failed:", error);
      errorMessage(
        error.errorMessage ||
        error.message ||
        "Failed to generate link"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Send mail with link
  const handleSendMail = async () => {
    if (!customerId) {
      errorMessage("Customer/Vendor ID not found");
      return;
    }

    if (!currentLink) {
      errorMessage("Please generate a link first");
      return;
    }

    if (!entityConfig.mailAction) {
      errorMessage(`Mail functionality not available for ${entityConfig.label}`);
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();

      // Adjust field names based on entity
      if (entity === "quotation") {
        formData.append("quotation_id", id);
        formData.append("customer_id", customerId);
      } else if (entity === "challan") {
        formData.append("bill_id", id);
        formData.append("customer_id", customerId);
      } else if (entity === "purchase_order") {
        formData.append("production_order_id", id);
        formData.append("vendor_id", customerId);
      }

      await dispatch(entityConfig.mailAction(formData)).unwrap();
      handleClose();
    } catch (error) {
      errorMessage(
        error.errorMessage ||
        error.message ||
        `Failed to send ${entityConfig.label.toLowerCase()}`
      );
    } finally {
      setIsSending(false);
    }
  };

  // Close modal
  const handleClose = () => {
    if (!isSending && !isGenerating) {
      setOpenGenerate(false);
      setCurrentLink(null);
      setExpiryDays(1);
      dispatch(clearLinkData());
    }
  };

  const hasMailSupport = !!entityConfig.mailAction;

  return (
    <>
      <Tooltip title={`Generate Public Link for ${entityConfig.label}`}>
        <IconButton color="info" onClick={handleGenerateableId}>
          <AiOutlineLink size={16} />
        </IconButton>
      </Tooltip>

      {/* Modal */}
      <Dialog open={openGenerate} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Generate Public Link - {entityConfig.label}
            </Typography>
            <IconButton
              onClick={handleClose}
              size="small"
              disabled={isSending || isGenerating}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ minWidth: 350 }}>
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
              <CircularProgress size={20} />
              <Typography>Checking existing link...</Typography>
            </Box>
          ) : currentLink ? (
            <Box sx={{ mt: 1 }}>
              {/* Success Message */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <CheckCircleIcon
                  sx={{
                    color: "success.main",
                    fontSize: 24,
                  }}
                />
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: "text.primary",
                    }}
                  >
                    Public link available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Your {entityConfig.label.toLowerCase()} link is ready to share
                  </Typography>
                </Box>
              </Box>

              {/* Info Box - Only show if mail support exists */}
              {hasMailSupport && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    p: 2,
                    bgcolor: "info.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "info.200",
                  }}
                >
                  <EmailIcon
                    color="info"
                    sx={{
                      mt: 0.2,
                      fontSize: 20,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Click "Send Mail" to send this {entityConfig.label.toLowerCase()} link
                    directly to the {entity === "purchase_order" ? "vendor's" : "customer's"} email address
                  </Typography>
                </Box>
              )}

              {/* Link Display */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.300",
                }}
              >
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Link:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                  }}
                >
                  {prefix + currentLink}
                </Typography>
              </Box>
            </Box>
          ) : (
            <TextField
              label="Expiry (in days)"
              type="number"
              size="small"
              fullWidth
              margin="normal"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              inputProps={{ min: 1, max: 365 }}
              disabled={isGenerating}
              helperText={`Link will be valid for ${expiryDays} day${expiryDays > 1 ? 's' : ''}`}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={handleClose}
            disabled={isSending || isGenerating}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>


          {currentLink ? (
            <>
              {hasMailSupport && (
                <Button
                  onClick={handleSendMail}
                  variant="contained"
                  color="primary"
                  disabled={isSending}
                  startIcon={
                    isSending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <EmailIcon />
                    )
                  }
                >
                  {isSending ? "Sending..." : "Send Mail"}
                </Button>
              )}

              <Button
                onClick={() => {
                  navigator.clipboard.writeText(prefix + currentLink);
                  successMessage("Link copied to clipboard!");
                }}
                variant="contained"
                color="primary"
              >
                Copy Link
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleExpirySubmit}
              disabled={isGenerating}
              startIcon={
                isGenerating ? (
                  <CircularProgress size={18} color="inherit" />
                ) : null
              }
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          )}

        </DialogActions>
      </Dialog>
    </>
  );
};

export default LinkGenerator;
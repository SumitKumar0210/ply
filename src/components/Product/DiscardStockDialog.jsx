import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const validationSchema = (availableQty) =>
  Yup.object({
    quantity: Yup.number()
      .typeError("Quantity must be a number")
      .required("Quantity is required")
      .integer("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(availableQty, `Cannot exceed available stock (${availableQty})`),
    remark: Yup.string()
      .required("Remark is required")
      .min(10, "Remark must be at least 10 characters")
      .max(500, "Remark cannot exceed 500 characters"),
  });

const DiscardStockDialog = ({ open, onClose, product, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const initialValues = {
    quantity: "",
    remark: "",
  };

  const handleSubmit = async (values, { resetForm, setErrors }) => {
    setIsSubmitting(true);

    try {
      const payload = {
        id: product.id,
        qty: parseInt(values.quantity, 10),
        remark: values.remark.trim(),
      };

      const result = await onSubmit(payload);

      // Check if the action was successful
      if (result && !result.error) {
        // Show success state briefly
        setShowSuccess(true);

        // Wait a moment to show success, then close
        setTimeout(() => {
          setShowSuccess(false);
          setIsSubmitting(false);
          resetForm();
          onClose();
        }, 800);
      } else {
        // Handle error case
        setIsSubmitting(false);
        if (result?.payload) {
          setErrors({ submit: result.payload });
        }
      }
    } catch (error) {
      console.error("Discard operation failed:", error);
      setIsSubmitting(false);
      setErrors({ submit: "An unexpected error occurred" });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <>
      <BootstrapDialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningAmberIcon color="warning" />
            <Typography variant="h6" component="span">
              Discard Stock
            </Typography>
          </Box>
        </DialogTitle>

        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema(product.available_qty || 9999)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur }) => (
            <Form>
              <DialogContent dividers>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This action will permanently remove stock from inventory.
                  Please ensure the quantity and reason are correct.
                </Alert>

                {/* Show error if submission failed */}
                {errors.submit && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.submit}
                  </Alert>
                )}

                {/* Product Information */}
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: "background.default",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Product Details
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {product.name}
                  </Typography>
                  <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      Model: <strong>{product.model}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: <strong>{product.size}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Color: <strong>{product.color}</strong>
                    </Typography>
                    {product.available_qty !== undefined && (
                      <Typography variant="body2" color="success.main">
                        Available: <strong>{product.available_qty}</strong>
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Quantity Input */}
                <TextField
                  fullWidth
                  id="quantity"
                  name="quantity"
                  label="Quantity to Discard"
                  type="number"
                  variant="outlined"
                  size="medium"
                  placeholder="Enter quantity"
                  value={values.quantity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.quantity && Boolean(errors.quantity)}
                  helperText={touched.quantity && errors.quantity}
                  disabled={isSubmitting}
                  inputProps={{ min: 1, max: product.available_qty }}
                  sx={{ mb: 2 }}
                />

                {/* Remark Input */}
                <TextField
                  fullWidth
                  id="remark"
                  name="remark"
                  label="Reason for Discard"
                  variant="outlined"
                  size="medium"
                  multiline
                  rows={4}
                  placeholder="Please provide a detailed reason for discarding this stock (e.g., damaged, expired, defective)"
                  value={values.remark}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.remark && Boolean(errors.remark)}
                  helperText={
                    touched.remark && errors.remark
                      ? errors.remark
                      : `${values.remark.length}/500 characters`
                  }
                  disabled={isSubmitting}
                />
              </DialogContent>

              <DialogActions sx={{ gap: 1, p: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="warning"
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : showSuccess ? (
                      <CheckCircleIcon />
                    ) : (
                      <WarningAmberIcon />
                    )
                  }
                  sx={{
                    minWidth: 160,
                    ...(showSuccess && {
                      bgcolor: "success.main",
                      "&:hover": { bgcolor: "success.dark" },
                    }),
                  }}
                >
                  {isSubmitting
                    ? "Processing..."
                    : showSuccess
                    ? "Success!"
                    : "Confirm Discard"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Loading Overlay */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: "column",
          gap: 2,
        }}
        open={isSubmitting}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6">
          {showSuccess ? "Stock discarded successfully!" : "Discarding stock..."}
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.7)">
          Please wait
        </Typography>
      </Backdrop>
    </>
  );
};

export default DiscardStockDialog;
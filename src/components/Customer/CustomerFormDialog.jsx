import React from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CloseIcon from "@mui/icons-material/Close";

// Styled Dialog
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
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

// GST validation regex
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .required("Name is required"),
  mobile: Yup.string()
    .matches(/^[6-9][0-9]{9}$/, "Enter valid 10-digit mobile number")
    .required("Mobile is required"),
  email: Yup.string()
    .email("Invalid email format")
    .max(100, "Email cannot exceed 100 characters")
    .required("E-mail is required"),
  address: Yup.string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address cannot exceed 200 characters")
    .required("Address is required"),
  alternate_mobile: Yup.string()
    .matches(/^[6-9][0-9]{9}$/, "Enter valid 10-digit mobile number")
    .notOneOf([Yup.ref('mobile')], "Alternate mobile must be different from primary mobile")
    .nullable(),
  city: Yup.string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City cannot exceed 50 characters")
    .required("City is required"),
  state_id: Yup.string().required("State is required"),
  zip_code: Yup.string()
    .matches(/^[1-9][0-9]{5}$/, "Enter valid 6-digit PIN code")
    .required("PIN code is required"),
  gst_no: Yup.string()
    .matches(GST_REGEX, "Enter valid GST number (e.g., 22AAAAA0000A1Z5)")
    .uppercase()
    .nullable()
    .transform((value) => value ? value.toUpperCase() : null),
  note: Yup.string().max(500, "Note cannot exceed 500 characters"),
});

// Initial form values helper
export const getInitialCustomerValues = (data = null) => ({
  name: data?.name || "",
  mobile: data?.mobile || "",
  email: data?.email || "",
  address: data?.address || "",
  alternate_mobile: data?.alternate_mobile || "",
  city: data?.city || "",
  state_id: data?.state_id || "",
  zip_code: data?.zip_code || "",
  gst_no: data?.gst_no || "",
  note: data?.note || "",
});

/**
 * Reusable Customer Form Dialog Component
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onClose - Called when dialog should close
 * @param {string} title - Dialog title (e.g., "Add Customer" or "Edit Customer")
 * @param {object} initialValues - Form initial values
 * @param {function} onSubmit - Called when form is submitted (values, formikBag)
 * @param {array} states - Array of state objects with id and name
 * @param {boolean} isEdit - Whether this is edit mode (changes submit button text)
 * @param {boolean} submitting - Optional loading state for submit button
 * @param {string} maxWidth - Dialog max width (default: "md")
 */
const CustomerFormDialog = ({ 
  open, 
  onClose, 
  title, 
  initialValues, 
  onSubmit, 
  states = [], 
  isEdit = false,
  submitting = false,
  maxWidth = "md"
}) => {
  return (
    <BootstrapDialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <BootstrapDialogTitle onClose={onClose}>{title}</BootstrapDialogTitle>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ handleChange, handleSubmit, values, touched, errors, setFieldValue, isSubmitting }) => (
          <Form onSubmit={handleSubmit}>
            <DialogContent dividers>
              <Grid container rowSpacing={2} columnSpacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="name"
                    label="Name"
                    fullWidth
                    size="small"
                    onChange={handleChange}
                    value={values.name}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="mobile"
                    label="Mobile"
                    fullWidth
                    size="small"
                    onChange={handleChange}
                    value={values.mobile}
                    error={touched.mobile && Boolean(errors.mobile)}
                    helperText={touched.mobile && errors.mobile}
                    inputProps={{ maxLength: 10 }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="alternate_mobile"
                    label="Alternate Mobile"
                    fullWidth
                    size="small"
                    value={values.alternate_mobile}
                    onChange={handleChange}
                    error={touched.alternate_mobile && Boolean(errors.alternate_mobile)}
                    helperText={touched.alternate_mobile && errors.alternate_mobile}
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="email"
                    label="E-mail"
                    fullWidth
                    size="small"
                    onChange={handleChange}
                    value={values.email}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="gst_no"
                    label="GST Number (Optional)"
                    fullWidth
                    size="small"
                    value={values.gst_no}
                    onChange={(e) => setFieldValue("gst_no", e.target.value.toUpperCase())}
                    error={touched.gst_no && Boolean(errors.gst_no)}
                    helperText={touched.gst_no && errors.gst_no}
                    placeholder="22AAAAA0000A1Z5"
                    inputProps={{ maxLength: 15, style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="state_id"
                    label="State"
                    select
                    fullWidth
                    size="small"
                    value={values.state_id}
                    onChange={handleChange}
                    error={touched.state_id && Boolean(errors.state_id)}
                    helperText={touched.state_id && errors.state_id}
                    required
                  >
                    <MenuItem value="">Select State</MenuItem>
                    {states.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="city"
                    label="City"
                    fullWidth
                    size="small"
                    value={values.city}
                    onChange={handleChange}
                    error={touched.city && Boolean(errors.city)}
                    helperText={touched.city && errors.city}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="zip_code"
                    label="PIN Code"
                    fullWidth
                    size="small"
                    value={values.zip_code}
                    onChange={handleChange}
                    error={touched.zip_code && Boolean(errors.zip_code)}
                    helperText={touched.zip_code && errors.zip_code}
                    inputProps={{ maxLength: 6 }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="address"
                    label="Address"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={values.address}
                    onChange={handleChange}
                    error={touched.address && Boolean(errors.address)}
                    helperText={touched.address && errors.address}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="note"
                    label="Note"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={values.note}
                    onChange={handleChange}
                    error={touched.note && Boolean(errors.note)}
                    helperText={touched.note && errors.note}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={onClose} 
                variant="outlined" 
                color="error"
                disabled={submitting || isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={submitting || isSubmitting}
              >
                {submitting || isSubmitting 
                  ? (isEdit ? "Saving..." : "Adding...") 
                  : (isEdit ? "Save Changes" : "Add Customer")
                }
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </BootstrapDialog>
  );
};

export default CustomerFormDialog;
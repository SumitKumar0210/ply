import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    TextField,
    MenuItem,
    Grid,
    CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { addVendor, updateVendor, fetchVendors } from "../../pages/settings/slices/vendorSlice";
import { fetchStates } from "../../pages/settings/slices/stateSlice";
import { fetchActiveCategories } from "../../pages/settings/slices/categorySlice";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialogContent-root": {
        padding: theme.spacing(3),
        minHeight: "400px",
    },
    "& .MuiDialogActions-root": {
        padding: theme.spacing(2),
        gap: theme.spacing(1),
    },
}));

// Validation Schema
const validationSchema = Yup.object({
    name: Yup.string()
        .trim()
        .min(2, "Vendor name must be at least 2 characters")
        .max(100, "Vendor name must not exceed 100 characters")
        .required("Vendor name is required"),
    mobile: Yup.string()
        .matches(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number")
        .required("Mobile number is required"),
    email: Yup.string()
        .trim()
        .email("Enter a valid email address")
        .required("Email is required"),
    category_id: Yup.string().required("Category is required"),
    gst: Yup.string()
        .matches(
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
            "Enter a valid GST number (e.g., 22AAAAA0000A1Z5)"
        )
        .required("GST number is required"),
    address: Yup.string()
        .trim()
        .min(10, "Address must be at least 10 characters")
        .max(500, "Address must not exceed 500 characters")
        .required("Address is required"),
    city: Yup.string()
        .trim()
        .min(2, "City must be at least 2 characters")
        .max(100, "City must not exceed 100 characters")
        .required("City is required"),
    state_id: Yup.string().required("State is required"),
    zip_code: Yup.string()
        .matches(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code")
        .required("PIN code is required"),
    terms: Yup.string().max(1000, "Terms must not exceed 1000 characters"),
});

const VendorFormModal = ({ open, onClose, editData = null }) => {
    const dispatch = useDispatch();
    const [isSaving, setIsSaving] = useState(false);

    // Get categories and states from Redux store
    const { data: categories = [] } = useSelector((state) => state.category);
    const { data: states = [] } = useSelector((state) => state.state);

    const isEditMode = Boolean(editData);

    // Fetch categories and states when modal opens
    useEffect(() => {
        if (open) {
            dispatch(fetchActiveCategories());
            dispatch(fetchStates());
        }
    }, [open, dispatch]);

    const initialValues = {
        name: editData?.name || "",
        mobile: editData?.mobile || "",
        email: editData?.email || "",
        category_id: String(editData?.category_id || ""),
        gst: editData?.gst || "",
        address: editData?.address || "",
        city: editData?.city || "",
        state_id: String(editData?.state_id || ""),
        zip_code: editData?.zip_code || "",
        terms: editData?.terms || "",
    };

    const handleSubmit = async (values, { resetForm, setSubmitting }) => {
        setIsSaving(true);
        try {
            // Trim all string values
            const trimmedValues = Object.keys(values).reduce((acc, key) => {
                acc[key] =
                    typeof values[key] === "string" ? values[key].trim() : values[key];
                return acc;
            }, {});

            let result;
            if (isEditMode) {
                result = await dispatch(
                    updateVendor({ id: editData.id, ...trimmedValues })
                );
            } else {
                result = await dispatch(addVendor(trimmedValues));
            }
            console.log(result);

            setIsSaving(false);
            
            if (!result.error) {
                // Refresh vendor list after successful operation
                await dispatch(fetchVendors());
                resetForm();
                onClose();
            } else {
                console.error("Form submission error:", result.error);
            }
        } catch (error) {
            setIsSaving(false);
            console.error("Form submission error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BootstrapDialog
            onClose={() => !isSaving && onClose()}
            open={open}
            fullWidth
            maxWidth="md"
            disableEscapeKeyDown={isSaving}
        >
            <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
                {isEditMode ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
            <IconButton
                aria-label="close"
                onClick={onClose}
                disabled={isSaving}
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
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                }) => (
                    <Form>
                        <DialogContent dividers>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        name="name"
                                        label="Vendor Name"
                                        variant="outlined"
                                        size="small"
                                        value={values.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.name && Boolean(errors.name)}
                                        helperText={touched.name && errors.name}
                                        disabled={isSaving}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        name="mobile"
                                        label="Mobile Number"
                                        variant="outlined"
                                        size="small"
                                        value={values.mobile}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.mobile && Boolean(errors.mobile)}
                                        helperText={touched.mobile && errors.mobile}
                                        inputProps={{ maxLength: 10 }}
                                        disabled={isSaving}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        name="email"
                                        label="Email Address"
                                        variant="outlined"
                                        size="small"
                                        type="email"
                                        value={values.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.email && Boolean(errors.email)}
                                        helperText={touched.email && errors.email}
                                        disabled={isSaving}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        name="category_id"
                                        label="Category"
                                        variant="outlined"
                                        size="small"
                                        value={values.category_id}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.category_id && Boolean(errors.category_id)}
                                        helperText={touched.category_id && errors.category_id}
                                        disabled={isSaving}
                                        required
                                    >
                                        <MenuItem value="">
                                            <em>Select Category</em>
                                        </MenuItem>
                                        {Array.isArray(categories) && categories.map((category) => (
                                            <MenuItem key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        name="gst"
                                        label="GST Number"
                                        variant="outlined"
                                        size="small"
                                        value={values.gst}
                                        onChange={(e) => {
                                            e.target.value = e.target.value.toUpperCase();
                                            handleChange(e);
                                        }}
                                        onBlur={handleBlur}
                                        error={touched.gst && Boolean(errors.gst)}
                                        helperText={touched.gst && errors.gst}
                                        inputProps={{
                                            maxLength: 15,
                                            style: { textTransform: "uppercase" },
                                        }}
                                        disabled={isSaving}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        name="city"
                                        label="City"
                                        variant="outlined"
                                        size="small"
                                        value={values.city}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.city && Boolean(errors.city)}
                                        helperText={touched.city && errors.city}
                                        disabled={isSaving}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        name="state_id"
                                        label="State"
                                        variant="outlined"
                                        size="small"
                                        value={values.state_id}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.state_id && Boolean(errors.state_id)}
                                        helperText={touched.state_id && errors.state_id}
                                        disabled={isSaving}
                                        required
                                    >
                                        <MenuItem value="">
                                            <em>Select State</em>
                                        </MenuItem>
                                        {Array.isArray(states) && states.map((state) => (
                                            <MenuItem key={state.id} value={String(state.id)}>
                                                {state.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        name="zip_code"
                                        label="PIN Code"
                                        variant="outlined"
                                        size="small"
                                        value={values.zip_code}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.zip_code && Boolean(errors.zip_code)}
                                        helperText={touched.zip_code && errors.zip_code}
                                        inputProps={{ maxLength: 6 }}
                                        disabled={isSaving}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        name="address"
                                        label="Address"
                                        variant="outlined"
                                        size="small"
                                        multiline
                                        rows={2}
                                        value={values.address}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.address && Boolean(errors.address)}
                                        helperText={touched.address && errors.address}
                                        disabled={isSaving}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        name="terms"
                                        label="Terms & Conditions"
                                        variant="outlined"
                                        size="small"
                                        multiline
                                        rows={3}
                                        value={values.terms}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.terms && Boolean(errors.terms)}
                                        helperText={touched.terms && errors.terms}
                                        disabled={isSaving}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions>
                            <Button
                                onClick={onClose}
                                color="error"
                                variant="outlined"
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                disabled={isSaving}
                                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                                {isSaving
                                    ? "Saving..."
                                    : isEditMode
                                        ? "Save Changes"
                                        : "Add Vendor"}
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </BootstrapDialog>
    );
};

export default VendorFormModal;
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const DepartmentSchema = Yup.object({
  name: Yup.string()
    .min(2, "Department must be at least 2 characters")
    .required("Department is required"),

  color: Yup.string()
    .min(3, "Color must be at least 3 characters")
    .required("Color is required"),
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

// Reusable Department Modal Component
const DepartmentFormDialog = ({ 
  open, 
  onClose, 
  onSubmit, 
  initialValues, 
  title,
  submitButtonText = "Submit" 
}) => {
  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Department must be at least 2 characters")
      .required("Department is required"),
    color: Yup.string()
      .min(3, "Color must be at least 3 characters")
      .required("Color is required"),
  });

  return (
    <BootstrapDialog onClose={onClose} open={open} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form>
            <DialogContent dividers>
              <TextField
                fullWidth
                name="name"
                label="Department"
                size="small"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                name="color"
                label="Color"
                size="small"
                value={values.color}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.color && Boolean(errors.color)}
                helperText={touched.color && errors.color}
                placeholder="Enter color name or hex code"
              />
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" color="error" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" variant="contained">
                {submitButtonText}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </BootstrapDialog>
  );
};

export default DepartmentFormDialog;

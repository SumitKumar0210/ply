import * as React from "react";
import { useState, useEffect } from "react";
import {
  Grid,
  Button,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { addProduct, updateProduct, fetchProducts } from "../../pages/settings/slices/productSlice";
import { fetchActiveProductTypes } from "../../pages/settings/slices/productTypeSlice";
import { compressImage } from "../imageCompressor/imageCompressor";
import { successMessage, errorMessage } from "../../toast";
import Profile from "../../assets/images/profile.jpg";
import { fetchActiveGroup } from "../../pages/settings/slices/groupSlice";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const addValidationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  model: Yup.string().required("Model is required"),
  size: Yup.string().required("Size is required"),
  color: Yup.string().required("Color is required"),
  hsn_code: Yup.string().nullable(),
  rrp: Yup.number()
    .typeError("RRP must be a number")
    .required("RRP is required"),
  product_type: Yup.string().required("Product Type is required"),
  group_id: Yup.string().required("Group is required"),

  // ✅ Image OPTIONAL
  image: Yup.mixed()
    .nullable()
    .test("fileType", "Only images are allowed", (value) =>
      !value || ["image/jpeg", "image/png", "image/jpg"].includes(value.type)
    ),
});

const editValidationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  model: Yup.string().required("Model is required"),
  size: Yup.string().required("Size is required"),
  color: Yup.string().required("Color is required"),
  hsn_code: Yup.string().nullable(),
  rrp: Yup.number()
    .typeError("RRP must be a number")
    .required("RRP is required"),
  product_type: Yup.string().required("Product Type is required"),
  group_id: Yup.string().required("Group is required"),


  image: Yup.mixed()
    .nullable()
    .test("fileType", "Only images are allowed", (value) =>
      !value || ["image/jpeg", "image/png", "image/jpg"].includes(value.type)
    ),
});



const ProductFormDialog = ({
  open,
  onClose,
  editData = null,
  onSuccess
}) => {
  const dispatch = useDispatch();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const { data: groups = [] } = useSelector((state) => state.group);
  const { data: productType = [] } = useSelector((state) => state.productType);

  const [compressingImage, setCompressingImage] = useState(false);
  const [submissionLoader, setSubmissionLoader] = useState(false);

  const isEditMode = !!editData;

  // Initial values
  const initialValues = isEditMode
    ? {
      name: editData.name || "",
      model: editData.model || "",
      size: editData.size || "",
      color: editData.color || "",
      hsn_code: editData.hsn_code || "",
      rrp: editData.rrp || "",
      product_type: editData.product_type || "",
      group_id: editData.group_id || "",
      narations: editData.narations || "",
      image: null,
    }
    : {
      name: "",
      model: "",
      size: "",
      color: "",
      hsn_code: "",
      rrp: "",
      product_type: "",
      group_id: "",
      narations: "",
      image: null,
    };

    useEffect( ()=>{
      dispatch(fetchActiveGroup());
      dispatch(fetchActiveProductTypes());
    },[])

  // Handle image compression
  const handleImageChange = async (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      try {
        setCompressingImage(true);

        const compressed = await compressImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
        });

        const originalSize = (file.size / 1024).toFixed(2);
        const compressedSize = (compressed.size / 1024).toFixed(2);
        const reduction = (((file.size - compressed.size) / file.size) * 100).toFixed(2);

        console.log(compressed)
        successMessage(
          `Image compressed: ${originalSize}KB → ${compressedSize}KB (${reduction}% reduction)`
        );

        setFieldValue("image", compressed);
      } catch (error) {
        console.error("Image compression failed:", error);
        errorMessage("Failed to compress image. Using original file.");
        setFieldValue("image", file);
      } finally {
        setCompressingImage(false);
      }
    } else {
      setFieldValue("image", file);
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { resetForm }) => {
    setSubmissionLoader(true);
    try {
      let res;
      if (isEditMode) {
        res = await dispatch(updateProduct({ updated: { id: editData.id, ...values } }));
      } else {
        res = await dispatch(addProduct(values));
      }

      if (res.error) {
        setSubmissionLoader(false);
        return;
      }

      // Reload the products table
      await dispatch(fetchProducts());

      resetForm();
      setSubmissionLoader(false);
      onClose();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Product operation failed:", error);
      setSubmissionLoader(false);
    }
  };

  return (
    <BootstrapDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ m: 0, p: 1.5 }}>
        {isEditMode ? "Edit Product" : "Add Product"}
      </DialogTitle>
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

      <Formik
        initialValues={initialValues}
        validationSchema={isEditMode ? editValidationSchema : addValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ my: 1.5 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    id="name"
                    name="name"
                    label="Name"
                    variant="outlined"
                    size="small"
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    id="model"
                    name="model"
                    label="Model"
                    variant="outlined"
                    size="small"
                    value={values.model}
                    onChange={handleChange}
                    error={touched.model && Boolean(errors.model)}
                    helperText={touched.model && errors.model}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    id="size"
                    name="size"
                    label="Size"
                    variant="outlined"
                    size="small"
                    value={values.size}
                    onChange={handleChange}
                    error={touched.size && Boolean(errors.size)}
                    helperText={touched.size && errors.size}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    id="color"
                    name="color"
                    label="Color"
                    variant="outlined"
                    size="small"
                    value={values.color}
                    onChange={handleChange}
                    error={touched.color && Boolean(errors.color)}
                    helperText={touched.color && errors.color}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    id="hsn_code"
                    name="hsn_code"
                    label="HSN Code"
                    variant="outlined"
                    size="small"
                    value={values.hsn_code}
                    onChange={handleChange}
                    error={touched.hsn_code && Boolean(errors.hsn_code)}
                    helperText={touched.hsn_code && errors.hsn_code}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    id="rrp"
                    name="rrp"
                    label="RRP"
                    type="number"
                    variant="outlined"
                    size="small"
                    value={values.rrp}
                    onChange={handleChange}
                    error={touched.rrp && Boolean(errors.rrp)}
                    helperText={touched.rrp && errors.rrp}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    id="product_type"
                    name="product_type"
                    label="Product Type"
                    variant="outlined"
                    size="small"
                    value={values.product_type}
                    onChange={handleChange}
                    error={touched.product_type && Boolean(errors.product_type)}
                    helperText={touched.product_type && errors.product_type}
                  >
                    {productType.map((item, index) => (
                      <MenuItem key={index} value={item.name}>
                        {item.name}
                      </MenuItem>
                    ))}

                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    id="group_id"
                    name="group_id"
                    label="Group"
                    variant="outlined"
                    size="small"
                    value={values.group_id}
                    onChange={handleChange}
                    error={touched.group_id && Boolean(errors.group_id)}
                    helperText={touched.group_id && errors.group_id}
                  >
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={String(group.id)}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ mb: 1 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid size={{ xs: 8 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        component="label"
                        startIcon={<UploadFileIcon />}
                        fullWidth
                        disabled={compressingImage}
                      >
                        {compressingImage ? "Compressing..." : "Upload Image"}
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleImageChange(event, setFieldValue)}
                        />
                      </Button>
                      {touched.image && errors.image && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {errors.image}
                        </div>
                      )}
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      {(values.image || (isEditMode && editData.image)) && (
                        <img
                          src={
                            values.image
                              ? URL.createObjectURL(values.image)
                              : mediaUrl + editData.image
                          }
                          alt="Preview"
                          style={{
                            width: "45px",
                            height: "45px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                          onError={(e) => {
                            e.target.src = Profile;
                          }}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                  <TextField
                    fullWidth
                    id="narations"
                    name="narations"
                    label="Narations"
                    variant="outlined"
                    size="small"
                    value={values.narations}
                    onChange={handleChange}
                    error={touched.narations && Boolean(errors.narations)}
                    helperText={touched.narations && errors.narations}
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ gap: 1, mb: 1 }}>
              <Button variant="outlined" color="error" onClick={onClose}>
                Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submissionLoader}
                startIcon={
                  submissionLoader ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
              >
                {submissionLoader
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Submit"}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </BootstrapDialog>
  );
};

export default ProductFormDialog;
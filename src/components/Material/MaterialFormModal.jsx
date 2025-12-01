import React, { useState, useEffect } from "react";
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import {
  addMaterial,
  updateMaterial,
  fetchMaterials,
} from "../../pages/settings/slices/materialSlice";
import { fetchActiveCategories } from "../../pages/settings/slices/categorySlice";
import { fetchActiveGroup } from "../../pages/settings/slices/groupSlice";
import { fetchActiveUnitOfMeasurements } from "../../pages/settings/slices/unitOfMeasurementsSlice";
import { compressImage } from "../imageCompressor/imageCompressor";
import { successMessage, errorMessage } from "../../toast";
import Profile from "../../assets/images/profile.jpg";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  unit_of_measurement_id: Yup.string().required("UOM is required"),
  size: Yup.string().required("Size is required"),
  price: Yup.number()
    .typeError("Price must be a number")
    .positive("Price must be positive")
    .required("Price is required"),
  category_id: Yup.string().required("Category is required"),

  group_id: Yup.string().nullable(),   // ✅ NOT REQUIRED NOW

  opening_stock: Yup.number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Opening stock is required"),
  urgently_required: Yup.string().required("Reorder needed is required"),
  minimum_qty: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" ? undefined : value
    )
    .when("urgently_required", {
      is: (val) => val === "1",
      then: (schema) =>
        schema
          .required("Minimum Qty is required")
          .min(2, "Minimum Qty must be greater than 1"),
      otherwise: (schema) => schema.notRequired(),
    }),
  tag: Yup.string().required("Tag is required"),
  remark: Yup.string().required("Remarks are required"),
  image: Yup.mixed().nullable(),
});


const MaterialFormModal = ({ open, onClose, editData = null }) => {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();

  const [compressingImage, setCompressingImage] = useState(false);

  // Get data from Redux store
  const { data: groups = [] } = useSelector((state) => state.group);
  const { data: categories = [] } = useSelector((state) => state.category);
  const { data: uoms = [] } = useSelector((state) => state.unitOfMeasurement);

  const isEditMode = Boolean(editData);

  // Fetch required data when modal opens
  useEffect(() => {
    if (open) {
      dispatch(fetchActiveCategories());
      dispatch(fetchActiveGroup());
      dispatch(fetchActiveUnitOfMeasurements());
    }
  }, [open, dispatch]);

  const initialValues = {
    name: editData?.name || "",
    unit_of_measurement_id: String(editData?.unit_of_measurement_id || ""),
    size: editData?.size || "",
    price: editData?.price || "",
    category_id: String(editData?.category_id || ""),
    group_id: String(editData?.group_id || ""),
    opening_stock: editData?.opening_stock || "",
    urgently_required: String(editData?.urgently_required || "0"),
    minimum_qty: (editData?.minimum_qty || 0),
    tag: editData?.tag || "",
    remark: editData?.remark || "",
    image: null,
  };

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
        const reduction = (
          ((file.size - compressed.size) / file.size) *
          100
        ).toFixed(2);

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

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      let result;
      if (isEditMode) {
        result = await dispatch(
          updateMaterial({ updated: { id: editData.id, ...values } })
        );
      } else {
        result = await dispatch(addMaterial(values));
      }

      if (!result.error) {
        // Refresh material list after successful operation
        await dispatch(fetchMaterials());
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BootstrapDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      disableEscapeKeyDown={false}
    >
      <DialogTitle sx={{ m: 0, p: 1.5 }}>
        {isEditMode ? "Edit Material" : "Add Material"}
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
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="name"
                    label="Name"
                    size="small"
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    disabled={isSubmitting}

                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    name="unit_of_measurement_id"
                    label="UOM"
                    size="small"
                    value={values.unit_of_measurement_id}
                    onChange={handleChange}
                    error={
                      touched.unit_of_measurement_id &&
                      Boolean(errors.unit_of_measurement_id)
                    }
                    helperText={
                      touched.unit_of_measurement_id &&
                      errors.unit_of_measurement_id
                    }
                    disabled={isSubmitting}

                  >
                    <MenuItem value="">
                      <em>Select UOM</em>
                    </MenuItem>
                    {uoms.map((uom) => (
                      <MenuItem key={uom.id} value={String(uom.id)}>
                        {uom.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="size"
                    label="Size"
                    size="small"
                    value={values.size}
                    onChange={handleChange}
                    error={touched.size && Boolean(errors.size)}
                    helperText={touched.size && errors.size}
                    disabled={isSubmitting}

                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="price"
                    label="Price"
                    type="number"
                    size="small"
                    value={values.price}
                    onChange={handleChange}
                    error={touched.price && Boolean(errors.price)}
                    helperText={touched.price && errors.price}
                    disabled={isSubmitting}

                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    name="category_id"
                    label="Category"
                    size="small"
                    value={values.category_id}
                    onChange={handleChange}
                    error={touched.category_id && Boolean(errors.category_id)}
                    helperText={touched.category_id && errors.category_id}
                    disabled={isSubmitting}

                  >
                    <MenuItem value="">
                      <em>Select Category</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    name="group_id"
                    label="Group"
                    size="small"
                    value={values.group_id}
                    onChange={handleChange}
                    error={touched.group_id && Boolean(errors.group_id)}
                    helperText={touched.group_id && errors.group_id}
                    disabled={isSubmitting}

                  >
                    <MenuItem value="">
                      <em>Select Group</em>
                    </MenuItem>
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={String(group.id)}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="opening_stock"
                    label="Opening Stock"
                    type="number"
                    size="small"
                    value={values.opening_stock}
                    onChange={handleChange}
                    error={touched.opening_stock && Boolean(errors.opening_stock)}
                    helperText={touched.opening_stock && errors.opening_stock}
                    disabled={isSubmitting}

                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    name="urgently_required"
                    label="Reorder Needed"
                    size="small"
                    value={values.urgently_required}
                    onChange={handleChange}
                    error={
                      touched.urgently_required &&
                      Boolean(errors.urgently_required)
                    }
                    helperText={
                      touched.urgently_required && errors.urgently_required
                    }
                    disabled={isSubmitting}

                  >
                    <MenuItem value="0">No</MenuItem>
                    <MenuItem value="1">Yes</MenuItem>
                  </TextField>
                </Grid>
                {values.urgently_required === '1' && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      type="number"
                      fullWidth
                      name="minimum_qty"
                      label="Minimum Quantity"
                      size="small"
                      value={values.minimum_qty}
                      onChange={handleChange}
                      inputProps={{ min: 0 }}
                      error={touched.minimum_qty && Boolean(errors.minimum_qty)}
                      helperText={touched.minimum_qty && errors.minimum_qty}
                      disabled={isSubmitting}
                    />
                  </Grid>
                )}



                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    name="tag"
                    label="Tag"
                    size="small"
                    value={values.tag}
                    onChange={handleChange}
                    error={touched.tag && Boolean(errors.tag)}
                    helperText={touched.tag && errors.tag}
                    disabled={isSubmitting}

                  >
                    <MenuItem value="">
                      <em>Select Tag</em>
                    </MenuItem>
                    <MenuItem value="material">Material</MenuItem>
                    <MenuItem value="handtool">Hand Tool</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid size={{ xs: 8 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        component="label"
                        startIcon={<UploadFileIcon />}
                        fullWidth
                        disabled={compressingImage || isSubmitting}
                      >
                        {compressingImage ? "Compressing..." : "Upload Image"}
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleImageChange(event, setFieldValue)
                          }
                        />
                      </Button>
                      {touched.image && errors.image && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {errors.image}
                        </div>
                      )}
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      {(values.image || editData?.image) && (
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

                <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
                  <TextField
                    fullWidth
                    name="remark"
                    label="Remarks"
                    size="small"
                    multiline
                    minRows={3}
                    value={values.remark}
                    onChange={handleChange}
                    error={touched.remark && Boolean(errors.remark)}
                    helperText={touched.remark && errors.remark}
                    disabled={isSubmitting}

                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ gap: 1, mb: 1 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || compressingImage}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
              >
                {isSubmitting
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

export default MaterialFormModal;
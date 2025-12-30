import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardMedia,
  Alert,
  InputAdornment,
  Divider,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import CropLandscapeIcon from "@mui/icons-material/CropLandscape";
import { fetchSettings, updateSetting } from "../slices/generalSettingSlice";
import { useAuth } from "../../../context/AuthContext";

const GeneralSetting = () => {
  const dispatch = useDispatch();
  const { data: data, loading, error } = useSelector((state) => state.generalSetting);
  const [initialData, setInitialData] = useState({
    app_name: "",
    email: "",
    contact: "",
    gst_no: "",
    address: "",
    logo: "",
    horizontal_logo: "",
    favicon: "",
  });

  const { refreshAppDetails } = useAuth();

  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (data && data.length > 0) {
      setInitialData({
        app_name: data[0].app_name || "",
        email: data[0].email || "",
        contact: data[0].contact || "",
        gst_no: data[0].gst_no || "",
        address: data[0].address || "",
        logo: data[0].logo || "",
        horizontal_logo: data[0].horizontal_logo || "",
        favicon: data[0].favicon || "",
      });
    }
  }, [data]);

  // Enhanced validation schema
  const validationSchema = Yup.object({
    app_name: Yup.string()
      .required("App name is required")
      .min(2, "App name must be at least 2 characters")
      .max(100, "App name must not exceed 100 characters")
      .matches(/^[a-zA-Z0-9\s\-_&]+$/, "App name contains invalid characters"),

    email: Yup.string()
      .required("Email is required")
      .email("Invalid email format")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address"
      ),

    contact: Yup.string()
      .required("Contact is required")
      .matches(
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
        "Please enter a valid phone number"
      )
      .min(10, "Contact number must be at least 10 digits")
      .max(15, "Contact number must not exceed 15 digits"),

    gst_no: Yup.string()
      .required("GST number is required")
      .matches(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)"
      )
      .length(15, "GST number must be exactly 15 characters"),

    address: Yup.string()
      .required("Address is required")
      .min(10, "Address must be at least 10 characters")
      .max(500, "Address must not exceed 500 characters"),
  });

  // File validation helper
  const validateFile = (file, type) => {
    const errors = [];

    if (!file) return errors;

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push("File size must be less than 5MB");
    }

    // Check file type
    const validTypes = {
      logo: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      favicon: ["image/x-icon", "image/png", "image/ico", "image/vnd.microsoft.icon"],
    };

    const allowedTypes = validTypes[type] || validTypes.logo;
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type. Allowed types: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`);
    }

    return errors;
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Clear previous validation errors
      setValidationErrors({});

      // Validate files
      const fileErrors = {};

      if (values.logo && typeof values.logo === "object") {
        const logoErrors = validateFile(values.logo, "logo");
        if (logoErrors.length > 0) {
          fileErrors.logo = logoErrors.join(", ");
        }
      }

      if (values.horizontal_logo && typeof values.horizontal_logo === "object") {
        const logoHorizontalErrors = validateFile(values.horizontal_logo, "logo");
        if (logoHorizontalErrors.length > 0) {
          fileErrors.horizontal_logo = logoHorizontalErrors.join(", ");
        }
      }

      if (values.favicon && typeof values.favicon === "object") {
        const faviconErrors = validateFile(values.favicon, "favicon");
        if (faviconErrors.length > 0) {
          fileErrors.favicon = faviconErrors.join(", ");
        }
      }

      if (Object.keys(fileErrors).length > 0) {
        setValidationErrors(fileErrors);
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append("id", data[0].id);
      const res = await dispatch(updateSetting(formData));

      if (!res.error) {
        refreshAppDetails();
        setSuccessMessage("Settings updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        setInitialData(values);
      } else {
        // setValidationErrors({ submit: "Failed to update settings. Please try again." });
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      // setValidationErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        // borderRadius: 2,
        // background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          gutterBottom
          className="page-title"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <BusinessIcon />
          General Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your application's basic information and branding
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {validationErrors.submit && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {validationErrors.submit}
        </Alert>
      )}

      <Formik
        enableReinitialize
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
          <Form>
            <Grid container spacing={2}>
              {/* Logo & Favicon Section */}
              <Grid size={12}>
                <Card
                  sx={{
                    // p: 3,
                    // mb: 2,
                    // background: 'rgba(214, 212, 212, 0.85)',
                    // backdropFilter: 'blur(10px)'
                  }}
                >
                  {/* <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Brand Assets
                  </Typography> */}

                  <Grid container spacing={4}>
                    {/* Square Logo Upload */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
                        Square Logo
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadFileIcon />}
                        fullWidth
                        sx={{
                          py: 1.5,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText'
                          }
                        }}
                      >
                        Upload Logo
                        <input
                          hidden
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          type="file"
                          name="logo"
                          onChange={(event) => {
                            const file = event.currentTarget.files[0];
                            setFieldValue("logo", file);
                            setValidationErrors(prev => ({ ...prev, logo: undefined }));
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', lineHeight: 1.2, fontSize: '0.875rem' }}>
                        Recommended: 200x200px, PNG or JPG (Max 5MB)
                      </Typography>
                      {validationErrors.logo && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          {validationErrors.logo}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Card
                          sx={{
                            width: 120,
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: validationErrors.logo ? 'error.main' : 'grey.300',
                            backgroundColor: 'grey.50'
                          }}
                        >
                          {values.logo ? (
                            typeof values.logo === "object" ? (
                              <CardMedia
                                component="img"
                                image={URL.createObjectURL(values.logo)}
                                alt="Logo preview"
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  p: 1
                                }}
                              />
                            ) : (
                              <CardMedia
                                component="img"
                                image={mediaUrl + values.logo}
                                alt="Company logo"
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  p: 1
                                }}
                              />
                            )
                          ) : (
                            <Typography variant="caption" color="text.secondary" align="center">
                              No logo
                            </Typography>
                          )}
                        </Card>
                      </Box>
                    </Grid>

                    {/* Horizontal Logo Upload */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
                        Horizontal Logo
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CropLandscapeIcon />}
                        fullWidth
                        sx={{
                          py: 1.5,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          borderColor: 'info.main',
                          color: 'info.main',
                          '&:hover': {
                            borderColor: 'info.dark',
                            backgroundColor: 'info.light',
                            color: 'info.contrastText'
                          }
                        }}
                      >
                        Upload Horizontal Logo
                        <input
                          hidden
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          type="file"
                          name="horizontal_logo"
                          onChange={(event) => {
                            const file = event.currentTarget.files[0];
                            setFieldValue("horizontal_logo", file);
                            setValidationErrors(prev => ({ ...prev, horizontal_logo: undefined }));
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', lineHeight: 1.2, fontSize: '0.875rem' }}>
                        Recommended: 400x100px, PNG or JPG (Max 5MB)
                      </Typography>
                      {validationErrors.horizontal_logo && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          {validationErrors.horizontal_logo}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Card
                          sx={{
                            width: 200,
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: validationErrors.horizontal_logo ? 'error.main' : 'grey.300',
                            backgroundColor: 'grey.50'
                          }}
                        >
                          {values.horizontal_logo ? (
                            typeof values.horizontal_logo === "object" ? (
                              <CardMedia
                                component="img"
                                image={URL.createObjectURL(values.horizontal_logo)}
                                alt="Horizontal logo preview"
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  p: 1
                                }}
                              />
                            ) : (
                              <CardMedia
                                component="img"
                                image={mediaUrl + values.horizontal_logo}
                                alt="Horizontal logo"
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  p: 1
                                }}
                              />
                            )
                          ) : (
                            <Typography variant="caption" color="text.secondary" align="center">
                              No horizontal logo
                            </Typography>
                          )}
                        </Card>
                      </Box>
                    </Grid>

                    {/* Favicon Upload */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
                        Favicon
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<InsertEmoticonIcon />}
                        fullWidth
                        sx={{
                          py: 1.5,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          borderColor: 'secondary.main',
                          color: 'secondary.main',
                          '&:hover': {
                            borderColor: 'secondary.dark',
                            backgroundColor: 'secondary.light',
                            color: 'secondary.contrastText'
                          }
                        }}
                      >
                        Upload Favicon
                        <input
                          hidden
                          accept="image/x-icon,image/png,image/ico"
                          type="file"
                          name="favicon"
                          onChange={(event) => {
                            const file = event.currentTarget.files[0];
                            setFieldValue("favicon", file);
                            setValidationErrors(prev => ({ ...prev, favicon: undefined }));
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', lineHeight: 1.2, fontSize: '0.875rem' }}> 
                        Recommended: 32x32px, ICO or PNG (Max 5MB)
                      </Typography>
                      {validationErrors.favicon && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          {validationErrors.favicon}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Card
                          sx={{
                            width: 120,
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: validationErrors.favicon ? 'error.main' : 'grey.300',
                            backgroundColor: 'grey.50'
                          }}
                        >
                          {values.favicon ? (
                            typeof values.favicon === "object" ? (
                              <CardMedia
                                component="img"
                                image={URL.createObjectURL(values.favicon)}
                                alt="Favicon preview"
                                sx={{
                                  width: 64,
                                  height: 64,
                                  objectFit: 'contain',
                                }}
                              />
                            ) : (
                              <CardMedia
                                component="img"
                                image={mediaUrl + values.favicon}
                                alt="Favicon"
                                sx={{
                                  width: 64,
                                  height: 64,
                                  objectFit: 'contain',
                                }}
                              />
                            )
                          ) : (
                            <Typography variant="caption" color="text.secondary" align="center">
                              No favicon
                            </Typography>
                          )}
                        </Card>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
              <Divider sx={{ width: '100%', mt: 1 }} />
              {/* Company Information */}
              <Grid size={12}>
                <Card>
                  <Typography variant="h6" className="page-title" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Company Information
                  </Typography>

                  <Grid container spacing={2}>
                    {/* App Name */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Application Name"
                        name="app_name"
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                        value={values.app_name}
                        onChange={handleChange}
                        error={touched.app_name && Boolean(errors.app_name)}
                        helperText={touched.app_name && errors.app_name}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* Email */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                        value={values.email}
                        onChange={handleChange}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* Contact */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Contact Number"
                        name="contact"
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                        type="text"
                        value={values.contact}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // allow only digits
                          if (value.length <= 10) {
                            handleChange({
                              target: { name: "contact", value }
                            });
                          }
                        }}
                        error={touched.contact && Boolean(errors.contact)}
                        helperText={touched.contact && errors.contact}
                        inputProps={{ maxLength: 10 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* GST Number */}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        label="GST Number"
                        name="gst_no"
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                        value={values.gst_no}
                        onChange={(e) => {
                          const upperValue = e.target.value.toUpperCase();
                          setFieldValue("gst_no", upperValue);
                        }}
                        error={touched.gst_no && Boolean(errors.gst_no)}
                        helperText={touched.gst_no && errors.gst_no}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ReceiptIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{
                          maxLength: 15,
                          style: { textTransform: 'uppercase' }
                        }}
                      />
                    </Grid>

                    {/* Address */}
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        label="Company Address"
                        name="address"
                        multiline
                        minRows={3}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                        value={values.address}
                        onChange={handleChange}
                        error={touched.address && Boolean(errors.address)}
                        helperText={touched.address && errors.address}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                              <LocationOnIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{
                          maxLength: 500
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* Submit Button */}
              <Grid size={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                     mt: 0
                  }}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    size="large"
                    disabled={isSubmitting}
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                      px: 4,
                      minWidth: 120
                    }}
                  >
                    {isSubmitting ? "Updating..." : "Update Settings"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default GeneralSetting;
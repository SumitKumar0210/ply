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
import { fetchSettings, updateSetting } from "../slices/generalSettingSlice";

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
    favicon: "",
  });

  const [successMessage, setSuccessMessage] = useState("");

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
        favicon: data[0].favicon || "",
      });
    }
  }, [data]);

  const validationSchema = Yup.object({
    app_name: Yup.string().required("App name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    contact: Yup.string().required("Contact is required"),
    gst_no: Yup.string().required("GST number is required"),
    address: Yup.string().required("Address is required"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append("id", data[0].id);
      await dispatch(updateSetting(formData));

      setSuccessMessage("Settings updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Update initial data to reflect changes
      setInitialData(values);
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
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

      <Formik
        enableReinitialize
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
          <Form>
            <Grid container spacing={3}>
              {/* Logo & Favicon Section */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    p: 3,
                    mb: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Brand Assets
                  </Typography>

                  <Grid container spacing={4}>
                    {/* Logo Upload */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Application Logo
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
                          }
                        }}
                      >
                        Upload Logo
                        <input
                          hidden
                          accept="image/*"
                          type="file"
                          name="logo"
                          onChange={(event) => {
                            const file = event.currentTarget.files[0];
                            setFieldValue("logo", file);
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Recommended: 200x200px, PNG or JPG
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Card
                          sx={{
                            width: 120,
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: 'grey.300',
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

                    {/* Favicon Upload */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
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
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Recommended: 32x32px or 16x16px, ICO or PNG
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Card
                          sx={{
                            width: 120,
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: 'grey.300',
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

              {/* Company Information */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Company Information
                  </Typography>

                  <Grid container spacing={3}>
                    {/* App Name */}
                    <Grid size={3} md={6}>
                      <TextField
                        fullWidth
                        label="Application Name"
                        name="app_name"
                        variant="outlined"
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
                    <Grid size={3} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        variant="outlined"
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
                    <Grid size={3} md={6}>
                      <TextField
                        fullWidth
                        label="Contact Number"
                        name="contact"
                        variant="outlined"
                        value={values.contact}
                        onChange={handleChange}
                        error={touched.contact && Boolean(errors.contact)}
                        helperText={touched.contact && errors.contact}
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
                    <Grid size={3} md={6}>
                      <TextField
                        fullWidth
                        label="GST Number"
                        name="gst_no"
                        variant="outlined"
                        value={values.gst_no}
                        onChange={handleChange}
                        error={touched.gst_no && Boolean(errors.gst_no)}
                        helperText={touched.gst_no && errors.gst_no}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ReceiptIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* Address */}
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Company Address"
                        name="address"
                        multiline
                        minRows={3}
                        variant="outlined"
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
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    mt: 2
                  }}
                >
                  <Button
                    type="button"
                    variant="outlined"
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
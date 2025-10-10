import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { fetchSettings, updateSetting } from "../slices/generalSettingSlice";

const GeneralSetting = () => {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.setting);
  const [initialData, setInitialData] = useState({
    app_name: "",
    email: "",
    contact: "",
    gst_no: "",
    address: "",
    logo: "",
  });

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

  const handleSubmit = async (values, { setSubmitting }) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });

    formData.append("id", data[0].id); // only one row, update it
    await dispatch(updateSetting(formData));
    setSubmitting(false);
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        General Settings
      </Typography>

      <Formik
        enableReinitialize
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
          <Form>
            <Grid container spacing={2}>
              {/* App Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="App Name"
                  name="app_name"
                  variant="standard"
                  value={values.app_name}
                  onChange={handleChange}
                  error={touched.app_name && Boolean(errors.app_name)}
                  helperText={touched.app_name && errors.app_name}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  variant="standard"
                  value={values.email}
                  onChange={handleChange}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
              </Grid>

              {/* Contact */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact"
                  name="contact"
                  variant="standard"
                  value={values.contact}
                  onChange={handleChange}
                  error={touched.contact && Boolean(errors.contact)}
                  helperText={touched.contact && errors.contact}
                />
              </Grid>

              {/* GST Number */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GST Number"
                  name="gst_no"
                  variant="standard"
                  value={values.gst_no}
                  onChange={handleChange}
                  error={touched.gst_no && Boolean(errors.gst_no)}
                  helperText={touched.gst_no && errors.gst_no}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  minRows={3}
                  variant="standard"
                  value={values.address}
                  onChange={handleChange}
                  error={touched.address && Boolean(errors.address)}
                  helperText={touched.address && errors.address}
                />
              </Grid>

              {/* Logo Upload */}
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  fullWidth
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
              </Grid>

              {/* Logo Preview */}
              <Grid item xs={12} md={6}>
                {values.logo && typeof values.logo === "object" ? (
                  <img
                    src={URL.createObjectURL(values.logo)}
                    alt="Preview"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                  />
                ) : (
                  values.logo && (
                    <img
                      src={mediaUrl + values.logo}
                      alt="Logo"
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />
                  )
                )}
              </Grid>

              {/* Submit */}
              <Grid item xs={12}>
                <Box textAlign="right" mt={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    Update Settings
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
                                                                                
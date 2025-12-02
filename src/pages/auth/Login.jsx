import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/aarish-logo.png";
import { useAuth } from "../../context/AuthContext";
import { authLogin } from "./authSlice";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

const mediaUrl = import.meta.env.VITE_MEDIA_URL;

const Login = () => {
  const paperStyle = { padding: "20px 30px", width: 350 };
  const navigate = useNavigate();
  const { setUser, appDetails } = useAuth();
  const dispatch = useDispatch();

  const [logoLoaded, setLogoLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .trim()
      .email("Please enter a valid email address")
      .matches(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address"
      )
      .min(4, "Email must be at least 4 characters long")
      .max(100, "Email cannot exceed 100 characters")
      .required("Email is required"),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .required("Password is required"),
  });

  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventBack);

    return () => window.removeEventListener("popstate", preventBack);
  }, []);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const res = await dispatch(authLogin(values));
        if (res.error) {
          console.log(res.payload);
          return;
        }
        setUser({
          name: res.payload.user_name ?? "",
          profileImage: res.payload.image ? mediaUrl + res.payload.image : "",
          type: res.payload.type ?? "",
        });
        navigate("/dashboard");
      } catch (error) {
        console.error("Login failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const storedLogo = localStorage.getItem("logo");
  const logoSrc = appDetails.logo ?? storedLogo ?? Logo;

  return (
    <Paper elevation={10} style={paperStyle}>
      <Grid align="center">
        {!logoLoaded && (
          <Skeleton
            variant="rectangular"
            width={80}
            height={80}
            sx={{ marginBottom: "10px", borderRadius: 1, margin: "0 auto" }}
          />
        )}
        <img
          src={logoSrc}
          alt="logo"
          style={{
            width: "80px",
            display: logoLoaded ? "block" : "none",
          }}
          onLoad={() => setLogoLoaded(true)}
          onError={() => setLogoLoaded(true)}
        />
        <Typography variant="h5" component="h2" sx={{ mb: 1, mt: logoLoaded ? 0 : 0 }}>
          Sign In
        </Typography>
      </Grid>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          label="Email"
          name="email"
          variant="standard"
          fullWidth
          required
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          disabled={isSubmitting}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          variant="standard"
          fullWidth
          required
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          disabled={isSubmitting}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          color="primary"
          variant="contained"
          fullWidth
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <Typography align="center" sx={{ marginTop: 1 }}>
        <MuiLink component={RouterLink} to="/forgot-password">
          Forgot password?
        </MuiLink>
      </Typography>
    </Paper>
  );
};

export default Login;
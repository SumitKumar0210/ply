import React from "react";
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/aarish-logo.png";
import { useAuth } from "../../context/AuthContext";
import { authLogin } from "./authSlice";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useEffect } from "react";

const mediaUrl = import.meta.env.VITE_MEDIA_URL;

const Login = () => {
  const paperStyle = { padding: "20px 30px", height: "380px", width: 350 };
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .min(4, "Email must be at least 4 characters")
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
    },
  });


  const storedLogo = localStorage.getItem("logo");

  return (
    <Paper elevation={10} style={paperStyle}>
      <Grid align="center">
        <img src={storedLogo??Logo} alt="logo" style={{ width: "80px" }} />
        <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
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
          sx={{ mb: 2 }}
        />

        <Button type="submit" color="primary" variant="contained" fullWidth>
          Sign in
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

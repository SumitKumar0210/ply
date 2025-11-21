import React, { useState } from "react";
import {
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Logo from "../../assets/images/aarish-logo.png";
import { forgotPassword } from "./authSlice";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";


const ForgotPassword = () => {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL; 
  const { appDetails } = useAuth();
  
  const paperStyle = { padding: "20px 30px", width: 350 };
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || email.trim().length < 4) {
      setError("Email must be at least 4 characters long.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const res = await dispatch(forgotPassword({ email }));
      if (res.error) {
        setError(res.error.message || "Something went wrong.");
      } else {
        setSuccess("Reset link sent to your email.");
      }
    } catch (err) {
      setError("Failed to send reset link.");
    }
  };

  return (
    <Paper elevation={10} style={paperStyle}>
      <Grid align="center">
        <img
          src={appDetails?.logo ??Logo}
          alt="logo"
          style={{ width: "100px", marginBottom: "10px" }}
        />
        <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
          Forgot Password
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter your email and we’ll send you a reset link.
        </Typography>
      </Grid>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          placeholder="Enter your email"
          type="email"
          variant="standard"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="primary" variant="body2" sx={{ mb: 1 }}>
            {success}
          </Typography>
        )}

        <Button type="submit" color="primary" variant="contained" fullWidth>
          Send Reset Link
        </Button>
      </form>

      <Typography align="center" sx={{ mt: 2 }}>
        <MuiLink component={RouterLink} to="/login">
          Back to Login
        </MuiLink>
      </Typography>
    </Paper>
  );
};

export default ForgotPassword;

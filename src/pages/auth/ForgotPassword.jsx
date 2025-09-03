import React from "react";
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

const ForgotPassword = () => {
  const paperStyle = { padding: "20px 30px", height: "350px", width: 350 };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Password reset link has been sent to your email.");
  };

  return (
    <Paper elevation={10} style={paperStyle}>
      <Grid align="center">
        <img
          src={Logo}
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
          sx={{ mb: 2 }}
        />

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

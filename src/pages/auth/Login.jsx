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

const Login = () => {
  const paperStyle = { padding: "20px 30px", height: "380px", width: 350 };
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
    navigate("/dashboard");
  };

  return (
    <Paper elevation={10} style={paperStyle}>
      <Grid align="center">
        <img
          src={Logo}
          alt="logo"
          style={{ width: "80px" }}
        />
        <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
          Sign In
        </Typography>
      </Grid>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Username"
          placeholder="Enter username"
          variant="standard"
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          placeholder="Enter password"
          variant="standard"
          fullWidth
          required
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

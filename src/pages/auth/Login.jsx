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
import { useState } from "react";
import { useDispatch } from "react-redux";


const Login = () => {
  const paperStyle = { padding: "20px 30px", height: "380px", width: 350 };
  const navigate = useNavigate();
  const { login } = useAuth();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // login();
    
    const credentials= {'email':email, 'password':password}
    const res = await(dispatch(authLogin(credentials)))
    if(res.error)
    {
      console.log(res.payload)
      return;
    }

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
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          placeholder="Enter password"
          variant="standard"
          onChange={(e) => setPassword(e.target.value)}
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

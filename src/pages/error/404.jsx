import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const Error404 = () => {
  const navigate = useNavigate();

  return (
    <Container
      maxWidth="md"
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <ErrorOutlineIcon sx={{ fontSize: 120, color: "error.main" }} />
      </Box>

      <Typography
        variant="h2"
        component="h1"
        sx={{ fontWeight: "bold", mb: 1, color: "text.primary" }}
      >
        404
      </Typography>

      <Typography variant="h5" sx={{ color: "text.secondary", mb: 3 }}>
        Oops! The page you’re looking for doesn’t exist.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/dashboard")}
        sx={{ px: 4, py: 1, borderRadius: 2, textTransform: "none" }}
      >
        Go Back Home
      </Button>

      <Typography variant="body2" sx={{ mt: 5, color: "text.disabled" }}>
        © {new Date().getFullYear()} <a href="https://techiesquad.com/" target="_blank">Techie Squad ® </a>. All rights reserved.
      </Typography>
    </Container>
  );
};

export default Error404;

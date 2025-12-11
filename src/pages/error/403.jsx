import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BlockIcon from "@mui/icons-material/Block";

const Error403 = () => {
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
        <BlockIcon sx={{ fontSize: 120, color: "warning.main" }} />
      </Box>

      <Typography
        variant="h2"
        component="h1"
        sx={{ fontWeight: "bold", mb: 1, color: "text.primary" }}
      >
        403
      </Typography>

      <Typography variant="h5" sx={{ color: "text.secondary", mb: 1 }}>
        Access Denied
      </Typography>

      <Typography variant="body1" sx={{ color: "text.secondary", mb: 3, maxWidth: 500 }}>
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/dashboard")}
          sx={{ px: 4, py: 1, borderRadius: 2, textTransform: "none" }}
        >
          Go to Dashboard
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate(-1)}
          sx={{ px: 4, py: 1, borderRadius: 2, textTransform: "none" }}
        >
          Go Back
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 5, color: "text.disabled" }}>
        © {new Date().getFullYear()} <a href="https://techiesquad.com/" target="_blank" rel="noopener noreferrer">Techie Squad ® </a>. All rights reserved.
      </Typography>
    </Container>
  );
};

export default Error403;
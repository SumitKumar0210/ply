import React from "react";
import { Grid, Box } from "@mui/material";

const AuthLayout = ({ children }) => {
  return (
    <Grid
      container
      className='login-bg'
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // bgcolor: "grey.100",
        position: "relative",
      }}
    >
      <Box sx={{ zIndex: 2 }}>{children}</Box>
    </Grid>
  );
};

export default AuthLayout;

import { Box, Typography } from "@mui/material";

const drawerWidth = 220;

const Footer = ({ mobileOpen }) => {
  return (
    <Box
      sx={{
        py: 2,
        bgcolor: "grey.200",
        mt: "auto",
        // pl: { sm: mobileOpen ? `${drawerWidth}px` : 0 },
        transition: "all 0.3s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} Aarish Ply. All rights reserved.
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "right" }}>
          Powered by <a href="#">Techie Squad &reg;</a>
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;

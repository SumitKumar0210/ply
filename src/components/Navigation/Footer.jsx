import { Box, Typography } from "@mui/material";

const drawerWidth = 220;

const Footer = ({ mobileOpen }) => {
  return (
    <Box
      sx={{
        py: 2,
        bgcolor: "#fff",
        mt: "auto",
        // pl: { sm: mobileOpen ? `${drawerWidth}px` : 0 },
        transition: "all 0.3s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" }, // stack on mobile
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          gap: { xs: 1, sm: 0 }, // spacing between rows on mobile
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} Aarish Ply. All rights reserved.
        </Typography>

        <Typography variant="body2">
          Powered by{" "}
          <a
            href="https://techiesquad.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            Techie Squad &reg;
          </a>
        </Typography>
      </Box>

    </Box>
  );
};

export default Footer;

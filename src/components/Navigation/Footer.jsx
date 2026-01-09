import { Box, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

const drawerWidth = 220;

const Footer = ({ mobileOpen }) => {
  const auth = useAuth();
  const ctxAppDetails = auth?.appDetails ?? null;
  const displayAppName = ctxAppDetails?.application_name || (typeof window !== "undefined" ? localStorage.getItem("application_name") : "") || "";
  const isPoweredBy = ctxAppDetails?.is_powered_by || "";
  const poweredByLink = ctxAppDetails?.powered_by_link || "";
  const poweredByName = ctxAppDetails?.powered_by_name || "";


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
          gap: { xs: 0, sm: 0 }, // spacing between rows on mobile
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
          © {new Date().getFullYear()} {displayAppName}. All rights reserved.
        </Typography>
        {isPoweredBy && (
          <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
            Powered by{" "}
            <a
              href={poweredByLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              {poweredByName} &reg;
            </a>
          </Typography>
        )}

      </Box>

    </Box>
  );
};

export default Footer;

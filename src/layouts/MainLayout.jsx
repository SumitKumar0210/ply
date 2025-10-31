import React, { useState } from "react";
import { Box, Toolbar, Container } from "@mui/material";
import Header from "../components/Navigation/Header";
import Sidebar from "../components/Navigation/Sidebar";
import Footer from "../components/Navigation/Footer";

const drawerWidth = 220;

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(true);

  const handleToggleSidebar = () => setMobileOpen(!mobileOpen);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Header */}
      <Header mobileOpen={mobileOpen} onToggleSidebar={handleToggleSidebar} />

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onClose={handleToggleSidebar} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { sm: mobileOpen ? `${drawerWidth}px` : 0 },
          transition: "all 0.3s ease",
          display: "flex",
          flexDirection: "column",
          width: "100%",          //  ensure it never overflows
          overflowX: "hidden", 
          background: "#eff1f9"
        }}
      >
        {/* Push content below AppBar */}
        <Toolbar />

        {/* Page Content */}
        <Container maxWidth={false} sx={{ flex: 1, py: 2 }}>
          {children}
        </Container>

        {/* Footer */}
        <Footer mobileOpen={mobileOpen} />
      </Box>
    </Box>
  );
};

export default MainLayout;

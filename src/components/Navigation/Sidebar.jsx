import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
  Collapse,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";

// Icons
import { SlArrowDown, SlArrowUp } from "react-icons/sl";
import { AiOutlineHome } from "react-icons/ai";
import { FiUsers } from "react-icons/fi";
import { TfiBarChartAlt } from "react-icons/tfi";
import { FaRegFileLines } from "react-icons/fa6";
import { IoSettingsOutline } from "react-icons/io5";
import { MdStorefront } from "react-icons/md";
import { MdOutlineDashboard } from "react-icons/md";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { MdPayment } from "react-icons/md";
import { LuTable } from "react-icons/lu";
import { RiFileList3Line } from "react-icons/ri";
import { IoConstructOutline } from "react-icons/io5";
import { TbUsersPlus } from "react-icons/tb";




import Logo from "../../assets/images/logo.svg";

const drawerWidth = 220;

const menuSections = [
  {
    title: "App",
    items: [
      { text: "Dashboard", to: "/dashboard", icon: <AiOutlineHome /> },
    ],
  },
  {
    title: "Dashboard",
    items: [
      {
        text: "Vendors",
        icon: <MdStorefront/>,
        children: [
          { text: "Dashboard", to: "/vendor/dashboard", icon: <MdOutlineDashboard/> },
          { text: "Purchase Order", to: "/vendor/purchase-order", icon: <RiFileList3Line /> },
          { text: "QC PO", to: "/vendor/purchase-order/approve", icon: <RiFileList3Line /> },
          { text: "Vendor Invoice", to: "/vendor/invoice", icon: <LiaFileInvoiceSolid /> },
          // { text: "Vendor Payment", to: "/vendor/payment", icon: <MdPayment /> },
          { text: "Vendor list", to: "/vendor/list", icon: <LuTable /> },
          // { text: "Create Vendor", to: "/vendor/create-vendor", icon: <MdStorefront /> },
        ],
      },
      {
        text: "Customers",
        icon: <FiUsers/>,
        children: [
          { text: "Dashboard", to: "/customer/dashboard", icon: <MdOutlineDashboard/> },
          { text: "Quotation", to: "/customer/quote", icon: <RiFileList3Line /> },
          { text: "Order", to: "/customer/order", icon: <RiFileList3Line /> },
          { text: "Customer Ledger", to: "/customer/ledger", icon: <LuTable /> },
        ],
      },
      {
        text: "Users",
        icon: <FiUsers />,
        children: [
          { text: "Users", to: "/users", icon: <FiUsers /> },
          { text: "Customers", to: "/customers", icon: <TbUsersPlus /> },
          { text: "Labours", to: "/labours", icon: <IoConstructOutline /> },
        ],
      },
      { text: "Settings", to: "/settings", icon: <IoSettingsOutline /> },
    ],
  },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleToggle = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const handleItemClick = () => {
    if (isMobile) {
      onClose?.(); // close only in mobile
    }
  };

  const drawerContent = (
    <>
      {/* Logo */}
      <Box display="flex" alignItems="center" sx={{ p: 2 }}>
        <img
          src={Logo}
          alt="logo"
          style={{ width: "40px", marginRight: "10px" }}
        />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Aarish Ply
        </Typography>
      </Box>

      {/* Menu */}
      {menuSections.map(({ items }) => (
        <List key={items[0].text} disablePadding>
          {items.map(({ text, to, icon, children }) => {
            const isParentActive = children?.some((c) =>
              location.pathname.startsWith(c.to)
            );

            return (
              <React.Fragment key={text}>
                {/* Parent Item */}
                <ListItemButton
                  component={to && !children ? NavLink : "button"}
                  to={to || undefined}
                  onClick={
                    children ? () => handleToggle(text) : handleItemClick
                  }
                  className="menu-item"
                  sx={{
                    mx: 1,
                    mb: 0.25,
                    borderRadius: 1,
                    color: "text.primary",
                    "& .MuiListItemIcon-root": {
                      color: "inherit",
                      minWidth: 20,
                    },
                    "&.active, &:hover": {
                      backgroundColor: "rgba(25,118,210,0.08)",
                      color: "primary.main",
                      "& .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                      "& .MuiListItemText-primary": {
                        color: "primary.main",
                      },
                    },
                    ...(isParentActive && {
                      backgroundColor: "rgba(25,118,210,0.08)",
                      color: "primary.main",
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                      "& .MuiListItemText-primary": { color: "primary.main" },
                    }),
                  }}
                >
                  {icon && <ListItemIcon>{icon}</ListItemIcon>}
                  <ListItemText
                    primary={text}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                  {children &&
                    (openSubmenu === text ? <SlArrowUp /> : <SlArrowDown />)}
                </ListItemButton>

                {/* Submenu */}
                {children && (
                  <Collapse in={openSubmenu === text}>
                    <List disablePadding>
                      {children.map((sub) => (
                        <ListItemButton
                          key={sub.text}
                          component={NavLink}
                          to={sub.to}
                          onClick={handleItemClick} //  close only on mobile
                          className="menu-item"
                          sx={{
                            pl: 4,
                            mx: 1,
                             mb: 0.25,
                            borderRadius: 1,
                            color: "text.primary",
                            "& .MuiListItemIcon-root": {
                              color: "inherit",
                              minWidth: 20,
                            },
                            "&.active, &:hover": {
                              backgroundColor: 'theme.active',
                              color: "primary.main",
                              "& .MuiListItemIcon-root": {
                                color: "primary.main",
                              },
                              "& .MuiListItemText-primary": {
                                color: "primary.main",
                              },
                            },
                          }}
                        >
                          {sub.icon && <ListItemIcon>{sub.icon}</ListItemIcon>}
                          <ListItemText
                            primary={sub.text}
                            primaryTypographyProps={{
                              variant: "body2",
                              sx: { fontSize: "0.85rem" },
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="persistent"
        open={mobileOpen}
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;

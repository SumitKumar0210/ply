import React, { useState } from "react";
import {
  Container,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";

// Icons
import { LuUserRoundCog } from "react-icons/lu";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DescriptionIcon from "@mui/icons-material/Description";
import CalculateIcon from "@mui/icons-material/Calculate";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import LayersIcon from "@mui/icons-material/Layers";
import WorkIcon from "@mui/icons-material/Work";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LabelIcon from "@mui/icons-material/Label";
import { FaLayerGroup } from "react-icons/fa6";
import { GrGroup } from "react-icons/gr";
import { MdOutlineGrade } from "react-icons/md";
import { TbRosetteNumber1 } from "react-icons/tb";
import { GoGitBranch } from "react-icons/go";
import { MdOutlineStorefront } from "react-icons/md";

import ColorLensIcon from "@mui/icons-material/ColorLens";
import UserType from "./userType/UserType";
import Department from "./Department/Department";
import Group from "./Group/Group";
import Category from "./Category/Category";
import UOM from "./UOM/Uom";
import Grade from "./Grade/Grade";
import Branch from "./Branch/Branch";
import Vendor from "./Vendor/Vendor";
import Material from "./Material/Material";
import Product from "./Product/Product";
import Machine from "./Machine/Machine";


const tabConfig = [
  { value: "tab1", label: "User Type", icon: <LuUserRoundCog />, component: <UserType/> },
  { value: "tab15", label: "Departments", icon: <FaLayerGroup />, component: <Department/> },
  { value: "tab2", label: "Groups", icon: <GrGroup />, component: <Group/> },
  { value: "tab3", label: "Categories", icon: <DescriptionIcon />, component: <Category/>},
  { value: "tab8", label: "UOM", icon: <TbRosetteNumber1 />, component: <UOM/> },
  { value: "tab6", label: "Grades", icon: <MdOutlineGrade />, component: <Grade/> },
  { value: "tab10", label: "Branch", icon: <GoGitBranch />, component: <Branch/> },
  { value: "tab4", label: "Vendors", icon: <MdOutlineStorefront />, component: <Vendor/> },
  { value: "tab5", label: "Material", icon: <FolderOpenIcon />, component: <Material/> },
  { value: "tab7", label: "Products", icon: <LayersIcon />, component: <Product/> },
  { value: "tab9", label: "Machines", icon: <CheckCircleOutlineIcon />, component: <Machine/> },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("tab1");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const activeComponent = tabConfig.find((t) => t.value === activeTab)?.component;

  return (
    <Container
      disableGutters
      sx={{
        maxWidth: "100% !important",
        overflowX: "hidden",
        boxSizing: "border-box",
        marginBottom: 3
      }}
    >
         {/* Page Title */}
<Box sx={{ mb: 2 }}>
<Typography variant="h6">Settings</Typography>
</Box>
     <Box
  sx={{
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    height: isMobile ? "auto !important" : "calc(100vh - 220px)",
    gap: 2,
    boxSizing: "border-box",
    overflow: "hidden", // container stays clean
  }}
>
  {/* Sidebar */}
  <Box
    sx={{
      flex: isMobile ? "0 0 auto" : "0 0 240px",
      height: isMobile ? "auto !important" : "100%",
      boxSizing: "border-box",
    }}
  >
    <Card
      variant="outlined"
      sx={{
        height: isMobile ? "auto !important" : "100%",
        overflowY: isMobile ? "visible !important" : "auto",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Navigation
        </Typography>
       <Tabs
            orientation={isMobile ? "horizontal" : "vertical"}
            value={activeTab}
            onChange={handleChange}
            variant="scrollable"
            allowScrollButtonsMobile   
            TabIndicatorProps={{ style: { display: "none" } }} // 🚀 remove blue border line
            sx={{
                alignItems: isMobile ? "center" : "flex-start",
                maxWidth: "100%",
                 borderRight: "none",
                 '& .MuiTabs-scroller': {
                    display: "block", // ✅ force block so children can fill width
                    width: "100%",
                },
                '& .MuiTab-root': {
                    justifyContent: 'flex-start', // icon + text left
                    borderRadius: 1,
                    textTransform: 'none',
                    minHeight: 40,
                    width: "100%", 
                    maxWidth: "100%",
                    px: 1,
                    mb:1,
                    backgroundColor: 'theme.light',
                    fontSize: isMobile ? "0.75rem" : "0.9rem",
                    fontWeight: 500,
                    // color: '#020202ff', // default text/icon color
                    "&:hover": {
                        backgroundColor: 'theme.active',
                        color: "primary.main", // same as selected text color
                    },
                },
                '& .Mui-selected': {
                  backgroundColor: 'theme.active',
                  color: 'primary.main', // blue text when active
                  fontWeight: 500,
                  borderRight: 'none !important', 
                },
                '& .MuiTab-root .MuiSvgIcon-root': {
                    fontSize: '1.2rem',
                    marginRight: 1,
                },
            }}
            >
            {tabConfig.map((tab) => (
                <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                />
            ))}
        </Tabs>

      </CardContent>
    </Card>
  </Box>

  {/* Main Content */}
  <Box
    sx={{
      flex: 1,
      height: isMobile ? "auto !important" : "100%",
      boxSizing: "border-box",
    }}
  >
    <Card
      variant="outlined"
      sx={{
        height: isMobile ? "auto !important" : "100%",
        display: "flex",
        flexDirection: "column",
        overflow: isMobile ? "visible !important" : "hidden",
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          overflowY: isMobile ? "visible !important" : "auto",
          p: 2,
        }}
      >
        {activeComponent}
      </CardContent>
    </Card>
  </Box>
</Box>

    </Container>
  );
}

export default SettingsPage;

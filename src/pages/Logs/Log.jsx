import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Factory as FactoryIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import ProductionLogTab from "../../components/Logs/ProductionLogTab/ProductionLogTab";
import VendorPaymentLogTab from "../../components/Logs/VendorPaymentLogTab/VendorPaymentLogTab";
import CustomerPaymentLogTab from "../../components/Logs/CustomerPaymentLogTab/CustomerPaymentLogTab";
import { useAuth } from '../../context/AuthContext';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`log-tabpanel-${index}`}
      aria-labelledby={`log-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const LogsPage = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Define available tabs based on permissions
  const availableTabs = useMemo(() => {
    const tabs = [];
    
    if (hasPermission("logs.production")) {
      tabs.push({
        id: 'production',
        label: 'Production Logs',
        icon: <FactoryIcon />,
        component: <ProductionLogTab />
      });
    }
    
    if (hasPermission("logs.vendor_payment")) {
      tabs.push({
        id: 'vendor_payment',
        label: 'Vendor Payment Logs',
        icon: <PaymentIcon />,
        component: <VendorPaymentLogTab />
      });
    }
    
    if (hasPermission("logs.customer_payment")) {
      tabs.push({
        id: 'customer_payment',
        label: 'Customer Payment Logs',
        icon: <ReceiptIcon />,
        component: <CustomerPaymentLogTab />
      });
    }
    
    return tabs;
  }, [hasPermission]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // If no tabs are available, show message
  if (availableTabs.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            You don't have permission to view any logs.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 4 }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h4" fontWeight={600} gutterBottom>
          System Logs
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          View and manage production, vendor payment, and customer payment logs
        </Typography>
      </Paper>

      {/* Tabs Section */}
      <Paper elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
              }
            }}
          >
            {availableTabs.map((tab, index) => (
              <Tab
                key={tab.id}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                id={`log-tab-${index}`}
                aria-controls={`log-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        {availableTabs.map((tab, index) => (
          <TabPanel key={tab.id} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>
    </Container>
  );
};

export default LogsPage;
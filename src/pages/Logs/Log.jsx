import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xll" sx={{ pt: 4 }}>
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
            <Tab
              icon={<FactoryIcon />}
              iconPosition="start"
              label="Production Logs"
              id="log-tab-0"
              aria-controls="log-tabpanel-0"
            />
            <Tab
              icon={<PaymentIcon />}
              iconPosition="start"
              label="Vendor Payment Logs"
              id="log-tab-1"
              aria-controls="log-tabpanel-1"
            />
            <Tab
              icon={<ReceiptIcon />}
              iconPosition="start"
              label="Customer Payment Logs"
              id="log-tab-2"
              aria-controls="log-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <ProductionLogTab />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <VendorPaymentLogTab />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <CustomerPaymentLogTab />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default LogsPage;
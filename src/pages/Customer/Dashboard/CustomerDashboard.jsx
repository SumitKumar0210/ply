import React from 'react'
import Grid from "@mui/material/Grid";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Skeleton
} from "@mui/material";
import {
  Store,
  ShoppingCart,
  PendingActions,
  AssignmentLate,
  Inventory,
  MonetizationOn,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const CustomerDashboard = () => {
  const [loading, setLoading] = React.useState(true);

  // Simulate loading state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // --- Summary data ---
  const summaryCards = [
    { title: "Total Customer", value: 108, icon: <Store />, color: "#42a5f5" },
    { title: "Active Order", value: 108, icon: <ShoppingCart />, color: "#66bb6a" },
    { title: "Pending Order", value: 108, icon: <PendingActions />, color: "#ffa726" },
    { title: "Due Order", value: 108, icon: <AssignmentLate />, color: "#ef5350" },
    { title: "Low on Inventory Items", value: 108, icon: <Inventory />, color: "#ab47bc" },
    { title: "Total Due", value: 108, icon: <MonetizationOn />, color: "#26c6da" },
  ];

  // --- Table data ---
  const customers = [
    { name: "Customer A", invoices: 12, total: "₹45,000" },
    { name: "Customer B", invoices: 10, total: "₹38,000" },
    { name: "Customer C", invoices: 9, total: "₹30,000" },
    { name: "Customer D", invoices: 8, total: "₹28,000" },
    { name: "Customer E", invoices: 6, total: "₹25,000" },
  ];

  // --- Chart data ---
  const chartData = [
    { name: "Customer A", value: 4000 },
    { name: "Customer B", value: 3000 },
    { name: "Customer C", value: 2000 },
    { name: "Customer D", value: 2780 },
  ];

  // Skeleton for summary cards
  const SummaryCardSkeleton = () => (
    <Card
      sx={{
        p: 1,
        borderRadius: 2,
        textAlign: "center",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <CardContent>
        <Skeleton
          variant="circular"
          width={50}
          height={50}
          sx={{ margin: "0 auto", mb: 1 }}
        />
        <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width="60%" height={30} sx={{ mx: 'auto', mt: 0.5 }} />
      </CardContent>
    </Card>
  );

  // Skeleton for table rows
  const TableRowSkeleton = () => (
    <TableRow>
      <TableCell>
        <Skeleton variant="text" width="80%" height={25} />
      </TableCell>
      <TableCell>
        <Skeleton variant="text" width="60%" height={25} />
      </TableCell>
      <TableCell>
        <Skeleton variant="text" width="70%" height={25} />
      </TableCell>
    </TableRow>
  );

  // Skeleton for chart
  const ChartSkeleton = () => (
    <Box sx={{ width: '100%', height: 290 }}>
      <Skeleton variant="rectangular" width="100%" height={290} sx={{ borderRadius: 1 }} />
    </Box>
  );

  return (
    <>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6" className="page-title">Customer Dashboard</Typography>
        </Grid>
      </Grid>
      
      {/* Summary Cards */}
      <Grid container spacing={2}>
        {loading ? (
          // Show skeletons when loading
          Array(6).fill(0).map((_, index) => (
            <Grid key={`skeleton-${index}`} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <SummaryCardSkeleton />
            </Grid>
          ))
        ) : (
          // Show actual cards when not loading
          summaryCards.map((item, i) => (
            <Grid key={i} size={{ xs: 6, sm: 6, md: 4, lg: 2 }}>
              <Card
                sx={{
                   p: 1,
                  borderRadius: 2,
                  textAlign: "center",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
                  transition: "all 0.3s ease",
                  background: `linear-gradient(145deg, ${item.color}15, ${item.color}10)`,
                  height: "100%",               // 👈 key
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0px 6px 16px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent>
                  <Avatar
                    sx={{
                      bgcolor: item.color,
                      width: 50,
                      height: 50,
                      margin: "0 auto",
                    }}
                  >
                    {item.icon}
                  </Avatar>
                  <Typography variant="subtitle2" color="text.secondary"
                  
                    sx={{ mt: 1 ,  
                    fontSize: '1rem',
                    lineHeight: 1.2,
                    }}>
                    {item.title}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="500"
                    sx={{ color: item.color, mt: 0.5, fontSize: '1.5rem' }}
                  >
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Bottom Layout */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {/* Tables */}
        <Grid size={{ xs: 12, md: 6, lg: 7 }}>
          <Grid container spacing={2}>
            {/* First Table */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight="600" mb={2}>
                Top 5 Customers (Most Value)
              </Typography>
              <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f1f1f1" }}>
                    <TableRow>
                      <TableCell>Vendor Name</TableCell>
                      <TableCell>Invoices</TableCell>
                      <TableCell>Total Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRowSkeleton key={`table1-skeleton-${index}`} />
                      ))
                    ) : (
                      customers.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell>{v.name}</TableCell>
                          <TableCell>{v.invoices}</TableCell>
                          <TableCell>{v.total}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* Second Table */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight="600" mb={2}>
                Top 5 Customers (Most Invoices)
              </Typography>
              <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f1f1f1" }}>
                    <TableRow>
                      <TableCell>Vendor Name</TableCell>
                      <TableCell>Invoices</TableCell>
                      <TableCell>Total Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRowSkeleton key={`table2-skeleton-${index}`} />
                      ))
                    ) : (
                      customers.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell>{v.name}</TableCell>
                          <TableCell>{v.invoices}</TableCell>
                          <TableCell>{v.total}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Chart */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Typography variant="subtitle1" fontWeight="600" mb={2}>
            Customer Performance Overview
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar 
                    dataKey="value" 
                    fill="#54aca4d5" 
                    barSize={28} 
                    activeBar={false} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  )
}

export default CustomerDashboard
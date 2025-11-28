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
const VendorDashboard = () => {

  // --- Summary data ---
  const summaryCards = [
    { title: "Total Vendors", value: 108, icon: <Store />, color: "#42a5f5" },
    { title: "Active Purchase Order", value: 108, icon: <ShoppingCart />, color: "#66bb6a" },
    { title: "Pending Purchase Order", value: 108, icon: <PendingActions />, color: "#ffa726" },
    { title: "Due Purchase Order", value: 108, icon: <AssignmentLate />, color: "#ef5350" },
    { title: "Low on Inventory Items", value: 108, icon: <Inventory />, color: "#ab47bc" },
    { title: "Total Due", value: 108, icon: <MonetizationOn />, color: "#26c6da" },
  ];

  // --- Table data ---
  const vendors = [
    { name: "Vendor A", invoices: 12, total: "₹45,000" },
    { name: "Vendor B", invoices: 10, total: "₹38,000" },
    { name: "Vendor C", invoices: 9, total: "₹30,000" },
    { name: "Vendor D", invoices: 8, total: "₹28,000" },
    { name: "Vendor E", invoices: 6, total: "₹25,000" },
  ];

  // --- Chart data ---
  const chartData = [
    { name: "Vendor A", value: 4000 },
    { name: "Vendor B", value: 3000 },
    { name: "Vendor C", value: 2000 },
    { name: "Vendor D", value: 2780 },
  ];

  return (
    <>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6">Vendor Dashboard</Typography>
        </Grid>
      </Grid>
      {/* Summary Cards */}
      <Grid container spacing={2}>
        {summaryCards.map((item, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Card
              sx={{
                p: 1,
                borderRadius: 2,
                textAlign: "center",
                boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
                background: `linear-gradient(145deg, ${item.color}15, ${item.color}10)`,
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
                    // mb: 1,
                  }}
                >
                  {item.icon}
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  {item.title}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: item.color, mt: 0.5 }}
                >
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Button */}
      {/* <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" sx={{ borderRadius: 2 }}>
          Create Purchase Order
        </Button>
      </Box> */}

      {/* Bottom Layout */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {/* Tables */}
        <Grid size={{ xs: 12, md: 6, lg: 7 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight="600" mb={2}>
                Top 5 Vendors (Most Value)
              </Typography>
              <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Table >
                  <TableHead sx={{ bgcolor: "#f1f1f1" }}>
                    <TableRow>
                      <TableCell>Vendor Name</TableCell>
                      <TableCell>Invoices</TableCell>
                      <TableCell>Total Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendors.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell>{v.name}</TableCell>
                        <TableCell>{v.invoices}</TableCell>
                        <TableCell>{v.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight="600" mb={2}>
                Top 5 Vendors (Most Invoices)
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
                    {vendors.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell>{v.name}</TableCell>
                        <TableCell>{v.invoices}</TableCell>
                        <TableCell>{v.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Chart */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Typography variant="subtitle1" fontWeight="600" mb={2}>
            Vendor Performance Overview
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={75} />
                 <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" fill="#54aca4d5" barSize={28} activeBar={false} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </>
  )
}

export default VendorDashboard
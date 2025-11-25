import React from "react";
import Grid from '@mui/material/Grid';
import { Paper, Typography } from "@mui/material";

const Dashboard = () => {
  return (
    <>
     <Grid container spacing={2}>
  {/* Left Column */}
  <Grid item xs={12} md={6}>
    <Paper sx={{ p: 2, background: "#f7f7f7", boxShadow: "none" }}>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Typography>
        Welcome! This is your main dashboard. Add widgets, charts, and stats here...
      </Typography>
    </Paper>
  </Grid>

  {/* Right Column 1 */}
  <Grid item xs={12} md={3}>
    <Paper sx={{ p: 2, background: "#f7f7f7", boxShadow: "none" }}>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Typography>
        Welcome! This is your main dashboard. Add widgets, charts, and stats here...
      </Typography>
    </Paper>
  </Grid>

  {/* Right Column 2 */}
  <Grid item xs={12} md={3}>
    <Paper sx={{ p: 2, background: "#f7f7f7", boxShadow: "none" }}>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Typography>
        Welcome! This is your main dashboard. Add widgets, charts, and stats here...
      </Typography>
    </Paper>
  </Grid>
</Grid>

    </>
  );
};

export default Dashboard;

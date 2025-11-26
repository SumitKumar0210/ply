import React from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const productionData = [
    { time: "00:00", output: 150 },
    { time: "04:00", output: 200 },
    { time: "08:00", output: 320 },
    { time: "12:00", output: 410 },
    { time: "16:00", output: 390 },
    { time: "20:00", output: 340 },
    { time: "24:00", output: 280 },
  ];

  const machineData = [
    { name: "Machine A", value: 92 },
    { name: "Machine B", value: 85 },
    { name: "Machine C", value: 78 },
    { name: "Machine D", value: 88 },
  ];

  const qcData = [
    { name: "Pass", value: 985, color: "#10b981" },
    { name: "Fail", value: 15, color: "#ef4444" },
  ];

  const dispatchData = [
    { status: "Pending", count: 45, color: "#f59e0b" },
    { status: "In Transit", count: 32, color: "#3b82f6" },
    { status: "Delivered", count: 118, color: "#10b981" },
  ];

  const kpis = [
    { title: "Production", value: "2,340 Units", color: "#3b82f6" },
    { title: "Efficiency", value: "94.2%", color: "#22c55e" },
    { title: "Quality", value: "98.5%", color: "#059669" },
    { title: "Orders", value: "342", color: "#a855f7" },
    { title: "Alerts", value: "3", color: "#ef4444" },
    { title: "Cost", value: "₹2.4M", color: "#f59e0b" },
  ];

  const rawMaterials = [
    { name: "Steel Coil", stock: 156, unit: "rolls", status: "normal" },
    { name: "Aluminum", stock: 48, unit: "kg", status: "low" },
    { name: "Lubricant", stock: 320, unit: "liters", status: "normal" },
  ];


  return (
    <Box>

      {/* KPI CARDS */}
      <Grid container spacing={2}>
        {kpis.map((k, i) => (
          <Grid size={2} key={i}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: k.color, height: "100%" }}>
              <Typography color="white" fontSize={14}>{k.title}</Typography>
              <Typography color="white" fontSize={18} fontWeight={500}>{k.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ROW 1 */}
      <Grid container spacing={2} mt={2}>

        {/* PRODUCTION */}
        <Grid size={6}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" mb={2} fontWeight={500}>Production Output</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={productionData}>
                <defs>
                  <linearGradient id="prod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="90%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#cbd5e1" fontSize={14}/>
                <YAxis stroke="#cbd5e1" fontSize={14}/>
                <Tooltip contentStyle={{ background: "#fcfcfc", border: "none" }} />
                <Area dataKey="output" stroke="#3b82f6" fill="url(#prod)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* MACHINE UTILIZATION */}
        <Grid size={3}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" mb={2}>Machine Utilization</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={machineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#cbd5e1" fontSize={14} />
                <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={14} />
                <Tooltip contentStyle={{ background: "#fcfcfc", border: "none" }} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* QC CHART */}
        <Grid size={3}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" mb={2}>QC Trends</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={qcData} innerRadius={60} outerRadius={110} dataKey="value">
                  {qcData.map((v, i) => <Cell key={i} fill={v.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#fcfcfc", border: "none" }} />
              </PieChart>
            </ResponsiveContainer>

            <Typography color="white" fontSize={12}>Pass: 985 (98.5%)</Typography>
            <Typography color="white" fontSize={12}>Fail: 15 (1.5%)</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ROW 2 */}
      <Grid container spacing={2} mt={2}>

        {/* RAW MATERIAL */}
        <Grid size={4}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" fontWeight={500} mb={2}>Raw Materials</Typography>
            {rawMaterials.map((m, i) => (
              <Box key={i} display="flex" justifyContent="space-between" mb={1}>
                <Box>
                  <Typography color="white">{m.name}</Typography>
                  <Typography fontSize={12} color="gray">{m.stock} {m.unit}</Typography>
                </Box>
                <Chip label={m.status} color={m.status === "low" ? "error" : "success"} />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* DISPATCH */}
        <Grid size={4}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" fontWeight={500}>Dispatch Tracker</Typography>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={dispatchData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="status" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip contentStyle={{ background: "#fcfcfc", border: "none" }} />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
            {dispatchData.map((d, i) => (
              <Typography color="white" key={i} fontSize={12} sx={{ mt: 0.5 }}>
                ● {d.status}: {d.count}
              </Typography>
            ))}
          </Paper>
        </Grid>

        {/* ATTENDANCE */}
        <Grid size={4}>
          <Paper sx={{ p: 2, bgcolor: "#374153", height: "100%" }}>
            <Typography color="white" fontWeight={500}>Attendance</Typography>
            <Typography color="success.main" fontSize={30}>96.4%</Typography>
            <LinearProgress variant="determinate" value={96.4} sx={{ height: 10, borderRadius: 5, mb: 2 }} />
            <Typography color="white" fontSize={13}>Total Staff: 140</Typography>
            <Typography color="white" fontSize={13}>Absent: 5</Typography>
          </Paper>
        </Grid>

      </Grid>

    </Box>
  );
}

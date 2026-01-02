import React, { useMemo, useEffect, useCallback, useRef, useState  } from "react";
import Grid from "@mui/material/Grid";
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Backdrop,
  Skeleton,
  Button,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveLabours } from "../slices/labourSlice";
import { getMonthlyAttendance, setMonthYear, sendDailyAttendanceReport } from "./slice/attendanceSlice";
import {
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
} from "react-icons/md";
import { format, getDaysInMonth, addMonths, subMonths } from "date-fns";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Skeleton loader for table rows
const AttendanceTableSkeleton = ({ daysInMonth }) => {
  const skeletonRows = Array(5).fill(null); // Show 5 skeleton rows
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      {skeletonRows.map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`}>
          {/* Labour Name Skeleton */}
          <TableCell
            sx={{
              backgroundColor: "white",
              position: "sticky",
              left: 0,
              zIndex: 2,
              borderRight: "2px solid #e0e0e0",
            }}
          >
            <Skeleton variant="text" width={120} height={24} />
          </TableCell>

          {/* Date Cells Skeleton */}
          {dates.map((day) => (
            <TableCell
              key={`skeleton-${rowIndex}-${day}`}
              align="center"
              sx={{
                borderLeft: "1px solid rgba(224, 224, 224, 1)",
              }}
            >
              <Skeleton
                variant="rounded"
                width={60}
                height={20}
                sx={{ margin: "0 auto" }}
              />
            </TableCell>
          ))}

          {/* Total Hours Skeleton */}
          <TableCell
            align="center"
            sx={{
              backgroundColor: "white",
              position: "sticky",
              right: 0,
              zIndex: 2,
              borderLeft: "2px solid #e0e0e0",
            }}
          >
            <Skeleton
              variant="rounded"
              width={60}
              height={24}
              sx={{ margin: "0 auto" }}
            />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

const Attendance = () => {
  const dispatch = useDispatch();
  const isInitialMount = useRef(true);
  const [sendingReport, setSendingReport] = useState(false);


  // Redux state
  const { activeLabours: labours = [], loading: laboursLoading } = useSelector((state) => state.labour);
  const {
    data: attendanceData = {},
    selectedMonth,
    selectedYear,
    loading,
  } = useSelector((state) => state.attendance);

  // Calculate days in current month
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
  }, [selectedMonth, selectedYear]);

  // Generate array of dates for the month
  const dates = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Get day of week for each date
  const getDayOfWeek = useCallback((day) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    return format(date, "EEE");
  }, [selectedMonth, selectedYear]);

  // Load initial data
  useEffect(() => {
    if (isInitialMount.current) {
      dispatch(fetchActiveLabours());
      isInitialMount.current = false;
    }
    loadAttendance();
  }, [selectedMonth, selectedYear]);

  // Load attendance data
  const loadAttendance = useCallback(() => {
    dispatch(getMonthlyAttendance({ month: selectedMonth, year: selectedYear }));
  }, [dispatch, selectedMonth, selectedYear]);

  // Navigate to previous month
  const handlePreviousMonth = useCallback(() => {
    const currentDate = new Date(selectedYear, selectedMonth - 1);
    const prevMonth = subMonths(currentDate, 1);
    dispatch(setMonthYear({
      month: prevMonth.getMonth() + 1,
      year: prevMonth.getFullYear(),
    }));
  }, [dispatch, selectedMonth, selectedYear]);

  // Navigate to next month
  const handleNextMonth = useCallback(() => {
    const currentDate = new Date(selectedYear, selectedMonth - 1);
    const nextMonth = addMonths(currentDate, 1);
    dispatch(setMonthYear({
      month: nextMonth.getMonth() + 1,
      year: nextMonth.getFullYear(),
    }));
  }, [dispatch, selectedMonth, selectedYear]);

  // Handle month/year selection
  const handleMonthChange = useCallback((month) => {
    dispatch(setMonthYear({ month, year: selectedYear }));
  }, [dispatch, selectedYear]);

  const handleYearChange = useCallback((year) => {
    dispatch(setMonthYear({ month: selectedMonth, year }));
  }, [dispatch, selectedMonth]);

  // Get attendance for a specific labour and date
  const getAttendance = useCallback((labourId, day) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayAttendance = attendanceData[dateStr] || [];
    return dayAttendance.find(record => record.labour_id === labourId);
  }, [attendanceData, selectedMonth, selectedYear]);

  // Calculate hours between sign in and sign out
  const calculateHours = useCallback((signIn, signOut) => {
    if (!signIn || !signOut) return 0;

    try {
      const start = new Date(`2000-01-01 ${signIn}`);
      const end = new Date(`2000-01-01 ${signOut}`);
      const diff = (end - start) / (1000 * 60 * 60);
      return Math.max(0, parseFloat(diff.toFixed(2)));
    } catch (error) {
      return 0;
    }
  }, []);

  // Calculate total hours for a labour
  const getTotalHours = useCallback((labourId) => {
    let total = 0;
    Object.values(attendanceData).forEach(dayRecords => {
      const record = dayRecords.find(r => r.labour_id === labourId);
      if (record) {
        total += calculateHours(record.sign_in, record.sign_out);
      }
    });
    return total.toFixed(2);
  }, [attendanceData, calculateHours]);

  // Check if date is weekend
  const isWeekend = useCallback((day) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    const dayOfWeek = date.getDay();
    // return dayOfWeek === 0 || dayOfWeek === 6;
    return dayOfWeek === 0;
  }, [selectedMonth, selectedYear]);

  // Check if date is today
  const isToday = useCallback((day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === selectedMonth - 1 &&
      today.getFullYear() === selectedYear
    );
  }, [selectedMonth, selectedYear]);

  // Generate years for dropdown (2025 to current year)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const yearCount = currentYear - startYear + 1;
    return Array.from({ length: yearCount }, (_, i) => startYear + i);
  }, []);

  // Show initial loading backdrop only when labours are loading on first mount
  if (laboursLoading && isInitialMount.current) {
    return (
      <Backdrop open={true} sx={{ color: "#fff", zIndex: 9999 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  // Determine if we should show skeleton (only on initial load, not on month/year changes)
  const showSkeleton = loading && isInitialMount.current;

  const handleSendAttendanceReport = async () => {
    try {
      setSendingReport(true);
      await dispatch(sendDailyAttendanceReport()).unwrap();
    } catch (error) {
      console.error("Failed to send attendance report", error);
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <>
      {/* Header - Always visible */}
      <Grid container spacing={2} sx={{ mb: 3, justifyContent: "space-between" }}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h5" className="page-title">
              Monthly Attendance
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={handlePreviousMonth} size="small" disabled={loading}>
                <MdChevronLeft size={24} />
              </IconButton>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  disabled={loading}
                >
                  {MONTHS.map((month, index) => (
                    <MenuItem key={month} value={index + 1}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  disabled={loading}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <IconButton onClick={handleNextMonth} size="small" disabled={loading}>
                <MdChevronRight size={24} />
              </IconButton>

              <Tooltip title="Refresh">
                <IconButton onClick={loadAttendance} size="small" disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : <MdRefresh size={20} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        {/* Send Report Button */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
            sx={{justifyContent: "end" }}
              variant="contained"
              size="small"
              onClick={handleSendAttendanceReport}
              disabled={sendingReport}
              startIcon={
                sendingReport ? <CircularProgress size={16} color="inherit" /> : null
              }
            >
              {sendingReport ? "Sending..." : "Send Attendance Report"}
            </Button>
          </Box>
        </Grid>
      </Grid>


      {/* Attendance Table - Always visible with skeleton when loading */}
      <Paper elevation={0} sx={{ width: "100%", overflow: "hidden", position: "relative" }}>
        {/* Loading overlay indicator */}
        {loading && !isInitialMount.current && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              zIndex: 4,
              backgroundColor: "transparent",
            }}
          >
            <Box
              sx={{
                height: "100%",
                backgroundColor: "#1976d2",
                animation: "progress 1.5s ease-in-out infinite",
                "@keyframes progress": {
                  "0%": {
                    width: "0%",
                    marginLeft: "0%",
                  },
                  "50%": {
                    width: "50%",
                    marginLeft: "25%",
                  },
                  "100%": {
                    width: "0%",
                    marginLeft: "100%",
                  },
                },
              }}
            />
          </Box>
        )}

        <TableContainer sx={{ maxHeight: "calc(100vh - 200px)" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {/* Labour Name Column - Sticky */}
                <TableCell
                  sx={{
                    minWidth: 180,
                    fontWeight: 600,
                    backgroundColor: "#1976d2",
                    color: "white",
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                  }}
                >
                  Labour Name
                </TableCell>

                {/* Date Columns */}
                {dates.map((day) => (
                  <TableCell
                    key={day}
                    align="center"
                    sx={{
                      minWidth: 80,
                      fontWeight: 600,
                      backgroundColor: isWeekend(day)
                        ? "#ffebee"
                        : isToday(day)
                          ? "#e3f2fd"
                          : "#1976d2",
                      color: isWeekend(day) || isToday(day) ? "#000" : "white",
                      borderLeft: "1px solid rgba(224, 224, 224, 1)",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {day}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                        {getDayOfWeek(day)}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}

                {/* Total Hours Column - Sticky */}
                <TableCell
                  align="center"
                  sx={{
                    minWidth: 100,
                    fontWeight: 600,
                    backgroundColor: "#1976d2",
                    color: "white",
                    position: "sticky",
                    right: 0,
                    zIndex: 3,
                  }}
                >
                  Total Hours
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Show skeleton only on initial load */}
              {showSkeleton ? (
                <AttendanceTableSkeleton daysInMonth={daysInMonth} />
              ) : labours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={dates.length + 2} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No labours found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                labours.map((labour) => (
                  <TableRow
                    key={labour.id}
                    sx={{
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    {/* Labour Name - Sticky */}
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "white",
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        borderRight: "2px solid #e0e0e0",
                      }}
                    >
                      {labour.name}
                    </TableCell>

                    {/* Attendance Cells */}
                    {dates.map((day) => {
                      const attendance = getAttendance(labour.id, day);
                      const weekend = isWeekend(day);
                      const today = isToday(day);
                      const hours = attendance ? calculateHours(attendance.sign_in, attendance.sign_out) : 0;

                      return (
                        <TableCell
                          key={day}
                          align="center"
                          sx={{
                            backgroundColor: weekend
                              ? "#ffebee"
                              : today
                                ? "#e3f2fd"
                                : "white",
                            borderLeft: "1px solid rgba(224, 224, 224, 1)",
                          }}
                        >
                          {attendance ? (
                            <Tooltip
                              title={
                                attendance.sign_out
                                  ? `Sign In: ${attendance.sign_in} | Sign Out: ${attendance.sign_out}`
                                  : `Sign In: ${attendance.sign_in} | Not Signed Out`
                              }
                            >
                              <Chip
                                label={hours > 0 ? `${hours}h` : "Present"}
                                size="small"
                                color={hours > 0 ? "success" : "warning"}
                                sx={{ fontSize: "0.75rem", height: 20 }}
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}

                    {/* Total Hours - Sticky */}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        backgroundColor: "white",
                        position: "sticky",
                        right: 0,
                        zIndex: 2,
                        borderLeft: "2px solid #e0e0e0",
                      }}
                    >
                      <Chip
                        label={`${getTotalHours(labour.id)}h`}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default Attendance;
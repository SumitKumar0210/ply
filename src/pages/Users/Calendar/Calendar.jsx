import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    IconButton,
    Paper,
    styled,
    Skeleton,
} from "@mui/material";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Cancel,
    Warning,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { fetchActiveLabours } from "../slices/labourSlice";
import { fetchMonthlyAttendance } from "./slice/calendarSlice";
import { useDispatch, useSelector } from "react-redux";
import AttendanceModal from "../../../components/Attendance/AttendanceModal";

// Styled components
const CalendarContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: theme.spacing(2),
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(3),
}));

const DaysGrid = styled(Box)({
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
});

const DayHeader = styled(Typography)(({ theme }) => ({
    textAlign: "center",
    fontWeight: 600,
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
    padding: theme.spacing(1, 0),
}));

const DayCell = styled(Box, {
    shouldForwardProp: (prop) => 
        !['isCurrentMonth', 'isToday', 'isSelected', 'isSunday'].includes(prop),
})(({ theme, isCurrentMonth, isToday, isSelected, isSunday }) => ({
    position: "relative",
    minHeight: "70px",
    padding: theme.spacing(1),
    border: isToday
        ? `2px solid ${theme.palette.primary.main}`
        : isSelected
            ? `2px solid ${theme.palette.primary.light}`
            : "1px solid #e0e0e0",
    borderRadius: theme.spacing(1),
    cursor: "pointer",
    backgroundColor: isSunday
        ? "#ffebee"
        : isCurrentMonth
            ? "#fff"
            : "#f5f5f5",
    transition: "all 0.2s",
    "&:hover": {
        backgroundColor: isSunday ? "#ffcdd2" : "#f5f5f5",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },
}));

const DayNumber = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isCurrentMonth',
})(({ theme, isCurrentMonth }) => ({
    fontSize: "0.875rem",
    fontWeight: 600,
    color: isCurrentMonth ? theme.palette.text.primary : theme.palette.text.disabled,
    marginBottom: theme.spacing(0.5),
}));

const StatusBadge = styled(Box)(({ theme }) => ({
    position: "absolute",
    bottom: 4,
    right: 4,
    display: "flex",
    alignItems: "center",
    gap: 2,
}));

const StatusIcon = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'color',
})(({ color }) => ({
    width: 20,
    height: 20,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color === "success"
        ? "#4caf50"
        : color === "error"
            ? "#f44336"
            : "#ff9800",
    color: "#fff",
}));

const CountBadge = styled(Typography)(({ theme }) => ({
    fontSize: "0.7rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
    position: "absolute",
    top: 4,
    right: 4,
}));

const Calendar = ({ onDayClick }) => {
    const { activeLabours = [], loading: laboursLoading } = useSelector((state) => state.labour);
    const { data: attendanceData = [], loading: attendanceLoading } = useSelector((state) => state.calendar);
    
    const dispatch = useDispatch();
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    useEffect(() => {
        dispatch(fetchActiveLabours());
    }, [dispatch]);

    useEffect(() => {
        // Fetch attendance data when month/year changes
        const month = currentDate.month() + 1; // dayjs months are 0-indexed
        const year = currentDate.year();
        dispatch(fetchMonthlyAttendance({ month, year }));
        
        // Reset initial load after first fetch
        if (isInitialLoad) {
            setTimeout(() => setIsInitialLoad(false), 500);
        }
    }, [dispatch, currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(currentDate.subtract(1, "month"));
    };

    const handleNextMonth = () => {
        setCurrentDate(currentDate.add(1, "month"));
    };

    const handleDayClick = (date) => {
        const isCurrentMonth = date.month() === currentDate.month();
        if (!isCurrentMonth) return;

        setSelectedDate(date);
        setModalOpen(true);
        
        if (onDayClick) {
            onDayClick(date.format("YYYY-MM-DD"));
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedDate(null);
    };

    const getDayEvents = (date) => {
        const dateStr = date.format("YYYY-MM-DD");
        
        // Filter attendance records for this specific date
        const dayAttendance = attendanceData.filter(
            (record) => dayjs(record.date || record.attendance_date).format("YYYY-MM-DD") === dateStr
        );

        // Count statuses based on attendance records
        const success = dayAttendance.filter(
            (record) => record.sign_in_time && record.sign_out_time
        ).length;
        
        const error = dayAttendance.filter(
            (record) => !record.sign_in_time && !record.sign_out_time
        ).length;
        
        const warning = dayAttendance.filter(
            (record) => (record.sign_in_time && !record.sign_out_time) || (!record.sign_in_time && record.sign_out_time)
        ).length;

        return { success, error, warning };
    };

    const renderCalendarDays = () => {
        const days = [];
        let day = startDate;

        while (day.isBefore(endDate, "day") || day.isSame(endDate, "day")) {
            const isCurrentMonth = day.month() === currentDate.month();
            const isToday = day.isSame(dayjs(), "day");
            const isSelected = selectedDate && day.isSame(selectedDate, "day");
            const isSunday = day.day() === 0;
            const dayEvents = getDayEvents(day);
            const hasEvents = dayEvents.success > 0 || dayEvents.error > 0 || dayEvents.warning > 0;

            const currentDay = day;

            days.push(
                <DayCell
                    key={day.format("YYYY-MM-DD")}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isToday}
                    isSelected={isSelected}
                    isSunday={isSunday}
                    onClick={() => handleDayClick(currentDay)}
                >
                    <DayNumber isCurrentMonth={isCurrentMonth}>
                        {day.date()}
                    </DayNumber>

                    {/* Loading skeleton */}
                    {attendanceLoading && isCurrentMonth ? (
                        <Box sx={{ mt: 1, justifyItems: "end" }}>
                            <Skeleton variant="circular" width={20} height={20} />
                        </Box>
                    ) : (
                        <>
                            {/* Count badge */}
                            {isCurrentMonth && hasEvents && (
                                <CountBadge>
                                    {dayEvents.success + dayEvents.error + dayEvents.warning}
                                </CountBadge>
                            )}

                            {/* Status icons */}
                            {isCurrentMonth && hasEvents && (
                                <StatusBadge>
                                    {dayEvents.success > 0 && (
                                        <StatusIcon color="success">
                                            <CheckCircle sx={{ fontSize: 14 }} />
                                        </StatusIcon>
                                    )}
                                    {dayEvents.error > 0 && (
                                        <StatusIcon color="error">
                                            <Cancel sx={{ fontSize: 14 }} />
                                        </StatusIcon>
                                    )}
                                    {dayEvents.warning > 0 && (
                                        <StatusIcon color="warning">
                                            <Warning sx={{ fontSize: 14 }} />
                                        </StatusIcon>
                                    )}
                                </StatusBadge>
                            )}
                        </>
                    )}
                </DayCell>
            );

            day = day.add(1, "day");
        }

        return days;
    };

    return (
        <>
            <CalendarContainer>
                {/* Header */}
                <CalendarHeader>
                    {isInitialLoad && attendanceLoading ? (
                        <Skeleton variant="text" width={200} height={40} />
                    ) : (
                        <Typography variant="h5" fontWeight={700}>
                            {currentDate.format("MMMM YYYY")}
                        </Typography>
                    )}
                    <Box>
                        <IconButton 
                            onClick={handlePrevMonth} 
                            size="small"
                            disabled={isInitialLoad && attendanceLoading}
                        >
                            <ChevronLeft />
                        </IconButton>
                        <IconButton 
                            onClick={handleNextMonth} 
                            size="small"
                            disabled={isInitialLoad && attendanceLoading}
                        >
                            <ChevronRight />
                        </IconButton>
                    </Box>
                </CalendarHeader>

                {/* Days of week header */}
                <DaysGrid>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                        <DayHeader
                            key={day}
                            sx={{
                                color: index === 0 ? "error.main" : "text.secondary"
                            }}
                        >
                            {day}
                        </DayHeader>
                    ))}
                </DaysGrid>

                {/* Calendar days */}
                <DaysGrid>{renderCalendarDays()}</DaysGrid>

                {/* Legend */}
                <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <StatusIcon color="success">
                            <CheckCircle sx={{ fontSize: 14 }} />
                        </StatusIcon>
                        <Typography variant="caption">Present (Complete)</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <StatusIcon color="error">
                            <Cancel sx={{ fontSize: 14 }} />
                        </StatusIcon>
                        <Typography variant="caption">Absent</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <StatusIcon color="warning">
                            <Warning sx={{ fontSize: 14 }} />
                        </StatusIcon>
                        <Typography variant="caption">Incomplete</Typography>
                    </Box>
                </Box>
            </CalendarContainer>

            {/* Attendance Modal */}
            {selectedDate && (
                <AttendanceModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    selectedDate={selectedDate}
                    labours={activeLabours}
                    attendanceData={attendanceData}
                />
            )}
        </>
    );
};

export default Calendar;
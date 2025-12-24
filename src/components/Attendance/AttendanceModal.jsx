import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    TextField,
    Paper,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Skeleton,
} from "@mui/material";

import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { markAttendance, fetchMonthlyAttendance } from "../../pages/Users/Calendar/slice/calendarSlice";

const AttendanceModal = ({ open, onClose, selectedDate, labours, attendanceData }) => {

    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.calendar);

    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const dateStr = selectedDate ? selectedDate.format("YYYY-MM-DD") : "";
    const isToday = selectedDate ? selectedDate.isSame(dayjs(), "day") : false;
    const isPast = selectedDate ? selectedDate.isBefore(dayjs(), "day") : false;
    const isFuture = selectedDate ? selectedDate.isAfter(dayjs(), "day") : false;

    // Can only mark attendance for today or past dates
    const canMarkAttendance = isToday || isPast;
    const isAttendanceReady = React.useMemo(() => {
        if (!attendanceData || attendanceData.length === 0) return false;

        return attendanceData.some(
            (record) =>
                dayjs(record.date || record.attendance_date).format("YYYY-MM-DD") === dateStr
        );
    }, [attendanceData, dateStr]);

    useEffect(() => {
        if (!open || !selectedDate || labours.length === 0) return;

        // Wait until attendance data is ready
        if (!isAttendanceReady) return;

        setIsInitializing(true);
        initializeAttendanceRecords();
        setIsInitializing(false);

    }, [open, selectedDate, labours, isAttendanceReady]);

    const initializeAttendanceRecords = () => {
        const records = labours.map((labour) => {
            const existingRecord = attendanceData.find(
                (record) =>
                    record.labour_id === labour.id &&
                    dayjs(record.date).format("YYYY-MM-DD") === dateStr
            );

            if (existingRecord) {
                return {
                    labour_id: labour.id,
                    labour_name: labour.name,

                    checked: !!(existingRecord.sign_in || existingRecord.sign_out),

                    sign_in_time: existingRecord.sign_in
                        ? dayjs(`${dateStr} ${existingRecord.sign_in}`)
                        : null,

                    sign_out_time: existingRecord.sign_out
                        ? dayjs(`${dateStr} ${existingRecord.sign_out}`)
                        : null,

                    status: (existingRecord.sign_in || existingRecord.sign_out)
                        ? "present"
                        : "absent",

                    id: existingRecord.id,
                };
            }

            return {
                labour_id: labour.id,
                labour_name: labour.name,
                checked: false,
                sign_in_time: null,
                sign_out_time: null,
                status: "absent",
                id: null,
            };
        });

        setAttendanceRecords(records);
        setHasChanges(false);
    };


    const handleCheckboxChange = (labourId) => {
        setAttendanceRecords((prev) =>
            prev.map((record) =>
                record.labour_id === labourId
                    ? {
                        ...record,
                        checked: !record.checked,
                        status: !record.checked ? "present" : "absent",
                        // Clear times if marking as absent
                        sign_in_time: !record.checked ? record.sign_in_time : null,
                        sign_out_time: !record.checked ? record.sign_out_time : null,
                    }
                    : record
            )
        );
        setHasChanges(true);
    };

    const handleTimeChange = (labourId, field, value) => {
        setAttendanceRecords((prev) =>
            prev.map((record) =>
                record.labour_id === labourId
                    ? { ...record, [field]: value }
                    : record
            )
        );
        setHasChanges(true);
    };

    const handleSaveAttendance = async () => {
        try {
            // only changed / checked records
            const recordsToSave = attendanceRecords
                .filter((record) => record.checked || record.id)
                .map((record) => ({
                    labour_id: record.labour_id,
                    attendance_date: dateStr,
                    status: record.status,
                    sign_in_time: record.sign_in_time
                        ? record.sign_in_time.format("HH:mm:ss")
                        : null,
                    sign_out_time: record.sign_out_time
                        ? record.sign_out_time.format("HH:mm:ss")
                        : null,
                }));

            if (!recordsToSave.length) return;

            // SINGLE API CALL
            await dispatch(
                markAttendance({
                    attendance: recordsToSave,
                })
            ).unwrap();

            // Refresh calendar
            const month = selectedDate.month() + 1;
            const year = selectedDate.year();

            await dispatch(fetchMonthlyAttendance({ month, year }));

            setHasChanges(false);
            onClose();
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    };

    const getAttendanceStats = () => {
        const present = attendanceRecords.filter((r) => r.checked).length;
        const absent = attendanceRecords.filter((r) => !r.checked).length;
        const incomplete = attendanceRecords.filter(
            (r) => r.checked && (!r.sign_in_time || !r.sign_out_time)
        ).length;

        return { present, absent, incomplete };
    };

    const stats = getAttendanceStats();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Attendance - {selectedDate?.format("MMMM DD, YYYY")}
                    </Typography>
                    <Box display="flex" gap={1}>
                        {isInitializing ? (
                            <>
                                <Skeleton variant="rounded" width={80} height={24} />
                                <Skeleton variant="rounded" width={80} height={24} />
                                <Skeleton variant="rounded" width={100} height={24} />
                            </>
                        ) : (
                            <>
                                <Chip
                                    label={`Present: ${stats.present}`}
                                    color="success"
                                    size="small"
                                />
                                <Chip
                                    label={`Absent: ${stats.absent}`}
                                    color="error"
                                    size="small"
                                />
                                {stats.incomplete > 0 && (
                                    <Chip
                                        label={`Incomplete: ${stats.incomplete}`}
                                        color="warning"
                                        size="small"
                                    />
                                )}
                            </>
                        )}
                    </Box>
                </Box>
                {isFuture && (
                    <Typography variant="caption" color="error" display="block" mt={1}>
                        Cannot mark attendance for future dates
                    </Typography>
                )}
                {!canMarkAttendance && !isFuture && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Viewing attendance (read-only)
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent dividers>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            disabled={!canMarkAttendance}
                                            indeterminate={
                                                stats.present > 0 &&
                                                stats.present < attendanceRecords.length
                                            }
                                            checked={
                                                stats.present === attendanceRecords.length &&
                                                attendanceRecords.length > 0
                                            }
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setAttendanceRecords((prev) =>
                                                    prev.map((record) => ({
                                                        ...record,
                                                        checked,
                                                        status: checked ? "present" : "absent",
                                                        sign_in_time: checked
                                                            ? record.sign_in_time
                                                            : null,
                                                        sign_out_time: checked
                                                            ? record.sign_out_time
                                                            : null,
                                                    }))
                                                );
                                                setHasChanges(true);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>Labour Name</TableCell>
                                    <TableCell>Sign In Time</TableCell>
                                    <TableCell>Sign Out Time</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isInitializing ? (
                                    // Skeleton loading rows
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`}>
                                            <TableCell padding="checkbox">
                                                <Skeleton variant="circular" width={24} height={24} />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton variant="text" width="60%" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton variant="rectangular" height={40} />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton variant="rectangular" height={40} />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton variant="rounded" width={80} height={24} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    // Actual attendance records
                                    attendanceRecords.map((record) => (
                                        <TableRow key={record.labour_id}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={record.checked}
                                                    disabled={!canMarkAttendance}
                                                    onChange={() =>
                                                        handleCheckboxChange(record.labour_id)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {record.labour_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <TimePicker
                                                    value={record.sign_in_time}
                                                    onChange={(newValue) =>
                                                        handleTimeChange(
                                                            record.labour_id,
                                                            "sign_in_time",
                                                            newValue
                                                        )
                                                    }
                                                    disabled={!record.checked || !canMarkAttendance}
                                                    slotProps={{
                                                        textField: {
                                                            size: "small",
                                                            fullWidth: true,
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TimePicker
                                                    value={record.sign_out_time}
                                                    onChange={(newValue) =>
                                                        handleTimeChange(
                                                            record.labour_id,
                                                            "sign_out_time",
                                                            newValue
                                                        )
                                                    }
                                                    disabled={!record.checked || !canMarkAttendance}
                                                    slotProps={{
                                                        textField: {
                                                            size: "small",
                                                            fullWidth: true,
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {record.checked ? (
                                                    record.sign_in_time && record.sign_out_time ? (
                                                        <Chip
                                                            label="Complete"
                                                            color="success"
                                                            size="small"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="Incomplete"
                                                            color="warning"
                                                            size="small"
                                                        />
                                                    )
                                                ) : (
                                                    <Chip
                                                        label="Absent"
                                                        color="error"
                                                        size="small"
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </LocalizationProvider>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                {canMarkAttendance && (
                    <Button
                        onClick={handleSaveAttendance}
                        variant="contained"
                        disabled={!hasChanges || loading}
                        startIcon={loading && <CircularProgress size={16} />}
                    >
                        {loading ? "Saving..." : "Save Attendance"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AttendanceModal;
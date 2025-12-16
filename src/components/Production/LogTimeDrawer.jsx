// components/LogTimeDrawer.jsx
import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  Alert,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchActiveLabours } from "../../pages/Users/slices/labourSlice";
import {
  storeLabourLog,
  fetchLabourLogs,
} from "../../pages/Production/slice/labourLogSlice";

const formatDate = (date) => {
  if (!date) return "";

  if (typeof date === 'string') {
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      return date;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    }
    const parsed = dayjs(date);
    if (parsed.isValid()) {
      return parsed.format("DD-MM-YYYY");
    }
    return date;
  }

  return date.format ? date.format("DD-MM-YYYY") : date;
};

const parseOvertimeToMinutes = (overtime) => {
  if (!overtime || overtime.trim() === "") return 0;

  const trimmed = overtime.trim();

  // Check for decimal hours (e.g., "2.5")
  if (/^\d+\.?\d*$/.test(trimmed)) {
    const hours = parseFloat(trimmed);
    if (isNaN(hours) || hours < 0) return 0;
    return Math.round(hours * 60);
  }

  // Parse "Xh Ym" format
  const hoursMatch = trimmed.match(/(\d+)h/);
  const minutesMatch = trimmed.match(/(\d+)m/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  const totalMinutes = (hours * 60) + minutes;
  return totalMinutes >= 0 ? totalMinutes : 0;
};

const formatOvertimeDisplay = (overtimeMinutes) => {
  if (!overtimeMinutes || overtimeMinutes === 0) return "-";

  const hours = Math.floor(overtimeMinutes / 60);
  const minutes = overtimeMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export default function LogTimeDrawer({ open, onClose, product, onSuccess }) {
  const dispatch = useDispatch();
  const { activeLabours: labourData = [], loading: labourLoading } =
    useSelector((state) => state.labour);
  const { data: existingLogs = [], loading: logsLoading } = useSelector(
    (state) => state.labourLog
  );

  const [selectedLabour, setSelectedLabour] = useState(null);
  const [logDate, setLogDate] = useState(null);
  const [overtime, setOvertime] = useState("");
  const [logTimeItems, setLogTimeItems] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && product) {
      dispatch(fetchActiveLabours());
      dispatch(fetchLabourLogs(product.id));
    }
  }, [open, product, dispatch]);

  useEffect(() => {
    if (!open) {
      setLogTimeItems([]);
      setSelectedLabour(null);
      setLogDate(null);
      setOvertime("");
      setValidationError("");
    }
  }, [open]);

  useEffect(() => {
    if (validationError) {
      setValidationError("");
    }
  }, [selectedLabour, logDate, overtime]);

  const isLabourDateDuplicate = (labourId, date) => {
    const dateStr = formatDate(date);

    const duplicateInNew = logTimeItems.some(
      (item) => item.labour.id === labourId && formatDate(item.date) === dateStr
    );

    const duplicateInExisting = existingLogs.some(
      (log) => log.labour_id === labourId && formatDate(log.date) === dateStr
    );

    return duplicateInNew || duplicateInExisting;
  };

  const validateOvertimeFormat = (value) => {
    if (!value || value.trim() === "") return true;

    const trimmed = value.trim();

    return /^\d+(\.\d+)?$/.test(trimmed);
  };

  const handleAddLogTime = () => {
    setValidationError("");

    if (!selectedLabour) {
      setValidationError("Please select an employee");
      return;
    }

    if (!logDate) {
      setValidationError("Please select a date");
      return;
    }

    if (isLabourDateDuplicate(selectedLabour.id, logDate)) {
      setValidationError(
        `${selectedLabour.name} has already logged time for ${formatDate(logDate)}`
      );
      return;
    }

    if (overtime && !validateOvertimeFormat(overtime)) {
      setValidationError(
        "Invalid overtime format. Use decimal hours only (e.g., 2.5)"
      );
      return;
    }

    const overtimeMinutes = parseOvertimeToMinutes(overtime);

    const newEntry = {
      id: Date.now(),
      labour: selectedLabour,
      date: logDate,
      overtime: overtimeMinutes,
      isNew: true,
    };

    setLogTimeItems((prev) => [...prev, newEntry]);

    // Reset form
    setSelectedLabour(null);
    setLogDate(null);
    setOvertime("");
  };

  const handleDeleteLogTime = (index) => {
    setLogTimeItems((prev) => prev.filter((_, i) => i !== index));
    setOpenDelete(false);
    setDeleteIndex(null);
  };

  const handleUpdateLogTime = async () => {
    if (logTimeItems.length === 0 || !product) return;

    setSubmitting(true);
    setValidationError("");

    try {
      const formData = new FormData();
      formData.append("pp_id", product.id);

      logTimeItems.forEach((item) => {
        formData.append("labour_id[]", item.labour.id);
        formData.append("date[]", formatDate(item.date));
        formData.append("overtime[]", item.overtime || 0);
      });

      const res = await dispatch(storeLabourLog(formData));

      if (!res.error) {
        setLogTimeItems([]);
        await dispatch(fetchLabourLogs(product.id));

        if (onSuccess) {
          onSuccess();
        }

        onClose();
      } else {
        setValidationError("Failed to save labour logs. Please try again.");
      }
    } catch (error) {
      console.error("Error saving labour logs:", error);
      setValidationError("An error occurred while saving. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = labourLoading || logsLoading;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{ zIndex: 9999 }}
      >
        <Box sx={{ width: 700, p: 2 }}>
          <Typography
            variant="h6"
            fontWeight={500}
            fontSize="18px"
            marginBottom="6px"
          >
            Log Time
          </Typography>
          <Divider />

          <Box
            mt={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle1">{product?.item_name}</Typography>
            <Typography variant="subtitle1">
              {product?.group?.trim()}
            </Typography>
          </Box>

          {validationError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {validationError}
            </Alert>
          )}

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            paddingTop="15px"
            paddingBottom="10px"
            gap="10px"
            flexWrap="wrap"
          >
            {loading ? (
              <>
                <Skeleton variant="rounded" width={280} height={40} />
                <Skeleton variant="rounded" width={130} height={40} />
                <Skeleton variant="rounded" width={140} height={40} />
                <Skeleton variant="rounded" width={70} height={40} />
              </>
            ) : (
              <>
                <Autocomplete
                  disablePortal
                  options={labourData || []}
                  value={selectedLabour}
                  onChange={(e, val) => setSelectedLabour(val)}
                  getOptionLabel={(option) =>
                    option?.name
                      ? `${option.code || option.id} (${option.name})`
                      : ""
                  }
                  isOptionEqualToValue={(option, value) =>
                    value && option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Employee"
                      placeholder="Search employee"
                      size="small"
                    />
                  )}
                  sx={{ width: 280 }}
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={logDate}
                    onChange={setLogDate}
                    maxDate={dayjs()}
                    slotProps={{
                      textField: { size: "small" },
                      popper: { sx: { zIndex: 999999 } },
                    }}
                    sx={{ width: 130 }}
                  />
                </LocalizationProvider>

                <TextField
                  label="Overtime (optional)"
                  placeholder="e.g., 2.5"
                  size="small"
                  value={overtime}
                  onChange={(e) => {
                    const value = e.target.value;
                    // allow only digits and one decimal point
                    if (/^\d*\.?\d*$/.test(value)) {
                      setOvertime(value);
                    }
                  }}
                  sx={{ width: 140 }}
                  // helperText="Enter hours in decimal (e.g., 2.5)"
                  FormHelperTextProps={{ sx: { fontSize: "0.65rem", mt: 0.5 } }}
                />

                <Button
                  variant="contained"
                  sx={{ marginTop: 0 }}
                  onClick={handleAddLogTime}
                  disabled={!selectedLabour || !logDate}
                >
                  Add
                </Button>
              </>
            )}
          </Box>

          <TableContainer sx={{ mt: 4 }}>
            {loading ? (
              <>
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              </>
            ) : (
              <Table sx={{ minWidth: "100%" }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Emp Code (Emp Name)</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Overtime</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Show existing logs from server */}
                  {existingLogs.map((log) => (
                    <TableRow key={`existing-${log.id}`}>
                      <TableCell>
                        {log.labour?.code || log.labour_id}
                        <br />({log.labour?.name})
                      </TableCell>
                      <TableCell>{formatDate(log.date)}</TableCell>
                      <TableCell>{formatOvertimeDisplay(log.overtime)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          Saved
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Show newly added items */}
                  {logTimeItems.map((item, index) => (
                    <TableRow
                      key={item.id}
                      sx={{ backgroundColor: "action.hover" }}
                    >
                      <TableCell>
                        {item.labour?.code || item.labour?.id}
                        <br />({item.labour?.name})
                      </TableCell>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>{formatOvertimeDisplay(item.overtime)}</TableCell>
                      <TableCell>
                        <Tooltip title="Delete" arrow>
                          <IconButton
                            color="error"
                            onClick={() => {
                              setDeleteIndex(index);
                              setOpenDelete(true);
                            }}
                          >
                            <RiDeleteBinLine size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Empty state */}
                  {existingLogs.length === 0 && logTimeItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No log time entries
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          <Box mt={2} sx={{ display: "flex", justifyContent: "end", gap: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateLogTime}
              disabled={logTimeItems.length === 0 || submitting}
            >
              {submitting ? "Saving..." : "Update"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        sx={{ zIndex: 999999 }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>
            Are you sure you want to delete this entry? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteLogTime(deleteIndex)}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
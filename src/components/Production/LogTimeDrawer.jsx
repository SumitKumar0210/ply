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
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchActiveLabours } from "../../pages/Users/slices/labourSlice";
import {
  storeLabourLog,
  fetchLabourLogs,
} from "../../pages/Production/slice/labourLogSlice";

const formatTime = (time) => {
  if (!time) return "";
  return time.format ? time.format("HH:mm") : time;
};

const formatDate = (date) => {
  if (!date) return "";
  return date.format ? date.format("DD-MM-YYYY") : date;
};

const calculateWorkHours = (signIn, signOut) => {
  if (!signIn || !signOut) return "0h 0m";

  const diff = signOut.diff(signIn, "minute");
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

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
  const [signInTime, setSignInTime] = useState(null);
  const [signOutTime, setSignOutTime] = useState(null);
  const [logTimeItems, setLogTimeItems] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch labour data and existing logs when drawer opens
  useEffect(() => {
    if (open && product) {
      dispatch(fetchActiveLabours());
      dispatch(fetchLabourLogs(product.id));
    }
  }, [open, product, dispatch]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setLogTimeItems([]);
      setSelectedLabour(null);
      setLogDate(null);
      setSignInTime(null);
      setSignOutTime(null);
      setValidationError("");
    }
  }, [open]);

  // Clear validation error when inputs change
  useEffect(() => {
    if (validationError) {
      setValidationError("");
    }
  }, [selectedLabour, logDate, signInTime, signOutTime]);

  // Validation: Check if labour already exists for the same date
  const isLabourDateDuplicate = (labourId, date) => {
    const dateStr = formatDate(date);

    // Check in new entries (logTimeItems)
    const duplicateInNew = logTimeItems.some(
      (item) => item.labour.id === labourId && formatDate(item.date) === dateStr
    );

    // Check in existing logs from server
    const duplicateInExisting = existingLogs.some(
      (log) =>
        log.labour_id === labourId && formatDate(dayjs(log.date)) === dateStr
    );

    return duplicateInNew || duplicateInExisting;
  };

  const handleAddLogTime = () => {
    // Clear previous error
    setValidationError("");

    // Validation checks
    if (!selectedLabour) {
      setValidationError("Please select an employee");
      return;
    }

    if (!logDate) {
      setValidationError("Please select a date");
      return;
    }

    if (!signInTime) {
      setValidationError("Please select sign in time");
      return;
    }

    if (!signOutTime) {
      setValidationError("Please select sign out time");
      return;
    }

    // Validate sign out is after sign in
    if (signOutTime.isBefore(signInTime) || signOutTime.isSame(signInTime)) {
      setValidationError("Sign out time must be after sign in time");
      return;
    }

    // Check if labour already logged for this date
    if (isLabourDateDuplicate(selectedLabour.id, logDate)) {
      setValidationError(
        `${selectedLabour.name} has already logged time for ${formatDate(
          logDate
        )}`
      );
      return;
    }

    // Add new entry
    const newEntry = {
      id: Date.now(),
      labour: selectedLabour,
      date: logDate,
      signIn: signInTime,
      signOut: signOutTime,
      isNew: true, // Flag to identify newly added items
    };

    setLogTimeItems((prev) => [...prev, newEntry]);

    // Reset form
    setSelectedLabour(null);
    setLogDate(null);
    setSignInTime(null);
    setSignOutTime(null);
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
        formData.append("sign_in[]", formatTime(item.signIn));
        formData.append("sign_out[]", formatTime(item.signOut));
      });

      const res = await dispatch(storeLabourLog(formData));

      if (!res.error) {
        // Reset form
        setLogTimeItems([]);

        // Refresh data
        await dispatch(fetchLabourLogs(product.id));

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Close drawer
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
        <Box sx={{ width: 820, p: 2 }}>
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
                <Skeleton variant="rounded" width={130} height={40} />
                <Skeleton variant="rounded" width={130} height={40} />
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
                      label="Emp Code"
                      placeholder="Search Emp code"
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
                    maxDate={dayjs()} // Only allow current and past dates
                    slotProps={{
                      textField: { size: "small" },
                      popper: { sx: { zIndex: 999999 } },
                    }}
                    sx={{ width: 130 }}
                  />
                  <TimePicker
                    label="Sign In"
                    value={signInTime}
                    onChange={setSignInTime}
                    slotProps={{
                      textField: { size: "small" },
                      popper: { sx: { zIndex: 999999 } },
                    }}
                    sx={{ width: 130 }}
                  />
                  <TimePicker
                    label="Sign Out"
                    value={signOutTime}
                    onChange={setSignOutTime}
                    slotProps={{
                      textField: { size: "small" },
                      popper: { sx: { zIndex: 999999 } },
                    }}
                    sx={{ width: 130 }}
                  />
                </LocalizationProvider>
                <Button
                  variant="contained"
                  sx={{ marginTop: 0 }}
                  onClick={handleAddLogTime}
                  disabled={
                    !selectedLabour || !logDate || !signInTime || !signOutTime
                  }
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
                    <TableCell>
                      Emp ID
                      <br />
                      (Emp Name)
                    </TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Sign In</TableCell>
                    <TableCell>Sign Out</TableCell>
                    <TableCell>Total Hours</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Show existing logs from server (no delete button) */}
                  {existingLogs.map((log) => (
                    <TableRow key={`existing-${log.id}`}>
                      <TableCell>
                        {log.labour?.code || log.labour_id}
                        <br />({log.labour?.name})
                      </TableCell>
                      <TableCell>{formatDate(log?.date)}</TableCell>
                      <TableCell>{log.sign_in}</TableCell>
                      <TableCell>{log.sign_out}</TableCell>
                      <TableCell>
                        {log.total_hours ||
                          calculateWorkHours(
                            dayjs(log.sign_in, "HH:mm"),
                            dayjs(log.sign_out, "HH:mm")
                          )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          Saved
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Show newly added items (with delete button) */}
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
                      <TableCell>{formatTime(item.signIn)}</TableCell>
                      <TableCell>{formatTime(item.signOut)}</TableCell>
                      <TableCell>
                        {calculateWorkHours(item.signIn, item.signOut)}
                      </TableCell>
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
                      <TableCell colSpan={6} align="center">
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

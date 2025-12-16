import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Skeleton,
  CircularProgress,
  DialogContentText,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";

import {
  addWorkShift,
  fetchWorkShifts,
  statusUpdate,
  deleteWorkShift,
  updateWorkShift,
} from "../slices/workshiftslice";

import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../../context/AuthContext";

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: "center", color: "red" }}>
          <Typography variant="h6">Something went wrong.</Typography>
          <Typography variant="body2">{this.state.error?.message}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

const WorkShift = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const dispatch = useDispatch();

  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Shift name must be at least 2 characters")
      .required("Shift name is required"),
    start_time: Yup.string()
      .required("Start time is required")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    end_time: Yup.string()
      .required("End time is required")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    break_minutes: Yup.number()
      .min(0, "Break minutes cannot be negative")
      .required("Break minutes is required"),
  });

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAdd = async (value, resetForm) => {
    setIsSaving(true);
    const res = await dispatch(addWorkShift(value));
    setIsSaving(false);
    if (res.error) return;
    resetForm();
    handleClose();
  };

  // Delete
  const handleDelete = async (id) => {
    setIsDeleting(true);
    await dispatch(deleteWorkShift(id));
    setIsDeleting(false);
    setOpenDelete(false);
    setDeleteRow(null);
  };

  const { data: workShiftData = [], loading } = useSelector(
    (state) => state.workShift
  );

  useEffect(() => {
    dispatch(fetchWorkShifts());
  }, [dispatch]);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Open modal with row data
  const handleUpdate = (row) => {
    setEditData(row);
    setEditOpen(true);
  };

  // Close modal
  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  // Update dispatch
  const handleEditSubmit = async (values, resetForm) => {
    setIsEditSaving(true);
    try {
      const res = await dispatch(
        updateWorkShift({
          id: editData.id,
          ...values,
        })
      );
      setIsEditSaving(false);
      if (res.error) {
        console.log("Update failed:", res.payload);
        alert("Update failed: " + res.payload);
        return;
      }
      resetForm();
      handleEditClose();
    } catch (err) {
      setIsEditSaving(false);
      console.error("Update failed:", err);
    }
  };

  const canUpdate = useMemo(
    () => hasPermission("working_shifts.update"),
    [hasPermission]
  );

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "name",
        header: "Shift Name",
        Cell: ({ cell }) =>
          loading ? <Skeleton variant="text" width="80%" /> : cell.getValue(),
      },
      {
        accessorKey: "start_time",
        header: "Start Time",
        Cell: ({ cell }) =>
          loading ? <Skeleton variant="text" width="60%" /> : cell.getValue(),
      },
      {
        accessorKey: "end_time",
        header: "End Time",
        Cell: ({ cell }) =>
          loading ? <Skeleton variant="text" width="60%" /> : cell.getValue(),
      },
      {
        accessorKey: "break_minutes",
        header: "Break (Minutes)",
        Cell: ({ cell }) =>
          loading ? (
            <Skeleton variant="text" width="50%" />
          ) : (
            cell.getValue() || 0
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          if (loading)
            return <Skeleton variant="circular" width={40} height={20} />;

          return (
            <CustomSwitch
              checked={!!row.original.status}
              disabled={!canUpdate}
              onChange={(e) => {
                if (!canUpdate) return;
                const newStatus = e.target.checked ? 1 : 0;
                dispatch(statusUpdate({ ...row.original, status: newStatus }));
              }}
            />
          );
        },
      },
    ];

    if (hasAnyPermission?.(["working_shifts.delete", "working_shifts.update"])) {
      baseColumns.push({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width={80} />;

          return (
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              {hasPermission("working_shifts.update") && (
                <Tooltip title="Edit">
                  <IconButton
                    color="primary"
                    onClick={() => handleUpdate(row.original)}
                  >
                    <BiSolidEditAlt size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {hasPermission("working_shifts.delete") && (
                <Tooltip title="Delete">
                  <IconButton
                    color="error"
                    onClick={() => {
                      setOpenDelete(true);
                      setDeleteRow(row.original);
                    }}
                  >
                    <RiDeleteBinLine size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      });
    }

    return baseColumns;
  }, [dispatch, loading, canUpdate, hasPermission, hasAnyPermission]);

  // Function to download CSV from data
  const downloadCSV = () => {
    const headers = [
      "Shift Name",
      "Start Time",
      "End Time",
      "Break Minutes",
      "Status",
    ];

    const rows = workShiftData.map((row) => [
      `"${row.name ?? ""}"`,
      `"${row.start_time ?? ""}"`,
      `"${row.end_time ?? ""}"`,
      `"${row.break_minutes ?? 0}"`,
      `"${row.status ? "Active" : "Inactive"}"`,
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "working_shifts_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print handler
  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff" }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={workShiftData}
              getRowId={(row) => row.id}
              state={{
                isLoading: loading,
                showLoadingOverlay: loading,
              }}
              enableTopToolbar
              enableColumnFilters
              enableSorting
              enablePagination
              enableBottomToolbar
              enableGlobalFilter
              enableDensityToggle={false}
              enableColumnActions={false}
              enableColumnVisibilityToggle={false}
              initialState={{ density: "compact" }}
              muiTableContainerProps={{
                sx: { width: "100%", backgroundColor: "#fff" },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff" },
              }}
              renderTopToolbar={({ table }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    p: 1,
                  }}
                >
                  <Typography variant="h6" className="page-title">
                    Work Shifts
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />
                    <MRT_ToolbarInternalButtons table={table} />

                    <Tooltip title="Print">
                      <IconButton color="default" onClick={handlePrint}>
                        <FiPrinter size={20} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Download CSV">
                      <IconButton color="default" onClick={downloadCSV}>
                        <BsCloudDownload size={20} />
                      </IconButton>
                    </Tooltip>

                    {hasPermission("working_shifts.create") && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleClickOpen}
                      >
                        Add Shift
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add Modal */}
      <BootstrapDialog onClose={handleClose} open={open} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add Work Shift</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{
            name: "",
            start_time: "",
            end_time: "",
            break_minutes: 0,
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm }) => {
            await handleAdd(values, resetForm);
          }}
        >
          {({ values, errors, touched, handleChange, setFieldValue }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Shift Name"
                      size="small"
                      value={values.name}
                      onChange={handleChange}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        label="Start Time"
                        value={values.start_time ? dayjs(values.start_time, "HH:mm") : null}
                        onChange={(newValue) => {
                          setFieldValue("start_time", newValue ? newValue.format("HH:mm") : "");
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            error: touched.start_time && Boolean(errors.start_time),
                            helperText: touched.start_time && errors.start_time,
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        label="End Time"
                        value={values.end_time ? dayjs(values.end_time, "HH:mm") : null}
                        onChange={(newValue) => {
                          setFieldValue("end_time", newValue ? newValue.format("HH:mm") : "");
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            error: touched.end_time && Boolean(errors.end_time),
                            helperText: touched.end_time && errors.end_time,
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      id="break_minutes"
                      name="break_minutes"
                      label="Break Minutes"
                      type="number"
                      size="small"
                      value={values.break_minutes}
                      onChange={handleChange}
                      error={
                        touched.break_minutes && Boolean(errors.break_minutes)
                      }
                      helperText={touched.break_minutes && errors.break_minutes}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClose}
                  disabled={isSaving}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSaving}
                  startIcon={
                    isSaving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : null
                  }
                >
                  {isSaving ? "Saving..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Modal */}
      <BootstrapDialog
        onClose={handleEditClose}
        open={editOpen}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit Work Shift</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleEditClose}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{
            name: editData?.name || "",
            start_time: editData?.start_time || "",
            end_time: editData?.end_time || "",
            break_minutes: editData?.break_minutes || 0,
          }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={(values, { resetForm }) =>
            handleEditSubmit(values, resetForm)
          }
        >
          {({ values, errors, touched, handleChange, setFieldValue }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      id="edit_name"
                      name="name"
                      label="Shift Name"
                      size="small"
                      value={values.name}
                      onChange={handleChange}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        label="Start Time"
                        value={values.start_time ? dayjs(values.start_time, "HH:mm") : null}
                        onChange={(newValue) => {
                          setFieldValue("start_time", newValue ? newValue.format("HH:mm") : "");
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            error: touched.start_time && Boolean(errors.start_time),
                            helperText: touched.start_time && errors.start_time,
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        label="End Time"
                        value={values.end_time ? dayjs(values.end_time, "HH:mm") : null}
                        onChange={(newValue) => {
                          setFieldValue("end_time", newValue ? newValue.format("HH:mm") : "");
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            error: touched.end_time && Boolean(errors.end_time),
                            helperText: touched.end_time && errors.end_time,
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      id="edit_break_minutes"
                      name="break_minutes"
                      label="Break Minutes"
                      type="number"
                      size="small"
                      value={values.break_minutes}
                      onChange={handleChange}
                      error={
                        touched.break_minutes && Boolean(errors.break_minutes)
                      }
                      helperText={touched.break_minutes && errors.break_minutes}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleEditClose}
                  disabled={isEditSaving}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isEditSaving}
                  startIcon={
                    isEditSaving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : null
                  }
                >
                  {isEditSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Delete Modal */}
      <Dialog
        open={openDelete}
        onClose={() => !isDeleting && setOpenDelete(false)}
      >
        <DialogTitle>{"Delete this work shift?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteRow?.id)}
            variant="contained"
            color="error"
            autoFocus
            disabled={isDeleting}
            startIcon={
              isDeleting ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </ErrorBoundary>
  );
};

export default WorkShift;
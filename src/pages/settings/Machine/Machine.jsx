import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
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
import { useDispatch, useSelector } from "react-redux";
import {
  addMachine,
  fetchMachines,
  deleteMachine,
  updateMachine,
  statusUpdate
} from "../slices/machineSlice";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

// Enhanced validation schema with better rules
const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Machine name must be at least 2 characters")
    .max(100, "Machine name must not exceed 100 characters")
    .required("Machine name is required"),
  run_hours_at_service: Yup.number()
    .typeError("Please enter a valid number")
    .positive("Run hours must be positive")
    .integer("Run hours must be a whole number")
    .min(1, "Run hours must be at least 1")
    .max(100000, "Run hours cannot exceed 100,000")
    .required("Run hours at service are required"),
  service_interval_days: Yup.number()
    .typeError("Please enter a valid number")
    .positive("Service interval must be positive")
    .integer("Service interval must be a whole number")
    .min(1, "Service interval must be at least 1 day")
    .max(365, "Service interval cannot exceed 365 days")
    .required("Service interval days are required"),
  service_cycle_months: Yup.number()
    .typeError("Please enter a valid number")
    .positive("Service cycle must be positive")
    .integer("Service cycle must be a whole number")
    .min(1, "Service cycle must be at least 1 month")
    .max(60, "Service cycle cannot exceed 60 months")
    .required("Service cycle months are required"),
  message: Yup.string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(500, "Message must not exceed 500 characters")
    .required("Message is required"),
});

const INITIAL_VALUES = {
  name: "",
  run_hours_at_service: "",
  service_interval_days: "",
  service_cycle_months: "",
  message: "",
};

const Machine = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: machines = [], loading } = useSelector((state) => state.machine);

  useEffect(() => {
    dispatch(fetchMachines());
  }, [dispatch]);

  const handleClose = useCallback(() => setOpen(false), []);
  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditData(null);
  }, []);

  const handleAdd = useCallback(async (values, { resetForm }) => {
    setIsSaving(true);
    try {
      const res = await dispatch(addMachine(values));
      if (!res.error) {
        resetForm();
        handleClose();
      }
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, handleClose]);

  const handleDeleteClick = useCallback((row) => {
    setDeleteData(row);
    setOpenDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData?.id) return;
    
    setIsDeleting(true);
    try {
      await dispatch(deleteMachine(deleteData.id));
      setOpenDelete(false);
      setDeleteData(null);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, deleteData]);

  const handleUpdate = useCallback((row) => {
    setEditData(row);
    setEditOpen(true);
  }, []);

  const handleEditSubmit = useCallback(async (values, { resetForm }) => {
    if (!editData?.id) return;
    
    setIsSaving(true);
    try {
      const res = await dispatch(updateMachine({ id: editData.id, ...values }));
      if (!res.error) {
        resetForm();
        handleEditClose();
      }
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, editData, handleEditClose]);

  const handleStatusToggle = useCallback((row, checked) => {
    const newStatus = checked ? 1 : 0;
    dispatch(statusUpdate({ ...row, status: newStatus }));
  }, [dispatch]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Machine Name",
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="80%" /> : cell.getValue(),
      },
      {
        accessorKey: "run_hours_at_service",
        header: "Run Hours at Service",
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="60%" /> : cell.getValue(),
      },
      {
        accessorKey: "service_interval_days",
        header: "Service Interval (Days)",
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="60%" /> : cell.getValue(),
      },
      {
        accessorKey: "service_cycle_months",
        header: "Service Cycle (Months)",
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="60%" /> : cell.getValue(),
      },
      {
        accessorKey: "message",
        header: "Service Message",
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="70%" /> : cell.getValue(),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="circular" width={40} height={20} />;

          return (
            <CustomSwitch
              checked={!!row.original.status}
              onChange={(e) => handleStatusToggle(row.original, e.target.checked)}
            />
          );
        },
      },
      {
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
              <Tooltip title="Edit Machine">
                <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                  <BiSolidEditAlt size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Machine">
                <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [loading, handleStatusToggle, handleUpdate, handleDeleteClick]
  );

  const downloadCSV = useCallback(() => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);

    const rows = machines.map((row) =>
      columns
        .filter((col) => col.accessorKey)
        .map((col) => `"${row[col.accessorKey] ?? ""}"`)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Machine_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, machines]);

  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  }, []);

  const FormFields = useCallback(({ values, errors, touched, handleChange, handleBlur }) => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          id="name"
          name="name"
          label="Machine Name"
          size="small"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && Boolean(errors.name)}
          helperText={touched.name && errors.name}
          sx={{ mb: 3 }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          id="run_hours_at_service"
          name="run_hours_at_service"
          label="Run Hours at Service"
          size="small"
          type="number"
          value={values.run_hours_at_service}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.run_hours_at_service && Boolean(errors.run_hours_at_service)}
          helperText={touched.run_hours_at_service && errors.run_hours_at_service}
          sx={{ mb: 3 }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          id="service_interval_days"
          name="service_interval_days"
          label="Service Interval (Days)"
          size="small"
          type="number"
          value={values.service_interval_days}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.service_interval_days && Boolean(errors.service_interval_days)}
          helperText={touched.service_interval_days && errors.service_interval_days}
          sx={{ mb: 3 }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          id="service_cycle_months"
          name="service_cycle_months"
          label="Service Cycle (Months)"
          size="small"
          type="number"
          value={values.service_cycle_months}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.service_cycle_months && Boolean(errors.service_cycle_months)}
          helperText={touched.service_cycle_months && errors.service_cycle_months}
          sx={{ mb: 3 }}
        />
      </Grid>
      <Grid size={12}>
        <TextField
          fullWidth
          id="message"
          name="message"
          label="Service Message"
          size="small"
          multiline
          rows={3}
          value={values.message}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.message && Boolean(errors.message)}
          helperText={touched.message && errors.message}
          sx={{ mb: 3 }}
        />
      </Grid>
    </Grid>
  ), []);

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff" }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={machines}
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
              muiTableContainerProps={{ sx: { width: "100%", backgroundColor: "#fff" } }}
              muiTablePaperProps={{ sx: { backgroundColor: "#fff" } }}
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
                   <Typography variant="h6" className='page-title'>
                    Machine Management
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />
                    <MRT_ToolbarInternalButtons table={table} />
                    <Tooltip title="Print Table">
                      <IconButton onClick={handlePrint}>
                        <FiPrinter size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download as CSV">
                      <IconButton onClick={downloadCSV}>
                        <BsCloudDownload size={20} />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpen(true)}
                    >
                      Add Machine
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add Machine Modal */}
      <BootstrapDialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add New Machine</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={isSaving}
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
          initialValues={INITIAL_VALUES}
          validationSchema={validationSchema}
          onSubmit={handleAdd}
        >
          {(formikProps) => (
            <Form>
              <DialogContent dividers>
                <FormFields {...formikProps} />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  disabled={isSaving || !formikProps.isValid}
                  startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {isSaving ? "Saving..." : "Add Machine"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Machine Modal */}
      <BootstrapDialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit Machine</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleEditClose}
          disabled={isSaving}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        {editData && (
          <Formik
            initialValues={{
              name: editData.name || "",
              run_hours_at_service: editData.run_hours_at_service || "",
              service_interval_days: editData.service_interval_days || editData.cycle_days || "",
              service_cycle_months: editData.service_cycle_months || editData.cycle_month || "",
              message: editData.message || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleEditSubmit}
          >
            {(formikProps) => (
              <Form>
                <DialogContent dividers>
                  <FormFields {...formikProps} />
                </DialogContent>
                <DialogActions sx={{ gap: 1, mb: 1 }}>
                  <Button variant="outlined" color="error" onClick={handleEditClose} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={isSaving || !formikProps.isValid}
                    startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        )}
      </BootstrapDialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)}>
        <DialogTitle>Delete Machine?</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteData?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            autoFocus
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Machine;
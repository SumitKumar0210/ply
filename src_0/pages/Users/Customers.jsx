import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import CustomSwitch from "../../components/CustomSwitch/CustomSwitch";

import { useDispatch, useSelector } from "react-redux";
import {
  addCustomer,
  fetchCustomers,
  statusUpdate,
  updateCustomer,
  deleteCustomer,
} from "../Users/slices/customerSlice";
import { fetchStates } from "../settings/slices/stateSlice";

// Styled Dialog
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

function BootstrapDialogTitle({ children, onClose, ...other }) {
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>
  );
}

// GST validation regex: 2 digits (state code) + 10 alphanumeric + 1 alphabet + 1 digit + 1 alphabet + 1 alphanumeric
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .required("Name is required"),
  mobile: Yup.string()
    .matches(/^[6-9][0-9]{9}$/, "Enter valid 10-digit mobile number")
    .required("Mobile is required"),
  email: Yup.string()
    .email("Invalid email format")
    .max(100, "Email cannot exceed 100 characters")
    .required("E-mail is required"),
  address: Yup.string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address cannot exceed 200 characters")
    .required("Address is required"),
  alternate_mobile: Yup.string()
    .matches(/^[6-9][0-9]{9}$/, "Enter valid 10-digit mobile number")
    .notOneOf([Yup.ref('mobile')], "Alternate mobile must be different from primary mobile")
    .nullable(),
  city: Yup.string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City cannot exceed 50 characters")
    .required("City is required"),
  state_id: Yup.string().required("State is required"),
  zip_code: Yup.string()
    .matches(/^[1-9][0-9]{5}$/, "Enter valid 6-digit PIN code")
    .required("PIN code is required"),
  gst_no: Yup.string()
    .matches(GST_REGEX, "Enter valid GST number (e.g., 22AAAAA0000A1Z5)")
    .uppercase()
    .nullable()
    .transform((value) => value ? value.toUpperCase() : null),
  note: Yup.string().max(500, "Note cannot exceed 500 characters"),
});

// Initial form values
const getInitialValues = (data = null) => ({
  name: data?.name || "",
  mobile: data?.mobile || "",
  email: data?.email || "",
  address: data?.address || "",
  alternate_mobile: data?.alternate_mobile || "",
  city: data?.city || "",
  state_id: data?.state_id || "",
  zip_code: data?.zip_code || "",
  gst_no: data?.gst_no || "",
  note: data?.note || "",
});

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
    loading: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const tableContainerRef = useRef(null);

  const { data: customerData = [], loading, totalCount = 0 } = useSelector(
    (state) => state.customer
  );
  const { data: states = [] } = useSelector((state) => state.state);

  const dispatch = useDispatch();

  // Fetch customers with pagination
  useEffect(() => {
    dispatch(
      fetchCustomers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize]);

  // Fetch states once on mount
  useEffect(() => {
    dispatch(fetchStates());
  }, [dispatch]);

  // Handle add customer
  const handleAdd = useCallback(async (values, { resetForm }) => {
    try {
      const res = await dispatch(addCustomer(values));
      if (res.error) return;
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Add customer failed:", error);
    }
  }, [dispatch]);

  // Handle delete click
  const handleDeleteClick = useCallback((row) => {
    setDeleteDialog({
      open: true,
      id: row.id,
      name: row.name,
      loading: false,
    });
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.id) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await dispatch(deleteCustomer(deleteDialog.id)).unwrap();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteDialog({ open: false, id: null, name: "", loading: false });
    }
  }, [deleteDialog.id, dispatch]);

  // Handle update click
  const handleUpdate = useCallback((row) => {
    setEditData(row);
    setEditOpen(true);
  }, []);

  // Handle edit close
  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditData(null);
  }, []);

  // Handle edit submit
  const handleEditSubmit = useCallback(async (values, { resetForm }) => {
    const res = await dispatch(
      updateCustomer({ updated: { id: editData.id, ...values } })
    );
    if (res.error) return;
    resetForm();
    handleEditClose();
  }, [dispatch, editData, handleEditClose]);

  // Handle status change
  const handleStatusChange = useCallback((row, checked) => {
    const newStatus = checked ? 1 : 0;
    dispatch(statusUpdate({ ...row, status: newStatus }));
  }, [dispatch]);

  // Table Columns
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name", size: 150 },
      { accessorKey: "mobile", header: "Mobile", size: 120 },
      { accessorKey: "email", header: "E-mail", size: 180 },
      { accessorKey: "gst_no", header: "GST No.", size: 150 },
      { accessorKey: "address", header: "Address", size: 200 },
      { accessorKey: "city", header: "City", size: 100 },
      {
        accessorKey: "state_id",
        header: "State",
        size: 100,
        Cell: ({ row }) => row.original.state?.name || "N/A",
      },
      { accessorKey: "zip_code", header: "PIN", size: 80 },
      { accessorKey: "note", header: "Note", size: 150 },
      {
        accessorKey: "status",
        header: "Status",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => handleStatusChange(row.original, e.target.checked)}
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 100,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => handleUpdate(row.original)}
                size="small"
              >
                <BiSolidEditAlt size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => handleDeleteClick(row.original)}
                size="small"
              >
                <RiDeleteBinLine size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleStatusChange, handleUpdate, handleDeleteClick]
  );

  // CSV export
  const downloadCSV = useCallback(() => {
    const headers = columns
      .filter((col) => col.accessorKey && col.id !== "actions")
      .map((col) => col.header);
    const rows = customerData.map((row) =>
      columns
        .filter((col) => col.accessorKey && col.id !== "actions")
        .map((col) => {
          let value = row[col.accessorKey];
          if (col.accessorKey === "state_id") {
            value = row.state?.name || "N/A";
          }
          return `"${value ?? ""}"`;
        })
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, customerData]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  }, []);

  // Close delete dialog
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, id: null, name: "", loading: false });
  }, []);

  return (
    <>
      {/* Header */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Customer
        </Button>
      </Grid>

      {/* Table */}
      <Grid size={12}>
        <Paper
          elevation={0}
          ref={tableContainerRef}
          sx={{
            width: "100%",
            overflow: "hidden",
            backgroundColor: "#fff",
            px: 2,
            py: 1,
          }}
        >
          <MaterialReactTable
            columns={columns}
            data={customerData}
            getRowId={(row) => row.id}
            rowCount={totalCount}
            manualPagination
            onPaginationChange={setPagination}
            state={{
              isLoading: loading,
              pagination,
            }}
            enableTopToolbar
            enableColumnFilters
            enableSorting
            enablePagination
            enableBottomToolbar
            enableGlobalFilter
            enableDensityToggle={false}
            enableColumnActions={false}
            enableFullScreenToggle={false}
            initialState={{ density: "compact" }}
            muiTableContainerProps={{
              sx: {
                width: "100%",
                backgroundColor: "#fff",
                overflowX: "auto",
              },
            }}
            muiTableBodyCellProps={{
              sx: { whiteSpace: "nowrap" },
            }}
            muiTablePaperProps={{ sx: { backgroundColor: "#fff", boxShadow: "none" } }}
            muiTableBodyRowProps={{ hover: true }}
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
                  Customers
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />
                  <MRT_ToolbarInternalButtons table={table} />
                  <Tooltip title="Print">
                    <IconButton onClick={handlePrint}>
                      <FiPrinter size={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download CSV">
                    <IconButton onClick={downloadCSV}>
                      <BsCloudDownload size={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          />
        </Paper>
      </Grid>

      {/* Add Customer Modal */}
      <CustomerFormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add Customer"
        initialValues={getInitialValues()}
        onSubmit={handleAdd}
        states={states}
      />

      {/* Edit Customer Modal */}
      <CustomerFormDialog
        open={editOpen}
        onClose={handleEditClose}
        title="Edit Customer"
        initialValues={getInitialValues(editData)}
        onSubmit={handleEditSubmit}
        states={states}
        isEdit
      />

      {/* Delete Modal */}
      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog} maxWidth="xs">
        <DialogTitle>Delete Customer?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete customer{" "}
            <strong>{deleteDialog.name}</strong>?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteDialog.loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteDialog.loading}
          >
            {deleteDialog.loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Reusable Customer Form Dialog Component
const CustomerFormDialog = ({ open, onClose, title, initialValues, onSubmit, states, isEdit = false }) => {
  return (
    <BootstrapDialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <BootstrapDialogTitle onClose={onClose}>{title}</BootstrapDialogTitle>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ handleChange, handleSubmit, values, touched, errors, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            <DialogContent dividers>
              <Grid container rowSpacing={2} columnSpacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="name"
                    label="Name"
                    fullWidth
                    size="small"
                    onChange={handleChange}
                    value={values.name}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="mobile"
                    label="Mobile"
                    fullWidth
                    size="small"
                    onChange={handleChange}
                    value={values.mobile}
                    error={touched.mobile && Boolean(errors.mobile)}
                    helperText={touched.mobile && errors.mobile}
                    inputProps={{ maxLength: 10 }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="alternate_mobile"
                    label="Alternate Mobile"
                    fullWidth
                    size="small"
                    value={values.alternate_mobile}
                    onChange={handleChange}
                    error={touched.alternate_mobile && Boolean(errors.alternate_mobile)}
                    helperText={touched.alternate_mobile && errors.alternate_mobile}
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="email"
                    label="E-mail"
                    fullWidth
                    size="small"
                    onChange={handleChange}
                    value={values.email}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="gst_no"
                    label="GST Number (Optional)"
                    fullWidth
                    size="small"
                    value={values.gst_no}
                    onChange={(e) => setFieldValue("gst_no", e.target.value.toUpperCase())}
                    error={touched.gst_no && Boolean(errors.gst_no)}
                    helperText={touched.gst_no && errors.gst_no}
                    placeholder="22AAAAA0000A1Z5"
                    inputProps={{ maxLength: 15, style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="state_id"
                    label="State"
                    select
                    fullWidth
                    size="small"
                    value={values.state_id}
                    onChange={handleChange}
                    error={touched.state_id && Boolean(errors.state_id)}
                    helperText={touched.state_id && errors.state_id}
                    required
                  >
                    <MenuItem value="">Select State</MenuItem>
                    {states.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="city"
                    label="City"
                    fullWidth
                    size="small"
                    value={values.city}
                    onChange={handleChange}
                    error={touched.city && Boolean(errors.city)}
                    helperText={touched.city && errors.city}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="zip_code"
                    label="PIN Code"
                    fullWidth
                    size="small"
                    value={values.zip_code}
                    onChange={handleChange}
                    error={touched.zip_code && Boolean(errors.zip_code)}
                    helperText={touched.zip_code && errors.zip_code}
                    inputProps={{ maxLength: 6 }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="address"
                    label="Address"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={values.address}
                    onChange={handleChange}
                    error={touched.address && Boolean(errors.address)}
                    helperText={touched.address && errors.address}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="note"
                    label="Note"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={values.note}
                    onChange={handleChange}
                    error={touched.note && Boolean(errors.note)}
                    helperText={touched.note && errors.note}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} variant="outlined" color="error">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {isEdit ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </BootstrapDialog>
  );
};

export default Customers;
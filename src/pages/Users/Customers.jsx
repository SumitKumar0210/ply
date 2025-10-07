import React, { useMemo, useState, useRef, useEffect } from "react";
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
import { addCustomer, fetchCustomers, statusUpdate, updateCustomer, deleteCustomer } from "../Users/slices/customerSlice";
import { fetchStates } from "../settings/slices/stateSlice";

// ✅ Styled Dialog
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

function BootstrapDialogTitle(props) {
  const { children, onClose, ...other } = props;
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

// ✅ Dropdown options for states
// const states = [
//   { value: "Bihar", label: "Bihar" },
//   { value: "Delhi", label: "Delhi" },
//   { value: "Maharashtra", label: "Maharashtra" },
//   { value: "Karnataka", label: "Karnataka" },
// ];

// ✅ Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile must be 10 digits")
    .required("Mobile is required"),
  email: Yup.string().email("Invalid email format").required("E-mail is required"),
  address: Yup.string().required("Address is required"),
  alternate_mobile: Yup.string().matches(/^[0-9]{10}$/, "Alternate Mobile must be 10 digits"),
  city: Yup.string().required("City is required"),
  state_id: Yup.string().required("State is required"),
  zip_code: Yup.string().matches(/^[0-9]{6}$/, "ZIP must be 6 digits").required("ZIP code is required"),
  note: Yup.string(),
});

// ✅ Initial Customers
const customersList = [
  {
    id: 1,
    name: "Customer One",
    mobile: "9876543210",
    email: "customer1@gmail.com",
    address: "Patna",
    city: "Patna",
    state: "Bihar",
    zip: "800001",
    note: "First customer",
    status: true,
  }
];

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
    loading: false,
  });
  const [tableData, setTableData] = useState(customersList);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const tableContainerRef = useRef(null);


  const { data: customerData = [], loading, error } = useSelector((state) => state.customer);
  const { data: states = []} = useSelector((state) => state.state);

  const dispatch = useDispatch();
  
  
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStates());
  }, [open, editOpen]);

  const handleAdd = async (values, resetForm) => {
    try {
      await dispatch(addCustomer(values));
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Add customer failed:", error);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      id: row.id,
      name: row.name, // 👈 Pass customer name here
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await dispatch(deleteCustomer(deleteDialog.id)).unwrap(); 
      // ✅ If API returns success, close modal
    } catch (error) {
      console.error("Delete failed:", error);
      // show snackbar/toast error
    } finally {
      setDeleteDialog({ open: false, id: null, name: "", loading: false });
    }
  };
  
  const handleUpdate = (row) => {
    setEditData(row);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };
  const handleEditSubmit = async (values, resetForm) => {
    
    await dispatch(updateCustomer({updated :{ id: editData.id, ...values }}));
    resetForm();
    handleEditClose();
  };

  // ✅ Table Columns
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "mobile", header: "Mobile", size: 70  },
      { accessorKey: "email", header: "E-mail" },
      { accessorKey: "address", header: "Address" },
      { accessorKey: "city", header: "City", size: 50 },
      { accessorKey: "state_id", header: "State", size: 50, Cell: ({ row }) => row.original.state?.state || "", },
      { accessorKey: "zip_code", header: "ZIP", size: 50 },
      { accessorKey: "note", header: "Note" },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => {
              const newStatus = e.target.checked ? 1 : 0;
              dispatch(statusUpdate({ ...row.original, status: newStatus }));
            }}
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 80,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => handleUpdate(row.original)}
              >
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => handleDeleteClick(row.original)}
              >
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  );
// ✅ CSV export using tableData
  const downloadCSV = () => {
    const headers = columns
      .filter((col) => col.accessorKey && col.accessorKey !== "action")
      .map((col) => col.header);
    const rows = customerData.map((row) =>
      columns
        .filter((col) => col.accessorKey && col.accessorKey !== "action")
        .map((col) => `"${row[col.accessorKey] ?? ""}"`)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ Print handler
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
    <>
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
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
          sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff", px: 2, py: 1 }}
        >
          <MaterialReactTable
            columns={columns}
            data={customerData}
            getRowId={(row) => row.id}
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
              sx: { width: "100%", backgroundColor: "#fff", overflowX: "hidden", minWidth: "1200px" },
            }}
            muiTableBodyCellProps={{ sx: { whiteSpace: "wrap", width: "100px" } }}
            muiTablePaperProps={{ sx: { backgroundColor: "#fff", boxShadow: "none" } }}
            muiTableBodyRowProps={() => ({
              hover: false,
            })}
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
                <Typography variant="h6" fontWeight={400}>
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
      <BootstrapDialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setOpen(false)}>
          Add Customer
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: "",
            mobile: "",
            email: "",
            address: "",
            alternate_mobile: "",
            city: "",
            state_id: "",
            zip_code: "",
            note: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            handleAdd(values, resetForm)
          }}
        >
          {({ handleChange, handleSubmit, values, touched, errors }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <Grid container  rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="name"
                      label="Name"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      onChange={handleChange}
                      value={values.name}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="mobile"
                      label="Mobile"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      onChange={handleChange}
                      value={values.mobile}
                      error={touched.mobile && Boolean(errors.mobile)}
                      helperText={touched.mobile && errors.mobile}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="alternate_mobile"
                      label="Alternate Mobile"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.alternate_mobile}
                      onChange={handleChange}
                      error={touched.alternate_mobile && Boolean(errors.alternate_mobile)}
                      helperText={touched.alternate_mobile && errors.alternate_mobile}
                    /> 
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="email"
                      label="E-mail"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      onChange={handleChange}
                      value={values.email}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="address"
                      label="Address"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.address}
                      onChange={handleChange}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="city"
                      label="City"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.city}
                      onChange={handleChange}
                      error={touched.city && Boolean(errors.city)}
                      helperText={touched.city && errors.city}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="state_id"
                      label="State"
                      select
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.state_id}
                      onChange={handleChange}
                      error={touched.state_id && Boolean(errors.state_id)}
                      helperText={touched.state_id && errors.state_id}
                    >
                      {states.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.state}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="zip_code"
                      label="ZIP Code"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.zip_code}
                      onChange={handleChange}
                      error={touched.zip_code && Boolean(errors.zip_code)}
                      helperText={touched.zip_code && errors.zip_code}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      name="note"
                      label="Note"
                      fullWidth
                      multiline
                      rows={3}
                      margin="dense"
                      variant="standard"
                      value={values.note}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpen(false)} variant="outlined" color="error">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Submit
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Customer Modal */}
      <BootstrapDialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setEditOpen(false)}>
          Edit Customer
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: editData?.name || "",
            mobile: editData?.mobile || "",
            email: editData?.email || "",
            address: editData?.address || "",
            alternate_mobile: editData?.alternate_mobile || "",
            city: editData?.city || "",
            state_id: editData?.state_id || "",
            zip_code: editData?.zip_code || "",
            note: editData?.note || "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            handleEditSubmit(values, resetForm)
          }}
        >
          {({ handleChange, handleSubmit, values, touched, errors }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <Grid container  rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="name"
                      label="Name"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      onChange={handleChange}
                      value={values.name}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="mobile"
                      label="Mobile"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      onChange={handleChange}
                      value={values.mobile}
                      error={touched.mobile && Boolean(errors.mobile)}
                      helperText={touched.mobile && errors.mobile}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="alternate_mobile"
                      label="Alternate Mobile"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.alternate_mobile}
                      onChange={handleChange}
                      error={touched.alternate_mobile && Boolean(errors.alternate_mobile)}
                      helperText={touched.alternate_mobile && errors.alternate_mobile}
                    /> 
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="email"
                      label="E-mail"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      onChange={handleChange}
                      value={values.email}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="address"
                      label="Address"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.address}
                      onChange={handleChange}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="city"
                      label="City"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.city}
                      onChange={handleChange}
                      error={touched.city && Boolean(errors.city)}
                      helperText={touched.city && errors.city}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="state_id"
                      label="State"
                      select
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.state_id}
                      onChange={handleChange}
                      error={touched.state_id && Boolean(errors.state_id)}
                      helperText={touched.state_id && errors.state_id}
                    >
                      {states.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.state}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="zip_code"
                      label="ZIP Code"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.zip_code}
                      onChange={handleChange}
                      error={touched.zip_code && Boolean(errors.zip_code)}
                      helperText={touched.zip_code && errors.zip_code}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      name="note"
                      label="Note"
                      fullWidth
                      multiline
                      rows={3}
                      margin="dense"
                      variant="standard"
                      value={values.note}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditOpen(false)} variant="outlined" color="error">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Submit
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Delete Modal */}
      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({ open: false, id: null, name: "", loading: false })
        }
      >
        <DialogTitle>Delete Customer?</DialogTitle>
        <DialogContent style={{ width: "320px" }}>
          <DialogContentText>
            Are you sure you want to delete customer{" "}
            <strong>{deleteDialog.name}</strong>? <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, id: null, name: "", loading: false })
            }
            disabled={deleteDialog.loading}
          >
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

export default Customers;

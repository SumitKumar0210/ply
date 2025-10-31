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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
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
  addVendor,
  fetchVendors,
  deleteVendor,
  updateVendor,
  statusUpdate
} from "../slices/vendorSlice"; //  new slice

import { fetchActiveCategories } from "../slices/categorySlice";

//  Error Boundary
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

const Vendor = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const { data: vendorData = [] } = useSelector((state) => state.vendor);
  const { data: categories = [] } = useSelector((state) => state.category);

  //  Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
    .min(2, "Vendor must be at least 2 characters")
    .required("Vendor Name is required"),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, "Enter valid 10-digit mobile number")
      .required("Mobile is required"),
    email: Yup.string().required("Email is required"),
    category_id: Yup.string().required("Category is required"),
    gst: Yup.string()
      .matches(/^([0-9A-Z]{15})$/, "Enter valid GST number")
      .required("GST is required"),
  });

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);


  useEffect(() => {
    dispatch(fetchActiveCategories());
  }, [open, editOpen]);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAdd = async (values, resetForm) => {
    const res = await dispatch(addVendor(values));
    if(res.error) return ; 
    resetForm();
    handleClose();
  };

  const handleDelete = (id) => {
    dispatch(deleteVendor(id));
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
    const res = await dispatch(updateVendor({ id: editData.id, ...values }));
    if(res.error) return;
    resetForm();
    handleEditClose();
  };

  //  Table columns
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Vendor Name" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "category_id", header: "Cateogry", Cell: ({ row }) => row.original.category?.name || "—", },
      { accessorKey: "gst", header: "GST" },
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
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton color="error" onClick={() => handleDelete(row.original.id)}>
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  );

  //  CSV download
  const downloadCSV = () => {
    const headers = columns.filter((c) => c.accessorKey).map((c) => c.header);
    const rows = vendorData.map((row) =>
      columns
        .filter((c) => c.accessorKey)
        .map((c) => `"${row[c.accessorKey] ?? ""}"`)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "vendor.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //  Print
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
            sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff" }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={vendorData}
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
              renderTopToolbar={({ table }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                  }}
                >
                  <Typography variant="h6">Vendor</Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
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
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleClickOpen}
                    >
                      Add Vendor
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add Modal */}
      <BootstrapDialog onClose={handleClose} open={open} fullWidth maxWidth="xs">
        <DialogTitle>Add Vendor</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Formik
          initialValues={{ name: "", mobile: "", address: "", gst: "" }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => handleAdd(values, resetForm)}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Vendor Name"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  id="mobile"
                  name="mobile"
                  label="Mobile"
                  variant="standard"
                  value={values.mobile}
                  onChange={handleChange}
                  error={touched.mobile && Boolean(errors.mobile)}
                  helperText={touched.mobile && errors.mobile}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Vendor email"
                  variant="standard"
                  value={values.email}
                  onChange={handleChange}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  id="address"
                  name="address"
                  label="Address"
                  variant="standard"
                  value={values.address}
                  onChange={handleChange}
                  error={touched.address && Boolean(errors.address)}
                  helperText={touched.address && errors.address}
                  sx={{ mb: 3 }}
                />
                <TextField
                  select
                  fullWidth
                  name="category_id"
                  label="Category"
                  variant="standard"
                  value={values.category_id}
                  onChange={handleChange}
                  error={touched.category_id && Boolean(errors.category_id)}
                  helperText={touched.category_id && errors.category_id}
                  sx={{ mb: 3 }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  id="gst"
                  name="gst"
                  label="GST"
                  variant="standard"
                  value={values.gst}
                  onChange={handleChange}
                  error={touched.gst && Boolean(errors.gst)}
                  helperText={touched.gst && errors.gst}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} color="error" variant="outlined">
                  Close
                </Button>
                <Button type="submit" variant="contained">
                  Submit
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Modal */}
      <BootstrapDialog onClose={handleEditClose} open={editOpen} fullWidth maxWidth="xs">
        <DialogTitle>Edit Vendor</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleEditClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Formik
          initialValues={{
            name: editData?.name || "",
            mobile: editData?.mobile || "",
            email: editData?.email || "",
            category_id: editData?.category_id || "",
            gst: editData?.gst || "",
            address: editData?.address || "",
          }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={(values, { resetForm }) => handleEditSubmit(values, resetForm)}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  id="edit_name"
                  name="name"
                  label="Vendor Name"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  id="edit_mobile"
                  name="mobile"
                  label="Mobile"
                  variant="standard"
                  value={values.mobile}
                  onChange={handleChange}
                  error={touched.mobile && Boolean(errors.mobile)}
                  helperText={touched.mobile && errors.mobile}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  id="edit_email"
                  name="email"
                  label="Vendor Email"
                  variant="standard"
                  value={values.email}
                  onChange={handleChange}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  id="address"
                  name="address"
                  label="Address"
                  variant="standard"
                  value={values.address}
                  onChange={handleChange}
                  error={touched.address && Boolean(errors.address)}
                  helperText={touched.address && errors.address}
                  sx={{ mb: 3 }}
                />
                <TextField
                  select
                  fullWidth
                  name="category_id"
                  label="Category"
                  variant="standard"
                  value={values.category_id}
                  onChange={handleChange}
                  error={touched.category_id && Boolean(errors.category_id)}
                  helperText={touched.category_id && errors.category_id}
                  sx={{ mb: 3 }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  id="edit_gst"
                  name="gst"
                  label="GST"
                  variant="standard"
                  value={values.gst}
                  onChange={handleChange}
                  error={touched.gst && Boolean(errors.gst)}
                  helperText={touched.gst && errors.gst}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleEditClose} color="error" variant="outlined">
                  Close
                </Button>
                <Button type="submit" variant="contained">
                  Save Changes
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>
    </ErrorBoundary>
  );
};

export default Vendor;

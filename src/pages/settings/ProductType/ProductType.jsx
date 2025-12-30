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
  CircularProgress,
  DialogContentText,
} from "@mui/material";
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
  addProductType,
  fetchProductTypes,
  statusUpdate,
  deleteProductType,
  updateProductType
} from "../slices/productTypeSlice";
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

const ProductType = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const dispatch = useDispatch();

  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Product Type must be at least 2 characters")
      .required("Product Type is required"),
  });

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setOpen(false);
  };

  const handleAdd = async (value, resetForm) => {
    setIsSubmitting(true);
    try {
      const res = await dispatch(addProductType(value));
      if (res.error) return;
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Add failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    setIsDeleting(true);
    await dispatch(deleteProductType(id));
    setIsDeleting(false);
    setOpenDelete(false);
    setDeleteRow(null);
  };

  const { data: productTypeData = [], loading, error } = useSelector(
    (state) => state.productType
  );

  useEffect(() => {
    dispatch(fetchProductTypes());
  }, [dispatch]);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Open modal with row data
  const handleUpdate = (row) => {
    setEditData(row);
    setEditOpen(true);
  };

  // Close modal
  const handleEditClose = () => {
    if (isUpdating) return;
    setEditOpen(false);
    setEditData(null);
  };

  // Update dispatch
  const handleEditSubmit = async (values, resetForm) => {
    setIsUpdating(true);
    try {
      const res = await dispatch(updateProductType({ id: editData.id, name: values.name }));
      if (res.error) {
        console.log("Update failed:", res.payload);
        return;
      }
      resetForm();
      setEditOpen(false);
      setEditData(null);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };
  const canUpdate = useMemo(() => hasPermission("product_types.update"), [hasPermission]);

  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: "name", header: "Product Type" },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            disabled={!canUpdate}
            onChange={(e) => {
              if(!canUpdate) return;
              const newStatus = e.target.checked ? 1 : 0;
              dispatch(statusUpdate({ ...row.original, status: newStatus }));
            }}
          />
        ),
      },
    ];

   
   
    if (hasAnyPermission?.(["product_types.update", "product_types.delete"])) {
      baseColumns.push({
      id: "actions_product_type",
      header: "Actions",
      enableSorting: false,
      enableColumnFilter: false,
      muiTableHeadCellProps: { align: "right" },
      muiTableBodyCellProps: { align: "right" },
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          {canUpdate && (
            <Tooltip title="Edit">
              <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
          )}
          { hasPermission('product_types.delete') && (
            <Tooltip title="Delete">
            <IconButton
              color="error"
              onClick={() => {
                setDeleteRow(row.original);
                setOpenDelete(true);
              }}
            >
              <RiDeleteBinLine size={16} />
            </IconButton>
          </Tooltip>
          )}
        </Box>
      ),
    });
    }

    return baseColumns;
  }, [dispatch, hasPermission, hasAnyPermission, loading, canUpdate]);


  // Function to download CSV from data
  const downloadCSV = () => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);
    const rows = productTypeData.map((row) =>
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
    link.setAttribute("download", "product_types.csv");
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
              data={productTypeData}
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
              state={{ isLoading: loading }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto"
                },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              muiTableBodyRowProps={{
                hover: false,
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
                  <Typography variant="h6" className='page-title'>
                    Product Types
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

                    {hasPermission('product_types.create') && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleClickOpen}
                      >
                        Add Product Type
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
      <BootstrapDialog
        onClose={handleClose}
        open={open}
        fullWidth
        maxWidth="xs"
        disableEscapeKeyDown={isSubmitting}
      >
        <DialogTitle sx={{ m: 0, p: 1.5, borderBottom: "1px solid #ddd" }}>
          Add Product Type
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={isSubmitting}
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
          initialValues={{ name: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm }) => {
            await handleAdd(values, resetForm);
          }}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  id="productType"
                  name="name"
                  label="Product Type"
                  variant="outlined"
                  size="small"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  disabled={isSubmitting}
                  sx={{ mb: 2, mt:2 }}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
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
        maxWidth="xs"
        disableEscapeKeyDown={isUpdating}
      >
        <DialogTitle sx={{ m: 0, p: 1.5, borderBottom: "1px solid #ddd" }}>
          Edit Product Type
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleEditClose}
          disabled={isUpdating}
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
          initialValues={{ name: editData?.name || "" }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={(values, { resetForm }) => handleEditSubmit(values, resetForm)}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  id="edit_productType"
                  name="name"
                  label="Product Type"
                  variant="outlined"
                  size="small"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  disabled={isUpdating}
                  sx={{ mb: 2, mt:2 }}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleEditClose}
                  disabled={isUpdating}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isUpdating}
                  startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>
      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)}>
        <DialogTitle>{"Delete this product type?"}</DialogTitle>
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
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </ErrorBoundary>
  );
};

export default ProductType;
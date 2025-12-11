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
  DialogContentText,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
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
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
import {
  addUnitOfMeasurement,
  fetchUnitOfMeasurements,
  statusUpdate,
  deleteUnitOfMeasurement,
  updateUnitOfMeasurement,
} from "../slices/unitOfMeasurementsSlice";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../../context/AuthContext";

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

const UOM = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const dispatch = useDispatch();

  //  Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "UOM must be at least 2 characters")
      .required("UOM is required"),
  });

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAdd = async (value, resetForm) => {
    setIsSaving(true);
    const res = await dispatch(addUnitOfMeasurement(value));
    setIsSaving(false);
    if (res.error) return;
    resetForm();
    handleClose();
  };

  // Delete
  const handleDeleteClick = (row) => {
    setDeleteData(row);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    await dispatch(deleteUnitOfMeasurement(id));
    setIsDeleting(false);
    setOpenDelete(false);
    setDeleteData(null);
  };

  //  Use correct slice (unitOfMeasurements)
  const { data: tableData = [], loading, error } = useSelector(
    (state) => state.unitOfMeasurement
  );

  useEffect(() => {
    dispatch(fetchUnitOfMeasurements());
  }, [dispatch]);

  //  Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const handleUpdate = (row) => {
    setEditData(row);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleEditSubmit = async (values, resetForm) => {
    setIsEditSaving(true);
    try {
      const res = await dispatch(
        updateUnitOfMeasurement({ id: editData.id, name: values.name })
      );
      setIsEditSaving(false);
      if (res.error) {
        console.log("Update failed:", res.payload);
        return;
      }
      resetForm();
      handleEditClose();
    } catch (err) {
      setIsEditSaving(false);
      console.error("Update failed:", err);
    }
  };

  const canUpdate = useMemo(() => hasPermission("uom.update"), [hasPermission]);

  const columns = useMemo(() => {
    return [
      {
        accessorKey: "name",
        header: "UOM",
        Cell: ({ cell }) => (loading ? <Skeleton variant="text" width="80%" /> : cell.getValue()),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="circular" width={40} height={20} />;

          return (
            <CustomSwitch
              checked={!!row.original.status}
              // disable when user cannot update
              disabled={!canUpdate}
              onChange={(e) => {
                // double-guard: do nothing if user lacks permission
                if (!canUpdate) return;
                const newStatus = e.target.checked ? 1 : 0;
                dispatch(statusUpdate({ ...row.original, status: newStatus }));
              }}
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
              {hasPermission("uom.update") && (
                <Tooltip title="Edit">
                  <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                    <BiSolidEditAlt size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {hasPermission("uom.delete") && (
                <Tooltip title="Delete">
                  <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                    <RiDeleteBinLine size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
    ];
  }, [dispatch, loading, canUpdate, hasPermission, statusUpdate, handleUpdate, handleDeleteClick]);


  const getRowId = (originalRow) => originalRow.id;

  //  CSV Export
  const downloadCSV = () => {
    if (!tableData.length) return;
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);
    const rows = tableData.map((row) =>
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
    link.setAttribute("download", "uom_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //  Print
  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const win = window.open("", "", "width=900,height=650");
    win.document.write(printContents);
    win.document.close();
    win.print();
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
              data={tableData}
              getRowId={getRowId}
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
                  <Typography variant="h6" className='page-title'>
                    Unit Of Measurement
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

                    {hasPermission('uom.create') && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleClickOpen}
                      >
                        Add UOM
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
      <BootstrapDialog onClose={handleClose} open={open} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add UOM</DialogTitle>
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
                  id="name"
                  name="name"
                  label="UOM"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 3 }}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleClose} disabled={isSaving}>
                  Close
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}>
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
        maxWidth="xs"
      >
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit UOM</DialogTitle>
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
          initialValues={{ name: editData?.name || "" }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={(values, { resetForm }) =>
            handleEditSubmit(values, resetForm)
          }
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  id="edit_name"
                  name="name"
                  label="UOM"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 3 }}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleEditClose} disabled={isEditSaving}>
                  Close
                </Button>
                <Button type="submit" variant="contained" disabled={isEditSaving} startIcon={isEditSaving ? <CircularProgress size={16} color="inherit" /> : null}>
                  {isEditSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)}>
        <DialogTitle>{"Delete this UOM?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={() => handleConfirmDelete(deleteData?.id)}
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

export default UOM;
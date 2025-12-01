import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Typography, Grid, Paper, Box, Button, IconButton, TextField, Tooltip,
  DialogContentText, Skeleton, CircularProgress,
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
import { useDispatch, useSelector } from "react-redux";
import { fetchUserTypes, addUserType, updateUserType, deleteUserType, statusUpdate } from "../slices/userTypeSlice";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

const UserType = () => {
  const validationSchema = Yup.object({
    userType: Yup.string()
    .min(2, "User type must be at least 2 characters")
    .required("User type is required"),
  });

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const dispatch = useDispatch();
  const { data: tableData, loading, error } = useSelector((state) => state.userType);

  useEffect(() => {
    dispatch(fetchUserTypes());
  }, [dispatch]);
  
  // Add
  const handleAdd = async (values, resetForm) => {
    setIsSaving(true);
    try {
      const res = await dispatch(addUserType({ name: values.userType, status: 1 }));
      setIsSaving(false);
      if (res.error) {
        console.log("Add failed:", res.payload);
        return;
      }
      // Success
      resetForm();
      setOpen(false);
    } catch (err) {
      setIsSaving(false);
    }
  };

  // Delete
  const handleDeleteClick = (row) => {
    setDeleteData(row);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    try {
      const res = await dispatch(deleteUserType(id));
      setIsDeleting(false);
      if (res.error) {
        console.log("Delete failed:", res.payload);
        setOpenDelete(false);
        setDeleteData(null);
        return;
      }
      // Success
      setOpenDelete(false);
      setDeleteData(null);
    } catch (err) {
      setIsDeleting(false);
      setOpenDelete(false);
      setDeleteData(null);
    }
  };

  // open modal with row data
  const handleUpdate = (row) => {
    setEditData(row);
    setEditOpen(true);
  };

  // close modal
  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  // update dispatch
  const handleEditSubmit = async (values, resetForm) => {
    setIsEditSaving(true);
    try {
      const res = await dispatch(updateUserType({ id: editData.id, name: values.userType }));
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

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "User Role",
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="80%" /> : cell.getValue(),
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
              onChange={(e) => {
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
              <Tooltip title="Edit">
                <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                  <BiSolidEditAlt size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [dispatch, loading]
  );

  //  Tell MRT which field is the unique row id
  const getRowId = (originalRow) => originalRow.id;

  // CSV (now includes status)
  const downloadCSV = () => {
    const headers = ["User Type", "Status"];
    const rows = tableData.map((r) => `"${r.name}","${r.status ? "Active" : "Inactive"}"`);
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "user_type_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <Grid container spacing={2}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff" }}
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
              muiTableContainerProps={{ sx: { width: "100%", backgroundColor: "#fff" } }}
              muiTablePaperProps={{ sx: { backgroundColor: "#fff" } }}
              muiTableBodyRowProps={({ row }) => ({
                hover: false,
                sx: row.original.status === "inactive"
                  ? { "&:hover": { backgroundColor: "transparent" } }
                  : {},
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
                   <Typography variant="h6" className='page-title'>
                    User Roles
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
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>
                      Add User Role
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
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add User Role</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({ position: "absolute", right: 8, top: 8, color: theme.palette.grey[500] })}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{ userType: "" }}
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
                  id="userType"
                  name="userType"
                  label="User Type"
                  variant="standard"
                  value={values.userType}
                  onChange={handleChange}
                  error={touched.userType && Boolean(errors.userType)}
                  helperText={touched.userType && errors.userType}
                  sx={{ mb: 3 }}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleClose} disabled={isSaving}>
                  Close
                </Button>
                <Button type="submit" variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}>
                  {isSaving ? "Saving..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Modal */}
      <BootstrapDialog onClose={handleEditClose} open={editOpen} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit User Role</DialogTitle>
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
          enableReinitialize
          initialValues={{ userType: editData?.name || "" }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => handleEditSubmit(values, resetForm)}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  id="userType"
                  name="userType"
                  label="User Type"
                  variant="standard"
                  value={values.userType}
                  onChange={handleChange}
                  error={touched.userType && Boolean(errors.userType)}
                  helperText={touched.userType && errors.userType}
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
        <DialogTitle>{"Delete this user role?"}</DialogTitle>
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
    </>
  );
};

export default UserType;
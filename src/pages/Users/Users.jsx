import React, { useMemo, useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
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
import * as Yup from "yup"; // ✅ Yup for validation
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import AddIcon from "@mui/icons-material/Add";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import Profile from "../../assets/images/profile.jpg";
import CustomSwitch from "../../components/CustomSwitch/CustomSwitch";

import { useDispatch, useSelector } from "react-redux";
import { addUser, fetchUsers, updateUser, statusUpdate, deleteUser } from "./slices/userSlice";
import {fetchStates} from "../settings/slices/stateSlice";
import { fetchActiveUserTypes } from "../settings/slices/userTypeSlice";
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

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

// ✅ Dropdown options
const usertype = [
  { value: "Admin", label: "Admin" },
  { value: "Production", label: "Production" },
  { value: "Store", label: "Store" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Management", label: "Management" },
];

const department = [{ value: "Polish", label: "Polish" }];

// ✅ Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email format").required("E-mail is required"),
  mobile: Yup.string().matches(/^[0-9]{10}$/, "Mobile must be 10 digits").required("Mobile is required"),
  state_id: Yup.string().required("State is required"),
  city: Yup.string().required("City is required"),
  address: Yup.string().required("Address is required"),
  user_type_id: Yup.string().required("Please select a user type"),
  image: Yup.mixed().required("Image is required"),
});

// ✅ Validation schema
const editValidationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email format").required("E-mail is required"),
  mobile: Yup.string().matches(/^[0-9]{10}$/, "Mobile must be 10 digits").required("Mobile is required"),
  state_id: Yup.string().required("State is required"),
  city: Yup.string().required("City is required"),
  address: Yup.string().required("Address is required"),
  user_type_id: Yup.string().required("Please select a user type"),
 image: Yup.mixed().nullable(),
});

// ✅ Initial users
const users = [
  {
    id: 1,
    profilePic: "",
    name: "Test User",
    email: "abc@gmail.com",
    phone: "9773579146",
    address: "Patna",
    usertype: "Admin",
    department: "Assembly",
    status: true,
  },
  {
    id: 2,
    profilePic: "",
    name: "Demo User",
    email: "demo@gmail.com",
    phone: "9876543210",
    address: "Delhi",
    usertype: "Store",
    department: "Polish",
    status: false,
  },
];

const Users = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
    loading: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const tableContainerRef = useRef(null);


  const { data: tableData = [], loading, error } = useSelector((state) => state.user);
  const { data: states = []} = useSelector((state) => state.state);
  const { data: userTypes = []} = useSelector((state) => state.userType);

  const dispatch = useDispatch();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
   dispatch(fetchStates());
   dispatch(fetchActiveUserTypes());
  }, [open, editOpen]);

  const handleAdd = async (values, resetForm) => {
    try {
      await dispatch(addUser(values));
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Add user failed:", error);
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
      await dispatch(deleteUser(deleteDialog.id)).unwrap(); 
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
    await dispatch(updateUser({ id: editData.id, ...values }));
    resetForm();
    handleEditClose();
  };

  // ✅ Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "profilePic",
        header: "Image",
        Cell: ({ row }) => (
          <img
            src={row.original.image ? mediaUrl + row.original.image : Profile}
                alt={row.original.name}
            width="40"
            height="40"
            style={{ borderRadius: "50%" }}
          />
        ),
        size: 80,
      },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "E-mail Address" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "address", header: "Address" },
      {
        accessorKey: "user_type_id",
        header: "User Type",
        Cell: ({ row }) => {
          const userType = row.original.user_type?.name;
          return userType ?? "N/A";
        },
      },
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
        enableSorting: false,
        enableColumnFilter: false,
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
                aria-label="delete"
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
    const rows = tableData.map((row) =>
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
      {/* Header Row */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6">Users</Typography>
        </Grid>
        <Grid>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Add User
          </Button>
        </Grid>
      </Grid>
      {/* Users Table */}
      <Grid size={12}>
        <Paper
          elevation={0}
          ref={tableContainerRef}
          sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff", px: 2, py: 1 }}
        >
          <MaterialReactTable
            columns={columns}
            data={tableData}
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
              sx: { width: "100%", backgroundColor: "#fff", overflowX: "auto", minWidth: "1200px" },
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
                  Users
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
      {/* Add Modal */}
      <BootstrapDialog onClose={() => setOpen(false)} open={open} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setOpen(false)}>
          Add User
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: "",
            email: "",
            mobile: "",
            state_id: "",
            city : "",
            address: "",
            user_type_id: "",
            image: null,
          }}
          validationSchema={validationSchema}
          onSubmit={ (values, { resetForm }) => {
           handleAdd(values, resetForm)
          }}
        >
          {({ handleChange, handleSubmit, setFieldValue, touched, errors, values }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <Grid container  rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="name"
                      name="name"
                      label="Name"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      onChange={handleChange}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="email"
                      name="email"
                      label="E-mail Address"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      onChange={handleChange}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="mobile"
                      name="mobile"
                      label="Mobile"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      onChange={handleChange}
                      error={touched.mobile && Boolean(errors.mobile)}
                      helperText={touched.mobile && errors.mobile}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="user_type_id"
                      name="user_type_id"
                      select
                      label="User Type"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.user_type_id}
                      onChange={handleChange}
                      error={touched.user_type_id && Boolean(errors.user_type_id)}
                      helperText={touched.user_type_id && errors.user_type_id}
                    >
                      {userTypes.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="password"
                      name="password"
                      label="Password"
                      variant="standard"
                      fullWidth
                      type="password"
                      margin="dense"
                      onChange={handleChange}
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6}}>
                    {/* Upload Image */}
                    <Grid container spacing={2} alignItems="center" mt={1}>
                      <Grid size={8}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="label"
                          startIcon={<FileUploadOutlinedIcon />}
                          fullWidth
                        >
                          Profile Pic
                          <input
                            hidden
                            accept="image/*"
                            type="file"
                            onChange={(event) => {
                              const file = event.currentTarget.files[0];
                              setFieldValue("image", file);
                            }}
                          />
                        </Button>
                        {touched.image && errors.image && (
                          <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.image}</div>
                        )}
                      </Grid>

                      <Grid size={4}>
                        {values.image && (
                          <img
                            src={URL.createObjectURL(values.image)}
                            alt="Preview"
                            style={{
                              width: "45px",
                              height: "45px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                            }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      id="state_id"
                      name="state_id"
                      label="State"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      onChange={handleChange}
                      error={touched.state_id && Boolean(errors.state_id)}
                      helperText={touched.state_id && errors.state_id}
                    >
                      {states.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.state}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="city"
                      name="city"
                      label="City"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      onChange={handleChange}
                      error={touched.city && Boolean(errors.city)}
                      helperText={touched.city && errors.city}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      id="address"
                      name="address"
                      label="Address"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      onChange={handleChange}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Submit
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>
      {/* Edit Modal */}
      <BootstrapDialog onClose={() => setEditOpen(false)} open={editOpen} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setEditOpen(false)}>
          Edit User
        </BootstrapDialogTitle>
        <Formik
            initialValues={{
              name: editData?.name || "",
              email: editData?.email || "",
              mobile: editData?.mobile || "", // ✅ fixed typo: was "mbile"
              state_id: editData?.state_id || "",
              city: editData?.city || "",
              address: editData?.address || "",
              user_type_id: editData?.user_type_id || "",
              image: null,
            }}
            validationSchema={editValidationSchema}
            enableReinitialize 
            onSubmit={(values, { resetForm }) => {
              handleEditSubmit(values, resetForm);
            }}
          >
          {({ handleChange, handleSubmit, setFieldValue, touched, errors, values }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <Grid container  rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="name"
                      name="name"
                      label="Name"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.name}
                      onChange={handleChange}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="email"
                      name="email"
                      label="E-mail Address"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.email}
                      onChange={handleChange}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="mobile"
                      name="mobile"
                      label="Mobile"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.mobile}
                      onChange={handleChange}
                      error={touched.mobile && Boolean(errors.mobile)}
                      helperText={touched.mobile && errors.mobile}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="user_type_id"
                      name="user_type_id"
                      select
                      label="User Type"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.user_type_id}
                      onChange={handleChange}
                      error={touched.user_type_id && Boolean(errors.user_type_id)}
                      helperText={touched.user_type_id && errors.user_type_id}
                    >
                      {userTypes.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="password"
                      name="password"
                      label="Password"
                      variant="standard"
                      fullWidth
                      type="password"
                      margin="dense"
                      onChange={handleChange}
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6}}>
                    {/* Upload Image */}
                    <Grid container spacing={2} alignItems="center" mt={1}>
                      <Grid size={8}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="label"
                          startIcon={<FileUploadOutlinedIcon />}
                          fullWidth
                        >
                          Profile Pic
                          <input
                            hidden
                            accept="image/*"
                            type="file"
                            onChange={(event) => {
                              const file = event.currentTarget.files[0];
                              setFieldValue("image", file);
                            }}
                          />
                        </Button>
                        {touched.image && errors.image && (
                          <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.image}</div>
                        )}
                      </Grid>

                      <Grid size={4}>
                        <img
                          src={ 
                            values.image
                              ? URL.createObjectURL(values.image)
                              : `${mediaUrl}${editData?.image || ""}`
                          }
                          alt="Preview"
                          style={{
                            width: "45px",
                            height: "45px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                          onError={(e) => {
                            e.target.src = Profile; // fallback
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      id="state_id"
                      name="state_id"
                      label="State"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.state_id}
                      onChange={handleChange}
                      error={touched.state_id && Boolean(errors.state_id)}
                      helperText={touched.state_id && errors.state_id}
                    >
                      {states.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.state}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="city"
                      name="city"
                      label="City"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.city}
                      onChange={handleChange}
                      error={touched.city && Boolean(errors.city)}
                      helperText={touched.city && errors.city}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      id="address"
                      name="address"
                      label="Address"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.address}
                      onChange={handleChange}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={() => setEditOpen(false)}>
                  Close
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
            Are you sure you want to delete User{" "}
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

export default Users;

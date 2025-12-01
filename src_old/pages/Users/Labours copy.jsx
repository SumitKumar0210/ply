import React, { useMemo, useState, useRef } from "react";
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
import * as Yup from "yup"; //  Yup for validation
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

//  Styled Dialog
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

//  Dropdown options
const usertype = [
  { value: "Admin", label: "Admin" },
  { value: "Production", label: "Production" },
  { value: "Store", label: "Store" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Management", label: "Management" },
];

const department = [{ value: "Polish", label: "Polish" }];

//  Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email format").required("E-mail is required"),
  phone: Yup.string().matches(/^[0-9]{10}$/, "Phone must be 10 digits").required("Phone is required"),
  address: Yup.string().required("Address is required"),
  usertype: Yup.string().required("Please select a user type"),
  department: Yup.string().required("Please select a department"),
  image: Yup.mixed().required("Image is required"),
});

//  Initial labours
const labours = [
  {
    id: 1,
    profilePic: "",
    name: "Test User",
    department: "Assembly",
    perhourcost: "Admin",
    overtime: "Assembly",
    status: true,
  },
  {
    id: 2,
    profilePic: "",
    name: "Demo User",
    department: "Assembly",
    perhourcost: "Store",
    overtime: "Polish",
    status: false,
  },
];

const Labours = () => {
  const [openAdd, setOpenAdd] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [tableData, setTableData] = useState(labours);
  const tableContainerRef = useRef(null);

  //  Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "profilePic",
        header: "Image",
        Cell: () => (
          <img
            src={Profile}
            alt="Profile"
            width="40"
            height="40"
            style={{ borderRadius: "50%" }}
          />
        ),
        size: 80,
      },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "department", header: "Department" },
      { accessorKey: "perhourcost", header: "Per Hour Cost" },
      { accessorKey: "overtime", header: "Over Time Hour" },
    
      {
        accessorKey: "status",
        header: "Status",
        size: 50,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableBodyCellProps: { onClick: (e) => e.stopPropagation() },
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => {
              const newStatus = e.target.checked;
              const rowId = row.original.id;
              setTableData((prev) =>
                prev.map((item) =>
                  item.id === rowId ? { ...item, status: newStatus } : item
                )
              );
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
                onClick={() => alert(`Edit ${row.original.id}`)}
              >
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                aria-label="delete"
                color="error"
                onClick={() => setOpenDelete(true)}
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

  //  CSV export using tableData
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
    link.setAttribute("download", "Labours.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //  Print handler
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
          <Typography variant="h6">Labours</Typography>
        </Grid>
        <Grid>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
            Add Labours
          </Button>
        </Grid>
      </Grid>

      {/* Labours Table */}
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
                 <Typography variant="h6" className='page-title'>
                  Labours
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
      <BootstrapDialog onClose={() => setOpenAdd(false)} open={openAdd} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setOpenAdd(false)}>
          Add Labours
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: "",
            email: "",
            phone: "",
            address: "",
            usertype: "",
            department: "",
            image: null,
          }}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            await new Promise((r) => setTimeout(r, 500));
            console.log("Form Submitted:", values);
            setOpenAdd(false);
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
                      id="phone"
                      name="phone"
                      label="Phone"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      onChange={handleChange}
                      error={touched.phone && Boolean(errors.phone)}
                      helperText={touched.phone && errors.phone}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="usertype"
                      name="usertype"
                      select
                      label="User Type"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.usertype}
                      onChange={handleChange}
                      error={touched.usertype && Boolean(errors.usertype)}
                      helperText={touched.usertype && errors.usertype}
                    >
                      {usertype.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="department"
                      name="department"
                      select
                      label="Department"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.department}
                      onChange={handleChange}
                      error={touched.department && Boolean(errors.department)}
                      helperText={touched.department && errors.department}
                    >
                      {department.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                   <Grid size={{ xs: 12, md: 6}}>
                    <Grid container spacing={2} alignItems="center" mt={1}>
                      <Grid size={6}>
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
                <Button variant="outlined" color="error" onClick={() => setOpenAdd(false)}>
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
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>{"Delete the 'Labour' ?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={() => setOpenDelete(false)} variant="contained" color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Labours;

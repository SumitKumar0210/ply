import React, { useMemo, useState, useRef } from "react";
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
const states = [
  { value: "Bihar", label: "Bihar" },
  { value: "Delhi", label: "Delhi" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Karnataka", label: "Karnataka" },
];

// ✅ Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile must be 10 digits")
    .required("Mobile is required"),
  email: Yup.string().email("Invalid email format").required("E-mail is required"),
  address: Yup.string().required("Address is required"),
  alternateMobile: Yup.string().matches(/^[0-9]{10}$/, "Alternate Mobile must be 10 digits"),
  city: Yup.string().required("City is required"),
  state: Yup.string().required("State is required"),
  zip: Yup.string().matches(/^[0-9]{6}$/, "ZIP must be 6 digits").required("ZIP code is required"),
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
  },
  {
    id: 2,
    name: "Customer Two",
    mobile: "9876500000",
    email: "customer2@gmail.com",
    address: "Delhi",
    city: "New Delhi",
    state: "Delhi",
    zip: "110001",
    note: "",
    status: false,
  },
];

const Customers = () => {
  const [openAdd, setOpenAdd] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [tableData, setTableData] = useState(customersList);
  const tableContainerRef = useRef(null);

  // ✅ Table Columns
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "mobile", header: "Mobile", size: 70  },
      { accessorKey: "email", header: "E-mail" },
      { accessorKey: "address", header: "Address" },
      { accessorKey: "city", header: "City", size: 50 },
      { accessorKey: "state", header: "State", size: 50 },
      { accessorKey: "zip", header: "ZIP", size: 50 },
      { accessorKey: "note", header: "Note" },
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
      {/* Header */}
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAdd(true)}
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
      <BootstrapDialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setOpenAdd(false)}>
          Add Customer
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: "",
            mobile: "",
            email: "",
            address: "",
            alternateMobile: "",
            city: "",
            state: "",
            zip: "",
            note: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            setTableData((prev) => [...prev, { id: prev.length + 1, ...values }]);
            setOpenAdd(false);
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
                      error={touched.mobile && Boolean(errors.mobile)}
                      helperText={touched.mobile && errors.mobile}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="alternateMobile"
                      label="Alternate Mobile"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      onChange={handleChange}
                      error={touched.alternateMobile && Boolean(errors.alternateMobile)}
                      helperText={touched.alternateMobile && errors.alternateMobile}
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
                      onChange={handleChange}
                      error={touched.city && Boolean(errors.city)}
                      helperText={touched.city && errors.city}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="state"
                      label="State"
                      select
                      fullWidth
                      margin="dense"
                      variant="standard"
                      value={values.state}
                      onChange={handleChange}
                      error={touched.state && Boolean(errors.state)}
                      helperText={touched.state && errors.state}
                    >
                      {states.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="zip"
                      label="ZIP Code"
                      fullWidth
                      margin="dense"
                      variant="standard"
                      onChange={handleChange}
                      error={touched.zip && Boolean(errors.zip)}
                      helperText={touched.zip && errors.zip}
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
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenAdd(false)} variant="outlined" color="error">
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
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Customer?</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => setOpenDelete(false)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Customers;

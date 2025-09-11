import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Typography, Grid, Paper, Box, Button, IconButton, TextField, Tooltip,
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


const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

// ✅ Give each row a unique id and an initial status
const seed = [
  { id: "1", name: "Admin", status: true },
  { id: "2", name: "Manager", status: false },
  { id: "3", name: "Support", status: true },
  { id: "4", name: "Sales", status: false },
  { id: "5", name: "Accountant", status: true },
  { id: "6", name: "Admin", status: false },      // duplicates are fine now
  { id: "7", name: "Admin", status: true },       // because id is unique
  { id: "8", name: "Manager", status: true },
  { id: "9", name: "Support", status: false },
  { id: "10", name: "Sales", status: true },
  { id: "11", name: "Accountant", status: false },
];

const UserType = () => {
  const validationSchema = Yup.object({
    userType: Yup.string().required("User type is required"),
  });

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [tableData, setTableData] = useState(seed); // ✅ controlled data

    const [input, setInput] = useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "User Type" },

      // ✅ Stable toggle by id (works with sorting/filtering/pagination)
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableBodyCellProps: { onClick: (e) => e.stopPropagation() }, // optional: keep row clicks from interfering
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => {
              const newStatus = e.target.checked;
              const rowId = row.original.id; // stable id from your data
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
                color="error"
                onClick={() => alert(`Delete ${row.original.id}`)}
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

  // ✅ Tell MRT which field is the unique row id
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
                  <Typography variant="h6" fontWeight={400}>
                    User Type
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
                      Add User Type
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Modal user type start */}
      <BootstrapDialog onClose={handleClose} open={open} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add User Type</DialogTitle>
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
            // ✅ add a new row with a unique id and default status
            // const newRow = {
            //   id: `u-${Date.now()}`, // simple unique id
            //   name: values.userType,
            //   status: true,
            // };
            // setTableData((prev) => [newRow, ...prev]);
            // handleClose();

              try {
                // 🔑 Get token from localStorage
                const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3BseWFwaS50ZWNoaWVzcXVhZC5pbi9wdWJsaWMvYXBpL2xvZ2luIiwiaWF0IjoxNzU3NTY3OTAwLCJleHAiOjE3ODkxMDM5MDAsIm5iZiI6MTc1NzU2NzkwMCwianRpIjoiRWNxSmZoNURyTzdYaW9WRSIsInN1YiI6IjEiLCJwcnYiOiIyM2JkNWM4OTQ5ZjYwMGFkYjM5ZTcwMWM0MDA4NzJkYjdhNTk3NmY3In0.WCqoW-pFmxGjMMXQ9DsswSLegHWAfigb0fByyA6zAHg";

                const response = await axios.post(
                  "https://plyapi.techiesquad.in/public/api/admin/userType/store",
                  {
                    name: values.userType,
                    status: true,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                // ✅ Update UI with returned data
                setTableData((prev) => [response.data, ...prev]);

                resetForm();
                handleClose();
              } catch (error) {
                console.error("Error adding user type:", error);
                var errorMessage = error.response.data[0]?? error.response.data.error;
                if (error.response?.status === 401) {
                  alert("Unauthorized! Please log in again.");
                } else if (error.response?.data?.errors) {
                  // Laravel validation errors
                  alert(Object.values(error.response.data.errors).join("\n"));
                } else if (error.response?.status === 500) {
                  // Laravel validation errors
                  
                  alert(errorMessage);
                } else {
                  alert(error.response.data.errors);
                }
              }
            
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
                <Button variant="outlined" color="error" onClick={handleClose}>
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
      {/* Modal user type end */}
    </>
  );
};

export default UserType;

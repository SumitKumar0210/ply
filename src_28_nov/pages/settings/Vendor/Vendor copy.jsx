import React, { useMemo, useRef, useState } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Modal,
  Button,
  IconButton,
  TextField,
  Tooltip,
  MenuItem,
  FormLabel 
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

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const data = [
  { name: "Vendor1", mobile: "9876543210", address: "Delhi", gst:"10AABCC3929J1ZZ" },
  { name: "Vendor2", mobile: "9876500000", address: "Mumbai", gst:"10AABCC3929J1ZZ" },
  { name: "Vendor3", mobile: "9988776655", address: "Chennai", gst:"10AABCC3929J1ZZ" },
];

const Vendor = () => {

const validationSchema = Yup.object({
  name: Yup.string().required("Vendor Name is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Enter valid 10 digit mobile number")
    .required("Mobile Number is required"),
  address: Yup.string().required("Address is required"),
  gst: Yup.string().required("GST is required"),
});
  const tableContainerRef = useRef(null);
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "address", header: "Address" },
      { accessorKey: "gst", header: "GST" },
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
                onClick={() => alert(`Edit ${row.original.name}`)}
              >
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => alert(`Delete ${row.original.name}`)}
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

  // Function to download CSV from data
  const downloadCSV = () => {
    // Prepare csv header
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);
    // Prepare csv rows
    const rows = data.map((row) =>
      columns
        .filter((col) => col.accessorKey)
        .map((col) => `"${row[col.accessorKey] ?? ""}"`)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create link and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Vendor_data.csv");
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
    <>
    <Grid container spacing={2}>
      <Grid size={12}>
        <Paper
          elevation={0}
sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff" }}
          ref={tableContainerRef}
        >
          <MaterialReactTable
            columns={columns}
            data={data}
            enableTopToolbar={true}
            enableColumnFilters={true}
            enableSorting={true}
            enablePagination={true}
            enableBottomToolbar={true}
            enableGlobalFilter={true}
            enableDensityToggle={false} // Remove density toggle
            enableColumnActions={false} // Remove column actions
            enableColumnVisibilityToggle={false}

            initialState={{
              density: "compact",
            }}
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
                 Vendor
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />

                  <MRT_ToolbarInternalButtons table={table} />
                  <Tooltip title="Print">
                    <IconButton color="light" onClick={handlePrint}>
                      <FiPrinter size={20} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Download CSV">
                    <IconButton color="light" onClick={downloadCSV}>
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
     {/* Modal user type start */}
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ m: 0, p: 1.5 }} id="customized-dialog-title">
         Add Vendor
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <Formik
           initialValues={{ name: "", mobile: "", address: "", gst:"" }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            console.log("Form Submitted:", values);
            handleClose();
          }}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers >
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Name"
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
                  fullWidth
                  id="gst"
                  name="gst"
                  label="GST"
                  variant="standard"
                  value={values.gst}
                  onChange={handleChange}
                  error={touched.gst && Boolean(errors.gst)}
                  helperText={touched.gst && errors.gst}
                  sx={{ mb: 3 }}
                />
              </DialogContent>
              <DialogActions  sx={{ gap: 1, mb:1 }}>
                <Button variant="outlined" color="error" onClick={handleClose}>Close</Button>
                <Button type="submit" variant="contained" color="primary">Submit</Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
    </BootstrapDialog>
    {/* Modal user type end */}
</>
  );
};

export default Vendor;

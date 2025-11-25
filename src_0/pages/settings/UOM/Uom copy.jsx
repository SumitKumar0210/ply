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
  { name: "uom1" },
  { name: "uom2" },
  { name: "uom3" },
  { name: "uom4" },
  { name: "uom1" },
  { name: "uom2" },
  { name: "uom3" },
  { name: "uom4" },
  { name: "uom1" },
  { name: "uom2" },
  { name: "uom3" },
  { name: "uom4" },

];

const UOM = () => {
  const validationSchema = Yup.object({
    uom: Yup.string().required("UOM is required"),
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
      { accessorKey: "name", header: "UOM" },
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
    link.setAttribute("download", "uom_data.csv");
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
          sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff" }}
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
                <Typography variant="h6" fontWeight={400}>
                 Unit Of Measurement
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
                    Add UOM
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
         Add UOM
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
          initialValues={{ uom: "" }}
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
                  id="uom"
                  name="uom"
                  label="uom"
                  variant="standard"
                  value={values.uom}
                  onChange={handleChange}
                  error={touched.uom && Boolean(errors.uom)}
                  helperText={touched.uom && errors.uom}
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

export default UOM;

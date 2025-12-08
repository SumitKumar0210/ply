import React, { useMemo, useRef, useState } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const data = [
  { name: "Machine1", runHours: "1200", lastMaintenance: "2025-08-15", remarks: "Running smoothly" },
  { name: "Machine2", runHours: "800", lastMaintenance: "2025-07-20", remarks: "Needs filter change" },
  { name: "Machine3", runHours: "1500", lastMaintenance: "2025-06-30", remarks: "Oil leakage observed" },
];

const Machine = () => {
  const validationSchema = Yup.object({
    name: Yup.string().required("Machine Name is required"),
    runHours: Yup.number()
      .typeError("Enter valid number of hours")
      .required("Run Hours are required"),
    lastMaintenance: Yup.date().required("Last Maintenance Date is required"),
    remarks: Yup.string().required("Remarks are required"),
  });

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "runHours", header: "Run Hours" },
      { accessorKey: "lastMaintenance", header: "Last Maintenance Date" },
      { accessorKey: "remarks", header: "Remarks" },
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

  // CSV download
  const downloadCSV = () => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);

    const rows = data.map((row) =>
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
    link.setAttribute("download", "Machine_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print
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
              enableDensityToggle={false}
              enableColumnActions={false}
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
                    Machine
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
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleClickOpen}
                    >
                      Add Machine
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Modal */}
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ m: 0, p: 1.5 }} id="customized-dialog-title">
          Add Machine
        </DialogTitle>
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
          initialValues={{ name: "", runHours: "", lastMaintenance: "", remarks: "" }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            console.log("Form Submitted:", values);
            handleClose();
          }}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
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
                  id="runHours"
                  name="runHours"
                  label="Run Hours"
                  variant="standard"
                  value={values.runHours}
                  onChange={handleChange}
                  error={touched.runHours && Boolean(errors.runHours)}
                  helperText={touched.runHours && errors.runHours}
                  sx={{ mb: 3 }}
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Last Maintenance Date"
                        value={values.lastMaintenance ? dayjs(values.lastMaintenance) : null}
                        onChange={(newValue) => {
                        handleChange({
                            target: {
                            name: "lastMaintenance",
                            value: newValue ? newValue.format("YYYY-MM-DD") : "",
                            },
                        });
                        }}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                variant: "standard",
                                error: touched.lastMaintenance && Boolean(errors.lastMaintenance),
                                helperText: touched.lastMaintenance && errors.lastMaintenance,
                                sx: { mb: 3 },
                            },
                        }}
                    />
                </LocalizationProvider>
                <TextField
                  fullWidth
                  id="remarks"
                  name="remarks"
                  label="Remarks"
                  variant="standard"
                  value={values.remarks}
                  onChange={handleChange}
                  error={touched.remarks && Boolean(errors.remarks)}
                  helperText={touched.remarks && errors.remarks}
                  sx={{ mb: 3 }}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleClose}>
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
    </>
  );
};

export default Machine;

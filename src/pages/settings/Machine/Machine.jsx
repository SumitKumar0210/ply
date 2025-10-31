import React, { useMemo, useRef, useState, useEffect } from "react";
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
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { useDispatch, useSelector } from "react-redux";
import {
  addMachine,
  fetchMachines,
  deleteMachine,
  updateMachine,
  statusUpdate
} from "../slices/machineSlice";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

const validationSchema = Yup.object({
  name: Yup.string()
  .min(2, "Machine must be at least 2 characters")
  .required("Machine Name is required"),

  run_hours_at_service: Yup.number()
    .typeError("Enter valid number of hours")
    .required("Run Hours at Service are required"),

  last_maintenance_date: Yup.date()
    .typeError("Enter a valid date")
    .required("Last Maintenance Date is required"),

  cycle_days: Yup.number()
    .typeError("Enter valid number of days")
    .required("Cycle Days are required"),

  cycle_month: Yup.number()
    .typeError("Enter valid number of months")
    .required("Cycle Month is required"),

  remarks: Yup.string().required("Remarks are required"),

  message: Yup.string().required("Message is required"),
});


const Machine = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const { data: machines = [] } = useSelector((state) => state.machine);

  //  fetch machine data on mount
  useEffect(() => {
    dispatch(fetchMachines());
  }, [dispatch]);

  //  modal handlers
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAdd = async (values, { resetForm }) => {
    const res = await dispatch(addMachine(values));
    if(res.error) return ;
    resetForm();
    handleClose();
  };

  const handleDelete = (id) => {
    dispatch(deleteMachine(id));
  };

  const handleUpdate = (row) => {
    setEditData(row);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleEditSubmit = async (values, { resetForm }) => {
    const res = await dispatch(updateMachine({ id: editData.id, ...values }));
    if(res.error) return ;
    resetForm();
    handleEditClose();
  };

  //  table columns
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "run_hours_at_service", header: "Run Hours at Service" },
      { accessorKey: "last_maintenance_date", header: "Last Maintenance Date" },
      { accessorKey: "cycle_days", header: "Cycle Days" },
      { accessorKey: "cycle_month", header: "Cycle Month" },
      { accessorKey: "remarks", header: "Remarks" },
      { accessorKey: "message", header: "Message" },
      {
        accessorKey: "status",
        header: "Status",
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
                color="error"
                onClick={() => handleDelete(row.original.id)}
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

  //  CSV download
  const downloadCSV = () => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);

    const rows = machines.map((row) =>
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

  //  Print
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
              data={machines}
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
              muiTablePaperProps={{ sx: { backgroundColor: "#fff" } }}
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

      {/* Add Machine Modal */}
      <BootstrapDialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add Machine</DialogTitle>
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
          onSubmit={handleAdd}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Name */}
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
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Run Hours at Service */}
                    <TextField
                      fullWidth
                      id="run_hours_at_service"
                      name="run_hours_at_service"
                      label="Run Hours at Service"
                      variant="standard"
                      value={values.run_hours_at_service}
                      onChange={handleChange}
                      error={touched.run_hours_at_service && Boolean(errors.run_hours_at_service)}
                      helperText={touched.run_hours_at_service && errors.run_hours_at_service}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Last Maintenance Date */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Last Maintenance Date"
                        value={values.last_maintenance_date ? dayjs(values.last_maintenance_date) : null}
                        onChange={(newValue) =>
                          handleChange({
                            target: {
                              name: "last_maintenance_date",
                              value: newValue ? newValue.format("YYYY-MM-DD") : "",
                            },
                          })
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "standard",
                            error: touched.last_maintenance_date && Boolean(errors.last_maintenance_date),
                            helperText: touched.last_maintenance_date && errors.last_maintenance_date,
                            sx: { mb: 3 },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Cycle Days */}
                    <TextField
                      fullWidth
                      id="cycle_days"
                      name="cycle_days"
                      label="Cycle Days"
                      variant="standard"
                      value={values.cycle_days}
                      onChange={handleChange}
                      error={touched.cycle_days && Boolean(errors.cycle_days)}
                      helperText={touched.cycle_days && errors.cycle_days}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Cycle Month */}
                    <TextField
                      fullWidth
                      id="cycle_month"
                      name="cycle_month"
                      label="Cycle Month"
                      variant="standard"
                      value={values.cycle_month}
                      onChange={handleChange}
                      error={touched.cycle_month && Boolean(errors.cycle_month)}
                      helperText={touched.cycle_month && errors.cycle_month}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Remarks */}
                    <TextField
                      fullWidth
                      id="remarks"
                      name="remarks"
                      label="Remarks"
                      variant="standard"
                      multiline
                      minRows={3}
                      value={values.remarks}
                      onChange={handleChange}
                      error={touched.remarks && Boolean(errors.remarks)}
                      helperText={touched.remarks && errors.remarks}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                    {/* Message */}
                    <TextField
                      fullWidth
                      id="message"
                      name="message"
                      label="Message"
                      variant="standard"
                      multiline
                      minRows={2}
                      value={values.message}
                      onChange={handleChange}
                      error={touched.message && Boolean(errors.message)}
                      helperText={touched.message && errors.message}
                      sx={{ mb: 3 }}
                    />
                </Grid>
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

      {/* Edit Machine Modal */}
      <BootstrapDialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit Machine</DialogTitle>
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
        {editData && (
          <Formik
            initialValues={{
              name: editData?.name || "",
              run_hours_at_service: editData?.run_hours_at_service || "",
              last_maintenance_date: editData?.last_maintenance_date || "",
              cycle_days: editData?.cycle_days || "",
              cycle_month: editData?.cycle_month || "",
              remarks: editData?.remarks || "",
              message: editData?.message || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleEditSubmit}
          >
            {({ values, errors, touched, handleChange, resetForm  }) => (
              <Form>
                <DialogContent dividers>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      {/* Name */}
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
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      {/* Run Hours at Service */}
                      <TextField
                        fullWidth
                        id="run_hours_at_service"
                        name="run_hours_at_service"
                        label="Run Hours at Service"
                        variant="standard"
                        value={values.run_hours_at_service}
                        onChange={handleChange}
                        error={touched.run_hours_at_service && Boolean(errors.run_hours_at_service)}
                        helperText={touched.run_hours_at_service && errors.run_hours_at_service}
                        sx={{ mb: 3 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      {/* Last Maintenance Date */}
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Last Maintenance Date"
                          value={
                            values.last_maintenance_date
                              ? dayjs(values.last_maintenance_date)
                              : null
                          }
                          onChange={(newValue) =>
                            handleChange({
                              target: {
                                name: "last_maintenance_date",
                                value: newValue ? newValue.format("YYYY-MM-DD") : "",
                              },
                            })
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "standard",
                              error:
                                touched.last_maintenance_date &&
                                Boolean(errors.last_maintenance_date),
                              helperText:
                                touched.last_maintenance_date && errors.last_maintenance_date,
                              sx: { mb: 3 },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      {/* Cycle Days */}
                      <TextField
                        fullWidth
                        id="cycle_days"
                        name="cycle_days"
                        label="Cycle Days"
                        variant="standard"
                        value={values.cycle_days}
                        onChange={handleChange}
                        error={touched.cycle_days && Boolean(errors.cycle_days)}
                        helperText={touched.cycle_days && errors.cycle_days}
                        sx={{ mb: 3 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      {/* Cycle Month */}
                      <TextField
                        fullWidth
                        id="cycle_month"
                        name="cycle_month"
                        label="Cycle Month"
                        variant="standard"
                        value={values.cycle_month}
                        onChange={handleChange}
                        error={touched.cycle_month && Boolean(errors.cycle_month)}
                        helperText={touched.cycle_month && errors.cycle_month}
                        sx={{ mb: 3 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      {/* Remarks */}
                      <TextField
                        fullWidth
                        id="remarks"
                        name="remarks"
                        label="Remarks"
                        variant="standard"
                        multiline
                        minRows={2}
                        value={values.remarks}
                        onChange={handleChange}
                        error={touched.remarks && Boolean(errors.remarks)}
                        helperText={touched.remarks && errors.remarks}
                        sx={{ mb: 3 }}
                      />
                    </Grid>
                    {/* Message */}
                    <TextField
                      fullWidth
                      id="message"
                      name="message"
                      label="Message"
                      variant="standard"
                      multiline
                      minRows={2}
                      value={values.message}
                      onChange={handleChange}
                      error={touched.message && Boolean(errors.message)}
                      helperText={touched.message && errors.message}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                </DialogContent>

                {/* Actions */}
                <DialogActions sx={{ gap: 1, mb: 1 }}>
                  <Button variant="outlined" color="error" onClick={handleEditClose}>
                    Close
                  </Button>
                  
                  <Button type="submit" variant="contained" color="primary">
                    Save changes
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        )}
      </BootstrapDialog>
    </>
  );
};

export default Machine;

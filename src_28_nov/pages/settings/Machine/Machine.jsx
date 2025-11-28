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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
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
  cycle_days: Yup.number()
    .typeError("Enter valid number of days")
    .required("Cycle Days are required"),
  cycle_month: Yup.number()
    .typeError("Enter valid number of months")
    .required("Cycle Month is required"),
  message: Yup.string().required("Message is required"),
});

const INITIAL_VALUES = {
  name: "",
  run_hours_at_service: "",
  cycle_days: "",
  cycle_month: "",
  message: "",
};

const Machine = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const { data: machines = [] } = useSelector((state) => state.machine);

  useEffect(() => {
    dispatch(fetchMachines());
  }, [dispatch]);

  const handleClose = () => setOpen(false);
  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleAdd = async (values, { resetForm }) => {
    const res = await dispatch(addMachine(values));
    if (res.error) return;
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

  const handleEditSubmit = async (values, { resetForm }) => {
    const res = await dispatch(updateMachine({ id: editData.id, ...values }));
    if (res.error) return;
    resetForm();
    handleEditClose();
  };

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "run_hours_at_service", header: "Working Hours" },
      { accessorKey: "cycle_days", header: "Servicing Time" },
      { accessorKey: "cycle_month", header: "Service Cycle" },
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
              <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton color="error" onClick={() => handleDelete(row.original.id)}>
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [dispatch]
  );

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

  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const FormFields = ({ values, errors, touched, handleChange }) => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          id="name"
          name="name"
          label="Name"
          size="small"
          value={values.name}
          onChange={handleChange}
          error={touched.name && Boolean(errors.name)}
          helperText={touched.name && errors.name}
          sx={{ mb: 3 }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          id="run_hours_at_service"
          name="run_hours_at_service"
          label="Working Hours"
          size="small"
          value={values.run_hours_at_service}
          onChange={handleChange}
          error={touched.run_hours_at_service && Boolean(errors.run_hours_at_service)}
          helperText={touched.run_hours_at_service && errors.run_hours_at_service}
          sx={{ mb: 3 }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          id="cycle_days"
          name="cycle_days"
          label="Servicing Time"
          size="small"
          value={values.cycle_days}
          onChange={handleChange}
          error={touched.cycle_days && Boolean(errors.cycle_days)}
          helperText={touched.cycle_days && errors.cycle_days}
          sx={{ mb: 3 }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          id="cycle_month"
          name="cycle_month"
          label="Service Cycle"
          size="small"
          value={values.cycle_month}
          onChange={handleChange}
          error={touched.cycle_month && Boolean(errors.cycle_month)}
          helperText={touched.cycle_month && errors.cycle_month}
          sx={{ mb: 3 }}
        />
      </Grid>
      <Grid size={12}>
        <TextField
          fullWidth
          id="message"
          name="message"
          label="Message"
          size="small"
          multiline
          minRows={2}
          value={values.message}
          onChange={handleChange}
          error={touched.message && Boolean(errors.message)}
          helperText={touched.message && errors.message}
          sx={{ mb: 3 }}
        />
      </Grid>
    </Grid>
  );

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
              muiTableContainerProps={{ sx: { width: "100%", backgroundColor: "#fff" } }}
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
                      onClick={() => setOpen(true)}
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
          initialValues={INITIAL_VALUES}
          validationSchema={validationSchema}
          onSubmit={handleAdd}
        >
          {(formikProps) => (
            <Form>
              <DialogContent dividers>
                <FormFields {...formikProps} />
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
              name: editData.name || "",
              run_hours_at_service: editData.run_hours_at_service || "",
              cycle_days: editData.cycle_days || "",
              cycle_month: editData.cycle_month || "",
              message: editData.message || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleEditSubmit}
          >
            {(formikProps) => (
              <Form>
                <DialogContent dividers>
                  <FormFields {...formikProps} />
                </DialogContent>
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
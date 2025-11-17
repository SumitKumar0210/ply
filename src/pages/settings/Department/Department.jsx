import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { debounce } from "lodash";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
import {
  addDepartment,
  fetchDepartments,
  statusUpdate,
  deleteDepartment,
  updateDepartment,
  sequenceUpdate,
} from "../slices/departmentSlice";
import { useDispatch, useSelector } from "react-redux";


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: "center", color: "red" }}>
          <Typography variant="h6">Something went wrong.</Typography>
          <Typography variant="body2">{this.state.error?.message}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}


const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));


const Department = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [sequenceValues, setSequenceValues] = useState({});

  const { data: tableData = [], loading } = useSelector(
    (state) => state.department
  );

  
  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Department must be at least 2 characters")
      .required("Department is required"),
  });

  
  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

 
  useEffect(() => {
    if (tableData.length > 0) {
      const init = {};
      tableData.forEach((d) => (init[d.id] = d.sequence || ""));
      setSequenceValues(init);
    }
  }, [tableData]);

  
  const debouncedSequenceUpdate = useMemo(
    () =>
      debounce((id, value) => {
        if (!value || isNaN(value)) return;
        dispatch(sequenceUpdate({ id, sequence: Number(value) }));
      }, 1500),
    [dispatch]
  );

  const handleSequenceChange = useCallback(
    (id, value) => {
      setSequenceValues((prev) => ({ ...prev, [id]: value }));
      debouncedSequenceUpdate(id, value);
    },
    [debouncedSequenceUpdate]
  );

  useEffect(() => {
    return () => debouncedSequenceUpdate.cancel();
  }, [debouncedSequenceUpdate]);

  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEditOpen = (row) => {
    setEditData(row);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  
  const handleAdd = async (values, resetForm) => {
    const res = await dispatch(addDepartment(values));
    if (!res.error) {
      resetForm();
      handleClose();
    }
  };

  const handleEditSubmit = async (values, resetForm) => {
    const res = await dispatch(updateDepartment({ id: editData.id, ...values }));
    if (!res.error) {
      resetForm();
      handleEditClose();
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      dispatch(deleteDepartment(id));
    }
  };

  
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Department" },
      {
        accessorKey: "sequence",
        header: "Sequence",
        Cell: ({ row }) => (
          <TextField
            type="number"
            size="small"
            disabled={(row.original.sequence == 1 || row.original.sequence ==2 || row.original.sequence ==3 || row.original.sequence ==4)}
            value={sequenceValues[row.original.id] ?? row.original.sequence ?? ""}
            onChange={(e) => handleSequenceChange(row.original.id, e.target.value)}
            inputProps={{ min: 0 }}
            sx={{ width: 80 }}
          />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) =>
              dispatch(
                statusUpdate({
                  ...row.original,
                  status: e.target.checked ? 1 : 0,
                })
              )
            }
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
              <IconButton onClick={() => handleEditOpen(row.original)}>
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            {!(row.original.sequence == 1 || row.original.sequence ==2 || row.original.sequence ==3 || row.original.sequence ==4) &&(
              <Tooltip title="Delete">
              <IconButton color="error" onClick={() => handleDelete(row.original.id)}>
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [dispatch, handleSequenceChange, sequenceValues]
  );

  
  const getRowId = (row) => row.id;

  const downloadCSV = () => {
    if (!tableData.length) return;
    const headers = columns.filter((c) => c.accessorKey).map((c) => c.header);
    const rows = tableData.map((r) =>
      columns
        .filter((c) => c.accessorKey)
        .map((c) => `"${r[c.accessorKey] ?? ""}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute(
      "download",
      `departments_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const w = window.open("", "", "width=900,height=650");
    w.document.write(printContents);
    w.document.close();
    w.print();
  };

  
  return (
    <ErrorBoundary>
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
              state={{ isLoading: loading }}
              enableTopToolbar
              enableColumnFilters
              enableSorting
              enablePagination
              enableGlobalFilter
              enableBottomToolbar
              enableDensityToggle={false}
              enableColumnActions={false}
              enableColumnVisibilityToggle={false}
              initialState={{ density: "compact" }}
              muiTableContainerProps={{ sx: { backgroundColor: "#fff" } }}
              renderTopToolbar={({ table }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                  }}
                >
                  <Typography variant="h6" fontWeight={500}>
                    Department
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
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
                      Add Department
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
        <DialogTitle>Add Department</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{ name: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm }) => handleAdd(values, resetForm)}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  name="name"
                  label="Department"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
              </DialogContent>
              <DialogActions>
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

      {/* Edit Modal */}
      <BootstrapDialog onClose={handleEditClose} open={editOpen} fullWidth maxWidth="xs">
        <DialogTitle>Edit Department</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleEditClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{ name: editData?.name || "" }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={(values, { resetForm }) => handleEditSubmit(values, resetForm)}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  name="name"
                  label="Department"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
              </DialogContent>
              <DialogActions>
                <Button variant="outlined" color="error" onClick={handleEditClose}>
                  Close
                </Button>
                <Button type="submit" variant="contained">
                  Save Changes
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>
    </ErrorBoundary>
  );
};

export default Department;

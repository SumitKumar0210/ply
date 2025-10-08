import React, { useEffect, useMemo, useRef, useState  } from "react";
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
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";

import { addGrade, fetchGrades, statusUpdate, 
  deleteGrade, updateGrade } from "../slices/gradeSlice";
import { useDispatch, useSelector } from "react-redux";

// ✅ Error Boundary
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

const Grade = () => {
  const dispatch = useDispatch();

  // ✅ Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Grade is required"),
  });

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAdd = async (value, resetForm) => {
    const res = await dispatch(addGrade(value));
    if(res.error) return;
    resetForm();
    handleClose();
  };

  // Delete
    const handleDelete = (id) => {
      dispatch(deleteGrade(id));
    };
  

    const { data: gradeData = [], loading, error } = useSelector(
      (state) => state.grade
    );
    
    useEffect(() => {
      dispatch(fetchGrades());
    }, [dispatch]);
    
    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState(null);
  
    // open modal with row data
  const handleUpdate = (row) => {
    setEditData(row);   // save selected row
    setEditOpen(true);  // open modal
  };
  
  // close modal
  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };
  
  // update dispatch
  const handleEditSubmit = async (values, resetForm) => {
  try {
    const res = await dispatch(updateGrade({ id: editData.id, name: values.name }));
    if (res.error) {
      console.log("Update failed:", res.payload);
      return;
    }
    resetForm();
    handleEditClose();
  } catch (err) {
    console.error("Update failed:", err);
  }
};

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Grade" },
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
  // ✅ Tell MRT which field is the unique row id
  const getRowId = (originalRow) => originalRow.id;


  // Function to download CSV from data
  const downloadCSV = () => {
    // Prepare csv header
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);
    // Prepare csv rows
    const rows = gradeData.map((row) =>
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
    link.setAttribute("download", "grade.csv");
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
              data={gradeData}   // ✅ direct array
              getRowId={(row) => row.id}
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
                    Grade
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />
                    <MRT_ToolbarInternalButtons table={table} />

                    <Tooltip title="Print">
                      <IconButton color="default" onClick={handlePrint}>
                        <FiPrinter size={20} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Download CSV">
                      <IconButton color="default" onClick={downloadCSV}>
                        <BsCloudDownload size={20} />
                      </IconButton>
                    </Tooltip>

                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleClickOpen}
                    >
                      Add Grade
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Modal */}
      <BootstrapDialog onClose={handleClose} open={open} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add Grade</DialogTitle>
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
          initialValues={{ name: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm }) => {
            await handleAdd(values, resetForm);
          }}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  id="grade"
                  name="name"
                  label="Grade"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
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


      {/* Edit Modal */}
      <BootstrapDialog onClose={handleEditClose} open={editOpen} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit Grade</DialogTitle>
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
                  id="edit_grade"
                  name="name"
                  label="Grade"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 3 }}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
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

export default Grade;

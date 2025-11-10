import React, { useMemo, useState, useRef, useEffect } from "react";
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
import * as Yup from "yup";
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

import { successMessage, errorMessage, processMessage } from "../../toast";
import { useDispatch, useSelector } from "react-redux";
import { addLabour, deleteLabour, fetchLabours, updateLabour, statusUpdate } from "./slices/labourSlice";
import { fetchActiveDepartments } from "../settings/slices/departmentSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import { compressImage } from "../../components/imageCompressor/imageCompressor";

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

//  Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  per_hour_cost: Yup.number()
    .typeError("Per hour cost must be a number")
    .positive("Per hour cost must be positive")
    .required("Per hour cost is required"),
  overtime_hourly_rate: Yup.number()
    .typeError("Over time hourly rate must be a number")
    .positive("Over time hourly rate must be positive")
    .required("Over time hourly rate is required"),
  department_id: Yup.string().required("Please select a department"),
  image: Yup.mixed().required("Image is required"),
});

//  Edit Validation schema
const editValidationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  per_hour_cost: Yup.number()
    .typeError("Per hour cost must be a number")
    .positive("Per hour cost must be positive")
    .required("Per hour cost is required"),
  overtime_hourly_rate: Yup.number()
    .typeError("Over time hourly rate must be a number")
    .positive("Over time hourly rate must be positive")
    .required("Over time hourly rate is required"),
  department_id: Yup.string().required("Please select a department"),
});

const Labours = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
    loading: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const tableContainerRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  const { data: tableData = [], loading, error } = useSelector((state) => state.labour);
  const { data: departments = [] } = useSelector((state) => state.department);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchLabours());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchActiveDepartments());
  }, [open, editOpen]);

  const handleAdd = async (values, resetForm) => {
    try {
      const res = await dispatch(addLabour(values));
      if (res.error) return;
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Add labour failed:", error);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      id: row.id,
      name: row.name,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await dispatch(deleteLabour(deleteDialog.id)).unwrap();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteDialog({ open: false, id: null, name: "", loading: false });
    }
  };

  const handleUpdate = (row) => {
    setEditData(row);
    if (row.image instanceof File) {
      const objectUrl = URL.createObjectURL(row.image);
      setPreviewUrl(objectUrl);
    } else if (row.image) {
      setPreviewUrl(mediaUrl + row.image);
    }
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleEditSubmit = async (values, resetForm) => {
    const res = await dispatch(updateLabour({ updated: { id: editData.id, ...values } }));
    if (res.error) return;
    resetForm();
    handleEditClose();
  };

  // Handle image compression
  const handleImageChange = async (event, setFieldValue, isEdit = false) => {
    const file = event.currentTarget.files[0];
    if (!file) return;

    // Handle image compression
    if (file.type.startsWith("image/")) {
      try {
        setCompressingImage(true);

        // Compress the image
        const compressed = await compressImage(file, {
          maxSizeMB: 0.5, // Compress to max 500KB
          maxWidthOrHeight: 1024,
        });

        // Log compression results
        const originalSize = (file.size / 1024).toFixed(2);
        const compressedSize = (compressed.size / 1024).toFixed(2);
        const reduction = (
          ((file.size - compressed.size) / file.size) * 100
        ).toFixed(2);

        console.log(
          `Image compressed: ${originalSize} KB → ${compressedSize} KB (${reduction}% reduction)`
        );

        successMessage(
          `Image compressed successfully! Original: ${originalSize}KB, Compressed: ${compressedSize}KB`
        );

        setFieldValue("image", compressed);
        
        // Update preview for edit mode
        if (isEdit) {
          setPreviewUrl(URL.createObjectURL(compressed));
        }
      } catch (error) {
        console.error("Image compression failed:", error);
        errorMessage("Failed to compress image. Using original file.");
        // Continue with original file if compression fails
        setFieldValue("image", file);
        
        if (isEdit) {
          setPreviewUrl(URL.createObjectURL(file));
        }
      } finally {
        setCompressingImage(false);
      }
    } else {
      setFieldValue("image", file);
      
      if (isEdit) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  //  Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "profilePic",
        header: "Image",
        Cell: ({ row }) => (
          <ImagePreviewDialog
            imageUrl={row.original.image ? mediaUrl + row.original.image : Profile}
            alt={row.original.name}
          />
        ),
        size: 80,
      },
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "department_id", 
        header: "Department", 
        Cell: ({ row }) => {
          const dept = row.original.department;
          return dept ? dept.name : "N/A";
        }
      },
      { accessorKey: "per_hour_cost", header: "Per Hour Cost" },
      { accessorKey: "overtime_hourly_rate", header: "Over Time Hour" },
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
                onClick={() => handleUpdate(row.original)}
              >
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                aria-label="delete"
                color="error"
                onClick={() => handleDeleteClick(row.original)}
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Add Labour
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
                <Typography variant="h6" fontWeight={400}>
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
      <BootstrapDialog onClose={() => setOpen(false)} open={open} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setOpen(false)}>
          Add Labour
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: "",
            per_hour_cost: "",
            overtime_hourly_rate: "",
            department_id: "",
            image: null,
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            handleAdd(values, resetForm)
          }}
        >
          {({ handleChange, handleSubmit, setFieldValue, touched, errors, values }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <Grid container rowSpacing={1} columnSpacing={3}>
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
                      id="per_hour_cost"
                      name="per_hour_cost"
                      label="Per Hour Cost "
                      variant="standard"
                      fullWidth
                      type="number"
                      margin="dense"
                      onChange={handleChange}
                      error={touched.per_hour_cost && Boolean(errors.per_hour_cost)}
                      helperText={touched.per_hour_cost && errors.per_hour_cost}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="overtime_hourly_rate"
                      name="overtime_hourly_rate"
                      label="Over Time Hourly Rate"
                      variant="standard"
                      fullWidth
                      type="number"
                      margin="dense"
                      onChange={handleChange}
                      error={touched.overtime_hourly_rate && Boolean(errors.overtime_hourly_rate)}
                      helperText={touched.overtime_hourly_rate && errors.overtime_hourly_rate}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="department_id"
                      name="department_id"
                      select
                      label="Department"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.department_id}
                      onChange={handleChange}
                      error={touched.department_id && Boolean(errors.department_id)}
                      helperText={touched.department_id && errors.department_id}
                    >
                      {departments.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container spacing={2} alignItems="center" mt={1}>
                      <Grid size={6}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="label"
                          startIcon={<FileUploadOutlinedIcon />}
                          fullWidth
                          disabled={compressingImage}
                        >
                          {compressingImage ? "Compressing..." : "Profile Pic"}
                          <input
                            hidden
                            type="file"
                            inputProps={{
                              accept: "image/*", 
                            }}
                            onChange={(event) => handleImageChange(event, setFieldValue, false)}
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
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={() => setOpen(false)}>
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
      <BootstrapDialog onClose={() => setEditOpen(false)} open={editOpen} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={() => setEditOpen(false)}>
          Edit Labour
        </BootstrapDialogTitle>
        <Formik
          enableReinitialize
          initialValues={{
            name: editData?.name || "",
            per_hour_cost: editData?.per_hour_cost || "",
            overtime_hourly_rate: editData?.overtime_hourly_rate || "",
            department_id: editData?.department_id || "",
            image: null,
          }}
          validationSchema={editValidationSchema}
          onSubmit={(values, { resetForm }) => {
            handleEditSubmit(values, resetForm);
          }}
        >
          {({ handleChange, handleSubmit, setFieldValue, touched, errors, values }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <Grid container rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="name"
                      name="name"
                      label="Name"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.name}
                      onChange={handleChange}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="per_hour_cost"
                      name="per_hour_cost"
                      label="Per Hour Cost"
                      variant="standard"
                      fullWidth
                      type="number"
                      margin="dense"
                      value={values.per_hour_cost}
                      onChange={handleChange}
                      error={touched.per_hour_cost && Boolean(errors.per_hour_cost)}
                      helperText={touched.per_hour_cost && errors.per_hour_cost}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="overtime_hourly_rate"
                      name="overtime_hourly_rate"
                      label="Over Time Hourly Rate"
                      variant="standard"
                      fullWidth
                      type="number"
                      margin="dense"
                      value={values.overtime_hourly_rate}
                      onChange={handleChange}
                      error={touched.overtime_hourly_rate && Boolean(errors.overtime_hourly_rate)}
                      helperText={touched.overtime_hourly_rate && errors.overtime_hourly_rate}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      id="department_id"
                      name="department_id"
                      select
                      label="Department"
                      variant="standard"
                      fullWidth
                      margin="dense"
                      value={values.department_id}
                      onChange={handleChange}
                      error={touched.department_id && Boolean(errors.department_id)}
                      helperText={touched.department_id && errors.department_id}
                    >
                      {departments.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container spacing={2} alignItems="center" mt={1}>
                      <Grid size={6}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="label"
                          startIcon={<FileUploadOutlinedIcon />}
                          fullWidth
                          disabled={compressingImage}
                        >
                          {compressingImage ? "Compressing..." : "Profile Pic"}
                          <input
                            hidden
                            type="file"
                            inputProps={{
                              accept: "image/*", 
                            }}
                            onChange={(event) => handleImageChange(event, setFieldValue, true)}
                          />
                        </Button>
                        {touched.image && errors.image && (
                          <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.image}</div>
                        )}
                      </Grid>

                      <Grid size={4}>
                        <img
                          src={
                            values.image
                              ? URL.createObjectURL(values.image)
                              : previewUrl || `${mediaUrl}${editData?.image || ""}`
                          }
                          alt="Preview"
                          style={{
                            width: "45px",
                            height: "45px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                          onError={(e) => {
                            e.target.src = Profile;
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={() => setEditOpen(false)}>
                  Close
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Save changes
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Delete Modal */}
      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({ open: false, id: null, name: "", loading: false })
        }
      >
        <DialogTitle>Delete Labour?</DialogTitle>
        <DialogContent style={{ width: "320px" }}>
          <DialogContentText>
            Are you sure you want to delete labour{" "}
            <strong>{deleteDialog.name}</strong>? <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, id: null, name: "", loading: false })
            }
            disabled={deleteDialog.loading}
          >
            Close
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteDialog.loading}
          >
            {deleteDialog.loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Labours;
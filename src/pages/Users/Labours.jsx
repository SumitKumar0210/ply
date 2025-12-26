import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  InputAdornment,
Chip,
  useMediaQuery,
  useTheme,
  Pagination,
  Card,
  CardContent,
  Divider,
  Switch,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

import SearchIcon from "@mui/icons-material/Search";
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

import { PiCurrencyInr } from "react-icons/pi";

import { successMessage, errorMessage } from "../../toast";
import { useDispatch, useSelector } from "react-redux";
import {
  addLabour,
  deleteLabour,
  fetchLabours,
  updateLabour,
  statusUpdate,
  fetchAllLaboursWithSearch,
} from "./slices/labourSlice";
import { fetchActiveDepartments } from "../settings/slices/departmentSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import { compressImage } from "../../components/imageCompressor/imageCompressor";
// import { fetchActiveWorkShifts } from "../settings/slices/Workshiftslice";
import { fetchActiveWorkShifts } from "../settings/slices/workshiftslice";

// Constants
const DOCUMENT_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "voter_id", label: "Voter ID Card" },
  { value: "pan", label: "PAN Card" },
  { value: "driving_license", label: "Driving License" },
  { value: "passport", label: "Passport" },
  { value: "ration_card", label: "Ration Card" },
  { value: "other", label: "Other" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_IMAGE_FORMATS = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
const SUPPORTED_DOCUMENT_FORMATS = [...SUPPORTED_IMAGE_FORMATS, "application/pdf"];

// Document validation patterns
const DOCUMENT_PATTERNS = {
  aadhaar: {
    pattern: /^\d{12}$/,
    message: "Aadhaar number must be exactly 12 digits",
  },
  pan: {
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    message: "PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)",
  },
  voter_id: {
    pattern: /^[A-Z]{3}[0-9]{7}$/,
    message: "Voter ID format: 3 letters followed by 7 digits",
  },
  passport: {
    pattern: /^[A-Z]{1}[0-9]{7}$/,
    message: "Passport format: 1 letter followed by 7 digits",
  },
  driving_license: {
    pattern: /^[A-Z]{2}[0-9]{13}$/,
    message: "DL format: 2 letters followed by 13 digits",
  },
  ration_card: {
    pattern: /^[A-Z0-9]{10,20}$/,
    message: "Ration card must be 10-20 alphanumeric characters",
  },
};

// Styled Components
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

function BootstrapDialogTitle({ children, onClose, ...other }) {
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

// Validation Schemas
const createValidationSchema = (isEdit = false) => {
  const baseSchema = {
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
      .required("Name is required"),
    per_hour_cost: Yup.number()
      .typeError("Per hour cost must be a number")
      .positive("Per hour cost must be positive")
      .max(10000, "Per hour cost seems too high")
      .required("Per hour cost is required"),
    overtime_hourly_rate: Yup.number()
      .typeError("Overtime hourly rate must be a number")
      .positive("Overtime hourly rate must be positive")
      .max(10000, "Overtime rate seems too high")
      .required("Overtime hourly rate is required"),
    department_id: Yup.string().required("Please select a department"),
    shift_id: Yup.string().required("Please select a Shift"),
    document_type: Yup.string().required("Document type is required"),
    other_document_name: Yup.string().when("document_type", {
      is: "other",
      then: (schema) => schema
        .min(2, "Document name must be at least 2 characters")
        .required("Please enter the document name"),
      otherwise: (schema) => schema.nullable(),
    }),
    document_number: Yup.string()
      .required("Document number is required")
      .test("valid-format", function (value) {
        const { document_type } = this.parent;

        if (!value) return true;

        // Skip validation for 'other' document type
        if (document_type === "other") {
          return value.length >= 5 && value.length <= 30;
        }

        const validation = DOCUMENT_PATTERNS[document_type];
        if (validation) {
          const isValid = validation.pattern.test(value);
          if (!isValid) {
            return this.createError({ message: validation.message });
          }
        }

        return true;
      }),
    dob: Yup.date()
      .nullable()
      .required("Date of birth is required")
      .max(new Date(), "Date of birth cannot be in the future")
      .test("age", "Labour must be at least 18 years old", function (value) {
        if (!value) return true;
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1 >= 18;
        }
        return age >= 18;
      }),
  };

  // Add image validation only for add mode
  if (!isEdit) {
    baseSchema.image = Yup.mixed()
      .required("Profile image is required")
      .test("fileSize", "File size must be less than 5MB", (value) => {
        return value && value.size <= MAX_FILE_SIZE;
      })
      .test("fileFormat", "Unsupported file format", (value) => {
        return value && SUPPORTED_IMAGE_FORMATS.includes(value.type);
      });

    baseSchema.document_file = Yup.mixed()
      .required("Please upload document image or PDF")
      .test("fileSize", "File size must be less than 5MB", (value) => {
        return value && value.size <= MAX_FILE_SIZE;
      })
      .test("fileFormat", "Only images and PDF files are allowed", (value) => {
        return value && SUPPORTED_DOCUMENT_FORMATS.includes(value.type);
      });
  }

  return Yup.object(baseSchema);
};
 // Mobile pagination handlers
  const handleMobilePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  };
const Labours = () => {
   const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
  const [compressingDocument, setCompressingDocument] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const tableContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState(null);

  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  const { searchResults = [], loading } = useSelector(
    (state) => state.labour
  );
  const { data: departments = [] } = useSelector((state) => state.department);
  const { data: shifts = [] } = useSelector((state) => state.workShift);


  const {
    data: rowData = [],
  } = searchResults;

  const {
    data: tableData = [],
    total = 0,
  } = rowData;

  const dispatch = useDispatch();

  // Fetch labours with pagination and search
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search by 500ms
    searchTimeoutRef.current = setTimeout(() => {
      dispatch(
        fetchAllLaboursWithSearch({
          pageIndex: pagination.pageIndex + 1,
          pageLimit: pagination.pageSize,
          search: globalFilter || "", // Send empty string if not searching
        })
      );
    }, 500);

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [dispatch, pagination.pageIndex, pagination.pageSize, globalFilter]);

  // Fetch departments and shifts when modals open
  useEffect(() => {
    if (open || editOpen) {
      dispatch(fetchActiveDepartments());
      dispatch(fetchActiveWorkShifts());
    }
  }, [open, editOpen, dispatch]);

  // Reset to first page when search changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      if (documentPreviewUrl && documentPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(documentPreviewUrl);
      }
    };
  }, [previewUrl, documentPreviewUrl]);

  const handleAdd = useCallback(async (values, { resetForm }) => {
    try {
      const res = await dispatch(addLabour(values));
      if (res.error) return;
      resetForm();
      setOpen(false);
      successMessage("Labour added successfully!");
    } catch (error) {
      console.error("Add labour failed:", error);
      errorMessage("Failed to add labour. Please try again.");
    }
  }, [dispatch]);

  const handleDeleteClick = useCallback((row) => {
    setDeleteDialog({
      open: true,
      id: row.id,
      name: row.name,
      loading: false,
    });
  }, []);

  const shortFileName = (name = "", limit = 20) => {
    if (!name) return "";
    return name.length > limit ? name.substring(0, limit) + "..." : name;
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.id) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await dispatch(deleteLabour(deleteDialog.id)).unwrap();
      successMessage("Labour deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      errorMessage("Failed to delete labour. Please try again.");
    } finally {
      setDeleteDialog({ open: false, id: null, name: "", loading: false });
    }
  }, [deleteDialog.id, dispatch]);

  const handleUpdate = useCallback((row) => {
    setEditData(row);
    if (row.image) {
      setPreviewUrl(mediaUrl + row.image);
    }
    setEditOpen(true);
  }, [mediaUrl]);

  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditData(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    if (documentPreviewUrl && documentPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(documentPreviewUrl);
    }
    setPreviewUrl(null);
    setDocumentPreviewUrl(null);
  }, [previewUrl, documentPreviewUrl]);

  const handleEditSubmit = useCallback(async (values, { resetForm }) => {
    try {
      const res = await dispatch(
        updateLabour({ updated: { id: editData.id, ...values } })
      );
      if (res.error) return;
      resetForm();
      handleEditClose();
      successMessage("Labour updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      errorMessage("Failed to update labour. Please try again.");
    }
  }, [dispatch, editData, handleEditClose]);

  // Handle image compression
  const handleImageChange = async (event, setFieldValue, isEdit = false) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    // Validate file type
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
      errorMessage("Please upload a valid image file (JPG, PNG, or WebP)");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      errorMessage("File size must be less than 5MB");
      return;
    }

    try {
      setCompressingImage(true);

      const compressed = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
      });

      const originalSize = (file.size / 1024).toFixed(2);
      const compressedSize = (compressed.size / 1024).toFixed(2);
      const reduction = (((file.size - compressed.size) / file.size) * 100).toFixed(2);

      console.log(
        `Image compressed: ${originalSize} KB → ${compressedSize} KB (${reduction}% reduction)`
      );

      successMessage(
        `Image compressed: ${originalSize}KB → ${compressedSize}KB (${reduction}% saved)`
      );

      setFieldValue("image", compressed);

      if (isEdit) {
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(compressed));
      }
    } catch (error) {
      console.error("Image compression failed:", error);
      errorMessage("Failed to compress image. Using original file.");
      setFieldValue("image", file);

      if (isEdit) {
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(file));
      }
    } finally {
      setCompressingImage(false);
    }
  };

  // Handle document upload with compression for images
  const handleDocumentChange = async (event, setFieldValue) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    // Validate file type
    if (!SUPPORTED_DOCUMENT_FORMATS.includes(file.type)) {
      errorMessage("Please upload a valid document (Image or PDF)");
      event.target.value = null;
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      errorMessage("Document size must be less than 5MB");
      event.target.value = null;
      return;
    }

    // If it's an image, compress it
    if (file.type.startsWith("image/")) {
      try {
        setCompressingDocument(true);

        const compressed = await compressImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
        });

        const originalSize = (file.size / 1024).toFixed(2);
        const compressedSize = (compressed.size / 1024).toFixed(2);
        const reduction = (((file.size - compressed.size) / file.size) * 100).toFixed(2);

        console.log(
          `Document compressed: ${originalSize} KB → ${compressedSize} KB (${reduction}% reduction)`
        );

        successMessage(
          `Document compressed: ${originalSize}KB → ${compressedSize}KB (${reduction}% saved)`
        );

        setFieldValue("document_file", compressed);

        // Create preview URL for compressed image
        if (documentPreviewUrl && documentPreviewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(documentPreviewUrl);
        }
        setDocumentPreviewUrl(URL.createObjectURL(compressed));
      } catch (error) {
        console.error("Document compression failed:", error);
        errorMessage("Failed to compress document. Using original file.");
        setFieldValue("document_file", file);

        // Create preview URL for original image
        if (documentPreviewUrl && documentPreviewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(documentPreviewUrl);
        }
        setDocumentPreviewUrl(URL.createObjectURL(file));
      } finally {
        setCompressingDocument(false);
      }
    } else {
      // For PDF files, just set the file
      setFieldValue("document_file", file);
      setDocumentPreviewUrl(null);
      successMessage("Document uploaded successfully!");
    }
  };

  const handleStatusChange = useCallback((row, checked) => {
    const newStatus = checked ? 1 : 0;
    dispatch(statusUpdate({ ...row, status: newStatus }));
  }, [dispatch]);

  // Table columns
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
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 150,
      },
      {
        accessorKey: "department_id",
        header: "Department",
        Cell: ({ row }) => row.original.department?.name || "N/A",
        size: 150,
      },
      {
        accessorKey: "per_hour_cost",
        header: "Per Hour Cost",
        Cell: ({ cell }) => `₹${cell.getValue()}`,
        size: 130,
      },
      {
        accessorKey: "overtime_hourly_rate",
        header: "Overtime Rate",
        Cell: ({ cell }) => `₹${cell.getValue()}`,
        size: 130,
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => handleStatusChange(row.original, e.target.checked)}
          />
        ),
        size: 100,
      },
      {
        id: "actions",
        header: "Actions",
        size: 120,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                <BiSolidEditAlt size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                <RiDeleteBinLine size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [dispatch, mediaUrl, handleStatusChange, handleUpdate, handleDeleteClick]
  );

  // CSV export
  const downloadCSV = useCallback(() => {
    const headers = ["Name", "Department", "Per Hour Cost", "Overtime Rate", "Status"];
    const rows = tableData.map((row) => [
      `"${row.name}"`,
      `"${row.department?.name || "N/A"}"`,
      `"${row.per_hour_cost}"`,
      `"${row.overtime_hourly_rate}"`,
      `"${row.status ? "Active" : "Inactive"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Labours_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [tableData]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;

    const printWindow = window.open('', '_blank');
    const tableHTML = tableContainerRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Labours List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              button, .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>Labours List</h2>
          ${tableHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, id: null, name: "", loading: false });
  }, []);

  const handleCloseAdd = useCallback(() => setOpen(false), []);
  const handleOpenAdd = useCallback(() => setOpen(true), []);

  // Initial values generator
  const getInitialValues = (isEdit = false, data = null) => {
    if (isEdit && data) {
      return {
        name: data.name || "",
        per_hour_cost: data.per_hour_cost || "",
        overtime_hourly_rate: data.overtime_hourly_rate || "",
        department_id: data.department_id || "",
        image: null,
        document_type: data.document_type || "",
        other_document_name: data.other_document_name || "",
        document_number: data.document_number || "",
        document_file: null,
        dob: data.dob || "",
        shift_id: data.shift_id || "",
      };
    }

    return {
      name: "",
      per_hour_cost: "",
      overtime_hourly_rate: "",
      department_id: "",
      image: null,
      document_type: "",
      other_document_name: "",
      document_number: "",
      document_file: null,
      dob: "",
      shift_id: "",
    };
  };

  // Form fields component
  const FormFields = ({ values, errors, touched, handleChange, setFieldValue, isEdit }) => (
    <Grid container rowSpacing={1} columnSpacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          name="name"
          label="Name"
          size="small"
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
          name="per_hour_cost"
          label="Per Hour Cost (₹)"
          size="small"
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
          name="overtime_hourly_rate"
          label="Overtime Hourly Rate (₹)"
          size="small"
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
          name="shift_id"
          select
          label="Shift"
          size="small"
          fullWidth
          margin="dense"
          value={values.shift_id}
          onChange={handleChange}
          error={touched.shift_id && Boolean(errors.shift_id)}
          helperText={touched.shift_id && errors.shift_id}
        >
          {shifts.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          name="department_id"
          select
          label="Department"
          size="small"
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
        <TextField
          name="dob"
          label="Date of Birth"
          size="small"
          fullWidth
          margin="dense"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={values.dob}
          onChange={handleChange}
          error={touched.dob && Boolean(errors.dob)}
          helperText={touched.dob && errors.dob}
          inputProps={{
            max: new Date().toISOString().split("T")[0],
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Grid container spacing={1} alignItems="center">
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
                accept="image/*"
                onChange={(event) => handleImageChange(event, setFieldValue, isEdit)}
              />
            </Button>
            {touched.image && errors.image && (
              <Typography color="error" variant="caption" display="block" mt={0.5}>
                {errors.image}
              </Typography>
            )}
          </Grid>
          <Grid size={6}>
            {(values.image || (isEdit && previewUrl)) && (

              <ImagePreviewDialog
                imageUrl={values.image
                  ? URL.createObjectURL(values.image)
                  : previewUrl || Profile}
                alt="Preview"
              />
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          name="document_type"
          select
          label="Document Type"
          size="small"
          fullWidth
          margin="dense"
          value={values.document_type}
          onChange={handleChange}
          error={touched.document_type && Boolean(errors.document_type)}
          helperText={touched.document_type && errors.document_type}
        >
          {DOCUMENT_TYPES.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {values.document_type === "other" && (
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="other_document_name"
            label="Other Document Name"
            size="small"
            fullWidth
            margin="dense"
            value={values.other_document_name}
            onChange={handleChange}
            error={touched.other_document_name && Boolean(errors.other_document_name)}
            helperText={touched.other_document_name && errors.other_document_name}
          />
        </Grid>
      )}

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          name="document_number"
          label="Document Number"
          size="small"
          fullWidth
          margin="dense"
          value={values.document_number}
          onChange={handleChange}
          error={touched.document_number && Boolean(errors.document_number)}
          helperText={touched.document_number && errors.document_number}
          placeholder={
            values.document_type && DOCUMENT_PATTERNS[values.document_type]
              ? DOCUMENT_PATTERNS[values.document_type].message
              : "Enter document number"
          }
        />
      </Grid>


      <Grid size={{ xs: 12, md: 6 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid size={documentPreviewUrl ? 8 : 8}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUploadOutlinedIcon />}
              fullWidth
              disabled={compressingDocument}
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {compressingDocument ? "Compressing..." : "Upload Document"}
              <input
                hidden
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => handleDocumentChange(event, setFieldValue)}
              />
            </Button>
            {touched.document_file && errors.document_file && (
              <Typography color="error" variant="caption" display="block" mt={0.5}>
                {errors.document_file}
              </Typography>
            )}
          </Grid>
          <Grid size={documentPreviewUrl ? 4 : 4}>
            {values.document_file && (
              <Box>
                {documentPreviewUrl ? (

                  <ImagePreviewDialog
                    imageUrl={documentPreviewUrl}
                    alt="Document Preview"
                  />
                ) : (
                  <Typography variant="caption" noWrap title={values.document_file?.name}>
                    {shortFileName(values.document_file?.name)}
                  </Typography>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Grid>

    </Grid>
  );

  return (
    <>
      {/* Header */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6" className="page-title">Foreman</Typography>
        </Grid>
        <Grid>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Add Foreman
          </Button>
        </Grid>
      </Grid>

      {isMobile ? (
              // 🔹 MOBILE VIEW (Cards)
              <>
                <Box sx={{ minHeight: '100vh' }}>
                  {/* Mobile Search */}
                  <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search labours..."
                      value=""
                      // onChange={(e) => handleGlobalFilterChange(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Paper>
                  <Card sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2, maxWidth: 600 }}>
                    {/* Header Section - Blue Background */}
                    <Box
                      sx={{
                        bgcolor: "primary.main",
                        p: 1.25,
                        color: "primary.contrastText",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            src="/path-to-image.jpg"
                            alt="Aman"
                            sx={{ width: 40, height: 40 }}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: "white", mb: 0.5 }}>
                            Aman
                          </Typography>
                        </Box>
                  <Chip
                    label="Quality Check"
                    size="small"
                    sx={{
                      bgcolor: "white",
                      color: "primary.main",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                    }}
                  />
                      </Box>
                    </Box>
      
                    {/* Body Section */}
                    <CardContent sx={{ p: 1.5 }}>
                      {/* Details Grid */}
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid size={12}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {/* Icon */}
                      <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>
                        <PiCurrencyInr size={16} />
                      </Box>

                      {/* Text */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", fontSize: "0.875rem", minWidth: '114px'}}
                        >
                          Per Hour Cost :
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
                        >
                          5,000
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={12}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {/* Icon */}
                      <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>
                        <PiCurrencyInr size={16} />
                      </Box>

                      {/* Text */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", fontSize: "0.875rem", minWidth: '114px'}}
                        >
                          Over Time Rate :
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
                        >
                          200
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
      
                      <Divider sx={{ mb: 1.5 }} />
                      {/* Action Buttons */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Switch
                          defaultChecked
                          sx={{
                            width: 36,
                            height: 20,
                            padding: 0,
                            '& .MuiSwitch-switchBase': {
                              padding: 0,
                              margin: '2px',
                              transitionDuration: '300ms',
                              '&.Mui-checked': {
                                transform: 'translateX(16px)',
                                color: '#fff',
                                '& + .MuiSwitch-track': {
                                  backgroundColor: '#0d6efd',
                                  opacity: 1,
                                  border: 0,
                                },
                              },
                              '&.Mui-disabled + .MuiSwitch-track': {
                                opacity: 0.5,
                              },
                            },
                            '& .MuiSwitch-thumb': {
                              boxSizing: 'border-box',
                              width: 16,
                              height: 16,
                              boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2)',
                            },
                            '& .MuiSwitch-track': {
                              borderRadius: 10,
                              backgroundColor: '#d9e0e6ff',
                              opacity: 1,
                              transition: 'background-color 0.3s',
                            },
                          }}
                        />
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          <IconButton
                            size="medium"
                            sx={{
                              bgcolor: "#e3f2fd",
                              color: "#1976d2",
                              "&:hover": { bgcolor: "#bbdefb" },
                            }}
                          >
                            <BiSolidEditAlt size={20} />
                          </IconButton>
                          <IconButton
                            size="medium"
                            sx={{
                              bgcolor: "#ffebee",
                              color: "#d32f2f",
                              "&:hover": { bgcolor: "#ffcdd2" },
                            }}
                          >
                            <RiDeleteBinLine size={20} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  {/* Mobile Pagination */}
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                      count={Math.ceil(10 / pagination.pageSize)}
                      page={pagination.pageIndex + 1}
                      onChange={handleMobilePageChange}
                      color="primary"
                    />
                  </Box>
                </Box>
              </>
            ) : (
              // 🔹 DESKTOP VIEW (Table)
      <Grid size={12}>
        <Paper
          elevation={0}
          ref={tableContainerRef}
          sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff", px: 2, py: 1 }}
        >
          <MaterialReactTable
            columns={columns}
            data={tableData}
            getRowId={(row) => row.id}
            rowCount={total}
            manualPagination
            manualFiltering
            onPaginationChange={setPagination}
            onGlobalFilterChange={setGlobalFilter}
            state={{
              isLoading: loading,
              pagination,
              globalFilter,
            }}
            enableTopToolbar
            enableColumnFilters={false}
            enableSorting={false}
            enablePagination
            enableBottomToolbar
            enableGlobalFilter
            enableDensityToggle={false}
            enableColumnActions={false}
            enableFullScreenToggle={false}
            initialState={{ density: "compact" }}
            muiTableContainerProps={{
              sx: { width: "100%", backgroundColor: "#fff", overflowX: "auto" },
            }}
            muiTableBodyCellProps={{ sx: { whiteSpace: "nowrap" } }}
            muiTablePaperProps={{ sx: { backgroundColor: "#fff", boxShadow: "none" } }}
            muiTableBodyRowProps={{ hover: true }}
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
                  Foreman List
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
)}
      {/* Add Modal */}
      <BootstrapDialog onClose={handleCloseAdd} open={open} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={handleCloseAdd}>
          Add Labour
        </BootstrapDialogTitle>
        <Formik
          initialValues={getInitialValues(false)}
          validationSchema={createValidationSchema(false)}
          onSubmit={handleAdd}
        >
          {({ handleChange, handleSubmit, setFieldValue, touched, errors, values }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <FormFields
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  isEdit={false}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleCloseAdd}>
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

      {/* Edit Modal */}
      <BootstrapDialog onClose={handleEditClose} open={editOpen} fullWidth maxWidth="sm">
        <BootstrapDialogTitle onClose={handleEditClose}>
          Edit Labour
        </BootstrapDialogTitle>
        <Formik
          enableReinitialize
          initialValues={getInitialValues(true, editData)}
          validationSchema={createValidationSchema(true)}
          onSubmit={handleEditSubmit}
        >
          {({ handleChange, handleSubmit, setFieldValue, touched, errors, values }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <FormFields
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  isEdit={true}
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleEditClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Save Changes
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.name}</strong>?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeDeleteDialog}
            disabled={deleteDialog.loading}
            variant="outlined"
          >
            Cancel
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
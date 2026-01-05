import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
import {
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Tooltip,
  Chip,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import CustomSwitch from "../../components/CustomSwitch/CustomSwitch";

import { successMessage, errorMessage } from "../../toast";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserPermissions,
  createUserPermission,
  updateUserPermission,
  deleteUserPermission,
} from "./slices/userPermissionsSlice";
import { capitalize } from "lodash";

// Constants
const MODULES = [
  { value: "attendance", label: "Attendance" },
  { value: "bills", label: "Bills" },
  { value: "categories", label: "Categories" },
  { value: "company_orders", label: "Company Orders" }, // fixed spelling
  { value: "customer_lists", label: "Customer Lists" },
  { value: "customer_orders", label: "Customer Orders" },
  { value: "customers", label: "Customers" },
  { value: "departments", label: "Departments" },
  { value: "dispatch_product", label: "Dispatch Product" },
  { value: "general_settings", label: "General Settings" }, // fixed spelling
  { value: "groups", label: "Groups" },
  { value: "labours", label: "Labours" },
  { value: "labour_worksheet", label: "Labour Worksheet" },
  { value: "machines", label: "Machines" },
  { value: "material_request", label: "Material Request" },
  { value: "materials", label: "Materials" },
  { value: "productions", label: "Productions" },
  { value: "product", label: "Product" },
  { value: "product_stocks", label: "Product stocks" },
  { value: "product_types", label: "Product Types" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "qc_po", label: "QC PO" },
  { value: "quotations", label: "Quotations" },
  { value: "roles", label: "Roles" },
  { value: "rrp", label: "RRP" },
  { value: "stocks", label: "Stocks" },
  { value: "tax_slabs", label: "Tax Slabs" },
  { value: "uom", label: "UOM" },
  { value: "users", label: "Users" },
  { value: "vendor_invoices", label: "Vendor Invoices" },
  { value: "vendor_lists", label: "Vendor Lists" },
  { value: "vendors", label: "Vendors" },
  { value: "working_shifts", label: "Working Shifts" }
];


const ACTION_TYPE = {
  CRUD: "crud",
  OTHER: "other",
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

// Validation Schema
const createValidationSchema = () => {
  return Yup.object({
    module: Yup.string()
      .required("Module is required"),
    action_type: Yup.string()
      .oneOf([ACTION_TYPE.CRUD, ACTION_TYPE.OTHER], "Invalid action type")
      .required("Action type is required"),
    custom_action: Yup.string().when("action_type", {
      is: ACTION_TYPE.OTHER,
      then: (schema) => schema
        .min(2, "Action must be at least 2 characters")
        .max(50, "Action must not exceed 50 characters")
        .matches(
          /^[a-zA-Z\s._-]+$/,
          "Action can only contain letters, spaces, dots, hyphens, and underscores"
        )
        .required("Custom action is required"),
      otherwise: (schema) => schema.nullable(),
    }),
  });
};

const Permissions = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    permission: "",
    loading: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const tableContainerRef = useRef(null);

  const { permissions = [], loading = false } = useSelector(
    (state) => state.userPermissions
  );
  // const permissions =[]; const loading= false;

  const dispatch = useDispatch();

  // Fetch permissions on mount
  useEffect(() => {
    dispatch(fetchUserPermissions());
  }, [dispatch]);

  // Filter permissions based on search
  const filteredPermissions = useMemo(() => {
    if (!globalFilter) return permissions;

    const searchLower = globalFilter.toLowerCase();
    return permissions.filter(
      (perm) =>
        perm.permission?.toLowerCase().includes(searchLower) ||
        perm.module?.toLowerCase().includes(searchLower) ||
        perm.group?.toLowerCase().includes(searchLower)
    );
  }, [permissions, globalFilter]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIdx = pagination.pageIndex * pagination.pageSize;
    const endIdx = startIdx + pagination.pageSize;
    return filteredPermissions.slice(startIdx, endIdx);
  }, [filteredPermissions, pagination]);

  // Reset to first page when search changes
  useEffect(() => {
    if (globalFilter !== "") {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [globalFilter]);

  // Generate permission string from form values
  const generatePermission = (values) => {
    const { module, action_type, custom_action } = values;

    if (action_type === ACTION_TYPE.CRUD) {
      // Generate CRUD permissions: module.create, module.read, module.update, module.delete
      return `${module}.create, ${module}.read, ${module}.update, ${module}.delete`;
    } else {
      // Generate custom permission: module.custom_action
      return `${module}.${custom_action.toLowerCase().replace(/\s+/g, '_')}`;
    }
  };

  const handleAdd = useCallback(
    async (values, { resetForm }) => {
      try {
        const permission = generatePermission(values);
        const payload = {
          permission,
          module: values.module,
          action_type: values.action_type,
          custom_action: values.custom_action || null,
        };

        const res = await dispatch(createUserPermission(payload));
        if (res.error) return;
        console.log(res);
        dispatch(fetchUserPermissions());
        resetForm();
        setOpen(false);
        successMessage("Permission added successfully!");
      } catch (error) {
        console.error("Add permission failed:", error);
        errorMessage("Failed to add permission. Please try again.");
      }
    },
    [dispatch]
  );

  const handleDeleteClick = useCallback((row) => {
    setDeleteDialog({
      open: true,
      id: row.id,
      permission: row.permission,
      loading: false,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.id) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await dispatch(deleteUserPermission(deleteDialog.id)).unwrap();
      successMessage("Permission deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      errorMessage("Failed to delete permission. Please try again.");
    } finally {
      setDeleteDialog({ open: false, id: null, permission: "", loading: false });
    }
  }, [deleteDialog.id, dispatch]);

  const handleUpdate = useCallback((row) => {
    setEditData(row);
    setEditOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditData(null);
  }, []);

  const handleEditSubmit = useCallback(
    async (values, { resetForm }) => {
      try {
        const permission = generatePermission(values);
        const payload = {
          permission,
          module: values.module,
          action_type: values.action_type,
          custom_action: values.custom_action || null,
          group: values.group,
        };

        const res = await dispatch(
          updateUserPermission({ id: editData.id, data: payload })
        );
        if (res.error) return;
        resetForm();
        handleEditClose();
        successMessage("Permission updated successfully!");
      } catch (error) {
        console.error("Update failed:", error);
        errorMessage("Failed to update permission. Please try again.");
      }
    },
    [dispatch, editData, handleEditClose]
  );

  const handleStatusChange = useCallback(
    (row, checked) => {
      const newStatus = checked ? 1 : 0;
      dispatch(
        updateUserPermission({
          id: row.id,
          data: { ...row, status: newStatus },
        })
      );
    },
    [dispatch]
  );

  const getSplitData = (permission) => {
    if (!permission) return "";
    const parts = permission.split(".");
    return parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "";
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "module",
        header: "Module",
        size: 150,
        Cell: ({ cell }) => (
          <Chip
            label={capitalize(cell.getValue())}
            size="small"
            color="secondary"
            variant="filled"
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Permission",
        size: 300,
        Cell: ({ cell }) => (
          <Typography variant="body2" fontWeight={500}>
            {getSplitData(cell.getValue())}
          </Typography>
        ),
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
            {/* <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => handleUpdate(row.original)}
              >
                <BiSolidEditAlt size={18} />
              </IconButton>
            </Tooltip> */}
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => handleDeleteClick(row.original)}
              >
                <RiDeleteBinLine size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleStatusChange, handleUpdate, handleDeleteClick]
  );

  // CSV export
  const downloadCSV = useCallback(() => {
    const headers = ["Module", "Permission", "Type", "Group", "Status"];
    const rows = filteredPermissions.map((row) => [
      `"${String(row.module || "").replace(/"/g, '""')}"`,
      `"${String(row.permission || "").replace(/"/g, '""')}"`,
      `"${String(row.action_type || "").replace(/"/g, '""')}"`,
      `"${String(row.group || "").replace(/"/g, '""')}"`,
      `"${row.status ? "Active" : "Inactive"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Permissions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredPermissions]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;

    const printWindow = window.open("", "_blank");
    const tableHTML = tableContainerRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Permissions List</title>
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
          <h2>Permissions List</h2>
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

  // Initial values generator
  const getInitialValues = (isEdit = false, data = null) => {
    if (isEdit && data) {
      return {
        module: data.module || "",
        action_type: data.action_type || ACTION_TYPE.CRUD,
        custom_action: data.custom_action || "",
      };
    }

    return {
      module: "",
      action_type: ACTION_TYPE.CRUD,
      custom_action: "",
      group: "",
    };
  };

  // Form fields component
  const FormFields = ({ values, errors, touched, handleChange, setFieldValue }) => (
    <Grid container rowSpacing={2} columnSpacing={3}>
      <Grid size={{ xs: 12 }}>
        <TextField
          select
          name="module"
          label="Module"
          size="small"
          fullWidth
          margin="dense"
          value={values.module}
          onChange={handleChange}
          error={touched.module && Boolean(errors.module)}
          helperText={touched.module && errors.module}
        >
          <MenuItem value="">
            <em>Select Module</em>
          </MenuItem>
          {MODULES.map((mod) => (
            <MenuItem key={mod.value} value={mod.value}>
              {mod.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <FormControl component="fieldset" margin="dense">
          <FormLabel component="legend">Action Type</FormLabel>
          <RadioGroup
            row
            name="action_type"
            value={values.action_type}
            onChange={(e) => {
              setFieldValue("action_type", e.target.value);
              // Clear custom action when switching to CRUD
              if (e.target.value === ACTION_TYPE.CRUD) {
                setFieldValue("custom_action", "");
              }
            }}
          >
            <FormControlLabel
              value={ACTION_TYPE.CRUD}
              control={<Radio />}
              label="CRUD (Create, Read, Update, Delete)"
            />
            <FormControlLabel
              value={ACTION_TYPE.OTHER}
              control={<Radio />}
              label="Other (Custom Action)"
            />
          </RadioGroup>
        </FormControl>
      </Grid>

      {values.action_type === ACTION_TYPE.OTHER && (
        <Grid size={{ xs: 12 }}>
          <TextField
            name="custom_action"
            label="Custom Action"
            size="small"
            fullWidth
            margin="dense"
            value={values.custom_action}
            onChange={handleChange}
            error={touched.custom_action && Boolean(errors.custom_action)}
            helperText={touched.custom_action && errors.custom_action}
            placeholder="e.g., approve, reject, export"
          />
        </Grid>
      )}

      {/* Preview of generated permission */}
      {values.module && (
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: "grey.100",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.300",
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Generated Permission:
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {values.action_type === ACTION_TYPE.CRUD
                ? `${values.module}.create, ${values.module}.read, ${values.module}.update, ${values.module}.delete`
                : values.custom_action
                  ? `${values.module}.${values.custom_action.toLowerCase().replace(/\s+/g, '_')}`
                  : `${values.module}.[custom_action]`}
            </Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );

  return (
    <>
      {/* Header */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Permissions</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Permission
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <Grid size={12}>
        <Paper
          elevation={0}
          ref={tableContainerRef}
          sx={{
            width: "100%",
            overflow: "hidden",
            backgroundColor: "#fff",
            px: 2,
            py: 1,
          }}
        >
          <MaterialReactTable
            columns={columns}
            data={paginatedData}
            getRowId={(row) => row.id}
            rowCount={filteredPermissions.length}
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
                <Typography variant="h6" className="page-title">
                  Permissions List
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
      <BootstrapDialog
        onClose={() => setOpen(false)}
        open={open}
        fullWidth
        maxWidth="sm"
      >
        <BootstrapDialogTitle onClose={() => setOpen(false)}>
          Add Permission
        </BootstrapDialogTitle>
        <Formik
          initialValues={getInitialValues(false)}
          validationSchema={createValidationSchema()}
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
                />
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setOpen(false)}
                >
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
      <BootstrapDialog
        onClose={handleEditClose}
        open={editOpen}
        fullWidth
        maxWidth="sm"
      >
        <BootstrapDialogTitle onClose={handleEditClose}>
          Edit Permission
        </BootstrapDialogTitle>
        <Formik
          enableReinitialize
          initialValues={getInitialValues(true, editData)}
          validationSchema={createValidationSchema()}
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
        onClose={() =>
          !deleteDialog.loading &&
          setDeleteDialog({ open: false, id: null, permission: "", loading: false })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{deleteDialog.permission}</strong>?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() =>
              setDeleteDialog({
                open: false,
                id: null,
                permission: "",
                loading: false,
              })
            }
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

export default Permissions;
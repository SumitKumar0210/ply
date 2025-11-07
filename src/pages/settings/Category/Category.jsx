import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { debounce } from "lodash";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  MenuItem,
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
import { BsCloudDownload } from "react-icons/bs";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";

import { fetchActiveGroup } from "../slices/groupSlice";
import {
  addCategory,
  fetchCategories,
  statusUpdate,
  deleteCategory,
  updateCategory,
  sequenceUpdate,
} from "../slices/categorySlice";
import { useDispatch, useSelector } from "react-redux";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

// Validation schemas (defined outside component for performance)
const addValidationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Category must be at least 2 characters")
    .required("Category is required"),
  group_id: Yup.string().required("Group is required"),
});

const editValidationSchema = Yup.object({
  name: Yup.string().required("Category is required"),
  group_id: Yup.string().required("Group is required"),
});

const Category = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  // Redux state
  const { data = [], loading } = useSelector((state) => state.category);
  const { data: groups = [] } = useSelector((state) => state.group);

  // Modal states
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  // Local state for sequence inputs
  const [sequenceValues, setSequenceValues] = useState({});

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Initialize sequence values when data loads
  useEffect(() => {
    if (data.length > 0) {
      const initialSequences = {};
      data.forEach((item) => {
        initialSequences[item.id] = item.sequence || "";
      });
      setSequenceValues(initialSequences);
    }
  }, [data]);

  // Fetch groups when modals open
  useEffect(() => {
    if (openAdd || openEdit) {
      dispatch(fetchActiveGroup());
    }
  }, [openAdd, openEdit, dispatch]);

  // Modal handlers
  const handleOpenAdd = useCallback(() => setOpenAdd(true), []);
  const handleCloseAdd = useCallback(() => setOpenAdd(false), []);

  const handleOpenEdit = useCallback((row) => {
    setEditData(row);
    setOpenEdit(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditData(null);
    setOpenEdit(false);
  }, []);

  // Add category
  const handleAddSubmit = useCallback(
    async (values, { resetForm, setSubmitting }) => {
      try {
        const payload = {
          name: values.name,
          group_id: Number(values.group_id),
        };
        const res = await dispatch(addCategory(payload));
        if (res.error) return;
        resetForm();
        handleCloseAdd();
      } catch (error) {
        console.error("Add category error:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [dispatch, handleCloseAdd]
  );

  // Update category
  const handleEditSubmit = useCallback(
    async (values, { resetForm, setSubmitting }) => {
      try {
        const payload = {
          id: editData.id,
          name: values.name,
          group_id: Number(values.group_id),
        };
        const res = await dispatch(updateCategory(payload));
        if (res.error) {
          console.error("Update failed:", res.payload);
          return;
        }
        resetForm();
        handleCloseEdit();
      } catch (error) {
        console.error("Update error:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [dispatch, editData, handleCloseEdit]
  );

  // Update sequence - debounced API call
  const debouncedSequenceUpdate = useMemo(
    () =>
      debounce((id, value) => {
        if (!value || isNaN(value)) return;
        const params = {
          id: id,
          sequence: Number(value),
        };
        dispatch(sequenceUpdate(params));
      }, 2000),
    [dispatch]
  );

  // Handle sequence input change
  const handleSequenceChange = useCallback(
    (id, value) => {
      // Update local state immediately for instant UI feedback
      setSequenceValues((prev) => ({
        ...prev,
        [id]: value,
      }));

      // Debounce the API call
      debouncedSequenceUpdate(id, value);
    },
    [debouncedSequenceUpdate]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSequenceUpdate.cancel();
    };
  }, [debouncedSequenceUpdate]);

  // Delete category
  const handleDelete = useCallback(
    (id) => {
      if (window.confirm("Are you sure you want to delete this category?")) {
        dispatch(deleteCategory(id));
      }
    },
    [dispatch]
  );

  // Handle status change
  const handleStatusChange = useCallback(
    (row, checked) => {
      const newStatus = checked ? 1 : 0;
      dispatch(statusUpdate({ ...row, status: newStatus }));
    },
    [dispatch]
  );

  // Columns definition
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Category Name",
      },
      {
        accessorKey: "group",
        header: "Group",
        Cell: ({ row }) => row.original.group?.name || "—",
      },
      {
        accessorKey: "sequence",
        header: "Sequence",
        Cell: ({ row }) => (
          <TextField
            type="number"
            size="small"
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
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => handleStatusChange(row.original, e.target.checked)}
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
              <IconButton onClick={() => handleOpenEdit(row.original)}>
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
    [handleSequenceChange, handleStatusChange, handleOpenEdit, handleDelete, sequenceValues]
  );

  // CSV export
  const downloadCSV = useCallback(() => {
    const headers = columns.filter((c) => c.accessorKey).map((c) => c.header);
    const rows = data.map((row) =>
      columns
        .filter((c) => c.accessorKey)
        .map((c) => {
          let val;
          if (c.accessorKey === "group") {
            val = row.group?.name || "";
          } else if (c.accessorKey.includes(".")) {
            val = c.accessorKey.split(".").reduce((acc, k) => acc?.[k], row);
          } else {
            val = row[c.accessorKey];
          }
          return `"${val ?? ""}"`;
        })
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `categories_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, data]);

  return (
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
            getRowId={(row) => row.id}
            state={{ isLoading: loading }}
            enableTopToolbar
            enableGlobalFilter
            enableColumnFilters
            enablePagination
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
                  width: "100%",
                  p: 1,
                }}
              >
                <Typography variant="h6">Category</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />
                  <MRT_ToolbarInternalButtons table={table} />
                  <Tooltip title="Download CSV">
                    <IconButton onClick={downloadCSV}>
                      <BsCloudDownload size={20} />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAdd}
                  >
                    Add Category
                  </Button>
                </Box>
              </Box>
            )}
          />
        </Paper>
      </Grid>

      {/* Add Modal */}
      <BootstrapDialog open={openAdd} onClose={handleCloseAdd} fullWidth maxWidth="xs">
        <DialogTitle>
          Add Category
          <IconButton
            aria-label="close"
            onClick={handleCloseAdd}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Formik
          initialValues={{ name: "", group_id: "" }}
          validationSchema={addValidationSchema}
          onSubmit={handleAddSubmit}
        >
          {({ values, errors, touched, handleChange, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  name="name"
                  label="Category"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 3 }}
                  autoFocus
                />
                <TextField
                  select
                  fullWidth
                  name="group_id"
                  label="Group"
                  variant="standard"
                  value={values.group_id}
                  onChange={handleChange}
                  error={touched.group_id && Boolean(errors.group_id)}
                  helperText={touched.group_id && errors.group_id}
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </MenuItem>
                  ))}
                </TextField>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseAdd} variant="outlined" color="error" disabled={isSubmitting}>
                  Close
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Modal */}
      <BootstrapDialog open={openEdit} onClose={handleCloseEdit} fullWidth maxWidth="xs">
        <DialogTitle>
          Edit Category
          <IconButton
            aria-label="close"
            onClick={handleCloseEdit}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Formik
          initialValues={{
            name: editData?.name || "",
            group_id: editData?.group_id ? String(editData.group_id) : "",
          }}
          validationSchema={editValidationSchema}
          enableReinitialize
          onSubmit={handleEditSubmit}
        >
          {({ values, errors, touched, handleChange, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  name="name"
                  label="Category"
                  variant="standard"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 3 }}
                  autoFocus
                />
                <TextField
                  select
                  fullWidth
                  name="group_id"
                  label="Group"
                  variant="standard"
                  value={values.group_id}
                  onChange={handleChange}
                  error={touched.group_id && Boolean(errors.group_id)}
                  helperText={touched.group_id && errors.group_id}
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </MenuItem>
                  ))}
                </TextField>
              </DialogContent>
              <DialogActions>
                <Button variant="outlined" color="error" onClick={handleCloseEdit} disabled={isSubmitting}>
                  Close
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>
    </Grid>
  );
};

export default Category;
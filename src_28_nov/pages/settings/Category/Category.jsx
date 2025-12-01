import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";

import {
  fetchActiveGroup,
} from "../slices/groupSlice";
import {
  addCategory,
  fetchCategories,
  statusUpdate,
  deleteCategory,
  updateCategory,
} from "../slices/categorySlice";
import { useDispatch, useSelector } from "react-redux";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

const Category = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  // redux state
  const { data: data = []} = useSelector((state) => state.category);
  const { data: groups = [] } = useSelector((state) => state.group);

  // modal states
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  // fetch initial data
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // fetch initial data
  useEffect(() => {
    dispatch(fetchActiveGroup());
  }, [openAdd, openEdit]);

  // open modals
  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const handleOpenEdit = (row) => {
    setEditData(row);
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setEditData(null);
    setOpenEdit(false);
  };

  // add
  const handleAddSubmit = async (values, { resetForm }) => {
    const payload = {
      name: values.name,
      group_id: Number(values.group_id),
    };
    const res = await dispatch(addCategory(payload));
    if (res.error) return ; 
    resetForm();
    handleCloseAdd();
  };

  // update
  const handleEditSubmit = async (values, { resetForm }) => {
    const payload = {
      id: editData.id,
      name: values.name,
      group_id: Number(values.group_id),
    };
    try{
      const res = await dispatch(updateCategory(payload));
      if (res.error) {
      console.log("Update failed:", res.payload);
        return;
      }
      resetForm();
      handleCloseEdit();
    }catch(error){

    }
  };

  // delete
  const handleDelete = (id) => {
    dispatch(deleteCategory(id));
  };

  // columns
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
    [dispatch]
  );

  // CSV export
  const downloadCSV = () => {
    const headers = columns.filter((c) => c.accessorKey).map((c) => c.header);
    const rows = data.map((row) =>
      columns
        .filter((c) => c.accessorKey)
        .map((c) => {
          const val = c.accessorKey.includes(".")
            ? c.accessorKey.split(".").reduce((acc, k) => acc?.[k], row)
            : row[c.accessorKey];
          return `"${val ?? ""}"`;
        })
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "categories.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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
            getRowId={(row) => row.id}
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
          validationSchema={Yup.object({
            name: Yup.string()
            .min(2, "Category must be at least 2 characters")
            .required("Category is required"),
            group_id: Yup.string().required("Group is required"),
          })}
          onSubmit={handleAddSubmit}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
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
                  sx={{marginBottom: 1}}
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </MenuItem>
                  ))}
                </TextField>
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
                  />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseAdd} variant="outlined" color="error">
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
          validationSchema={Yup.object({
            name: Yup.string().required("Category is required"),
            group_id: Yup.string().required("Group is required"),
          })}
          enableReinitialize
          onSubmit={handleEditSubmit}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
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
                  sx={{marginBottom: 1}}
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </MenuItem>
                  ))}
                </TextField>
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
                  />
              </DialogContent>
              <DialogActions>
                <Button variant="outlined" color="error" onClick={handleCloseEdit}>
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
    </Grid>
  );
};

export default Category;

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
  addBranch,
  fetchBranches,
  statusUpdate,
  deleteBranch,
  updateBranch,
} from "../slices/branchSlice";
import { useDispatch, useSelector } from "react-redux";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

const Branch = () => {
  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, "Enter a valid 10 digit mobile")
      .required("Mobile is required"),
    address: Yup.string().required("Address is required"),
  });

  const { data: branchData = [] } = useSelector((state) => state.branch);

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  // modal states
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleAdd = async (values, resetForm) => {
    await dispatch(addBranch(values));
    resetForm();
    setOpen(false);
  };

  const handleEditSubmit = async (values, resetForm) => {
    await dispatch(updateBranch({ ...values, id: editData.id }));
    resetForm();
    setEditOpen(false);
    setEditData(null);
  };

  const handleDelete = (id) => dispatch(deleteBranch(id));

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "address", header: "Address" },
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
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => {
                  setEditData(row.original);
                  setEditOpen(true);
                }}
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
    [dispatch]
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <MaterialReactTable
            columns={columns}
            data={branchData}
            getRowId={(row) => row.id}
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
                <Typography variant="h6">Branch</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />
                  <MRT_ToolbarInternalButtons table={table} />
                  <Tooltip title="Print">
                    <IconButton>
                      <FiPrinter />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download CSV">
                    <IconButton>
                      <BsCloudDownload />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                  >
                    Add Branch
                  </Button>
                </Box>
              </Box>
            )}
          />
        </Paper>
      </Grid>

      {/* Add Modal */}
      <BootstrapDialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Add Branch</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{ name: "", mobile: "", address: "" }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => handleAdd(values, resetForm)}
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  name="mobile"
                  label="Mobile"
                  value={values.mobile}
                  onChange={handleChange}
                  error={touched.mobile && Boolean(errors.mobile)}
                  helperText={touched.mobile && errors.mobile}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  name="address"
                  label="Address"
                  multiline
                  rows={3}
                  value={values.address}
                  onChange={handleChange}
                  error={touched.address && Boolean(errors.address)}
                  helperText={touched.address && errors.address}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpen(false)}>Close</Button>
                <Button type="submit" variant="contained">
                  Submit
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Modal */}
      <BootstrapDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
      >
        <DialogTitle>Edit Branch</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setEditOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{
            name: editData?.name || "",
            mobile: editData?.mobile || "",
            address: editData?.address || "",
          }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={(values, { resetForm }) =>
            handleEditSubmit(values, resetForm)
          }
        >
          {({ values, errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  value={values.name}
                  onChange={handleChange}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  name="mobile"
                  label="Mobile"
                  value={values.mobile}
                  onChange={handleChange}
                  error={touched.mobile && Boolean(errors.mobile)}
                  helperText={touched.mobile && errors.mobile}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  name="address"
                  label="Address"
                  multiline
                  rows={3}
                  value={values.address}
                  onChange={handleChange}
                  error={touched.address && Boolean(errors.address)}
                  helperText={touched.address && errors.address}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditOpen(false)}>Close</Button>
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

export default Branch;

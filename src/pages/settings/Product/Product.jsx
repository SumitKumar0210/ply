import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
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
  CircularProgress,
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, addProduct, deleteProduct, updateProduct, statusUpdate } from "../slices/productSlice";
import { fetchActiveGroup } from "../slices/groupSlice";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import { compressImage } from "../../../components/imageCompressor/imageCompressor";
import { successMessage, errorMessage } from "../../../toast";
import Profile from "../../../assets/images/profile.jpg";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const Product = () => {
  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    model: Yup.string().required("Model is required"),
    size: Yup.string().required("Size is required"),
    color: Yup.string().required("Color is required"),
    hsn_code: Yup.string().required("HSN Code is required"),
    rrp: Yup.number()
      .typeError("RRP must be a number")
      .required("RRP is required"),
    product_type: Yup.string().required("Product Type is required"),
    group_id: Yup.string().required("Group is required"),
    image: Yup.mixed()
      .required("Image is required")
      .test("fileType", "Only images are allowed", (value) =>
        value
          ? ["image/jpeg", "image/png", "image/jpg"].includes(value.type)
          : false
      ),
  });

  // Validation Schema (for Edit → image optional)
  const editValidationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    model: Yup.string().required("Model is required"),
    size: Yup.string().required("Size is required"),
    color: Yup.string().required("Color is required"),
    hsn_code: Yup.string().required("HSN Code is required"),
    rrp: Yup.number()
      .typeError("RRP must be a number")
      .required("RRP is required"),
    product_type: Yup.string().required("Product Type is required"),
    group_id: Yup.string().required("Group is required"),
    image: Yup.mixed()
      .nullable()
      .test("fileType", "Only images are allowed", (value) =>
        !value || ["image/jpeg", "image/png", "image/jpg"].includes(value.type)
      ),
  });

  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();
  const { data: data = [], loading } = useSelector((state) => state.product);
  const { data: groups = [] } = useSelector((state) => state.group);

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [submissionLoader, setSubmissionLoader] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchActiveGroup());
  }, [dispatch, open, editOpen]);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAdd = async (values, { resetForm }) => {
    setSubmissionLoader(true);
    try {
      const res = await dispatch(addProduct(values));
      if (res.error) return;
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Add product failed:", error);
    }
    setSubmissionLoader(false);
  };

  const handleEditOpen = (row) => {
    setEditData(row);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const handleEditSubmit = async (values, { resetForm }) => {
    setSubmissionLoader(true);
    const res = await dispatch(updateProduct({ updated: { id: editData.id, ...values } }));
    if (res.error) return;
    resetForm();
    setSubmissionLoader(false);
    handleEditClose();
  };

  const handleDelete = (id) => {
    dispatch(deleteProduct(id));
  };

  // Handle image compression
  const handleImageChange = async (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
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
          `Image compressed: ${originalSize}KB → ${compressedSize}KB (${reduction}% reduction)`
        );

        setFieldValue("image", compressed);
      } catch (error) {
        console.error("Image compression failed:", error);
        errorMessage("Failed to compress image. Using original file.");
        setFieldValue("image", file);
      } finally {
        setCompressingImage(false);
      }
    } else {
      setFieldValue("image", file);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        size: 80,
        Cell: ({ row }) => (
          <ImagePreviewDialog
            imageUrl={row.original.image ? mediaUrl + row.original.image : Profile}
            alt={row.original.name}
          />
        ),
      },
      { accessorKey: "name", header: "Name", size: 150 },
      { accessorKey: "model", header: "Model", size: 120 },
      { accessorKey: "size", header: "Size", size: 100 },
      { accessorKey: "color", header: "Color", size: 100 },
      { accessorKey: "hsn_code", header: "HSN Code", size: 120 },
      { accessorKey: "rrp", header: "RRP", size: 100 },
      { accessorKey: "product_type", header: "Product Type", size: 150 },
      { 
        accessorKey: "group_id", 
        header: "Group", 
        size: 100, 
        Cell: ({ row }) => row.original.group?.name || "—"
      },
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
              <IconButton
                color="primary"
                onClick={() => handleEditOpen(row.original)}
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
    [dispatch, mediaUrl]
  );

  // Function to download CSV from data
  const downloadCSV = () => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);
    const rows = data.map((row) =>
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
    link.setAttribute("download", "Product_data.csv");
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
    <>
      <Grid container spacing={1}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff" }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={data}
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
              state={{ isLoading: loading }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                  minWidth: "1200px",
                },
              }}
              muiTableBodyCellProps={{
                sx: { whiteSpace: "wrap", width: "100px" },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
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
                    Products
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
                      Add Product
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add Product Dialog */}
      <BootstrapDialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add Product</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{
            name: "",
            model: "",
            size: "",
            color: "",
            hsn_code: "",
            rrp: "",
            product_type: "",
            group_id: "",
            image: null,
          }}
          validationSchema={validationSchema}
          onSubmit={handleAdd}
        >
          {({ values, errors, touched, handleChange, setFieldValue }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
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
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      id="model"
                      name="model"
                      label="Model"
                      variant="standard"
                      value={values.model}
                      onChange={handleChange}
                      error={touched.model && Boolean(errors.model)}
                      helperText={touched.model && errors.model}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      id="size"
                      name="size"
                      label="Size"
                      variant="standard"
                      value={values.size}
                      onChange={handleChange}
                      error={touched.size && Boolean(errors.size)}
                      helperText={touched.size && errors.size}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      id="color"
                      name="color"
                      label="Color"
                      variant="standard"
                      value={values.color}
                      onChange={handleChange}
                      error={touched.color && Boolean(errors.color)}
                      helperText={touched.color && errors.color}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      id="hsn_code"
                      name="hsn_code"
                      label="HSN Code"
                      variant="standard"
                      value={values.hsn_code}
                      onChange={handleChange}
                      error={touched.hsn_code && Boolean(errors.hsn_code)}
                      helperText={touched.hsn_code && errors.hsn_code}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      id="rrp"
                      name="rrp"
                      label="RRP"
                      type="number"
                      variant="standard"
                      value={values.rrp}
                      onChange={handleChange}
                      error={touched.rrp && Boolean(errors.rrp)}
                      helperText={touched.rrp && errors.rrp}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      id="product_type"
                      name="product_type"
                      label="Product Type"
                      variant="standard"
                      value={values.product_type}
                      onChange={handleChange}
                      error={touched.product_type && Boolean(errors.product_type)}
                      helperText={touched.product_type && errors.product_type}
                    >
                      <MenuItem value="Electronics">Electronics</MenuItem>
                      <MenuItem value="Hardware">Hardware</MenuItem>
                      <MenuItem value="Software">Software</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      id="group_id"
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
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }} sx={{ mb: 3 }}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid size={{ xs: 8 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="label"
                          startIcon={<UploadFileIcon />}
                          fullWidth
                          disabled={compressingImage}
                        >
                          {compressingImage ? "Compressing..." : "Upload Image"}
                          <input
                            hidden
                            type="file"
                            inputProps={{
                              accept: "image/*",
                            }}
                            onChange={(event) => handleImageChange(event, setFieldValue)}
                          />
                        </Button>
                        {touched.image && errors.image && (
                          <div style={{ color: "red", fontSize: "0.8rem" }}>
                            {errors.image}
                          </div>
                        )}
                      </Grid>
                      <Grid size={{ xs: 4 }}>
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
                <Button variant="outlined" color="error" onClick={handleClose}>
                  Close
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={submissionLoader}
                  startIcon={submissionLoader ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {submissionLoader ? "Saving..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Product Dialog */}
      <BootstrapDialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit Product</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleEditClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        {editData && (
          <Formik
            initialValues={{
              name: editData.name || "",
              model: editData.model || "",
              size: editData.size || "",
              color: editData.color || "",
              hsn_code: editData.hsn_code || "",
              rrp: editData.rrp || "",
              product_type: editData.product_type || "",
              group_id: editData.group_id || "",
              image: null,
            }}
            validationSchema={editValidationSchema}
            onSubmit={handleEditSubmit}
          >
            {({ values, errors, touched, handleChange, setFieldValue }) => (
              <Form>
                <DialogContent dividers>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
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
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        id="model"
                        name="model"
                        label="Model"
                        variant="standard"
                        value={values.model}
                        onChange={handleChange}
                        error={touched.model && Boolean(errors.model)}
                        helperText={touched.model && errors.model}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        id="size"
                        name="size"
                        label="Size"
                        variant="standard"
                        value={values.size}
                        onChange={handleChange}
                        error={touched.size && Boolean(errors.size)}
                        helperText={touched.size && errors.size}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        id="color"
                        name="color"
                        label="Color"
                        variant="standard"
                        value={values.color}
                        onChange={handleChange}
                        error={touched.color && Boolean(errors.color)}
                        helperText={touched.color && errors.color}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        id="hsn_code"
                        name="hsn_code"
                        label="HSN Code"
                        variant="standard"
                        value={values.hsn_code}
                        onChange={handleChange}
                        error={touched.hsn_code && Boolean(errors.hsn_code)}
                        helperText={touched.hsn_code && errors.hsn_code}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        id="rrp"
                        name="rrp"
                        label="RRP"
                        type="number"
                        variant="standard"
                        value={values.rrp}
                        onChange={handleChange}
                        error={touched.rrp && Boolean(errors.rrp)}
                        helperText={touched.rrp && errors.rrp}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        id="product_type"
                        name="product_type"
                        label="Product Type"
                        variant="standard"
                        value={values.product_type}
                        onChange={handleChange}
                        error={touched.product_type && Boolean(errors.product_type)}
                        helperText={touched.product_type && errors.product_type}
                      >
                        <MenuItem value="Electronics">Electronics</MenuItem>
                        <MenuItem value="Hardware">Hardware</MenuItem>
                        <MenuItem value="Software">Software</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        id="group_id"
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
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }} sx={{ mb: 3 }}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid size={{ xs: 8 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            component="label"
                            startIcon={<UploadFileIcon />}
                            fullWidth
                            disabled={compressingImage}
                          >
                            {compressingImage ? "Compressing..." : "Upload Image"}
                            <input
                              hidden
                              type="file"
                              inputProps={{
                                accept: "image/*",
                              }}
                              onChange={(event) => handleImageChange(event, setFieldValue)}
                            />
                          </Button>
                          {touched.image && errors.image && (
                            <div style={{ color: "red", fontSize: "0.8rem" }}>
                              {errors.image}
                            </div>
                          )}
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          {(values.image || editData.image) && (
                            <img
                              src={
                                values.image
                                  ? URL.createObjectURL(values.image)
                                  : mediaUrl + editData.image
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
                          )}
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </DialogContent>

                <DialogActions sx={{ gap: 1, mb: 1 }}>
                  <Button variant="outlined" color="error" onClick={handleEditClose}>
                    Close
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={submissionLoader}
                    startIcon={submissionLoader ? <CircularProgress size={18} color="inherit" /> : null}
                  >
                    {submissionLoader ? "Saving..." : "Save changes"}
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

export default Product;
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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
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
import {
  fetchMaterials,
  addMaterial,
  deleteMaterial,
  updateMaterial,
  statusUpdate
} from "../slices/materialSlice";
import { fetchActiveCategories } from "../slices/categorySlice";
import { fetchActiveGroup } from "../slices/groupSlice";
import { fetchActiveUnitOfMeasurements } from "../slices/unitOfMeasurementsSlice";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
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

//  Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  unit_of_measurement_id: Yup.string().required("UOM is required"),
  size: Yup.string().required("Size is required"),
  price: Yup.number()
    .typeError("Price must be a number")
    .positive("Price must be positive")
    .required("Price is required"),
  category_id: Yup.string().required("Category is required"),
  group_id: Yup.string().required("Group is required"),
  opening_stock: Yup.number()
    .typeError("Must be a number")
    .min(0, "Cannot be negative")
    .required("Opening stock is required"),
  urgently_required: Yup.string().required("Urgent is required"),
  tag: Yup.string().required("Tag is required"),
  remark: Yup.string().required("Remarks are required"),
  image: Yup.mixed().nullable(),
});

const Material = () => {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();

  const { data: data = [], loading } = useSelector((state) => state.material);
  const { data: groups = [] } = useSelector((state) => state.group);
  const { data: categories = [] } = useSelector((state) => state.category);
  const { data: uoms = [] } = useSelector((state) => state.unitOfMeasurement);

  const tableContainerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [submissionLoader, setSubmissionLoader] = useState(false);

  useEffect(() => {
    dispatch(fetchMaterials());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchActiveCategories());
    dispatch(fetchActiveGroup());
    dispatch(fetchActiveUnitOfMeasurements());
  }, [dispatch, open, editOpen]);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAdd = async (values, { resetForm }) => {
    setSubmissionLoader(true);
    try {
      const res = await dispatch(addMaterial(values));
      if (res.error) return;
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Add material failed:", error);
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
    const res = await dispatch(updateMaterial({ updated: { id: editData.id, ...values } }));
    if (res.error) return;
    resetForm();
    setSubmissionLoader(false);
    handleEditClose();
  };

  const handleDelete = (id) => {
    dispatch(deleteMaterial(id));
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
      { accessorKey: "name", header: "Name", size: 200 },
      {
        accessorKey: "unit_of_measurement_id",
        header: "UOM",
        size: 50,
        Cell: ({ row }) => row.original.unit_of_measurement?.name || "—"
      },
      { accessorKey: "size", header: "Size", size: 50 },
      { accessorKey: "price", header: "Price", size: 75 },
      {
        accessorKey: "category_id",
        header: "Category",
        size: 100,
        Cell: ({ row }) => row.original.category?.name || "—"
      },
      {
        accessorKey: "group_id",
        header: "Group",
        size: 100,
        Cell: ({ row }) => row.original.group?.name || "—"
      },
      { accessorKey: "opening_stock", header: "Opening Stock", size: 50 },
      {
        accessorKey: "urgently_required",
        header: "Urgent",
        size: 100,
        Cell: ({ row }) => {
          const value = row.original.urgently_required;
          return value == "1" ? "Yes" : value == "0" ? "No" : "—";
        },
      },
      { accessorKey: "tag", header: "Tag", size: 50 },
      { accessorKey: "remark", header: "Remarks", size: 100 },
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
              <IconButton color="primary" onClick={() => handleEditOpen(row.original)}>
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
    [dispatch, mediaUrl]
  );

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
    link.setAttribute("download", "Material_data.csv");
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

  return (
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
                  Material
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
                    Add Material
                  </Button>
                </Box>
              </Box>
            )}
          />
        </Paper>
      </Grid>

      {/* Add Material Modal */}
      <BootstrapDialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add Material</DialogTitle>
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
            unit_of_measurement_id: "",
            size: "",
            price: "",
            category_id: "",
            image: null,
            group_id: "",
            opening_stock: "",
            urgently_required: "0",
            tag: "",
            remark: "",
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
                      select
                      fullWidth
                      id="unit_of_measurement_id"
                      name="unit_of_measurement_id"
                      label="UOM"
                      variant="standard"
                      value={values.unit_of_measurement_id}
                      onChange={handleChange}
                      error={touched.unit_of_measurement_id && Boolean(errors.unit_of_measurement_id)}
                      helperText={touched.unit_of_measurement_id && errors.unit_of_measurement_id}
                    >
                      {uoms.map((uom) => (
                        <MenuItem key={uom.id} value={String(uom.id)}>
                          {uom.name}
                        </MenuItem>
                      ))}
                    </TextField>
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
                      id="price"
                      name="price"
                      label="Price"
                      type="number"
                      variant="standard"
                      value={values.price}
                      onChange={handleChange}
                      error={touched.price && Boolean(errors.price)}
                      helperText={touched.price && errors.price}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      id="category_id"
                      name="category_id"
                      label="Category"
                      variant="standard"
                      value={values.category_id}
                      onChange={handleChange}
                      error={touched.category_id && Boolean(errors.category_id)}
                      helperText={touched.category_id && errors.category_id}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </MenuItem>
                      ))}
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

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      id="opening_stock"
                      name="opening_stock"
                      label="Opening Stock"
                      type="number"
                      variant="standard"
                      value={values.opening_stock}
                      onChange={handleChange}
                      error={touched.opening_stock && Boolean(errors.opening_stock)}
                      helperText={touched.opening_stock && errors.opening_stock}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      id="urgently_required"
                      name="urgently_required"
                      label="Urgent Requirement"
                      variant="standard"
                      value={values.urgently_required}
                      onChange={handleChange}
                      error={touched.urgently_required && Boolean(errors.urgently_required)}
                      helperText={touched.urgently_required && errors.urgently_required}
                    >
                      <MenuItem value="0">No</MenuItem>
                      <MenuItem value="1">Yes</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      id="tag"
                      name="tag"
                      label="Tag"
                      variant="standard"
                      value={values.tag}
                      onChange={handleChange}
                      error={touched.tag && Boolean(errors.tag)}
                      helperText={touched.tag && errors.tag}
                    >
                      <MenuItem value="material">Material</MenuItem>
                      <MenuItem value="handtool">Hand Tool</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
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
                          <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.image}</div>
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

                  <Grid size={{ xs: 12, md: 12 }} sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      id="remark"
                      name="remark"
                      label="Remarks"
                      variant="standard"
                      multiline
                      minRows={3}
                      value={values.remark}
                      onChange={handleChange}
                      error={touched.remark && Boolean(errors.remark)}
                      helperText={touched.remark && errors.remark}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button variant="outlined" color="error" onClick={handleClose}>
                  Close
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={submissionLoader}
                  startIcon={submissionLoader ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {submissionLoader ? "Saving..." : "Submit"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit Material Modal */}
      <BootstrapDialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit Material</DialogTitle>
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
              unit_of_measurement_id: editData.unit_of_measurement_id || "",
              size: editData.size || "",
              price: editData.price || "",
              category_id: editData.category_id || "",
              group_id: editData.group_id || "",
              opening_stock: editData.opening_stock || "",
              urgently_required: String(editData.urgently_required || 0),
              tag: editData.tag || "",
              remark: editData.remark || "",
              image: null,
            }}
            validationSchema={validationSchema}
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
                        select
                        fullWidth
                        id="unit_of_measurement_id"
                        name="unit_of_measurement_id"
                        label="UOM"
                        variant="standard"
                        value={values.unit_of_measurement_id}
                        onChange={handleChange}
                        error={touched.unit_of_measurement_id && Boolean(errors.unit_of_measurement_id)}
                        helperText={touched.unit_of_measurement_id && errors.unit_of_measurement_id}
                      >
                        {uoms.map((uom) => (
                          <MenuItem key={uom.id} value={String(uom.id)}>
                            {uom.name}
                          </MenuItem>
                        ))}
                      </TextField>
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
                        id="price"
                        name="price"
                        label="Price"
                        type="number"
                        variant="standard"
                        value={values.price}
                        onChange={handleChange}
                        error={touched.price && Boolean(errors.price)}
                        helperText={touched.price && errors.price}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        id="category_id"
                        name="category_id"
                        label="Category"
                        variant="standard"
                        value={values.category_id}
                        onChange={handleChange}
                        error={touched.category_id && Boolean(errors.category_id)}
                        helperText={touched.category_id && errors.category_id}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </MenuItem>
                        ))}
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

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        id="opening_stock"
                        name="opening_stock"
                        label="Opening Stock"
                        type="number"
                        variant="standard"
                        value={values.opening_stock}
                        onChange={handleChange}
                        error={touched.opening_stock && Boolean(errors.opening_stock)}
                        helperText={touched.opening_stock && errors.opening_stock}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        id="urgently_required"
                        name="urgently_required"
                        label="Urgent Requirement"
                        variant="standard"
                        value={values.urgently_required}
                        onChange={handleChange}
                        error={touched.urgently_required && Boolean(errors.urgently_required)}
                        helperText={touched.urgently_required && errors.urgently_required}
                      >
                        <MenuItem value="0">No</MenuItem>
                        <MenuItem value="1">Yes</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        fullWidth
                        id="tag"
                        name="tag"
                        label="Tag"
                        variant="standard"
                        value={values.tag}
                        onChange={handleChange}
                        error={touched.tag && Boolean(errors.tag)}
                        helperText={touched.tag && errors.tag}
                      >
                        <MenuItem value="material">Material</MenuItem>
                        <MenuItem value="handtool">Hand Tool</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid size={{ xs: 8 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            component="label"
                            fullWidth
                            startIcon={<UploadFileIcon />}
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
                            <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.image}</div>
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

                    <Grid size={{ xs: 12, md: 12 }}>
                      <TextField
                        fullWidth
                        id="remark"
                        name="remark"
                        label="Remarks"
                        variant="standard"
                        multiline
                        minRows={3}
                        value={values.remark}
                        onChange={handleChange}
                        error={touched.remark && Boolean(errors.remark)}
                        helperText={touched.remark && errors.remark}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>

                <DialogActions sx={{ gap: 1, mb: 1 }}>
                  <Button variant="outlined" color="error" onClick={handleEditClose}>
                    Close
                  </Button>
                  <Button type="submit" variant="contained" color="primary" disabled={submissionLoader}
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
    </Grid>
  );
};

export default Material;
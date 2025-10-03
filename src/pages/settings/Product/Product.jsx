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
import { fetchGroups } from "../slices/groupSlice";
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

// Dummy Product Data
// const data = [
//   {
//     name: "Product A",
//     model: "MD-100",
//     size: "20 x 20",
//     color: "Red",
//     hsn: "123456",
//     rrp: "5000",
//     type: "Electronics",
//     dealer: "Dealer1",
//     grade: "A",
//     image: "https://placehold.co/400", // sample
//   },
//   {
//     name: "Product B",
//     model: "MD-200",
//     size: "10 x 10",
//     color: "Blue",
//     hsn: "789012",
//     rrp: "3000",
//     type: "Hardware",
//     dealer: "Dealer2",
//     grade: "B",
//     image: "https://placehold.co/400", // sample
//   },
// ];

const Product = () => {
  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
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
    name: Yup.string().required("Name is required"),
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
      .nullable() // 👈 allows null or undefined
      .test("fileType", "Only images are allowed", (value) =>
        !value || ["image/jpeg", "image/png", "image/jpg"].includes(value.type)
      ),
  });
 
 const mediaUrl = import.meta.env.VITE_MEDIA_URL;
   const dispatch = useDispatch();
   const { data: data = [] } = useSelector((state) => state.product);
   const { data: groups = [] } = useSelector((state) => state.group);
 
   const tableContainerRef = useRef(null);
   const [open, setOpen] = useState(false);
   const [editOpen, setEditOpen] = useState(false);
   const [editData, setEditData] = useState(null);
   const [file, setFile] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);

 
 
   useEffect(() => {
     dispatch(fetchProducts());
   }, [dispatch]);
 
   useEffect(() => {
     setFile(null);
     dispatch(fetchGroups());
   }, [open, editOpen]);
 
   const handleClickOpen = () => setOpen(true);
   const handleClose = () => setOpen(false);
 
   
   const handleFileChange = (e) => {
     setFile(e.target.files[0]); 
   };
   
   const handleAdd = async (values, resetForm) => {
    console.log("form submitted")
     try {
       const formData = new FormData();
       
       // append other values
       Object.keys(values).forEach((key) => {
         if (values[key] !== null && values[key] !== undefined) {
           formData.append(key, values[key]);
         }
       });
       
       // append file separately
       if (file) {
         formData.append("image", file);
       }
       
       await dispatch(addProduct(formData)).unwrap();
       
       resetForm();
       handleClose();
     } catch (error) {
       console.error("Error adding product:", error);
     }
   };

   
   const handleEditOpen = (row) => {
     setEditData(row);
     setPreviewUrl('');
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
    console.log('pass')
     await dispatch(updateProduct({updated :{ id: editData.id, ...values }}));
     resetForm();
     handleEditClose();
   };
 
   const handleDelete = (id) => {
     dispatch(deleteProduct(id));
   };
  const columns = useMemo(
    () => [
        {
            accessorKey: "image",
            header: "Image",
            size: 80,
            Cell: ({ row }) => (
                <img
                src={mediaUrl + row.original.image}
                alt={row.original.name}
                style={{
                    width: "40px",
                    height: "40px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                }}
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
        { accessorKey: "group_id", header: "Group", size: 100,  Cell: ({ row }) => row.original.group?.name || row.original.group_id, },
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
    []
  );
    // Function to download CSV from data
  const downloadCSV = () => {
    // Prepare csv header
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);
    // Prepare csv rows
    const rows = data.map((row) =>
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
    link.setAttribute("download", "Material_data.csv");
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
                enableTopToolbar={true}
                enableColumnFilters={true}
                enableSorting={true}
                enablePagination={true}
                enableBottomToolbar={true}
                enableGlobalFilter={true}
                enableDensityToggle={false} // Remove density toggle
                enableColumnActions={false} // Remove column actions
                enableColumnVisibilityToggle={false}

                initialState={{
                density: "compact",
                }}
            muiTableContainerProps={{
                    sx: { 
                        width: "100%",
                        backgroundColor: "#fff",
                        overflowX: "auto",
                        minWidth: "1200px",
                    },
                }}
                muiTableBodyCellProps={{
                    sx: {
                        whiteSpace: "wrap",
                        width:"100px"
                    },
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
                    Products
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />

                    <MRT_ToolbarInternalButtons table={table} />
                    <Tooltip title="Print">
                        <IconButton color="light" onClick={handlePrint}>
                        <FiPrinter size={20} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Download CSV">
                        <IconButton color="light" onClick={downloadCSV}>
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
      {/* Dialog */}
      <BootstrapDialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Add Product</DialogTitle>
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
          initialValues={{
            name: "",
            model: "",
            size: "",
            color: "",
            hsn_code: "",
            rrp: "",
            product_type: "",
            group_id: "",
          }}
          validationSchema={validationSchema}
            onSubmit={ (values) => {
               handleAdd(values)   
            }}
        >
          {({ values, errors, touched, handleChange, setFieldValue  }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Name */}
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

                  {/* Model */}
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

                  {/* Size */}
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

                  {/* Color */}
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

                  {/* HSN Code */}
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

                  {/* RRP */}
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

                  {/* Product Type */}
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
                  

                  {/* Group */}
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
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Image Upload */}
                 <Grid size={{ xs: 12, md: 6 }} sx={{mb:3}}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid size={{ xs: 8 }}>
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<UploadFileIcon />}
                          fullWidth
                        >
                          Upload Image
                          <input
                            hidden
                            accept="image/*"
                            type="file"
                            id="image"
                            name="image"
                            onChange={(event) => {
                              const file = event.currentTarget.files[0];
                              setFieldValue("image", file);
                              handleFileChange && handleFileChange(file);
                            }}
                          />
                        </Button>
                        {touched.image && errors.image && (
                          <div
                            style={{ color: "red", fontSize: "0.8rem" }}
                          >
                            {errors.image}
                          </div>
                        )}
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        {values.image && (
                          <img
                            src={URL.createObjectURL(values.image)}
                            alt="Preview"
                            onLoad={() => URL.revokeObjectURL(values.image)}
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
                <Button type="submit" variant="contained" color="primary">
                  Submit
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </BootstrapDialog>

      {/* Edit  Dialog */}
      <BootstrapDialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit Product</DialogTitle>
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
          initialValues={{
            name: editData?.name || "",
            model: editData?.model || "",
            size: editData?.size || "",
            color: editData?.color || "",
            hsn_code: editData?.hsn_code || "",
            rrp: editData?.rrp || "",
            product_type: editData?.product_type || "",
            group_id: editData?.group_id || "",
          }}
          validationSchema={editValidationSchema}
            onSubmit={ (values, { resetForm }) => {
               handleEditSubmit(values, resetForm)
                  
            }}
        >
          {({ values, errors, touched, handleChange, setFieldValue  }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Name */}
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

                  {/* Model */}
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

                  {/* Size */}
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

                  {/* Color */}
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

                  {/* HSN Code */}
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

                  {/* RRP */}
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

                  {/* Product Type */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      id="product_type"
                      name="product_type"
                      label="Product Type"
                      variant="standard"
                      value={values?.product_type}
                      onChange={handleChange}
                      error={touched.product_type && Boolean(errors.product_type)}
                      helperText={touched.product_type && errors.product_type}
                    >
                      <MenuItem value="Electronics">Electronics</MenuItem>
                      <MenuItem value="Hardware">Hardware</MenuItem>
                      <MenuItem value="Software">Software</MenuItem>
                    </TextField>
                  </Grid>
                  

                  {/* Group */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      id="group_id"
                      name="group_id"
                      label="Group"
                      variant="standard"
                      value={values?.group_id}
                      onChange={handleChange}
                      error={touched.group_id && Boolean(errors.group_id)}
                      helperText={touched.group_id && errors.group_id}
                    >
                      {groups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Image Upload */}
                 <Grid size={{ xs: 12, md: 6 }} sx={{mb:3}}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid size={{ xs: 8 }}>
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<UploadFileIcon />}
                          fullWidth
                        >
                          Upload Image
                          <input
                            hidden
                            accept="image/*"
                            type="file"
                            id="image"
                            name="image"
                            onChange={(event) => {
                              const file = event.currentTarget.files[0];
                              setFieldValue("image", file);
                              handleFileChange && handleFileChange(file);
                            }}
                          />
                        </Button>
                        {touched.image && errors.image && (
                          <div
                            style={{ color: "red", fontSize: "0.8rem" }}
                          >
                            {errors.image}
                          </div>
                        )}
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            onLoad={() => URL.revokeObjectURL(previewUrl)}
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
                <Button variant="outlined" color="error" onClick={handleEditClose}>
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
    </>
  );
};

export default Product;

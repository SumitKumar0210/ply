import * as React from "react";
import { useMemo, useRef, useState } from "react";
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
  Checkbox,
  FormControlLabel,
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const data = [
  { name: "Material1", uom: "inch", size: "20 x 20", price:"5000", category:"category1", group:"Group1", openingStock:"200", urgent:"1", tag:"material", remarks:"Test", image: "https://placehold.co/400"},
  { name: "Material1", uom: "inch", size: "20 x 20", price:"5000", category:"category1", group:"Group1", openingStock:"200", urgent:"1", tag:"material", remarks:"test", image: "https://placehold.co/400"},
  { name: "Material1", uom: "inch", size: "20 x 20", price:"5000", category:"category1", group:"Group1", openingStock:"200", urgent:"1", tag:"material", remarks:"test", image: "https://placehold.co/400"},
  { name: "Material1", uom: "inch", size: "20 x 20", price:"5000", category:"category1", group:"Group1", openingStock:"200", urgent:"1", tag:"material", remarks:"test", image: "https://placehold.co/400"},
  
];

const Material = () => {

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  uom: Yup.string().required("UOM is required"),
  size: Yup.string().required("Size is required"),
  price: Yup.number().typeError("Price must be a number").required("Price is required"),
  category: Yup.string().required("Category is required"),
  image: Yup.mixed()
    .required("Image is required")
    .test("fileType", "Only images are allowed", (value) =>
      value ? ["image/jpeg", "image/png", "image/jpg"].includes(value.type) : false
    ),
  group: Yup.string().required("Group is required"),
  openingStock: Yup.number().typeError("Must be a number").required("Opening stock is required"),
  urgent: Yup.string().required("Size is required"),
  tag: Yup.string().required("Tag is required"),
  remarks: Yup.string().required("Remarks are required"),
});

  const tableContainerRef = useRef(null);
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const columns = useMemo(
    () => [
      {
            accessorKey: "image",
            header: "Image",
            size: 80,
            Cell: ({ row }) => (
                <img
                src={row.original.image}
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
      { accessorKey: "name", header: "Name", size: 200,},
      { accessorKey: "uom", header: "UOM", size: 50,},
      { accessorKey: "size", header: "Size", size: 50, },
      { accessorKey: "price", header: "Price", size: 75, },
      { accessorKey: "category", header: "Category", size: 100, },
      { accessorKey: "group", header: "Group", size: 100, },
      { accessorKey: "openingStock", header: "Opening Stock", size: 50, },
      { accessorKey: "urgent", header: "Urgent", size: 100, },
      { accessorKey: "tag", header: "Tag", size: 50, },
      { accessorKey: "remarks", header: "Remarks", size: 100, },
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
                onClick={() => alert(`Edit ${row.original.name}`)}
              >
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => alert(`Delete ${row.original.name}`)}
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
                 Material
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
                    Add Material
                  </Button>
                </Box>
              </Box>
            )}
          />
        </Paper>
      </Grid>
    </Grid>
    {/* Modal user type start */}
     <BootstrapDialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ m: 0, p: 1.5 }}>Add Material</DialogTitle>
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
          uom: "",
          size: "",
          price: "",
          category: "",
          image: "",
          group: "",
          openingStock: "",
          urgent: false,
          tag: "",
          remarks: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          console.log("Form Submitted:", values);
          handleClose();
        }}
      >
        {({ values, errors, touched, handleChange, setFieldValue }) => (
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

                {/* UOM */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    id="uom"
                    name="uom"
                    label="UOM"
                    variant="standard"
                    value={values.uom}
                    onChange={handleChange}
                    error={touched.uom && Boolean(errors.uom)}
                    helperText={touched.uom && errors.uom}
                  >
                    <MenuItem value="kg">Kg</MenuItem>
                    <MenuItem value="ltr">Litre</MenuItem>
                    <MenuItem value="pcs">Pieces</MenuItem>
                  </TextField>
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

                {/* Price */}
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

                {/* Category */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    id="category"
                    name="category"
                    label="Category"
                    variant="standard"
                    value={values.category}
                    onChange={handleChange}
                    error={touched.category && Boolean(errors.category)}
                    helperText={touched.category && errors.category}
                  >
                    <MenuItem value="raw">Raw Material</MenuItem>
                    <MenuItem value="finished">Finished Goods</MenuItem>
                  </TextField>
                </Grid>

                {/* Group */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    id="group"
                    name="group"
                    label="Group"
                    variant="standard"
                    value={values.group}
                    onChange={handleChange}
                    error={touched.group && Boolean(errors.group)}
                    helperText={touched.group && errors.group}
                  >
                    <MenuItem value="group1">Group 1</MenuItem>
                    <MenuItem value="group2">Group 2</MenuItem>
                  </TextField>
                </Grid>

                {/* Opening Stock */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    id="openingStock"
                    name="openingStock"
                    label="Opening Stock"
                    type="number"
                    variant="standard"
                    value={values.openingStock}
                    onChange={handleChange}
                    error={touched.openingStock && Boolean(errors.openingStock)}
                    helperText={touched.openingStock && errors.openingStock}
                  />
                </Grid>

                {/* Urgent */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    id="urgent"
                    name="urgent"
                    label="Urgent Requirement"
                    variant="standard"
                    value={values.urgent}
                    onChange={handleChange}
                    error={touched.urgent && Boolean(errors.urgent)}
                    helperText={touched.urgent && errors.urgent}
                  />
                </Grid>

                {/* Tag */}
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
                {/* Image Upload */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container spacing={1} alignItems="center">
                    {/* Upload Button */}
                    <Grid size={{ xs: 8}}>
                      <Button
                        variant="contained"
                        color="primary"
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
                          }}
                        />
                      </Button>

                      {/* Error Message */}
                      {touched.image && errors.image && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>{errors.image}</div>
                      )}
                    </Grid>

                    {/* Preview */}
                    <Grid size={{ xs: 4}}>
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
                {/* Remarks */}
                <Grid size={{ xs: 12, md: 12 }} sx={{mb:3}}>
                  <TextField
                    fullWidth
                    id="remarks"
                    name="remarks"
                    label="Remarks"
                    variant="standard"
                    multiline
                    minRows={3}
                    value={values.remarks}
                    onChange={handleChange}
                    error={touched.remarks && Boolean(errors.remarks)}
                    helperText={touched.remarks && errors.remarks}
                  />
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
    {/* Modal user type end */}
</>
  );
};

export default Material;

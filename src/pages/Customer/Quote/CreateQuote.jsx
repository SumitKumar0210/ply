import React, { useState } from "react";
import {
  Grid,
  Button,
  Typography,
  Card,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardContent,
  Stack,
  Box,
  TextareaAutosize,
  TextField,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { styled } from "@mui/material/styles";
import { useFormik, Formik, Form } from "formik";
import * as Yup from "yup";
import { AiOutlinePrinter } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { BiSolidUserPlus } from "react-icons/bi";

// ✅ Styled Dialog
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

const states = [
  { value: "Bihar", label: "Bihar" },
  { value: "Delhi", label: "Delhi" },
  { value: "Maharashtra", label: "Maharashtra" },
];

const CreateQuote = () => {
  const [creationDate, setCreationDate] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [items, setItems] = useState([
    { id: 1, area: "Area 1", name: "Cement Bags", itemCode: "CEM-001", qty: 50, size: "50kg", documents: "Invoice #1001", cost: 25000, naration: "Delivered on site" },
    { id: 2, area: "Area 1", name: "Steel Rods", itemCode: "STL-010", qty: 100, size: "12mm", documents: "Challan #2345", cost: 50000, naration: "Used for foundation" },
    { id: 3, area: "Area 2", name: "Bricks", itemCode: "BRK-020", qty: 1000, size: "9x4x3", documents: "Invoice #1010", cost: 15000, naration: "For wall construction" },
    { id: 4, area: "Area 2", name: "Sand", itemCode: "SND-005", qty: 200, size: "Ton", documents: "Gate Pass #567", cost: 12000, naration: "Delivered by local vendor" },
    { id: 5, area: "Area 2", name: "Paint", itemCode: "PNT-030", qty: 25, size: "20L", documents: "Invoice #1122", cost: 18000, naration: "For interior finishing" },
    { id: 6, area: "Area 1", name: "Brush Set", itemCode: "BRH-011", qty: 40, size: "Standard", documents: "Receipt #778", cost: 4000, naration: "For paint work" },
  ]);

  const uniqueAreas = [...new Set(items.map((item) => item.area))];

  const customers = [
    { id: 1, label: "Customer 1" },
    { id: 2, label: "Customer 2" },
    { id: 3, label: "Customer 3" },
  ];

  const itemCode = [
    { id: 1, label: "Item_001" },
    { id: 2, label: "Item_002" },
    { id: 3, label: "Item_003" },
  ];

  const itemquantity = [
    { id: 1, label: "1" },
    { id: 2, label: "2" },
    { id: 3, label: "3" },
  ];

  const validationSchema = Yup.object({
    itemCode: Yup.string().required("Item code is required"),
    quantity: Yup.string().required("Quantity is required"),
    itemName: Yup.string().required("Item name is required"),
    area: Yup.string().required("Area is required"),
    size: Yup.string().required("Size is required"),
    // narration: Yup.string().required("Narration is required"),
    document: Yup.mixed().required("Please upload a document"),
  });

  const validationSchemaCustomer = Yup.object({
    name: Yup.string().required("Name is required"),
    mobile: Yup.string().matches(/^[0-9]{10}$/, "Mobile must be 10 digits").required("Mobile is required"),
    email: Yup.string().email("Invalid email format").required("E-mail is required"),
    address: Yup.string().required("Address is required"),
    alternateMobile: Yup.string().matches(/^[0-9]{10}$/, "Alternate Mobile must be 10 digits"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    zip: Yup.string().matches(/^[0-9]{6}$/, "ZIP must be 6 digits").required("ZIP code is required"),
    note: Yup.string(),
  });

  const formik = useFormik({
    initialValues: { itemCode: "", area: "", quantity: "", itemName: "", size: "", narration: "", document: null },
    validationSchema,
    onSubmit: (values) => {
      console.log("Form Data:", values);
      alert("Form submitted successfully!");
    },
  });

  return (
    <>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid size={12}>
          <Typography variant="h6">Create Quote</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={12}>
          <Card>
            <CardContent>
              {/* Header Row */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Autocomplete
                    options={customers}
                    size="small"
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => <TextField {...params} label="Select Customer" variant="outlined" sx={{ width: 300 }} />}
                  />
                  <Tooltip title="Add New Customer">
                    <IconButton color="primary" onClick={() => setOpenAdd(true)}>
                      <BiSolidUserPlus size={22} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Quote Date"
                    value={creationDate}
                    onChange={(newValue) => setCreationDate(newValue)}
                    slotProps={{
                      textField: { size: "small", sx: { width: 250 } },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                TECHIE SQUAD PRIVATE LIMITED <br />
                CIN: U72900BR2019PTC042431 <br />
                RK NIWAS, GOLA ROAD MOR, BAILEY ROAD <br />
                DANAPUR, PATNA-801503, BIHAR, INDIA <br />
                GSTIN: 10AAHCT3899A1ZI
              </Typography>

              {/* Form Section */}
              <form onSubmit={formik.handleSubmit}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, mt:3 }}>
                  <TextField label="Area" 
                    variant="outlined" 
                    size="small" 
                    name="area" 
                    value={formik.values.area} 
                    onChange={formik.handleChange} 
                    error={formik.touched.area && Boolean(formik.errors.area)} 
                    helperText={formik.touched.area && formik.errors.area} 
                  />

                  <Autocomplete
                    options={itemCode}
                    size="small"
                    getOptionLabel={(option) => option.label}
                    onChange={(e, value) => formik.setFieldValue("itemCode", value ? value.label : "")}
                    renderInput={(params) => (
                      <TextField {...params} label="Item Code" variant="outlined" sx={{ width: 150 }} error={formik.touched.itemCode && Boolean(formik.errors.itemCode)} helperText={formik.touched.itemCode && formik.errors.itemCode} />
                    )}
                  />

                  <TextField label="Item Name" variant="outlined" size="small" name="itemName" value={formik.values.itemName} onChange={formik.handleChange} error={formik.touched.itemName && Boolean(formik.errors.itemName)} helperText={formik.touched.itemName && formik.errors.itemName} />

                  <Autocomplete
                    options={itemquantity}
                    size="small"
                    getOptionLabel={(option) => option.label}
                    onChange={(e, value) => formik.setFieldValue("quantity", value ? value.label : "")}
                    renderInput={(params) => (
                      <TextField {...params} label="Qty" variant="outlined" sx={{ width: 100 }} error={formik.touched.quantity && Boolean(formik.errors.quantity)} helperText={formik.touched.quantity && formik.errors.quantity} />
                    )}
                  />

                  <TextField label="Size" variant="outlined" size="small" name="size" value={formik.values.size} onChange={formik.handleChange} error={formik.touched.size && Boolean(formik.errors.size)} helperText={formik.touched.size && formik.errors.size} />

                  <TextareaAutosize
                    minRows={1}
                    placeholder="Narration"
                    name="narration"
                    value={formik.values.narration}
                    onChange={formik.handleChange}
                    style={{
                      width: "250px",
                      padding: "8px",
                      borderColor: formik.touched.narration && formik.errors.narration ? "red" : "#ccc",
                    }}
                  />

                  <TextField 
                    type="file" 
                    name="document" 
                    size="small" 
                    variant="outlined" 
                    onChange={(event) => formik.setFieldValue("document", event.currentTarget.files[0])} error={formik.touched.document && Boolean(formik.errors.document)} 
                    helperText={formik.touched.document && formik.errors.document} 
                     style={{
                      width: "250px",
                    }}
                  />

                  <Button type="submit" variant="contained" color="primary"sx={{mt:0}}>
                    Add
                  </Button>
                </Box>
              </form>

              {/* Table Section */}
              {uniqueAreas.map((area) => (
                <Box key={area} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {area}
                  </Typography>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Item Name</Th>
                        <Th>Item Code</Th>
                        <Th>Qty</Th>
                        <Th>Size</Th>
                        <Th>Documents</Th>
                        <Th>Item Cost</Th>
                        <Th>Narration</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items
                        .filter((item) => item.area === area)
                        .map((item) => (
                          <Tr key={item.id}>
                            <Td>{item.name}</Td>
                            <Td>{item.itemCode}</Td>
                            <Td>{item.qty}</Td>
                            <Td>{item.size}</Td>
                            <Td>{item.documents}</Td>
                            <Td>{item.cost}</Td>
                            <Td>{item.naration}</Td>
                            <Td>
                              <Tooltip title="Delete">
                                <IconButton color="error" onClick={() => setOpenDelete(true)}>
                                  <RiDeleteBinLine size={16} />
                                </IconButton>
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </Box>
              ))}

              {/* Totals Section */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3, flexWrap: "wrap", gap: 2 }}>
                <TextareaAutosize aria-label="minimum height" minRows={3} placeholder="Order Terms" style={{ width: "50%", padding: "8px" }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "25%" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc" }}>
                    <span>Sub Total</span>
                    <span>8000</span>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Discount</span>
                    <span>1000</span>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Additional Charges</span>
                    <span>2000</span>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <span>GST (18%)</span>
                    <span>800</span>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #000", pt: 0.5, fontWeight: "600" }}>
                    <span>Grand Total</span>
                    <span>10000</span>
                  </Box>
                </Box>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
                <Button variant="contained" color="secondary">
                  Save as Draft
                </Button>
                <Button variant="contained" color="primary">
                  Save
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

     {/* Add Customer Modal */}
      <BootstrapDialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <BootstrapDialogTitle onClose={() => setOpenAdd(false)}>
          Add Customer
        </BootstrapDialogTitle>
        <Formik
          initialValues={{
            name: "",
            mobile: "",
            email: "",
            address: "",
            alternateMobile: "",
            city: "",
            state: "",
            zip: "",
            note: "",
          }}
          validationSchema={validationSchemaCustomer}
          onSubmit={(values) => {
            setTableData((prev) => [...prev, { id: prev.length + 1, ...values }]);
            setOpenAdd(false);
          }}
        >
          {({ handleChange, handleSubmit, values, touched, errors }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <Grid container  rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="name"
                      label="Name"
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                      onChange={handleChange}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="mobile"
                      label="Mobile"
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                      onChange={handleChange}
                      error={touched.mobile && Boolean(errors.mobile)}
                      helperText={touched.mobile && errors.mobile}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="alternateMobile"
                      label="Alternate Mobile"
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                      onChange={handleChange}
                      error={touched.alternateMobile && Boolean(errors.alternateMobile)}
                      helperText={touched.alternateMobile && errors.alternateMobile}
                    /> 
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="email"
                      label="E-mail"
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                      onChange={handleChange}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      name="address"
                      label="Address"
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                      onChange={handleChange}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      name="state"
                      label="State"
                      select
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                      value={values.state}
                      onChange={handleChange}
                      error={touched.state && Boolean(errors.state)}
                      helperText={touched.state && errors.state}
                    >
                      {states.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="city"
                      label="City"
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                      onChange={handleChange}
                      error={touched.city && Boolean(errors.city)}
                      helperText={touched.city && errors.city}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="zip"
                      label="ZIP Code"
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                      onChange={handleChange}
                      error={touched.zip && Boolean(errors.zip)}
                      helperText={touched.zip && errors.zip}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      name="note"
                      label="Note"
                      fullWidth
                      multiline
                      rows={3}
                      margin="dense"
                      variant="outlined"
                      size="small"
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenAdd(false)} variant="outlined" color="error">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this item?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button color="error" onClick={() => setOpenDelete(false)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateQuote;

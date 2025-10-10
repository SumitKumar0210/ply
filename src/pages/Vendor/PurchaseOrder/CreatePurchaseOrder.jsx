import React, { useState, useEffect } from "react";
import {
  Grid,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Box } from "@mui/material";                  
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import { addPO } from "../slice/purchaseOrderSlice";
import { fetchActiveVendors } from "../../settings/slices/vendorSlice";
import { fetchActiveMaterials } from "../../settings/slices/materialSlice";
import { useDispatch, useSelector } from "react-redux";

const CreatePurchaseOrder = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState({
    id: "",
    name: "",
    code: "",
    uom: "",
    size: "",
    rate: "",
  });
  const [qty, setQty] = useState(1);
  const [items, setItems] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  // Order totals
  const [carriage, setCarriage] = useState(0);
  const [gstRate, setGstRate] = useState(5);
  const [gstAmount, setGstAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    vendor_id: Yup.string().required("Vendor is required"),
    // credit_days: Yup.date().required("Creation date is required"),
    expected_delivery_date: Yup.date().required("Expected delivery date is required"),
    orderTerms: Yup.string().max(200, "Order terms must be under 200 characters"),
    credit_days: Yup.number().min(0, "Invalid number of days").required("Credit days required"),
  });                                                           

  const handleAddItem = () => {
    if (!selectedMaterial.id || !qty) return;
    
    const total = qty * selectedMaterial.rate;

    setItems([
      ...items,
      {
        id: Date.now(),
        material_id: selectedMaterial.id,
        name: selectedMaterial.name,
        code: selectedMaterial.code,
        qty: Number(qty),
        size: selectedMaterial.size,
        uom: selectedMaterial.uom,
        rate: selectedMaterial.rate,
        total,
      },
    ]);
    
    // Reset material selection
    setSelectedMaterial({
      id: "",
      name: "",
      code: "",
      uom: "",
      size: "",
      rate: "",
    });
    setQty(1);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    setItems(items.filter((i) => i.id !== deleteId));
    setOpenDelete(false);
    setDeleteId(null);
  };

  const calculateSubTotal = () =>
    items.reduce((sum, item) => sum + item.total, 0);

  const { data: vendors = [], loading: vendorsLoading } = useSelector((state) => state.vendor);
  const { data: materials = [], loading: materialsLoading } = useSelector((state) => state.material);

  useEffect(() => {
    dispatch(fetchActiveVendors());
    dispatch(fetchActiveMaterials());
  }, [dispatch]);

  // Auto calculate GST and grand total
  useEffect(() => {
    const subTotal = calculateSubTotal();
    const gst = (subTotal * gstRate) / 100;
    const total = subTotal + gst + Number(carriage || 0);

    setGstAmount(gst.toFixed(2));
    setGrandTotal(total.toFixed(2));
  }, [items, carriage, gstRate]);

  const handleFormSubmit = (values, { resetForm }) => {
    const subtotal = calculateSubTotal();

    const formData = {
      vendor_id: values.vendor_id,
      gst_percentage: gstRate,
      gst_amount: Number(gstAmount),
      carriage_amount: Number(carriage || 0),
      subtotal: subtotal,
      grand_total: Number(grandTotal),
      expected_delivery_date: values.expected_delivery_date,
      credit_days: Number(values.credit_days || 0),
      order_terms: values.orderTerms,
      material_items: JSON.stringify(items), // store as JSON
      creation_date: values.credit_days,
      quality_status: "0",
    };

    console.log("Purchase Order Data:", formData);
    dispatch(addPO(formData));

    resetForm();
    setItems([]);
    setCarriage(0);
    setGstRate(5);
    setQty(1);
  };

  const handleSaveDraft = (values) => {
    const subtotal = calculateSubTotal();

    const formData = {
      vendor_id: values.vendor_id,
      gst_percentage: gstRate,
      gst_amount: Number(gstAmount),
      carriage_amount: Number(carriage || 0),
      subtotal: subtotal,
      grand_total: Number(grandTotal),
      expected_delivery_date: values.expected_delivery_date,
      credit_days: Number(values.credit_days || 0),
      order_terms: values.orderTerms,
      material_items: JSON.stringify(items),
      quality_status: "0",
    };

    console.log("Save as Draft:", formData);
    // dispatch(addPO(formData));
  };

  return (
    <>
      {/* Header */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="h6">Purchase Order</Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" color="secondary" startIcon={<AiOutlinePrinter />}>
            Print
          </Button>
        </Grid>
      </Grid>
      
      <Box sx={{
        height: "80vh",
        overflowY: "auto",
        overflowX: "hidden",
        p: 2,
        backgroundColor: "#f9f9f9",
        marginBottom: "40px",
      }}>
        {/* Main Card */}
        <Card>
          <CardContent>
            <Formik
              initialValues={{
                vendor_id: "",
                credit_days: "",
                expected_delivery_date: "",
                orderTerms: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleFormSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
                const selectedVendor = vendors.find(v => v.id === values.vendor_id);

                return (
                  <Form>
                    {/* Vendor Info */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          select
                          label="Select Vendor"
                          fullWidth
                          name="vendor_id"
                          value={values.vendor_id}
                          error={touched.vendor_id && Boolean(errors.vendor_id)}
                          helperText={touched.vendor_id && errors.vendor_id}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          <MenuItem value="">Select Vendor</MenuItem>
                          {vendors.map((v) => (
                            <MenuItem key={v.id} value={v.id}>
                              {v.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        {selectedVendor && (
                          <Typography variant="body2" sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <strong>{selectedVendor.name}</strong> <br />
                            {selectedVendor.address} <br />
                            GSTIN: {selectedVendor.gst || 'N/A'}
                          </Typography>
                        )}
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Creation Date"
                          type="number"
                          fullWidth
                          name="credit_days"
                          value={values.credit_days}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.credit_days && Boolean(errors.credit_days)}
                          helperText={touched.credit_days && errors.credit_days}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          label="EDD Date"
                          type="date"
                          fullWidth
                          name="expected_delivery_date"
                          value={values.expected_delivery_date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.expected_delivery_date && Boolean(errors.expected_delivery_date)}
                          helperText={touched.expected_delivery_date && errors.expected_delivery_date}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>

                    {/* Item Selector */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Grid size={{ xs: 12, md: 2  }}>
                        <TextField
                          select
                          label="Select Material"
                          fullWidth
                          value={selectedMaterial.id}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const material = materials.find((m) => m.id === selectedId);
                            if (material) {
                              setSelectedMaterial({
                                id: material.id,
                                name: material.name,
                                code: material.code || `MAT-${material.id}`,
                                uom: material.unit_of_measurement?.name || material.uom || "pcs",
                                rate: material.price || material.rate || 0,
                              });
                            }
                          }}
                        >
                          <MenuItem value="">Select Material</MenuItem>
                          {materials.map((material) => (
                            <MenuItem key={material.id} value={material.id}>
                              {material.name} - ₹{material.price || material.rate}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      
                      <Grid item xs={4} md={2}>
                        <TextField
                          label="Qty"
                          type="number"
                          fullWidth
                          value={qty}
                          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Button
                          variant="contained"
                          sx={{ py: 2 , mt: 0}}
                          fullWidth
                          onClick={handleAddItem}
                          disabled={!selectedMaterial.id || !qty}
                        >
                          Add Item
                        </Button>
                      </Grid>
                    </Grid>

                    {/* Items Table */}
                    {items.length > 0 && (
                      <Table style={{ marginTop: '20px' }}>
                        <Thead>
                          <Tr>
                            <Th>Item Name</Th>
                            <Th>Item Code</Th>
                            <Th>Qty</Th>
                            <Th>Size</Th>
                            <Th>UOM</Th>
                            <Th>Rate</Th>
                            <Th>Total</Th>
                            <Th>Action</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {items.map((item) => (
                            <Tr key={item.id}>
                              <Td>{item.name}</Td>
                              <Td>{item.code}</Td>
                              <Td>{item.qty}</Td>
                              <Td>{item.size}</Td>
                              <Td>{item.uom}</Td>
                              <Td>₹{item.rate}</Td>
                              <Td>₹{item.total.toFixed(2)}</Td>
                              <Td>
                                <Tooltip title="Delete">
                                  <IconButton color="error" onClick={() => handleDelete(item.id)}>
                                    <RiDeleteBinLine size={16} />
                                  </IconButton>
                                </Tooltip>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}

                    {/* Order Terms & Totals */}
                    <Grid container spacing={2} sx={{ mt: 3 }}>
                      {/* Left: Terms */}
                      <Grid size={{ xs: 12, md: 6  }}>
                        <TextField
                          label="Order Terms"
                          name="orderTerms"
                          multiline
                          minRows={3}
                          fullWidth
                          value={values.orderTerms}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.orderTerms && Boolean(errors.orderTerms)}
                          helperText={touched.orderTerms && errors.orderTerms}
                          placeholder="Enter order terms and conditions..."
                        />
                      </Grid>

                      {/* Right: Totals */}
                      <Grid size={{ xs: 12, md: 6  }} sx={{ ml: "auto" }}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            Order Total Details
                          </Typography>

                          <TextField
                            label="Sub Total"
                            fullWidth
                            value={calculateSubTotal().toFixed(2)}
                            InputProps={{ readOnly: true }}
                            margin="dense"
                          />

                          <TextField
                            label="Carriage Amount"
                            type="number"
                            fullWidth
                            value={carriage}
                            onChange={(e) => setCarriage(Math.max(0, Number(e.target.value)))}
                            margin="dense"
                            inputProps={{ min: 0 }}
                          />

                          <TextField
                            select
                            label="GST (%)"
                            fullWidth
                            value={gstRate}
                            onChange={(e) => setGstRate(Number(e.target.value))}
                            margin="dense"
                          >
                            {[0, 5, 10, 12, 15, 18, 20, 28].map((rate) => (
                              <MenuItem key={rate} value={rate}>
                                {rate}%
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            label="GST Amount"
                            fullWidth
                            value={gstAmount}
                            InputProps={{ readOnly: true }}
                            margin="dense"
                          />

                          <TextField
                            label="Grand Total"
                            fullWidth
                            value={grandTotal}
                            InputProps={{ readOnly: true }}
                            margin="dense"
                            sx={{ fontWeight: 'bold', '& .MuiInputBase-input': { fontWeight: 'bold' } }}
                          />
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Action Buttons */}
                    <Grid container justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                      <Grid item>
                        <Button 
                          variant="outlined" 
                          onClick={() => handleSaveDraft(values)}
                          disabled={items.length === 0}
                        >
                          Save as Draft
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button 
                          type="submit" 
                          variant="contained" 
                          color="primary"
                          disabled={items.length === 0}
                        >
                          Create Purchase Order
                        </Button>
                      </Grid>
                    </Grid>
                  </Form>
                );
              }}
            </Formik>
          </CardContent>
        </Card>

        {/* Delete Modal */}
        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Delete Item?</DialogTitle>
          <DialogContent style={{ width: "300px" }}>
            <DialogContentText>This action cannot be undone.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default CreatePurchaseOrder;
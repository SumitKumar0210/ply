import React, { useState, useEffect, useCallback, useMemo } from "react";
import Grid from "@mui/material/Grid";
import {
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
  MenuItem,
  CircularProgress,
  TextField,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchActiveVendors } from "../../settings/slices/vendorSlice";
import { fetchActiveMaterials } from "../../settings/slices/materialSlice";
import { fetchActiveTaxSlabs } from "../../settings/slices/taxSlabSlice";
import { addPO, updatePO, editPO } from "../slice/purchaseOrderSlice";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { addDays, format, parseISO } from "date-fns";
import { successMessage, errorMessage } from "../../../toast";

// Validation Schema
const validationSchema = Yup.object().shape({
  vendor: Yup.object().nullable().required("Vendor is required"),
  creditDays: Yup.number()
    .typeError("Credit days must be a number")
    .nullable()
    .min(0, "Credit days must be positive")
    .max(365, "Credit days cannot exceed 365"),
  edd_date: Yup.date().nullable().typeError("Invalid date format"),
  discount: Yup.number()
    .typeError("Discount must be a number")
    .nullable()
    .min(0, "Discount must be positive"),
  cariage_amount: Yup.number()
    .typeError("Charges must be a number")
    .nullable()
    .min(0, "Charges must be positive"),
  gst_per: Yup.number()
    .typeError("GST must be a number")
    .min(0, "GST must be positive")
    .max(100, "GST cannot exceed 100"),
  term_and_conditions: Yup.string().max(500, "Order terms cannot exceed 500 characters"),
});

const EditPurchaseOrder = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selected: poData = {}, loading: poLoading } = useSelector((state) => state.purchaseOrder);
  const { data: vendors = [], loading: vendorLoading } = useSelector((state) => state.vendor);
  const { data: materials = [] } = useSelector((state) => state.material);
  const { data: gst = [] } = useSelector((state) => state.taxSlab);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemCode, setSelectedItemCode] = useState(null);
  const [selectedQty, setSelectedQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [initialValues, setInitialValues] = useState({
    vendor: null,
    creditDays: "",
    edd_date: "",
    discount: 0,
    cariage_amount: 0,
    gst_per: 18,
    term_and_conditions: "",
  });

  // Fetch master data
  useEffect(() => {
    dispatch(fetchActiveVendors());
    dispatch(fetchActiveMaterials());
    dispatch(fetchActiveTaxSlabs());
  }, [dispatch]);

  // Fetch PO when editing
  useEffect(() => {
    if (id) dispatch(editPO(id));
  }, [id, dispatch]);

  // Set initial values after PO data and vendors are loaded
  useEffect(() => {
    if (poData && poData.id) {
      const vendor = vendors.find((v) => v.id === poData.vendor_id) || null;
      const parsedItems = poData.material_items ? JSON.parse(poData.material_items) : [];
      setItems(
        parsedItems.map((item, index) => ({
          id: index + 1,
          materialId: item.material_id,
          name: item.name,
          qty: item.qty,
          size: item.size,
          uom: item.uom,
          rate: item.rate,
          total: item.total,
        }))
      );

      setInitialValues({
        vendor,
        creditDays: poData.credit_days || "",
        edd_date: poData.edd_date ? parseISO(poData.edd_date) : null,
        discount: poData.discount || 0,
        cariage_amount: poData.cariage_amount || 0,
        gst_per: parseInt(poData.gst_per) || 18,
        term_and_conditions: poData.term_and_conditions || "",
      });
    }
  }, [poData, vendors]);

  const validateItemInput = useCallback(() => {
    if (!selectedItemCode?.id) {
      errorMessage("Please select a material");
      return false;
    }
    if (!selectedQty || isNaN(selectedQty) || parseInt(selectedQty) <= 0) {
      errorMessage("Please enter a valid quantity greater than 0");
      return false;
    }
    return true;
  }, [selectedItemCode, selectedQty]);

  const isDuplicateItem = useCallback(
    (materialId) => items.some((item) => item.materialId === materialId),
    [items]
  );

  const handleAddItem = useCallback(() => {
    if (!validateItemInput()) return;
    if (isDuplicateItem(selectedItemCode.id)) {
      errorMessage("This material is already added. Update quantity in the table instead.");
      return;
    }

    const materialData = materials.find((m) => m.id === selectedItemCode.id);
    if (!materialData) {
      errorMessage("Material not found");
      return;
    }

    const rate = parseFloat(materialData.price) || 0;
    if (rate <= 0) {
      errorMessage("Material price is invalid");
      return;
    }

    const qty = parseInt(selectedQty);
    const total = rate * qty;

    const newItem = {
      id: Date.now(),
      materialId: selectedItemCode.id,
      name: materialData.name || "Unknown",
      qty,
      size: materialData.size || "N/A",
      uom: materialData?.unit_of_measurement?.name || "pcs",
      rate,
      total,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedItemCode(null);
    setSelectedQty("");
    successMessage("Item added successfully");
  }, [selectedItemCode, selectedQty, materials, items, validateItemInput, isDuplicateItem]);

  const handleQtyChange = useCallback((itemId, newQty) => {
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty <= 0) {
      errorMessage("Quantity must be greater than 0");
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, qty, total: qty * item.rate } : item
      )
    );
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setItems((prev) => prev.filter((item) => item.id !== deleteItemId));
    setOpenDelete(false);
    setDeleteItemId(null);
    successMessage("Item deleted successfully");
  }, [deleteItemId]);

  const handleDeleteClick = useCallback((itemId) => {
    setDeleteItemId(itemId);
    setOpenDelete(true);
  }, []);

  const { subTotal, formattedItems } = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const formatted = items.map((item) => ({
      material_id: item.materialId,
      name: item.name,
      qty: item.qty,
      size: item.size,
      uom: item.uom,
      rate: item.rate,
      total: item.total,
    }));
    return { subTotal: total, formattedItems: formatted };
  }, [items]);

  const validatePOData = useCallback(
    (values) => {
      if (!values.vendor?.id) {
        errorMessage("Please select a vendor");
        return false;
      }
      if (items.length === 0) {
        errorMessage("Please add at least one item");
        return false;
      }

      const discount = parseFloat(values.discount) || 0;
      if (discount > subTotal) {
        errorMessage("Discount cannot exceed subtotal");
        return false;
      }

      return true;
    },
    [items, subTotal]
  );

  const calculateTotals = useCallback(
    (values) => {
      const discountAmount = Math.max(0, parseFloat(values.discount) || 0);
      const cariageAmount = Math.max(0, parseFloat(values.cariage_amount) || 0);
      const gst_perValue = Math.max(0, parseFloat(values.gst_per) || 0);

      const subtotalAfterDiscount = Math.max(0, subTotal - discountAmount);
      const gstAmount = Math.round(subtotalAfterDiscount * (gst_perValue / 100));
      const grandTotal = subtotalAfterDiscount + cariageAmount + gstAmount;

      return {
        discountAmount,
        cariageAmount,
        gst_perValue,
        gstAmount,
        grandTotal,
        subtotalAfterDiscount,
      };
    },
    [subTotal]
  );

  const preparePOData = useCallback(
    (values, isDraft = false) => {
      const { discountAmount, cariageAmount, gst_perValue, gstAmount, grandTotal } =
        calculateTotals(values);

      return {
        id,
        vendor_id: values.vendor.id,
        credit_days: values.creditDays || 0,
        edd_date: values.edd_date ? format(values.edd_date, "yyyy-MM-dd") : null,
        items: JSON.stringify(formattedItems),
        subtotal: subTotal,
        discount: discountAmount,
        additional_charges: cariageAmount,
        gst_amount: gstAmount,
        grand_total: grandTotal,
        gst_percentage: gst_perValue,
        order_terms: values.term_and_conditions || "",
        is_draft: isDraft,
      };
    },
    [calculateTotals, formattedItems, subTotal, id]
  );

  const handleSavePO = async (values, isDraft = false) => {
    if (!validatePOData(values)) return;
    setIsSubmitting(true);
    try {
      const poData = preparePOData(values, isDraft);
      console.log(poData)
      const res = await dispatch(updatePO(poData));

      if (res.meta.requestStatus === "fulfilled") {
        // successMessage(isDraft ? "Draft updated successfully" : "Purchase Order updated");
        setTimeout(() => navigate("/vendor/purchase-order"), 1500);
      } else {
        // errorMessage(res.error?.message || "Failed to update Purchase Order");
      }
    } catch (err) {
      errorMessage(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (poLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6">Edit Purchase Order</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid size={12}>
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => handleSavePO(values, false)}
          >
            {({ values, errors, touched, handleChange, setFieldValue }) => {
              // Auto update EDD when credit days changes
              useEffect(() => {
                if (values.creditDays && !isNaN(values.creditDays) && values.creditDays > 0) {
                  const newDate = addDays(new Date(), parseInt(values.creditDays));
                  setFieldValue("edd_date", newDate);
                }
              }, [values.creditDays, setFieldValue]);

              const { discountAmount, cariageAmount, gstAmount, grandTotal } =
                calculateTotals(values);

              return (
                <Form>
                  <Card>
                    <CardContent>
                      <Grid size={12} sx={{ pt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                          <Autocomplete
                            options={vendors}
                            value={values.vendor}
                            onChange={(e, value) => setFieldValue("vendor", value)}
                            size="small"
                            getOptionLabel={(option) => option?.name || ""}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Vendor"
                                variant="outlined"
                                error={touched.vendor && !!errors.vendor}
                                helperText={touched.vendor && errors.vendor}
                                sx={{ width: 300, height: 40 }}
                                required
                              />
                            )}
                            sx={{ width: 300 }}
                            loading={vendorLoading}
                            disabled={vendorLoading}
                            noOptionsText="No vendors available"
                          />

                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <TextField
                                label="Credit Days"
                                type="number"
                                size="small"
                                name="creditDays"
                                value={values.creditDays}
                                onChange={handleChange}
                                error={touched.creditDays && !!errors.creditDays}
                                helperText={touched.creditDays && errors.creditDays}
                                sx={{ width: 150 }}
                                inputProps={{ min: 0, max: 365 }}
                              />
                              <DatePicker
                                label="EDD"
                                value={values.edd_date}
                                onChange={(newValue) => setFieldValue("edd_date", newValue)}
                                slotProps={{
                                  textField: {
                                    size: 'small',
                                    sx: { width: 300, height: 40 },
                                    error: touched.edd_date && !!errors.edd_date,
                                    helperText: touched.edd_date && errors.edd_date,
                                  },
                                }}
                              />
                            </Box>
                          </LocalizationProvider>
                        </Box>
                      </Grid>

                      {values.vendor && (
                        <Grid size={{ xs: 12, md: 3 }} sx={{ pt: 2 }}>
                          <Typography variant="body2">
                            <strong>{values.vendor?.name}</strong>
                            <br />
                            {values.vendor?.address || "N/A"}
                            <br />
                            GSTIN: {values.vendor?.gst || "N/A"}
                          </Typography>
                        </Grid>
                      )}

                      <Grid size={12} sx={{ pt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                          <Autocomplete
                            options={materials}
                            value={selectedItemCode}
                            onChange={(e, value) => setSelectedItemCode(value)}
                            size="small"
                            getOptionLabel={(option) => option?.name || ""}
                            renderInput={(params) => (
                              <TextField {...params} label="Select Material" variant="outlined" />
                            )}
                            sx={{ width: 300 }}
                            noOptionsText="No materials available"
                          />
                          <TextField
                            label="Qty"
                            name="qty"
                            size="small"
                            onChange={(e) => setSelectedQty(e.target.value)}
                            type="number"
                            value={selectedQty}
                            sx={{ width: 150 }}
                            inputProps={{ min: 1 }}
                            placeholder="Enter quantity"
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleAddItem}
                            sx={{ height: 40 }}
                            disabled={isSubmitting}
                          >
                            Add Item
                          </Button>
                        </Box>
                      </Grid>

                      <Grid size={12} sx={{ mt: 3, overflowX: 'auto' }}>
                        <Table>
                          <Thead>
                            <Tr>
                              <Th>Material Name</Th>
                              <Th>Qty</Th>
                              <Th>Size</Th>
                              <Th>UOM</Th>
                              <Th>Rate</Th>
                              <Th>Total</Th>
                              <Th style={{ textAlign: "right" }}>Action</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {items.length > 0 ? (
                              items.map((item) => (
                                <Tr key={item.id}>
                                  <Td>{item.name}</Td>
                                  <Td>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.qty}
                                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                      inputProps={{ min: 1 }}
                                      sx={{ width: '80px' }}
                                    />
                                  </Td>
                                  <Td>{item.size}</Td>
                                  <Td>{item.uom}</Td>
                                  <Td>₹{item.rate.toLocaleString('en-IN')}</Td>
                                  <Td>₹{item.total.toLocaleString('en-IN')}</Td>
                                  <Td align="right">
                                    <Tooltip title="Delete Item">
                                      <IconButton
                                        color="error"
                                        onClick={() => handleDeleteClick(item.id)}
                                        size="small"
                                      >
                                        <RiDeleteBinLine size={18} />
                                      </IconButton>
                                    </Tooltip>
                                  </Td>
                                </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                  No items added yet. Add items to continue.
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </Grid>

                      <Grid size={12} sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                          <TextareaAutosize
                            minRows={3}
                            maxRows={6}
                            placeholder="Order Terms (max 500 characters)"
                            name="term_and_conditions"
                            value={values.term_and_conditions}
                            onChange={handleChange}
                            style={{ width: '50%', padding: '8px', fontFamily: 'inherit', borderRadius: '4px', border: '1px solid #ccc' }}
                          />

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '20%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                              <span>Sub Total</span>
                              <span>₹{subTotal.toLocaleString('en-IN')}</span>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                              <TextField
                                label="Discount"
                                type="number"
                                size="small"
                                name="discount"
                                value={values.discount}
                                onChange={handleChange}
                                error={touched.discount && !!errors.discount}
                                sx={{ width: '55%' }}
                                inputProps={{ min: 0 }}
                              />
                              <span>₹{(subTotal - discountAmount).toLocaleString('en-IN')}</span>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                              <TextField
                                label="Add Charges"
                                type="number"
                                size="small"
                                name="cariage_amount"
                                value={values.cariage_amount}
                                onChange={handleChange}
                                error={touched.cariage_amount && !!errors.cariage_amount}
                                sx={{ width: '55%' }}
                                inputProps={{ min: 0 }}
                              />
                              <span>₹{cariageAmount.toLocaleString('en-IN')}</span>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                              <TextField
                                select
                                label="GST %"
                                size="small"
                                name="gst_per"
                                value={values.gst_per}
                                onChange={handleChange}
                                error={touched.gst_per && !!errors.gst_per}
                                sx={{ width: '55%' }}
                              >
                                {gst.map((item) => (
                                  <MenuItem key={item.id} value={item.percentage}>
                                    {item.percentage}%
                                  </MenuItem>
                                ))}
                              </TextField>
                              <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #222', mt: 1, pt: 0.5, fontWeight: '600' }}>
                              <span>Grand Total</span>
                              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid size={12} sx={{ mt: 4 }}>
                        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "flex-end" }}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleSavePO(values, true)}
                            type="button"
                            disabled={isSubmitting || items.length === 0}
                          >
                            Save as Draft
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            disabled={isSubmitting || items.length === 0}
                            endIcon={isSubmitting && <CircularProgress size={20} />}
                          >
                            {isSubmitting ? "Saving..." : "Save"}
                          </Button>
                        </Stack>
                      </Grid>
                    </CardContent>
                  </Card>
                </Form>
              );
            }}
          </Formik>
        </Grid>
      </Grid>

      <Dialog maxWidth="xs" fullWidth open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Item?</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditPurchaseOrder;

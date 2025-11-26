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
import { BiSolidUserPlus } from "react-icons/bi";
import { MdAddBox } from "react-icons/md";
import { Autocomplete } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchActiveVendors } from "../../settings/slices/vendorSlice";
import { fetchActiveMaterials } from "../../settings/slices/materialSlice";
import { fetchActiveTaxSlabs } from "../../settings/slices/taxSlabSlice";
import { addPO } from "../slice/purchaseOrderSlice";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { addDays, format } from "date-fns";
import { successMessage, errorMessage } from "../../../toast";
import VendorFormModal from "../../../components/Vendor/VendorFormModal";
import MaterialFormModal from "../../../components/Material/MaterialFormModal";

// Validation Schema
const validationSchema = Yup.object().shape({
  vendor: Yup.object().nullable().required("Vendor is required"),
  creditDays: Yup.number()
    .typeError("Credit days must be a number")
    .nullable()
    .min(0, "Credit days must be positive")
    .max(365, "Credit days cannot exceed 365"),
  eddDate: Yup.date().nullable().typeError("Invalid date format"),
  discount: Yup.number()
    .typeError("Discount must be a number")
    .nullable()
    .min(0, "Discount must be positive"),
  additionalCharges: Yup.number()
    .typeError("Charges must be a number")
    .nullable()
    .min(0, "Charges must be positive"),
  gstRate: Yup.number()
    .typeError("GST must be a number")
    .min(0, "GST must be positive")
    .max(100, "GST cannot exceed 100"),
  orderTerms: Yup.string().max(500, "Order terms cannot exceed 500 characters"),
});

const CreatePurchaseOrder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemCode, setSelectedItemCode] = useState(null);
  const [selectedQty, setSelectedQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openVendorModal, setOpenVendorModal] = useState(false);
  const [openMaterialModal, setOpenMaterialModal] = useState(false);
  const [previousVendorId, setPreviousVendorId] = useState(null);

  const { data: vendors = [], loading: vendorLoading } = useSelector((state) => state.vendor);
  const { data: materials = [] } = useSelector((state) => state.material);
  const { activeData: gst = [] } = useSelector((state) => state.taxSlab);

  useEffect(() => {
    dispatch(fetchActiveVendors());
    dispatch(fetchActiveMaterials());
    dispatch(fetchActiveTaxSlabs());
  }, [dispatch]);

  // Refresh vendors list
  const refreshVendors = useCallback(() => {
    dispatch(fetchActiveVendors());
  }, [dispatch]);

  // Refresh materials list
  const refreshMaterials = useCallback(() => {
    dispatch(fetchActiveMaterials());
  }, [dispatch]);

  const handleOpenVendorModal = () => {
    setOpenVendorModal(true);
  };

  const handleCloseVendorModal = () => {
    setOpenVendorModal(false);
    refreshVendors();
  };

  const handleOpenMaterialModal = () => {
    setOpenMaterialModal(true);
  };

  const handleCloseMaterialModal = () => {
    setOpenMaterialModal(false);
    refreshMaterials();
  };

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
      uom: materialData?.unit_of_measurement.name || "pcs",
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

      if (!values.eddDate) {
        errorMessage("Please choose edd date");
        return false;
      }

      return true;
    },
    [items, subTotal]
  );

  const calculateTotals = useCallback(
    (values) => {
      const discountAmount = Math.max(0, parseFloat(values.discount) || 0);
      const additionalChargesAmount = Math.max(0, parseFloat(values.additionalCharges) || 0);
      const gstRateValue = Math.max(0, parseFloat(values.gstRate) || 0);

      const subtotalAfterDiscount = Math.max(0, subTotal - discountAmount);
      const gstAmount = Math.round(subtotalAfterDiscount * (gstRateValue / 100));
      const grandTotal = subtotalAfterDiscount + additionalChargesAmount + gstAmount;

      return {
        discountAmount,
        additionalChargesAmount,
        gstRateValue,
        gstAmount,
        grandTotal,
        subtotalAfterDiscount,
      };
    },
    [subTotal]
  );

  const preparePOData = useCallback(
    (values, isDraft = false) => {
      const { discountAmount, additionalChargesAmount, gstRateValue, gstAmount, grandTotal } =
        calculateTotals(values);

      return {
        vendor_id: values.vendor.id,
        credit_days: values.creditDays || 0,
        edd_date: values.eddDate ? format(values.eddDate, "yyyy-MM-dd") : null,
        items: JSON.stringify(formattedItems),
        subtotal: subTotal,
        discount: discountAmount,
        additional_charges: additionalChargesAmount,
        gst_amount: gstAmount,
        grand_total: grandTotal,
        gst_percentage: gstRateValue,
        order_terms: values.orderTerms || values.vendor?.terms || "",
        is_draft: isDraft,
      };
    },
    [calculateTotals, formattedItems, subTotal]
  );

  const handleSavePO = async (values, isDraft = false) => {
    if (!validatePOData(values)) return;
    setIsSubmitting(true);
    try {
      const poData = preparePOData(values, isDraft);
      const res = await dispatch(addPO(poData));

      if (res.meta.requestStatus === "fulfilled") {
        setTimeout(() => navigate("/vendor/purchase-order"), 500);
      } else {
        errorMessage(res.error?.message || "Failed to save Purchase Order");
      }
    } catch (err) {
      errorMessage(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (vendorLoading) {
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
          <Typography variant="h6">Create Purchase Order</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid size={12}>
          <Formik
            initialValues={{
              vendor: null,
              creditDays: "",
              eddDate: null,
              discount: "",
              additionalCharges: "",
              gstRate: "18.00",
              orderTerms: "",
            }}
            validationSchema={validationSchema}
            onSubmit={(values) => handleSavePO(values, false)}
          >
            {({ values, errors, touched, handleChange, setFieldValue }) => {
              useEffect(() => {
                if (values.creditDays && !isNaN(values.creditDays) && values.creditDays > 0) {
                  const newDate = addDays(new Date(), parseInt(values.creditDays));
                  setFieldValue("eddDate", newDate);
                }
              }, [values.creditDays, setFieldValue]);

              useEffect(() => {
                if (!previousVendorId && values.vendor?.id) {
                  setPreviousVendorId(values.vendor.id);
                  if (values.vendor?.terms) {
                    setFieldValue("orderTerms", values.vendor.terms);
                  }
                  return;
                }
                if (values.vendor?.id && previousVendorId !== values.vendor?.id) {
                  if (values.vendor?.terms) {
                    setFieldValue("orderTerms", values.vendor.terms);
                  }

                  setPreviousVendorId(values.vendor.id);
                }
              }, [values.vendor?.id, previousVendorId]);

              const { discountAmount, additionalChargesAmount, gstAmount, grandTotal } =
                calculateTotals(values);

              return (
                <Form>
                  <Card>
                    <CardContent>
                      <Grid size={12} sx={{ pt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                                  sx={{ width: 300 }}
                                  required
                                />
                              )}
                              sx={{ width: 300 }}
                              loading={vendorLoading}
                              disabled={vendorLoading}
                              noOptionsText="No vendors available"
                            />

                            <Tooltip title="Add New Vendor">
                              <IconButton color="primary" onClick={handleOpenVendorModal}>
                                <BiSolidUserPlus size={22} />
                              </IconButton>
                            </Tooltip>
                          </Box>

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
                                value={values.eddDate}
                                onChange={(newValue) => setFieldValue("eddDate", newValue)}
                                slotProps={{
                                  textField: {
                                    size: 'small',
                                    sx: { width: 300 },
                                    error: touched.eddDate && !!errors.eddDate,
                                    helperText: touched.eddDate && errors.eddDate,
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
                            <strong>{values.vendor.name}</strong>
                            <br />
                            {values.vendor.address || "N/A"}
                            <br />
                            GSTIN: {values.vendor.gst || "N/A"}
                          </Typography>
                        </Grid>
                      )}

                      <Grid size={12} sx={{ pt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                          <Autocomplete
                            options={[{ id: "add_new", name: "➕ Add New Material" }, ...materials]}
                            value={selectedItemCode}
                            onChange={(e, value) => {
                              if (value?.id === "add_new") {
                                setOpenMaterialModal(true);
                                setSelectedItemCode(null);
                                return;
                              }
                              setSelectedItemCode(value);
                            }}
                            size="small"
                            getOptionLabel={(option) => option?.name || ""}
                            renderOption={(props, option) => (
                              <li {...props} style={{ fontWeight: option.id === "add_new" ? "bold" : "normal" }}>
                                {option.name}
                              </li>
                            )}
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
                          {/* Fixed TextareaAutosize - now always uses values.orderTerms */}
                          <TextareaAutosize
                            minRows={3}
                            maxRows={6}
                            placeholder="Order Terms (max 500 characters)"
                            name="orderTerms"
                            value={values.orderTerms}
                            onChange={handleChange}
                            style={{
                              width: '50%',
                              padding: '8px',
                              fontFamily: 'inherit',
                              borderRadius: '4px',
                              border: '1px solid #ccc'
                            }}
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
                                name="additionalCharges"
                                value={values.additionalCharges}
                                onChange={handleChange}
                                error={touched.additionalCharges && !!errors.additionalCharges}
                                sx={{ width: '55%' }}
                                inputProps={{ min: 0 }}
                              />
                              <span>₹{additionalChargesAmount.toLocaleString('en-IN')}</span>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                              <TextField
                                select
                                label="GST %"
                                size="small"
                                name="gstRate"
                                value={values.gstRate}
                                onChange={handleChange}
                                error={touched.gstRate && !!errors.gstRate}
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

      {/* Delete Item Dialog */}
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

      {/* Vendor Form Modal */}
      <VendorFormModal
        open={openVendorModal}
        onClose={handleCloseVendorModal}
        editData={null}
      />

      {/* Material Form Modal */}
      <MaterialFormModal
        open={openMaterialModal}
        onClose={handleCloseMaterialModal}
        editData={null}
      />
    </>
  );
};

export default CreatePurchaseOrder;
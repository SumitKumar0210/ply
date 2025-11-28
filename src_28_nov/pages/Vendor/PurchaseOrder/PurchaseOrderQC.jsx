import React, { useState, useEffect, useCallback, useMemo } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { editPO } from "../slice/purchaseOrderSlice";
import { addInward } from "../slice/purchaseInwardSlice";
import { fetchActiveMaterials } from "../../settings/slices/materialSlice";
import { successMessage, errorMessage } from "../../../toast";

const PurchaseOrderQC = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selected: po = {}, loading: poLoading = true } = useSelector((state) => state.purchaseOrder);
  const { data: materials = [] } = useSelector((state) => state.material);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemCode, setSelectedItemCode] = useState(null);
  const [selectedQty, setSelectedQty] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  // Fetch master data
  useEffect(() => {

    dispatch(fetchActiveMaterials());
  }, [dispatch]);

  // Fetch PO when editing
  useEffect(() => {
    if (id) dispatch(editPO(id));
  }, [id, dispatch]);

  // Set initial values after PO data is loaded
  useEffect(() => {
    if (po && po.id) {
      const parsedItems = po.material_items ? JSON.parse(po.inward ? po.inward.material_items : po.material_items) : [];
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
    }
  }, [po]);

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
  }, [selectedItemCode, selectedQty, materials, validateItemInput, isDuplicateItem]);

  const handleQtyChange = useCallback((itemId, newQty) => {
    const qty = Number(newQty);

    if (isNaN(qty) || qty < 0) {
      errorMessage("Please enter a valid quantity");
      return;
    }

    if (qty === 0) {
      errorMessage("Quantity must be greater than 0");
      return;
    }

    // Find the original item to get max quantity from PO
    const originalItem = items.find(item => item.id === itemId);
    if (!originalItem) return;

    // Get the original PO quantity (this should come from server data)
    const parsedItems = po?.material_items ? JSON.parse(po.material_items) : [];
    const poItem = parsedItems.find(item => item.material_id === originalItem.materialId);
    const maxQty = poItem ? Number(poItem.qty) : null;

    if (maxQty && qty > maxQty) {
      errorMessage(`Quantity cannot exceed ordered quantity of ${maxQty}`);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, qty, total: qty * Number(item.rate) }
          : item
      )
    );
  }, [items, po]);

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

  const calculateTotals = useMemo(() => {
    const discountAmount = Math.max(0, parseFloat(po.discount) || 0);
    const cariageAmount = Math.max(0, parseFloat(po.cariage_amount) || 0);
    const gst_perValue = Math.max(0, parseFloat(po.gst_per) || 0);

    const subtotalAfterDiscount = Math.max(0, subTotal - discountAmount);
    const gstAmount = Math.round(subtotalAfterDiscount * (gst_perValue / 100));
    const grandTotal = subtotalAfterDiscount + cariageAmount + gstAmount;

    return {
      discountAmount,
      cariageAmount,
      gst_perValue,
      gstAmount,
      grandTotal,
    };
  }, [subTotal, po.discount, po.cariage_amount, po.gst_per]);

  const handlePrintClick = () => {
    navigate('/vendor/purchase-order/print/' + id);
  };

  const handleApprove = async () => {
    if (!invoiceNo) {
      errorMessage("Please enter vendor invoice number");
      return;
    }
    if (!invoiceDate) {
      errorMessage("Please enter vendor invoice date");
      return;
    }
    if (items.length === 0) {
      errorMessage("Please add at least one item");
      return;
    }

    const approveData = {
      id,
      vendor_id: po.vendor_id,
      credit_days: po.credit_days || 0,
      items: JSON.stringify(formattedItems),
      subtotal: subTotal,
      discount: calculateTotals.discountAmount,
      additional_charges: calculateTotals.cariageAmount,
      gst_amount: calculateTotals.gstAmount,
      grand_total: calculateTotals.grandTotal,
      gst_percentage: calculateTotals.gst_perValue,
      vendor_invoice_no: invoiceNo,
      vendor_invoice_date: invoiceDate,
    };

    await dispatch(addInward(approveData)).unwrap();
    if (id) dispatch(editPO(id));

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
          <Typography variant="h6">Purchase Order</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid size={12}>
          <Card>
            <CardContent>
              {po?.inward &&(
                <Grid size={12} sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h6" className="fs-15">Purchase Order: {po.purchase_no}</Typography>
                  <Button variant="contained" color="warning" sx={{ mt: 0 }} onClick={handlePrintClick}>
                     Print QC Report
                  </Button>
                </Box>
              </Grid>
              )}
              
              {po?.vendor && (
                <Grid size={{ xs: 12, md: 3 }} sx={{ pt: 2 }}>
                  <Typography variant="p">
                    From
                    <br />
                    <b>{po.vendor?.name}</b>
                    <br />
                    {po.vendor?.address}
                    <br />
                    GSTIN: {po.vendor?.gst}
                    <br />
                    Dated: {po.order_date}
                  </Typography>
                </Grid>
              )}


              <Grid size={12} sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'nowrap' }}>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ m: 0 }}>Vendor Invoice No.: <b>{po.inward?.vendor_invoice_no}</b></Typography>
                      {!po.inward && (<TextField
                        label="Invoice No"
                        type="text"
                        size="small"
                        name="invoice_no"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        sx={{ width: 150 }}
                      />)}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ m: 0 }}>Vendor Invoice Date: <b>{po.inward?.vendor_invoice_date}</b></Typography>
                      {!po.inward && (<TextField
                        label="Invoice Date"
                        type="date"
                        size="small"
                        name="invoice_date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        sx={{ width: 150 }}
                        InputLabelProps={{ shrink: true }}
                      />)}
                    </Box>
                  </Box>
                  {!po.inward && (
                    <Button variant="contained" color="primary" onClick={handleApprove}>
                      Approve
                    </Button>
                  )}
                </Box>
              </Grid>

              {!po.inward && (
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
                    >
                      Add Item
                    </Button>
                  </Box>
                </Grid>
              )}
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
                              disabled={po?.quality_status !== '1' && po?.inward }
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '300px', marginLeft: 'auto' }}>
                  <Box className="fs-15" sx={{ display: 'flex', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                    <span>Sub Total</span>
                    <span style={{ marginLeft: 'auto' }}>₹{subTotal.toLocaleString('en-IN')}</span>
                  </Box>

                  <Box className="fs-15" sx={{ display: 'flex' }}>
                    <span>Discount</span>
                    <span style={{ marginLeft: 'auto' }}>₹{calculateTotals.discountAmount.toLocaleString('en-IN')}</span>
                  </Box>

                  <Box className="fs-15" sx={{ display: 'flex' }}>
                    <span>Additional Charges</span>
                    <span style={{ marginLeft: 'auto' }}>₹{calculateTotals.cariageAmount.toLocaleString('en-IN')}</span>
                  </Box>

                  <Box className="fs-15" sx={{ display: 'flex' }}>
                    <span>GST ({calculateTotals.gst_perValue}%)</span>
                    <span style={{ marginLeft: 'auto' }}>₹{calculateTotals.gstAmount.toLocaleString('en-IN')}</span>
                  </Box>

                  <Box className="fs-15" sx={{ display: 'flex', borderTop: '1px solid #222', mt: 1, pt: 0.5, fontWeight: 600 }}>
                    <span>Grand Total</span>
                    <span style={{ marginLeft: 'auto' }}>₹{calculateTotals.grandTotal.toLocaleString('en-IN')}</span>
                  </Box>
                </Box>
              </Grid>
            </CardContent>
          </Card>
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

export default PurchaseOrderQC;
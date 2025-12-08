import React, { useState, useEffect } from "react";
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
  TextField,
  CircularProgress,
  Backdrop
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fetchQuotation, fetchSupervisor, updateOrder, editOrder, getPreviousPO } from "../slice/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import { Chip } from "@mui/material";

const EditOrder = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  // Redux state
  const { data: quoteList = [], loading: quoteLoading } = useSelector((state) => state.order);
  const { user: supervisorList = [] } = useSelector((state) => state.order);

  // Form state
  const [formData, setFormData] = useState({
    selectedQuote: null,
    projectStartDate: null,
    edd: null,
    items: []
  });

  // UI state
  const [loadingState, setLoadingState] = useState({
    orderData: false,
    quotation: false,
    submitting: false
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    itemId: null
  });

  const [previousPOData, setPreviousPOData] = useState([]);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        dispatch(fetchQuotation()),
        dispatch(fetchSupervisor())
      ]);

      if (orderId) {
        await loadOrderData();
      }
    };

    initializeData();
  }, [dispatch, orderId]);

  // Load existing order data for editing
  const loadOrderData = async () => {
    setLoadingState(prev => ({ ...prev, orderData: true }));

    try {
      const response = await dispatch(editOrder(orderId)).unwrap();
      const orderData = response.data || response;

      if (!orderData) {
        throw new Error("Order not found");
      }

      const res = await dispatch(getPreviousPO({ id: orderData.quotation_id, orderId }));
      setPreviousPOData(res.payload);

      // Parse product_ids from JSON string
      let productItems = [];
      try {
        productItems = typeof orderData.product_ids === 'string'
          ? JSON.parse(orderData.product_ids)
          : orderData.product_ids || [];
      } catch (parseError) {
        console.error("Error parsing product_ids:", parseError);
        productItems = [];
      }

      // Find matching quote and supervisor
      const matchedQuote = quoteList.find(q => q.id === orderData.quotation_id) || {
        id: orderData.quotation_id,
        batch_no: orderData.batch_no
      };

      const matchedSupervisor = supervisorList.find(s => s.id === orderData.supervisor_id) || null;

      const formattedItems = productItems.map((item, index) => ({
        rowId: index,
        product_id: item.product_id || item.id,
        group: item.group || "",
        name: item.name || "",
        model: item.model || "",
        unique_code: item.unique_code || "",
        original_qty: Number(item.original_qty || item.qty || 0),
        production_qty: Number(item.production_qty || 0),
        size: item.size || "",
        document: item.document || "",
        start_date: item.start_date ? new Date(item.start_date) : null,
        end_date: item.end_date ? new Date(item.end_date) : null
      }));

      setFormData({
        selectedQuote: matchedQuote,
        projectStartDate: orderData.commencement_date ? new Date(orderData.commencement_date) : null,
        edd: orderData.delivery_date ? new Date(orderData.delivery_date) : null,
        items: formattedItems,
        customer: orderData?.customer ?? null,
      });

    } catch (error) {
      console.error("Error loading order:", error);
      navigate("/customer/order");
    } finally {
      setLoadingState(prev => ({ ...prev, orderData: false }));
    }
  };

  // Handle quotation selection
  const handleQuoteSelect = async (selectedQuote) => {
    if (!selectedQuote) {
      setFormData(prev => ({
        ...prev,
        selectedQuote: null,
        items: []
      }));
      return;
    }

    setLoadingState(prev => ({ ...prev, quotation: true }));

    try {
      // Parse products from selected quote
      const products = JSON.parse(selectedQuote.product_ids || "[]");
      const formattedItems = products.map((product, index) => ({
        rowId: index,
        product_id: product.product_id,
        group: product.group || "",
        name: product.name || "",
        model: product.model || "",
        unique_code: product.unique_code || "",
        original_qty: product.qty || 0,
        production_qty: product.production_qty || "",
        size: product.size || "",
        document: product.document || "",
        start_date: product.start_date ? new Date(product.start_date) : null,
        end_date: product.end_date ? new Date(product.end_date) : null
      }));

      setFormData(prev => ({
        ...prev,
        selectedQuote,
        items: formattedItems
      }));
    } catch (error) {
      console.error("Error parsing quote products:", error);
      alert("Failed to load quotation details");
    } finally {
      setTimeout(() => {
        setLoadingState(prev => ({ ...prev, quotation: false }));
      }, 300);
    }
  };

  // Update item field
  const updateItem = (rowId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.rowId === rowId ? { ...item, [field]: value } : item
      )
    }));
  };

  // Handle production quantity change with validation
  const handleProductionQtyChange = (rowId, value, maxQty, prevQty = 0) => {
    let qty = Number(value);
    const remainingQty = Math.max(0, maxQty - prevQty);

    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > remainingQty) qty = remainingQty;

    updateItem(rowId, "production_qty", qty);
  };


  // Delete item handlers
  const handleDeleteItem = (rowId) => {
    setDeleteDialog({ open: true, itemId: rowId });
  };

  const confirmDeleteItem = () => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.rowId !== deleteDialog.itemId)
    }));
    setDeleteDialog({ open: false, itemId: null });
  };

  // Form validation
  const validateForm = () => {
    const { selectedQuote, projectStartDate, edd, items } = formData;

    if (selectedQuote.id && !selectedQuote) {
      alert("Please select a quotation");
      return false;
    }


    if (!projectStartDate) {
      alert("Please select project start date");
      return false;
    }

    if (!edd) {
      alert("Please select EDD (Expected Delivery Date)");
      return false;
    }

    if (items.length === 0) {
      alert("No items to update. Please add at least one item.");
      return false;
    }

    // Validate each item
    for (const item of items) {
      if (!item.production_qty || item.production_qty <= 0) {
        alert(`Please enter production quantity for ${item.name}`);
        return false;
      }

      if (!item.start_date) {
        alert(`Please select start date for ${item.name}`);
        return false;
      }

      if (!item.end_date) {
        alert(`Please select end date for ${item.name}`);
        return false;
      }

      if (item.start_date > item.end_date) {
        alert(`End date must be after start date for ${item.name}`);
        return false;
      }
    }

    return true;
  };

  // Submit order update
  const handleUpdateOrder = async () => {
    if (!validateForm()) return;

    setLoadingState(prev => ({ ...prev, submitting: true }));

    try {
      const { selectedQuote, projectStartDate, edd, items } = formData;

      const getOriginalQty = (item) => {
        if (formData.selectedQuote?.id) {
          return item.original_qty;
        }
        return item.production_qty;
      };
      const orderPayload = {
        id: orderId,
        quotation_id: selectedQuote.id,
        batch_no: selectedQuote.batch_no,
        customer_id: selectedQuote.customer?.id ?? formData.customer?.id,
        commencement_date: projectStartDate, // Changed from project_start_date
        delivery_date: edd, // Changed from edd
        items: items.map(item => ({
          product_id: item.product_id,
          group: item.group,
          name: item.name,
          model: item.model,
          unique_code: item.unique_code,
          original_qty: getOriginalQty(item),
          production_qty: item.production_qty,
          size: item.size,
          document: item.document,
          start_date: item.start_date,
          end_date: item.end_date
        }))
      };

      await dispatch(updateOrder(orderPayload)).unwrap();
      // alert("Order updated successfully!");
      navigate("/customer/order");
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setLoadingState(prev => ({ ...prev, submitting: false }));
    }
  };

  const isLoading = loadingState.orderData || loadingState.quotation || loadingState.submitting;
  const loadingMessage = loadingState.orderData ? "Loading order data..." :
    loadingState.quotation ? "Loading quotation..." :
      "Updating order...";
  console.log(formData);
  return (
    <>
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>{loadingMessage}</Typography>
        </Box>
      </Backdrop>

      {/* Header */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h6">Edit Order</Typography>
        </Grid>
      </Grid>

      {/* Main Form */}
      <Card>
        <CardContent>
          {/* Selection Controls */}
          <Grid size={12} sx={{ pt: 2, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Autocomplete
                options={quoteList}
                value={formData.selectedQuote}
                getOptionLabel={(option) => `Quote ${option.batch_no}`}
                disabled={formData.selectedQuote?.id == null}
                loading={quoteLoading}
                onChange={(_, newValue) => handleQuoteSelect(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Quote"
                    variant="outlined"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {quoteLoading && <CircularProgress size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                sx={{ width: 300 }}
              />



              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <DatePicker
                    label="Project Start Date"
                    value={formData.projectStartDate}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, projectStartDate: newValue }))}
                    disablePast
                    slotProps={{ textField: { size: 'small', sx: { width: 300 } } }}
                  />

                  <DatePicker
                    label="EDD"
                    value={formData.edd}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, edd: newValue }))}
                    disablePast
                    slotProps={{ textField: { size: 'small', sx: { width: 300 } } }}
                  />
                </Box>
              </LocalizationProvider>
            </Box>
          </Grid>

          {/* Customer Information */}
          {(formData.selectedQuote?.customer || formData.customer) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>{formData.selectedQuote?.customer?.name ?? formData.customer?.name}</strong><br />
                {formData.selectedQuote?.customer?.address ?? formData.customer?.address}<br />
                {formData.selectedQuote?.customer?.city ?? formData.customer?.city},
                {formData.selectedQuote?.customer?.state?.name ?? formData.customer?.state?.name}
                {formData.selectedQuote?.customer?.zip_code ?? formData.customer?.zip_code}
              </Typography>
            </Box>
          )}

          {/* Items Table */}
          {formData.items.length > 0 && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Group</Th>
                    <Th>Product Name</Th>
                    <Th>Model</Th>
                    <Th>Unique Code</Th>
                    {formData.selectedQuote?.id !== null && (
                      <Th>Qty</Th>
                    )}
                    {previousPOData.length > 0 && <Th>Qty in Production</Th>}
                    <Th> {formData.selectedQuote?.id == null ? 'Qty' : 'Production Qty'}</Th>
                    <Th>Size</Th>
                    <Th>Document</Th>
                    <Th>Start Date</Th>
                    <Th>End Date</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {formData.items.map((item) => {
                    const prevMatch = previousPOData.find(
                      (p) =>
                        p.product_id == item.product_id &&
                        p.group.trim() === item.group.trim()
                    );
                    return (
                      <Tr key={item.rowId}>
                        <Td>{item.group}</Td>
                        <Td>{item.name}</Td>
                        <Td>{item.model}</Td>
                        <Td>{item.unique_code}</Td>
                        {formData.selectedQuote?.id !== null && (
                          <Td>{item.original_qty}</Td>
                        )}
                        {previousPOData?.length > 0 && (
                          <Td style={{ textAlign: "center" }}>
                            {prevMatch ? (
                              <Chip
                                label={prevMatch.total_qty}
                                color="info"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: "inline-block", textAlign: "center" }}
                              >
                                0
                              </Typography>
                            )}
                          </Td>
                        )}

                        <Td>
                          <TextField
                            size="small"
                            type="number"
                            value={item.production_qty ?? ""}
                            onChange={(e) =>
                              handleProductionQtyChange(
                                item.rowId,
                                e.target.value,
                                item.original_qty,
                                prevMatch ? parseInt(prevMatch.total_qty || 0) : 0
                              )
                            }
                            sx={{ width: 100 }}
                            inputProps={{
                              min: 0,
                              max:
                                prevMatch && prevMatch.total_qty
                                  ? Math.max(0, item.original_qty - parseInt(prevMatch.total_qty || 0))
                                  : item.original_qty,
                            }}
                          />
                        </Td>
                        <Td>{item.size}</Td>
                        <Td>
                          {item.document && (
                            <ImagePreviewDialog
                              imageUrl={mediaUrl + item.document}
                              alt={item.name}
                            />
                          )}
                        </Td>
                        <Td>
                          <DatePicker
                            value={item.start_date}
                            onChange={(newValue) => updateItem(item.rowId, 'start_date', newValue)}
                            disablePast
                            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                          />
                        </Td>
                        <Td>
                          <DatePicker
                            value={item.end_date}
                            onChange={(newValue) => updateItem(item.rowId, 'end_date', newValue)}
                            disablePast
                            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                          />
                        </Td>
                        <Td>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteItem(item.rowId)}
                            >
                              <RiDeleteBinLine size={16} />
                            </IconButton>
                          </Tooltip>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </LocalizationProvider>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/customer/order")}
              disabled={loadingState.submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateOrder}
              disabled={loadingState.submitting || formData.items.length === 0}
              startIcon={loadingState.submitting && <CircularProgress size={20} />}
            >
              {loadingState.submitting ? "Updating..." : "Update Order"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, itemId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, itemId: null })}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDeleteItem}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditOrder;
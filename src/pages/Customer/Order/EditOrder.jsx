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
  Backdrop,
  useMediaQuery,
  useTheme,
  Divider,
  Alert,
  Snackbar,
  Chip
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
import { FiCalendar } from 'react-icons/fi';
import { IoMdCheckmarkCircleOutline } from "react-icons/io";

const EditOrder = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Redux state
  const { data: quoteList = [], loading: quoteLoading } = useSelector((state) => state.order);
  const { user: supervisorList = [] } = useSelector((state) => state.order);

  // Form state
  const [formData, setFormData] = useState({
    selectedQuote: null,
    projectStartDate: null,
    edd: null,
    items: [],
    customer: null
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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  const [previousPOData, setPreviousPOData] = useState([]);

  // Snackbar helpers
  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          dispatch(fetchQuotation()),
          dispatch(fetchSupervisor())
        ]);

        if (orderId) {
          await loadOrderData();
        }
      } catch (error) {
        console.error("Error initializing data:", error);
        showSnackbar("Failed to load initial data", "error");
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
      setPreviousPOData(res.payload || []);

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

      // Find matching quote
      const matchedQuote = quoteList.find(q => q.id === orderData.quotation_id) || {
        id: orderData.quotation_id,
        batch_no: orderData.batch_no
      };

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

      showSnackbar("Order data loaded successfully", "success");
    } catch (error) {
      console.error("Error loading order:", error);
      showSnackbar("Failed to load order data", "error");
      setTimeout(() => navigate("/customer/order"), 2000);
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
      setPreviousPOData([]);
      return;
    }

    setLoadingState(prev => ({ ...prev, quotation: true }));

    try {
      // Fetch previous PO data for the selected quotation
      const res = await dispatch(getPreviousPO({ id: selectedQuote.id }));
      setPreviousPOData(res.payload || []);

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
      showSnackbar("Failed to load quotation details", "error");
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
  const handleProductionQtyChange = (rowId, value, maxQty, prevQty = 0, completedQty = 0) => {
    let qty = Number(value);
    const totalUsedQty = prevQty + completedQty;
    const remainingQty = Math.max(0, maxQty - totalUsedQty);

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
    showSnackbar("Item removed successfully", "success");
  };

  // Form validation
  const validateForm = () => {
    const { selectedQuote, projectStartDate, edd, items } = formData;

    if (selectedQuote?.id && !selectedQuote) {
      showSnackbar("Please select a quotation", "warning");
      return false;
    }

    if (!projectStartDate) {
      showSnackbar("Please select project start date", "warning");
      return false;
    }

    if (!edd) {
      showSnackbar("Please select EDD (Expected Delivery Date)", "warning");
      return false;
    }

    if (items.length === 0) {
      showSnackbar("No items to update. Please add at least one item.", "warning");
      return false;
    }

    // Validate each item
    for (const item of items) {
      if (!item.production_qty || item.production_qty <= 0) {
        showSnackbar(`Please enter production quantity for ${item.name}`, "warning");
        return false;
      }

      if (!item.start_date) {
        showSnackbar(`Please select start date for ${item.name}`, "warning");
        return false;
      }

      if (!item.end_date) {
        showSnackbar(`Please select end date for ${item.name}`, "warning");
        return false;
      }

      if (item.start_date > item.end_date) {
        showSnackbar(`End date must be after start date for ${item.name}`, "warning");
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
        commencement_date: projectStartDate,
        delivery_date: edd,
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
      showSnackbar("Order updated successfully!", "success");
      setTimeout(() => navigate("/customer/order"), 1000);
    } catch (error) {
      console.error("Error updating order:", error);
      showSnackbar("Failed to update order. Please try again.", "error");
    } finally {
      setLoadingState(prev => ({ ...prev, submitting: false }));
    }
  };

  const isLoading = loadingState.orderData || loadingState.quotation || loadingState.submitting;
  const loadingMessage = loadingState.orderData ? "Loading order data..." :
    loadingState.quotation ? "Loading quotation..." :
      "Updating order...";

  // Mobile Card View Component
  const MobileCardView = ({ items, previousPOData, handleProductionQtyChange, updateItem, handleDeleteItem, mediaUrl }) => {
    return (
      <Stack spacing={1} sx={{ mt: 2 }}>
        {items.map((item) => {
          // Find in-production match (status = 1)
          const prevMatch = previousPOData.find(
            (p) =>
              p.status === 1 &&
              p.product_id == item.product_id &&
              p.group.trim() === item.group.trim()
          );

          // Find completed match (status = 2)
          const completedMatch = previousPOData.find(
            (p) =>
              p.status === 2 &&
              p.product_id == item.product_id &&
              p.group.trim() === item.group.trim()
          );

          const inProductionQty = prevMatch ? parseInt(prevMatch.total_qty || 0) : 0;
          const completedQty = completedMatch ? parseInt(completedMatch.total_qty || 0) : 0;
          const totalUsedQty = inProductionQty + completedQty;
          const isFullyProduced = totalUsedQty >= parseInt(item.original_qty);

          return (
            <Card key={item.rowId} variant="outlined" sx={{ position: 'relative', bgcolor: '#f7f7f7', pb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    {item.name}
                  </Typography>
                  <Tooltip title="Delete">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteItem(item.rowId)}
                    >
                      <RiDeleteBinLine size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Group</Typography>
                    <Typography variant="body2">{item.group}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Model</Typography>
                    <Typography variant="body2">{item.model}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Unique Code</Typography>
                    <Typography variant="body2">{item.unique_code}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {formData.selectedQuote?.id !== null && (
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Qty</Typography>
                        <Typography variant="body2">{item.original_qty}</Typography>
                      </Box>
                    )}

                    {previousPOData.length > 0 && (
                      <>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">In Production</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {prevMatch ? (
                              <Chip
                                label={prevMatch.total_qty}
                                color="info"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">0</Typography>
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">Completed</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {completedMatch ? (
                              <Chip
                                label={completedMatch.total_qty}
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">0</Typography>
                            )}
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {formData.selectedQuote?.id == null ? 'Qty' : 'Production Qty'}
                    </Typography>
                    {isFullyProduced && formData.selectedQuote?.id !== null ? (
                      <Typography
                        variant="body2"
                        color="success.main"
                        sx={{ fontWeight: 500 }}
                      >
                        ✓ Completed
                      </Typography>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={item.production_qty ?? ""}
                        onChange={(e) =>
                          handleProductionQtyChange(
                            item.rowId,
                            e.target.value,
                            item.original_qty,
                            inProductionQty,
                            completedQty
                          )
                        }
                        inputProps={{
                          min: 0,
                          max: formData.selectedQuote?.id !== null ? item.original_qty - totalUsedQty : undefined,
                        }}
                        helperText={totalUsedQty > 0 && formData.selectedQuote?.id !== null ? `Remaining: ${item.original_qty - totalUsedQty}` : ''}
                      />
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Size</Typography>
                    <Typography variant="body2">{item.size}</Typography>
                  </Box>

                  {item.document && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Document
                      </Typography>
                      <ImagePreviewDialog
                        imageUrl={mediaUrl + item.document}
                        alt={item.name}
                      />
                    </Box>
                  )}

                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Start Date
                      </Typography>
                      <DatePicker
                        value={item.start_date}
                        onChange={(newValue) => updateItem(item.rowId, 'start_date', newValue)}
                        disablePast
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        End Date
                      </Typography>
                      <DatePicker
                        value={item.end_date}
                        onChange={(newValue) => updateItem(item.rowId, 'end_date', newValue)}
                        disablePast
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                          },
                        }}
                      />
                    </Box>
                  </LocalizationProvider>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  };

  return (
    <>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

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
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center" justifyContent="space-between">
        <Grid item>
          <Typography variant="h6" className="page-title">Edit Order</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            onClick={() => navigate("/customer/order")}
          >
            Back to Orders
          </Button>
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
                sx={{ width: { xs: '100%', md: 300 } }}
              />

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexDirection: { xs: 'column', md: 'row' },
                    width: { xs: '100%', md: 'auto' },
                  }}
                >
                  <DatePicker
                    label="Project Start Date"
                    value={formData.projectStartDate}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, projectStartDate: newValue }))}
                    disablePast
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { width: { xs: '100%', md: 300 } },
                      },
                    }}
                  />

                  <DatePicker
                    label="EDD"
                    value={formData.edd}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, edd: newValue }))}
                    disablePast
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { width: { xs: '100%', md: 300 } },
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>
            </Box>
          </Grid>

          {/* Customer Information */}
          {(formData.selectedQuote?.customer || formData.customer) && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Customer Details
              </Typography>
              <Typography variant="body2">
                <strong>{formData.selectedQuote?.customer?.name ?? formData.customer?.name}</strong><br />
                {formData.selectedQuote?.customer?.address ?? formData.customer?.address}<br />
                {formData.selectedQuote?.customer?.city ?? formData.customer?.city},{' '}
                {formData.selectedQuote?.customer?.state?.name ?? formData.customer?.state?.name}{' '}
                {formData.selectedQuote?.customer?.zip_code ?? formData.customer?.zip_code}
              </Typography>
            </Box>
          )}

          {/* Items Section */}
          {formData.items.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Items ({formData.items.length})
              </Typography>

              {isMobile ? (
                <MobileCardView
                  items={formData.items}
                  previousPOData={previousPOData}
                  handleProductionQtyChange={handleProductionQtyChange}
                  updateItem={updateItem}
                  handleDeleteItem={handleDeleteItem}
                  mediaUrl={mediaUrl}
                />
              ) : (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>Group</Th>
                          <Th>Product Name</Th>
                          <Th>Model</Th>
                          <Th>Unique Code</Th>
                          {formData.selectedQuote?.id !== null && <Th>Qty</Th>}
                          {previousPOData.length > 0 && <Th>Qty in Production</Th>}
                          <Th>{formData.selectedQuote?.id == null ? 'Qty' : 'Production Qty'}</Th>
                          {previousPOData.length > 0 && <Th>Completed Product</Th>}
                          <Th>Size</Th>
                          <Th>Document</Th>
                          <Th>Start Date</Th>
                          <Th>End Date</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {formData.items.map((item) => {
                          // Find in-production match (status = 1)
                          const prevMatch = previousPOData.find(
                            (p) =>
                              p.status === 1 &&
                              p.product_id == item.product_id &&
                              p.group.trim() === item.group.trim()
                          );

                          // Find completed match (status = 2)
                          const completedMatch = previousPOData.find(
                            (p) =>
                              p.status === 2 &&
                              p.product_id == item.product_id &&
                              p.group.trim() === item.group.trim()
                          );

                          const inProductionQty = prevMatch ? parseInt(prevMatch.total_qty || 0) : 0;
                          const completedQty = completedMatch ? parseInt(completedMatch.total_qty || 0) : 0;
                          const totalUsedQty = inProductionQty + completedQty;
                          const isFullyProduced = totalUsedQty >= parseInt(item.original_qty);

                          return (
                            <Tr key={item.rowId}>
                              <Td>{item.group}</Td>
                              <Td>{item.name}</Td>
                              <Td>{item.model}</Td>
                              <Td>{item.unique_code}</Td>
                              {formData.selectedQuote?.id !== null && (
                                <Td>{item.original_qty}</Td>
                              )}

                              {/* Qty in Production */}
                              {previousPOData.length > 0 && (
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

                              {/* Production Qty */}
                              <Td style={{ textAlign: "center" }}>
                                {isFullyProduced && formData.selectedQuote?.id !== null ? (
                                  <Typography
                                    variant="body2"
                                    color="success.main"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    ✓ Completed
                                  </Typography>
                                ) : (
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.production_qty ?? ""}
                                    onChange={(e) =>
                                      handleProductionQtyChange(
                                        item.rowId,
                                        e.target.value,
                                        item.original_qty,
                                        inProductionQty,
                                        completedQty
                                      )
                                    }
                                    sx={{ width: 100 }}
                                    inputProps={{
                                      min: 0,
                                      max: formData.selectedQuote?.id !== null
                                        ? Math.max(0, item.original_qty - totalUsedQty)
                                        : undefined,
                                    }}
                                    helperText={totalUsedQty > 0 && formData.selectedQuote?.id !== null ? `Max: ${item.original_qty - totalUsedQty}` : ''}
                                  />
                                )}
                              </Td>

                              {/* Completed Product */}
                              {previousPOData.length > 0 && (
                                <Td style={{ textAlign: "center" }}>
                                  {completedMatch ? (
                                    <Chip
                                      label={completedMatch.total_qty}
                                      color="success"
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
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                </LocalizationProvider>
              )}
            </>
          )}

          {/* Empty State */}
          {formData.items.length === 0 && !loadingState.orderData && (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="body1" color="text.secondary">
                {formData.selectedQuote ? 'No items found in this quotation' : 'Please select a quotation to view items'}
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ justifyContent: "flex-end", mt: 4, mb: 2 }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate("/customer/order")}
              disabled={loadingState.submitting}
              fullWidth={isMobile}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateOrder}
              disabled={loadingState.submitting || formData.items.length === 0}
              startIcon={loadingState.submitting && <CircularProgress size={20} />}
              fullWidth={isMobile}
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
            Are you sure you want to delete this item? This action cannot be undone.
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
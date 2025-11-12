import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  Box,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardContent,
  Stack,
  CircularProgress,
  Backdrop,
  Chip,
  TextField
} from "@mui/material";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineCheckCircle } from "react-icons/md";
import { AiOutlineSetting } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { approveAllProduct, approveSingleProduct, editOrder, getPreviousPO } from "../slice/orderSlice";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import { format } from "date-fns";

const OrderDetailsView = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  // State management
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [previousPOData, setPreviousPOData] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [editedProductionQty, setEditedProductionQty] = useState({});

  // Load order data on mount
  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId, dispatch]);

  // Fetch order details
  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await dispatch(editOrder(orderId)).unwrap();

      const data = response.data || response;

      if (!data) {
        throw new Error("Order not found");
      }
      const res = await dispatch(getPreviousPO({ id: data.quotation_id, orderId }));
      setPreviousPOData(res.payload);

      // Parse product items from JSON string
      let productItems = [];
      try {
        productItems = typeof data.product_ids === 'string'
          ? JSON.parse(data.product_ids)
          : data.product_ids || [];
      } catch (parseError) {
        console.error("Error parsing product_ids:", parseError);
        productItems = [];
      }

      setCustomer(data.customer);

      // Format items for display
      const formattedItems = productItems.map((item, index) => ({
        id: index + 1,
        product_id: item.product_id,
        group: item.group || "N/A",
        name: item.name || "N/A",
        model: item.model || "N/A",
        unique_code: item.unique_code || "N/A",
        original_qty: item.original_qty || 0,
        production_qty: item.production_qty || 0,
        size: item.size || "N/A",
        document: item.document || "",
        start_date: item.start_date ? format(new Date(item.start_date), "dd MMM yyyy") : "N/A",
        end_date: item.end_date ? format(new Date(item.end_date), "dd MMM yyyy") : "N/A",
      }));

      setOrderData(data);
      setItems(formattedItems);
      setProducts(data.products);

      // Initialize edited quantities
      const initialQty = {};
      formattedItems.forEach(item => {
        initialQty[item.id] = item.production_qty;
      });
      setEditedProductionQty(initialQty);
    } catch (error) {
      console.error("Error loading order details:", error);
      alert("Failed to load order details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit item click
  const handleEditClick = (itemId) => {
    setEditingItemId(itemId);
  };

  // Handle production qty change
  const handleProductionQtyChange = (itemId, value) => {
    setEditedProductionQty(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  // Handle save edited item
  const handleSaveEdit = (itemId) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          production_qty: editedProductionQty[itemId]
        };
      }
      return item;
    });

    setItems(updatedItems);
    setEditingItemId(null);
  };

  // Handle cancel edit
  const handleCancelEdit = (itemId) => {
    // Reset to original value
    const originalItem = items.find(item => item.id === itemId);
    if (originalItem) {
      setEditedProductionQty(prev => ({
        ...prev,
        [itemId]: originalItem.production_qty
      }));
    }
    setEditingItemId(null);
  };

  // Handle delete item
  const handleDeleteClick = (itemId) => {
    setSelectedItemId(itemId);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    setItems(items.filter(item => item.id !== selectedItemId));
    setOpenDelete(false);
    setSelectedItemId(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch (error) {
      return "N/A";
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      0: { label: "Pending", color: "warning" },
      1: { label: "Approved", color: "success" },
      2: { label: "In Progress", color: "info" },
      3: { label: "Completed", color: "success" },
      4: { label: "Cancelled", color: "error" }
    };
    const statusInfo = statusMap[status] || { label: "Unknown", color: "default" };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  // Handle approve all product - send updated production quantities
  const handleApproveAll = async (id) => {
    try {
      // Prepare items data with updated production quantities
      const updatedItems = items.map(item => ({
        product_id: item.product_id,
        group: item.group,
        name: item.name,
        model: item.model,
        unique_code: item.unique_code,
        original_qty: item.original_qty,
        production_qty: editedProductionQty[item.id] || item.production_qty,
        size: item.size,
        document: item.document,
        start_date: item.start_date,
        end_date: item.end_date
      }));

      // Send approval with updated production quantities
      await dispatch(approveAllProduct({
        id: id,
        items: updatedItems
      }));

      loadOrderDetails();
    } catch (error) {
      console.error("Error approving order:", error);
      alert("Failed to approve order. Please try again.");
    }
  };

  // Handle approve single product
  const handleApproveSingle = async (poID, group, productID) => {
    try {
      // Find the item to get updated production quantity
      const item = items.find(i =>
        i.product_id == productID &&
        i.group.trim() === group.trim()
      );

      await dispatch(approveSingleProduct({
        po_id: poID,
        group: group,
        prodcut_id: productID,
        production_qty: item ? (editedProductionQty[item.id] || item.production_qty) : 0
      }));

      loadOrderDetails();
    } catch (error) {
      console.error("Error approving single product:", error);
      alert("Failed to start production. Please try again.");
    }
  };

  if (loading) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>Loading order details...</Typography>
        </Box>
      </Backdrop>
    );
  }

  if (!orderData) {
    return (
      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h6">No order data found</Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Order Details</Typography>
        </Grid>
        <Grid item>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/customer/order/create"
            >
              Create Order
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={12}>
          <Card>
            <CardContent>
              {/* Order Header */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">
                    Order No: <Box component="span" sx={{ fontWeight: 600 }}>{orderData.batch_no}</Box>
                  </Typography>
                  {getStatusBadge(orderData.status)}
                </Stack>

                <Grid
                  container
                  spacing={3}
                  sx={{
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Quotation ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {orderData.quotation_id}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Commencement Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(orderData.commencement_date)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Delivery Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(orderData.delivery_date)}
                    </Typography>
                  </Grid>

                  {orderData.priority && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Priority
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {orderData.priority}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(orderData.created_at)}
                    </Typography>
                  </Grid>

                  {orderData.remark && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Remarks
                      </Typography>
                      <Typography variant="body1">{orderData.remark}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Company Information */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>From</Typography>
                <Typography variant="body2">
                  <strong>{customer?.name}</strong><br />
                  {customer?.address}<br />
                  {customer?.city },
                  {customer?.state?.name}
                  {' '+customer?.zip_code }
                </Typography>
              </Box>

              {/* Action Buttons */}
              {orderData.status === 0 && (
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ justifyContent: "flex-end", mb: 3 }}
                >
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<MdOutlineCheckCircle />}
                    onClick={() => handleApproveAll(orderId)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<BiSolidEditAlt />}
                    component={Link}
                    to={`/customer/order/edit/${orderId}`}
                  >
                    Edit
                  </Button>
                </Stack>
              )}

              {/* Items Table */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Order Items</Typography>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>#</Th>
                      <Th>Group</Th>
                      <Th>Product Name</Th>
                      <Th>Model</Th>
                      <Th>Unique Code</Th>
                      <Th>Original Qty</Th>
                      {previousPOData?.length > 0 && <Th>Qty in Production</Th>}
                      <Th>Production Qty</Th>
                      <Th>Size</Th>
                      <Th>Document</Th>
                      <Th>Start Date</Th>
                      <Th>End Date</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {items.length === 0 ? (
                      <Tr>
                        <Td colSpan={13} style={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No items found
                          </Typography>
                        </Td>
                      </Tr>
                    ) : (
                      items.map((item) => {
                        const matchedProduct = products.find(
                          (p) =>
                            p.group.trim() === item.group.trim() &&
                            p.product_id == item.product_id
                        );

                        const prevMatch = previousPOData?.find(
                          (p) =>
                            p.product_id == item.product_id &&
                            p.group.trim() === item.group.trim()
                        );

                        const isEditing = editingItemId === item.id;

                        return (
                          <Tr key={item.id}>
                            <Td>{item.id}</Td>
                            <Td>{item.group}</Td>
                            <Td>{item.name}</Td>
                            <Td>{item.model}</Td>
                            <Td>{item.unique_code}</Td>
                            <Td>{item.original_qty}</Td>
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
                            <Td style={{ textAlign: "center" }}>
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={editedProductionQty[item.id] || 0}
                                  onChange={(e) => handleProductionQtyChange(item.id, e.target.value)}
                                  inputProps={{ min: 0 }}
                                  sx={{ width: '100px' }}
                                />
                              ) : (
                                <Chip

                                  label={editedProductionQty[item.id] || item.production_qty}
                                  color="primary"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Td>
                            <Td>{item.size}</Td>
                            <Td>
                              {item.document ? (
                                <ImagePreviewDialog
                                  imageUrl={mediaUrl + item.document}
                                  alt={item.name}
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No Document
                                </Typography>
                              )}
                            </Td>
                            <Td>{item.start_date}</Td>
                            <Td>{item.end_date}</Td>
                            <Td>
                              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                {matchedProduct && matchedProduct.status !== 1 && (
                                  <Tooltip title="Start Production">
                                    <IconButton
                                      color="warning"
                                      onClick={() => handleApproveSingle(matchedProduct?.po_id, matchedProduct?.group, matchedProduct?.product_id)}
                                    >
                                      <AiOutlineSetting size={16} />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {isEditing ? (
                                  <>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      onClick={() => handleSaveEdit(item.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleCancelEdit(item.id)}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Tooltip title="Edit Production Qty">
                                    <IconButton
                                      color="primary"
                                      onClick={() => handleEditClick(item.id)}
                                    >
                                      <BiSolidEditAlt size={16} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Td>
                          </Tr>
                        )
                      })
                    )}
                  </Tbody>
                </Table>
              </Box>

              {/* Summary Section */}
              {items.length > 0 && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: "#f9f9f9",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      width: "auto",
                      maxWidth: 600,
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Items
                      </Typography>
                      <Typography variant="h6">
                        {items.length}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Original Qty
                      </Typography>
                      <Typography variant="h6">
                        {items.reduce((sum, item) => sum + Number(item.original_qty || 0), 0)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Production Qty
                      </Typography>
                      <Typography variant="h6">
                        {items.reduce((sum, item) => sum + Number(editedProductionQty[item.id] || item.production_qty || 0), 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Item?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrderDetailsView;
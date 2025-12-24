import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  TextField,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter, AiOutlineSetting, AiOutlineEye } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineCheckCircle } from "react-icons/md";
import { useDispatch } from "react-redux";
import {
  approveAllProduct,
  approveSingleProduct,
  editOrder,
  getPreviousPO
} from "../slice/orderSlice";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import { format } from "date-fns";
import { trim } from "lodash";

// Constants
const ORDER_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: 4,
};

const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]: { label: "Pending", color: "warning" },
  [ORDER_STATUS.APPROVED]: { label: "Approved", color: "success" },
  [ORDER_STATUS.IN_PROGRESS]: { label: "In Progress", color: "info" },
  [ORDER_STATUS.COMPLETED]: { label: "Completed", color: "success" },
  [ORDER_STATUS.CANCELLED]: { label: "Cancelled", color: "error" },
};

const PRODUCTION_STATUS = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
};

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "N/A";
  }
};

const parseProductIds = (productIds) => {
  try {
    return typeof productIds === 'string' ? JSON.parse(productIds) : productIds || [];
  } catch (error) {
    console.error("Error parsing product_ids:", error);
    return [];
  }
};

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
  const [previousPOData, setPreviousPOData] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedProductionQty, setEditedProductionQty] = useState({});

  // Modal states
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [openStagesModal, setOpenStagesModal] = useState(false);
  const [selectedProductLogs, setSelectedProductLogs] = useState([]);

  // Format items helper
  const formatItems = useCallback((productItems) => {
    return productItems.map((item, index) => ({
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
      start_date: item.start_date ? formatDate(item.start_date) : "N/A",
      end_date: item.end_date ? formatDate(item.end_date) : "N/A",
    }));
  }, []);

  // Load order details
  const loadOrderDetails = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await dispatch(editOrder(orderId)).unwrap();
      const data = response.data || response;

      if (!data) {
        throw new Error("Order not found");
      }

      // Fetch previous PO data
      const previousPOResponse = await dispatch(
        getPreviousPO({ id: data.quotation_id, orderId })
      );
      setPreviousPOData(previousPOResponse.payload || []);

      // Parse and format product items
      const productItems = parseProductIds(data.product_ids);
      const formattedItems = formatItems(productItems);

      setOrderData(data);
      setItems(formattedItems);
      setProducts(data.products || []);

      // Initialize edited quantities
      const initialQty = formattedItems.reduce((acc, item) => {
        acc[item.id] = item.production_qty;
        return acc;
      }, {});
      setEditedProductionQty(initialQty);
    } catch (error) {
      console.error("Error loading order details:", error);
      alert("Failed to load order details. Please try again.");
      navigate("/customer/orders"); // Navigate back on error
    } finally {
      setLoading(false);
    }
  }, [orderId, dispatch, navigate, formatItems]);

  // Load order data on mount
  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  // Handle production qty change
  const handleProductionQtyChange = useCallback((itemId, value, maxQty, prevQty = 0) => {
    let qty = Number(value);
    const remainingQty = Math.max(0, maxQty - prevQty);

    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > remainingQty) qty = remainingQty;

    setEditedProductionQty((prev) => ({
      ...prev,
      [itemId]: qty,
    }));
  }, []);

  // Handle edit item
  const handleEditClick = useCallback((itemId) => {
    setEditingItemId(itemId);
  }, []);

  // Handle save edited item
  const handleSaveEdit = useCallback((itemId) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, production_qty: editedProductionQty[itemId] }
          : item
      )
    );
    setEditingItemId(null);
  }, [editedProductionQty]);

  // Handle cancel edit
  const handleCancelEdit = useCallback((itemId) => {
    const originalItem = items.find((item) => item.id === itemId);
    if (originalItem) {
      setEditedProductionQty((prev) => ({
        ...prev,
        [itemId]: originalItem.production_qty,
      }));
    }
    setEditingItemId(null);
  }, [items]);

  // Handle delete item
  const handleDeleteClick = useCallback((itemId) => {
    setSelectedItemId(itemId);
    setOpenDelete(true);
  }, []);

  const confirmDelete = useCallback(() => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== selectedItemId));
    setOpenDelete(false);
    setSelectedItemId(null);
  }, [selectedItemId]);

  // Handle approve all products
  const handleApproveAll = useCallback(async () => {
    try {
      const updatedItems = items.map((item) => ({
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
        end_date: item.end_date,
      }));

      await dispatch(
        approveAllProduct({
          id: orderId,
          items: updatedItems,
        })
      ).unwrap();

      await loadOrderDetails();
    } catch (error) {
      console.error("Error approving order:", error);
      alert("Failed to approve order. Please try again.");
    }
  }, [items, editedProductionQty, orderId, dispatch, loadOrderDetails]);

  // Handle approve single product
  const handleApproveSingle = useCallback(
    async (poID, group, productID) => {
      try {
        const item = items.find(
          (i) => i.product_id == productID && (i.group ?? "").trim() === (group ?? "").trim()
        );

        await dispatch(
          approveSingleProduct({
            po_id: poID,
            group: trim(group ?? ""),
            product_id: productID,
            production_qty: item
              ? editedProductionQty[item.id] || item.production_qty
              : 0,
          })
        ).unwrap();

        await loadOrderDetails();
      } catch (error) {
        console.error("Error approving single product:", error);
        alert("Failed to start production. Please try again.");
      }
    },
    [items, editedProductionQty, dispatch, loadOrderDetails]
  );

  // Handle view production stages
  const handleViewStages = useCallback((productId, group) => {
    // TODO: Fetch actual logs from API
    const mockLogs = [
      {
        id: 1,
        po_id: 4,
        production_product_id: productId,
        status: 1,
        from_stage: "Production Chain Initiated",
        to_stage: "Raw Material Gathering",
        remark: "Started raw material collection",
        action_by: 101,
        created_at: "2025-11-12 10:30:00",
      },
      {
        id: 2,
        po_id: 4,
        production_product_id: productId,
        status: 1,
        from_stage: "Raw Material Gathering",
        to_stage: "Assembly",
        remark: "All materials gathered, moving to assembly",
        action_by: 101,
        created_at: "2025-11-12 11:00:00",
      },
    ];
    setSelectedProductLogs(mockLogs);
    setOpenStagesModal(true);
  }, []);

  // Get status badge component
  const StatusBadge = useCallback(({ status }) => {
    const statusInfo = STATUS_CONFIG[status] || { label: "Unknown", color: "default" };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  }, []);

  // Memoized calculations
  const summary = useMemo(() => {
    return {
      totalItems: items.length,
      totalOriginalQty: items.reduce((sum, item) => sum + Number(item.original_qty || 0), 0),
      totalProductionQty: items.reduce(
        (sum, item) => sum + Number(editedProductionQty[item.id] || item.production_qty || 0),
        0
      ),
    };
  }, [items, editedProductionQty]);

  // Render loading state
  if (loading) {
    return (
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>Loading order details...</Typography>
        </Box>
      </Backdrop>
    );
  }

  // Render no data state
  if (!orderData) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6">No order data found</Typography>
        <Button
          component={Link}
          to="/customer/orders"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  const customer = orderData.customer;

  return (
    <>
      {/* Header */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6" className="page-title">Order Details</Typography>
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

      {/* Main Content */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={12}>
          <Card>
            <CardContent>
              {/* Order Header */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">
                    Order No:{" "}
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {orderData.batch_no}
                    </Box>
                  </Typography>
                  <StatusBadge status={orderData.status} />
                </Stack>

                <Grid container spacing={3} sx={{ justifyContent: "center", textAlign: "center" }}>
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

              {/* Customer Information */}
              {customer && (
                <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    From
                  </Typography>
                  <Typography variant="body2">
                    <strong>{customer.name}</strong>
                    <br />
                    {customer.address}
                    <br />
                    {customer.city}, {customer.state?.name} {customer.zip_code}
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              {orderData.status === ORDER_STATUS.PENDING && (
                <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mb: 3 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<MdOutlineCheckCircle />}
                    onClick={handleApproveAll}
                  >
                    {items.length > 1 ? "Approve All" : "Approve"}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<BiSolidEditAlt />}
                    component={Link}
                    to={`/customer/order/edit/${orderId}`}
                  >
                    Edit Order
                  </Button>
                </Stack>
              )}

              {/* Items Table */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Order Items
                </Typography>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>#</Th>
                      <Th>Group</Th>
                      <Th>Product Name</Th>
                      <Th>Model</Th>
                      <Th>Unique Code</Th>
                      <Th>Original Qty</Th>
                      {previousPOData.length > 0 && <Th>Qty in Production</Th>}
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
                        <Td colSpan={13} style={{ textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            No items found
                          </Typography>
                        </Td>
                      </Tr>
                    ) : (
                      items.map((item) => {
                        const matchedProduct = products.find(
                          (p) =>
                            (p.group ?? "").trim() === (item.group ?? "").trim() && p.product_id == item.product_id
                        );

                        const prevMatch = previousPOData.find(
                          (p) =>
                            p.product_id == item.product_id && (p.group ?? "").trim() === (item.group ?? "").trim()
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
                                  <Typography variant="body2" color="text.secondary">
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
                                  onChange={(e) =>
                                    handleProductionQtyChange(
                                      item.id,
                                      e.target.value,
                                      item.original_qty,
                                      prevMatch ? parseInt(prevMatch.total_qty || 0) : 0
                                    )
                                  }
                                  inputProps={{ min: 0 }}
                                  sx={{ width: "100px" }}
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
                                {/* Show buttons only when PRODUCT status is 0 (NOT_STARTED) */}
                                {matchedProduct && matchedProduct.status === PRODUCTION_STATUS.NOT_STARTED && (
                                  <>
                                    {/* Start Production Button - show only when multiple items */}
                                    {items.length > 1 && (
                                      <Tooltip title="Start Production">
                                        <IconButton
                                          color="warning"
                                          onClick={() =>
                                            handleApproveSingle(
                                              matchedProduct.po_id,
                                              matchedProduct.group,
                                              matchedProduct.product_id
                                            )
                                          }
                                        >
                                          <AiOutlineSetting size={16} />
                                        </IconButton>
                                      </Tooltip>
                                    )}

                                    {/* Edit Production Qty or Save/Cancel */}
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
                                  </>
                                )}

                                {/* Show View Stages button when production is IN_PROGRESS (status = 1) */}
                                {matchedProduct && matchedProduct.status === PRODUCTION_STATUS.IN_PROGRESS && (
                                  <Tooltip title="View Production Stages">
                                    <IconButton
                                      color="info"
                                      onClick={() =>
                                        handleViewStages(matchedProduct.product_id, matchedProduct.group)
                                      }
                                    >
                                      <AiOutlineEye size={18} />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {/* Show message when no matched product */}
                                {!matchedProduct && (
                                  <Typography variant="caption" color="text.secondary">
                                    —
                                  </Typography>
                                )}
                              </Box>
                            </Td>
                          </Tr>
                        );
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
                      <Typography variant="h6">{summary.totalItems}</Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Original Qty
                      </Typography>
                      <Typography variant="h6">{summary.totalOriginalQty}</Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Production Qty
                      </Typography>
                      <Typography variant="h6">{summary.totalProductionQty}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Item?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Production Stages Modal */}
      <Dialog
        open={openStagesModal}
        onClose={() => setOpenStagesModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Production Stages (Logs)</DialogTitle>
        <DialogContent dividers>
          {selectedProductLogs.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>From Stage</TableCell>
                  <TableCell>To Stage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell>Action By</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedProductLogs.map((log, index) => (
                  <TableRow key={log.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{log.from_stage}</TableCell>
                    <TableCell>{log.to_stage}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status === 1 ? "Completed" : "Pending"}
                        color={log.status === 1 ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.remark}</TableCell>
                    <TableCell>{log.action_by}</TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography textAlign="center" color="text.secondary">
              No production logs found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStagesModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrderDetailsView;
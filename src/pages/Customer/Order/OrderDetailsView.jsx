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
  Chip
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
import { editOrder } from "../slice/orderSlice";
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
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Load order data on mount
  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  // Fetch order details
  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await dispatch(editOrder(orderId)).unwrap();
      const data = response.data || response;

      if (!data) {
        throw new Error("Order not found");
      }

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
    } catch (error) {
      console.error("Error loading order details:", error);
      alert("Failed to load order details. Please try again.");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
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

  // Handle approve order
  const handleApprove = () => {
    // Add your approve logic here
    alert("Approve functionality to be implemented");
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
            {/* <Button
              variant="outlined"
              startIcon={<AiOutlinePrinter />}
              onClick={() => window.print()}
            >
              Print
            </Button> */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/orders/create"
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
                    justifyContent: "center", // centers all grid items horizontally
                    textAlign: "center",      // centers text inside each grid cell
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
                  <strong>TECHIE SQUAD PRIVATE LIMITED</strong><br />
                  CIN: U72900BR2019PTC042431<br />
                  RK NIWAS, GOLA ROAD MOR, BAILEY ROAD<br />
                  DANAPUR, PATNA-801503, BIHAR, INDIA<br />
                  GSTIN: 10AAHCT3899A1ZI
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Stack
                direction="row"
                spacing={2}
                sx={{ justifyContent: "flex-end", mb: 3 }}
              >
                {orderData.status === 0 && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<MdOutlineCheckCircle />}
                    onClick={handleApprove}
                  >
                    Approve
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<BiSolidEditAlt />}
                  component={Link}
                  to={`/orders/edit/${orderId}`}
                >
                  Edit
                </Button>
              </Stack>

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
                        <Td colSpan={12} style={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No items found
                          </Typography>
                        </Td>
                      </Tr>
                    ) : (
                      items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.id}</Td>
                          <Td>{item.group}</Td>
                          <Td>{item.name}</Td>
                          <Td>{item.model}</Td>
                          <Td>{item.unique_code}</Td>
                          <Td>{item.original_qty}</Td>
                          <Td>
                            <Chip
                              label={item.production_qty}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
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
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Tooltip title="Start Production">
                                <IconButton
                                  color="warning"
                                  onClick={() => alert("Start production functionality to be implemented")}
                                >
                                  <AiOutlineSetting size={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Item">
                                <IconButton
                                  color="primary"
                                  component={Link}
                                  to={`/orders/edit/${orderId}`}
                                >
                                  <BiSolidEditAlt size={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Item">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(item.id)}
                                >
                                  <RiDeleteBinLine size={16} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Td>
                        </Tr>
                      ))
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
                    justifyContent: "flex-end", // move the whole summary to the right
                  }}
                >
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      width: "auto",
                      maxWidth: 600,
                      justifyContent: "center", // center the internal grid items
                      textAlign: "center", // center text in each grid cell
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
                        {items.reduce((sum, item) => sum + Number(item.production_qty || 0), 0)}
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
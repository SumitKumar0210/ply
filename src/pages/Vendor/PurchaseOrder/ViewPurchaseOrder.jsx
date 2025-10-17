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
  CircularProgress,
  Box
} from "@mui/material";
import { Link } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineCheckCircle } from "react-icons/md";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { editPO } from "../slice/purchaseOrderSlice";

const ViewPurchaseOrder = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  useEffect(() => {
    if (id) {
      dispatch(editPO(id));
    }
  }, [id, dispatch]);
  const { data = {}, loading = false } = useSelector((state) => state.purchaseOrder);
console.log(data.vendor?.name);
console.log(data.vendor?.items);
console.log(data.vendor?.subtotal);

  const parseItems = (materialItems) => {
    try {
      if (!materialItems) return [];
      const items = typeof materialItems === "string" ? JSON.parse(materialItems) : materialItems;
      return Array.isArray(items) ? items : [];
    } catch (error) {
      console.error("Error parsing material items:", error);
      return [];
    }
  };

  const items = parseItems(data?.items);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
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
        <Grid>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create"
          >
            Create PO
          </Button>
        </Grid>
      </Grid>

      <Grid
        container
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid size={12}>
          <Card>
            <CardContent>
              {data && (
                <Grid size={{ xs: 12, md: 3 }} sx={{ pt: 2 }}>
                  <Typography variant="body2">
                    <strong>{data.vendor?.name}</strong>
                    <br />
                    {data?.address}
                    <br />
                    GSTIN: {data?.gst || "N/A"}
                  </Typography>
                </Grid>
              )}

              <Grid size={12} sx={{ mt: 3 }}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<MdOutlineCheckCircle />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<BiSolidEditAlt />}
                    component={Link}
                    to={`/vendor/purchase-order/edit/${id}`}
                  >
                    Edit PO
                  </Button>
                </Stack>
              </Grid>

              <Grid size={12} sx={{ mt: 3, overflowX: 'auto' }}>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Item Name</Th>
                      <Th>Item Code</Th>
                      <Th>Qty</Th>
                      <Th>Size</Th>
                      <Th>UOM</Th>
                      <Th>Rate</Th>
                      <Th>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {items && items.length > 0 ? (
                      items.map((item) => (
                        <Tr key={item.id || Math.random()}>
                          <Td>{item.name}</Td>
                          <Td>{item.code || "N/A"}</Td>
                          <Td>{item.qty}</Td>
                          <Td>{item.size}</Td>
                          <Td>{item.uom}</Td>
                          <Td>₹{item.rate?.toLocaleString('en-IN') || 0}</Td>
                          <Td>₹{item.total?.toLocaleString('en-IN') || 0}</Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                          No items found
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Grid>

              <Grid size={12} sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '200px', textAlign: 'right' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                      <span>Sub Total:</span>
                      <span>₹{data.subtotal?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                      <span>Discount:</span>
                      <span>₹{data.discount?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                      <span>Charges:</span>
                      <span>₹{data.additional_charges?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', pb: 0.5 }}>
                      <span>GST ({data.gst_percentage || 0}%):</span>
                      <span>₹{data.gst_amount?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #222', mt: 1, pt: 0.5, fontWeight: '600' }}>
                      <span>Grand Total:</span>
                      <span>₹{data.grand_total?.toLocaleString('en-IN') || 0}</span>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {data.order_terms && (
                <Grid size={12} sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Order Terms:</strong>
                    <br />
                    {data.order_terms}
                  </Typography>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ViewPurchaseOrder;
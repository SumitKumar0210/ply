import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Divider
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { editInward } from "../slice/purchaseInwardSlice";
import { useAuth } from "../../../context/AuthContext";

const PrintPurchaseOrder = () => {
const { appDetails } = useAuth();
  const contentRef = useRef(null);
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selected: po = {}, loading = true, error } = useSelector((state) => state.purchaseInward);

  useEffect(() => {
    if (id) dispatch(editInward(id));
  }, [dispatch, id]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Purchase Order",
    pageStyle: `
        @page {
          size: A4;
          margin: 5mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Force table to show on print */
          .desktop-table-view {
            display: block !important;
          }
          /* Hide mobile card view on print */
          .mobile-card-view {
            display: none !important;
          }
        }
      `,
  });

  const items = typeof po.material_items === "string"
  ? JSON.parse(po.material_items)
  : Array.isArray(po.material_items)
    ? po.material_items
    : [];

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>Error Loading Data</Typography>
          <Typography variant="body2">{error.message || "Failed to load purchase order data"}</Typography>
        </Alert>
      </Box>
    );
  }

  // Empty/No data state
  if (!po || !po.id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>Data Not Found</Typography>
          <Typography variant="body2">The requested purchase order could not be found.</Typography>
        </Alert>
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
          <Typography variant="h6" className="page-title">Purchase Order</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<AiOutlinePrinter />}
            color="warning"
            onClick={handlePrint}
          >
            Print
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
          <div ref={contentRef} style={{ background: "#fff", padding: "20px" }}>
            <Card>
              <CardContent>
                <Grid size={12} sx={{ pt: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 500, mb: 2, fontSize: { xs: '1.2rem', md: '1.25rem' } }}>Purchase Order</Typography>
                  </Box>
                </Grid>
                <Grid size={12} sx={{ pb: 2 }} borderBottom={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ m: 0 }}>
                        <Box component="span" sx={{ fontWeight: 600 }}>{new Date().toLocaleDateString()}</Box>
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        DIM/PO/{po.purchase_order ? po.purchase_order.purchase_no.slice(2) : '000'}
                      </Box>
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={12} sx={{ pt: 2, pb: 2 }} borderBottom={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: { xs: 'wrap', md: 'nowrap' },
                      gap: 2,
                      pt: 2
                    }}
                  >
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body1" sx={{ mb: 1 }} style={{ fontWeight: 600 }}>Company Detail</Typography>
                      <Typography variant="p">
                        {appDetails?.application_name || 'Aarish Ply & Boards Pvt Ltd'}
                        <br />
                        {appDetails?.company_address}
                        <br />
                        GSTIN: {appDetails?.gst_no || 'N/A'}
                        {/* <br />
                        Dated: 14/10/2025 */}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body1" sx={{ mb: 1 }} style={{ fontWeight: 600 }}>Vendor Detail</Typography>
                      <Typography variant="p">
                        {po.vendor?.name || 'N/A'}
                        <br />
                        {po.vendor?.address || 'N/A'}
                        <br />
                        {po.vendor?.city || 'N/A'}, {po.vendor?.state?.name || 'N/A'} {po.vendor?.zip_code || 'N/A'}
                        <br />
                        GSTIN: {po.vendor?.gst || 'N/A'}
                        <br />
                        {/* Dated: {po?.purchase_order?.order_date || 'N/A'} */}
                      </Typography>
                      {/* <Typography variant="body1" sx={{ mt: 1 }} style={{ fontWeight: 600 }}>
                        Dispatch Date: {po?.purchase_order?.order_date || 'N/A'}
                      </Typography> */}
                    </Grid>
                  </Box>
                </Grid>
               <Grid size={12} sx={{ mt: 3 }}>
  <Typography variant="body1" sx={{ mb: 2 }} style={{ fontWeight: 600 }}>
    Material Detail
  </Typography>
  
  {items && items.length > 0 ? (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }} className="desktop-table-view">
        <Table>
          <Thead>
            <Tr>
              <Th>Item Name</Th>
              <Th>Qty</Th>
              <Th>Size</Th>
              <Th>UOM</Th>
              <Th>Rate</Th>
              <Th>Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((item, index) => (
              <Tr key={item.material_id || index}>
                <Td>{item.name || 'N/A'}</Td>
                <Td>{item.qty || 0}</Td>
                <Td>{item.size || 'N/A'}</Td>
                <Td>{item.uom || 'N/A'}</Td>
                <Td>{item.rate || 0}</Td>
                <Td>{item.total || 0}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Mobile Card View - Hidden on desktop */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }} className="mobile-card-view">
        {items.map((item, index) => (
          <Card 
            key={item.material_id || index} 
            sx={{ 
              mb: 2, 
              border: '1px solid #e0e0e0',
              boxShadow: 1,
              backgroundColor: '#f7f7f7'
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                {item.name || 'N/A'}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Quantity:</Typography>
                  <Typography variant="body2" fontWeight={500}>{item.qty || 0}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Size:</Typography>
                  <Typography variant="body2" fontWeight={500}>{item.size || 'N/A'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">UOM:</Typography>
                  <Typography variant="body2" fontWeight={500}>{item.uom || 'N/A'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Rate:</Typography>
                  <Typography variant="body2" fontWeight={500}>{item.rate || 0}</Typography>
                </Box>
                
                <Divider />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total:</Typography>
                  <Typography variant="body1" fontWeight={500} color="success.main">
                    {item.total || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  ) : (
    <Alert severity="info">No items found in this purchase order</Alert>
  )}
</Grid>
                <Grid size={12} sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      width: '300px',
                      marginLeft: 'auto',
                    }}
                  >
                    <Box
                      className="fs-15"
                      sx={{
                        display: 'flex',
                        borderBottom: '1px solid #ccc',
                        pb: 0.5,
                      }}
                    >
                      <strong>Sub Total</strong>
                      <span style={{ marginLeft: 'auto' }}>{po.subtotal || 0}</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <strong>Discount</strong>
                      <span style={{ marginLeft: 'auto' }}>{po.discount || 0}</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <strong>Additional Charges</strong>
                      <span style={{ marginLeft: 'auto' }}>{po.carriage_amount || 0}</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <strong>GST ({parseInt(po.gst_per) || 0}%)</strong>
                      <span style={{ marginLeft: 'auto' }}>{po.gst_amount || 0}</span>
                    </Box>

                    <Box
                      className="fs-15"
                      sx={{
                        display: 'flex',
                        borderTop: '1px solid #222',
                        mt: 1,
                        pt: 0.5,
                        fontWeight: 600,
                      }}                
                    >
                      <strong>Grand Total</strong>
                      <span style={{ marginLeft: 'auto' }}>{po.grand_total || 0}</span>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={12} style={{ marginTop: "150px" }} sx={{ px: 5, mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <Typography
                      variant="p"
                      sx={{
                        m: 0,
                        width: "180px",
                        textAlign: "center",
                        borderTop: 1,
                        borderColor: "grey.500",
                        lineHeight: "1.25 !important",
                      }}
                    >
                      Approved By
                    </Typography>
                    <Typography
                      variant="p"
                      sx={{
                        m: 0,
                        width: "180px",
                        textAlign: "center",
                        lineHeight: "1.25 !important",
                        borderTop: 1,
                        borderColor: "grey.500"

                      }}
                    >
                      Prepared By
                    </Typography>
                    <Typography
                      variant="p"
                      sx={{
                        m: 0,
                        width: "180px",
                        textAlign: "center",
                        lineHeight: "1.25 !important",
                        borderTop: 1,
                        borderColor: "grey.500"
                      }}
                    >
                      QC Done By
                    </Typography>
                  </Box>
                </Grid>
              </CardContent>
            </Card>
          </div>
        </Grid>
      </Grid>
    </>
  );
};

export default PrintPurchaseOrder;
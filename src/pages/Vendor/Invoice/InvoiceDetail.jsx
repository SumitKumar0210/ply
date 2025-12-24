import React, { useRef, useEffect } from "react";
import { Grid, Button, Typography, Card, CardContent, CircularProgress, Box } from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorInvoiceById } from "../slice/vendorInvoiceSlice";
import { useParams } from "react-router-dom";

const InvoiceDetail = () => {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();
  const contentRef = useRef(null);
  const { id } = useParams();

  const { selected: invoice, loading: dataLoading } = useSelector(
    (state) => state.vendorInvoice
  );

  // Fetch invoice data on component mount or when id changes
  useEffect(() => {
    if (id) {
      dispatch(fetchVendorInvoiceById(id));
    }
  }, [dispatch, id]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Invoice Detail Report",
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
      }
    `,
  });

  // Parse material items from invoice data
  const items = (() => {
    if (!invoice?.material_items) return [];

    try {
      return typeof invoice.material_items === "string"
        ? JSON.parse(invoice.material_items)
        : invoice.material_items;
    } catch (e) {
      console.error("Invalid material_items JSON:", e);
      return [];
    }
  })();

  // Show loading state
  if (dataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show message if no invoice found
  if (!invoice) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          No invoice data found
        </Typography>
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
        <Grid item>
          <Typography variant="h6">Invoice Detail</Typography>
        </Grid>
        <Grid item>
          {invoice?.document && (
            <Button
              sx={{ mr: 2 }}
              variant="contained"
              color="secondary"
              component="a"
              href={mediaUrl + invoice.document}
              target="_blank"
              rel="noopener noreferrer"
            >
              Uploaded Invoice
            </Button>
          )}

          <Button
            variant="contained"
            color="secondary"
            startIcon={<AiOutlinePrinter />}
            onClick={handlePrint}
            disabled={!invoice}
          >
            Print
          </Button>
        </Grid>
      </Grid>

      <div ref={contentRef} style={{ background: "#fff", padding: "20px" }}>
        <Card>
          <CardContent>
            <Typography variant="body2" sx={{ lineHeight: 1.8, mb: 2 }}>
              <strong>{invoice.vendor?.name || "-"}</strong>
              <br />
              {invoice.vendor?.address || "-"}
              <br />
              GSTIN: {invoice.vendor?.gst || "-"}
            </Typography>

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
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <Tr key={item.id || index}>
                      <Td>{item.name || "-"}</Td>
                      <Td>{item.qty || 0}</Td>
                      <Td>{item.size || "-"}</Td>
                      <Td>{item.uom || "-"}</Td>
                      <Td>{item.rate || 0}</Td>
                      <Td>{item.total || 0}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan="7" style={{ textAlign: "center" }}>
                      No items found
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>

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
                  <span>Sub Total</span>
                  <span style={{ marginLeft: 'auto' }}>{invoice.subtotal || 0}</span>
                </Box>

                {/* <Box className="fs-15" sx={{ display: 'flex' }}>
                  <span>Discount</span>
                  <span style={{ marginLeft: 'auto' }}>{invoice.discount || 0}</span>
                </Box> */}

                <Box className="fs-15" sx={{ display: 'flex' }}>
                  <span>Additional Charges</span>
                  <span style={{ marginLeft: 'auto' }}>{invoice.carriage_amount || 0}</span>
                </Box>

                <Box className="fs-15" sx={{ display: 'flex' }}>
                  <span>GST ({parseInt(invoice.gst_per) || 0}%)</span>
                  <span style={{ marginLeft: 'auto' }}>{invoice.gst_amount || 0}</span>
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
                  <span>Grand Total</span>
                  <span style={{ marginLeft: 'auto' }}>{invoice.grand_total || 0}</span>
                </Box>
              </Box>
            </Grid>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default InvoiceDetail;
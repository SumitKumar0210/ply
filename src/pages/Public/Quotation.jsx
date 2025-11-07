import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import api from "../../api";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";


const PublicQuoteDetailsView = () => {
    console.log('pass')
  const { link } = useParams();
  const fullUrl = window.location.href;
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const imageUrl = import.meta.env.VITE_MEDIA_URL;

  // State management
  const [items, setItems] = useState([]);
  const [quotationDetails, setQuotationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Quote_${quotationDetails?.batch_no || "Invoice"}`,
    pageStyle: `
      @page {
        size: A4 landscape;
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

  // ==================== API CALLS ====================

  // Fetch Quotation Details
  const fetchQuotationDetails = async (quotationId) => {
    try {
      setLoading(false);
      setError(null);

      const response = await api.post(`get-customer-quotation`, {link:quotationId});
      console.log(response)
      setQuotationDetails(response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching quotation:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch quotation";
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: `Error: ${errorMessage}`,
        severity: "error",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve Quotation
  const approveQuotation = async (quotationId) => {
    try {
      setApproving(true);

      const response = await api.post(`/quotations/${quotationId}/approve`, {
        status: "approved",
        approved_at: new Date().toISOString(),
      });

      setSnackbar({
        open: true,
        message: "Quotation approved successfully!",
        severity: "success",
      });

      // Refresh quotation data
      await fetchQuotationDetails(quotationId);
      
      return response.data;
    } catch (err) {
      console.error("Error approving quotation:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to approve quotation";
      setSnackbar({
        open: true,
        message: `Error approving: ${errorMessage}`,
        severity: "error",
      });
      throw err;
    } finally {
      setApproving(false);
    }
  };

  // ==================== END API CALLS ====================

  // Load quotation data on mount
  useEffect(() => {
    if (fullUrl) {
      fetchQuotationDetails(fullUrl);
    }
  }, [fullUrl]);

  // Parse and set quotation data
  useEffect(() => {
    if (quotationDetails && quotationDetails.id) {
      try {
        // Parse product_ids JSON string
        let parsedItems = [];
        if (quotationDetails.product_ids) {
          try {
            parsedItems = JSON.parse(quotationDetails.product_ids);
          } catch (e) {
            console.error("Error parsing product_ids:", e);
          }
        }

        // Format items
        const formattedItems = parsedItems.map((item) => ({
          id: item.id || Date.now() + Math.random(),
          group: item.group || "",
          name: item.name || "",
          itemCode: item.model || "",
          qty: parseInt(item.qty, 10) || 0,
          size: item.size || "",
          documents:
            typeof item.document === "string"
              ? imageUrl + item.document
              : imageUrl + item.document?.name || "",
          cost: parseFloat(item.cost) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          narration: item.narration || "",
        }));

        setItems(formattedItems);
      } catch (error) {
        console.error("Error parsing quotation data:", error);
        setError("Error processing quotation data");
      }
    }
  }, [quotationDetails]);

  const uniqueAreas = [...new Set(items.map((item) => item.group))];

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Calculate totals
  const subTotal = items.reduce((sum, item) => sum + item.cost, 0);
  const discount = parseFloat(quotationDetails?.discount || 0);
  const additionalCharges = parseFloat(
    quotationDetails?.additional_charges || 0
  );
  const gstRate = parseFloat(quotationDetails?.gst_rate || 0);
  const afterDiscount = subTotal - discount + additionalCharges;
  const gstAmount = (afterDiscount * gstRate) / 100;
  const grandTotal = afterDiscount + gstAmount;

  // Handle Approve button click
  const handleApprove = async () => {
    if (id) {
      await approveQuotation(id);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show loader while data is loading
  if (loading || !quotationDetails) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Show error state
  if (error && !quotationDetails) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error">
          Error Loading Quotation
        </Typography>
        <Typography variant="body2">{error}</Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
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
          <Typography variant="h6">Quotation Details</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={approving || quotationDetails?.status === "approved"}
            sx={{ mr: 2 }}
          >
            {approving ? (
              <CircularProgress size={24} color="inherit" />
            ) : quotationDetails?.status === "approved" ? (
              "Approved"
            ) : (
              "Approve"
            )}
          </Button>

          <Button
            variant="contained"
            color="warning"
            startIcon={<AiOutlinePrinter />}
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
                {/* Header Section */}
                <Grid size={12} sx={{ pt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="body1" sx={{ m: 0 }}>
                      Quote No. :{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {quotationDetails.batch_no || "N/A"}
                      </Box>
                    </Typography>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      Quote Date:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {formatDate(quotationDetails.created_at)}
                      </Box>
                    </Typography>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      Delivery Date:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {formatDate(quotationDetails.delivery_date)}
                      </Box>
                    </Typography>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      Priority:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {quotationDetails.priority || "Normal"}
                      </Box>
                    </Typography>
                  </Box>
                </Grid>

                {/* Company Details */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ pt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    From:
                  </Typography>
                  <Typography variant="body2">
                    TECHIE SQUAD PRIVATE LIMITED
                    <br />
                    CIN: U72900BR2019PTC042431
                    <br />
                    RK NIWAS, GOLA ROAD MOR, BAILEY ROAD
                    <br />
                    DANAPUR, PATNA-801503, BIHAR, INDIA
                    <br />
                    GSTIN: 10AAHCT3899A1ZI
                  </Typography>
                </Grid>

                {/* Customer Details */}
                {quotationDetails.customer && (
                  <Grid size={{ xs: 12, md: 6 }} sx={{ pt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      To:
                    </Typography>
                    <Typography variant="body2">
                      <strong>{quotationDetails.customer.name}</strong>
                      <br />
                      {quotationDetails.customer.address}
                      <br />
                      {quotationDetails.customer.city},{" "}
                      {quotationDetails.customer.state?.name}{" "}
                      {quotationDetails.customer.zip_code}
                      <br />
                      Mobile: {quotationDetails.customer.mobile}
                      <br />
                      Email: {quotationDetails.customer.email}
                    </Typography>
                  </Grid>
                )}

                {/* Items Table by Group */}
                {uniqueAreas.map((area) => (
                  <React.Fragment key={area}>
                    <Grid size={12} sx={{ pt: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                          flexWrap: "nowrap",
                          backgroundColor: "#f5f5f5",
                          padding: "8px 12px",
                          borderRadius: "4px",
                        }}
                      >
                        <Typography variant="body1" sx={{ m: 0 }}>
                          <Box component="span" sx={{ fontWeight: 600 }}>
                            {area}
                          </Box>
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={12} sx={{ mt: 0 }}>
                      <Table>
                        <Thead>
                          <Tr>
                            <Th>Item Name</Th>
                            <Th>Item Code</Th>
                            <Th>Qty</Th>
                            <Th>Size</Th>
                            <Th>Unit Price</Th>
                            <Th>Total Cost</Th>
                            <Th>Documents</Th>
                            <Th style={{ width: "200px" }}>Narration</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {items
                            .filter((item) => item.group === area)
                            .map((item) => (
                              <Tr key={item.id}>
                                <Td>{item.name}</Td>
                                <Td>{item.itemCode}</Td>
                                <Td>{item.qty}</Td>
                                <Td>{item.size}</Td>
                                <Td>
                                  ₹{item.unitPrice.toLocaleString("en-IN")}
                                </Td>
                                <Td>₹{item.cost.toLocaleString("en-IN")}</Td>
                                <Td>
                                  {item.documents ? (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}
                                    >
                                      <ImagePreviewDialog
                                        imageUrl={item.documents}
                                        alt={item.documents.split("/").pop()}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ wordBreak: "break-all" }}
                                      >
                                        {item.documents.split("/").pop()}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    "-"
                                  )}
                                </Td>
                                <Td style={{ width: "200px" }}>
                                  {item.narration || "-"}
                                </Td>
                              </Tr>
                            ))}
                        </Tbody>
                      </Table>
                    </Grid>
                  </React.Fragment>
                ))}

                {/* Order Terms and Totals Section */}
                <Grid size={12} sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Order Terms */}
                    <Box sx={{ width: "48%", minWidth: "300px" }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Order Terms:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          minHeight: "80px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {quotationDetails.order_terms ||
                          "No order terms specified"}
                      </Typography>
                    </Box>

                    {/* Totals */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        minWidth: "300px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          borderBottom: "1px solid #ccc",
                          pb: 0.5,
                        }}
                      >
                        <span>Sub Total</span>
                        <span>₹{subTotal.toLocaleString("en-IN")}</span>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Discount</span>
                        <span>₹{discount.toLocaleString("en-IN")}</span>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Additional Charges</span>
                        <span>
                          ₹{additionalCharges.toLocaleString("en-IN")}
                        </span>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>GST ({gstRate}%)</span>
                        <span>₹{gstAmount.toLocaleString("en-IN")}</span>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          borderTop: "2px solid #222",
                          mt: 1,
                          pt: 0.5,
                          fontWeight: "600",
                        }}
                      >
                        <span>Grand Total</span>
                        <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </CardContent>
            </Card>
          </div>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PublicQuoteDetailsView;
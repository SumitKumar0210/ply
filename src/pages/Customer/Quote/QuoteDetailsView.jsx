import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  TextareaAutosize,
  Box,
  CircularProgress,
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { editQuotation, approveQuotation } from "../slice/quotationSlice";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import { useAuth } from "../../../context/AuthContext";

const QuoteDetailsView = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { appDetails } = useAuth();
  const contentRef = useRef(null);

  const imageUrl = import.meta.env.VITE_MEDIA_URL;

  const [items, setItems] = useState([]);
  const [quotationDetails, setQuotationDetails] = useState(null);

  const { selected: quotationData = {}, loading: quotationLoading } =
    useSelector((state) => state.quotation);


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

  // Load quotation data
  useEffect(() => {
    if (id) {
      fetchQuotation(id);
    }
  }, [dispatch, id]);

  const fetchQuotation = (id) => {
    dispatch(editQuotation(id));
  }

  const handleApprove = async (id) => {
    await dispatch(approveQuotation(id));
    fetchQuotation(id);


  }
  // Parse and set quotation data
  useEffect(() => {
    if (quotationData && quotationData.id) {
      try {
        // Parse product_ids JSON string
        let parsedItems = [];
        if (quotationData.product_ids) {
          try {
            parsedItems = JSON.parse(quotationData.product_ids);
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
        setQuotationDetails(quotationData);
      } catch (error) {
        console.error("Error parsing quotation data:", error);
      }
    }
  }, [quotationData]);

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

  // Show loader while data is loading
  if (quotationLoading || !quotationDetails) {
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
          <Typography variant="h6" className="page-title">Quotation Details</Typography>
        </Grid>
        <Grid>
          {(quotationDetails.status !== 2) && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleApprove(quotationData.id)}
              sx={{ mr: 2 }}
            >
              Approve Quotation
            </Button>
          )}


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
                <Grid size={12} sx={{ pt: { xs: 0, sm: 1 } }}>
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
                    {appDetails.application_name}
                    <br />
                    {appDetails.company_address}
                    <br />
                    GSTIN: {appDetails.gst_no}

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
                          mb:2
                        }}
                      >
                        <Typography variant="body1" sx={{ m: 0 }}>
                          <Box component="span" sx={{ fontWeight: 600 }}>
                            {area}
                          </Box>
                        </Typography>
                      </Box>
                    </Grid>
                    {isMobile ? (
                      // 🔹 MOBILE VIEW (Cards)
                      <>
                        <Box >
                          {items.map((item) => (
                            <Card
                              key={item.id}
                              sx={{
                                mb: 2,
                                backgroundColor: '#f7f7f7',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              <CardContent>
                                <Grid container spacing={1}>
                                  <Grid size={12}>
                                    <Typography variant="h6" sx={{ fontWeight: 600}}>
                                      {item.name}
                                    </Typography>
                                  </Grid>

                                  <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Item Code
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {item.itemCode}
                                    </Typography>
                                  </Grid>

                                  <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Qty
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {item.qty}
                                    </Typography>
                                  </Grid>

                                  <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Size
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {item.size}
                                    </Typography>
                                  </Grid>

                                  <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Unit Price
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      ₹{item.unitPrice.toLocaleString("en-IN")}
                                    </Typography>
                                  </Grid>

                                  <Grid size={12}>
                                    <Typography variant="caption" color="text.secondary">
                                      Total Cost
                                    </Typography>
                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                                      ₹{item.cost.toLocaleString("en-IN")}
                                    </Typography>
                                  </Grid>

                                  {item.documents && (
                                    <Grid size={12}>
                                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        Documents
                                      </Typography>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <ImagePreviewDialog
                                          imageUrl={item.documents}
                                          alt={item.documents.split("/").pop()}
                                        />
                                        <Typography variant="caption" sx={{ wordBreak: "break-all" }}>
                                          {item.documents.split("/").pop()}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  )}

                                  {item.narration && (
                                    <Grid size={12}>
                                      <Typography variant="caption" color="text.secondary">
                                        Narration
                                      </Typography>
                                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {item.narration}
                                      </Typography>
                                    </Grid>
                                  )}
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </>
                    ) : (
                      // 🔹 DESKTOP VIEW (Table)
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
                                        {/* <Avatar
                                        variant="rounded"
                                        src={item.documents} // ✅ image preview
                                        alt="document"
                                        sx={{
                                          width: 30,
                                          height: 30,
                                          fontSize: 16,
                                        }}
                                      /> */}
                                        <ImagePreviewDialog
                                          imageUrl={item.documents}
                                          alt={item.documents.split("/").pop()}
                                        />
                                        <Typography
                                          variant="caption"
                                          sx={{ wordBreak: "break-all" }}
                                        >
                                          {item.documents.split("/").pop()}{" "}
                                          {/* ✅ shows just filename */}
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
                    )}
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

                      {/* <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Discount</span>
                        <span>₹{discount.toLocaleString("en-IN")}</span>
                      </Box> */}

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
    </>
  );
};

export default QuoteDetailsView;

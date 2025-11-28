import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import { getChallan } from "./slice/readyProductSlice";

const ProductChallan = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const imageUrl = import.meta.env.VITE_MEDIA_URL;

  const [items, setItems] = useState([]);
  const [challanDetails, setChallanDetails] = useState(null);

  // Get challan data - it's a single object, not an array
  const { data: challanData = null, loading } = useSelector(
    (state) => state.readyProduct
  );

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Challan_${challanDetails?.batch_no || "Document"}`,
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

  // Load challan data
  useEffect(() => {
    if (id) {
      dispatch(getChallan(id));
    }
  }, [dispatch, id]);

  // Parse and set challan data
  useEffect(() => {
    if (!challanData) return;

    try {
      let parsedItems = [];

      // Parse product_ids
      if (Array.isArray(challanData.product_ids)) {
        parsedItems = challanData.product_ids;
      } else if (typeof challanData.product_ids === "string") {
        parsedItems = JSON.parse(challanData.product_ids || "[]");
      }

      // Format items
      const formattedItems = parsedItems.map((item, index) => ({
        id: item.id ?? `${item.name}-${index}`,
        group: item.group || "Others",
        name: item.name || "",
        itemCode: item.model || "",
        qty: Number(item.qty) || 0,
        size: item.size || "",
        documents: item.document
          ? typeof item.document === "string"
            ? imageUrl + item.document
            : imageUrl + (item.document?.name || "")
          : "",
        cost: Number(item.cost) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        narration: item.narration || "",
      }));

      setItems(formattedItems);
      setChallanDetails(challanData);
    } catch (error) {
      console.error("Error parsing challan data:", error);
    }
  }, [challanData, imageUrl]);

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
  const discount = parseFloat(challanDetails?.discount || 0);
  const additionalCharges = parseFloat(
    challanDetails?.additional_charges || 0
  );
  const gstRate = parseFloat(challanDetails?.gst_rate || 0);
  const afterDiscount = subTotal - discount + additionalCharges;
  const gstAmount = (afterDiscount * gstRate) / 100;
  const grandTotal = afterDiscount + gstAmount;

  // Show loader while data is loading
  if (loading || !challanDetails) {
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
          <Typography variant="h6">Challan Details</Typography>
        </Grid>
        <Grid>
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
                      Challan No. :{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {challanDetails.batch_no || "N/A"}
                      </Box>
                    </Typography>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      Challan Date:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {formatDate(challanDetails.created_at)}
                      </Box>
                    </Typography>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      Delivery Date:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {formatDate(challanDetails.delivery_date)}
                      </Box>
                    </Typography>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      Priority:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {challanDetails.priority || "Normal"}
                      </Box>
                    </Typography>
                  </Box>
                </Grid>

                {/* Company and Customer Details - Side by Side */}
                <Grid size={12} sx={{ pt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 3,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Company Details - From */}
                    <Box sx={{ flex: 1, minWidth: "300px" }}>
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
                    </Box>

                    {/* Customer Details - To */}
                    {challanDetails.customer && (
                      <Box sx={{ flex: 1, minWidth: "300px" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          To:
                        </Typography>
                        <Typography variant="body2">
                          <strong>{challanDetails.customer.name}</strong>
                          <br />
                          {challanDetails.customer.address}
                          <br />
                          {challanDetails.customer.city},{" "}
                          {challanDetails.customer.state?.name}{" "}
                          {challanDetails.customer.zip_code}
                          <br />
                          Mobile: {challanDetails.customer.mobile}
                          <br />
                          Email: {challanDetails.customer.email}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

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
                        {challanDetails.order_terms ||
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
    </>
  );
};

export default ProductChallan;
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
    TextField,
    Tooltip,
    IconButton,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { RiDeleteBinLine } from "react-icons/ri";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { fetchBillById, updateBillStatus } from "./slice/billsSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import { useAuth } from "../../context/AuthContext";

const ViewBill = () => {
    const { id } = useParams();
    const { appDetails } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const contentRef = useRef(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const imageUrl = import.meta.env.VITE_MEDIA_URL;

    const [items, setItems] = useState([]);
    const [quotationDetails, setQuotationDetails] = useState(null);

    const { selected: billData = {}, loading: billLoading } =
        useSelector((state) => state.bill);


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
        dispatch(fetchBillById(id));
    }

    const handleApprove = async (id) => {
        await dispatch(updateBillStatus(id));
        fetchQuotation(id);


    }
    const mediaUrl = import.meta.env.VITE_MEDIA_URL;
    // Parse and set Bill data
    useEffect(() => {
        if (billData && billData.id) {
            try {
                // Parse product_ids JSON string


                setItems(billData.product || []);
                setQuotationDetails(billData);
            } catch (error) {
                console.error("Error parsing quotation data:", error);
            }
        }
    }, [billData]);

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
    const subTotal = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const discount = parseFloat(quotationDetails?.discount || 0);
    const additionalCharges = parseFloat(
        quotationDetails?.additional_charges || 0
    );
    const gstRate = parseFloat(quotationDetails?.gst || 0);
    const afterDiscount = subTotal - discount + additionalCharges;
    const gstAmount = (afterDiscount * gstRate) / 100;
    const grandTotal = afterDiscount + gstAmount;

    // Show loader while data is loading
    if (billLoading || !quotationDetails) {
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
                    <Typography variant="h6">Bill Details</Typography>
                </Grid>
                <Grid>
                    {(quotationDetails.status == 1 && quotationDetails.status !== 2) && (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleApprove(billData.id)}
                            sx={{ mr: 2 }}
                        >
                            Approve
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
                    <Box
                        ref={contentRef}
                        sx={{
                            background: "#fff",
                            px: { xs: 1.5, sm: 3 },  
                            py: { xs: 1, sm: 2 },
                        }}
                    >
                        <Card>
                            <CardContent>
                                {/* Header Section */}
                                <Grid size={12}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: { xs: "column", sm: "row" },
                                            alignItems: { xs: "flex-start", sm: "center" },
                                            justifyContent: "space-between",
                                            gap: { xs: 1, md: 2 },
                                            width: "100%",
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            sx={{ m: 0, width: { xs: "100%", sm: "auto" } }}
                                        >
                                            Invoice No. :{" "}
                                            <Box component="span" sx={{ fontWeight: 600 }}>
                                                {quotationDetails.invoice_no || "N/A"}
                                            </Box>
                                        </Typography>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: { xs: "column", sm: "row" },
                                                alignItems: { xs: "flex-start", sm: "center" },
                                                justifyContent: { sm: "flex-end" },
                                                gap: { xs: 1, md: 2 },
                                                width: { xs: "100%", sm: "auto" },
                                                mb: 1,
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{ m: 0, width: { xs: "100%", sm: "auto" } }}
                                            >
                                                Billing Date:{" "}
                                                <Box component="span" sx={{ fontWeight: 600 }}>
                                                    {formatDate(quotationDetails.date)}
                                                </Box>
                                            </Typography>

                                            <Typography
                                                variant="body1"
                                                sx={{ m: 0, width: { xs: "100%", sm: "auto" } }}
                                            >
                                                Delivery Date:{" "}
                                                <Box component="span" sx={{ fontWeight: 600 }}>
                                                    {formatDate(quotationDetails.delivery_date)}
                                                </Box>
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 2,
                                        mt: 1,
                                        gap: 2,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {/* From (Left side) */}
                                    <Box sx={{ width: { xs: "100%", md: "48%" } }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                            From:
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>{appDetails.application_name}</strong><br />
                                            {appDetails.gst_no} <br />
                                            {appDetails.company_address} <br />
                                        </Typography>
                                    </Box>

                                    {/* To (Right side) */}
                                    {quotationDetails.customer && (
                                        <Box sx={{ width: { xs: "100%", md: "48%" } }}>
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
                                                {/* <br />
                                                Mobile: {quotationDetails.customer.mobile}
                                                <br />
                                                Email: {quotationDetails.customer.email} */}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                                {/* Items Table by Group */}
                                {items.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                            Bill Items ({items.length})
                                        </Typography>
                                        
                                        {isMobile ? (
                                            // Mobile Card View
                                            <Box>
                                                {items.map((item) => (
                                                    <Card key={item.id} sx={{ mb: 2, bgcolor: "#f7f7f7", boxShadow: 1 }}>
                                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                            {/* Item Name and Image */}
                                                            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                                                                {item.product?.image && (
                                                                    <Box sx={{ flexShrink: 0 }}>
                                                                        <ImagePreviewDialog
                                                                            imageUrl={mediaUrl + item.product?.image}
                                                                            alt={item.product?.name || "Document"}
                                                                        />
                                                                    </Box>
                                                                )}
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                                        {item.product?.name}
                                                                    </Typography>
                                                                    {/* <Typography variant="caption" color="text.secondary">
                                                                        {item.product?.model}
                                                                    </Typography> */}
                                                                </Box>
                                                            </Box>

                                                            {/* Item Details */}
                                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Code:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                         {item.product?.model}
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Quantity:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        {item.qty}
                                                                    </Typography>
                                                                </Box>

                                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Size:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        {item.product?.size}
                                                                    </Typography>
                                                                </Box>

                                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Unit Price:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        ₹{item.rate}
                                                                    </Typography>
                                                                </Box>

                                                                <Box sx={{ 
                                                                    display: "flex", 
                                                                    justifyContent: "space-between",
                                                                    pt: 1,
                                                                    borderTop: "1px solid #ddd"
                                                                }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                        Total Cost:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                                                                        ₹{(item.amount || 0).toLocaleString("en-IN")}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </Box>
                                        ) : (
                                            // Desktop Table View
                                            <Table>
                                                <Thead>
                                                    <Tr>
                                                        <Th>Item Name</Th>
                                                        <Th>Item Code</Th>
                                                        <Th>Qty</Th>
                                                        <Th>Size</Th>
                                                        <Th>Unit Price (₹)</Th>
                                                        <Th>Total Cost (₹)</Th>
                                                        <Th>Documents</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {items.map((item) => (
                                                        <Tr key={item.id}>
                                                            <Td>{item.product?.name}</Td>
                                                            <Td>{item.product?.model}</Td>
                                                            <Td>
                                                                {item.qty}
                                                            </Td>
                                                            <Td>{item.product?.size}</Td>
                                                            <Td>
                                                                ₹{item.rate}
                                                            </Td>
                                                            <Td>₹{(item.amount || 0).toLocaleString("en-IN")}</Td>
                                                            <Td>
                                                                {item.product?.image ? (
                                                                    <Box
                                                                        sx={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 1,
                                                                        }}
                                                                    >
                                                                        <ImagePreviewDialog
                                                                            imageUrl={mediaUrl + item.product?.image}
                                                                            alt={item.product?.name || "Document"}
                                                                        />
                                                                        <Typography variant="caption">
                                                                            {item.product?.name || "Document"}
                                                                        </Typography>
                                                                    </Box>
                                                                ) : (
                                                                    "-"
                                                                )}
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        )}
                                    </Box>
                                )}

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
                                                {quotationDetails.term_and_condition ||
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
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};

export default ViewBill;
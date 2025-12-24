import React, { useState, useRef, useEffect, useMemo } from "react";
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
    Divider,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { MdDownload } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const PublicChallanView = () => {
    const { link } = useParams();
    const navigate = useNavigate();
    const contentRef = useRef(null);
    const { appDetails } = useAuth();

    const imageUrl = import.meta.env.VITE_MEDIA_URL;

    // Get app details from localStorage (since this is public route)
    const appLogo = localStorage.getItem("logo") || "";
    const appName = localStorage.getItem("application_name") || "Company Name";

    // State management
    const [challanDetails, setChallanDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Print handler with A4 styling
    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Challan_${challanDetails?.invoice_no || "Invoice"}`,
        pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
    });

    // Parse items from challan details
    const items = useMemo(() => {
        if (!challanDetails?.product || !Array.isArray(challanDetails.product)) return [];

        try {
            return challanDetails.product.map((item) => ({
                id: item.id,
                productId: item.product_id,
                name: item.product?.name || "",
                itemCode: item.product?.model || "",
                qty: parseInt(item.qty, 10) || 0,
                size: item.product?.size || "",
                color: item.product?.color || "",
                hsnCode: item.product?.hsn_code || "",
                productType: item.product?.product_type || "",
                rate: parseFloat(item.rate) || 0,
                amount: parseFloat(item.amount) || 0,
                image: item.product?.image ? imageUrl + item.product.image : "",
            }));
        } catch (error) {
            console.error("Error parsing product data:", error);
            return [];
        }
    }, [challanDetails, imageUrl]);

    // Get unique product types/groups
    const uniqueGroups = useMemo(() => {
        return [...new Set(items.map((item) => item.productType))].filter(Boolean);
    }, [items]);

    // Calculate totals
    const calculations = useMemo(() => {
        const subTotal = parseFloat(challanDetails?.total || 0);
        const discount = parseFloat(challanDetails?.discount || 0);
        const additionalCharges = parseFloat(challanDetails?.additional_charges || 0);
        const gstRate = parseFloat(challanDetails?.gst || 0);
        const afterDiscount = subTotal - discount + additionalCharges;
        const gstAmount = (afterDiscount * gstRate) / 100;
        const grandTotal = parseFloat(challanDetails?.grand_total || 0);

        return {
            subTotal,
            discount,
            additionalCharges,
            gstRate,
            gstAmount,
            grandTotal,
        };
    }, [challanDetails]);

    // Fetch Challan Details
    const fetchChallanDetails = async () => {
        if (!link) {
            setError("Invalid challan link");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await api.post(`get-customer-challan`, { link });

            if (!response.data) {
                throw new Error("No data received from server");
            }
            setChallanDetails(response.data.data);
        } catch (err) {
            console.error("Error fetching challan:", err);
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Failed to fetch challan";
            setError(errorMessage);
            setSnackbar({
                open: true,
                message: `Error: ${errorMessage}`,
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallanDetails();
    }, [link]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch {
            return "N/A";
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // ----- Download PDF -----
    const waitForImagesToLoad = () => {
        return new Promise((resolve) => {
            const images = contentRef.current?.querySelectorAll("img") || [];
            let loaded = 0;

            if (images.length === 0) {
                resolve();
                return;
            }

            images.forEach((img) => {
                if (img.complete) {
                    loaded++;
                    if (loaded === images.length) resolve();
                } else {
                    img.onload = () => {
                        loaded++;
                        if (loaded === images.length) resolve();
                    };
                    img.onerror = () => {
                        loaded++;
                        if (loaded === images.length) resolve();
                    };
                }
            });
        });
    };

    const handleDownloadPDF = async () => {
        if (!contentRef.current) return;

        try {
            setDownloading(true);

            // Ensure all images (logo included) are fully loaded
            await waitForImagesToLoad();

            const canvas = await html2canvas(contentRef.current, {
                scale: 2,
                useCORS: true,
            });

            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = 210;
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pdfHeight);
            pdf.save(`Challan_${challanDetails?.invoice_no || "Invoice"}.pdf`);
        } catch (err) {
            console.error("PDF download failed:", err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    backgroundColor: "#f5f5f5",
                }}
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error && !challanDetails) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    backgroundColor: "#f5f5f5",
                    gap: 2,
                    p: 2,
                }}
            >
                <Typography variant="h6" color="error" align="center">
                    Error Loading Challan
                </Typography>
                <Typography variant="body2" align="center">{error}</Typography>
            </Box>
        );
    }

    if (!challanDetails) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    backgroundColor: "#f5f5f5",
                    gap: 2,
                }}
            >
                <Typography variant="h6">No Challan Found</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh", py: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: { xs: "100%", md: "210mm" }, margin: "0 auto", px: { xs: 1, sm: 2 } }}>
                {/* Action Buttons - No Print */}
                <Box
                    className="no-print"
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                        mb: 2,
                        flexWrap: "wrap",
                    }}
                >
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<MdDownload />}
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        size="small"
                        sx={{ minWidth: { xs: "100px", sm: "120px" } }}
                    >
                        {downloading ? <CircularProgress size={20} /> : "Download"}
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<AiOutlinePrinter />}
                        onClick={handlePrint}
                        size="small"
                        sx={{ minWidth: { xs: "100px", sm: "120px" } }}
                    >
                        Print
                    </Button>
                </Box>

                {/* A4 Page Container */}
                <Box
                    ref={contentRef}
                    sx={{
                        backgroundColor: "#fff",
                        boxShadow: { xs: "none", sm: "0 0 10px rgba(0,0,0,0.1)" },
                        width: "100%",
                        maxWidth: "210mm",
                        padding: { xs: "15px", sm: "20px", md: "15mm" },
                        margin: "0 auto",
                        "@media print": {
                            boxShadow: "none",
                            margin: 0,
                            padding: "15mm",
                        },
                    }}
                >
                    {/* Header with Logo */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            borderBottom: "2px solid #333",
                            pb: 2,
                            mb: 3,
                            gap: 2,
                        }}
                    >
                        <Box>
                            {appLogo ? (
                                <img
                                    src={appLogo}
                                    alt={appName}
                                    style={{
                                        height: "50px",
                                        maxWidth: "150px",
                                        objectFit: "contain"
                                    }}
                                />
                            ) : (
                                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                                    {appName}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "#333", fontSize: { xs: "1.25rem", sm: "1.75rem" }, lineHeight: 1.2 }}>
                                CHALLAN
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, mt: 0.5 }}>
                                #{challanDetails.invoice_no || "N/A"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Challan Info Bar */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
                            gap: 2,
                            mb: 3,
                            alignItems: "center",
                        }}
                    >
                        {/* Date */}
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, mb: 0.5, display: "block" }}
                            >
                                Date
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                            >
                                {formatDate(challanDetails.date)}
                            </Typography>
                        </Box>

                        {/* Delivery Date - Center */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, mb: 0.5 }}
                            >
                                Delivery Date
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                            >
                                {formatDate(challanDetails.delivery_date)}
                            </Typography>
                        </Box>

                        {/* Vehicle No - Right */}
                        {challanDetails.vehicle_no && (
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, mb: 0.5 }}
                                >
                                    Vehicle No
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                                >
                                    {challanDetails.vehicle_no}
                                </Typography>
                            </Box>
                        )}
                    </Box>


                    {/* Additional Info Row */}
                    {(challanDetails.dispatch_through || challanDetails.eway_bill) && (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                                gap: 2,
                                mb: 3,
                            }}
                        >
                            {challanDetails.dispatch_through && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, display: "block", mb: 0.5 }}>
                                        Dispatch Through
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                                        {challanDetails.dispatch_through}
                                    </Typography>
                                </Box>
                            )}
                            {challanDetails.eway_bill && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, display: "block", mb: 0.5 }}>
                                        E-Way Bill
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                                        {challanDetails.eway_bill}
                                    </Typography>
                                </Box>
                            )}
                            {challanDetails.eway_date && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, display: "block", mb: 0.5 }}>
                                        E-Way Date
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                                        {formatDate(challanDetails.eway_date)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* From and To Section */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                            gap: { xs: 2, sm: 3 },
                            mb: 3,
                            alignItems: "start",
                        }}
                    >
                        {/* FROM */}
                        <Box sx={{ minHeight: 140 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 700,
                                    mb: 1,
                                    color: "#666",
                                    textTransform: "uppercase",
                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                    letterSpacing: 0.5,
                                }}
                            >
                                From:
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    lineHeight: 1.6,
                                    fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                }}
                            >
                                <Box component="span" sx={{ fontWeight: 600, display: "block" }}>
                                    {appDetails?.application_name || appName}
                                </Box>

                                {appDetails?.company_address && (
                                    <Box component="span" sx={{ display: "block" }}>
                                        {appDetails.company_address}
                                    </Box>
                                )}

                                {appDetails?.gst_no && (
                                    <Box component="span" sx={{ display: "block" }}>
                                        GSTIN: {appDetails.gst_no}
                                    </Box>
                                )}
                            </Typography>
                        </Box>

                        {/* BILLING */}
                        {challanDetails.customer && (
                            <Box sx={{ minHeight: 140 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 700,
                                        mb: 1,
                                        color: "#666",
                                        textTransform: "uppercase",
                                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    To (Billing Address):
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        lineHeight: 1.6,
                                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                    }}
                                >
                                    <Box component="span" sx={{ fontWeight: 600, display: "block" }}>
                                        {challanDetails.customer.name}
                                    </Box>

                                    <Box component="span" sx={{ display: "block" }}>
                                        {challanDetails.customer.address}
                                    </Box>

                                    <Box component="span" sx={{ display: "block" }}>
                                        {challanDetails.customer.city}
                                        {challanDetails.customer.state_id && ", "}
                                        {challanDetails.customer.zip_code}
                                    </Box>

                                    <Box component="span" sx={{ display: "block" }}>
                                        Mobile: {challanDetails.customer.mobile}
                                    </Box>

                                    {challanDetails.customer.email && (
                                        <Box component="span" sx={{ display: "block" }}>
                                            Email: {challanDetails.customer.email}
                                        </Box>
                                    )}

                                    {challanDetails.customer.gst_no && (
                                        <Box component="span" sx={{ display: "block" }}>
                                            GSTIN: {challanDetails.customer.gst_no}
                                        </Box>
                                    )}
                                </Typography>
                            </Box>
                        )}

                        {/* SHIPPING */}
                        {challanDetails.shipping_address && (
                            <Box sx={{ minHeight: 140 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 700,
                                        mb: 1,
                                        color: "#666",
                                        textTransform: "uppercase",
                                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    Shipping Address:
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        lineHeight: 1.6,
                                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                    }}
                                >
                                    <Box component="span" sx={{ fontWeight: 600, display: "block" }}>
                                        {challanDetails.customer?.name || ""}
                                    </Box>

                                    <Box component="span" sx={{ display: "block" }}>
                                        {challanDetails.shipping_address.address}
                                    </Box>

                                    <Box component="span" sx={{ display: "block" }}>
                                        {challanDetails.shipping_address.city}
                                        {challanDetails.shipping_address.state?.name &&
                                            `, ${challanDetails.shipping_address.state.name}`}{" "}
                                        {challanDetails.shipping_address.zip_code}
                                    </Box>
                                </Typography>
                            </Box>
                        )}
                    </Box>


                    {/* Items by Product Type */}
                    {uniqueGroups.length > 0 ? (
                        uniqueGroups.map((group) => (
                            <Box key={group} sx={{ mb: 3 }}>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 700,
                                        backgroundColor: "#e9ecef",
                                        padding: { xs: "6px 10px", sm: "8px 12px" },
                                        borderRadius: 1,
                                        mb: 1.5,
                                        fontSize: { xs: "0.8rem", sm: "0.9rem" },
                                    }}
                                >
                                    {group}
                                </Typography>

                                {/* Responsive Table */}
                                <Box sx={{ overflowX: "auto", mb: 2 }}>
                                    <table style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: "0.75rem",
                                        minWidth: "100%"
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#f8f9fa" }}>
                                                <th style={{
                                                    padding: "8px 6px",
                                                    border: "1px solid #dee2e6",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    Item Name
                                                </th>
                                                <th style={{
                                                    padding: "8px 6px",
                                                    border: "1px solid #dee2e6",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    Code
                                                </th>
                                                <th style={{
                                                    padding: "8px 6px",
                                                    border: "1px solid #dee2e6",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    Size
                                                </th>
                                                <th style={{
                                                    padding: "8px 6px",
                                                    border: "1px solid #dee2e6",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    Color
                                                </th>
                                                <th style={{
                                                    padding: "8px 6px",
                                                    border: "1px solid #dee2e6",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    HSN Code
                                                </th>
                                                <th style={{
                                                    padding: "8px 6px",
                                                    border: "1px solid #dee2e6",
                                                    textAlign: "center",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    Qty
                                                </th>
                                                {/* <th style={{
                                                    padding: "8px 6px",
                                                    border: "1px solid #dee2e6",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    Rate
                                                </th>
                                                <th style={{
                                                    padding: "8px 6px",
                                                    border: "1px solid #dee2e6",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    Amount
                                                </th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items
                                                .filter((item) => item.productType === group)
                                                .map((item) => (
                                                    <tr key={item.id}>
                                                        <td style={{
                                                            padding: "8px 6px",
                                                            border: "1px solid #dee2e6",
                                                            fontSize: "0.7rem"
                                                        }}>
                                                            {item.name}
                                                        </td>
                                                        <td style={{
                                                            padding: "8px 6px",
                                                            border: "1px solid #dee2e6",
                                                            fontSize: "0.7rem"
                                                        }}>
                                                            {item.itemCode}
                                                        </td>
                                                        <td style={{
                                                            padding: "8px 6px",
                                                            border: "1px solid #dee2e6",
                                                            fontSize: "0.7rem"
                                                        }}>
                                                            {item.size}
                                                        </td>
                                                        <td style={{
                                                            padding: "8px 6px",
                                                            border: "1px solid #dee2e6",
                                                            fontSize: "0.7rem"
                                                        }}>
                                                            {item.color}
                                                        </td>
                                                        <td style={{
                                                            padding: "8px 6px",
                                                            border: "1px solid #dee2e6",
                                                            fontSize: "0.7rem"
                                                        }}>
                                                            {item.hsnCode}
                                                        </td>
                                                        <td style={{
                                                            padding: "8px 6px",
                                                            border: "1px solid #dee2e6",
                                                            textAlign: "center",
                                                            fontSize: "0.7rem"
                                                        }}>
                                                            {item.qty}
                                                        </td>
                                                        {/* <td style={{
                                                            padding: "8px 6px",
                                                            border: "1px solid #dee2e6",
                                                            textAlign: "right",
                                                            fontSize: "0.7rem"
                                                        }}>
                                                            ₹{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td style={{
                                                            padding: "8px 6px",
                                                            border: "1px solid #dee2e6",
                                                            textAlign: "right",
                                                            fontWeight: 600,
                                                            fontSize: "0.7rem"
                                                        }}>
                                                            ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td> */}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center", py: 3, fontSize: "0.8rem" }}>
                            No items found in this challan
                        </Typography>
                    )}

                    {/* Totals Section */}


                    {/* Terms and Conditions */}
                    {challanDetails.term_and_condition && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "0.75rem", sm: "0.85rem" }, textTransform: "uppercase", color: "#666" }}>
                                Terms & Conditions:
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                    lineHeight: 1.5,
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {challanDetails.term_and_condition}
                            </Typography>
                        </Box>
                    )}

                    {/* Footer Note */}
                    <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                        <Typography variant="caption" sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, color: "text.secondary", fontStyle: "italic" }}>
                            This is a computer-generated document. No signature is required.
                        </Typography>
                    </Box>
                </Box>
            </Box >

            {/* Snackbar */}
            < Snackbar
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
            </Snackbar >
        </Box >
    );
};

export default PublicChallanView;
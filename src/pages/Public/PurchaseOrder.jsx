import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    Button,
    Typography,
    Box,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { MdDownload } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const PublicPurchaseOrderView = () => {
    const { link } = useParams();
    const navigate = useNavigate();
    const contentRef = useRef(null);
    const { appDetails } = useAuth();

    const imageUrl = import.meta.env.VITE_MEDIA_URL;

    // Get app details from localStorage (since this is public route)
    const appLogo = localStorage.getItem("logo") || "";
    const appName = localStorage.getItem("application_name") || "Company Name";

    // State management
    const [purchaseOrderDetails, setPurchaseOrderDetails] = useState(null);
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
        documentTitle: `PO_${purchaseOrderDetails?.batch_no || "Invoice"}`,
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

    // Parse items from purchase order details
    const items = useMemo(() => {
        if (!purchaseOrderDetails?.material_items) return [];

        try {
            const parsedItems = JSON.parse(purchaseOrderDetails.material_items);
            return parsedItems.map((item) => ({
                id: item.id || `${Date.now()}-${Math.random()}`,
                name: item.name || "",
                hsn_code: item.hsn_code || "",
                qty: parseInt(item.qty, 10) || 0,
                size: item.size || "",
                uom: item.uom || "",
                rate: parseFloat(item.rate) || 0,
                total: parseFloat(item.total) || 0,
            }));
        } catch (error) {
            console.error("Error parsing material_items:", error);
            return [];
        }
    }, [purchaseOrderDetails]);

    // Fetch Purchase Order Details
    const fetchPurchaseOrderDetails = async () => {
        if (!link) {
            setError("Invalid purchase order link");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await api.post(`get-vendor-purchaseOrder`, { link });

            if (!response.data) {
                throw new Error("No data received from server");
            }
            setPurchaseOrderDetails(response.data.data);
        } catch (err) {
            console.error("Error fetching purchase order:", err);
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Failed to fetch purchase order";
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
        fetchPurchaseOrderDetails();
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
            pdf.save(`PO_${purchaseOrderDetails?.batch_no || "Invoice"}.pdf`);
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

    if (error && !purchaseOrderDetails) {
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
                    Error Loading Purchase Order
                </Typography>
                <Typography variant="body2" align="center">{error}</Typography>
            </Box>
        );
    }

    if (!purchaseOrderDetails) {
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
                <Typography variant="h6">No Purchase Order Found</Typography>
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
                                PURCHASE ORDER
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, mt: 0.5 }}>
                                #{purchaseOrderDetails.purchase_no || "N/A"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* PO Info Bar */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                            gap: 2,
                            mb: 3,
                            alignItems: "center",
                        }}
                    >
                        {/* Order Date - LEFT */}
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, mb: 0.5, display: "block" }}
                            >
                                Order Date
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                            >
                                {formatDate(purchaseOrderDetails.created_at)}
                            </Typography>
                        </Box>

                        {/* Credit Days - CENTER */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, mb: 0.5 }}
                            >
                                Credit Days
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                            >
                                {purchaseOrderDetails.credit_days}
                            </Typography>
                        </Box>

                        {/* EDD - RIGHT */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, mb: 0.5 }}
                            >
                                EDD
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                            >
                                {formatDate(purchaseOrderDetails.expected_delivery_date)}
                            </Typography>
                        </Box>
                    </Box>


                    {/* Vendor Details */}
                    {purchaseOrderDetails.vendor && (
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 700,
                                    mb: 1,
                                    color: "#666",
                                    textTransform: "uppercase",
                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                    letterSpacing: 0.5
                                }}
                            >
                                VENDOR:
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                                <strong style={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>{purchaseOrderDetails.vendor.name}</strong>
                                <br />
                                {purchaseOrderDetails.vendor.address}
                                <br />
                                GSTIN: {purchaseOrderDetails.vendor.gst || "N/A"}
                            </Typography>
                        </Box>
                    )}

                    {/* Items Table */}
                    <Box sx={{ overflowX: "auto", mb: 3 }}>
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
                                        Item Code
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
                                        UOM
                                    </th>
                                    <th style={{
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
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items && items.length > 0 ? (
                                    items.map((item) => (
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
                                                {item.hsn_code || "N/A"}
                                            </td>
                                            <td style={{
                                                padding: "8px 6px",
                                                border: "1px solid #dee2e6",
                                                textAlign: "center",
                                                fontSize: "0.7rem"
                                            }}>
                                                {item.qty}
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
                                                {item.uom}
                                            </td>
                                            <td style={{
                                                padding: "8px 6px",
                                                border: "1px solid #dee2e6",
                                                textAlign: "right",
                                                fontSize: "0.7rem"
                                            }}>
                                                ₹{item.rate?.toLocaleString("en-IN")}
                                            </td>
                                            <td style={{
                                                padding: "8px 6px",
                                                border: "1px solid #dee2e6",
                                                textAlign: "right",
                                                fontWeight: 600,
                                                fontSize: "0.7rem"
                                            }}>
                                                ₹{item.total?.toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                            No items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Box>

                    {/* Bottom Section: Terms and Totals */}
                    <Box sx={{ mt: 3 }}>
                        {/* Order Terms */}
                        {purchaseOrderDetails.order_terms && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "0.75rem", sm: "0.85rem" }, textTransform: "uppercase", color: "#666" }}>
                                    Order Terms:
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                        lineHeight: 1.5,
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {purchaseOrderDetails.order_terms}
                                </Typography>
                            </Box>
                        )}

                        {/* Totals - Right Aligned */}
                        <Box sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            mt: 3
                        }}>
                            <Box sx={{ minWidth: { xs: "100%", sm: "300px" }, maxWidth: "400px" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, borderBottom: "1px solid #e0e0e0" }}>
                                    <span>Sub Total:</span>
                                    <span>₹{purchaseOrderDetails.subtotal?.toLocaleString("en-IN") || 0}</span>
                                </Box>

                                {/* <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, borderBottom: "1px solid #e0e0e0" }}>
                                    <span>Discount:</span>
                                    <span>₹{purchaseOrderDetails.discount?.toLocaleString("en-IN") || 0}</span>
                                </Box> */}

                                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, borderBottom: "1px solid #e0e0e0" }}>
                                    <span>Charges:</span>
                                    <span>₹{purchaseOrderDetails.cariage_amount?.toLocaleString("en-IN") || 0}</span>
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontSize: { xs: "0.75rem", sm: "0.85rem" }, borderBottom: "1px solid #e0e0e0" }}>
                                    <span>GST ({parseInt(purchaseOrderDetails.gst_per) || 0}%):</span>
                                    <span>₹{purchaseOrderDetails.gst_amount?.toLocaleString("en-IN") || 0}</span>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        pt: 1.5,
                                        fontWeight: 700,
                                        fontSize: { xs: "0.95rem", sm: "1.1rem" },
                                        color: "#333"
                                    }}
                                >
                                    <span>Grand Total:</span>
                                    <span>₹{purchaseOrderDetails.grand_total?.toLocaleString("en-IN") || 0}</span>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Snackbar */}
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
        </Box>
    );
};

export default PublicPurchaseOrderView;
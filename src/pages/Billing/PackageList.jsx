import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
    Button,
    Typography,
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchBillById } from "./slice/billsSlice";
import { useAuth } from "../../context/AuthContext";

const PackageList = () => {
    const { id } = useParams();
    const { appDetails } = useAuth();
    const dispatch = useDispatch();
    const contentRef = useRef(null);

    const { selected: billData = {}, loading: billLoading } = useSelector((state) => state.bill);
    const mediaUrl = import.meta.env.VITE_MEDIA_URL;

    const [items, setItems] = useState([]);
    const [quotationDetails, setQuotationDetails] = useState(null);

    // Fetch bill data
    useEffect(() => {
        if (id) {
            dispatch(fetchBillById(id));
        }
    }, [dispatch, id]);

    // Set items and details from Redux
    useEffect(() => {
        if (billData && billData.id) {
            setItems(billData.product || []);
            setQuotationDetails(billData);
        }
    }, [billData]);

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

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `PackingList_${quotationDetails?.invoice_no || "Invoice"}`,
        pageStyle: `
            @page {
                size: A4 portrait;
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
                table {
                    page-break-inside: auto;
                }
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
            }
        `,
    });

    if (billLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <>
            {/* Header with Print Button - Not in print */}
            <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} className="no-print">
                <Grid>
                    <Typography variant="h6">Packing List</Typography>
                </Grid>
                <Grid>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AiOutlinePrinter />}
                        onClick={handlePrint}
                    >
                        Print
                    </Button>
                </Grid>
            </Grid>

            {/* Print Content */}
            <Box ref={contentRef} sx={{ bgcolor: 'white', p: 3 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 2, borderBottom: '2px solid #000', pb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {appDetails?.application_name || '-'}
                    </Typography>
                    <Typography variant="body2">
                        {appDetails?.company_address || '-'}
                    </Typography>
                    <Typography variant="body2">
                        Haryana - 122051
                    </Typography>
                </Box>

                {/* Title Section */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, textDecoration: 'underline' }}>
                        PACKING LIST FOR M/S. {quotationDetails?.customer?.name ?? 'INVESCON'}
                        {/* INVESCON */}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Invoice # : {quotationDetails?.invoice_no || 'N/A'}
                    </Typography>
                </Box>

                {/* Date */}
                <Box sx={{ textAlign: 'right', mb: 3 }}>
                    <Typography variant="body2">
                        <strong>Date:</strong> {new Date().toLocaleString()}
                    </Typography>
                </Box>

                {/* Items Table */}
                {items.length > 0 && (
                    <TableContainer component={Paper} 
                    // sx={{ border: '1px solid #000' }}
                    >
                        <Table sx={{ 
                            '& .MuiTableCell-root': { 
                                border: '1px solid #000',
                                padding: '8px',
                            } 
                        }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>S.No</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Item Code</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Description</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Size</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Qty</TableCell>
                                    {/* <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Remark</TableCell> */}
                                    <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Image</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{item.product?.model || 'N/A'}</TableCell>
                                        <TableCell>{item.product?.name || 'N/A'}</TableCell>
                                        <TableCell align="center">{item.product?.size || '-'}</TableCell>
                                        <TableCell align="center">{item.qty}</TableCell>
                                        {/* <TableCell>-</TableCell> */}
                                        <TableCell align="center">
                                            {item.product?.image ? (
                                                <Box
                                                    component="img"
                                                    src={mediaUrl + item.product?.image}
                                                    alt={item.product?.name}
                                                    sx={{
                                                        width: 60,
                                                        height: 60,
                                                        objectFit: 'cover',
                                                        borderRadius: 1,
                                                        display: 'block',
                                                        margin: '0 auto',
                                                    }}
                                                />
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Footer Note */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Note:
                    </Typography>
                    <Typography variant="body2">
                        This is a computer-generated packing list and does not require a signature.
                    </Typography>
                </Box>

                {/* Company Signature Section */}
                <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Prepared By
                        </Typography>
                        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 1, minWidth: '150px' }}>
                            <Typography variant="body2">Signature</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Verified By
                        </Typography>
                        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 1, minWidth: '150px' }}>
                            <Typography variant="body2">Signature</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default PackageList;
import React, { useState, useRef, useEffect, useMemo } from "react";
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
  TextField,
} from "@mui/material";
import { AiOutlinePrinter } from "react-icons/ai";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
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
  const slipRef = useRef(null);

  const { selected: billData = {}, loading: billLoading } = useSelector((state) => state.bill);
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  const [items, setItems] = useState([]);
  const [cartoonNumbers, setCartoonNumbers] = useState({});

  // Fetch bill data
  useEffect(() => {
    if (id) {
      dispatch(fetchBillById(id));
    }
  }, [dispatch, id]);

  // Set items from Redux
  useEffect(() => {
    if (billData?.id && billData?.product) {
      setItems(billData.product);
      // Initialize cartoon numbers
      const initialCartoons = {};
      billData.product.forEach(item => {
        initialCartoons[item.id] = item.cartoons || 1;
      });
      setCartoonNumbers(initialCartoons);
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

  // Handle cartoon number change
  const handleCartoonChange = (itemId, value) => {
    const numValue = parseInt(value) || 0;
    setCartoonNumbers(prev => ({
      ...prev,
      [itemId]: Math.max(0, numValue)
    }));
  };

  // Generate dynamic slips based on items and cartoon numbers
  const generateSlips = useMemo(() => {
    const slips = [];

    items.forEach((item) => {
      const cartoonCount = cartoonNumbers[item.id] || 1;
      const qty = item.qty || 1;

      // Generate slips: cartoonCount slips per item
      for (let i = 1; i <= cartoonCount; i++) {
        slips.push({
          item,
          slipNumber: i,
          totalSlips: cartoonCount,
          displayText: `${i}/${cartoonCount}`,
        });
      }
    });

    return slips;
  }, [items, cartoonNumbers]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `PackingList_${billData?.invoice_no || "Invoice"}`,
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

  const handlePrintSlips = useReactToPrint({
    contentRef: slipRef,
    documentTitle: `LobbySlips_${billData?.invoice_no || "Invoice"}`,
    pageStyle: `
            @page {
                size: A4 landscape;
                margin: 5mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    margin: 0;
                    padding: 0;
                }
                .no-print {
                    display: none !important;
                }
                .page-break {
                    page-break-after: always;
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
      {/* Header with Print Buttons */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} className="no-print">
        <Grid item>
          <Typography variant="h6">Packing List</Typography>
          <Typography variant="caption" color="text.secondary">
            Total Slips: {generateSlips.length}
          </Typography>
        </Grid>
        <Grid item>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ReceiptLongIcon />}
              onClick={handlePrintSlips}
              disabled={generateSlips.length === 0}
            >
              Print Slips ({generateSlips.length})
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AiOutlinePrinter />}
              onClick={handlePrint}
            >
              Print Packing List
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Print Content - Packing List */}
      <Box ref={contentRef} sx={{ bgcolor: 'white', p: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 2, borderBottom: '2px solid #000', pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {appDetails?.application_name || 'Company Name'}
          </Typography>
          <Typography variant="body2">
            {appDetails?.company_address || 'Company Address'}
          </Typography>
          <Typography variant="body2">
            Haryana - 122051
          </Typography>
        </Box>

        {/* Title Section */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, textDecoration: 'underline' }}>
            PACKING LIST FOR M/S. {billData?.customer?.name?.toUpperCase() ?? 'CUSTOMER'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Invoice # : {billData?.invoice_no || 'N/A'}
          </Typography>
        </Box>

        {/* Date */}
        <Box sx={{ textAlign: 'right', mb: 3 }}>
          <Typography variant="body2">
            <strong>Date:</strong> {formatDate(billData?.date) || new Date().toLocaleDateString()}
          </Typography>
        </Box>

        {/* Items Table */}
        {items.length > 0 ? (
          <TableContainer component={Paper}>
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
                  <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Nag</TableCell>
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
                    <TableCell align="center">
                      <TextField
                        fullWidth
                        type="number"
                        size="small"
                        value={cartoonNumbers[item.id] || 1}
                        onChange={(e) => handleCartoonChange(item.id, e.target.value)}
                        inputProps={{
                          min: 0,
                          style: { textAlign: 'center' }
                        }}
                        sx={{ maxWidth: 100 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {item.product?.image ? (
                        <Box
                          component="img"
                          src={`${mediaUrl}${item.product.image}`}
                          alt={item.product?.name || 'Product'}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            display: 'block',
                            margin: '0 auto',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.textContent = '-';
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
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No items found
            </Typography>
          </Box>
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

      {/* Hidden Print Slips Content - Dynamic 8 Slips per Page in A4 Landscape */}
      <Box
        ref={slipRef}
        sx={{
          display: 'none',
          '@media print': {
            display: 'block',
          }
        }}
      >
        {generateSlips.reduce((pages, slip, index) => {
          const pageIndex = Math.floor(index / 8);
          if (!pages[pageIndex]) {
            pages[pageIndex] = [];
          }
          pages[pageIndex].push(slip);
          return pages;
        }, []).map((pageSlips, pageIndex) => (
          <Box
            key={pageIndex}
            className={pageIndex < Math.ceil(generateSlips.length / 8) - 1 ? 'page-break' : ''}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: '5mm',
              width: '100%',
              height: '100vh',
              p: 0,
              m: 0,
              boxSizing: 'border-box',
            }}
          >
            {pageSlips.map((slip, slipIndex) => (
              <SlipCard
                key={`${slip.item.id}-${slip.slipNumber}`}
                slip={slip}
                appDetails={appDetails}
                billData={billData}
                mediaUrl={mediaUrl}
                formatDate={formatDate}
              />
            ))}
            {/* Fill empty slots with blank boxes to maintain grid */}
            {[...Array(8 - pageSlips.length)].map((_, i) => (
              <Box key={`empty-${i}`} />
            ))}
          </Box>
        ))}
      </Box>
    </>
  );
};

// Separate Slip Card Component for better performance and readability
const SlipCard = ({ slip, appDetails, billData, mediaUrl, formatDate }) => {
  const { item, displayText, totalSlips } = slip;

  return (
    <Box
      sx={{
        border: '2px dashed #999',
        borderRadius: 1,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: '#fff',
        boxSizing: 'border-box',
        height: '100%',
      }}
    >
      {/* Company Name */}
      <Box sx={{ textAlign: 'center', mb: 1, borderBottom: '1px solid #000', pb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
          {appDetails?.application_name || 'Company Name'}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
          {formatDate(billData?.date)}
        </Typography>
      </Box>

      {/* Product Image */}
      <Box sx={{ textAlign: 'center', my: 1 }}>
        {item.product?.image ? (
          <Box
            component="img"
            src={`${mediaUrl}${item.product.image}`}
            alt={item.product?.name || 'Product'}
            sx={{
              width: 70,
              height: 70,
              objectFit: 'cover',
              borderRadius: 1,
              display: 'block',
              margin: '0 auto',
              border: '2px solid #ddd',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                                <div style="width: 70px; height: 70px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin: 0 auto; border: 1px dashed #ccc;">
                                    <span style="font-size: 0.5rem; color: #999;">No Image</span>
                                </div>
                            `;
            }}
          />
        ) : (
          <Box
            sx={{
              width: 70,
              height: 70,
              bgcolor: '#f5f5f5',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              border: '1px dashed #ccc',
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#999' }}>
              No Image
            </Typography>
          </Box>
        )}
      </Box>

      {/* Product Details */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', mb: 0.5, textAlign: 'center' }}>
          {item.product?.name || 'Product Name'}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 0.5, fontSize: '0.6rem' }}>
          <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Model:</Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
            {item.product?.model || 'N/A'}
          </Typography>

          <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Size:</Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
            {item.product?.size || 'N/A'}
          </Typography>

          <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Qty:</Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
            {item.qty || 'N/A'}
          </Typography>
          {totalSlips > 1 && (
            <>
              <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Part:</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, wordBreak: 'break-word' }}>
                {displayText}
              </Typography>
            </>
          )}


          <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Customer:</Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, wordBreak: 'break-word' }}>
            {billData?.customer?.name || 'N/A'}
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 1, pt: 0.5, borderTop: '1px solid #ccc' }}>
        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#666' }}>
          Invoice: {billData?.invoice_no || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
};

export default PackageList;
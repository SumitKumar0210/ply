import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  Grid,
  Button,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  IconButton,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from "@mui/material";
import {
  Table as ResponsiveTable,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { fetchLedgerData } from "../slice/ledgerSlice";
import { useParams } from "react-router-dom";
import { fetchPaymentRecord, clearPayments } from "../slice/vendorInvoiceSlice";
import CloseIcon from "@mui/icons-material/Close";

const Ledger = () => {
  const contentRef = useRef(null);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [open, setOpen] = useState(false);

  // Redux State
  const { selected: data = {}, loading } = useSelector((state) => state.ledger);
  const { payments = [], paymentLoading = false } = useSelector(
    (state) => state.vendorInvoice
  );

  // Fetch ledger data on mount
  useEffect(() => {
    if (id) dispatch(fetchLedgerData(id));
  }, [dispatch, id]);

  const items = data?.inwards || [];

  // Calculate total quantity from material items
  const itemCount = useCallback((items) => {
    try {
      const parsedItems = items ? JSON.parse(items) : [];
      return parsedItems.reduce(
        (total, item) => total + (Number(item.qty) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, []);

  // Modal handlers
  const handleClose = useCallback(() => {
    setOpen(false);
    dispatch(clearPayments());
  }, [dispatch]);

  const handlePaymentHistory = useCallback(
    (invoiceId) => {
      dispatch(fetchPaymentRecord({ id: invoiceId }));
      setOpen(true);
    },
    [dispatch]
  );

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Ledger Report",
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

  return (
    <>
      {/* Header */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6" className="page-title">Ledger</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AiOutlinePrinter />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Grid>
      </Grid>

      {/* Ledger Content */}
      <div ref={contentRef} style={{ background: "#fff", padding: "20px" }}>
        <Card>
          <CardContent>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
              <strong>{data?.name || "N/A"}</strong>
              <br />
              {data?.address || "N/A"}, {data?.city || "N/A"}
              <br />
              {data?.state?.name || "N/A"} {data?.zip_code || "N/A"}
              <br />
              GSTIN: {data?.gst || "N/A"}
            </Typography>

            <ResponsiveTable style={{ width: "100%", marginTop: "20px" }}>
              <Thead>
                <Tr>
                  <Th>Invoice Date</Th>
                  <Th>Invoice No</Th>
                  <Th>Total Qty</Th>
                  <Th>Debit</Th>
                  <Th>Credit</Th>
                  <Th>Balance</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <Tr key={item.id}>
                      <Td>{item?.vendor_invoice_date || "-"}</Td>
                      <Td>{item?.vendor_invoice_no || "-"}</Td>
                      <Td>{itemCount(item?.material_items)}</Td>
                      <Td>
                        ₹
                        {Number(item?.grand_total || 0).toLocaleString("en-IN")}
                      </Td>
                      <Td>
                        ₹
                        {item?.due_amount === null
                          ? 0
                          : Number(
                              (item?.grand_total || 0) - (item?.due_amount || 0)
                            ).toLocaleString("en-IN")}
                      </Td>
                      <Td
                        onClick={() => handlePaymentHistory(item.id)}
                        style={{
                          cursor: "pointer",
                          color: "#1976d2",
                          textDecoration: "underline",
                        }}
                      >
                        ₹{item?.due_amount === null
                        ? Number(item?.grand_total || 0).toLocaleString("en-IN")
                        : Number(item?.due_amount || 0).toLocaleString("en-IN")}
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td
                      colSpan={6}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      {loading ? "Loading..." : "No records found"}
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </ResponsiveTable>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Modal */}
      <Dialog onClose={handleClose} open={open} fullWidth maxWidth="md">
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Payment History</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent dividers>
          <Box
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "background.paper",
            }}
          >
            {paymentLoading ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress size={32} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  Loading payment history...
                </Typography>
              </Box>
            ) : payments && payments.length > 0 ? (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: "13px",
                          bgcolor: "grey.100",
                        }}
                      >
                        Date
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: "13px",
                          bgcolor: "grey.100",
                        }}
                      >
                        Paid (₹)
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: "13px",
                          bgcolor: "grey.100",
                        }}
                      >
                        Mode
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: "13px",
                          bgcolor: "grey.100",
                        }}
                      >
                        Reference No
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: "13px",
                          textAlign: "right",
                          bgcolor: "grey.100",
                        }}
                      >
                        Due (₹)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment, index) => (
                      <TableRow
                        key={payment.id || index}
                        hover
                        sx={{ "&:nth-of-type(even)": { bgcolor: "grey.50" } }}
                      >
                        <TableCell sx={{ fontSize: "13px" }}>
                          {payment.date
                            ? new Date(payment.date).toLocaleDateString("en-IN")
                            : "-"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px", fontWeight: 500 }}>
                          ₹
                          {Number(payment.paid_amount || 0).toLocaleString(
                            "en-IN"
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ fontSize: "13px", textTransform: "capitalize" }}
                        >
                          {payment.payment_mode || "-"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {payment.reference_no || "-"}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "13px",
                            textAlign: "right",
                            fontWeight: 600,
                            color:
                              Number(payment.due || 0) === 0
                                ? "success.main"
                                : "warning.main",
                          }}
                        >
                          ₹{Number(payment.due || 0).toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No payment history available
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1, mb: 1 }}>
          <Button variant="outlined" color="error" onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Ledger;
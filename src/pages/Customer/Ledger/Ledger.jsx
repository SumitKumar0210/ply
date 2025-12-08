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
  Alert,
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
import { useParams } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { getCustomerLedger } from "../slice/customerLedgerSlice";
import { fetchPaymentRecord, clearPayments } from "../../Billing/slice/paymentSlice";

// Utility function for formatting currency
const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

// Utility function for calculating credit
const calculateCredit = (grandTotal, dueAmount) => {
  if (dueAmount === null) return 0;
  return (grandTotal || 0) - (dueAmount || 0);
};

// Separate component for customer info
const CustomerInfo = React.memo(({ data }) => (
  <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
    <strong>{data?.name || "N/A"}</strong>
    <br />
    {data?.address || "N/A"}, {data?.city || "N/A"}
    <br />
    {data?.state?.name || "N/A"} {data?.zip_code || "N/A"}
    <br />
    GSTIN: {data?.gst_no || "N/A"}
  </Typography>
));

CustomerInfo.displayName = "CustomerInfo";

// Separate component for ledger row
const LedgerRow = React.memo(({ item, onPaymentHistoryClick }) => {
  const credit = calculateCredit(item?.grand_total, item?.due_amount);
  const balance = item?.due_amount === null 
    ? item?.grand_total || 0 
    : item?.due_amount || 0;

  return (
    <Tr>
      <Td>{item?.date || "-"}</Td>
      <Td>{item?.invoice_no || "-"}</Td>
      <Td>{formatCurrency(item?.grand_total)}</Td>
      <Td>{formatCurrency(credit)}</Td>
      <Td
        onClick={() => onPaymentHistoryClick(item.id)}
        style={{
          cursor: "pointer",
          color: "#1976d2",
          textDecoration: "underline",
        }}
      >
        {formatCurrency(balance)}
      </Td>
    </Tr>
  );
});

LedgerRow.displayName = "LedgerRow";

// Separate component for payment history table
const PaymentHistoryTable = React.memo(({ payments, loading }) => {
  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading payment history...
        </Typography>
      </Box>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No payment history available
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            {["Date", "Paid (₹)", "Mode", "Reference No", "Due (₹)"].map((header) => (
              <TableCell
                key={header}
                sx={{
                  fontWeight: 600,
                  fontSize: "13px",
                  bgcolor: "grey.100",
                  textAlign: header === "Due (₹)" ? "right" : "left",
                }}
              >
                {header}
              </TableCell>
            ))}
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
                {formatCurrency(payment.paid_amount)}
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
                {formatCurrency(payment.due)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

PaymentHistoryTable.displayName = "PaymentHistoryTable";

const CustomerLedger = () => {
  const contentRef = useRef(null);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [open, setOpen] = useState(false);

  // Redux State with proper default values
  const { 
    payments: ledgerData = {}, 
    loading, 
    error 
  } = useSelector((state) => state.customerLedger);
  
  const { 
    payments = [], 
    paymentLoading = false,
    error: paymentError
  } = useSelector((state) => state.payment);

  // Memoized items array
  const items = useMemo(() => ledgerData?.payments || [], [ledgerData?.payments]);

  // Fetch ledger data on mount
  useEffect(() => {
    if (id) {
      dispatch(getCustomerLedger(id));
    }
  }, [dispatch, id]);

  // Modal handlers
  const handleClose = useCallback(() => {
    setOpen(false);
    dispatch(clearPayments());
  }, [dispatch]);

  const handlePaymentHistory = useCallback(
    (billID) => {
      if (!billID) return;
      dispatch(fetchPaymentRecord({ id: billID }));
      setOpen(true);
    },
    [dispatch]
  );

  // Print handler with error handling
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Ledger Report",
    onPrintError: (error) => {
      console.error("Print error:", error);
    },
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
          <Typography variant="h6">Ledger</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AiOutlinePrinter />}
            onClick={handlePrint}
            disabled={loading || items.length === 0}
          >
            Print
          </Button>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Ledger Content */}
      <div ref={contentRef} style={{ background: "#fff", padding: "20px" }}>
        <Card>
          <CardContent>
            <CustomerInfo data={ledgerData} />

            <ResponsiveTable style={{ width: "100%", marginTop: "20px" }}>
              <Thead>
                <Tr>
                  <Th>Invoice Date</Th>
                  <Th>Invoice No</Th>
                  <Th>Debit</Th>
                  <Th>Credit</Th>
                  <Th>Balance</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                      <CircularProgress size={24} />
                    </Td>
                  </Tr>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <LedgerRow
                      key={item.id}
                      item={item}
                      onPaymentHistoryClick={handlePaymentHistory}
                    />
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                      No records found
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
          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentError}
            </Alert>
          )}
          <Box
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "background.paper",
            }}
          >
            <PaymentHistoryTable payments={payments} loading={paymentLoading} />
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

export default CustomerLedger;
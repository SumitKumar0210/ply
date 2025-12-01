import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Tooltip,
  Chip,
  Grid,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { GrCurrency } from "react-icons/gr";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { Formik, Form } from "formik";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVendorInvoices,
  recordPayment,
  fetchPaymentRecord,
  clearPayments,
} from "../slice/vendorInvoiceSlice";

// Validation Schema
const validationSchema = Yup.object().shape({
  paymentMode: Yup.string().required("Please select a payment mode"),
  amount: Yup.number()
    .typeError("Amount must be a number")
    .positive("Amount must be greater than zero")
    .required("Please enter the amount"),
  referenceNo: Yup.string().when("paymentMode", {
    is: (val) => val === "upi" || val === "cheque",
    then: (schema) =>
      schema.required("Reference number is required for this payment mode"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

// Status Configuration
const STATUS_CONFIG = {
  0: { label: "Pending", color: "warning" },
  1: { label: "Partially Paid", color: "info" },
  2: { label: "Paid", color: "success" },
};

// Helper Functions
const getStatusChip = (status) => {
  const config = STATUS_CONFIG[status] || {
    label: "Unknown",
    color: "default",
  };
  return <Chip label={config.label} color={config.color} size="small" />;
};

const getItemCount = (materialItems) => {
  if (!materialItems) return 0;
  try {
    const items = JSON.parse(materialItems);
    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, "0")}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${date.getFullYear()}`;
};

const VendorInvoice = () => {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);
  const dispatch = useDispatch();

  // Redux State
  const {
    data: tableData = [],
    total: totalRows = 0,
    loading = false,
  } = useSelector((state) => state.vendorInvoice);
  const { payments = [], paymentLoading = false } = useSelector(
    (state) => state.vendorInvoice
  );

  // Local State
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [open, setOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dueAmount, setDueAmount] = useState(null);

  // Calculate display conditions
  const shouldShowForm = useMemo(() => {
    // Show form when: due_amount is null (no payments yet) OR due_amount > 0
    return dueAmount === null || dueAmount > 0;
  }, [dueAmount]);

  const shouldShowHistory = useMemo(() => {
    // Show history when: due_amount is NOT null (at least one payment made)
    return dueAmount !== null;
  }, [dueAmount]);

  const dialogMaxWidth = useMemo(() => {
    // If showing both form and history, use 'lg', otherwise 'md'
    return shouldShowForm && shouldShowHistory ? "lg" : "md";
  }, [shouldShowForm, shouldShowHistory]);

  // Fetch Data
  const fetchData = useCallback(() => {
    dispatch(
      fetchVendorInvoices({
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modal Handlers
  const handleClickOpen = useCallback(
    (invoice) => {
      setSelectedInvoice(invoice);
      setDueAmount(invoice.due_amount ?? invoice.grand_total);
      dispatch(fetchPaymentRecord({ id: invoice?.id }));
      setOpen(true);
    },
    [dispatch]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedInvoice(null);
    setDueAmount(null);
    dispatch(clearPayments());
  }, [dispatch]);

  // Navigation Handler
  const handleViewClick = useCallback(
    (id) => {
      navigate(`/vendor/invoice/view/${id}`);
    },
    [navigate]
  );

  // Payment Submission
  const handlePaymentSubmit = useCallback(
    async (values, { setSubmitting, resetForm }) => {
      try {
        const result = await dispatch(
          recordPayment({
            invoice_id: selectedInvoice?.id,
            payment_mode: values.paymentMode,
            amount: values.amount,
            reference_no: values.referenceNo,
          })
        ).unwrap();

        // Update due amount
        setDueAmount(result?.due_amount);

        // Refresh payment records
        await dispatch(fetchPaymentRecord({ id: selectedInvoice?.id }));

        // Update selected invoice
        if (result?.due_amount !== undefined) {
          setSelectedInvoice((prev) => ({
            ...prev,
            due_amount: result.due_amount,
            paid_amount: result.total_paid || prev.paid_amount,
          }));
        }

        // Refresh main table
        fetchData();

        // Reset form
        resetForm();
      } catch (error) {
        console.error("Payment error:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [dispatch, selectedInvoice, fetchData]
  );

  // Table Columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "poNumber",
        header: "PO NO.",
        Cell: ({ row }) => row.original.purchase_order?.purchase_no || "-",
      },
      {
        accessorKey: "vendorInvoice",
        header: "Vendor Invoice",
        Cell: ({ row }) => row.original.vendor_invoice_no || "-",
      },
      {
        accessorKey: "date",
        header: "Date",
        Cell: ({ row }) => formatDate(row.original.vendor_invoice_date),
      },
      {
        accessorKey: "vendorName",
        header: "Vendor Name",
        Cell: ({ row }) => row.original.purchase_order?.vendor?.name || "-",
      },
      {
        accessorKey: "orderDated",
        header: "Order Dated",
        Cell: ({ row }) => formatDate(row.original.purchase_order?.order_date),
      },
      {
        accessorKey: "qcPassed",
        header: "QC",
        Cell: ({ row }) => getItemCount(row.original.material_items),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => getStatusChip(row.original.status),
      },
      {
        id: "actions",
        header: "Actions",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="View Invoice">
              <IconButton
                color="warning"
                onClick={() => handleViewClick(row.original.purchase_order?.id)}
                size="small"
              >
                <MdOutlineRemoveRedEye size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Make Payment">
              <IconButton
                color="success"
                onClick={() => handleClickOpen(row.original)}
                size="small"
              >
                <GrCurrency size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleViewClick, handleClickOpen]
  );

  // CSV Export
  const downloadCSV = useCallback(() => {
    try {
      const headers = [
        "PO NO.",
        "Vendor Invoice",
        "Date",
        "Vendor Name",
        "Order Dated",
        "QC",
        "Status",
      ];
      const rows = tableData.map((row) => [
        row.purchase_order?.purchase_no || "",
        row.vendor_invoice_no || "",
        formatDate(row.vendor_invoice_date),
        row.purchase_order?.vendor?.name || "",
        formatDate(row.purchase_order?.order_date),
        getItemCount(row.material_items),
        STATUS_CONFIG[row.status]?.label || "Unknown",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `VendorInvoices_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [tableData]);

  // Print Handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    try {
      const printWindow = window.open("", "", "height=600,width=1200");
      if (!printWindow) return;
      printWindow.document.write(tableContainerRef.current.innerHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Print error:", error);
    }
  }, []);

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
          <Typography variant="h6">Vendor Invoices</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create"
          >
            Create PO
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper
        elevation={0}
        ref={tableContainerRef}
        sx={{
          width: "100%",
          overflow: "hidden",
          backgroundColor: "#fff",
          px: 2,
          py: 1,
        }}
      >
        <MaterialReactTable
          columns={columns}
          data={tableData}
          manualPagination
          rowCount={totalRows}
          state={{ pagination, isLoading: loading }}
          onPaginationChange={setPagination}
          enableTopToolbar
          enableColumnFilters
          enableSorting
          enableBottomToolbar
          enableGlobalFilter
          enableDensityToggle={false}
          enableColumnActions={false}
          enableColumnVisibilityToggle={false}
          initialState={{ density: "compact" }}
          muiTableContainerProps={{
            sx: {
              width: "100%",
              backgroundColor: "#fff",
              overflowX: "auto",
              minWidth: "1200px",
            },
          }}
          muiTablePaperProps={{
            sx: { backgroundColor: "#fff", boxShadow: "none" },
          }}
          renderTopToolbar={({ table }) => (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                p: 1,
              }}
            >
               <Typography variant="h6" className='page-title'>
                Vendor Invoices/Payments
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MRT_GlobalFilterTextField table={table} />
                <MRT_ToolbarInternalButtons table={table} />
                <Tooltip title="Print">
                  <IconButton onClick={handlePrint} size="small">
                    <FiPrinter size={20} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download CSV">
                  <IconButton onClick={downloadCSV} size="small">
                    <BsCloudDownload size={20} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        />
      </Paper>

      {/* Payment Modal */}
      <Dialog
        onClose={handleClose}
        open={open}
        fullWidth
        maxWidth={dialogMaxWidth}
      >
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Collect Payment</DialogTitle>
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

        <Formik
          initialValues={{
            amountToPay: dueAmount ?? 0,
            paymentMode: "",
            amount: "",
            referenceNo: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handlePaymentSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, handleChange, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Payment Form - Show when due_amount is null OR > 0 */}
                  {shouldShowForm && (
                    <Grid item xs={12} md={shouldShowHistory ? 6 : 12}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        Payment Details
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        margin="dense"
                        label="Amount to Pay"
                        name="amountToPay"
                        value={`₹${Number(
                          values.amountToPay || 0
                        ).toLocaleString("en-IN")}`}
                        InputProps={{ readOnly: true }}
                        sx={{ mb: 1 }}
                      />
                      <TextField
                        fullWidth
                        select
                        margin="dense"
                        label="Payment Mode"
                        name="paymentMode"
                        size="small"
                        value={values.paymentMode}
                        onChange={handleChange}
                        error={
                          touched.paymentMode && Boolean(errors.paymentMode)
                        }
                        helperText={touched.paymentMode && errors.paymentMode}
                        sx={{ mb: 1 }}
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                      </TextField>
                      {(values.paymentMode === "upi" ||
                        values.paymentMode === "cheque") && (
                        <TextField
                          fullWidth
                          size="small"
                          margin="dense"
                          label="Reference Number"
                          name="referenceNo"
                          value={values.referenceNo}
                          onChange={handleChange}
                          error={
                            touched.referenceNo && Boolean(errors.referenceNo)
                          }
                          helperText={touched.referenceNo && errors.referenceNo}
                          sx={{ mb: 1 }}
                        />
                      )}
                      <TextField
                        fullWidth
                        size="small"
                        margin="dense"
                        label="Amount"
                        name="amount"
                        type="number"
                        value={values.amount}
                        onChange={handleChange}
                        error={touched.amount && Boolean(errors.amount)}
                        helperText={touched.amount && errors.amount}
                        sx={{ mb: 1 }}
                      />
                    </Grid>
                  )}

                  {/* Payment History - Show when due_amount is NOT null */}
                  {shouldShowHistory && (
                    <Grid item xs={12} md={shouldShowForm ? 6 : 12}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        Payment History
                      </Typography>
                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          overflow: "hidden",
                          maxHeight: 320,
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
                          <TableContainer sx={{ maxHeight: 300 }}>
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
                                    sx={{
                                      "&:nth-of-type(even)": {
                                        backgroundColor: "grey.50",
                                      },
                                    }}
                                  >
                                    <TableCell sx={{ fontSize: "13px" }}>
                                      {payment.date
                                        ? new Date(
                                            payment.date
                                          ).toLocaleDateString("en-IN")
                                        : "-"}
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontSize: "13px", fontWeight: 500 }}
                                    >
                                      ₹
                                      {Number(
                                        payment.paid_amount || 0
                                      ).toLocaleString("en-IN")}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        fontSize: "13px",
                                        textTransform: "capitalize",
                                      }}
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
                                      ₹
                                      {Number(payment.due || 0).toLocaleString(
                                        "en-IN"
                                      )}
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
                    </Grid>
                  )}
                </Grid>
              </DialogContent>

              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                {shouldShowForm && (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </>
  );
};

export default VendorInvoice;
import React, { useMemo, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
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
  DialogContentText,
  DialogTitle,
  Box,
  Tooltip,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from 'react-router-dom';

import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { GrCurrency } from "react-icons/gr";
import { Formik, Form } from "formik";


const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

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


function BootstrapDialogTitle(props) {
  const { children, onClose, ...other } = props;
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>
  );
}

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

//  Status colors
const getStatusChip = (status) => {
  switch (status) {
    case "Pending":
      return <Chip label="Pending" color="warning" size="small" />;
    case "Paid":
      return <Chip label="Paid" color="success" size="small" />;
    case "Partially Paid":
      return <Chip label="Partially Paid" color="info" size="small" />;
    default:
      return <Chip label="Unknown" size="small" />;
  }
};


//  Initial invoices
const invoices = [
  {
    id: 1,
    poNumber: "PO-1001",
    vendorInvoice: "INV-5678",
    dated: "2025-09-10",
    vendorName: "ABC Suppliers",
    orderDated: "2025-09-05",
    qcPassed: 120,
    receivedTotal: 150,
    status: "Pending",
  },
  {
    id: 2,
    poNumber: "PO-1002",
    vendorInvoice: "INV-9876",
    dated: "2025-09-12",
    vendorName: "XYZ Traders",
    orderDated: "2025-09-08",
    qcPassed: 200,
    receivedTotal: 200,
    status: "Paid",
  },
  {
    id: 3,
    poNumber: "PO-1003",
    vendorInvoice: "INV-9876",
    dated: "2025-09-12",
    vendorName: "XYZ Traders",
    orderDated: "2025-09-08",
    qcPassed: 200,
    receivedTotal: 200,
    status: "Partially Paid",
  },
];

const VendorInvoice = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const [tableData, setTableData] = useState(invoices);
  const tableContainerRef = useRef(null);

  const navigate = useNavigate();
  const handleViewClick = () => {
    navigate('/vendor/invoice/view');
  };

   const [open, setOpen] = React.useState(false);
  
    const handleClickOpen = () => {
      setOpen(true);
    };
    const handleClose = () => {
      setOpen(false);
    };
  //  Table columns
  const columns = useMemo(
    () => [
      { accessorKey: "poNumber", header: "PO NO." },
      { accessorKey: "vendorInvoice", header: "Vendor Invoice NO." },
      { accessorKey: "dated", header: "Dated" },
      { accessorKey: "vendorName", header: "Vendor Name" },
      { accessorKey: "orderDated", header: "Order Dated" },
      { accessorKey: "qcPassed", header: "QC Passed Item" },
      { accessorKey: "receivedTotal", header: "Received Total" },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => getStatusChip(cell.getValue()),
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
                onClick={handleViewClick}
              >
                <MdOutlineRemoveRedEye size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Make Payment">
              <IconButton
                aria-label="payment"
                color="success"
                onClick={handleClickOpen}
              >
                <GrCurrency size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  );

  //  CSV export using tableData
  const downloadCSV = () => {
    const headers = columns
      .filter((col) => col.accessorKey && col.accessorKey !== "actions")
      .map((col) => col.header);
    const rows = tableData.map((row) =>
      columns
        .filter((col) => col.accessorKey && col.accessorKey !== "actions")
        .map((col) => `"${row[col.accessorKey] ?? ""}"`)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "VendorInvoices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //  Print handler
  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <>
      {/* Header Row */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6">Vendor Invoices</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create"   // your route path
          >
            Create PO
          </Button>
        </Grid>
      </Grid>

      {/* Invoice Table */}
      <Grid size={12}>
        <Paper
          elevation={0}
          ref={tableContainerRef}
          sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff", px: 2, py: 1 }}
        >
          <MaterialReactTable
            columns={columns}
            data={tableData}
            enableTopToolbar
            enableColumnFilters
            enableSorting
            enablePagination
            enableBottomToolbar
            enableGlobalFilter
            enableDensityToggle={false}
            enableColumnActions={false}
            enableColumnVisibilityToggle={false}
            initialState={{ density: "compact" }}
            muiTableContainerProps={{
              sx: { width: "100%", backgroundColor: "#fff", overflowX: "auto", minWidth: "1200px" },
            }}
            muiTablePaperProps={{ sx: { backgroundColor: "#fff", boxShadow: "none" } }}
            muiTableBodyRowProps={({ row }) => ({
                hover: false,
                sx: row.original.status === "inactive"
                  ? { "&:hover": { backgroundColor: "transparent" } }
                  : {},
              })}
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
                <Typography variant="h6" fontWeight={400}>
                  Vendor Invoices/Payments
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />
                  <MRT_ToolbarInternalButtons table={table} />
                  <Tooltip title="Print">
                    <IconButton onClick={handlePrint}>
                      <FiPrinter size={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download CSV">
                    <IconButton onClick={downloadCSV}>
                      <BsCloudDownload size={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          />
        </Paper>
      </Grid>
      {/* Modal make payment start */}
     <BootstrapDialog
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ m: 0, p: 1.5 }} id="customized-dialog-title">
        Collect Payment
      </DialogTitle>

      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>

      <Formik
        initialValues={{
          amountToPay: "₹15000",
          paymentMode: "",
          amount: "",
          referenceNo: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          console.log("Form Submitted:", values);
          handleClose();
        }}
      >
        {({ values, errors, touched, handleChange }) => (
          <Form>
            <DialogContent dividers>
              {/* Amount to Pay (read-only) */}
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Amount to Pay"
                name="amountToPay"
                value={values.amountToPay}
                InputProps={{ readOnly: true }}
                sx={{ mb: 1 }}
              />

              {/* Payment Mode */}
              <TextField
                fullWidth
                select
                margin="dense"
                label="Payment Mode"
                name="paymentMode"
                size="small"
                value={values.paymentMode}
                onChange={handleChange}
                error={touched.paymentMode && Boolean(errors.paymentMode)}
                helperText={touched.paymentMode && errors.paymentMode}
                sx={{ mb: 1 }}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
              </TextField>

              {/* Reference Number - conditional field */}
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
                  error={touched.referenceNo && Boolean(errors.referenceNo)}
                  helperText={touched.referenceNo && errors.referenceNo}
                  sx={{ mb: 1 }}
                />
              )}

              {/* Amount */}
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Amount"
                name="amount"
                value={values.amount}
                onChange={handleChange}
                error={touched.amount && Boolean(errors.amount)}
                helperText={touched.amount && errors.amount}
                sx={{ mb: 1 }}
              />
            </DialogContent>

            <DialogActions sx={{ gap: 1, mb: 1 }}>
              <Button variant="outlined" color="error" onClick={handleClose}>
                Close
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Submit
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </BootstrapDialog>
     {/* Modal make payment end */}
     
    </>
  );
};

export default VendorInvoice;

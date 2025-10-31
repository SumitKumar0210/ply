import React, { useMemo, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
import {
  Button,
  Paper,
  Typography,
  IconButton,
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
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";

//  Styled Dialog
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

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

//  Initial purchaseOrder (updated)
const purchaseOrder = [
  {
    id: 1,
    poNumber: "PO-1001",
    vendorName: "ABC Suppliers",
    dated: "2025-09-10",
    orderTotal: 50000,
    itemsOrdered: 150,
    qcPassed: 120,
    receivedTotal: 150,
    status: "Pending",
  },
  {
    id: 2,
    poNumber: "PO-1002",
    vendorName: "XYZ Traders",
    dated: "2025-09-12",
    orderTotal: 75000,
    itemsOrdered: 200,
    qcPassed: 200,
    receivedTotal: 200,
    status: "Paid",
  },
  {
    id: 3,
    poNumber: "PO-1003",
    vendorName: "LMN Enterprises",
    dated: "2025-09-14",
    orderTotal: 60000,
    itemsOrdered: 180,
    qcPassed: 160,
    receivedTotal: 170,
    status: "Partially Paid",
  },
];

const PurchaseOrder = () => {
  const [openDelete, setOpenDelete] = useState(false);
  
  const [tableData, setTableData] = useState(purchaseOrder);
  const tableContainerRef = useRef(null);
  const navigate = useNavigate();

  const handleViewClick = () => {
    navigate('/vendor/purchase-order/view');
  };
  const handleEditClick = () => {
    navigate('/vendor/purchase-order/edit');
  };

  //  Table columns (updated)
  const columns = useMemo(
    () => [
      { accessorKey: "poNumber", header: "Po No." },
      { accessorKey: "vendorName", header: "Vendor Name" },
      { accessorKey: "dated", header: "Dated" },
      { accessorKey: "orderTotal", header: "Order Total" },
      { accessorKey: "itemsOrdered", header: "Items Ordered" },
      { accessorKey: "qcPassed", header: "QC Passed Item" },
      { accessorKey: "receivedTotal", header: "Received Total" },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => getStatusChip(cell.getValue()),
      },
      {
        id: "actions",
        header: "Action",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="View">
              <IconButton
                color="warning"
                onClick={handleViewClick}
              >
                <MdOutlineRemoveRedEye size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={handleEditClick}
              >
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                aria-label="delete"
                color="error"
                onClick={() => setOpenDelete(true)}
              >
                <RiDeleteBinLine size={16} />
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
    link.setAttribute("download", "PurchaseOrder.csv");
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
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Purchase Order</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create" // your route path
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
            muiTableBodyRowProps={({ row }) => ({
              hover: false,
              sx:
                row.original.status === "inactive"
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
                  Purchase Order
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
      
      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>{"Delete this purchas order?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => setOpenDelete(false)}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PurchaseOrder;

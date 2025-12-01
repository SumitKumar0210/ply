import React, { useMemo, useState, useRef, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link, useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { getApprovePOData, deletePO } from "../slice/purchaseOrderSlice";
import UploadInvoiceButton from "../../../components/UploadInvoiceButton/UploadInvoiceButton";

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

//  Status helper
const getStatusChip = (status) => {
  switch (status) {
    case "Pending":
      return <Chip label="Pending" color="warning" size="small" />;
    case "Approved":
      return <Chip label="Approved" color="success" size="small" />;
    case "Partially Paid":
      return <Chip label="Partially Paid" color="info" size="small" />;
    default:
      return <Chip label={status || "Unknown"} size="small" />;
  }
};

const ApprovePurchaseOrder = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const tableContainerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data = [], total = 0, loading } = useSelector(
    (state) => state.purchaseOrder
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch paginated data
  useEffect(() => {
    dispatch(
      getApprovePOData({
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize]);

  // Format data for table
  const tableData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((po) => ({
      id: po.id,
      poNumber: po.purchase_no || "N/A",
      vendorName: po.vendor?.name || "N/A",
      dated: po.order_date || "-",
      orderTotal: po.grand_total || 0,
      itemsOrdered: po.material_items
        ? JSON.parse(po.material_items).length
        : 0,
      qcPassed: po.inward
        ? JSON.parse(po.inward.material_items).length
        : 0,
        qcData: po.inward,
      status: po.quality_status ? "Approved" : "Pending",
    }));
  }, [data]);

  const handlePrintClick = (id) => navigate("/vendor/purchase-order/print/" + id);
  const handleQualitycheckClick = (id) =>
    navigate("/vendor/purchase-order/quality-check/" + id);

  const handleDeleteConfirm = async () => {
  if (deleteId) {
    try {
      await dispatch(deletePO(deleteId)).unwrap();
      // Reload the table data after successful deletion
      dispatch(
        getApprovePOData({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
        })
      );
      setOpenDelete(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete purchase order:", error);
      // Optionally show an error message to the user
    }
  }
};

  const columns = useMemo(
    () => [
      { accessorKey: "poNumber", header: "Po No." },
      { accessorKey: "vendorName", header: "Vendor Name" },
      { accessorKey: "dated", header: "Order Date" },
      { accessorKey: "orderTotal", header: "Order Total" },
      { accessorKey: "itemsOrdered", header: "Items Ordered" },
      { accessorKey: "qcPassed", header: "QC Passed Item" },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => getStatusChip( cell.getValue() ),
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
            {row.original?.qcData && (
              <UploadInvoiceButton 
              row={row.original?.qcData} 
            />
            )}
            
            <Tooltip title="Quality Check">
              <IconButton color="primary" onClick={() => handleQualitycheckClick(row.original.id)}>
                <IoMdCheckmarkCircleOutline size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton color="warning" onClick={() => handlePrintClick(row.original.id)}>
                <FiPrinter size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                aria-label="delete"
                color="error"
                onClick={() => {
                  setDeleteId(row.original.id);
                  setOpenDelete(true);
                }}
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

  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );

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
          <Typography variant="h6">Quality Checks Order</Typography>
        </Grid>
        <Grid>
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
            manualPagination
            rowCount={total}
            state={{
              pagination,
              isLoading: loading,
            }}
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
                 <Typography variant="h6" className='page-title'>
                  Quality Checks
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete this purchase order?</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
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

export default ApprovePurchaseOrder;

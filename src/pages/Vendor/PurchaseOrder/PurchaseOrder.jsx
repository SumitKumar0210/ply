import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  Alert,
  Grid,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { useDispatch } from "react-redux";
import api from "../../../api";
import { deletePO } from "../slice/purchaseOrderSlice";

// Status mapping: 0-draft, 1-save, 2-reject, 3-approve
const STATUS_CONFIG = {
  0: { label: "Draft", color: "default" },
  1: { label: "Saved", color: "info" },
  2: { label: "Rejected", color: "error" },
  3: { label: "Approved", color: "success" },
};

const getStatusChip = (status) => {
  const config = STATUS_CONFIG[status] || { label: "Unknown", color: "default" };
  return <Chip label={config.label} color={config.color} size="small" />;
};

// Helper function to get item count from material_items JSON
const getItemCount = (materialItems) => {
  try {
    if (!materialItems) return 0;
    const items = typeof materialItems === "string" ? JSON.parse(materialItems) : materialItems;
    return Array.isArray(items) ? items.length : 0;
  } catch (error) {
    console.error("Error parsing material items:", error);
    return 0;
  }
};

const PurchaseOrder = () => {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);
  const dispatch = useDispatch();

  // State management
  const [tableData, setTableData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");

  // Show alert helper
  const showAlert = useCallback((msg, severity = "info") => {
    setAlertMessage(msg);
    setAlertSeverity(severity);
    setTimeout(() => setAlertMessage(""), 4000);
  }, []);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { pageIndex, pageSize } = pagination;

    try {
      const res = await api.get(
        `admin/purchase-order/get-data?page=${pageIndex + 1}&per_page=${pageSize}`
      );
      setTableData(res.data.data || []);
      setTotalRows(res.data.total || 0);
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert("Failed to fetch purchase orders", "error");
      setTableData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pagination, showAlert]);

  // Fetch when pagination changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigation handlers
  const handleViewClick = useCallback(
    (id) => navigate(`/vendor/purchase-order/view/${id}`),
    [navigate]
  );

  const handleEditClick = useCallback(
    (id) => navigate(`/vendor/purchase-order/edit/${id}`),
    [navigate]
  );

  // Delete handlers
  const handleDeleteClick = useCallback((id) => {
    setDeleteId(id);
    setOpenDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;

    try {
      await dispatch(deletePO(deleteId)).unwrap();
      setOpenDelete(false);
      setDeleteId(null);
      // Reload the table data after successful deletion
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      
    }
  }, [deleteId, dispatch, showAlert, fetchData]);

  // Table columns
  const columns = useMemo(
    () => [
      { accessorKey: "purchase_no", header: "Po No." },
      {
        accessorKey: "vendor_id",
        header: "Vendor Name",
        Cell: ({ row }) => row.original?.vendor?.name || "—",
      },
      {
        accessorKey: "material_items",
        header: "Items Ordered",
        Cell: ({ row }) => getItemCount(row.original.material_items),
      },
      { accessorKey: "order_date", header: "Order Date" },
      { accessorKey: "credit_days", header: "Credit Days" },
      {
        accessorKey: "grand_total",
        header: "Order Total",
        Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString("en-IN")}`,
      },
      {
        accessorKey: "cariage_amount",
        header: "Additional Amount",
        Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString("en-IN")}`,
      },
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
                onClick={() => handleViewClick(row.original.id)}
                size="small"
              >
                <MdOutlineRemoveRedEye size={16} />
              </IconButton>
            </Tooltip>
            {(row.original.status === 0 || row.original.status === 1) && (
              <Tooltip title="Edit">
                <IconButton
                  color="primary"
                  onClick={() => handleEditClick(row.original.id)}
                  size="small"
                >
                  <BiSolidEditAlt size={16} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => handleDeleteClick(row.original.id)}
                size="small"
              >
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleViewClick, handleEditClick, handleDeleteClick]
  );

  // CSV export
  const downloadCSV = useCallback(() => {
    try {
      const headers = [
        "Po No.",
        "Vendor Name",
        "Credit Days",
        "Order Total",
        "Items Ordered",
        "Order Date",
        "Additional Amount",
        "Status",
      ];

      const rows = tableData.map((row) => [
        row.purchase_no || "",
        row.vendor?.name || "",
        row.credit_days || 0,
        row.grand_total || 0,
        getItemCount(row.material_items),
        row.order_date || "",
        row.cariage_amount || 0,
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
        `PurchaseOrder_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showAlert("CSV downloaded successfully", "success");
    } catch (error) {
      console.error("CSV download error:", error);
      showAlert("Failed to download CSV", "error");
    }
  }, [tableData, showAlert]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;

    try {
      const printWindow = window.open("", "", "height=600,width=1200");
      if (!printWindow) {
        showAlert("Failed to open print window. Check popup blocker.", "error");
        return;
      }
      printWindow.document.write(tableContainerRef.current.innerHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Print error:", error);
      showAlert("Failed to print", "error");
    }
  }, [showAlert]);

  return (
    <>
      {/* Alert Messages */}
      {alertMessage && (
        <Alert
          severity={alertSeverity}
          sx={{ mb: 2 }}
          onClose={() => setAlertMessage("")}
        >
          {alertMessage}
        </Alert>
      )}

      {/* Header Row */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6">Purchase Order</Typography>
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

      {/* Purchase Order Table */}
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

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Purchase Order?</DialogTitle>
        <DialogContent sx={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
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

export default PurchaseOrder;
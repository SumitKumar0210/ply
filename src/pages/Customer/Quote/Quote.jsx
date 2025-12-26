import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
   Card,
    CardContent,
    Divider,
    Pagination,
    InputAdornment,
    CircularProgress,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link, useSearchParams } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { AiOutlineLink, AiOutlineCheck } from "react-icons/ai";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { PiCurrencyInr } from "react-icons/pi";
import { GrCurrency } from "react-icons/gr";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye, MdOutlineVisibilityOff } from "react-icons/md";
import { IoMdRefresh } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { TextField } from "@mui/material";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { FiUser, FiCalendar, FiPackage, FiCreditCard, FiPlus } from 'react-icons/fi';
import SearchIcon from "@mui/icons-material/Search";
import { fetchQuotation, deleteQuotation } from "../slice/quotationSlice";
import { useDispatch, useSelector } from "react-redux";
import LinkGenerator from "../../../components/Links/LinkGenerator";
import { set } from "lodash";
import { useAuth } from "../../../context/AuthContext";

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
    case 0:
      return <Chip label="Draft" color="warning" size="small" />;
    case 1:
      return <Chip label="Ordered" color="info" size="small" />;
    case 2:
      return <Chip label="Approved" color="success" size="small" />;
    case 3:
      return <Chip label="Requested to edit" color="secondary" size="small" />;
    default:
      return <Chip label="Unknown" size="small" />;
  }
};

const Quote = () => {
  const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { hasPermission, hasAnyPermission } = useAuth();
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showApproved, setShowApproved] = useState(false);
  const [remark, setRemark] = useState("");
  const [openRemark, setOpenRemark] = useState(false);
  const [rowData, setRowData] = useState({});

  const tableContainerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: tableData = [],
    loading,
    error,
    totalRecords = 0,
  } = useSelector((state) => state.quotation);

  // Get initial values from URL
  const getInitialPage = () => {
    const page = searchParams.get("page");
    return page ? parseInt(page) - 1 : 0;
  };

  const getInitialPageSize = () => {
    const pageSize = searchParams.get("per_page");
    return pageSize ? parseInt(pageSize) : 10;
  };

  const getInitialSearch = () => {
    return searchParams.get("search") || "";
  };

  // Local State for pagination and search
  const [pagination, setPagination] = useState({
    pageIndex: getInitialPage(),
    pageSize: getInitialPageSize(),
  });
  const [globalFilter, setGlobalFilter] = useState(getInitialSearch());

  // Update URL params
  const updateURLParams = useCallback((page, pageSize, search) => {
    const params = new URLSearchParams();
    params.set("page", (page + 1).toString());
    params.set("per_page", pageSize.toString());
    if (search) {
      params.set("search", search);
    }
    setSearchParams(params);
  }, [setSearchParams]);

  // Fetch Data
  const fetchData = useCallback(() => {
    const params = {
      pageIndex: pagination.pageIndex + 1,
      pageLimit: pagination.pageSize,
      approved: showApproved ? "true" : "false",
    };

    if (globalFilter) {
      params.search = globalFilter;
    }
    console.log('Fetching data with params:', params);

    dispatch(fetchQuotation(params));
    updateURLParams(pagination.pageIndex, pagination.pageSize, globalFilter);
  }, [dispatch, pagination.pageIndex, pagination.pageSize, globalFilter, showApproved, updateURLParams]);

  // Debounced fetch on pagination or search change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [pagination, globalFilter, showApproved]);

  // Handle pagination change
  const handlePaginationChange = useCallback((updater) => {
    setPagination((prev) => {
      const newPagination = typeof updater === 'function' ? updater(prev) : updater;
      return newPagination;
    });
  }, []);

  // Handle search change
  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value || "");
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Toggle approved data
  const handleToggleApproved = useCallback(() => {
    setShowApproved((prev) => !prev);
    // Reset to first page when toggling
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleViewClick = (id) => {
    navigate("/customer/quote/view/" + id);
  };

  const handleEditClick = (id) => {
    navigate("/customer/quote/edit/" + id);
  };

  const handlDelete = (row) => {
    setDeleteRow(row);
    setOpenDelete(true);
  };

  const deleteData = async (id) => {
    await dispatch(deleteQuotation(id));
    setOpenDelete(false);
    // Refresh data after deletion
    fetchData();
  };

  const handleDateFormate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleItemCount = (items) => {
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return 0;
      return parsed.length ?? 0;
    } catch (e) {
      console.error("Invalid product_ids format:", e);
      return 0;
    }
  };

  const showEditRequest = (row) => {
    if (row.status !== 3) return;
    setRemark(row);
    setOpenRemark(true);
  };

  //  Table columns
  const columns = useMemo(
    () => {
      const baseColumns = [
        {
          accessorKey: "quoteNumber",
          header: "Quote No.",
          Cell: ({ row }) => row.original?.batch_no ?? "",
        },
        {
          accessorKey: "customerName",
          header: "Customer Name",
          Cell: ({ row }) => row.original?.customer?.name ?? "",
        },
        {
          accessorKey: "date",
          header: "Date",
          Cell: ({ row }) => handleDateFormate(row.original.created_at),
        },
        {
          accessorKey: "quoteTotal",
          header: "Quote Total",
          Cell: ({ row }) =>
            row.original?.grand_total
              ? "₹ " + parseInt(row.original?.grand_total)
              : "",
        },
        {
          accessorKey: "totalItems",
          header: "Total Items",
          Cell: ({ row }) => handleItemCount(row.original?.product_ids),
        },
        {
          accessorKey: "status",
          header: "Status",
          Cell: ({ row }) => (
            <div onClick={() => showEditRequest(row.original)} style={{ cursor: "pointer" }}>
              {getStatusChip(row.original.status)}
            </div>
          ),
        },
      ];

      if (hasAnyPermission(["quotations.update", "quotations.generate_public_link", "quotations.delete", "quotations.read"])) {
        baseColumns.push(
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
                {hasPermission("quotations.generate_public_link") && (
                  <LinkGenerator
                  id={row.original.id}
                  customerId={row.original.customer?.id}
                  entity="quotation"
                />
                )}
                {hasPermission("quotations.read") && (
                <Tooltip title="View">
                  <IconButton
                    color="warning"
                    onClick={() => handleViewClick(row.original.id)}
                  >
                    <MdOutlineRemoveRedEye size={16} />
                  </IconButton>
                </Tooltip>
                )}
                {hasPermission("quotations.update") && (
                <Tooltip title="Edit">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditClick(row.original.id)}
                  >
                    <BiSolidEditAlt size={16} />
                  </IconButton>
                </Tooltip>
                )}
                {hasPermission("quotations.delete") && (
                <Tooltip title="Delete">
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handlDelete(row.original)}
                  >
                    <RiDeleteBinLine size={16} />
                  </IconButton>
                </Tooltip>
                )}
              </Box>
            ),
          }
        )
      }

      return baseColumns;
      []
    });

  //  CSV export
  const downloadCSV = useCallback(() => {
    try {
      const headers = [
        "Quote No.",
        "Customer Name",
        "Date",
        "Quote Total",
        "Total Items",
        "Status",
      ];
      const rows = tableData.map((row) => [
        row.batch_no || "",
        row.customer?.name || "",
        handleDateFormate(row.created_at),
        row.grand_total ? "₹ " + parseInt(row.grand_total) : "",
        handleItemCount(row.product_ids),
        row.status === 0 ? "Draft" : row.status === 1 ? "Ordered" : row.status === 2 ? "Production" : "Unknown",
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
        `Quotes_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [tableData]);

  //  Print handler
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
 // Mobile pagination handlers
  const handleMobilePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  };
  return (
    <>
      {/* Header Row */}
      <Grid
        container
        spacing={0}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: {xs: 1, md: 2} }}
      >
        <Grid>
          <Typography variant="h6" className="page-title">Quotation</Typography>
        </Grid>
        <Grid>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {hasPermission("quotations.approved_data") && (
            <Button
              variant={showApproved ? "contained" : "outlined"}
              startIcon={showApproved ?<MdOutlineRemoveRedEye /> : <MdOutlineVisibilityOff />}
              onClick={handleToggleApproved}
              color={showApproved ? "success" : "primary"}
            >
              {showApproved ? "Showing Approved" : "Approved Quotes"}
            </Button>
            )}
            {hasPermission("quotations.create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/customer/quote/create"
            >
              Create Quote
            </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {isMobile ? (
        // 🔹 MOBILE VIEW (Cards)
        <>
          <Box sx={{ minHeight: '100vh' }}>
            {/* Mobile Search */}
            <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search purchase orders..."
                value=""
                // onChange={(e) => handleGlobalFilterChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Paper>
            <Card sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2, maxWidth: 600 }}>
              {/* Header Section - Blue Background */}
              <Box
                sx={{
                  bgcolor: "primary.main",
                  p: 1.5,
                  color: "primary.contrastText",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "white", mb: 0.5 }}>
                      PO-001
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <FiUser size={14} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                        ABC Suppliers Ltd.
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label="Partially Paid"
                    size="small"
                    sx={{
                      bgcolor: "white",
                      color: "primary.main",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                    }}
                  />
                </Box>
              </Box>

              {/* Body Section */}
              <CardContent sx={{ p: 1.5 }}>
                {/* Details Grid */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={6}>
                    <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                      <Box
                        sx={{
                          color: "text.secondary",
                          mt: 0.2,
                        }}
                      >
                        <FiCalendar size={16} />
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            fontSize: "0.85rem",
                            mb: 0.3,
                          }}
                        >
                          Order Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                          Dec 15, 2024
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                      <Box
                        sx={{
                          color: "text.secondary",
                          mt: 0.2,
                        }}
                      >
                        <IoMdCheckmarkCircleOutline size={16} />
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            fontSize: "0.85rem",
                            mb: 0.3,
                          }}
                        >
                          QC Items
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                          20
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                      <Box
                        sx={{
                          color: "text.secondary",
                          mt: 0.2,
                        }}
                      >
                        <PiCurrencyInr size={16} />
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            fontSize: "0.85rem",
                            mb: 0.3,
                          }}
                        >
                          Vendor Invoice
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                          INV - 000914
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={6}>
                    <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                      <Box
                        sx={{
                          color: "text.secondary",
                          mt: 0.2,
                        }}
                      >
                        <FiCalendar size={16} />
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            fontSize: "0.85rem",
                            mb: 0.3,
                          }}
                        >
                          Invoice Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                          Dec 15, 2024
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
                <Divider sx={{ mb: 2 }} />
                {/* Action Buttons */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                  <IconButton
                    size="medium"
                    sx={{
                      bgcolor: "#fff3e0",
                      color: "#ff9800",
                      "&:hover": { bgcolor: "#ffe0b2" },
                    }}
                  >
                    <MdOutlineRemoveRedEye size={20} />
                  </IconButton>
                  <IconButton
                    size="medium"
                    sx={{
                      bgcolor: "#e8f5e9",      // light green
                      color: "#48c24eff",       // success dark
                      "&:hover": { bgcolor: "#c8e6c9" },
                    }}
                  >
                    <GrCurrency size={20} />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
            {/* Mobile Pagination */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={Math.ceil(10 / pagination.pageSize)}
                page={pagination.pageIndex + 1}
                onChange={handleMobilePageChange}
                color="primary"
              />
            </Box>
          </Box>
        </>
      ) : (
        // 🔹 DESKTOP VIEW (Table)
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
            manualFiltering
            rowCount={totalRecords}
            state={{
              isLoading: loading,
              pagination: pagination,
              globalFilter,
            }}
            onPaginationChange={handlePaginationChange}
            onGlobalFilterChange={handleGlobalFilterChange}
            enableTopToolbar
            enableColumnFilters={false}
            enableSorting={false}
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
                <Typography variant="h6" className='page-title'>
                  {showApproved ? "Approved Quote List" : "Quote List"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />
                  <MRT_ToolbarInternalButtons table={table} />
                  <Tooltip title="Refresh">
                    <IconButton onClick={handleRefresh} size="small">
                      <IoMdRefresh size={20} />
                    </IconButton>
                  </Tooltip>
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
      </Grid>
      )}
      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>{"Delete this quotation?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => deleteData(deleteRow.id)}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Remark Display Modal */}
      <Dialog
        open={openRemark}
        onClose={() => setOpenRemark(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Customer Remark
        </DialogTitle>

        <DialogContent>
          {/* Customer Name */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Customer: <strong>{remark?.customer?.name || "Unknown Customer"}</strong>
            </Typography>
          </Box>

          {/* Remark Display */}
          {remark?.remark ? (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 1
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
                gutterBottom
              >
                Remark:
              </Typography>
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap' }}
              >
                {remark.remark}
              </Typography>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                border: '1px dashed',
                borderColor: 'grey.300',
                borderRadius: 1,
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No remark provided by customer
              </Typography>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenRemark(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Quote;
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
} from "@mui/material";
import { MdOutlineRemoveRedEye, MdDescription, MdLocalShipping, MdCheckCircle } from "react-icons/md";
import { FaTruck } from "react-icons/fa";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
} from "material-react-table";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

import { useDispatch, useSelector } from "react-redux";
import { deleteBill, fetchBills, markAsDelivered } from "./slice/billsSlice";
import { useAuth } from "../../context/AuthContext";

const Bills = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const { data: bills, loading, totalRecords } = useSelector((state) => state.bill);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  const normalizedBills = Array.isArray(bills) ? bills : [];
  const normalizedTotal = typeof totalRecords === 'number' ? totalRecords : 0;

  const tableKey = `${normalizedBills.length}-${normalizedTotal}-${debouncedSearch}`;

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(globalFilter);
      // Reset to first page when search changes
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [globalFilter]);

  useEffect(() => {
    const params = {
      pageIndex: pagination.pageIndex,
      pageLimit: pagination.pageSize,
      search: debouncedSearch,
    };

    dispatch(fetchBills(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const handleAddBill = () => {
    navigate("/bill/generate-bill");
  };

  const handleEditBill = (id) => {
    navigate(`/bill/edit-bill/${id}`);
  };

  const handleViewBill = (id) => {
    navigate(`/bill/view/${id}`);
  };

  const handleChallan = (id) => {
    navigate(`/bill/challan/${id}`);
  };

  const handleMarkDeliverdBill = async (id) => {
    setMarkingDelivered(id);
    try {
      await dispatch(markAsDelivered(id)).unwrap();

      // Refresh the bills list
      await dispatch(fetchBills({
        pageIndex: pagination.pageIndex,
        pageLimit: pagination.pageSize,
        search: debouncedSearch,
      }));

      // Optional: Show success message
      // successMessage("Bill marked as delivered successfully");
    } catch (error) {
      console.error("Mark as delivered failed:", error);
      // errorMessage("Failed to mark bill as delivered");
    } finally {
      setMarkingDelivered(null);
    }
  };



  const handleDelete = async (id) => {
    try {
      await dispatch(deleteBill(id)).unwrap();
      setOpenDelete(false);

      dispatch(fetchBills({
        pageIndex: pagination.pageIndex,
        pageLimit: pagination.pageSize,
        search: debouncedSearch,
      }));
    } catch (error) {
      console.error("Delete failed:", error);
      setOpenDelete(false);
    }
  };

  const handleSearchToggle = () => {
    if (showSearch && globalFilter) {
      setGlobalFilter("");
    }
    setShowSearch(!showSearch);
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "invoice_no",
        header: "Invoice No",
        size: 120
      },
      {
        accessorKey: "customer_name",
        header: "Customer Name",
        size: 160,
        Cell: ({ row }) => row.original?.customer?.name || "N/A",
      },
      {
        accessorKey: "customer_mobile",
        header: "Mobile",
        size: 120,
        Cell: ({ row }) => row.original?.customer?.mobile || "N/A",
      },
      {
        accessorKey: "date",
        header: "Bill Date",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value) return "N/A";
          try {
            return new Date(value).toLocaleDateString('en-IN');
          } catch {
            return value;
          }
        }
      },
      {
        accessorKey: "grand_total",
        header: "Total",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value) return "₹ 0.00";
          const numValue = Number(value);
          return `₹ ${numValue.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        Cell: ({ row }) => {
          const status = row.original.status;
          let statusText = "Draft";
          let bgColor = "#f5f5f5";
          let textColor = "#666666";

          if (status === 1) {
            statusText = "Not Dispatch";
            bgColor = "#ffe2e2";
            textColor = "#d23434";
          } else if (status === 2) {
            statusText = "Dispatched";
            bgColor = "#fff4e5";
            textColor = "#ff9800";
          } else if (status === 3) {
            statusText = "Delivered";
            bgColor = "#d4f8e8";
            textColor = "#008f5a";
          }

          return (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: bgColor,
                color: textColor,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {statusText}
            </span>
          );
        },
      },
    ];

    if (hasAnyPermission(["bills.update", "bills.delete", "bills.create_challan"])) {
      baseColumns.push(
        {
          id: "actions",
          header: "Actions",
          enableSorting: false,
          enableColumnFilter: false,
          muiTableHeadCellProps: { align: "right" },
          muiTableBodyCellProps: { align: "right" },
          Cell: ({ row }) => (
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              {hasPermission("bills.read") && (
                <Tooltip title="View Bill">
                  <IconButton
                    color="primary"
                    onClick={() => handleViewBill(row.original.id)}
                  >
                    <MdOutlineRemoveRedEye size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {hasPermission("bills.create_challan") && (
                <Tooltip title="Create Challan">
                  <IconButton
                    color="primary"
                    onClick={() => handleChallan(row.original.id)}
                  >
                    <MdDescription size={18} />
                  </IconButton>
                </Tooltip>
              )}
              {hasPermission("bills.mark_delivered") && row.original.status === 2 && (
                <Tooltip title="Mark as Delivered">
                  <IconButton
                    color="success"
                    onClick={() => handleMarkDeliverdBill(row.original.id)}
                    disabled={markingDelivered === row.original.id}
                  >
                    {markingDelivered === row.original.id ? (
                      <CircularProgress size={18} />
                    ) : (
                      <MdLocalShipping size={18} />
                    )}
                  </IconButton>
                </Tooltip>
              )}


              {(row.original.status !== 2 && row.original.status !== 3) && (
                <>
                  {hasPermission("bills.update") && (
                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditBill(row.original.id)}
                      >
                        <BiSolidEditAlt size={16} />
                      </IconButton>
                    </Tooltip>
                  )}

                  {hasPermission("bills.delete") && (
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => {
                          setOpenDelete(true);
                          setDeleteRow(row.original.id);
                        }}
                      >
                        <RiDeleteBinLine size={16} />
                      </IconButton>
                    </Tooltip>
                  )}

                </>
              )}
            </Box>
          ),
        }
      )
    }

    return baseColumns;
    []
  }
  );

  /** Download CSV */
  const downloadCSV = () => {
    if (!normalizedBills || normalizedBills.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Invoice No", "Customer Name", "Mobile", "Bill Date", "Total", "Status"];

    const rows = normalizedBills.map((row) => {
      const customerName = row.customer?.name || "N/A";
      const customerMobile = row.customer?.mobile || "N/A";
      const date = row.date ? new Date(row.date).toLocaleDateString('en-IN') : "N/A";
      const total = row.grand_total ? `₹ ${Number(row.grand_total).toLocaleString("en-IN")}` : "₹ 0.00";
      const status = row.status === 1 ? "Paid" : row.status === 2 ? "Completed" : "Pending";

      return [
        `"${row.invoice_no || ""}"`,
        `"${customerName}"`,
        `"${customerMobile}"`,
        `"${date}"`,
        `"${total}"`,
        `"${status}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Bills_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /** Print */
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
      <Grid container spacing={1}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", backgroundColor: "#fff", px: 2 }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              key={tableKey}
              columns={columns}
              data={normalizedBills}
              manualPagination
              manualFiltering
              rowCount={normalizedTotal}
              state={{
                isLoading: loading,
                showLoadingOverlay: loading,
                pagination: pagination,
                globalFilter: globalFilter,
              }}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setGlobalFilter}
              enableTopToolbar
              enableColumnFilters={false}
              enableSorting={false}
              enablePagination
              enableBottomToolbar
              enableGlobalFilter={false}
              enableDensityToggle={false}
              enableColumnActions={false}
              enableColumnVisibilityToggle={false}
              initialState={{ density: "compact" }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                  minWidth: "1100px",
                },
              }}
              muiTableBodyCellProps={{
                sx: { whiteSpace: "wrap" },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              muiTableBodyRowProps={{
                hover: false,
              }}
              muiTableBodyProps={{
                sx: {
                  '& tr': {
                    display: normalizedBills.length === 0 ? 'none' : 'table-row'
                  }
                }
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
                  <Typography variant="h6" className="page-title">
                    Bills
                    {/* {debouncedSearch && (
                      <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                        (Search: "{debouncedSearch}")
                      </Typography>
                    )} */}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {showSearch && (
                      <TextField
                        inputRef={searchInputRef}
                        size="small"
                        placeholder="Search..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        InputProps={{
                          endAdornment: globalFilter && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setGlobalFilter("")}
                                edge="end"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: 250 }}
                      />
                    )}

                    <Tooltip title={showSearch ? "Close Search" : "Search"}>
                      <IconButton onClick={handleSearchToggle}>
                        <SearchIcon size={20} />
                      </IconButton>
                    </Tooltip>

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

                    {hasPermission("bills.create") && (
                      <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddBill}
                    >
                      Add Bill
                    </Button>
                    )}
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete this bill?</DialogTitle>
        <DialogContent style={{ minWidth: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(deleteRow)}
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

export default Bills;
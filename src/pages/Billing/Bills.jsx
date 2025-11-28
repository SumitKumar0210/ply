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
} from "@mui/material";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";

import { useDispatch, useSelector } from "react-redux";

// You must create these slice actions (similar to productSlice)
import { deleteBill, fetchBills } from "./slice/billsSlice";

const Bills = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  const { data: bills = [], loading, totalRecords = 0 } = useSelector((state) => state.bill);

  console.log(bills);

  const [openBillDialog, setOpenBillDialog] = useState(false);
  const [editBillData, setEditBillData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(globalFilter);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [globalFilter]);

  useEffect(() => {
    if (debouncedSearch) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const params = {
      pageIndex: pagination.pageIndex,
      pageLimit: pagination.pageSize,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

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

  const handleDelete = (id) => {
    dispatch(deleteBill(id));
    setOpenDelete(false);
    // Refresh data after deletion
    dispatch(fetchBills({
      pageIndex: pagination.pageIndex,
      pageLimit: pagination.pageSize,
      search: debouncedSearch || undefined,
    }));
  };

  const columns = useMemo(
    () => [
      { accessorKey: "invoice_no", header: "Invoice No", size: 120 },
      {
        accessorKey: "customer_name",
        header: "Customer Name",
        size: 160,
        Cell: ({ row }) => row.original?.customer?.name ?? "",
      },
      {
        accessorKey: "customer_mobile",
        header: "Mobile",
        size: 120,
        Cell: ({ row }) => row.original?.customer?.mobile ?? "",
      },
      { accessorKey: "date", header: "Bill Date", size: 120 },
      {
        accessorKey: "grand_total",
        header: "Total",
        size: 120,
        Cell: ({ cell }) => {
          const value = Number(cell.getValue()); // convert string → number
          return `₹ ${value.toLocaleString("en-IN")}`;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        Cell: ({ row }) => (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: row.original.status ? "#d4f8e8" : "#ffe2e2",
              color: row.original.status ? "#008f5a" : "#d23434",
              fontSize: 12,
            }}
          >
            {row.original.status ? "Paid" : "Pending"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="view Bill">
              <IconButton
                color="primary"
                onClick={() => handleViewBill(row.original.id)}
              >
                <MdOutlineRemoveRedEye size={16} />
              </IconButton>
            </Tooltip>
            {row.original.status !== 2 && (
              <Tooltip title="Edit">
                <IconButton
                  color="primary"
                  onClick={() => handleEditBill(row.original.id)}
                >
                  <BiSolidEditAlt size={16} />
                </IconButton>
              </Tooltip>
            )}

            {row.original.status !== 2 && (
              <Tooltip title="Delete">
                <IconButton
                  color="error"
                  onClick={() => {
                    setOpenDelete(true), setDeleteRow(row.original.id);
                  }}
                >
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    []
  );

  /** Download CSV */
  const downloadCSV = () => {
    const headers = columns.filter((c) => c.accessorKey).map((c) => c.header);

    const rows = bills.map((row) =>
      columns
        .filter((c) => c.accessorKey)
        .map((c) => `"${row[c.accessorKey] ?? ""}"`)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Bills.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
              columns={columns}
              data={bills}
              manualPagination
              rowCount={totalRecords}
              state={{
                isLoading: loading,
                showLoadingOverlay: loading,
                pagination: pagination,
                globalFilter,
              }}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setGlobalFilter}
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
                    Bills
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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

                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddBill}
                    >
                      Add Bill
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>
      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>{"Delete this bill?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
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
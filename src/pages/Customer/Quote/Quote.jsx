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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { AiOutlineLink, AiOutlineCheck } from "react-icons/ai";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { TextField } from "@mui/material";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { fetchQuotation, deleteQuotation } from "../slice/quotationSlice";
import { useDispatch, useSelector } from "react-redux";
import LinkGenerator from "../../../components/Links/LinkGenerator";

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
    case 2:
      return <Chip label="Production" color="success" size="small" />;
    case 1:
      return <Chip label="Ordered" color="info" size="small" />;
    default:
      return <Chip label="Unknown" size="small" />;
  }
};

const Quote = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const tableContainerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    data: tableData = [],
    loading,
    error,
    totalRecords = 0,
  } = useSelector((state) => state.quotation);

  useEffect(() => {
    dispatch(
      fetchQuotation({
        pageIndex: pagination.pageIndex,
        pageLimit: pagination.pageSize,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize]);

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
    dispatch(
      fetchQuotation({
        pageIndex: pagination.pageIndex,
        pageLimit: pagination.pageSize,
      })
    );
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

  //  Table columns
  const columns = useMemo(
    () => [
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
        Cell: ({ row }) => getStatusChip(row.original?.status),
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
            {/* <Tooltip title="Approve">
              <IconButton
                color="success"
                onClick={() => handleApproveClick(row.original.id)}
              >
                <TaskAltIcon fontSize="small" />
              </IconButton>
            </Tooltip> */}

            {/* Render modal outside the button */}
            <LinkGenerator id={row.original.id} />
            <Tooltip title="View">
              <IconButton
                color="warning"
                onClick={() => handleViewClick(row.original.id)}
              >
                <MdOutlineRemoveRedEye size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => handleEditClick(row.original.id)}
              >
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                aria-label="delete"
                color="error"
                onClick={() => handlDelete(row.original)}
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
    link.setAttribute("download", "Quote.csv");
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
          <Typography variant="h6">Quotation</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/customer/quote/create"
          >
            Create Quote
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
            manualPagination
            rowCount={totalRecords}
            state={{
              isLoading: loading,
              pagination: pagination,
            }}
            onPaginationChange={setPagination}
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
                  Quote List
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
        <DialogTitle>{"Delete this purchase order?"}</DialogTitle>
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
    </>
  );
};

export default Quote;

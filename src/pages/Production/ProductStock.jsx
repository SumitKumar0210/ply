import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogContentText,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  TextField,
  Pagination,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Skeleton
} from "@mui/material";
import CustomSwitch from "../../components/CustomSwitch/CustomSwitch";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import SearchIcon from "@mui/icons-material/Search";
import { HiOutlineReceiptTax } from "react-icons/hi";
import { BsTelephone } from "react-icons/bs";
import { MdAlternateEmail } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsWithSearch, deleteProduct, statusUpdate, discardStock } from "../settings/slices/productSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import Profile from "../../assets/images/profile.jpg";
import ProductFormDialog from "../../components/Product/ProductFormDialog";
import DiscardStockDialog from "../../components/Product/DiscardStockDialog";
import { useAuth } from "../../context/AuthContext";
import { MdOutlineQrCode2, MdStraighten, MdDeleteSweep } from "react-icons/md";

const ProductStocks = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { searchData: data = [], loading } = useSelector((state) => state.product);
  console.log(data);

  const tableContainerRef = useRef(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [editProductData, setEditProductData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDiscard, setOpenDiscard] = useState(false);
  const [discardRow, setDiscardRow] = useState(null);
  const [mobileSearchFilter, setMobileSearchFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    dispatch(fetchProductsWithSearch());
  }, [dispatch]);

  const handleAddProduct = () => {
    setEditProductData(null);
    setOpenProductDialog(true);
  };

  const handleEditProduct = (row) => {
    setEditProductData(row);
    setOpenProductDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenProductDialog(false);
    setEditProductData(null);
  };

  // Delete
  const handleDelete = async (id) => {
    setIsDeleting(true);
    await dispatch(deleteProduct(id));
    setIsDeleting(false);
    setOpenDelete(false);
    setDeleteRow(null);
  };

  const handleDiscardSubmit = async (payload) => {
    const res = await dispatch(discardStock(payload));
    if (res.error) return;
    setOpenDiscard(false);
    setDiscardRow(null);
    dispatch(fetchProductsWithSearch());
  };

  const canUpdate = useMemo(() => hasPermission("product.update"), [hasPermission]);

  // Handle mobile search change
  const handleMobileSearchChange = (value) => {
    setMobileSearchFilter(value);
  };

  // Mobile pagination handlers
  const handleMobilePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  };

  // Filter data based on mobile search
  const filteredData = useMemo(() => {
    if (!mobileSearchFilter) return data;
    
    const searchLower = mobileSearchFilter.toLowerCase();
    return data.filter((product) => 
      product.name?.toLowerCase().includes(searchLower) ||
      product.model?.toLowerCase().includes(searchLower) ||
      product.size?.toLowerCase().includes(searchLower) ||
      product.product_type?.toLowerCase().includes(searchLower)
    );
  }, [data, mobileSearchFilter]);

  // Paginate filtered data for mobile
  const paginatedData = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "image",
        header: "Image",
        size: 80,
        Cell: ({ row }) => (
          <ImagePreviewDialog
            imageUrl={row.original.image ? mediaUrl + row.original.image : Profile}
            alt={row.original.name}
          />
        ),
      },
      { accessorKey: "name", header: "Name", size: 150 },
      { accessorKey: "model", header: "Model", size: 120 },
      { accessorKey: "size", header: "Size", size: 100 },
      { accessorKey: "product_type", header: "Product Type", size: 150 },
      { accessorKey: "available_qty", header: "Available Qty", size: 150 },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width={80} />;

          return (
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              {hasPermission("product.update") && (
                <Tooltip title="Edit">
                  <IconButton 
                    color="primary"
                    onClick={() => handleEditProduct(row.original)}
                  >
                    <BiSolidEditAlt size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {hasPermission("product.delete") && (
                <Tooltip title="Delete">
                  <IconButton 
                    color="error"
                    onClick={() => {
                      setDeleteRow(row.original);
                      setOpenDelete(true);
                    }}
                    >
                    <RiDeleteBinLine size={16} />
                  </IconButton>
                </Tooltip>
              )}
              {hasPermission("discarded_product.update") && (
              <Tooltip title="Discard Stock">
                <IconButton
                  color="warning"
                  onClick={() => {
                    setDiscardRow(row.original);
                    setOpenDiscard(true);
                  }}
                >
                  <MdDeleteSweep size={16} />
                </IconButton>
              </Tooltip>
              )}
            </Box>
          );
        },
      },
    ];

    return baseColumns;
  }, [
    loading,
    mediaUrl,
    hasPermission,
    Profile,
    handleEditProduct,
  ]);

  // Function to download CSV from data
  const downloadCSV = () => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);
    const rows = data.map((row) =>
      columns
        .filter((col) => col.accessorKey)
        .map((col) => `"${row[col.accessorKey] ?? ""}"`)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Product_Stocks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print handler
  const handlePrint = () => {
    if (!tableContainerRef.current) return;

    const printWindow = window.open('', '_blank');
    const tableHTML = tableContainerRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Product Stocks</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              button, .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>Product Stocks</h2>
          ${tableHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6" className="page-title">
            Product Stocks
          </Typography>
        </Grid>
        <Grid item>
          {hasPermission('product.create') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
              sx={{ mt: 0 }}
            >
              Add Product
            </Button>
          )}
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
                placeholder="Search products..."
                value={mobileSearchFilter}
                onChange={(e) => handleMobileSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Paper>

            {/* Loading State */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : paginatedData.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No products found
                </Typography>
              </Paper>
            ) : (
              paginatedData.map((product) => (
                <Card key={product.id} sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2 }}>
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
                        <Typography variant="h6" sx={{ fontWeight: 500, color: "white", mb: 0.5 }}>
                          {product.name || "N/A"}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                          {product.product_type && (
                            <Chip
                              label={product.product_type}
                              size="small"
                              sx={{
                                bgcolor: "white",
                                color: "primary.main",
                                fontWeight: 500,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                          <Chip
                            label={`Qty: ${product.available_qty || 0}`}
                            size="small"
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              bgcolor: product.available_qty > 0 ? "success.light" : "error.light",
                              color: product.available_qty > 0 ? "success.contrastText" : "error.contrastText"
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Body Section */}
                  <CardContent sx={{ px: 1.5 }}>
                    {/* Details Grid */}
                    <Grid container spacing={0} sx={{ mb: 0 }}>
                      <Grid size={12}>
                        {/* Products Section */}
                        <Box sx={{ mt: 0 }}>
                          {/* Single Product Item */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1.5,
                            }}
                          >
                            {/* Product Image */}
                            <Box
                              component="img"
                              src={product.image ? mediaUrl + product.image : Profile}
                              alt={product.name}
                              sx={{
                                width: 46,
                                height: 46,
                                borderRadius: 1,
                                objectFit: "cover",
                                border: "1px solid #eee",
                              }}
                            />
                            {/* Product Details */}
                            <Box sx={{ flex: 1 }}>
                              {/* Model */}
                              {product.model && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                  <MdOutlineQrCode2 size={14} color="#666" />
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, lineHeight: 1.2 }}
                                  >
                                    {product.model}
                                  </Typography>
                                </Box>
                              )}

                              {/* Size / Dimension */}
                              {product.size && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.5 }}>
                                  <MdStraighten size={14} color="#666" />
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    {product.size}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Action Buttons */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
                      {hasPermission("product.update") && (
                        <IconButton
                          size="medium"
                          onClick={() => handleEditProduct(product)}
                          sx={{
                            bgcolor: "#e3f2fd",
                            color: "#1976d2",
                            "&:hover": { bgcolor: "#bbdefb" },
                          }}
                        >
                          <BiSolidEditAlt size={20} />
                        </IconButton>
                      )}
                      {hasPermission("product.delete") && (
                        <IconButton
                          size="medium"
                          onClick={() => {
                            setDeleteRow(product);
                            setOpenDelete(true);
                          }}
                          sx={{
                            bgcolor: "#ffebee",
                            color: "#d32f2f",
                            "&:hover": { bgcolor: "#ffcdd2" },
                          }}
                        >
                          <RiDeleteBinLine size={20} />
                        </IconButton>
                      )}
                      <IconButton
                        size="medium"
                        onClick={() => {
                          setDiscardRow(product);
                          setOpenDiscard(true);
                        }}
                        sx={{
                          bgcolor: "#fff3e0",
                          color: "#f57c00",
                          "&:hover": { bgcolor: "#ffe0b2" },
                        }}
                      >
                        <MdDeleteSweep size={20} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Mobile Pagination */}
            {!loading && filteredData.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3, pb: 3 }}>
                <Pagination
                  count={Math.ceil(filteredData.length / pagination.pageSize)}
                  page={pagination.pageIndex + 1}
                  onChange={handleMobilePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        </>
      ) : (
        // 🔹 DESKTOP VIEW (Table)
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff", px: 3 }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={data}
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
              state={{ isLoading: loading }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                },
              }}
              muiTableBodyCellProps={{
                sx: { whiteSpace: "wrap", width: "100px" },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              muiTableBodyRowProps={() => ({
                hover: false,
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
                    Product Stocks
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
      )}

      {/* Product Form Dialog - Handles both Add and Edit */}
      <ProductFormDialog
        open={openProductDialog}
        onClose={handleCloseDialog}
        editData={editProductData}
      />

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)}>
        <DialogTitle>{"Delete this Product?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteRow?.id)}
            variant="contained"
            color="error"
            autoFocus
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discard Stock Dialog */}
      {discardRow && (
        <DiscardStockDialog
          open={openDiscard}
          onClose={() => {
            setOpenDiscard(false);
            setDiscardRow(null);
          }}
          product={discardRow}
          onSubmit={handleDiscardSubmit}
        />
      )}
    </>
  );
};

export default ProductStocks;
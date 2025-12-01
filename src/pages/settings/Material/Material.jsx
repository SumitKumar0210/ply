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
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Skeleton,
  CircularProgress,
} from "@mui/material";
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
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMaterials,
  deleteMaterial,
  statusUpdate,
} from "../slices/materialSlice";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
import MaterialFormModal from "../../../components/Material/MaterialFormModal";
import Profile from "../../../assets/images/profile.jpg";

const Material = () => {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();

  const { data: data = [], loading } = useSelector((state) => state.material);

  const tableContainerRef = useRef(null);
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [editMaterialData, setEditMaterialData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Note: Material form modal handles its own saving state internally

  useEffect(() => {
    dispatch(fetchMaterials());
  }, [dispatch]);

  const handleAddMaterial = () => {
    setEditMaterialData(null);
    setOpenMaterialDialog(true);
  };

  const handleEditMaterial = (row) => {
    setEditMaterialData(row);
    setOpenMaterialDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenMaterialDialog(false);
    setEditMaterialData(null);
  };

  const handleDeleteClick = (row) => {
    setDeleteData(row);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    await dispatch(deleteMaterial(id));
    setIsDeleting(false);
    setOpenDelete(false);
    setDeleteData(null);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        size: 80,
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="rectangular" width={40} height={40} />;

          return (
            <ImagePreviewDialog
              imageUrl={
                row.original.image ? mediaUrl + row.original.image : Profile
              }
              alt={row.original.name}
            />
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="80%" /> : cell.getValue(),
      },
      {
        accessorKey: "unit_of_measurement_id",
        header: "UOM",
        size: 50,
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width="60%" />;
          return row.original.unit_of_measurement?.name || "—";
        },
      },
      {
        accessorKey: "size",
        header: "Size",
        size: 50,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="50%" /> : cell.getValue(),
      },
      {
        accessorKey: "price",
        header: "Price",
        size: 75,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="60%" /> : cell.getValue(),
      },
      {
        accessorKey: "category_id",
        header: "Category",
        size: 100,
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width="70%" />;
          return row.original.category?.name || "—";
        },
      },
      {
        accessorKey: "group_id",
        header: "Group",
        size: 100,
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width="70%" />;
          return row.original.group?.name || "—";
        },
      },
      {
        accessorKey: "opening_stock",
        header: "Opening Stock",
        size: 50,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="50%" /> : cell.getValue(),
      },
      {
        accessorKey: "urgently_required",
        header: "Reorder Needed",
        size: 100,
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width="50%" />;
          const value = row.original.urgently_required;
          return value == "1" ? "Yes" : value == "0" ? "No" : "—";
        },
      },
      {
        accessorKey: "tag",
        header: "Tag",
        size: 50,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="60%" /> : cell.getValue(),
      },
      {
        accessorKey: "remark",
        header: "Remarks",
        size: 100,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="70%" /> : cell.getValue(),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="circular" width={40} height={20} />;

          return (
            <CustomSwitch
              checked={!!row.original.status}
              onChange={(e) => {
                const newStatus = e.target.checked ? 1 : 0;
                dispatch(statusUpdate({ ...row.original, status: newStatus }));
              }}
            />
          );
        },
      },
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
              <Tooltip title="Edit">
                <IconButton
                  color="primary"
                  onClick={() => handleEditMaterial(row.original)}
                >
                  <BiSolidEditAlt size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  color="error"
                  onClick={() => handleDeleteClick(row.original)}
                >
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [dispatch, mediaUrl, loading]
  );

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
    link.setAttribute("download", "Material_data.csv");
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

  return (
    <>
      <Grid container spacing={1}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff" }}
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
              state={{
                isLoading: loading,
                showLoadingOverlay: loading,
              }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                  minWidth: "1200px",
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
                    Material
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
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddMaterial}
                    >
                      Add Material
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Material Form Dialog - Handles both Add and Edit */}
      <MaterialFormModal
        open={openMaterialDialog}
        onClose={handleCloseDialog}
        editData={editMaterialData}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)}>
        <DialogTitle>{"Delete this material?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={() => handleConfirmDelete(deleteData?.id)}
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
    </>
  );
};

export default Material;
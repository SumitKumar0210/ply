import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  Tooltip,
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

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      dispatch(deleteMaterial(id));
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        size: 80,
        Cell: ({ row }) => (
          <ImagePreviewDialog
            imageUrl={
              row.original.image ? mediaUrl + row.original.image : Profile
            }
            alt={row.original.name}
          />
        ),
      },
      { accessorKey: "name", header: "Name", size: 200 },
      {
        accessorKey: "unit_of_measurement_id",
        header: "UOM",
        size: 50,
        Cell: ({ row }) => row.original.unit_of_measurement?.name || "—",
      },
      { accessorKey: "size", header: "Size", size: 50 },
      { accessorKey: "price", header: "Price", size: 75 },
      {
        accessorKey: "category_id",
        header: "Category",
        size: 100,
        Cell: ({ row }) => row.original.category?.name || "—",
      },
      {
        accessorKey: "group_id",
        header: "Group",
        size: 100,
        Cell: ({ row }) => row.original.group?.name || "—",
      },
      { accessorKey: "opening_stock", header: "Opening Stock", size: 50 },
      {
        accessorKey: "urgently_required",
        header: "Urgent",
        size: 100,
        Cell: ({ row }) => {
          const value = row.original.urgently_required;
          return value == "1" ? "Yes" : value == "0" ? "No" : "—";
        },
      },
      { accessorKey: "tag", header: "Tag", size: 50 },
      { accessorKey: "remark", header: "Remarks", size: 100 },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => {
              const newStatus = e.target.checked ? 1 : 0;
              dispatch(statusUpdate({ ...row.original, status: newStatus }));
            }}
          />
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
                onClick={() => handleDelete(row.original.id)}
              >
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [dispatch, mediaUrl]
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
              state={{ isLoading: loading }}
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
                  <Typography variant="h6" fontWeight={400}>
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
    </>
  );
};

export default Material;
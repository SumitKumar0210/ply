import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Typography,
    Grid,
    Paper,
    Box,
    Button,
    IconButton,
    TextField,
    Tooltip,
    DialogContentText,
    Skeleton,
    CircularProgress,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
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
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";

import {
    fetchTaxSlabs,
    addTaxSlab,
    updateTaxSlab,
    deleteTaxSlab,
    statusUpdate
} from "../slices/taxSlabSlice";
import { useDispatch, useSelector } from "react-redux";

// Error Boundary
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 3, textAlign: "center", color: "red" }}>
                    <Typography variant="h6">Something went wrong.</Typography>
                    <Typography variant="body2">{this.state.error?.message}</Typography>
                </Box>
            );
        }
        return this.props.children;
    }
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialogContent-root": { padding: theme.spacing(2) },
    "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

const TaxSlab = () => {
    const dispatch = useDispatch();
    
    const { data: tableData, total: totalRows, loading } = useSelector((state) => state.taxSlab);

    // Validation Schema
    const validationSchema = Yup.object({
        percentage: Yup.number()
            .moreThan(0, "Percentage must be greater than 0")
            .max(100, "Percentage cannot be more than 100")
            .required("Percentage is required"),
    });

    const tableContainerRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    //  Search + Debounce
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 1000);

        return () => clearTimeout(timer);
    }, [search]);

    // Fetch data
    useEffect(() => {
        dispatch(fetchTaxSlabs({
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            query: debouncedSearch
        }));
    }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

    const handleAdd = async (values, resetForm) => {
        setIsSaving(true);
        const res = await dispatch(addTaxSlab(values));
        setIsSaving(false);
        if (res.error) return;

        setPagination(prev => ({ ...prev, pageIndex: 0 }));
        await dispatch(fetchTaxSlabs({ page: 1, per_page: pagination.pageSize, query: debouncedSearch }));

        resetForm();
        setOpen(false);
    };

    const handleDeleteClick = (row) => {
        setDeleteData(row);
        setOpenDelete(true);
    };

    const handleConfirmDelete = async (id) => {
        setIsDeleting(true);
        const res = await dispatch(deleteTaxSlab(id));
        setIsDeleting(false);

        if (res.error) {
            setOpenDelete(false);
            setDeleteData(null);
            return;
        }

        const itemsOnCurrentPage = tableData.length;
        if (itemsOnCurrentPage === 1 && pagination.pageIndex > 0) {
            setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
        } else {
            await dispatch(fetchTaxSlabs({
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                query: debouncedSearch
            }));
        }

        setOpenDelete(false);
        setDeleteData(null);
    };

    const handleUpdate = (row) => {
        setEditData(row);
        setEditOpen(true);
    };

    const handleEditSubmit = async (values, resetForm) => {
        setIsSaving(true);
        const res = await dispatch(updateTaxSlab({ id: editData.id, ...values }));
        setIsSaving(false);
        if (res.error) return;

        await dispatch(fetchTaxSlabs({
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            query: debouncedSearch
        }));

        resetForm();
        setEditOpen(false);
    };

    const handleStatusChange = async (row, newStatus) => {
        const res = await dispatch(statusUpdate({ ...row, status: newStatus }));
        if (res.error) return;

        await dispatch(fetchTaxSlabs({
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            query: debouncedSearch
        }));
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "percentage",
                header: "Percentage (%)",
                Cell: ({ cell }) => loading ? <Skeleton variant="text" width="60%" /> : cell.getValue(),
            },
            {
                accessorKey: "status",
                header: "Status",
                Cell: ({ row }) => {
                    if (loading) return <Skeleton variant="circular" width={40} height={20} />;

                    return (
                        <CustomSwitch
                            checked={!!row.original.status}
                            onChange={(e) => {
                                const newStatus = e.target.checked ? 1 : 0;
                                handleStatusChange(row.original, newStatus);
                            }}
                        />
                    );
                },
            },
            {
                id: "actions",
                header: "Actions",
                muiTableHeadCellProps: { align: "right" },
                muiTableBodyCellProps: { align: "right" },
                Cell: ({ row }) => {
                    if (loading) return <Skeleton variant="text" width={80} />;

                    return (
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Tooltip title="Edit">
                                <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                                    <BiSolidEditAlt size={16} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                                    <RiDeleteBinLine size={16} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    );
                },
            },
        ],
        [loading]
    );

    const getRowId = (originalRow) => originalRow.id;

    const downloadCSV = () => {
        if (!tableData.length) return;
        const headers = columns.filter(col => col.accessorKey).map(col => col.header);
        const rows = tableData.map(row =>
            columns
                .filter(col => col.accessorKey)
                .map(col => `"${row[col.accessorKey] ?? ""}"`)
                .join(",")
        );

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "tax_slab_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        if (!tableContainerRef.current) return;
        const printContents = tableContainerRef.current.innerHTML;
        const win = window.open("", "", "width=900,height=650");
        win.document.write(printContents);
        win.document.close();
        win.print();
    };

    return (
        <ErrorBoundary>
            <Grid container spacing={2}>
                <Grid size={12}>
                    <Paper elevation={0} sx={{ width: "100%", overflow: "hidden" }} ref={tableContainerRef}>
                        <MaterialReactTable
                            columns={columns}
                            data={tableData}
                            getRowId={getRowId}
                            manualPagination
                            rowCount={totalRows}
                            state={{
                                pagination,
                                isLoading: loading,
                                showLoadingOverlay: loading,
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
                            renderTopToolbar={({ table }) => (
                                <Box sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
                                    <Typography variant="h6" fontWeight={400}>Tax Slab</Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <MRT_GlobalFilterTextField
                                            table={table}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search..."
                                        />

                                        <MRT_ToolbarInternalButtons table={table} />

                                        <Tooltip title="Print">
                                            <IconButton onClick={handlePrint}><FiPrinter size={20} /></IconButton>
                                        </Tooltip>

                                        <Tooltip title="Download CSV">
                                            <IconButton onClick={downloadCSV}><BsCloudDownload size={20} /></IconButton>
                                        </Tooltip>

                                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                                            Add Tax Slab
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Add Modal */}
            <BootstrapDialog onClose={() => setOpen(false)} open={open} fullWidth maxWidth="xs">
                <DialogTitle>Add Tax Slab</DialogTitle>
                <IconButton aria-label="close" onClick={() => setOpen(false)}
                    sx={{ position: "absolute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>

                <Formik
                    initialValues={{ percentage: "" }}
                    validationSchema={validationSchema}
                    onSubmit={(values, { resetForm }) => handleAdd(values, resetForm)}
                >
                    {({ values, errors, touched, handleChange }) => (
                        <Form>
                            <DialogContent dividers>
                                <TextField
                                    fullWidth
                                    id="percentage"
                                    name="percentage"
                                    type="number"
                                    label="Percentage"
                                    variant="standard"
                                    value={values.percentage}
                                    onChange={handleChange}
                                    error={touched.percentage && Boolean(errors.percentage)}
                                    helperText={touched.percentage && errors.percentage}
                                    sx={{ mb: 2 }}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button color="error" onClick={() => setOpen(false)} disabled={isSaving}>Close</Button>
                                <Button type="submit" variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}>
                                    {isSaving ? "Saving..." : "Submit"}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </BootstrapDialog>

            {/* Edit Modal */}
            <BootstrapDialog onClose={() => setEditOpen(false)} open={editOpen} fullWidth maxWidth="xs">
                <DialogTitle>Edit Tax Slab</DialogTitle>
                <IconButton aria-label="close" onClick={() => setEditOpen(false)}
                    sx={{ position: "absolute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>

                <Formik
                    key={editData?.id}
                    initialValues={{ percentage: editData?.percentage || "" }}
                    validationSchema={validationSchema}
                    onSubmit={(values, { resetForm }) => handleEditSubmit(values, resetForm)}
                    enableReinitialize
                >
                    {({ values, errors, touched, handleChange }) => (
                        <Form>
                            <DialogContent dividers>
                                <TextField
                                    fullWidth
                                    id="percentage"
                                    name="percentage"
                                    type="number"
                                    label="Percentage"
                                    variant="standard"
                                    value={values.percentage}
                                    onChange={handleChange}
                                    error={touched.percentage && Boolean(errors.percentage)}
                                    helperText={touched.percentage && errors.percentage}
                                    sx={{ mb: 2 }}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button color="error" onClick={() => setEditOpen(false)} disabled={isSaving}>Close</Button>
                                <Button type="submit" variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </BootstrapDialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)}>
                <DialogTitle>{"Delete this tax slab?"}</DialogTitle>
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
        </ErrorBoundary>
    );
};

export default TaxSlab;
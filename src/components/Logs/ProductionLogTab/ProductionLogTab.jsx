import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    TextField,
    Button,
    Paper,
    Chip,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    CircularProgress,
    Typography,
    InputAdornment,
    Skeleton,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { getProductionLog } from "../../../pages/Logs/slice/logSlice";

const ProductionLogTab = () => {
    const dispatch = useDispatch();
    const { data, loading, totalRecords } = useSelector((state) => state.log);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: null,
        endDate: null,
        page: 0,
        rowsPerPage: 10,
    });

    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = () => {
        const payload = {
            search: filters.search || undefined,
            status: filters.status || undefined,
            start_date: filters.startDate ? dayjs(filters.startDate).format('YYYY-MM-DD') : undefined,
            end_date: filters.endDate ? dayjs(filters.endDate).format('YYYY-MM-DD') : undefined,
            page: filters.page + 1,
            per_page: filters.rowsPerPage,
        };

        dispatch(getProductionLog(payload));
    };

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, search: searchText, page: 0 }));
    };

    const handleReset = () => {
        setSearchText('');
        setFilters({
            search: '',
            status: '',
            startDate: null,
            endDate: null,
            page: 0,
            rowsPerPage: 10,
        });
    };

    const handleChangePage = (event, newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleChangeRowsPerPage = (event) => {
        setFilters(prev => ({ 
            ...prev, 
            rowsPerPage: parseInt(event.target.value, 10), 
            page: 0 
        }));
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            0: { color: 'default', label: 'Pending' },
            1: { color: 'info', label: 'In Progress' },
            2: { color: 'success', label: 'Completed' },
            3: { color: 'error', label: 'Cancelled' },
        };

        const config = statusConfig[status] || { color: 'default', label: 'Unknown' };
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    const getFromStage = (log) => {
        if (log.from_stage?.name) {
            return log.from_stage.name;
        }
        return log.status === 0 ? "Order Created" : "N/A";
    };

    const getToStage = (log) => {
        if (log.to_stage?.name) {
            return log.to_stage.name;
        }
        if (log.status === 0) {
            return "In Production";
        }
        if (log.status === 2) {
            return "Out from Production";
        }
        return "N/A";
    };

    const SkeletonRow = () => (
        <TableRow>
            <TableCell><Skeleton variant="text" width={40} /></TableCell>
            <TableCell><Skeleton variant="text" width={100} /></TableCell>
            <TableCell><Skeleton variant="text" width={120} /></TableCell>
            <TableCell><Skeleton variant="text" width={100} /></TableCell>
            <TableCell><Skeleton variant="text" width={100} /></TableCell>
            <TableCell><Skeleton variant="text" width={80} /></TableCell>
            <TableCell><Skeleton variant="text" width={150} /></TableCell>
            <TableCell><Skeleton variant="text" width={120} /></TableCell>
        </TableRow>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                {/* Filters Section */}
                <Paper elevation={0} sx={{ p: 2, mb: 0, bgcolor: 'grey.50' }}>
                    <Stack spacing={2}>
                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            flexWrap="nowrap"
                        >
                            <TextField
                                size="small"
                                placeholder="Search by ID, PO ID, Product..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                sx={{ width: 320 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <DatePicker
                                label="Start Date"
                                value={filters.startDate}
                                onChange={(date) =>
                                    setFilters(prev => ({ ...prev, startDate: date, page: 0 }))
                                }
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { width: 160 },
                                    },
                                }}
                            />

                            <DatePicker
                                label="End Date"
                                value={filters.endDate}
                                onChange={(date) =>
                                    setFilters(prev => ({ ...prev, endDate: date, page: 0 }))
                                }
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { width: 160 },
                                    },
                                }}
                            />

                            <Button
                                variant="contained"
                                startIcon={<SearchIcon />}
                                sx={{ whiteSpace: "nowrap" }}
                                onClick={handleSearch}
                            >
                                Search
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                sx={{ whiteSpace: "nowrap" }}
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Table Section */}
                <TableContainer component={Paper} sx={{ px: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>PO ID</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Product ID</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>From Stage</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>To Stage</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Action By</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Remark</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from(new Array(filters.rowsPerPage)).map((_, index) => (
                                    <SkeletonRow key={index} />
                                ))
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No data found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.id}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {row.order?.batch_no || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {row.production_product?.item_name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {getFromStage(row)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {getToStage(row)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {row.user?.name || row.action_by || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={row.remark || ''}
                                            >
                                                {row.remark || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {row.created_at
                                                ? dayjs(row.created_at).format('DD MMM YYYY, HH:mm')
                                                : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        component="div"
                        count={totalRecords}
                        page={filters.page}
                        onPageChange={handleChangePage}
                        rowsPerPage={filters.rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[10, 20, 50, 100]}
                    />
                </TableContainer>
            </Box>
        </LocalizationProvider>
    );
};

export default ProductionLogTab;
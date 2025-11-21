import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
    Container, Card, CardContent, Chip, Typography, Box, Grid,
    useTheme, useMediaQuery, IconButton, Tooltip, AvatarGroup, Avatar,
    Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions,
    TextareaAutosize, Button, Menu, MenuItem, Divider, Drawer, TextField,
    Checkbox, Autocomplete, Radio, Skeleton,
} from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Link } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { FiMoreVertical } from "react-icons/fi";
import CloseIcon from "@mui/icons-material/Close";
import { ImAttachment } from "react-icons/im";
import Profile from "../../assets/images/profile.jpg";
import { styled } from "@mui/material/styles";
import MessageTimeline from "../../components/TimelineHistory/Timeline";
import { AiOutlineFilePdf } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import NavigationMenu from "../../components/Production/Navigation";
import DepartmentFormDialog from "../../components/Department/DepartmentFormDialog";
import { addDepartment, fetchActiveDepartments } from "../settings/slices/departmentSlice";
import { fetchBatchProduct } from "./slice/productionChainSlice";
import { fetchActiveSupervisor } from "../Users/slices/userSlice";
import { fetchActiveMaterials } from "../settings/slices/materialSlice";
import { fetchActiveLabours } from "../Users/slices/labourSlice";
import { storeMaterialRequest } from "./slice/materialRequestSlice";
// ---------- Styled Dialog ----------
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialogContent-root": { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
    "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

function BootstrapDialogTitle({ children, onClose, ...other }) {
    return (
        <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
            {children}
            {onClose && (
                <IconButton aria-label="close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
                    <CloseIcon />
                </IconButton>
            )}
        </DialogTitle>
    );
}

const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
});

// ---------- Reusable hook for submenu ----------
function useSubmenu() {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const openAt = useCallback((target) => setAnchorEl(target), []);
    const close = useCallback(() => setAnchorEl(null), []);
    return { anchorEl, open, openAt, close, setAnchorEl };
}

// ---------- Smaller components (memoized) ----------
const SwitchSubmenu = React.memo(function SwitchSubmenu({ submenu, onSelect, departments, currentDepartment }) {
    const options = useMemo(() => {
        return departments?.filter((d) => d.id !== currentDepartment).map((d) => d.name) || [];
    }, [departments, currentDepartment]);

    return (
        <Menu
            anchorEl={submenu.anchorEl}
            open={submenu.open}
            onClose={submenu.close}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableAutoFocusItem
            MenuListProps={{ onClick: (e) => e.stopPropagation() }}
            sx={{ zIndex: 1400, marginLeft: "2px" }}>
            {options.map((opt) => (
                <MenuItem key={opt} onClick={() => { onSelect(opt); setTimeout(() => submenu.close(), 80); }}>
                    {opt}
                </MenuItem>
            ))}
        </Menu>
    );
});

const SupervisorSubmenu = React.memo(function SupervisorSubmenu({ submenu, supervisors, selected, toggle }) {
    return (
        <Menu
            anchorEl={submenu.anchorEl}
            open={submenu.open}
            onClose={submenu.close}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableAutoFocusItem
            MenuListProps={{ onClick: (e) => e.stopPropagation() }}
            sx={{ zIndex: 1400, marginLeft: "2px" }}
        >
            {supervisors.map((s) => (
                <MenuItem key={s} disableRipple onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={selected.includes(s)}
                        onChange={() => { toggle(s); setTimeout(() => submenu.close(), 90); }}
                        inputProps={{ "aria-label": `${s}-checkbox` }}
                        sx={{ padding: 0, paddingRight: 1 }}
                    />
                    {s}
                </MenuItem>
            ))}
        </Menu>
    );
});

const PrioritySubmenu = React.memo(function PrioritySubmenu({ submenu, value, setValue }) {
    const levels = useMemo(() => ["High", "Medium", "Low"], []);
    return (
        <Menu
            anchorEl={submenu.anchorEl}
            open={submenu.open}
            onClose={submenu.close}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableAutoFocusItem
            MenuListProps={{ onClick: (e) => e.stopPropagation() }}
            sx={{ zIndex: 1400, marginLeft: "2px" }}
        >
            {levels.map((lvl) => (
                <MenuItem key={lvl} disableRipple onClick={(e) => e.stopPropagation()}>
                    <Radio
                        checked={value === lvl}
                        onChange={() => { setValue(lvl); setTimeout(() => submenu.close(), 100); }}
                        inputProps={{ "aria-label": `${lvl}-radio` }}
                        sx={{ padding: 0, paddingRight: 1 }}
                    />
                    {lvl}
                </MenuItem>
            ))}
        </Menu>
    );
});

// ---------- Main optimized component ----------
export default function Production() {
    const dispatch = useDispatch();
    const { activeBatch } = useSelector((state) => state.productionChain);
    const { data: departments = [] } = useSelector((state) => state.department);
    const { batchProduct: batchProductsData = [], loading } = useSelector((state) => state.productionChain);
    const { supervisor: supervisorData = [] } = useSelector((state) => state.user);
    const { data: materialData = [], loading: materialLoading } = useSelector((state) => state.material);
    const { activeLabours: labourData = [], loading: labourLoading } = useSelector((state) => state.labour);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    // UI States
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [openAdd, setOpenAdd] = useState(false);
    const [open, setOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState({ type: null, index: null });

    // Menu states
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const openMenu = useCallback((e) => setAnchorEl(e.currentTarget), []);
    const closeMenu = useCallback(() => setAnchorEl(null), []);

    // Submenus
    const switchSub = useSubmenu();
    const supSub = useSubmenu();
    const prioSub = useSubmenu();

    // Data & selections
    const supervisors = useMemo(() => ["Satyam", "Amit", "Vikash", "Pawan"], []);
    const [selectedSupervisors, setSelectedSupervisors] = useState(["Satyam"]);
    const [priority, setPriority] = useState("High");

    // ========== REQUEST STOCK STATES ==========
    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [stockQty, setStockQty] = useState("");
    const [stockItems, setStockItems] = useState([]);

    // ========== LOG TIME STATES ==========
    const [openLogTimeDrawer, setOpenLogTimeDrawer] = useState(false);
    const [selectedLabour, setSelectedLabour] = useState(null);
    const [logDate, setLogDate] = useState(null);
    const [logTime, setLogTime] = useState(null);
    const [logTimeItems, setLogTimeItems] = useState([]);

    // Effects
    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (activeBatch) {
            fetchBatchProducts(activeBatch);
        }
    }, [activeBatch]);

    // Fetch Functions
    const fetchDepartments = () => {
        dispatch(fetchActiveDepartments());
        dispatch(fetchActiveSupervisor());
    };

    const fetchMaterialRequest = () => {
        dispatch(fetchActiveMaterials());
    };

    const fetchLabours = () => {
        dispatch(fetchActiveLabours());
    };

    const fetchBatchProducts = async (data) => {
        await dispatch(fetchBatchProduct(data));
    };

    // Handlers
    const closeAllSubmenus = useCallback(() => {
        switchSub.close();
        supSub.close();
        prioSub.close();
    }, [switchSub, supSub, prioSub]);

    const handleSupervisorToggle = useCallback((name) => {
        setSelectedSupervisors((prev) => prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]);
    }, []);

    const handleSwitchSelect = useCallback((value) => {
        console.log("Switch to:", value);
    }, []);

    const handlePrioritySet = useCallback((lvl) => setPriority(lvl), []);

    // ========== REQUEST STOCK HANDLERS ==========
    const handleOpenDrawer = () => {
        setOpenDrawer(true);
        fetchMaterialRequest();
    };

    const handleCloseDrawer = () => {
        setOpenDrawer(false);
        setSelectedMaterial(null);
        setStockQty("");
    };

    const handleAddStockItem = () => {
        if (!selectedMaterial || !stockQty || stockQty <= 0) return;

        const exists = stockItems.find(item => item.id === selectedMaterial.id);
        if (exists) {
            setStockItems(prev => prev.map(item =>
                item.id === selectedMaterial.id
                    ? { ...item, qty: Number(item.qty) + Number(stockQty) }
                    : item
            ));
        } else {
            setStockItems(prev => [...prev, { ...selectedMaterial, qty: Number(stockQty) }]);
        }
        setSelectedMaterial(null);
        setStockQty("");
    };

    const handleDeleteStockItem = (index) => {
        setStockItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleRequestStock = async () => {
        if (stockItems.length === 0) return;

        const formData = new FormData();
        formData.append("pp_id", selectedProduct?.id);
        stockItems.forEach(item => {
            formData.append("material_id[]", item.id);
            formData.append("qty[]", item.qty);
        });

        const res = await dispatch(storeMaterialRequest(formData));

        if (res.error) return;

        console.log("Request stock data submitted:", stockItems);

        setStockItems([]);
        handleCloseDrawer();
    };


    // ========== LOG TIME HANDLERS ==========
    const handleOpenLogTimeDrawer = () => {
        setOpenLogTimeDrawer(true);
        fetchLabours();
    };

    const handleCloseLogTimeDrawer = () => {
        setOpenLogTimeDrawer(false);
        setSelectedLabour(null);
        setLogDate(null);
        setLogTime(null);
    };

    const handleAddLogTime = () => {
        if (!selectedLabour || !logDate || !logTime) return;

        const newEntry = {
            id: Date.now(),
            labour: selectedLabour,
            date: logDate,
            time: logTime,
        };
        setLogTimeItems(prev => [...prev, newEntry]);
        setSelectedLabour(null);
        setLogDate(null);
        setLogTime(null);
    };

    const handleDeleteLogTime = (index) => {
        setLogTimeItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateLogTime = () => {
        if (logTimeItems.length === 0) return;
        console.log("Updating log time:", logTimeItems);
        // Add your dispatch action here
        handleCloseLogTimeDrawer();
    };

    // Delete confirmation handler
    const handleConfirmDelete = () => {
        if (deleteTarget.type === 'stock') {
            handleDeleteStockItem(deleteTarget.index);
        } else if (deleteTarget.type === 'logtime') {
            handleDeleteLogTime(deleteTarget.index);
        }
        setOpenDelete(false);
        setDeleteTarget({ type: null, index: null });
    };

    const handleAdd = async (values, resetForm) => {
        const res = await dispatch(addDepartment(values));
        if (!res.error) {
            resetForm();
            setOpen(false);
            fetchDepartments();
        }
    };

    const messages = useMemo(() => [
        { time: "10:00 AM", text: "User submitted the form", sender: "System" },
        { time: "10:02 AM", text: "Email sent to customer", sender: "System" },
        { time: "10:05 AM", text: "Admin approved the request", sender: "Admin" },
    ], []);

    const avatars = useMemo(() => (
        <AvatarGroup spacing={15}>
            <Avatar src={Profile} sx={{ width: 26, height: 26 }} />
            <Avatar src={Profile} sx={{ width: 26, height: 26 }} />
        </AvatarGroup>
    ), []);

    // Helper to format time
    const formatTime = (time) => {
        if (!time) return "";
        return time.format ? time.format("HH:mm") : time;
    };

    const formatDate = (date) => {
        if (!date) return "";
        return date.format ? date.format("DD/MM/YYYY") : date;
    };

    return (
        <>
            <Container disableGutters sx={{ maxWidth: "100% !important", overflowX: "hidden", marginBottom: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">Production</Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: isMobile ? "auto !important" : "calc(100vh - 220px)", gap: 2, boxSizing: "border-box", overflow: "hidden" }}>
                    {/* Navigation Panel */}
                    <Box sx={{ flex: isMobile ? "0 0 auto" : "0 0 240px", height: isMobile ? "auto !important" : "100%", boxSizing: "border-box" }}>
                        <Card variant="outlined" sx={{ height: isMobile ? "auto !important" : "100%", overflowY: isMobile ? "visible !important" : "auto" }}>
                            <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Navigation</Typography>
                                <NavigationMenu />
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Main Content */}
                    <Box sx={{ flex: 1, height: isMobile ? "auto !important" : "100%", boxSizing: "border-box" }}>
                        {activeBatch ? (
                            <Card variant="outlined" sx={{ backgroundColor: "transparent !important", boxShadow: "none", border: "none" }}>
                                <CardContent sx={{ p: 1 }}>
                                    {/* Batch Info */}
                                    <Box sx={{ mb: 2, p: 2, backgroundColor: "white", borderRadius: 1 }}>
                                        <Typography variant="h6" fontWeight={600}>Batch: {activeBatch.batch_no}</Typography>
                                        <Typography variant="body2" color="text.secondary">Quotation ID: {activeBatch.quotation_id}</Typography>
                                        {activeBatch.priority && (
                                            <Chip
                                                label={`Priority: ${activeBatch.priority}`}
                                                size="small"
                                                sx={{ mt: 1 }}
                                                color={activeBatch.priority === "High" ? "error" : activeBatch.priority === "Medium" ? "warning" : "success"}
                                            />
                                        )}
                                    </Box>

                                    <Grid size={12}>
                                        <Box sx={{ display: "flex", gap: 3 }}>
                                            {loading ? (
                                                Array.isArray(departments) && [...departments].sort((a, b) => a.sequence - b.sequence).map((dept) => (
                                                    <Box key={dept.id} sx={{ flex: 1, backgroundColor: "white", p: 2, borderRadius: 1, mb: 2 }} className="production-card-wrapper">
                                                        <Chip size="small" label={dept.name} sx={{ borderRadius: 1, backgroundColor: dept.color || "grey.500", color: "#fff" }} />
                                                        {[1, 2].map((item) => (
                                                            <Card key={item} sx={{ border: "1px solid #ddd !important", borderRadius: 1, padding: "5px 8px", marginTop: 1 }}>
                                                                <CardContent sx={{ padding: 0, paddingBottom: "0 !important" }}>
                                                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                        <Skeleton variant="rounded" width="60%" height={20} />
                                                                        <Skeleton variant="rounded" width={30} height={20} />
                                                                    </Box>
                                                                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                                                                        <Skeleton variant="circular" width={26} height={26} />
                                                                    </Box>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </Box>
                                                ))
                                            ) : (
                                                Array.isArray(departments) && [...departments].sort((a, b) => a.sequence - b.sequence).map((dept) => {
                                                    const products = batchProductsData?.[dept.id] || [];
                                                    return (
                                                        <Box key={dept.id} sx={{ flex: 1, backgroundColor: "white", p: 2, borderRadius: 1, mb: 2 }} className="production-card-wrapper">
                                                            <Chip size="small" label={dept.name} sx={{ borderRadius: 1, backgroundColor: dept.color || "grey.500", color: "#fff" }} />
                                                            {products.length > 0 && products.map((product) => (
                                                                <Card key={product.id} sx={{ border: "1px solid #ddd !important", borderRadius: 1, padding: "5px 8px", marginTop: 1 }}>
                                                                    <CardContent sx={{ padding: 0, paddingBottom: "0 !important" }} onClick={() => setOpenAdd(true)}>
                                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                            <h5 style={{ margin: 0 }}>{product.item_name}</h5>
                                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                                <Box component="h5" sx={{ m: 0 }}>{product.group?.trim()}</Box>
                                                                                <Tooltip title="Action" arrow>
                                                                                    <IconButton
                                                                                        color="primary"
                                                                                        onClick={(e) => { e.stopPropagation(); openMenu(e); closeAllSubmenus(); setSelectedProduct(product); }}
                                                                                        size="small"
                                                                                        aria-controls={menuOpen ? "production-menu" : undefined}
                                                                                        aria-haspopup="true"
                                                                                        aria-expanded={menuOpen ? "true" : undefined}
                                                                                        sx={{ ml: 2, zIndex: 999 }}
                                                                                    >
                                                                                        <FiMoreVertical size={16} />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                            </Box>
                                                                        </Box>
                                                                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>{avatars}</Box>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </Box>
                                                    );
                                                })
                                            )}
                                            <Box>
                                                <Tooltip title="Add Card" arrow>
                                                    <IconButton onClick={() => setOpen(true)} sx={{ backgroundColor: "grey.300", color: "grey.700", borderRadius: 1, p: 1 }}>
                                                        <IoMdAdd size={24} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ) : (
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", backgroundColor: "white", borderRadius: 1, p: 3 }}>
                                <Typography variant="h6" color="text.secondary">Please select a batch from the navigation menu</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Container>

            {/* Details Modal */}
            <BootstrapDialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="md">
                <BootstrapDialogTitle onClose={() => setOpenAdd(false)}>Order</BootstrapDialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box component="h4" sx={{ fontWeight: 500, m: 0 }}>Item Code</Box>
                        <Box component="h4" sx={{ fontWeight: 500, m: 0 }}>Group</Box>
                    </Box>
                    <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        <Grid size={6} className="production-status-details">
                            <table>
                                <tbody>
                                    <tr><td className="title"><strong>Switch To:</strong></td><td>Done</td></tr>
                                    <tr><td className="title"><strong>Supervisor:</strong></td><td>Shatyam</td></tr>
                                    <tr><td className="title"><strong>Priority:</strong></td><td>High</td></tr>
                                    <tr><td className="title"><strong>Log Time:</strong></td><td>8 hrs 17/11/2025</td></tr>
                                    <tr><td className="title"><strong>Naration:</strong></td><td>Lorem Ipsum is simply dummy text...</td></tr>
                                </tbody>
                            </table>
                        </Grid>
                        <Grid size={6} style={{ textAlign: "right" }}>
                            <img src={Profile} alt="profile" style={{ width: 300, height: "auto", borderRadius: 3 }} />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        <Grid size={12} className="production-status-details">
                            <table>
                                <tbody>
                                    <tr>
                                        <td className="title"><strong>Message:</strong></td>
                                        <td>
                                            <TextareaAutosize maxRows={4} placeholder="Enter message..." style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "10px", outline: "none" }} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Grid>
                        <Grid size={12}>
                            <Box sx={{ display: "flex", justifyContent: "end", marginTop: 0 }}>
                                <Button type="submit" variant="contained" color="primary">Send</Button>
                            </Box>
                        </Grid>
                        <Grid size={12}>
                            <Typography>Messages:</Typography>
                            <MessageTimeline messages={messages} />
                        </Grid>
                    </Grid>
                </DialogContent>
            </BootstrapDialog>

            {/* Main Action Menu */}
            <Menu
                id="production-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => { closeMenu(); closeAllSubmenus(); }}
                slotProps={{ paper: { elevation: 0, sx: { overflow: "visible", filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))", mt: 1.5 } } }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
                <MenuItem onClick={(e) => { e.stopPropagation(); closeAllSubmenus(); switchSub.openAt(e.currentTarget); }}>
                    <Box display="flex">
                        <Typography minWidth={90}>Switch To:</Typography>
                        <Typography fontWeight={600}>{departments.find((d) => d.id === selectedProduct?.department_id)?.name || '-'}</Typography>
                    </Box>
                </MenuItem>
                <SwitchSubmenu submenu={switchSub} onSelect={handleSwitchSelect} departments={departments} currentDepartment={selectedProduct?.department_id} />

                <MenuItem onClick={(e) => { e.stopPropagation(); closeAllSubmenus(); supSub.openAt(e.currentTarget); }}>
                    <Box display="flex" alignItems="center">
                        <Typography minWidth={90}>Supervisor:</Typography>
                        <Typography fontWeight={500}>{selectedSupervisors.join(", ")}</Typography>
                    </Box>
                </MenuItem>
                <SupervisorSubmenu submenu={supSub} supervisors={supervisors} selected={selectedSupervisors} toggle={handleSupervisorToggle} />

                <MenuItem onClick={(e) => { e.stopPropagation(); closeAllSubmenus(); prioSub.openAt(e.currentTarget); }}>
                    <Box display="flex" alignItems="center">
                        <Typography minWidth={90}>Priority:</Typography>
                        <Typography fontWeight={500}>{priority}</Typography>
                    </Box>
                </MenuItem>
                <PrioritySubmenu submenu={prioSub} value={priority} setValue={handlePrioritySet} />

                <MenuItem onClick={() => { closeAllSubmenus(); closeMenu(); handleOpenLogTimeDrawer(); }}>
                    <Box display="flex" alignItems="center">
                        <Typography minWidth={90}>Log Time:</Typography>
                        <Typography fontWeight={500}>{logTimeItems.length > 0 ? `${logTimeItems.length} entries` : "No entries"}</Typography>
                    </Box>
                </MenuItem>

                <Divider />

                <MenuItem onClick={() => { closeAllSubmenus(); closeMenu(); handleOpenDrawer(); }}>
                    <Typography textAlign="center" marginLeft="auto" marginRight="auto" fontWeight={500}>Request Stock</Typography>
                </MenuItem>
            </Menu>

            {/* Log Time Drawer */}
            <Drawer anchor="right" open={openLogTimeDrawer} onClose={handleCloseLogTimeDrawer} sx={{ zIndex: 9999 }}>
                <Box sx={{ width: 600, p: 2 }}>
                    <Typography variant="h6" fontWeight={500} fontSize="18px" marginBottom="6px">Log Time</Typography>
                    <Divider />

                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Item Code</Typography>
                        <Typography variant="h6">Group</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" paddingTop="15px" paddingBottom="10px" gap="10px">
                        {labourLoading ? (
                            <>
                                <Skeleton variant="rounded" width={300} height={40} />
                                <Skeleton variant="rounded" width={140} height={40} />
                                <Skeleton variant="rounded" width={140} height={40} />
                                <Skeleton variant="rounded" width={70} height={40} />
                            </>
                        ) : (
                            <>
                                <Autocomplete
                                    disablePortal  // <--- THIS FIXES IT
                                    options={labourData || []}
                                    value={selectedLabour}
                                    onChange={(e, val) => setSelectedLabour(val)}
                                    getOptionLabel={(option) =>
                                        option?.name ? `${option.id.toString()} (${option.name})` : ""
                                    }
                                    isOptionEqualToValue={(option, value) =>
                                        value && option.id === value.id
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Emp Code"
                                            placeholder="Search Emp code"
                                            size="small"
                                        />
                                    )}
                                    sx={{ width: 300 }}
                                />


                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Date"
                                        value={logDate}
                                        onChange={setLogDate}
                                        slotProps={{ textField: { size: "small" }, popper: { sx: { zIndex: 999999 } } }}
                                    />
                                    <TimePicker
                                        label="Time"
                                        value={logTime}
                                        onChange={setLogTime}
                                        slotProps={{ textField: { size: "small" }, popper: { sx: { zIndex: 999999 } } }}
                                    />
                                </LocalizationProvider>
                                <Button variant="contained" sx={{ marginTop: 0 }} onClick={handleAddLogTime} disabled={!selectedLabour || !logDate || !logTime}>Add</Button>
                            </>
                        )}
                    </Box>

                    <TableContainer sx={{ mt: 4 }}>
                        {labourLoading ? (
                            <>
                                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                            </>
                        ) : (
                            <Table sx={{ minWidth: "100%" }} size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Emp ID<br />(Emp Name)</TableCell>
                                        <TableCell>Date<br />(Time)</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logTimeItems.length > 0 ? (
                                        logTimeItems.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.labour?.code || item.labour?.id}<br />({item.labour?.name})</TableCell>
                                                <TableCell>{formatDate(item.date)}<br />({formatTime(item.time)})</TableCell>
                                                <TableCell>
                                                    <Tooltip title="Delete" arrow>
                                                        <IconButton color="error" onClick={() => { setDeleteTarget({ type: 'logtime', index }); setOpenDelete(true); }}>
                                                            <RiDeleteBinLine size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">
                                                <Typography variant="body2" color="text.secondary">No log time entries added</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </TableContainer>

                    <Box mt={2} sx={{ display: "flex", justifyContent: "end" }}>
                        <Button variant="contained" onClick={handleUpdateLogTime} disabled={logTimeItems.length === 0}>Update</Button>
                    </Box>
                </Box>
            </Drawer>

            {/* Request Stock Drawer */}
            <Drawer anchor="right" open={openDrawer} onClose={handleCloseDrawer} sx={{ zIndex: 9999 }}>
                <Box sx={{ width: 450, p: 2 }}>
                    <Typography variant="h6" fontWeight={500} fontSize="18px" marginBottom="6px">Request Stock</Typography>
                    <Divider />

                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">Item Code</Typography>
                        <Typography variant="subtitle1">Group</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" paddingTop="15px" paddingBottom="10px">
                        {materialLoading ? (
                            <>
                                <Skeleton variant="rounded" width={300} height={40} />
                                <Skeleton variant="rounded" width={60} height={40} sx={{ mx: 2 }} />
                                <Skeleton variant="rounded" width={70} height={40} />
                            </>
                        ) : (
                            <>
                                <Autocomplete
                                    disablePortal
                                    options={materialData}
                                    value={selectedMaterial}
                                    getOptionLabel={(option) =>
                                        option?.name
                                            ? `${option.name} (${option.category?.name ?? ""})`
                                            : ""
                                    }
                                    onChange={(e, val) => setSelectedMaterial(val)}
                                    renderOption={(props, option) => {
                                        const { key, ...rest } = props;  // remove key from spread

                                        return (
                                            <li key={key} {...rest}>
                                                <Box>
                                                    <Typography fontWeight={600}>{option.name}</Typography>

                                                    <Typography variant="caption" display="block">
                                                        Group: {option.group?.name || "—"}
                                                    </Typography>

                                                    <Typography variant="caption">
                                                        Size: {option.size} • UOM: {option.unit_of_measurement?.name ?? "—"}
                                                    </Typography>
                                                </Box>
                                            </li>
                                        );
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Item Code"
                                            placeholder="Search item"
                                            size="small"
                                        />
                                    )}
                                    sx={{ width: 300 }}
                                />

                                <TextField
                                    label="Qty"
                                    variant="outlined"
                                    size="small"
                                    type="number"
                                    value={stockQty}
                                    onChange={(e) => setStockQty(e.target.value)}
                                    sx={{ mx: 2, width: 80 }}
                                />
                                <Button variant="contained" onClick={handleAddStockItem} disabled={!selectedMaterial || !stockQty || stockQty <= 0}>Add</Button>
                            </>
                        )}
                    </Box>

                    <TableContainer sx={{ mt: 4 }}>
                        {materialLoading ? (
                            <>
                                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                            </>
                        ) : (
                            <Table sx={{ minWidth: "100%" }} size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item<br />(Name)</TableCell>
                                        <TableCell>Avg.Qty<br />(Rq.Qty)</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stockItems.length > 0 ? (
                                        stockItems.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.name}<br />({item.size || item.category?.name || "—"})</TableCell>
                                                <TableCell>{item.opening_stock || 0}<br />({item.qty})</TableCell>
                                                <TableCell>
                                                    <Tooltip title="Delete" arrow>
                                                        <IconButton color="error" onClick={() => { setDeleteTarget({ type: 'stock', index }); setOpenDelete(true); }}>
                                                            <RiDeleteBinLine size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">
                                                <Typography variant="body2" color="text.secondary">No items added</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </TableContainer>

                    <Box mt={2} display="flex" justifyContent="flex-end">
                        <Button variant="contained" onClick={handleRequestStock} disabled={stockItems.length === 0}>Request</Button>
                    </Box>
                </Box>
            </Drawer>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDelete} onClose={() => setOpenDelete(false)} sx={{ zIndex: 999999 }}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent style={{ width: "300px" }}>
                    <DialogContentText>Are you sure you want to delete this item? This action cannot be undone.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error" autoFocus>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Add Department Modal */}
            <DepartmentFormDialog
                open={open}
                onClose={() => setOpen(false)}
                onSubmit={async (values, { resetForm }) => handleAdd(values, resetForm)}
                initialValues={{ name: "", color: "" }}
                title="Add Department"
                submitButtonText="Submit"
            />
        </>
    );
}
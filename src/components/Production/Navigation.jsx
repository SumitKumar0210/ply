// NavigationMenu.jsx
import React, { useEffect, useState } from "react";
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Skeleton,
    Box,
} from "@mui/material";

import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { FaBuilding, FaBox } from "react-icons/fa6";

import { useDispatch, useSelector } from "react-redux";
import { fetchProductionChainOrder, setActiveBatch } from "../../pages/Production/slice/productionChainSlice";

function NavigationMenu() {
    const [openMenu, setOpenMenu] = useState({});
    const dispatch = useDispatch();

    // Get both productionData and activeBatch from Redux
    const { data: productionData = [], loading, error, activeBatch } = useSelector(
        (state) => state.productionChain
    );

    useEffect(() => {
        dispatch(fetchProductionChainOrder());
    }, [dispatch]);

    const toggleMenu = (id) => {
        setOpenMenu((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Handle batch selection - dispatches to Redux
    const handleBatchClick = (batch) => {
        dispatch(setActiveBatch(batch));
    };

    if (loading) {
        return (
            <List sx={{ p: 0 }}>
                {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ mb: 1, px: 1 }}>
                        <Skeleton variant="rectangular" height={45} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="rectangular" height={35} width="80%" sx={{ mt: 1, borderRadius: 1 }} />
                    </Box>
                ))}
            </List>
        );
    }

    if (error) {
        return <div style={{ padding: 10, color: "red" }}>Failed to load menu.</div>;
    }

    const navItems = productionData.map((item) => ({
        id: item.quotation_id,
        label: item.customer?.name ?? "Unknown Customer",
        icon: <FaBuilding size={16} />,
        open: openMenu[item.quotation_id] ?? false,
        toggle: () => toggleMenu(item.quotation_id),
        children: item.batches.map((batch) => ({
            id: batch.id,
            label: `${batch.batch_no}`,
            icon: <FaBox size={14} />,
            data: batch, // Store full batch data
        })),
    }));

    return (
        <List sx={{ p: 0 }}>
            {navItems.map((item, index) => (
                <React.Fragment key={index}>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            onClick={item.toggle}
                            sx={{
                                py: 1,
                                px: 1.5,
                                borderRadius: 1,
                                "&:hover": { backgroundColor: "action.hover" },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                {item.icon}
                            </ListItemIcon>

                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                }}
                            />

                            {item.children.length > 0 &&
                                (item.open ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />)}
                        </ListItemButton>
                    </ListItem>

                    <Collapse in={item.open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.children.map((child, cIndex) => (
                                <ListItem key={cIndex} disablePadding>
                                    <ListItemButton
                                        onClick={() => handleBatchClick(child.data)}
                                        sx={{
                                            py: 0.75,
                                            pl: 5,
                                            borderRadius: 1,
                                            backgroundColor:
                                                activeBatch?.id === child.id
                                                    ? "action.selected"
                                                    : "transparent",
                                            "&:hover": {
                                                backgroundColor: "action.hover",
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            {child.icon}
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={child.label}
                                            primaryTypographyProps={{
                                                fontSize: "13px",
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Collapse>
                </React.Fragment>
            ))}
        </List>
    );
}

export default NavigationMenu;
// NavigationMenu.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Skeleton,
  Box,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { HiChevronUp, HiChevronDown } from "react-icons/hi2";
import { MdOutlinePrecisionManufacturing } from "react-icons/md";
import { FaBox } from "react-icons/fa6";
import { BiSearchAlt } from "react-icons/bi";
import { MdInbox } from "react-icons/md";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductionChainOrder,
  setActiveBatch,
} from "../../pages/Production/slice/productionChainSlice";

function NavigationMenu() {
  const [openMenu, setOpenMenu] = useState({});
  const [search, setSearch] = useState("");

  const dispatch = useDispatch();
  const {
    data: productionData = [],
    productionLoading,
    error,
    activeBatch,
  } = useSelector((state) => state.productionChain);

  useEffect(() => {
    dispatch(fetchProductionChainOrder());
  }, [dispatch]);

  const toggleMenu = (id) => {
    setOpenMenu((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBatchClick = (batch) => {
    dispatch(setActiveBatch(batch));
  };

  /** 🔍 FILTER LOGIC */
  const filteredData = useMemo(() => {
    const term = search.toLowerCase();

    return productionData.map((item) => {
      const parentMatch = item.customer?.name?.toLowerCase().includes(term);

      const batchMatches = item.batches.filter((b) =>
        b.batch_no?.toLowerCase().includes(term)
      );

      return {
        ...item,
        matched: parentMatch || batchMatches.length > 0,
        batches: parentMatch ? item.batches : batchMatches,
      };
    });
  }, [search, productionData]);

  /** 🔥 AUTO EXPAND ONLY MATCHED */
  useEffect(() => {
    if (!search.trim()) {
      setOpenMenu({});
      return;
    }

    const newOpenState = {};
    filteredData.forEach((item) => {
      if (item.matched) {
        newOpenState[item.quotation_id] = true;
      }
    });

    setOpenMenu(newOpenState);
  }, [search, filteredData]);

  // Loading State
  if (productionLoading) {
    return (
      <List sx={{ p: 0 }}>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ mb: 1, px: 1 }}>
            <Skeleton
              variant="rectangular"
              height={45}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={35}
              width="80%"
              sx={{ mt: 1, borderRadius: 1 }}
            />
          </Box>
        ))}
      </List>
    );
  }

  // Error State
  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          textAlign: "center",
        }}
      >
        <MdInbox size={48} color="#ccc" />
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Failed to load production orders
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  // Check if there are any matched results
  const hasMatchedResults = filteredData.some((item) => item.matched);

  return (
    <>
      {/* 🔍 SEARCH BAR */}
      <Box sx={{ px: 1, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search customer or batch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <BiSearchAlt size={18} style={{ marginRight: 8, color: "#666" }} />,
          }}
        />
      </Box>

      {/* NO DATA STATE - When productionData is empty */}
      {productionData.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            textAlign: "center",
          }}
        >
          <MdInbox size={64} color="#ccc" />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
            No Production Orders
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            No production orders available at the moment
          </Typography>
        </Box>
      ) : !hasMatchedResults ? (
        /* NO SEARCH RESULTS STATE */
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            textAlign: "center",
          }}
        >
          <BiSearchAlt size={64} color="#ccc" />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
            No Results Found
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            No customers or batches match "{search}"
          </Typography>
        </Box>
      ) : (
        /* MENU LIST */
        <List component="nav">
          {filteredData.map((item) => {
            if (!item.matched) return null;

            const isOpen = openMenu[item.quotation_id] ?? false;

            return (
              <React.Fragment key={item.quotation_id}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => toggleMenu(item.quotation_id)}
                    sx={{
                      py: 0.5,
                      px: 1.5,
                      borderRadius: 1,
                      borderTop: "1px solid #e0e0e0",
                      "&:hover": { backgroundColor: "action.hover" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <MdOutlinePrecisionManufacturing size={16} />
                    </ListItemIcon>

                    <ListItemText
                      primary={item.customer?.name ?? "Unknown Customer"}
                      primaryTypographyProps={{
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    />

                    {item.batches.length > 0 &&
                      (isOpen ? (
                        <HiChevronUp size={20} />
                      ) : (
                        <HiChevronDown size={20} />
                      ))}
                  </ListItemButton>
                </ListItem>

                {/* Collapsed Batch List */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.batches.length > 0 ? (
                      item.batches.map((batch) => (
                        <ListItem key={batch.id} disablePadding>
                          <ListItemButton
                            onClick={() => handleBatchClick(batch)}
                            sx={{
                              py: 0.75,
                              pl: 5,
                              borderRadius: 1,
                              backgroundColor:
                                activeBatch?.id === batch.id
                                  ? "action.selected"
                                  : "transparent",
                              "&:hover": {
                                backgroundColor: "action.hover",
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <FaBox size={14} />
                            </ListItemIcon>

                            <ListItemText
                              primary={batch.batch_no}
                              primaryTypographyProps={{
                                fontSize: "13px",
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText
                          primary="No batches available"
                          primaryTypographyProps={{
                            fontSize: "12px",
                            color: "text.secondary",
                            fontStyle: "italic",
                            pl: 5,
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      )}
    </>
  );
}

export default NavigationMenu;
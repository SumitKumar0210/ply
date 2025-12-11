// components/ProductCard.jsx
import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  IconButton,
  Tooltip,
  AvatarGroup,
  Avatar,
} from "@mui/material";
import { FiMoreVertical } from "react-icons/fi";
import { useSelector } from "react-redux";
import Profile from "../../assets/images/profile.jpg";
import { fetchActiveMaterials } from "../../pages/settings/slices/materialSlice";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";

export default function ProductCard({ product, onOpen, onMenuOpen, menuOpen }) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchActiveMaterials());
  }, []);
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const { supervisor: supervisorData = [] } = useSelector(
    (state) => state.user
  );
  const { hasAnyPermission } = useAuth();

  const supervisors = product.supervisor_id
    ? supervisorData.filter((s) =>
        Array.isArray(product.supervisor_id)
          ? product.supervisor_id.includes(s.id)
          : s.id === product.supervisor_id
      )
    : [];

  return (
    <Card
      sx={{
        border: "1px solid #ddd !important",
        borderRadius: 1,
        padding: "5px 8px",
        marginTop: 1,
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "grey.50",
          boxShadow: 1,
        },
      }}
      onClick={onOpen}
    >
      <CardContent
        sx={{
          padding: 0,
          paddingBottom: "0 !important",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h5 style={{ margin: 0, fontSize: "14px" }}>{product.item_name}</h5>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              component="span"
              sx={{ fontSize: "12px", color: "text.secondary" }}
            >
              {product.group?.trim()}
            </Box>
            {hasAnyPermission(["productions.change_priority",
              "productions.change_supervisor",
              "productions.log_time",
              "productions.request_stock",
              "productions.switch_to"
            ]) && (
              <Tooltip title="Actions" arrow>
              <IconButton
                color="primary"
                onClick={onMenuOpen}
                size="small"
                aria-haspopup="true"
                aria-expanded={menuOpen ? "true" : undefined}
                sx={{ ml: 1, zIndex: 999 }}
              >
                <FiMoreVertical size={16} />
              </IconButton>
            </Tooltip>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 1,
          }}
        >
          <AvatarGroup spacing={15} max={3}>
            {supervisors.length > 0 ? (
              supervisors.map((s) => (
                <Avatar
                  key={s.id}
                  src={s.image ? mediaUrl + s.image : Profile}
                  sx={{ width: 26, height: 26 }}
                  alt={s.name}
                />
              ))
            ) : (
              <Avatar src={Profile} sx={{ width: 26, height: 26 }} />
            )}
          </AvatarGroup>
        </Box>
      </CardContent>
    </Card>
  );
}

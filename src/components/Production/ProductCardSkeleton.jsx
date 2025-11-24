// components/ProductCardSkeleton.jsx
import React from "react";
import {
  Card,
  CardContent,
  Box,
  Chip,
  Skeleton,
} from "@mui/material";

export default function ProductCardSkeleton({ department }) {
  return (
    <Box
      sx={{
        flex: "0 0 280px",
        backgroundColor: "white",
        p: 2,
        borderRadius: 1,
        mb: 2,
      }}
    >
      <Chip
        size="small"
        label={department.name}
        sx={{
          borderRadius: 1,
          backgroundColor: department.color || "grey.500",
          color: "#fff",
          mb: 1,
        }}
      />
      {[1, 2].map((item) => (
        <Card
          key={item}
          sx={{
            border: "1px solid #ddd !important",
            borderRadius: 1,
            padding: "5px 8px",
            marginTop: 1,
          }}
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
              <Skeleton variant="rounded" width="60%" height={20} />
              <Skeleton variant="rounded" width={30} height={20} />
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: 1,
              }}
            >
              <Skeleton variant="circular" width={26} height={26} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
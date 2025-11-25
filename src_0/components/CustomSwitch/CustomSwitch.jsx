import React from "react";
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";

const CustomSwitch = styled(Switch)(({ theme }) => ({
  width: 32,     // same as your screenshot (~32px)
  height: 18,    // slim height
  padding: 0,
  display: "flex",

  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(14px)",   // move thumb to right
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "#2196f3",    //  active blue color
        opacity: 1,
      },
    },
  },

  "& .MuiSwitch-thumb": {
    boxShadow: "0 1px 3px rgba(0,0,0,.3)",
    width: 14,   // smaller thumb
    height: 14,
    borderRadius: "50%",
    backgroundColor: "#fff",
  },

  "& .MuiSwitch-track": {
    borderRadius: 18 / 2,
    backgroundColor: "#ccc",   // off state grey
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 200,
    }),
  },
}));

export default CustomSwitch;

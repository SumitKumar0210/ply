import { createTheme } from "@mui/material/styles";
import palette from "./palette";

const theme = createTheme({
  palette,
  typography: {
    // fontFamily: "'Open Sans', sans-serif",
    fontFamily: "'Poppins', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          marginTop: "10px",
          textTransform: "capitalize",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: "16px",

        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "14px",

        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "20px",
          fontWeight: "400"

        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "8px",

        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: "#f1f1f1",

        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          "&:last-child": {
            paddingBottom: "12px", // must be string
          },
        },
      },
    },

  },
});

export default theme;

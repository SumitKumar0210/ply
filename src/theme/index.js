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
              fontSize: "14px",
             
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
             background: "#f1f1f1" ,
             
            },
          },
        },
    },
});

export default theme;

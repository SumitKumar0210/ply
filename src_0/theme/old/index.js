import { createTheme } from "@mui/material/styles";
import palette from "./palette";

const theme = createTheme({
    palette,
    typography: {
        fontFamily: "'Open Sans', sans-serif",
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
    },
});

export default theme;

// theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: false,      // always full width
        disableGutters: true, // optional: remove left/right padding
      },
    },
    MuiTextField: {
      defaultProps: {
        InputLabelProps: {
          shrink: true, // globally shrink all TextField labels
        },
      },
    },
  },
});

export default theme;

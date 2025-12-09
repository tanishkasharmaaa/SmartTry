import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark", // your app starts in dark mode
    useSystemColorMode: false,
  },

  styles: {
    global: (props) => ({
      "*": {
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      },
      body: {
        bg: props.colorMode === "dark" ? "black" : "white",
        color: props.colorMode === "dark" ? "white" : "black",
        transition: "all 0.25s ease",
      },
    }),
  },

  components: {
    Button: {
      baseStyle: {
        borderRadius: "0px",
        padding: "2px 8px",
        boxShadow: "none",
      },
    },

    Box: {
      baseStyle: {
        padding: 0,
        margin: 0,
      },
    },
  },
});

export default theme;

import { useEffect, useState } from "react"
import  ThemeContext  from "./themeContext"
import { useColorMode } from "@chakra-ui/react"

const ThemeProvider = ({children}) => {
    const { colorMode, toggleColorMode } = useColorMode();
  const [light, setLight] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(light));
    const isLight = colorMode === "light";
    if (light !== isLight) {
      toggleColorMode(); // Sync Chakra's mode with your context
    }
  }, [light]);

    return (
        <ThemeContext.Provider value={{light, setLight}}>
         {children}
        </ThemeContext.Provider>
    )
}

export default ThemeProvider
import {
  Box,
  Heading,
  Text,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Button,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon, HamburgerIcon } from "@chakra-ui/icons";
import { useContext } from "react";
import {CiSearch} from "react-icons/ci";
import AuthContext from "../context/authContext";
import ThemeContext from "../context/themeContext";
import { motion } from "framer-motion";
import { SearchIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
import Login from "./login";
import SearchBox from "./searchBox";
// import { clsx } from "clsx";

const ThemeToggleButton5 = ({ onClick, isDark }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: "45px",
        height: "45px",
        borderRadius: "50%",
        border: "1px solid",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: isDark ? "black" : "white",
        color: isDark ? "white" : "black",
        cursor: "pointer",
        position: "fixed",
        bottom: "25px",
        right: "25px",
        zIndex: 2000,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        fill="currentColor"
        strokeLinecap="round"
        viewBox="0 0 32 32"
        width="28"
        height="28"
      >
        <clipPath id="skiper-btn-3">
          <motion.path
            animate={{ y: isDark ? 14 : 0, x: isDark ? -11 : 0 }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            d="M0-11h25a1 1 0 0017 13v30H0Z"
          />
        </clipPath>

        <g clipPath="url(#skiper-btn-3)">
          <motion.circle
            animate={{ r: isDark ? 10 : 8 }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            cx="16"
            cy="16"
            r="15"
          />

          <motion.g
            animate={{
              scale: isDark ? 0.5 : 1,
              opacity: isDark ? 0 : 1,
            }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M18.3 3.2c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3S14.7.9 16 .9s2.3 1 2.3 2.3zm-4.6 25.6c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zm15.1-10.5c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zM3.2 13.7c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3S.9 17.3.9 16s1-2.3 2.3-2.3zm5.8-7C9 7.9 7.9 9 6.7 9S4.4 8 4.4 6.7s1-2.3 2.3-2.3S9 5.4 9 6.7zm16.3 21c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm2.4-21c0 1.3-1 2.3-2.3 2.3S23 7.9 23 6.7s1-2.3 2.3-2.3 2.4 1 2.4 2.3zM6.7 23C8 23 9 24 9 25.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z" />
          </motion.g>
        </g>
      </svg>
    </button>
  );
};

const Navbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { light, setLight } = useContext(ThemeContext);

  const handleTheme = () => setLight(!light);

  const bgColor = useColorModeValue("white", "black");
  const textColor = useColorModeValue("black", "white");
  const hoverColor = useColorModeValue("gray.600", "gray.300");

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={{ base: 4, md: 10 }}
        py={4}
        bg={bgColor}
        color={textColor}
        borderBottom="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        position="sticky"
        top={0}
        zIndex={1000}
      >
        {/* HAMBURGER (Mobile Only) */}
        <IconButton
          aria-label="Open Menu"
          icon={<HamburgerIcon />}
          display={{ base: "block", md: "none" }}
          onClick={onOpen}
          variant="outline"
          borderColor={textColor}
          color={textColor}
          _hover={{ bg: useColorModeValue("blackAlpha.50", "whiteAlpha.200") }}
        />

        {/* LOGO */}
        <Heading
          as={Link}
          to={"/"}
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="bold"
          letterSpacing="1px"
          onClick={() => (window.location.href = "/")}
        >
          SM△RTTRY
        </Heading>
        


        {/* DESKTOP LINKS */}
        <Box
          display={{ base: "none", md: "flex" }}
          gap="30px"
          alignItems="center"
          fontWeight="semibold"
        >
          {/* <Text>
            <SearchIcon boxSize={5}  cursor="pointer" _hover={{ color: hoverColor }} />
          </Text> */}
          <SearchBox/>
          {["Men", "Women", "Unisex", "About"].map((item) => (
            <Text
              as={Link}
              to={`/${item.toLowerCase()}`}
              key={item}
              cursor="pointer"
              _hover={{ color: hoverColor }}
              transition="0.3s"
            >
              {item}
            </Text>
          ))}

          
          <Login/>
        </Box>
      </Box>

      <Box position="fixed" bottom="25px" right="25px" zIndex={2000}>
        <ThemeToggleButton5
          onClick={handleTheme}
          isDark={!light}
          style={{
            position: "fixed",
            bottom: "25px",
            right: "25px",
            zIndex: 2000,
          }}
        />
      </Box>
      

      {/* MOBILE DRAWER */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent
          bg={bgColor}
          color={textColor}
          borderRight="1px solid"
          borderColor={useColorModeValue("gray.200", "gray.700")}
        >
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px solid" borderColor="gray.300">
            Menu
          </DrawerHeader>

          <DrawerBody
            display="flex"
            flexDirection="column"
            gap="20px"
            mt="20px"
          >
            {["Men", "Women", "Unisex", "About"].map((item) => (
              <Text
                as={Link}
                to={`/${item.toLowerCase()}`}
                key={item}
                fontSize="xl"
                _hover={{ color: hoverColor }}
                transition="0.3s"
                onClick={onClose}
              >
                {item}
              </Text>
            ))}

            {/* AUTH BUTTON */}
            {/* <Button
              mt={5}
              bg={textColor}
              color={bgColor}
              border="1px solid"
              borderColor={textColor}
              _hover={{ bg: bgColor, color: textColor }}
              onClick={() =>
                authenticated
                  ? logout()
                  : (location.href =
                      "https://smarttry.onrender.com/auth/google")
              }
            >
              {authenticated ? "Logout" : "Signup"}
            </Button> */}
            <Login/>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Navbar;

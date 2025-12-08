import { Box, Heading, Text, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Button } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useContext } from "react";
import AuthContext from "../context/authContext";

const Navbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {authenticated} = useContext(AuthContext);
  return (
    <>
      {/* NAVBAR */}
      <Box
        className="navbar"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={{ base: 4, md: 10 }}
        py={3}
        bg="linear-gradient(90deg, rgba(5, 5, 5, 0.75), rgba(183, 183, 183, 0.15))"
        backdropFilter="blur(8px)"
        borderRadius="0 0 20px 20px"
        position="sticky"
        top="0"
        zIndex="1000"
      >

        {/* HAMBURGER (Mobile Only) */}
        <IconButton
          aria-label="Open Menu"
          icon={<HamburgerIcon />}
          display={{ base: "block", md: "none" }}
          onClick={onOpen}
          variant="unstyled"
          color="white"
          fontSize="28px"
        />

        {/* LOGO */}
        <Heading
          fontFamily="heading"
          fontSize={{ base: "xl", md: "2xl" }}
          bgGradient="linear(to-r, white, black, white)"
          bgClip="text"
          letterSpacing="2px"
          fontWeight="extrabold"
        >
          SM△RTTRY
        </Heading>

        {/* NAV LINKS (Desktop Only) */}
        <Box
          display={{ base: "none", md: "flex" }}
          gap="30px"
          alignItems="center"
          fontWeight="bold"
          color="white"
        >
          <Text cursor="pointer" _hover={{ color: "black" }}>Men</Text>
          <Text cursor="pointer" _hover={{ color: "black" }}>Women</Text>
          <Text cursor="pointer" _hover={{ color: "black" }}>Unisex</Text>
          <Text cursor="pointer" _hover={{ color: "black" }}>Contact</Text>
          <Button
  onClick={() => {
    window.location.href = "https://smarttry.onrender.com/auth/google";
  }}
>
  Signup
</Button>

        </Box>
      </Box>
      {/* MOBILE MENU DRAWER */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent bg="blackAlpha.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
 
          <DrawerBody display="flex" flexDirection="column" gap="20px" mt="20px">
            <Text onClick={onClose} fontSize="xl">Men</Text>
            <Text onClick={onClose} fontSize="xl">Women</Text>
            <Text onClick={onClose} fontSize="xl">Unisex</Text>
            <Text onClick={onClose} fontSize="xl">Contact</Text>
            
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Navbar;

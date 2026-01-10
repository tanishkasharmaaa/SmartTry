import { Box, useColorModeValue } from "@chakra-ui/react";
import { MessageCircle, X, User } from "lucide-react";
import { forwardRef } from "react";

const ChatToggleButton = forwardRef(({ isOpen, onClick, authenticated }, ref) => {
  const bg = useColorModeValue("white", "black");
  const color = useColorModeValue("black", "white");

  const Icon = !isOpen
    ? MessageCircle
    : !authenticated
    ? User
    : X;

  return (
    <Box
      ref={ref}
      position="fixed"
      bottom="20px"
      left="25px"
      w="50px"
      h="50px"
      borderRadius="full"
      bg={bg}
      color={color}
      display="flex"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      boxShadow="lg"
      zIndex="2000"
      border={`1.5px solid ${color}`}
      onClick={onClick}
    >
      <Icon size={22} />
    </Box>
  );
});

export default ChatToggleButton;

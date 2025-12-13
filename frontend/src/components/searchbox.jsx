import {
  useDisclosure,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  Input,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

const SearchBox = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("white", "black");
    const textColor = useColorModeValue("black", "white");
    const hoverColor = useColorModeValue("gray.600", "gray.300");
  return (
    <>
      <Text >
        <SearchIcon  boxSize={5} cursor="pointer" onClick={onOpen} color={textColor}/>
      </Text>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />

        <ModalContent
          p={6}
          bg={useColorModeValue("white", "black")}
          borderRadius="md"
        >
          <Input
            placeholder="Search products..."
            size="lg"
            bg="#000"               // 🔥 FORCE BLACK BACKGROUND
            color="white"
            border="1px solid #222"
            _placeholder={{ color: "whiteAlpha.700" }}
            
            // FORCE EVERY STATE TO STAY BLACK
            _hover={{ bg: "#000" }}
            _focus={{ bg: "#000", borderColor: "white" }}
            _focusVisible={{ bg: "#000", borderColor: "white" }}
            _active={{ bg: "#000" }}
          />
        </ModalContent>
      </Modal>
    </>
  );
};

export default SearchBox;

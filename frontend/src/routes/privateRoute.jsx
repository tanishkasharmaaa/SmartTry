import { useContext } from "react";
import {
  Box,
  VStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import AuthContext from "../context/authContext";
import Login from "../components/login";

const PrivateRoute = ({ children }) => {
  const { authenticated } = useContext(AuthContext);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subText = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  if (!authenticated) {
    return (
      <Box
        minH="90vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={bg}
        px={4}
      >
        <Box
          w="100%"
          maxW="420px"
          bg={cardBg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          p={6}
          boxShadow="lg"
          textAlign="center"
        >
          <VStack spacing={3}>
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              Login Required
            </Text>

            <Text fontSize="sm" color={subText}>
              Please login or sign up to continue
            </Text>

            {/* Your existing Login component */}
            <Login buttonName="Login / Sign Up" />
          </VStack>
        </Box>
      </Box>
    );
  }

  return children;
};

export default PrivateRoute;

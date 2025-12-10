import {
  Box,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalOverlay,
  useColorModeValue,
  useDisclosure,
  Text,
  VStack,
  HStack,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import AuthContext from "../context/authContext";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const { authenticated, logout } = useContext(AuthContext);

  // -------------------------------
  // ✅ ALL HOOKS MUST BE AT THE TOP
  // -------------------------------
  const bg = useColorModeValue("white", "black");
  const googleBorder = useColorModeValue("gray.300", "gray.600");
  const googleHover = useColorModeValue("gray.100", "gray.700");

  const mainBtnBg = useColorModeValue("black", "white");
  const mainBtnColor = useColorModeValue("white", "black");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [mode, setMode] = useState("main");

  const GOOGLE_URL = "https://smarttry.onrender.com/auth/google";

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const toast = useToast();

  const handleClose = () => {
    setMode("main");
    onClose();
  };

  const handleCreateAccount = async () => {
    // VALIDATION
    if (signupData.password.length < 6) {
      return toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }

    if (signupData.password !== signupData.confirmPassword) {
      return toast({
        title: "Passwords do not match",
        description: "Password and confirm password must be the same.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
 console.log(1)
    try {
      const response = await fetch("https://smarttry.onrender.com/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });
     console.log(2)
      const data = await response.json();
      console.log("Signup Response:", data);
      if (response.ok) {
        toast({
          title: "Account Created",
          description: "Your account has been created successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        setMode("login");
      } else {
        toast({
          title: "Signup Failed",
          description: data.message || "Unable to create account.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Something went wrong. Try again later.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.log("Signup Error:", error);
    }
  };

  // ---------------------------
  // ⭐ LOGIN HANDLER
  // ---------------------------
  const handleLogin = async () => {
    try {
      const response = await fetch(
        "https://smarttry.onrender.com/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful", data);
        onClose();
      } else {
        console.error("Login error:", data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <Box>
      {/* MAIN BTN */}
      <Button
        bg={mainBtnBg}
        color={mainBtnColor}
        px="20px"
        borderRadius="md"
        _hover={{ opacity: 0.9 }}
        onClick={() => (authenticated ? logout() : onOpen())}
      >
        {authenticated ? "Logout" : "Login / Signup"}
      </Button>

      {/* MODAL */}
      <Modal isOpen={isOpen} onClose={handleClose} bg={mainBtnBg} isCentered>
        <ModalOverlay />
        <ModalContent bg={bg} borderRadius="lg" p="20px" minW="350px">
          {/* MAIN MENU */}
          {mode === "main" && (
            <VStack spacing={5}>
              <Text fontSize="xl" fontWeight="bold">
                Welcome to SmartTry 👗
              </Text>

              {/* GOOGLE BUTTON */}
              <HStack
                cursor="pointer"
                w="100%"
                border="1px solid"
                borderColor={googleBorder}
                borderRadius="md"
                p="10px"
                justifyContent="center"
                _hover={{ bg: googleHover }}
                onClick={() => (window.location.href = GOOGLE_URL)}
              >
                <FcGoogle size={23} />
                <Text>Continue with Google</Text>
              </HStack>

              <HStack w="100%">
                <Divider />
                <Text fontSize="sm" color="gray.500">
                  OR
                </Text>
                <Divider />
              </HStack>

              <Button
                w="100%"
                bg={mainBtnBg}
                color={mainBtnColor}
                onClick={() => setMode("signup")}
              >
                Create Account
              </Button>

              <Button
                w="100%"
                variant="outline"
                onClick={() => setMode("login")}
              >
                Login with Email
              </Button>
            </VStack>
          )}

          {/* SIGNUP FORM */}
          {mode === "signup" && (
            <VStack spacing={4}>
              <Text fontSize="xl" fontWeight="bold">
                Create Account
              </Text>

              <Input
                placeholder="Name"
                value={signupData.name}
                onChange={(e) =>
                  setSignupData({ ...signupData, name: e.target.value })
                }
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
              />
              <Input
                placeholder="Password"
                type="password"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
              />
              <Input
                placeholder="Confirm Password"
                type="password"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />

              <Button
                w="100%"
                bg={mainBtnBg}
                color={mainBtnColor}
                onClick={handleCreateAccount}
              >
                Sign Up
              </Button>

              <Text
                fontSize="sm"
                color="blue.400"
                cursor="pointer"
                onClick={() => setMode("login")}
              >
                Already have an account? Login
              </Text>
              <Text
                fontSize="sm"
                cursor="pointer"
                onClick={() => setMode("main")}
              >
                ← Back
              </Text>
            </VStack>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <VStack spacing={4}>
              <Text fontSize="xl" fontWeight="bold">
                Login
              </Text>

              <Input placeholder="Email" type="email" />
              <Input placeholder="Password" type="password" />

              <Button w="100%" bg={mainBtnBg} color={mainBtnColor}>
                Login
              </Button>

              <Text
                fontSize="sm"
                color="blue.400"
                cursor="pointer"
                onClick={() => setMode("signup")}
              >
                Create a new account
              </Text>
              <Text
                fontSize="sm"
                cursor="pointer"
                onClick={() => setMode("main")}
              >
                ← Back
              </Text>
            </VStack>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Login;

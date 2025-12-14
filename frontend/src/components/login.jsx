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
  WrapItem,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import AuthContext from "../context/authContext";
import { FcGoogle } from "react-icons/fc";
import Cookies from "js-cookie";


const Login = ({buttonName}) => {
  const { authenticated, logout } = useContext(AuthContext);
  const userInfo = authenticated ? JSON.parse(localStorage.getItem("userInfo")) : null;

  const bg = useColorModeValue("white", "black");
  const googleBorder = useColorModeValue("gray.300", "gray.600");
  const googleHover = useColorModeValue("gray.100", "gray.700");

  const mainBtnBg = useColorModeValue("black", "white");
  const mainBtnColor = useColorModeValue("white", "black");

  const toastBg = useColorModeValue("gray.100", "gray.800");
  const toastColor = useColorModeValue("black", "white");
  const toastBorder = useColorModeValue("gray.300", "gray.600");

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

  const showToast = (title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: 2500,
      isClosable: true,
      position: "top",
      containerStyle: {
        background: toastBg,
        color: toastColor,
        border: `1px solid ${toastBorder}`,
        borderRadius: "8px",
        padding: "10px",
      },
    });
  };

  const handleClose = () => {
    setMode("main");
    onClose();
  };

  // ---------------- SIGNUP ----------------
  const handleCreateAccount = async () => {
    if (signupData.password.length < 6) {
      return showToast(
        "Password too short",
        "Password must be at least 6 characters.",
        "warning"
      );
    }

    if (signupData.password !== signupData.confirmPassword) {
      return showToast(
        "Passwords do not match",
        "Password and confirm password must be the same.",
        "warning"
      );
    }

    try {
      const response = await fetch("https://smarttry.onrender.com/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Account Created", "Your account has been created.", "success");
        setMode("login");
      } else {
        showToast("Signup Failed", data.message || "Unable to create account.", "error");
      }
    } catch (error) {
      console.log(error);
      showToast("Network Error", "Something went wrong. Try again later.", "error");
    }
  };

  // ---------------- LOGIN ----------------
  const handleLogin = async () => {
    try {
      const response = await fetch("https://smarttry.onrender.com/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userInfo", JSON.stringify(data.user));

        Cookies.set("token", data.token, {
          expires: 7,
          secure: true,
          sameSite: "none",
        });

        showToast("Login Successful 🎉", "Welcome back!", "success");

        handleClose(); // close modal
      } else {
        showToast("Login Failed ❌", data.message || "Invalid credentials", "error");
      }
    } catch (error) {
      console.log(error)
      showToast("Network Error", "Unable to connect to server", "error");
    }
  };

  return (
    <Box>
      {/* BUTTON OR AVATAR */}
      {authenticated ? (<>
      
        <Menu>
    <MenuButton>
      <Avatar size="sm" name={userInfo?.photo||name} src="" cursor="pointer" />
    </MenuButton>

    <MenuList bg={bg}>
      <MenuItem bg={bg}>Profile</MenuItem>
      <MenuItem bg={bg}>Orders</MenuItem>
      <MenuItem bg={bg}>Settings</MenuItem>
      <MenuItem bg={bg} onClick={logout} color="red.400">
        {buttonName}
      </MenuItem>
    </MenuList>
  </Menu>
      </>) : (
        <Button
          bg={mainBtnBg}
          color={mainBtnColor}
          px="20px"
          borderRadius="md"
          _hover={{ opacity: 0.9 }}
          onClick={onOpen}   // FIXED
        >
          {buttonName}
        </Button>
      )}

      {/* MODAL */}
      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={bg} borderRadius="lg" p="20px" minW="350px">
          {/* MAIN */}
          {mode === "main" && (
            <VStack spacing={5}>
              <Text fontSize="xl" fontWeight="bold">
                Welcome to SM△RTTRY
              </Text>

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

              <Button w="100%" variant="outline" onClick={() => setMode("login")}>
                Login with Email
              </Button>
            </VStack>
          )}

          {/* SIGNUP */}
          {mode === "signup" && (
            <VStack spacing={4}>
              <Text fontSize="xl" fontWeight="bold">
                Create Account
              </Text>

              <Input
                placeholder="Name"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
              />
              <Input
                placeholder="Email"
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              />
              <Input
                placeholder="Password"
                type="password"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
              />
              <Input
                placeholder="Confirm Password"
                type="password"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  setSignupData({ ...signupData, confirmPassword: e.target.value })
                }
              />

              <Button w="100%" bg={mainBtnBg} color={mainBtnColor} onClick={handleCreateAccount}>
                Sign Up
              </Button>

              <Text fontSize="sm" color="blue.400" cursor="pointer" onClick={() => setMode("login")}>
                Already have an account? Login
              </Text>
              <Text fontSize="sm" cursor="pointer" onClick={() => setMode("main")}>
                ← Back
              </Text>
            </VStack>
          )}

          {/* LOGIN */}
          {mode === "login" && (
            <VStack spacing={4}>
              <Text fontSize="xl" fontWeight="bold">
                Login
              </Text>

              <Input
                placeholder="Email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
              <Input
                placeholder="Password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />

              <Button w="100%" bg={mainBtnBg} color={mainBtnColor} onClick={handleLogin}>
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
              <Text fontSize="sm" cursor="pointer" onClick={() => setMode("main")}>
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

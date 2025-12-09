import { Box, Button, Modal, ModalContent, ModalOverlay, useColorModeValue, useDisclosure } from "@chakra-ui/react"
import { useContext } from "react"
import AuthContext from "../context/authContext"
import {FcGoogle} from "react-icons/fc"

const Login = () => {
    const {authenticated, logout} = useContext(AuthContext);
    const bgColor = useColorModeValue("white","black");
    const textColor = useColorModeValue("black","white");
    const {isOpen, onOpen, onClose} = useDisclosure();
    return (
        <Box>
            {/* <Button
            bg={textColor}
            color={bgColor}
            border="1px solid"
            borderColor={textColor}
            _hover={{ bg: bgColor, color: textColor }}
            onClick={() =>
              authenticated
                ? logout()
                : (window.location.href =
                    "https://smarttry.onrender.com/auth/google")
            }
          >
            {authenticated ? "Logout" : "Signup"}
          </Button> */}

          <Button onClick={onOpen}>
            Sign up
          </Button>

          <Modal borderRadius="none" isOpen={isOpen} onClose={onClose}>
            <ModalOverlay/>
            <ModalContent>
                <Box p="10px">
                  <Box display={"flex"} justifyContent="center" flexDirection="column" cursor="pointer" onClick={()=>(window.location.href ="https://smarttry.onrender.com/auth/google")}>
                   <Box>Sign in with Google</Box> 
                   <Box><FcGoogle/></Box> 
                  </Box>
                  
                </Box>
            </ModalContent>
          </Modal>
        </Box>
    )
}

export default Login;
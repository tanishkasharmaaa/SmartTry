import { Box , useColorModeValue} from "@chakra-ui/react";
import { motion } from "framer-motion"; 

const TextRoll = ({children}) => {
    const bg = useColorModeValue("white", "black");
  const color = useColorModeValue("black", "white");

  return (
    <Box
      w="100%"
      overflow="hidden"
      whiteSpace="nowrap"
      position="relative"
      py={0.5}
      bg={bg}
      color={color}
      fontWeight="bold"
      fontSize={{ base: "3xl", md: "6xl", lg: "8xl" }}
    >
      <motion.div
        style={{ display: "inline-block" }}
        animate={{ x: ["0%", "-50%"] }} // Move left continuously
        transition={{
          repeat: Infinity,
          duration: 30, // Adjust speed here
          ease: "linear",
        }}
      >
        {children.repeat(10)}
      </motion.div>
    </Box>
  );
};

export default TextRoll;

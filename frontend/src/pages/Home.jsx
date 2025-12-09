import { Box, Image, Text } from "@chakra-ui/react";
import { useState } from "react";
import TextRoll from "../components/textRoll";

const Home = () => {
  const [hover, setHover] = useState(false);
  const firstText = "Explore The Latest Fashion Trends  • ";

  return (
    <Box>
      <Box
        w="100%"
        h={{ base: "300px", md: "450px", lg: "600px" }}
        position="relative"
        overflow="hidden"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        transition="0.4s ease"
      >
        {/* Banner Image */}
        <Image
          src="/banner1.jpg"
          w="100%"
          h="100%"
          objectFit="cover"
          objectPosition="center"
          filter={hover ? "brightness(40%)" : "brightness(100%)"}
          transition="0.4s ease"
        />

        {/* Center text + button container */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap="25px" // space between text & button
          opacity={hover ? 1 : 0}
          transition="opacity 0.6s ease"
          zIndex={10}
        >
          {/* Text */}
          <Text
            fontSize={{ base: "3xl", md: "5xl", lg: "7xl", xl: "8xl" }}
            fontWeight="800"
            color="white"
            letterSpacing={{ base: "3px", md: "6px", lg: "10px" }}
            textShadow="0 0 25px rgba(0,0,0,0.8)"
          >
            Welcome to SM△RTTRY
          </Text>

          {/* Button */}
          <Box
            as="button"
            px="30px"
            py="14px"
            bg="white"
            color="black"
            fontWeight="bold"
            borderRadius="md"
            fontSize={{ base: "base", md: "md", lg: "lg" }}
            cursor="pointer"
            transition="0.3s"
            _hover={{ transform: "scale(1.08)" }}
          >
            Shop Now
          </Box>
        </Box>
      </Box>
      <Box
        textAlign="center"
        fontSize={{ base: "4xl", md: "6xl" }}
        fontWeight="bold"
        letterSpacing="4px"
      >
        <TextRoll center>{firstText}</TextRoll>
      </Box>

      <Box>
        <Box
          w="100%"
          h={{ base: "300px", md: "450px", lg: "600px" }}
          position="relative"
          overflow="hidden"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          transition="0.4s ease"
        >
          {/* Banner Image */}
          <Image
            src="/banner2.jpg"
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition="center"
            filter={hover ? "brightness(40%)" : "brightness(100%)"}
            transition="0.4s ease"
          />
          <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap="25px" // space between text & button
          opacity={hover ? 1 : 0}
          transition="opacity 0.6s ease"
          zIndex={10}
        >
          {/* Text */}
          <Text
            fontSize={{ base: "3xl", md: "5xl", lg: "7xl" }}
            fontWeight="700"
            color="white"
            letterSpacing={{ base: "3px", md: "6px", lg: "10px" }}
            textShadow="0 0 25px rgba(0,0,0,0.8)"
          >
            Discover All Men Trendy Clothes
          </Text>

          {/* Button */}
          <Box
            as="button"
            px="20px"
            py="14px"
            bg="white"
            color="black"
            fontWeight="bold"
            borderRadius="md"
            fontSize={{ base: "base", md: "md", lg: "lg" }}
            cursor="pointer"
            transition="0.3s"
            _hover={{ transform: "scale(1.08)" }}
          >
            Explore now
          </Box>
        </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;

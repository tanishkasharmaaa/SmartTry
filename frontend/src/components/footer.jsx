import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Link,
  Input,
  Button,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";

const Footer = () => {
  const bg = useColorModeValue("gray.100", "gray.900");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const inputBg = useColorModeValue("white", "gray.700");
  const buttonBg = useColorModeValue("black", "white");
  const buttonColor = useColorModeValue("white", "black");

  return (
    <Box bg={bg} color={textColor} mt={10} pt={10} pb={6}>
      {/* Top Section */}
      <Flex
        direction={{ base: "column", md: "row" }}
        maxW="1200px"
        mx="auto"
        px={6}
        justify="space-between"
        mb={10}
      >
        {/* About */}
        <VStack align="start" mb={{ base: 6, md: 0 }}>
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            About
          </Text>
          <Link href="#">Company Info</Link>
          <Link href="#">Careers</Link>
          <Link href="#">Press & News</Link>
          <Link href="#">Policies</Link>
        </VStack>

        {/* Help */}
        <VStack align="start" mb={{ base: 6, md: 0 }}>
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            Help
          </Text>
          <Link href="#">Customer Service</Link>
          <Link href="#">Shipping</Link>
          <Link href="#">Returns</Link>
          <Link href="#">FAQ</Link>
        </VStack>

        {/* Quick Links */}
        <VStack align="start" mb={{ base: 6, md: 0 }}>
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            Quick Links
          </Text>
          <Link href="#">Gift Cards</Link>
          <Link href="#">Affiliate Program</Link>
          <Link href="#">Promotions</Link>
          <Link href="#">Loyalty Program</Link>
        </VStack>

        {/* Newsletter */}
        <VStack align="start" w={{ base: "100%", md: "250px" }}>
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            Subscribe to our Newsletter
          </Text>
          <HStack w="100%">
            <Input
              placeholder="Enter your email"
              bg={inputBg}
              borderRadius="md"
              size="sm"
            />
            <Button bg={buttonBg} color={buttonColor} size="sm">
              Subscribe
            </Button>
          </HStack>
          <Text fontSize="sm" mt={2}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Text>
        </VStack>
      </Flex>

      <Stack
        direction={{ base: "column", md: "row" }}
        maxW="1200px"
        mx="auto"
        px={6}
        justify="space-between"
        align="center"
        pt={6}
        borderTop="1px solid"
        borderColor={useColorModeValue("gray.300", "gray.700")}
      >
        <Text fontSize="sm">© {new Date().getFullYear()} Lorem Inc. All rights reserved.</Text>

        <HStack spacing={4}>
          <Link href="https://github.com/tanishkasharmaaa/SmartTry">Github</Link>
          <Link href="https://www.linkedin.com/in/tanishka-304953274/">LinkedIn</Link>
          <Link href="#">Twitter</Link>
          <Link href="#">Instagram</Link>
          
        </HStack>
      </Stack>
    </Box>
  );
};

export default Footer;

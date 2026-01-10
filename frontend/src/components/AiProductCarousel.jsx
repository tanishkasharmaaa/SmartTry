import { Box, Flex, Image, Text, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function ProductCarousel({ products }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const subText = useColorModeValue("gray.600", "gray.400");

  const navigate = useNavigate();

  return (
    // ⬇️ FIXED HEIGHT WRAPPER (IMPORTANT)
    <Box h="220px" position="relative" my="2">
      <Flex
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="220px"
        overflowX="auto"
        overflowY="hidden"
        gap="3"
        px="2"
        py="2"
      >
        {products.map((product) => (
          <Box
            key={product._id}
            w="150px"
            h="200px"
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            p="2"
            bg={cardBg}
            flexShrink={0}
            cursor="pointer"
            onClick={() =>
              navigate(`/products/${product._id}-${product.name}`)
            }
          >
            {/* FIXED IMAGE HEIGHT */}
            <Image
              src={product.image}
              alt={product.name}
              borderRadius="md"
              objectFit="cover"
              h="100px"
              w="full"
              loading="lazy"
            />

            <Text fontWeight="bold" mt="2" fontSize="sm" noOfLines={1}>
              {product.name}
            </Text>

            <Text color="green.500" fontSize="sm">
              ₹{product.price}
            </Text>

            <Text fontSize="xs" color={subText} noOfLines={2}>
              {product.description}
            </Text>
          </Box>
        ))}
      </Flex>
    </Box>
  );
}

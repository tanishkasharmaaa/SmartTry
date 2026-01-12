import { Box, Image, Text, VStack, Badge, useColorModeValue,Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function OrderItemsCarousel({ items = [],orderId }) {
    console.log(orderId,items)
  // Theme-safe colors
  const bg = useColorModeValue("white", "gray.900");          // Card background
  const borderColor = useColorModeValue("gray.400", "gray.500");
  const textColor = useColorModeValue("black", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const badgeBg = useColorModeValue("gray.200", "gray.700");  // Badge background
  const badgeTextColor = useColorModeValue("black", "white");

  const navigate = useNavigate();
  if (!items.length) return null;

  return (
    <Box
      display="flex"
      gap="3"
      overflowX="auto"
      pb="2"
      css={{
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {items.map((item, index) => (
        <Box
          key={index}
          minW="160px"
          maxW="160px"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          p="2"
          bg={bg}
          boxShadow="sm"
          _hover={{
            borderColor: borderColor,
            boxShadow: "md",
          }}
        >
          {/* Product Image */}
          <Box position="relative" h="90px" w="100%" mb="2" borderRadius="md" overflow="hidden">
            <Image
              src={item?.productSnapshot.image}
              alt={item?.productSnapshot.name}
              h="100%"
              w="100%"
              objectFit="cover"
              
            />
          </Box>

          <VStack spacing="1" align="start">
            {/* Product Name */}
            <Text fontSize="sm" fontWeight="semibold" noOfLines={2} color={textColor}>
              {item?.productSnapshot.name}
            </Text>

            {/* Price */}
            <Text fontSize="xs" color={subTextColor}>
              ₹{item?.productSnapshot.price}
            </Text>

            {/* Size */}
            <Text fontSize="xs" color={subTextColor}>
              {item?.productSnapshot.size}
            </Text>

            {/* Quantity */}
            {item.quantity && (
              <Badge
                bg={badgeBg}
                color={badgeTextColor}
                fontSize="0.65rem"
              >
                Qty: {item.quantity}
              </Badge>
            )}
            <Button variant="outline"
              size="sm" onClick={() => navigate(`/orderDetails/${orderId}`)}>View Order</Button>
          </VStack>
        </Box>
      ))}
    </Box>
  );
}

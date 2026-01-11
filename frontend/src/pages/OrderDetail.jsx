import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Spinner,
  Image,
  Divider,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Button,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import TrackingSlider from "../components/TrackingSlider";

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  console.log(orderId);
  const bgPage = useColorModeValue("#f5f5f5", "#0b0b0b");
  const bgCard = useColorModeValue("#ffffff", "#1a1a1a");
  const borderColor = useColorModeValue("#e0e0e0", "#333");
  const textSecondary = useColorModeValue("#555", "#aaa");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/order/${orderId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await res.json();
        console.log(data, "----------");
        setOrder(data.order);
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <Flex h="80vh" align="center" justify="center" bg={bgPage}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!order) {
    return (
      <Flex h="80vh" align="center" justify="center" bg={bgPage}>
        <Text>Order not found</Text>
      </Flex>
    );
  }

  return (
    <Box bg={bgPage} minH="100vh" py={6}>
      <VStack spacing={6} maxW="1000px" mx="auto" px={4}>
        {/* 🔹 HEADER */}
        <Box
          w="100%"
          bg={bgCard}
          p={6}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
        >
          <Flex justify="space-between" wrap="wrap">
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold">
                Order #{order._id.slice(-8)}
              </Text>
              <Text fontSize="sm" color={textSecondary}>
                Placed on {new Date(order.placedAt).toDateString()}
              </Text>
            </VStack>
            <Box
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Badge
                px={4}
                py={1}
                borderRadius="full"
                colorScheme={
                  order.orderStatus === "Delivered"
                    ? "green"
                    : order.orderStatus === "Cancelled"
                    ? "red"
                    : "gray"
                }
              >
                {order.orderStatus}
              </Badge>
            </Box>
          </Flex>
        </Box>

        {/* 🔹 TRACKING */}
        <Box
          w="100%"
          bg={bgCard}
          p={6}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
        >
          <TrackingSlider trackingHistory={order.trackingHistory} autoScroll />
        </Box>

        {/* 🔹 ITEMS */}
        <Box
          w="100%"
          bg={bgCard}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
        >
          <VStack spacing={0} align="stretch">
            {order.items.map((item, idx) => (
              <Box key={idx} p={5}>
                <Flex gap={4}>
                  <Image
                    src={
                      item.productSnapshot.image ||
                      "https://via.placeholder.com/120"
                    }
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                  />

                  <Flex direction="column" justify="space-between">
                    <Text fontWeight="semibold" noOfLines={2}>
                      {item.productSnapshot.name}
                    </Text>

                    <Text fontSize="sm" color={textSecondary}>
                      Size: {item.size} • Qty: {item.quantity}
                    </Text>

                    <Text fontWeight="bold">₹{item.priceAtOrder}</Text>
                  </Flex>
                </Flex>

                {idx !== order.items.length - 1 && (
                  <Divider mt={4} borderColor={borderColor} />
                )}
                <Box display={"flex"} flexDirection={"row-reverse"}>
                  <Button
                    variant="outline"
                    size="sm"
                    borderColor={borderColor}
                    onClick={() =>
                      window.location.assign(
                        `/products/${item.productSnapshot.name}-${item.productsId._id}`
                      )
                    }
                  >
                    View Product
                  </Button>
                </Box>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* 🔹 ORDER SUMMARY */}
        <Box
          w="100%"
          bg={bgCard}
          p={6}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
        >
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between">
              <Text color={textSecondary}>Payment Method</Text>
              <Text fontWeight="medium">{order.paymentProvider}</Text>
            </Flex>

            <Divider borderColor={borderColor} />

            <Flex justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                Order Total
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                ₹{order.totalAmount}
              </Text>
            </Flex>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default OrderDetail;

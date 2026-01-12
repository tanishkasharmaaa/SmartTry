import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  Image,
  Divider,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import TrackingSlider from "../components/TrackingSlider";
import {useToast} from "../context/useToast"
import { useNavigate } from "react-router-dom";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const bgCard = useColorModeValue("#fff", "#1a1a1a"); // white for light mode, dark grey for dark mode
  const bgPage = useColorModeValue("#f5f5f5", "#0b0b0b"); // grey page background
  const borderColor = useColorModeValue("#e0e0e0", "#333"); // grey borders
  const textPrimary = useColorModeValue("#000", "#fff"); // main text
  const textSecondary = useColorModeValue("#555", "#aaa"); // secondary text

  const navigate = useNavigate()
  
  const {showToast} = useToast()
  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/order`,{
          method:"GET",
          credentials:"include",
          headers:{
            "Content-Type":"application/json"
          }
        });
        const data = await res.json();
        console.log(data);
        setOrders(data.orders)
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/order/cancel/${orderId}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to cancel order");
    }

    // ✅ Update order status + tracking history
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId
          ? {
              ...order,
              orderStatus: "Cancelled",
              trackingHistory: [
                ...(order.trackingHistory || []),
                {
                  status: "Cancelled",
                  updatedAt: new Date().toISOString(),
                },
              ],
            }
          : order
      )
    );

    showToast({
      title: "Order Cancelled",
      description: "Your order has been successfully cancelled.",
      status: "success",
    });
  } catch (error) {
    console.error("Failed to cancel order:", error);

    showToast({
      title: "Cancellation Failed",
      description: error.message || "Something went wrong.",
      status: "error",
    });
  }
};


  if (loading) {
    return (
      <Flex justify="center" align="center" h="80vh" bg={bgPage}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!orders.length) {
    return (<Flex
      direction="column"
      justify="center"
      align="center"
      h="80vh"
      bg={bgPage}
      gap={4} // spacing between text and button
    >
      <Text fontWeight="bold" fontSize="2xl">
        Your order history is empty
      </Text>
      <Button variant="outline"
              size="sm"
              borderColor={'grey'} onClick={() => navigate("/")}>
        Back To Home
      </Button>
    </Flex>
    );
  }

  return (
   <Box bg={bgPage} minH="100vh" py={6}>
    <VStack spacing={6} maxW="1200px" mx="auto" px={4}>
      {orders.map((order) => (
        <Box
          key={order._id}
          w="100%"
          bg={bgCard}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="8px"
          overflow="hidden"
        >
          {/* 🔹 ORDER HEADER */}
          <Flex
            bg={bgCard}
            px={6}
            py={4}
            justify="space-between"
            align="center"
            wrap="wrap"
          >
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="xs" color={textSecondary}>
                ORDER PLACED
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                {new Date(order.placedAt).toDateString()}
              </Text>
            </VStack>

            <VStack align="flex-start" spacing={0}>
              <Text fontSize="xs" color={textSecondary}>
                ORDER ID
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                #{order.shortId}
              </Text>
            </VStack>

            <Badge
              px={3}
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
          </Flex>

          {/* 🔹 ITEMS */}
          <VStack align="stretch" spacing={4} px={6} py={5}>
            {order.items.map((item) => (
              <Flex key={item?.productsId?._id} gap={4}>
                <Image
                  src={item.productSnapshot.image || "https://via.placeholder.com/120"}
                  boxSize="90px"
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

                  <Text fontWeight="bold">
                    ₹{item.productSnapshot.price}
                  </Text>
                </Flex>
              </Flex>
            ))}
          </VStack>

          {/* 🔹 TRACKING */}
          <Box px={6} pb={4}>
            <TrackingSlider trackingHistory={order.trackingHistory} />
          </Box>

          <Divider borderColor={borderColor} />

          {/* 🔹 FOOTER */}
          <Flex
            px={6}
            py={4}
            justify="space-between"
            align="center"
            wrap="wrap"
          >
            <Text fontWeight="bold" fontSize="lg">
              Order Total: ₹{order.totalAmount}
            </Text>
            <Button
              variant="outline"
              size="sm"
              color={'red.500'}
              borderColor={borderColor}
              onClick={() => handleCancelOrder(order._id)}
            >
              Cancel Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              borderColor={borderColor}
              onClick={() => window.location.assign(`/orderDetails/${order._id}`)}
            >
              View Order Details
            </Button>
          </Flex>
        </Box>
      ))}
    </VStack>
  </Box>
  );
};

export default OrderHistory;

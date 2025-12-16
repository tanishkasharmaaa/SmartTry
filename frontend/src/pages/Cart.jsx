import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/authContext";
import {
  Box,
  Text,
  Image,
  VStack,
  HStack,
  Divider,
  Spinner,
  Button,
  Flex,
  useColorModeValue,
  Select
} from "@chakra-ui/react";
import Login from "../components/login";
import { Link } from "react-router-dom";
import { FiShoppingCart } from "react-icons/fi";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const { authenticated, user } = useContext(AuthContext);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const btnBg = useColorModeValue("black", "white");
  const btnColor = useColorModeValue("white", "black");
  const btnHover = useColorModeValue("gray.800", "gray.200");

  useEffect(() => {
    if (!authenticated) return;

    const fetchCartItems = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://smarttry.onrender.com/api/cart", {
          credentials: "include",
        });
        const data = await res.json();
        console.log(data)
        setCartItems(data.cartItems || []);
        setTotalAmount(data.totalAmount || 0);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [authenticated, user]);

  if (!authenticated) return <Login buttonName="Login to view cart" />;

  if (loading)
    return (
      <Box textAlign="center" py={16}>
        <Spinner size="xl" />
      </Box>
    );

  return (
    <Box bg={pageBg} minH="100vh" pb={{ base: "110px", md: 0 }}>
      {/* HEADER */}
      <Box px={{ base: 4, md: 8 }} py={6}>
        <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
          Shopping Cart
        </Text>
      </Box>

      <Flex
        direction={{ base: "column", md: "row" }}
        gap={6}
        px={{ base: 4, md: 8 }}
      >
        {/* CART ITEMS */}
        <Box flex="3">
          {!cartItems.length ? (
            <Flex minH="60vh" align="center" justify="center">
              <VStack spacing={4} textAlign="center">
                <Box p={6} bg={cardBg} borderRadius="full">
                  <FiShoppingCart size={48} />
                </Box>

                <Text fontSize="xl" fontWeight="bold">
                  Your cart is empty
                </Text>

                <Text fontSize="sm" color={mutedText}>
                  Add items to see them here
                </Text>

                <Button
                  bg={btnBg}
                  color={btnColor}
                  _hover={{ bg: btnHover }}
                  onClick={() => (window.location.href = "/")}
                >
                  Continue Shopping
                </Button>
              </VStack>
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              {cartItems.map((item,index) => (
                <Box
                  key={index}
                  bg={cardBg}
                  p={{ base: 3, md: 4 }}
                  borderRadius="md"
                  boxShadow="sm"
                  overflow="hidden"
                >
                  <Flex
                    gap={4}
                    direction={{ base: "column", sm: "row" }}
                    align="flex-start"
                  >
                    {/* IMAGE */}
                    <Image
                      src={item.image}
                      alt={item.productsId?.name}
                      w={{ base: "100%", sm: "120px" }}
                      h={{ base: "220px", sm: "120px" }}
                      objectFit="contain"
                      bg={cardBg}
                      borderRadius="md"
                      flexShrink={0}
                    />

                    {/* CONTENT */}
                    <Box flex="1" minW={0}>
                      {/* TITLE */}
                      <Text
                        fontSize={{ base: "md", md: "lg" }}
                        fontWeight="semibold"
                        color={textColor}
                        noOfLines={2}
                        wordBreak="break-word"
                      >
                        {item.productsId?.name}
                      </Text>

                      {/* META */}
                      <Text fontSize="sm" color={mutedText} mt={1}>
                        Size: {item.size} · Qty: {item.quantity}
                      </Text>

                      {/* PRICE */}
                      <Text fontWeight="bold" mt={2}>
                        ₹{item.priceAtAdd * item.quantity}
                      </Text>

                      {/* SIZE & QUANTITY */}
                      <HStack mt={3} spacing={4} flexWrap="wrap">
                        {/* SIZE */}
                        <Box>
                          <Text fontSize="xs" color={mutedText} mb={1}>
                            Size
                          </Text>
                          <Select size="sm" value={item.size} maxW="100px">
                            {item.productsId?.sizes?.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </Select>
                        </Box>

                        {/* QUANTITY */}
                        <Box>
                          <Text fontSize="xs" color={mutedText} mb={1}>
                            Qty
                          </Text>
                          <Select size="sm" value={item.quantity} maxW="80px">
                            {[1, 2, 3, 4, 5].map((qty) => (
                              <option key={qty} value={qty}>
                                {qty}
                              </option>
                            ))}
                          </Select>
                        </Box>
                      </HStack>

                      {/* ACTIONS */}
                      <HStack spacing={4} mt={3} wrap="wrap">
                        <Button size="xs" variant="link" colorScheme="blue">
                          Delete
                        </Button>

                        <Button size="xs" variant="link" colorScheme="blue">
                          Save for later
                        </Button>

                        <Link to={`/product/${item.productsId?._id}`}>
                          <Button size="xs" variant="link">
                            View product
                          </Button>
                        </Link>
                      </HStack>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        {/* ORDER SUMMARY (DESKTOP) */}
        {cartItems.length > 0 && (
          <Box
            flex="1"
            bg={cardBg}
            p={5}
            borderRadius="md"
            boxShadow="md"
            position="sticky"
            top="100px"
            display={{ base: "none", md: "block" }}
          >
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              Order Summary
            </Text>

            <HStack justify="space-between">
              <Text color={mutedText}>Subtotal ({cartItems.length} items)</Text>
              <Text fontWeight="medium">₹{totalAmount}</Text>
            </HStack>

            <Divider my={4} />

            <Button
              w="100%"
              bg={btnBg}
              color={btnColor}
              size="lg"
              _hover={{ bg: btnHover }}
            >
              Proceed to Buy
            </Button>
          </Box>
        )}
      </Flex>

      {/* MOBILE CHECKOUT BAR */}
      {cartItems.length > 0 && (
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg={cardBg}
          px={4}
          py={3}
          boxShadow="0 -4px 12px rgba(0,0,0,0.1)"
          display={{ base: "block", md: "none" }}
        >
          <HStack justify="space-between">
            <Box>
              <Text fontSize="sm" color={mutedText}>
                Total
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                ₹{totalAmount}
              </Text>
            </Box>

            <Button bg={btnBg} color={btnColor} _hover={{ bg: btnHover }}>
              Buy Now
            </Button>
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default Cart;

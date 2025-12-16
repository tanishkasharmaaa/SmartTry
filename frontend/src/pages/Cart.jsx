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
  Select,
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

  // ---------------- FETCH CART ----------------
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
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [authenticated, user]);

  // ---------------- UPDATE CART ITEM ----------------
  const updateCartItem = async (cartItemId, updates) => {
    console.log(user.userId , cartItemId)
  try {
    const res = await fetch(
      `https://smarttry.onrender.com/api/update-cartItem/${user.userId}/${cartItemId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update cart");
    }

    setCartItems(data.cartItems);
    setTotalAmount(data.totalAmount);
  } catch (err) {
    console.error("Update cart failed:", err.message);
  }
};

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

      <Flex direction={{ base: "column", md: "row" }} gap={6} px={{ base: 4, md: 8 }}>
        {/* CART ITEMS */}
        <Box flex="3">
          {!cartItems.length ? (
            <Flex minH="60vh" align="center" justify="center">
              <VStack spacing={4} textAlign="center">
                <Box p={6} bg={cardBg} borderRadius="full">
                  <FiShoppingCart size={48} />
                </Box>
                <Text fontSize="xl" fontWeight="bold">Your cart is empty</Text>
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
              {cartItems.map((item) => (
                <Box
                  key={item._id}
                  bg={cardBg}
                  p={4}
                  borderRadius="md"
                  boxShadow="sm"
                >
                  <Flex gap={4} direction={{ base: "column", sm: "row" }}>
                    {/* IMAGE */}
                    <Image
                      src={item.product?.image}
                      alt={item.productsId?.name}
                      w={{ base: "100%", sm: "120px" }}
                      h={{ base: "220px", sm: "120px" }}
                      objectFit="contain"
                      borderRadius="md"
                    />

                    {/* CONTENT */}
                    <Box flex="1">
                      <Text fontWeight="semibold" fontSize="lg" color={textColor}>
                        {item?.product?.name}
                      </Text>

                      <Text fontSize="sm" color={mutedText}>
                        Size: {item.size} · Qty: {item.quantity}
                      </Text>

                      <Text fontWeight="bold" mt={2}>
                        ₹{item.priceAtAdd * item.quantity}
                      </Text>

                      {/* SIZE & QTY */}
                      <HStack mt={3} spacing={4}>
                        {/* SIZE */}
                        <Box>
                          <Text fontSize="xs" color={mutedText}>Size</Text>
                          <Select
                            size="sm"
                            value={item.size}
                            onChange={(e) =>
                              updateCartItem(item._id, { size: e.target.value })
                            }
                          >
                            {Object.entries(
                              item.product?.stockId?.currentStock || {}
                            ).map(([size, qty]) => (
                              <option key={size} value={size} disabled={qty === 0}>
                                {size} {qty === 0 ? "(Out of Stock)" : ""}
                              </option>
                            ))}
                          </Select>
                        </Box>

                        {/* QTY */}
                        <Box>
                          <Text fontSize="xs" color={mutedText}>Qty</Text>
                          <Select
                            size="sm"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartItem(item._id, {
                                quantity: Number(e.target.value),
                              })
                            }
                          >
                            {Array.from(
                              {
                                length:
                                  item.product?.stockId?.currentStock?.[item.size] || 1,
                              },
                              (_, i) => i + 1
                            ).map((qty) => (
                              <option key={qty} value={qty}>
                                {qty}
                              </option>
                            ))}
                          </Select>
                        </Box>
                      </HStack>

                      {/* ACTIONS */}
                      <HStack spacing={4} mt={3}>
                        <Button size="xs" variant="link" colorScheme="red">
                          Delete
                        </Button>
                        <Link to={`/products/${item.product?._id}-${item.product?.name}`}>
                          <Button size="xs" variant="link">View product</Button>
                        </Link>
                      </HStack>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        {/* ORDER SUMMARY */}
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
              <Text color={mutedText}>Subtotal</Text>
              <Text fontWeight="medium">₹{totalAmount}</Text>
            </HStack>

            <Divider my={4} />

            <Button w="100%" bg={btnBg} color={btnColor} _hover={{ bg: btnHover }}>
              Proceed to Buy
            </Button>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default Cart;

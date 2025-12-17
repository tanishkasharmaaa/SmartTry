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
  const [pendingUpdates, setPendingUpdates] = useState({});

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
        setCartItems(data.cartItems || []);
        setTotalAmount(data.totalAmount || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [authenticated, user]);

  // ---------------- UPDATE CART ITEM ----------------
  const updateCartItem = async (cartItemId, updates) => {
    try {
      const res = await fetch(
        `https://smarttry.onrender.com/api/cart/update-cartItem/${cartItemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updates),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCartItems(data.cartItems);
      setTotalAmount(data.totalAmount);

      // remove pending draft after success
      setPendingUpdates((prev) => {
        const copy = { ...prev };
        delete copy[cartItemId];
        return copy;
      });
    } catch (err) {
      console.error("Update failed:", err.message);
    }
  };

  const handleDeleteCartItem = async (cartItemId) => {
    try {
      const res = await fetch(
        `https://smarttry.onrender.com/api/cart/remove-cartItem/${cartItemId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCartItems(data.cart.items || []);
      setTotalAmount(data.cart.totalAmount || 0);
    } catch (error) {
      console.error("Delete cart item failed:", error.message);
    }
  };

  const getEditableItem = (item) => {
    return (
      pendingUpdates[item._id] || {
        size: item.size,
        quantity: item.quantity,
      }
    );
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

      <Flex
        flex="3"
        maxH={{ base: "auto", md: "80vh" }} // 70% of viewport height on desktop
        overflowY={{ base: "visible", md: "auto" }} // scroll only on desktop
        pb={4}
      >
        {/* CART ITEMS */}
        <Box
          flex="3"
          overflowX="auto" // scroll for all screens
          whiteSpace="nowrap"
          pb={4}
        >
          {!cartItems.length ? (
            <Flex minH="60vh" align="center" justify="center">
              <VStack spacing={4}>
                <Box p={6} bg={cardBg} borderRadius="full">
                  <FiShoppingCart size={48} />
                </Box>
                <Text fontWeight="bold">Your cart is empty</Text>
              </VStack>
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              {cartItems.map((item) => {
                const editable = getEditableItem(item);

                return (
                  <Box
                    key={item._id}
                    bg={cardBg}
                    p={4}
                    borderRadius="md"
                    flex="3"
                    maxH="70vh"
                    overflowY="auto"
                    pr={2}
                  >
                    <Flex gap={4} direction={{ base: "column", sm: "row" }}>
                      <Image
                        src={item.product?.image}
                        w={{ base: "100%", sm: "120px" }}
                        h={{ base: "220px", sm: "120px" }}
                        objectFit="contain"
                      />

                      <Box flex="1">
                        <Text fontWeight="semibold">
                          {item.productsId?.name}
                        </Text>

                        <Text fontSize="sm" color={mutedText}>
                          Size: {item.size} · Qty: {item.quantity}
                        </Text>

                        <Text fontWeight="bold" mt={2}>
                          ₹{item.priceAtAdd * editable.quantity}
                        </Text>

                        {/* SIZE & QTY */}
                        <HStack mt={3} spacing={4}>
                          <Box>
                            <Text fontSize="xs">Size</Text>
                            <Select
                              size="sm"
                              value={editable.size}
                              onChange={(e) =>
                                setPendingUpdates((prev) => ({
                                  ...prev,
                                  [item._id]: {
                                    ...editable,
                                    size: e.target.value,
                                  },
                                }))
                              }
                            >
                              {Object.entries(
                                item.product?.stockId?.currentStock || {}
                              ).map(([size, qty]) => (
                                <option
                                  key={size}
                                  value={size}
                                  disabled={qty === 0}
                                >
                                  {size} {qty === 0 && "(Out)"}
                                </option>
                              ))}
                            </Select>
                          </Box>

                          <Box>
                            <Text fontSize="xs">Qty</Text>
                            <Select
                              size="sm"
                              value={editable.quantity}
                              onChange={(e) =>
                                setPendingUpdates((prev) => ({
                                  ...prev,
                                  [item._id]: {
                                    ...editable,
                                    quantity: Number(e.target.value),
                                  },
                                }))
                              }
                            >
                              {Array.from(
                                {
                                  length:
                                    item.product?.stockId?.currentStock?.[
                                      editable.size
                                    ] || 1,
                                },
                                (_, i) => i + 1
                              ).map((q) => (
                                <option key={q} value={q}>
                                  {q}
                                </option>
                              ))}
                            </Select>
                          </Box>
                        </HStack>

                        {/* UPDATE BUTTON */}

                        <Flex gap={2} mt={3} align="center">
                          {/* Update Button */}
                          <Button
                            size="sm"
                            bg={btnBg}
                            color={btnColor}
                            _hover={{ bg: btnHover }}
                            isDisabled={
                              editable.size === item.size &&
                              editable.quantity === item.quantity
                            }
                            onClick={() =>
                              updateCartItem(item._id, pendingUpdates[item._id])
                            }
                          >
                            Update
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            colorScheme='red'
                            onClick={() => handleDeleteCartItem(item._id)}
                          >
                            Delete
                          </Button>

                          {/* View Product */}
                          <Link
                            to={`/products/${item.product?._id}-${item.product?.name}`}
                          >
                            <Button size="xs" variant="link">
                              View product
                            </Button>
                          </Link>
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>

        {/* SUMMARY */}
        {/* SUMMARY - Desktop */}
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
            <Text fontWeight="semibold">Order Summary</Text>
            <Divider my={3} />
            <HStack justify="space-between">
              <Text>Subtotal</Text>
              <Text fontWeight="bold">₹{totalAmount}</Text>
            </HStack>
            <Button mt={4} w="100%" bg={btnBg} color={btnColor}>
              Proceed to Buy
            </Button>
          </Box>
        )}
      </Flex>

      {/* SUMMARY - Mobile Bottom Bar */}
      {cartItems.length > 0 && (
        <Flex
          display={{ base: "flex", md: "none" }}
          position="fixed"
          bottom="0"
          left="0"
          right="0"
          bg={cardBg}
          p={4}
          justify="space-between"
          align="center"
          boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
          zIndex={20}
        >
          <Text fontWeight="bold">Subtotal: ₹{totalAmount}</Text>
          <Button bg={btnBg} color={btnColor} _hover={{ bg: btnHover }}>
            Proceed to Buy
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default Cart;

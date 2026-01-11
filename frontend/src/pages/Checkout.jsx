import {
  Box,
  Grid,
  GridItem,
  Heading,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  Stack,
  Divider,
  Flex,
  Text,
  Image,
  useColorModeValue,
  CloseButton,
} from "@chakra-ui/react";
import {useState,useEffect} from "react";
import { useToast } from "../context/useToast";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 🎨 Theme-based colors (BLACK / GREY / WHITE ONLY)
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textPrimary = useColorModeValue("gray.900", "gray.100");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const buttonBg = useColorModeValue("gray.900", "gray.100");
  const buttonText = useColorModeValue("white", "gray.900");
  const buttonHover = useColorModeValue("gray.700", "gray.300");

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  });

 const [cartItems] = useState(() => {
  const checkoutType = localStorage.getItem("checkoutType");

  if (checkoutType === "BUY_NOW") {
    const buyNow = localStorage.getItem("buyNowProduct");
    console.log("Buy Now Item:", buyNow);
    return buyNow ? JSON.parse(buyNow) : [];
  }

  // CART_ORDER (default)
  const saved = localStorage.getItem("selectedCartItems");
  return saved ? JSON.parse(saved) : [];
});

  const total = cartItems.some((item) => item.priceAtAdd && item.quantity)
    ? cartItems.reduce((acc, item) => acc + item.priceAtAdd * item.quantity, 0)
    : 0;

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = () => {
    if (
      !address.name ||
      !address.phone ||
      !address.addressLine1 ||
      !address.city ||
      !address.state ||
      !address.postalCode
    ) {
      return showToast({
        title: "Incomplete Address",
        description: "Please fill in all required address fields.",
        type: "error",
      });
    }
     
    localStorage.setItem("deliveryAddress", JSON.stringify(address))
    showToast({
      title: "Order Placed",
      description: "Your order has been placed successfully.",
      type: "success",
    });
    navigate("/order")
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = cartItems.filter((item) => item._id !== itemId);
    localStorage.setItem("selectedCartItems", JSON.stringify(updatedItems));
    navigate("/");
  };

  useEffect(() => {
    if (cartItems.length === 0) {
      showToast({
        title: "No Items to Checkout",
        description: "Please add items to your cart before checking out.",
        type: "warning",
      });
      navigate("/");
    }
  })
  
  return (
    <Box bg={pageBg} minH="100vh" py={8}>
      <Box maxW="1200px" mx="auto" px={4}>
        <Heading fontSize="2xl" mb={6} color={textPrimary}>
          Checkout
        </Heading>

        <Grid templateColumns={{ base: "1fr", md: "2.5fr 1fr" }} gap={6}>
          {/* LEFT SECTION */}
          <GridItem>
            <Box bg={cardBg} border="1px solid" borderColor={borderColor} p={6}>
              <Heading fontSize="lg" mb={4} color={textPrimary}>
                Delivery Address
              </Heading>

              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color={textSecondary}>Full Name</FormLabel>
                  <Input
                    name="name"
                    value={address.name}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textSecondary}>Phone Number</FormLabel>
                  <Input
                    name="phone"
                    value={address.phone}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textSecondary}>Address</FormLabel>
                  <Textarea
                    name="addressLine1"
                    value={address.addressLine1}
                    onChange={handleChange}
                  />
                </FormControl>

                <Input
                  placeholder="Landmark (optional)"
                  name="addressLine2"
                  value={address.addressLine2}
                  onChange={handleChange}
                />

                <Grid templateColumns="1fr 1fr" gap={4}>
                  <Input
                    placeholder="City"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                  />
                  <Input
                    placeholder="State"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                  />
                </Grid>

                <Input
                  placeholder="Pincode"
                  name="postalCode"
                  value={address.postalCode}
                  onChange={handleChange}
                />
              </Stack>
            </Box>
          </GridItem>

          {/* RIGHT SECTION */}
          <GridItem>
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              p={5}
              position="sticky"
              top="90px"
            >
              <Heading fontSize="lg" mb={4} color={textPrimary}>
                Order Summary
              </Heading>

              <Stack spacing={4}>
                {cartItems.map((item) => (
                  <Flex key={item._id} gap={3} align="flex-start">
                    <Image
                      src={item?.product?.image}
                      boxSize="60px"
                      objectFit="cover"
                      borderRadius="md"
                      loading="lazy"
                    />

                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="600" color={textPrimary}>
                        {item?.product?.title}
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>
                        Qty: {item.quantity} | Size: {item.size}
                      </Text>

                      {/* REMOVE BUTTON */}
                      <Button
                        variant="link"
                        size="xs"
                        mt={1}
                        color={textSecondary}
                        onClick={() => handleRemoveItem(item._id)}
                        _hover={{ textDecoration: "underline" }}
                      >
                        Remove
                      </Button>
                    </Box>

                    <Flex direction="column" align="flex-end" gap={1}>
                      <CloseButton
                        size="sm"
                        color={textSecondary}
                        onClick={() => handleRemoveItem(item._id)}
                      />

                      <Text fontWeight="600" color={textPrimary}>
                        ₹{item.priceAtAdd * item.quantity}
                      </Text>
                    </Flex>
                  </Flex>
                ))}

                <Divider borderColor={borderColor} />

                <Flex
                  justify="space-between"
                  fontWeight="600"
                  color={textPrimary}
                >
                  <Text>Subtotal</Text>
                  <Text>₹{total}</Text>
                </Flex>

                <Flex
                  justify="space-between"
                  fontWeight="700"
                  fontSize="lg"
                  color={textPrimary}
                >
                  <Text>Order Total</Text>
                  <Text>₹{total}</Text>
                </Flex>

                <Button
                  bg={buttonBg}
                  color={buttonText}
                  _hover={{ bg: buttonHover }}
                  size="lg"
                  mt={3}
                  onClick={handlePlaceOrder}
                >
                  Place your order
                </Button>

                <Text fontSize="xs" color={textSecondary} textAlign="center">
                  By placing your order, you agree to our terms and conditions.
                </Text>
              </Stack>
            </Box>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
};

export default CheckoutPage;

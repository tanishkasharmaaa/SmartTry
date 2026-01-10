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
} from "@chakra-ui/react";
import { useState } from "react";
import { useToast } from "../context/useToast";

const CheckoutPage = () => {
  const toast = useToast();

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("selectedCartItems");
    return saved ? [JSON.parse(saved)] : [];
  });
  console.log(cartItems);

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  // const placeOrder = async() => {
  //   try {
  //       const res = await fetch(`${import.meta.env.VITE_API_URL}/api/order/buy/${}`);
  //       const data = await res.json()
  //       console.log(data)
  //   } catch (error) {
  //       console.log(error)
  //   }
  // }

  //   const placeOrder = () => {
  //     toast({
  //       title: "Order placed",
  //       description: "This is a dummy order. No backend connected.",
  //       status: "success",
  //       duration: 3000,
  //     });
  //   };

  return (
    <Box px={{ base: 4, md: 10 }} py={8} bg="gray.50" minH="100vh">
      <Heading mb={8}>Checkout</Heading>

      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={8}>
        {/* LEFT: Address Form */}
        <GridItem bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={6}>
            Delivery Address
          </Heading>

          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Full Name</FormLabel>
              <Input name="name" value={address.name} onChange={handleChange} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Phone</FormLabel>
              <Input
                name="phone"
                value={address.phone}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Address</FormLabel>
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

            <Button colorScheme="green" size="lg" mt={4}>
              Place Order
            </Button>
          </Stack>
        </GridItem>

        {/* RIGHT: Order Summary with Images */}
        <GridItem bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={6}>
            Order Summary
          </Heading>

          <Stack spacing={4}>
            {cartItems.map((item) => (
              <Flex key={item._id} gap={4} align="center">
                <Image
                  src={item.image}
                  alt={item.title}
                  boxSize="70px"
                  objectFit="cover"
                  borderRadius="md"
                />

                <Box flex="1">
                  <Text fontWeight="semibold" noOfLines={1}>
                    {item.title}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Qty: {item.quantity} | Size: {item.size}
                  </Text>
                </Box>

                <Text fontWeight="bold">₹{item.price * item.quantity}</Text>
              </Flex>
            ))}

            <Divider />

            <Flex justify="space-between" fontWeight="bold">
              <Text>Total</Text>
              <Text>₹{total}</Text>
            </Flex>
          </Stack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default CheckoutPage;

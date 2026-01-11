import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Divider,
  Radio,
  RadioGroup,
  Button,
  Image,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Spinner,
  useDisclosure,
  Input,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState } from "react";

const MotionBox = motion(Box);

const Order = () => {
  /* THEME */
  const bg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const textPrimary = useColorModeValue("gray.900", "gray.100");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  const buttonBg = useColorModeValue("gray.900", "gray.100");
  const buttonText = useColorModeValue("white", "gray.900");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const paymentProviderMap = {
    cod: "COD",
    card: "CREDIT/DEBIT",
    upi: "UPI",
  };

  const [status, setStatus] = useState("loading");

  /* MOCK DATA */
  const address = JSON.parse(localStorage.getItem("deliveryAddress")) || {
    name: "Tanishka Sharma",
    phone: "9XXXXXXXXX",
    addressLine1: "Main Street",
    city: "Delhi",
    state: "Delhi",
    postalCode: "110001",
  };
  const [step, setStep] = useState("form");
  // form → pin → processing → success

  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [upiId, setUpiId] = useState("");
  const [errors, setErrors] = useState({});
  const [pin, setPin] = useState("");

  const checkoutType = localStorage.getItem("checkoutType");

  const createOrderAPI = async () => {
    const checkoutType = localStorage.getItem("checkoutType");

    let url = "";
    let body = {};

    if (checkoutType === "BUY_NOW") {
      const buyNow = JSON.parse(localStorage.getItem("buyNowProduct"));
      console.log(buyNow);

      url = `${import.meta.env.VITE_API_URL}/api/order/buy/${
        buyNow[0]?.product._id
      }`;
      body = {
        quantity: buyNow[0].quantity,
        size: buyNow[0].size,
        paymentProvider: paymentProviderMap[paymentMethod] || "UNKNOWN",
      };
    }

    if (checkoutType === "CART_ORDER") {
      const cartId = localStorage.getItem("cartId");
      const cartItemIds = JSON.parse(
        localStorage.getItem("selectedCartItemIds")
      );

      url = `${
        import.meta.env.VITE_API_URL
      }/api/order/buy-through-cart/${cartId}`;
      body = { cartItemIds, paymentProvider: paymentProviderMap[paymentMethod] || "UNKNOWN"};
    }

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || "Order creation failed");
      error.code = data.code; // 👈 IMPORTANT
      throw error;
    }

    return data.order;
  };

  const cartItems =
    checkoutType === "BUY_NOW"
      ? (() => {
          const buyNow = localStorage.getItem("buyNowProduct");

          return buyNow ? JSON.parse(buyNow) : [];
        })()
      : JSON.parse(localStorage.getItem("selectedCartItems")) || [];

  const total = cartItems.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0
  );

  const validateCardForm = () => {
    const newErrors = {};

    if (cardDetails.number.length !== 16)
      newErrors.number = "Card number must be 16 digits";

    if (!cardDetails.name) newErrors.name = "Name on card is required";

    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry))
      newErrors.expiry = "Expiry must be in MM/YY format";

    if (cardDetails.cvv.length !== 3) newErrors.cvv = "CVV must be 3 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUpi = () => {
    if (!upiId || !upiId.includes("@")) {
      setErrors({ upi: "Enter a valid UPI ID" });
      return false;
    }
    setErrors({});
    return true;
  };

  /* PAYMENT FLOW */
  const handlePayment = async () => {
    onOpen();

    try {
      // ================= COD =================
      if (paymentMethod === "cod") {
        setStep("processing");
        await createOrderAPI();
        setTimeout(() => setStep("success"), 1500);
        return;
      }

      // ================= CARD =================
      if (paymentMethod === "card") {
        if (!validateCardForm()) return;
        setStep("pin");
        return;
      }

      // ================= UPI =================
      if (paymentMethod === "upi") {
        if (!validateUpi()) return;

        setStep("processing");
        await createOrderAPI();
        setTimeout(() => setStep("success"), 1500);
        return;
      }
    } catch (err) {
      // 🔐 AUTH ERROR HANDLING (CORRECT WAY)
      if (err.code === "TOKEN_EXPIRED" || err.code === "NO_TOKEN") {
        alert("Session expired. Please login again.");

        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (err.code === "INVALID_TOKEN") {
        alert("Authentication error. Please login again.");
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      alert(err.message || "Payment failed");
      onClose();
    }
  };

  if (step === "success") {
    localStorage.removeItem("checkoutType");
    localStorage.removeItem("buyNowProduct");
    localStorage.removeItem("selectedCartItems");
    localStorage.removeItem("selectedCartItemIds");
  }

  return (
    <Box bg={bg} minH="100vh" py={8}>
      <Box maxW="1100px" mx="auto" px={4}>
        <Heading mb={6}>Review & Pay</Heading>

        <Stack spacing={6}>
          {/* ADDRESS */}
          <Box bg={cardBg} border="1px solid" borderColor={border} p={5}>
            <Heading size="md" mb={2}>
              Delivery Address
            </Heading>
            <Text color={textSecondary}>
              {address.name}, {address.phone}
            </Text>
            <Text color={textSecondary}>
              {address.addressLine1}, {address.city}, {address.state} -{" "}
              {address.postalCode}
            </Text>
          </Box>

          {/* ITEMS */}
          <Box bg={cardBg} border="1px solid" borderColor={border} p={5}>
            <Heading size="md" mb={4}>
              Order Items
            </Heading>
            <Stack spacing={4}>
              {cartItems.map((item) => (
                <Flex key={item._id} gap={4}>
                  <Image src={item?.product?.image} boxSize="70px" />
                  <Box flex="1">
                    <Text fontWeight="600">{item?.product?.title}</Text>
                    <Text fontSize="sm" color={textSecondary}>
                      Qty: {item?.quantity}
                    </Text>
                    <Text fontSize="sm" color={textSecondary}>
                      Size: {item?.size}
                    </Text>
                  </Box>
                  <Text fontWeight="600">
                    ₹{item.priceAtAdd * item.quantity}
                  </Text>
                </Flex>
              ))}
              <Divider />
              <Flex justify="space-between" fontWeight="700">
                <Text>Total</Text>
                <Text>₹{total}</Text>
              </Flex>
            </Stack>
          </Box>

          {/* PAYMENT */}
          <Box bg={cardBg} border="1px solid" borderColor={border} p={5}>
            <Heading size="md" mb={4}>
              Payment Method
            </Heading>

            <RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
              <Stack spacing={3}>
                <Radio value="upi">UPI</Radio>
                <Radio value="card">Credit / Debit Card</Radio>
                <Radio value="cod">Cash on Delivery</Radio>
              </Stack>
            </RadioGroup>

            {/* CARD ICONS */}
            {paymentMethod === "card" && (
              <Flex mt={4} gap={4}>
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                  h="22px"
                />
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
                  h="22px"
                />
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/d/d1/RuPay.svg"
                  h="25px"
                />
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg"
                  h="22px"
                />
              </Flex>
            )}

            {/* UPI ICONS */}
            {paymentMethod === "upi" && (
              <Flex mt={4} gap={4}>
                <Box h={"25px"} display={"flex"} alignItems={"center"}>
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                    h="32px"
                  />
                </Box>
                <Box h={"25px"} display={"flex"} alignItems={"center"}>
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg"
                    h="42px"
                  />
                </Box>
                <Box h={"25px"} display={"flex"} alignItems={"center"}>
                  <Image
                    src="https://img.icons8.com/?size=96&id=68067&format=png"
                    h="62px"
                  />
                </Box>
              </Flex>
            )}
          </Box>

          {/* PAY BUTTON */}
          <Button
            bg={buttonBg}
            color={buttonText}
            size="lg"
            w="100%"
            onClick={handlePayment}
          >
            Pay ₹{total}
          </Button>
        </Stack>
      </Box>

      {/* PAYMENT MODAL */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalBody py={10} textAlign="center">
            {/* CARD PAYMENT */}
            {paymentMethod === "card" && step === "form" && (
              <Stack spacing={4}>
                <Heading size="md">Enter Card Details</Heading>

                <Input
                  placeholder="Card Number"
                  maxLength={16}
                  value={cardDetails.number}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, number: e.target.value })
                  }
                />
                {errors.number && (
                  <Text fontSize="xs" color="red.400">
                    {errors.number}
                  </Text>
                )}

                <Input
                  placeholder="Name on Card"
                  value={cardDetails.name}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, name: e.target.value })
                  }
                />
                {errors.name && (
                  <Text fontSize="xs" color="red.400">
                    {errors.name}
                  </Text>
                )}

                <Flex gap={3}>
                  <Input
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, expiry: e.target.value })
                    }
                  />
                  <Input
                    placeholder="CVV"
                    type="password"
                    maxLength={3}
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cvv: e.target.value })
                    }
                  />
                  {errors.expiry && (
                    <Text fontSize="xs" color="red.400">
                      {errors.expiry}
                    </Text>
                  )}
                  {errors.cvv && (
                    <Text fontSize="xs" color="red.400">
                      {errors.cvv}
                    </Text>
                  )}
                </Flex>

                <Button
                  bg={buttonBg}
                  color={buttonText}
                  onClick={() => {
                    if (validateCardForm()) {
                      setStep("pin");
                      setErrors({});
                    }
                  }}
                >
                  Continue
                </Button>
              </Stack>
            )}

            {/* CARD PIN */}
            {paymentMethod === "card" && step === "pin" && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Heading size="md">Enter Secure PIN</Heading>
                <Input
                  mt={4}
                  type="password"
                  placeholder="****"
                  maxLength={4}
                  textAlign="center"
                  fontSize="xl"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />

                <Button
                  mt={4}
                  bg={buttonBg}
                  color={buttonText}
                  onClick={async () => {
                    if (pin.length !== 4) {
                      setErrors({ pin: "PIN must be 4 digits" });
                      return;
                    }

                    setStep("processing");

                    try {
                      await createOrderAPI();
                      setTimeout(() => setStep("success"), 1800);
                    } catch (err) {
                      setStep("form");
                      alert(err.message);
                    }
                  }}
                >
                  Pay ₹{total}
                </Button>
              </MotionBox>
            )}

            {/* UPI */}
            {paymentMethod === "upi" && step === "form" && (
              <Stack spacing={4}>
                <Heading size="md">UPI Payment</Heading>

                <Input
                  placeholder="Enter UPI ID (e.g. name@upi)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />

                <Button
                  mt={4}
                  bg={buttonBg}
                  color={buttonText}
                  onClick={async () => {
                    if (!validateUpi()) return;

                    setStep("processing");

                    try {
                      await createOrderAPI();
                      setTimeout(() => setStep("success"), 1800);
                    } catch (err) {
                      setStep("form");
                      alert(err.message);
                    }
                  }}
                >
                  Pay ₹{total}
                </Button>

                {errors.pin && (
                  <Text fontSize="xs" color="red.400" mt={1}>
                    {errors.pin}
                  </Text>
                )}

                <Text fontSize="sm" color={textSecondary}>
                  You’ll receive a payment request on your UPI app
                </Text>
              </Stack>
            )}

            {/* PROCESSING */}
            {step === "processing" && (
              <>
                <Spinner size="xl" />
                <Text mt={4}>Waiting for payment confirmation…</Text>
              </>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <MotionBox
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <Image
                  src="https://cdn-icons-png.flaticon.com/512/845/845646.png"
                  boxSize="90px"
                  mx="auto"
                  mb={4}
                />
                <Heading size="md">Payment Successful 🎉</Heading>
                <Text mt={2} color={textSecondary}>
                  Thank you for shopping with us.
                </Text>
                <Text fontSize="sm" mt={1} color={textSecondary}>
                  Order placed successfully.
                </Text>
              </MotionBox>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Order;

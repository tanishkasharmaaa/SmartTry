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
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";

const MotionBox = motion(Box);

const API_URL = import.meta.env.VITE_API_URL;

const Order = () => {
  const bg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const buttonBg = useColorModeValue("gray.900", "gray.100");
  const buttonText = useColorModeValue("white", "gray.900");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { authenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Razorpay handles all online payment methods; do not collect card PIN/CVV here.
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [step, setStep] = useState("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutType = localStorage.getItem("checkoutType");

  const address = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("deliveryAddress")) || {
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
      };
    } catch {
      return {};
    }
  }, []);

  const cartItems = useMemo(() => {
    try {
      if (checkoutType === "BUY_NOW") {
        return JSON.parse(localStorage.getItem("buyNowProduct")) || [];
      }
      return JSON.parse(localStorage.getItem("selectedCartItems")) || [];
    } catch {
      return [];
    }
  }, [checkoutType]);

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.priceAtAdd || 0) * Number(item.quantity || 0),
    0
  );

  const paymentProviderMap = {
    cod: "COD",
    razorpay: "RAZORPAY",
  };

  const createOrderAPI = async () => {
    let url = "";
    let body = {};
    const paymentProvider = paymentProviderMap[paymentMethod];

    if (!paymentProvider) {
      throw new Error("Please select a valid payment method.");
    }

    if (checkoutType === "BUY_NOW") {
      const buyNow = JSON.parse(localStorage.getItem("buyNowProduct") || "[]");
      const productId = buyNow[0]?.product?._id;

      if (!productId) {
        throw new Error("Your Buy Now product is missing. Please return to the product page and try again.");
      }

      url = `${API_URL}/api/order/buy/${productId}`;
      body = {
        quantity: buyNow[0].quantity,
        size: buyNow[0].size,
        paymentProvider,
      };
    } else if (checkoutType === "CART_ORDER") {
      const selectedCartItems = JSON.parse(
        localStorage.getItem("selectedCartItems") || "[]"
      );

      if (!selectedCartItems.length) {
        throw new Error("No cart items are selected.");
      }
      if (!user?.cartId) {
        throw new Error("Your cart could not be found. Please refresh and try again.");
      }

      url = `${API_URL}/api/order/buy-through-cart/${user.cartId}`;
      body = {
        cartItemIds: selectedCartItems.map((item) => item._id),
        paymentProvider,
      };
    } else {
      throw new Error("Checkout session not found. Please return to your cart and try again.");
    }

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || "Order creation failed.");
      error.code = data.code;
      throw error;
    }

    if (!data.order?._id) {
      throw new Error("The backend created a response without an order ID.");
    }

    return data.order;
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const openRazorpayCheckout = async (smartTryOrder) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error("Razorpay Checkout could not load. Check your internet connection and try again.");
    }

    // Endpoint 1: create the Razorpay order on the backend.
    const createResponse = await fetch(`${API_URL}/api/payment/create-order`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: smartTryOrder._id }),
    });

    const paymentOrder = await createResponse.json().catch(() => ({}));
    if (!createResponse.ok) {
      throw new Error(paymentOrder.message || "Could not create the Razorpay payment order.");
    }

    if (!paymentOrder.keyId || !paymentOrder.razorpayOrderId || !paymentOrder.amount) {
      throw new Error("The payment API returned incomplete Razorpay order details.");
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        callback(value);
      };

      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || "INR",
        name: "SmartTry",
        description: "Payment for your SmartTry order",
        order_id: paymentOrder.razorpayOrderId,
        handler: async (razorpayResponse) => {
          try {
            // Endpoint 2: backend verifies the signature before marking the order paid.
            const verifyResponse = await fetch(`${API_URL}/api/payment/verify`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: smartTryOrder._id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }),
            });

            const result = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok) {
              throw new Error(result.message || "Payment verification failed.");
            }

            finish(resolve, result);
          } catch (error) {
            finish(reject, error);
          }
        },
        modal: {
          ondismiss: () => {
            finish(reject, new Error("Checkout was closed. Your order may still be pending; check your orders before trying again."));
          },
        },
      });

      checkout.on("payment.failed", (response) => {
        finish(
          reject,
          new Error(response.error?.description || "Razorpay reported that the payment failed.")
        );
      });

      checkout.open();
    });
  };

  const clearCheckoutStorage = () => {
    localStorage.removeItem("checkoutType");
    localStorage.removeItem("buyNowProduct");
    localStorage.removeItem("selectedCartItems");
    localStorage.removeItem("selectedCartItemIds");
  };

  const handlePayment = async () => {
    if (isSubmitting) return;

    if (!authenticated) {
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === "cod") {
        onOpen();
        setStep("processing");
        await createOrderAPI();
        setStep("success");
        clearCheckoutStorage();
        return;
      }

      if (paymentMethod === "razorpay") {
        // First create the SmartTry order, then create/pay its Razorpay order.
        const smartTryOrder = await createOrderAPI();
        await openRazorpayCheckout(smartTryOrder);

        clearCheckoutStorage();
        setStep("success");
        onOpen();
      }
    } catch (error) {
      if (
        error.code === "TOKEN_EXPIRED" ||
        error.code === "NO_TOKEN" ||
        error.code === "INVALID_TOKEN"
      ) {
        alert("Your session has expired. Please log in again.");
        navigate("/login");
        return;
      }

      alert(error.message || "Payment could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (step !== "success") return undefined;

    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [step, navigate]);

  return (
    <Box bg={bg} minH="100vh" py={8}>
      <Box maxW="1100px" mx="auto" px={4}>
        <Heading mb={6}>Review & Pay</Heading>

        <Stack spacing={6}>
          <Box bg={cardBg} border="1px solid" borderColor={borderColor} p={5} borderRadius="md">
            <Heading size="md" mb={2}>Delivery Address</Heading>
            <Text color={textSecondary}>
              {address.name || "Name not provided"}, {address.phone || "Phone not provided"}
            </Text>
            <Text color={textSecondary}>
              {[address.addressLine1, address.addressLine2, address.city, address.state, address.postalCode]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} p={5} borderRadius="md">
            <Heading size="md" mb={4}>Order Items</Heading>
            <Stack spacing={4}>
              {cartItems.map((item, index) => (
                <Flex key={item._id || item.product?._id || index} gap={4} align="center">
                  <Image
                    src={item?.product?.image}
                    alt={item?.product?.title || "Product"}
                    boxSize="70px"
                    objectFit="cover"
                  />
                  <Box flex="1">
                    <Text fontWeight="600">{item?.product?.title || "Product"}</Text>
                    <Text fontSize="sm" color={textSecondary}>Qty: {item?.quantity}</Text>
                    <Text fontSize="sm" color={textSecondary}>Size: {item?.size || "Free Size"}</Text>
                  </Box>
                  <Text fontWeight="600">
                    ₹{Number(item.priceAtAdd || 0) * Number(item.quantity || 0)}
                  </Text>
                </Flex>
              ))}
              <Divider />
              <Flex justify="space-between" fontWeight="700">
                <Text>Total</Text>
                <Text>₹{total}</Text>
              </Flex>
              <Text fontSize="xs" color={textSecondary}>
                Final payment amount is calculated and validated by the server.
              </Text>
            </Stack>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} p={5} borderRadius="md">
            <Heading size="md" mb={4}>Payment Method</Heading>
            <RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
              <Stack spacing={3}>
                <Radio value="razorpay">Pay Online with Razorpay (UPI, Credit/Debit Card and available methods)</Radio>
                <Radio value="cod">Cash on Delivery</Radio>
              </Stack>
            </RadioGroup>
          </Box>

          <Button
            bg={buttonBg}
            color={buttonText}
            size="lg"
            w="100%"
            onClick={handlePayment}
            isLoading={isSubmitting}
            loadingText="Processing"
            isDisabled={!cartItems.length || total <= 0}
          >
            {paymentMethod === "cod" ? `Place Order · ₹${total}` : `Pay ₹${total}`}
          </Button>
        </Stack>
      </Box>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        closeOnOverlayClick={step !== "processing"}
        closeOnEsc={step !== "processing"}
      >
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalBody py={10} textAlign="center">
            {step === "processing" && (
              <>
                <Spinner size="xl" />
                <Text mt={4}>Placing your order…</Text>
              </>
            )}

            {step === "success" && (
              <MotionBox
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Image
                  src="https://cdn-icons-png.flaticon.com/512/845/845646.png"
                  alt="Success"
                  boxSize="90px"
                  mx="auto"
                  mb={4}
                />
                <Heading size="md">
                  {paymentMethod === "cod" ? "Order Placed Successfully" : "Payment Successful"}
                </Heading>
                <Text mt={2} color={textSecondary}>
                  Thank you for shopping with SmartTry.
                </Text>
                <Text fontSize="sm" mt={1} color={textSecondary}>
                  Redirecting you shortly…
                </Text>
                <Button mt={5} onClick={() => navigate("/", { replace: true })}>
                  Continue Shopping
                </Button>
              </MotionBox>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Order;

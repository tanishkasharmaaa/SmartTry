import { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  useColorModeValue,
  VStack,
  Heading,
} from "@chakra-ui/react";
import AuthContext from "../context/authContext";
import ChatToggleButton from "./ChatToggleButton";
import Login from "./login";
import AiProductCarousel from "./AiProductCarousel";
import OrderItemsCarousel from "./OrderItemsCarousel";
import MarkDown from "./MarkDown";

export default function ChatWidget() {
  const { authenticated } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [connected, setConnected] = useState(false); // optional: for the green/red light

  const wsRef = useRef(null);
  const chatRef = useRef(null);
  const toggleRef = useRef(null);
  const scrollRef = useRef(null);

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.900");
  const headerBg = useColorModeValue("gray.100", "gray.800");
  const textColor = useColorModeValue("black", "white");
  const subText = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("white", "gray.800");
  const aiBubble = useColorModeValue("gray.100", "gray.800");
  const buttonBg = useColorModeValue("black", "white");
  const buttonColor = useColorModeValue("white", "black");
  const orderCardBg = useColorModeValue("gray.50", "gray.700");

  // -------------------- WebSocket Setup --------------------

  useEffect(() => {
    if (!authenticated) return;

    if (!wsRef.current) {
      let wsUrl = import.meta.env.VITE_WS_URL + "/ws";

      // If local dev, optionally pass a dev token
      if (import.meta.env.DEV) {
        const devToken = import.meta.env.VITE_DEV_TOKEN; // store a test token in .env.local
        if (devToken) wsUrl += `?token=${devToken}`;
      }

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnected(true);
        console.log("✅ WebSocket connected");
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "connected":
            console.log("WebSocket sessionId:", data.sessionId);
            setSessionId(data.sessionId);
            setConnected(true);
            break;

          case "aiMessage":
            if (data.resultType === "products" && Array.isArray(data.data)) {
              setMessages((prev) => [
                ...prev,
                { role: "ai", kind: "products", content: data.data },
              ]);
              return;
            }

            if (data.resultType === "categories" && Array.isArray(data.data)) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  kind: "text",
                  content: `We offer the following categories : ${data.data.join(
                    ", "
                  )}`,
                },
              ]);
              return;
            }

            if (data.resultType === "order" && Array.isArray(data.data)) {
              const order = data.data[0];
              console.log(order, "-----order from ws-----");
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  kind: "order",
                  content: {
                    orderId: order.orderId,
                    status: order.status,
                    items: order.items,
                    orderRealId: order.realOrderId,
                  },
                },
              ]);
              return;
            }

            if (data.resultType === "message") {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  kind: "text",
                  content: data.data?.[0]?.text || "🙂",
                },
              ]);
              return;
            }

            // fallback
            setMessages((prev) => [
              ...prev,
              { role: "ai", kind: "text", content: "I’m here to help 😊" },
            ]);
            break;

          case "aiEnd":
            setIsTyping(false);
            break;

          case "aiError":
            setMessages((prev) => [
              ...prev,
              { role: "ai", kind: "text", content: `Error: ${data.message}` },
            ]);
            setIsTyping(false);
            break;

          default:
            break;
        }
      };

      wsRef.current.onerror = (err) => console.error("❌ WebSocket error", err);

      wsRef.current.onclose = () => {
        console.warn("⚠ WebSocket closed");
        wsRef.current = null;
        setConnected(false);
      };
    }
  }, [authenticated]);

  // Close WS on logout
  useEffect(() => {
    if (!authenticated && wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [authenticated]);

  // Close WS on logout
  useEffect(() => {
    if (!authenticated && wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [authenticated]);

  // Outside click → close chat
  useEffect(() => {
    function handleOutsideClick(e) {
      if (
        open &&
        chatRef.current &&
        !chatRef.current.contains(e.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // -------------------- Send Message --------------------
  const handleSend = () => {
    if (!input.trim() || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "askAI",
        query: input,
        sessionId,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.text,
        })),
      })
    );

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        kind: "text",
        content: input,
      },
    ]);

    setInput("");
    setIsTyping(true);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      // Scroll to the bottom smoothly
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <>
      {/* CHAT BOX */}
      {open && (
        <Box
          ref={chatRef}
          position="fixed"
          bottom={{ base: "0", md: "80px" }}
          left={{ base: "0", sm: "10px", md: "25px", lg: "30px" }}
          right={{ base: "0", sm: "10px", md: "auto" }}
          w={{
            base: "100%",
            sm: "100%",
            md: "380px",
            lg: "400px",
          }}
          h={{
            base: "70vh",
            sm: "65vh",
            md: "480px",
            lg: "520px",
          }}
          bg={bgColor}
          borderRadius={{ base: "0", md: "lg" }}
          boxShadow="2xl"
          border="1px solid"
          borderColor={borderColor}
          display="flex"
          flexDirection="column"
          zIndex="2000"
        >
          {/* HEADER */}
          <Box
            p="3"
            bg={headerBg}
            borderBottom="1px solid"
            borderColor={borderColor}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            {/* Title & Subtitle */}
            <Box>
              <Text fontWeight="bold">SmartTry AI</Text>
              <Text fontSize="xs" color={subText}>
                Ask anything about products
              </Text>
            </Box>

            {/* Connection Status Light */}
            <Box
              w="10px"
              h="10px"
              borderRadius="50%"
              bg={connected ? "green.400" : "red.400"}
              boxShadow={`0 0 6px ${connected ? "green" : "red"}`}
            />
          </Box>

          {/* BODY */}
          {authenticated ? (
            <>
              <Box
                flex="1"
  minH={0}
  overflowY="auto"
  overflowX="hidden"
  px="3"
  py="2"
  ref={scrollRef}
  display="flex"
  flexDirection="column"
  justifyContent={messages.length === 0 ? "center" : "flex-start"}
              >
                <Flex direction="column">
                  {messages.length === 0 && (
                    <Box textAlign="center" opacity={0.8}>
                      <Text fontSize="sm" color={subText} mb="3">
                        Hi! I’m SmartTry AI. Ask me about our products,
                        categories, or your order status 😊
                      </Text>
                    </Box>
                  )}
                  {messages.map((msg, i) => {
                    // 🛒 PRODUCTS
                    if (msg.kind === "products") {
                      return (
                        <Box
                          key={i}
                          h="220px"
                          minH="220px"
                          maxH="220px"
                          mt="2"
                          mb="3"
                        >
                          <AiProductCarousel products={msg.content} />
                        </Box>
                      );
                    }

                    // 📦 ORDER STATUS
                    if (msg.kind === "order") {
                      return (
                        <Box
                          key={i}
                          bg={orderCardBg}
                          border="1px solid"
                          borderColor="blue.200"
                          borderRadius="md"
                          p="3"
                          mb="3"
                          maxW="95%"
                        >
                          <Text fontWeight="bold">📦 Order Summary</Text>

                          <Text fontSize="sm">
                            <b>Order ID:</b> {msg.content.orderId}
                          </Text>

                          <Text fontSize="sm" mb="2">
                            <b>Status:</b> {msg.content.status}
                          </Text>

                          <OrderItemsCarousel
                            items={msg.content.items}
                            orderId={msg.content.orderRealId}
                          />
                        </Box>
                      );
                    }

                    // 💬 TEXT MESSAGE
                    return (
                      <Box
                        key={i}
                        alignSelf={
                          msg.role === "user" ? "flex-end" : "flex-start"
                        }
                        bg={msg.role === "user" ? "black" : aiBubble}
                        color={msg.role === "user" ? "white" : textColor}
                        p="2"
                        borderRadius="md"
                        maxW="85%"
                        mb="2"
                      >
                        <MarkDown text={msg.content} />
                      </Box>
                    );
                  })}

                  {isTyping && (
                    <Text fontSize="sm" color={subText} mt="1">
                      SmartTry AI is typing...
                    </Text>
                  )}
                </Flex>
              </Box>

              {/* INPUT BOX */}
              <Flex
                p="3"
                gap="2"
                borderTop="1px solid"
                borderColor={borderColor}
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask SmartTry AI…"
                  bg={inputBg}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button bg={buttonBg} color={buttonColor} onClick={handleSend}>
                  Send
                </Button>
              </Flex>
            </>
          ) : (
            <VStack flex="1" justify="center" spacing="4" p="4">
              <Heading size="sm">Login Required</Heading>
              <Text fontSize="sm" color={subText} textAlign="center">
                Login or signup to chat with SmartTry AI
              </Text>
              <Login buttonName="Login / SignUp" close={() => setOpen(false)} />
            </VStack>
          )}
        </Box>
      )}

      {/* CHAT TOGGLE */}
      <ChatToggleButton
        ref={toggleRef}
        isOpen={open}
        authenticated={authenticated}
        onClick={() => setOpen((v) => !v)}
      />
    </>
  );
}

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

  // -------------------- WebSocket Setup --------------------
console.log(import.meta.env.VITE_WS_URL);
  useEffect(() => {
    if (!authenticated) return;

    if (!wsRef.current) {
      wsRef.current = new WebSocket(
        import.meta.env.VITE_WS_URL 
      );

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
            setConnected(true); // set green light
            break;

          case "aiMessage": {
            console.log("🤖 AI Message:", data);

            // PRODUCTS RESPONSE
            if (data.resultType === "products" && Array.isArray(data.data)) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "ai",
                  kind: "products",
                  content: data.data, // 👈 array of product objects
                },
              ]);
              return;
            }

            // TEXT / MESSAGE RESPONSE
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

            // FALLBACK (safety)
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                kind: "text",
                content: "I’m here to help 😊",
              },
            ]);
            break;
          }

          case "aiEnd":
            setIsTyping(false);
            break;

          case "aiError":
            setMessages((prev) => [
              ...prev,
              { role: "ai", text: `Error: ${data.message}` },
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
            base: "100%", // mobile
            sm: "360px", // small devices
            md: "400px", // tablets
            lg: "450px", // laptops
            xl: "500px", // desktops
          }}
          h={{
            base: "70vh", // mobile
            sm: "450px", // small devices
            md: "520px", // tablets
            lg: "580px", // laptops
            xl: "600px", // desktops
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
              >
                <Flex direction="column">
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

                    // 💬 TEXT
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
                        {msg.content}
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

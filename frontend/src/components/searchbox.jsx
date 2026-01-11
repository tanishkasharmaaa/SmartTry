import {
  useDisclosure,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  Input,
  Box,
  HStack,
  VStack,
  Image,
  Skeleton,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";

const SearchBox = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue("black", "white");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // 🔍 SEARCH API
  const searchProducts = async (text) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/paginated?search=${text}&limit=6`
      );
      const data = await res.json();
      setResults(data?.products || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ⏱ Debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchProducts(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // ♻️ Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // ⌨️ KEYBOARD NAVIGATION (IMPORTANT FIX)
  useEffect(() => {
    if (!isOpen || results.length === 0) return;

    const handleKey = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
      }

      if (e.key === "Enter" && selectedIndex >= 0) {
        const product = results[selectedIndex];
        window.location.href = `/products/${product._id}-${product.name}`;
        onClose();
      }

      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, results, selectedIndex, onClose]);

  return (
    <>
      <SearchIcon
        boxSize={5}
        cursor="pointer"
        onClick={onOpen}
        color={textColor}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="#111" p={4} borderRadius="lg">
          <Input
            placeholder="Search products..."
            size="lg"
            bg="#000"
            color="white"
            border="1px solid #333"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            _placeholder={{ color: "gray.500" }}
            _focus={{ borderColor: "blue.400" }}
          />

          <Box mt={3} maxH="360px" overflowY="auto">
            {/* LOADER */}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <HStack key={i} p={2} spacing={3}>
                  <Skeleton boxSize="50px" borderRadius="md" />
                  <Box flex="1">
                    <Skeleton height="12px" mb={2} />
                    <Skeleton height="10px" width="60%" />
                  </Box>
                  <Skeleton height="12px" width="40px" />
                </HStack>
              ))}

            {!loading && query && results.length === 0 && (
              <Text color="gray.400" px={2}>
                No results found
              </Text>
            )}

            <VStack align="stretch" spacing={1}>
              {!loading &&
                results.map((item, index) => (
                  <HStack
                    key={item._id}
                    p={3}
                    spacing={4}
                    cursor="pointer"
                    borderBottom="1px solid #222"
                    bg={index === selectedIndex ? "#1f1f1f" : "transparent"}
                    _hover={{ bg: "#1a1a1a" }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      window.location.href = `/products/${item._id}-${item.name}`;
                      onClose();
                    }}
                  >
                    <Box
                      boxSize="56px"
                      bg="gray.800"
                      borderRadius="md"
                      overflow="hidden"
                      flexShrink={0}
                    >
                      <Image
                        src={item?.image}
                        alt={item?.name}
                        boxSize="56px"
                        objectFit="cover"
                        fallbackSrc="https://via.placeholder.com/56"
                        loading="lazy"
                      />
                    </Box>

                    <Box flex="1">
                      <Text
                        color="white"
                        fontSize="sm"
                        fontWeight="semibold"
                        noOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {item.category}
                      </Text>
                    </Box>

                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="green.400"
                      whiteSpace="nowrap"
                    >
                      ₹{item.price}
                    </Text>
                  </HStack>
                ))}
            </VStack>
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SearchBox;

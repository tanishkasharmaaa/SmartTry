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

  // 🎨 THEME COLORS (BLACK / WHITE / GREY)
  const textPrimary = useColorModeValue("black", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const modalBg = useColorModeValue("white", "#111");
  const inputBg = useColorModeValue("gray.100", "#000");
  const borderColor = useColorModeValue("gray.200", "#333");
  const hoverBg = useColorModeValue("gray.100", "#1a1a1a");
  const activeBg = useColorModeValue("gray.200", "#1f1f1f");
  const skeletonBg = useColorModeValue("gray.200", "gray.700");

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

  // ⏱ DEBOUNCE SEARCH
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

  // ♻️ RESET SELECTION
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // ⌨️ KEYBOARD NAVIGATION
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
      {/* 🔍 SEARCH ICON */}
      <SearchIcon
        boxSize={5}
        cursor="pointer"
        onClick={onOpen}
        color={textPrimary}
      />

      {/* 🔎 SEARCH MODAL */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={modalBg} p={4} borderRadius="lg">
          <Input
            placeholder="Search products..."
            size="lg"
            bg={inputBg}
            color={textPrimary}
            border="1px solid"
            borderColor={borderColor}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            _placeholder={{ color: textSecondary }}
            _focus={{ borderColor: "blue.400" }}
          />

          <Box mt={3} maxH="360px" overflowY="auto">
            {/* ⏳ LOADER */}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <HStack key={i} p={2} spacing={3}>
                  <Skeleton
                    boxSize="50px"
                    borderRadius="md"
                    startColor={skeletonBg}
                  />
                  <Box flex="1">
                    <Skeleton
                      height="12px"
                      mb={2}
                      startColor={skeletonBg}
                    />
                    <Skeleton
                      height="10px"
                      width="60%"
                      startColor={skeletonBg}
                    />
                  </Box>
                  <Skeleton
                    height="12px"
                    width="40px"
                    startColor={skeletonBg}
                  />
                </HStack>
              ))}

            {/* ❌ NO RESULTS */}
            {!loading && query && results.length === 0 && (
              <Text color={textSecondary} px={2}>
                No results found
              </Text>
            )}

            {/* 📦 RESULTS */}
            <VStack align="stretch" spacing={1}>
              {!loading &&
                results.map((item, index) => (
                  <HStack
                    key={item._id}
                    p={3}
                    spacing={4}
                    cursor="pointer"
                    borderBottom="1px solid"
                    borderColor={borderColor}
                    bg={index === selectedIndex ? activeBg : "transparent"}
                    _hover={{ bg: hoverBg }}
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
                        color={textPrimary}
                        fontSize="sm"
                        fontWeight="semibold"
                        noOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>
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

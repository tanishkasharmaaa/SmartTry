import { useEffect, useState, useRef } from "react";
import {
  Box,
  Image,
  Text,
  Button,
  HStack,
  VStack,
  Spinner,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

const ProductCarousel = ({ apiUrl = null, arr = null, title = "Products" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  /* ================= THEME ================= */
  const cardBg = useColorModeValue("white", "gray.800");
  const cardText = useColorModeValue("gray.800", "gray.100");
  const arrowBg = useColorModeValue("blackAlpha.700", "whiteAlpha.300");
  const arrowColor = useColorModeValue("white", "black");
  const btnBg = useColorModeValue("black", "white");
  const btnColor = useColorModeValue("white", "black");
  const btnHover = useColorModeValue("gray.800", "gray.200");

  const setWithExpiry = (key, value, ttl) => {
  const now = Date.now();
  const item = {
    value,
    expiry: now + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  if (Date.now() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
};

  /* ================= DIRECT ARRAY (NO EFFECT LOOP) ================= */
  useEffect(() => {
    if (Array.isArray(arr) && arr.length > 0) {
      setProducts(arr);
      setLoading(false);
    }
  }, [arr?.length]); // ✅ SAFE DEPENDENCY

  /* ================= API FETCH ================= */
  useEffect(() => {
  if (!apiUrl || (Array.isArray(arr) && arr.length > 0)) return;

  let ignore = false;

  const fetchProducts = async () => {
    const CACHE_KEY = `carousel_${apiUrl}`;

    try {
      setLoading(true);

      const cached = getWithExpiry(CACHE_KEY);
      if (cached) {
        if (!ignore) {
          setProducts(cached);
          setLoading(false);
        }
        return;
      }

      const res = await fetch(apiUrl);
      const data = await res.json();
      const list = data.recommendations || data.products || [];

      if (!ignore) {
        setProducts(list);
        setWithExpiry(CACHE_KEY, list, 10 * 60 * 1000); // ✅ 10 min
      }
    } catch (err) {
      console.error("Carousel fetch failed:", err);
    } finally {
      if (!ignore) setLoading(false);
    }
  };

  fetchProducts();

  return () => {
    ignore = true;
  };
}, [apiUrl]);

  /* ================= SCROLL ================= */
  const scroll = (direction) => {
    if (!carouselRef.current) return;
    const offset = carouselRef.current.offsetWidth * 0.8;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  /* ================= STATES ================= */
  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  /* ================= UI ================= */
  return (
    <Box my={4}>
      <Text fontSize="2xl" fontWeight="bold" mb={2}>
        {title}
      </Text>

      <Box position="relative">
       {
        products.length>0&&(<>
        <IconButton
          icon={<ChevronLeftIcon boxSize={6} />}
          position="absolute"
          left="6px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
          bg={arrowBg}
          color={arrowColor}
          _hover={{ bg: arrowBg }}
          onClick={() => scroll("left")}
          aria-label="Scroll Left"
        />

        <IconButton
          icon={<ChevronRightIcon boxSize={6} />}
          position="absolute"
          right="6px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
          bg={arrowBg}
          color={arrowColor}
          _hover={{ bg: arrowBg }}
          onClick={() => scroll("right")}
          aria-label="Scroll Right"
        />

        </>)
       } 
        <HStack
          ref={carouselRef}
          overflowX="auto"
          spacing={4}
          py={3}
          px={2}
          css={{
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {products.map((product) => (
            <VStack
              key={product._id}
              minW={{ base: "200px", md: "240px", lg: "280px" }}
              bg={cardBg}
              color={cardText}
              borderRadius="lg"
              p={3}
              spacing={2}
              boxShadow="md"
              transition="0.3s"
              _hover={{ transform: "translateY(-6px)" }}
              flexShrink={0}
            >
              <Image
                src={product.image?.replace(/\n/g, "").trim()}
                alt={product.name}
                h={{ base: "140px", md: "180px", lg: "210px" }}
                w="100%"
                objectFit="cover"
                borderRadius="md"
              />

              <Text fontWeight="semibold" noOfLines={1}>
                {product.name}
              </Text>

              <Text fontWeight="bold">₹{product.price}</Text>

              <Button
                w="100%"
                bg={btnBg}
                color={btnColor}
                _hover={{ bg: btnHover }}
                size="sm"
                onClick={() =>
                  navigate(`/products/${product._id}-${product.name}`)
                }
              >
                View Product
              </Button>
            </VStack>
          ))}
        </HStack>
      </Box>
    </Box>
  );
};

export default ProductCarousel;

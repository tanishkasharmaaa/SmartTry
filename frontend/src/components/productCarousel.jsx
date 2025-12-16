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

const ProductCarousel = ({ apiUrl, title = "Products" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);
  const navigate = useNavigate()

  const cardBg = useColorModeValue("white", "gray.800");
  const cardText = useColorModeValue("gray.800", "gray.100");

  const arrowBg = useColorModeValue("blackAlpha.700", "whiteAlpha.300");
  const arrowColor = useColorModeValue("white", "black");

  const btnBg = useColorModeValue("black", "white");
  const btnColor = useColorModeValue("white", "black");
  const btnHover = useColorModeValue("gray.800", "gray.200");

  useEffect(() => {
    const fetchProducts = async () => {
      const CACHE_KEY = `carousel_${apiUrl}`;

      // 1️⃣ Check cache first
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setProducts(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch from API
      try {
        setLoading(true);
        const res = await fetch(apiUrl);
        const data = await res.json();
        const products = data.products || [];
        setProducts(products);

        // 3️⃣ Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiUrl]);


  const scroll = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount =
      direction === "left"
        ? -carouselRef.current.offsetWidth * 0.8
        : carouselRef.current.offsetWidth * 0.8;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (loading)
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );

  if (!products.length)
    return <Text textAlign="center">No products available.</Text>;

  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" mb={1}>
        {title}
      </Text>

      <Box position="relative">
        {/* ⬅ Left Arrow */}
        <IconButton
          icon={<ChevronLeftIcon boxSize={6} />}
          position="absolute"
          left="5px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
          bg={arrowBg}
          color={arrowColor}
          _hover={{ bg: arrowBg }}
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        />

        {/* ➡ Right Arrow */}
        <IconButton
          icon={<ChevronRightIcon boxSize={6} />}
          position="absolute"
          right="5px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
          bg={arrowBg}
          color={arrowColor}
          _hover={{ bg: arrowBg }}
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        />

        {/* Carousel */}
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
              minW={{ base: "200px", sm: "220px", md: "250px", lg: "280px" }}
              bg={cardBg}
              color={cardText}
              borderRadius="lg"
              p={3}
              spacing={2}
              boxShadow="md"
              transition="transform 0.25s ease"
              _hover={{ transform: "translateY(-4px)" }}
              flexShrink={0}
            >
              <Image
                src={product.image?.replace(/\n/g, "").trim()}
                alt={product.name}
                h={{ base: "140px", sm: "160px", md: "200px", lg: "220px" }}
                w="100%"
                objectFit="cover"
                borderRadius="md"
              />

              <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} noOfLines={1}>
                {product.name}
              </Text>

              <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                ₹{product.price}
              </Text>

              <Button
                w="100%"
                bg={btnBg}
                color={btnColor}
                _hover={{ bg: btnHover }}
                size="sm"
                onClick={()=>navigate(`/products/${product._id}-${product.name}`)}
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

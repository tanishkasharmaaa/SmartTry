import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Box,
  Image,
  Text,
  Skeleton,
  SkeletonText,
  VStack,
  HStack,
  Button,
  Select,
  Flex,
  Spacer,
  Badge,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

const SingleProd = () => {
  const { slug } = useParams();
  const productId = slug.split("-")[0];

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `https://smarttry.onrender.com/api/products/paginated?search=${productId}`
        );
        const data = await res.json();
        if (!isMounted) return;
        console.log(data.products[0]);
        setProduct(data.products?.[0] || null);
        setLoading(false);
      } catch (error) {
        console.error(error);
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (!loading && !product) {
    return <Text fontSize="xl">Product not found</Text>;
  }

  return (
    <Box maxW="1200px" mx="auto" p={6}>
      {loading ? (
        <VStack spacing={6} align="start">
          <Skeleton height="400px" width="100%" borderRadius="md" />
          <SkeletonText noOfLines={2} spacing="4" width="60%" />
          <SkeletonText noOfLines={1} width="30%" />
          <SkeletonText noOfLines={4} spacing="3" />
        </VStack>
      ) : (
        <Flex direction={{ base: "column", md: "row" }} gap={8}>
          {/* ------------------ LEFT: Product Image ------------------ */}
          <Box flex="1">
            <Image
              src={product.image?.replace(/\n/g, "").trim()}
              alt={product.name}
              borderRadius="md"
              objectFit="cover"
              w="100%"
              maxH="500px"
            />
          </Box>

          {/* ------------------ RIGHT: Product Info ------------------ */}
          <Box flex="1" display="flex" flexDirection="column">
            <Text fontSize="3xl" fontWeight="bold" mb={2}>
              {product.name}
            </Text>

            <HStack mb={2}>
              <Text fontSize="2xl" fontWeight="semibold" color="gray.700">
                ₹{product.price}
              </Text>
              {product.discount && (
                <Badge colorScheme="green">{product.discount}% OFF</Badge>
              )}
            </HStack>

            {/* Rating */}
            <HStack mb={4}>
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  color={i < (product.rating || 4) ? "yellow.400" : "gray.300"}
                />
              ))}
              <Text>({product.ratingCount || 10} reviews)</Text>
            </HStack>

            {/* Product Description */}
            <Text mb={4} color="gray.600">
              {product.description}
            </Text>

            {/* Size Selector */}
            <Box mb={4}>
              <Text fontWeight="semibold" mb={1}>
                Select Size:
              </Text>
              <Select
                placeholder="Select size"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                w="150px"
              >
                {product.stockId?.currentStock &&
                  Object.entries(product.stockId.currentStock).map(
                    ([size, qty]) => (
                      <option key={size} value={size} disabled={qty === 0}>
                        {size} {qty === 0 ? "(Out of Stock)" : ""}
                      </option>
                    )
                  )}
              </Select>
            </Box>

            {/* Buttons */}
            <HStack spacing={4} mb={4}>
              <Button colorScheme="blue">Add to Cart</Button>
              <Button colorScheme="green">Buy Now</Button>
            </HStack>

            {/* Seller Info */}
            <Box>
              <Text fontWeight="semibold">Seller:</Text>
              <Text>{product.seller || "Default Seller"}</Text>
            </Box>

            {/* Additional Info */}
            <Spacer />
            <Box mt={4}>
              <Text fontWeight="semibold">Availability:</Text>
              <Text>
                {product.currentStock?.[selectedSize] || "Out of Stock"}
              </Text>
            </Box>
          </Box>
        </Flex>
      )}
    </Box>
  );
};

export default SingleProd;

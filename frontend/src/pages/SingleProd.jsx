import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Box,
  Image,
  Text,
  Skeleton,
  SkeletonText,
  VStack,
} from "@chakra-ui/react";

const SingleProd = () => {
  const { slug } = useParams(); // slug from URL
  const productId = slug.split("-")[0]; // Extract ID from slug
console.log(productId);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `https://smarttry.onrender.com/api/products/paginated?search=${productId}`
        );
        const data = await res.json();
        console.log(data);
        if (!isMounted) return;

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
    <Box maxW="900px" mx="auto" p={6}>
      {loading ? (
        <VStack spacing={6} align="start">
          <Skeleton height="350px" width="100%" borderRadius="md" />
          <SkeletonText noOfLines={2} spacing="4" width="60%" />
          <SkeletonText noOfLines={1} width="30%" />
          <SkeletonText noOfLines={4} spacing="3" />
        </VStack>
      ) : (
        <VStack spacing={6} align="start">
          <Image
            src={product.image?.replace(/\n/g, "").trim()}
            alt={product.name}
            borderRadius="md"
            maxH="400px"
            objectFit="cover"
            w="100%"
          />

          <Text fontSize="2xl" fontWeight="bold">
            {product.name}
          </Text>

          <Text fontSize="xl" fontWeight="semibold" color="gray.400">
            ₹{product.price}
          </Text>

          <Text color="gray.500">{product.description}</Text>
        </VStack>
      )}
    </Box>
  );
};

export default SingleProd;

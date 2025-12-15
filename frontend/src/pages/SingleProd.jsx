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
  useColorModeValue,
  Divider,
  Textarea,
  Progress,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";
import ImageMagnifier from "../components/imageMagnifier";
import {
  CheckCircleIcon,
  RepeatIcon,
  LockIcon,
  TimeIcon,
} from "@chakra-ui/icons";
import { useContext } from "react";
import AuthContext from "../context/authContext";
import Login from "../components/login";

const SingleProd = () => {
  const { slug } = useParams();
  const productId = slug.split("-")[0];
  console.log(productId);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const { authenticated } = useContext(AuthContext);
  // const cacheToken =

  // Background color based on light/dark mode
  const addToCartBg = useColorModeValue("black", "gray.700");
  const addToCartColor = useColorModeValue("white", "white");
  const addToCartHover = useColorModeValue("gray.800", "gray.500");

  const buyNowBg = useColorModeValue("gray.200", "gray.600");
  const buyNowColor = useColorModeValue("black", "white");
  const buyNowHover = useColorModeValue("gray.300", "gray.500");

  const textColor = useColorModeValue("gray.700", "gray.200");
  const infoTextColor = useColorModeValue("gray.600", "gray.400");
  const iconColor = useColorModeValue("gray.700", "gray.300");

  const reviewBg = useColorModeValue("gray.50", "gray.800");

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

  const handleSubmitReview = async () => {
    if (!userRating || !comment.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(
        `https://smarttry.onrender.com/api/reviews/add-review/${productId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: userRating,
            comment,
          }),
        }
      );
      const data = await res.json();
      console.log(data)

      if (!res.ok) {
        console.log(data.message || "Failed to submit review");
        return;
      }

      setReviews((prev) => [data.review, ...prev]);
      setUserRating(0);
      setComment("");
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!productId) return;

    fetch(`https://smarttry.onrender.com/api/reviews/${productId}`)
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(console.error);
  }, [productId]);

  // Total stock across all sizes
  const totalStock = product?.stockId?.currentStock
    ? Object.values(product.stockId.currentStock).reduce(
        (sum, qty) => sum + Number(qty),
        0
      )
    : 0;

  // Stock for selected size
  const stockQty =
    selectedSize && product?.stockId?.currentStock
      ? Number(product.stockId.currentStock[selectedSize])
      : null;

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
            <ImageMagnifier
              src={product.image?.replace(/\n/g, "").trim()}
              alt={product.name}
            />
          </Box>

          {/* ------------------ RIGHT: Product Info ------------------ */}
          <Box flex="1" display="flex" flexDirection="column">
            <Text fontSize="3xl" fontWeight="bold" mb={2}>
              {product.name}
            </Text>

            <HStack mb={2}>
              <Text fontSize="2xl" fontWeight="semibold" color={textColor}>
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
                  color={i < product.averageRating ? "yellow.400" : "gray.300"}
                />
              ))}
              <Text>({product.totalReviews} reviews)</Text>
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
              <Button
                bg={addToCartBg}
                color={addToCartColor}
                _hover={{ bg: addToCartHover }}
                isDisabled={
                  !selectedSize || (stockQty !== null && stockQty === 0)
                }
              >
                Add to Cart
              </Button>

              <Button
                bg={buyNowBg}
                color={buyNowColor}
                _hover={{ bg: buyNowHover }}
                isDisabled={
                  !selectedSize || (stockQty !== null && stockQty === 0)
                }
              >
                Buy Now
              </Button>
            </HStack>

            {/* Seller Info */}
            <Box>
              <Text fontWeight="semibold">Seller:</Text>
              <Text>
                {product?.sellerId?.name
                  ? product.sellerId.name.charAt(0).toUpperCase() +
                    product.sellerId.name.slice(1)
                  : "Default Seller"}
              </Text>
            </Box>

            {/* Additional Info */}
            {/* <Spacer /> */}
            <Box mt={4}>
              <Text fontWeight="semibold">Availability:</Text>

              {!selectedSize ? (
                <Text color={totalStock > 0 ? "green.500" : "red.400"}>
                  {totalStock > 0
                    ? `${totalStock} items in stock`
                    : "Out of Stock"}
                </Text>
              ) : stockQty === 0 ? (
                <Text color="red.400">Out of Stock</Text>
              ) : (
                <Text color="green.500">{stockQty} in stock</Text>
              )}
            </Box>
            <Divider my={5} />

            {/* ------------------ Refund & Delivery Info ------------------ */}
            <VStack
              align="start"
              spacing={3}
              fontSize="sm"
              color={infoTextColor}
            >
              <HStack>
                <RepeatIcon color={iconColor} />
                <Text>
                  <b>7 Days Easy Return</b> – Return or exchange within 7 days
                </Text>
              </HStack>

              <HStack>
                <CheckCircleIcon color={iconColor} />
                <Text>
                  <b>100% Genuine Product</b> – Directly from verified sellers
                </Text>
              </HStack>

              <HStack>
                <LockIcon color={iconColor} />
                <Text>
                  <b>Secure Payments</b> – UPI, Cards, Net Banking supported
                </Text>
              </HStack>

              <HStack>
                <TimeIcon color={iconColor} />
                <Text>
                  <b>Delivery in 3–5 Business Days</b>
                </Text>
              </HStack>

              <HStack>
                <CheckCircleIcon color={iconColor} />
                <Text>
                  <b>Cash on Delivery Available</b>
                </Text>
              </HStack>
            </VStack>
          </Box>
        </Flex>
      )}
      <Divider my={8} />

      {/* ------------------ CUSTOMER REVIEWS ------------------ */}
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          Customer Reviews
        </Text>

        {/* Rating Summary */}
        <HStack mb={6}>
          <Text fontSize="4xl" fontWeight="bold">
            {product?.averageRating || 0}
          </Text>
          <VStack align="start" spacing={1}>
            <HStack>
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} color={i < 0 ? "yellow.400" : "gray.300"} />
              ))}
            </HStack>
            <Text fontSize="sm">{product?.totalReviews} reviews</Text>
          </VStack>
        </HStack>

        {/* ---------------- WRITE A REVIEW ---------------- */}

        {authenticated ? (
          <>
            <Box
              w="100%"
              p={5}
              borderWidth="1px"
              borderRadius="md"
              mb={6}
              bg={reviewBg}
            >
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Write a review
              </Text>

              {/* Star Rating Input */}
              <HStack spacing={1} mb={3}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    cursor="pointer"
                    boxSize={6}
                    color={
                      (hoverRating || userRating) >= star
                        ? "yellow.400"
                        : "gray.300"
                    }
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(star)}
                  />
                ))}
                <Text ml={2} fontSize="sm" color="gray.500">
                  {userRating ? `${userRating} / 5` : "Select rating"}
                </Text>
              </HStack>

              {/* Comment Box */}
              <Box mb={4}>
                <textarea
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E0",
                    background: "transparent",
                  }}
                  placeholder="Share your experience with this product..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Box>

              {/* Submit Button */}
              <Button
                bg="black"
                color="white"
                _hover={{ bg: "gray.800" }}
                isDisabled={!userRating || !comment.trim()}
                isLoading={submitting}
                onClick={handleSubmitReview}
              >
                Submit Review
              </Button>
            </Box>
          </>
        ) : (
          <>
          <Login buttonName={!authenticated&&"Login to add reviews"}/>
          </>
        )}

        {/* Reviews List */}
        <VStack align="start" spacing={5}>
          {reviews.length === 0 ? (
            <Text color="gray.500">No reviews yet</Text>
          ) : (
            reviews.map((review) => (
              <Box
                key={review._id}
                w="100%"
                p={4}
                borderWidth="1px"
                borderRadius="md"
              >
                <HStack mb={1}>
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      color={i < review.rating ? "yellow.400" : "gray.300"}
                      boxSize={3}
                    />
                  ))}
                </HStack>

                <Text fontWeight="semibold">
                  {review.userId?.name
                    ? review.userId.name.charAt(0).toUpperCase() +
                      review.userId.name.slice(1)
                    : "Anonymous"}
                </Text>

                <Text fontSize="sm" color="gray.500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>

                <Text mt={2}>{review.comment}</Text>
              </Box>
            ))
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default SingleProd;

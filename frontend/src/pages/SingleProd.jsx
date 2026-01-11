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
import { useToast } from "../context/useToast";
import ProductCarousel from "../components/productCarousel";
import { useRecommendations } from "../context/reccomendationContext";
import { useNavigate } from "react-router-dom";

const SingleProd = () => {
  const { slug } = useParams();
  const productId = slug.split("-")[0];

  const { recommendations } = useRecommendations();
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const { authenticated, user } = useContext(AuthContext);
  const [selectedQty, setSelectedQty] = useState(1);
  const [alreadyInCart, setAlreadyInCart] = useState(false);
  const navigate = useNavigate();

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

  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const CACHE_KEY = `product_${productId}`;
    const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

    const fetchProduct = async () => {
      try {
        // 1️⃣ Check cache with expiry
        const cachedProduct = localStorage.getItem(CACHE_KEY);
        if (cachedProduct) {
          const parsed = JSON.parse(cachedProduct);

          if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
            if (isMounted) {
              setProduct(parsed.data);
              setLoading(false);
            }
            return;
          } else {
            localStorage.removeItem(CACHE_KEY); // 🧹 delete expired
          }
        }

        // 2️⃣ Fetch from API
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/products/paginated?search=${productId}`
        );
        const data = await res.json();
        if (!isMounted) return;

        const product = data.products?.[0] || null;

        // 3️⃣ Save to cache with timestamp
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: product,
            timestamp: Date.now(),
          })
        );

        setProduct(product);
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

  const hasUserReviewed =
    authenticated && reviews.some((item) => item.userId?._id === user._id);
  console.log(hasUserReviewed);
  const handleSubmitReview = async () => {
    if (!userRating || !comment.trim()) {
      showToast({
        title: "Review incomplete",
        description: "Please give a rating and write a comment",
        type: "error",
      });
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reviews/add-review/${productId}`,
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

      if (!res.ok) {
        showToast({
          title: "Failed to submit review",
          description: data.message || "Something went wrong",
          type: "error",
        });
        return;
      }

      // ✅ Optimistic UI update
      setReviews((prev) => [data.review, ...prev]);
      setUserRating(0);
      setComment("");

      showToast({
        title: "Review submitted",
        description: "Thank you for sharing your feedback",
        type: "success",
      });
      window.location.reload();
    } catch (error) {
      console.error(error);
      showToast({
        title: "Network error",
        description: "Please try again later",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!productId) return;

    const fetchReviews = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/reviews/${productId}`
        );
        const data = await res.json();
        setReviews(data.reviews || []);
        console.log(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    setSelectedQty(1);
  }, [selectedSize]);

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

  const availableQty =
    selectedSize && product?.stockId?.currentStock
      ? Number(product.stockId.currentStock[selectedSize])
      : 0;

  const addToCart = async () => {
    if (!selectedSize) {
      showToast({
        title: "Size required",
        description: "Please select a size",
        type: "warning",
      });
      return;
    }

    if (!selectedQty) {
      showToast({
        title: "Quantity required",
        description: "Please select quantity",
        type: "warning",
      });
      return;
    }

    if (alreadyInCart) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cart/${productId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            size: selectedSize,
            quantity: selectedQty,
          }),
        }
      );

      const data = await res.json();
      console.log(data);

      // 🟡 Already in cart
      if (res.status === 409) {
        setAlreadyInCart(true);

        showToast({
          title: "Already in cart",
          description: data.message || "This product is already in your cart",
          type: "warning",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to add product");
      }

      // ✅ Success
      setAlreadyInCart(true);

      showToast({
        title: "Added to cart",
        description: "Item successfully added",
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Error",
        description: error.message || "Could not add item to cart",
        type: "error",
      });
    }
  };

  useEffect(() => {
    const checkIfInCart = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
          credentials: "include",
        });

        const data = await res.json();
        console.log(data);
        if (!res.ok || !data.cartItems) return;

        const exists = data.cartItems.some(
          (item) =>
            item.product?._id === productId && item.size === selectedSize
        );
        console.log(exists);

        setAlreadyInCart(exists);
      } catch (err) {
        console.error(err);
        setAlreadyInCart(false);
      }
    };

    checkIfInCart();
  }, [productId, selectedSize]);

  const buyNow = () => {
    if (!selectedSize) {
      showToast({
        title: "Size required",
        description: "Please select a size",
        type: "warning",
      });
      return;
    }

    if (!selectedQty || selectedQty < 1) {
      showToast({
        title: "Quantity required",
        description: "Please select quantity",
        type: "warning",
      });
      return;
    }

    if (!product) {
      showToast({
        title: "Product not loaded",
        description: "Please wait and try again",
        type: "error",
      });
      return;
    }

    // Save the selected product in localStorage
    const selectedItem = {
      _id: product._id,
      product: product,
      title: product.title,
      priceAtAdd: product.price,
      size: selectedSize,
      quantity: selectedQty,
    };


    localStorage.setItem("buyNowProduct", JSON.stringify([selectedItem]));


    localStorage.setItem("checkoutType", "BUY_NOW");

    showToast({
      title: "Proceed to Checkout",
      description: "Item saved. Redirecting to checkout...",
      type: "success",
    });

    setTimeout(() => {
      navigate("/checkout");
    }, 500);
  };

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

            <Box mb={4} mr={4} display="flex" gap={2} flexWrap="wrap">
              {Array.isArray(product?.tags) &&
                product.tags.map((tag, index) => (
                  <Badge
                    key={`${tag}-${index}`}
                    colorScheme="green"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {tag}
                  </Badge>
                ))}
            </Box>

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

              {!selectedSize && (
                <Text fontSize="sm" color="red.400" mt={1}>
                  Please select a size
                </Text>
              )}
            </Box>

            <Box mb={4}>
              <Text fontWeight="semibold" mb={1}>
                Select Quantity:
              </Text>

              <Select
                placeholder={
                  selectedSize ? "Select quantity" : "Select size first"
                }
                value={selectedQty}
                onChange={(e) => setSelectedQty(Number(e.target.value))}
                w="150px"
                isDisabled={!selectedSize || availableQty === 0}
              >
                {selectedSize &&
                  [...Array(availableQty)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
              </Select>

              {selectedSize && availableQty === 0 && (
                <Text fontSize="sm" color="red.400" mt={1}>
                  Out of stock for selected size
                </Text>
              )}
            </Box>

            {/* Buttons */}
            <HStack spacing={4} mb={4}>
              {!authenticated ? (
                <Login buttonName="Add to Cart" />
              ) : (
                <Button
                  bg={alreadyInCart ? "gray.600" : addToCartBg}
                  color="white"
                  _hover={{ bg: alreadyInCart ? "gray.600" : addToCartHover }}
                  isDisabled={
                    alreadyInCart ||
                    !selectedSize ||
                    (stockQty !== null && stockQty === 0)
                  }
                  onClick={addToCart}
                >
                  {alreadyInCart ? "Already in Cart" : "Add to Cart"}
                </Button>
              )}

              <Button
                bg={buyNowBg}
                color={buyNowColor}
                _hover={{ bg: buyNowHover }}
                isDisabled={
                  !selectedSize || (stockQty !== null && stockQty === 0)
                }
                onClick={buyNow}
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
                <StarIcon
                  key={i}
                  color={0 < product?.averageRating ? "yellow.400" : "gray.300"}
                />
              ))}
            </HStack>
            <Text fontSize="sm">{product?.totalReviews} reviews</Text>
          </VStack>
        </HStack>

        {/* ---------------- WRITE A REVIEW ---------------- */}

        {!authenticated && <Login buttonName="Login to add a review" />}

        {authenticated && !hasUserReviewed && (
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

            {/* Star Rating */}
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
            </HStack>

            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              mb={4}
            />

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
        )}

        {authenticated && hasUserReviewed && (
          <Text mb={4} color="green.500" fontWeight="medium">
            ✅ You have already reviewed this product
          </Text>
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
      {recommendations.length > 0 ? (
        <ProductCarousel
          apiUrl={"null"}
          title="Recomendations For You "
          arr={recommendations}
        />
      ) : (
        <ProductCarousel
          apiUrl={`${
            import.meta.env.VITE_API_URL
          }/api/products/paginated?gender=${product.gender}&limit=10`}
          title="Related Products For You"
        />
      )}
    </Box>
  );
};

export default SingleProd;

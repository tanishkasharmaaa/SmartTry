import {
  Box,
  SimpleGrid,
  Image,
  Text,
  Skeleton,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Input,
  Stack,
  Checkbox,
  HStack,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState, useRef, useMemo } from "react";
import Pagination from "../components/pagination";
import { ArrowRightIcon, StarIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

const Mens = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [sizes, setSizes] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const searchTimeoutRef = useRef(null);
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("");
  const navigate = useNavigate();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const CACHE_KEY = "mens_products_cache_v3";
  const CACHE_EXPIRY = 1000 * 60 * 10;

  const bgColor = useColorModeValue("white", "black");
  const textColor = useColorModeValue("black", "white");

  // -----------------------------
  // HANDLE FILTER CHANGES SAFELY
  // -----------------------------
  const handleSearchChange = (e) => {
    const value = e.target.value;

    // update UI immediately (NO lag)
    setSearchInput(value);

    // debounce API-triggering state
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value); // 🔥 triggers fetch
      setPage(1);
    }, 400);
  };

  const handleMinPrice = (e) => {
    setMinPrice(e.target.value);
    setPage(1);
  };

  const handleMaxPrice = (e) => {
    setMaxPrice(e.target.value);
    setPage(1);
  };

  const toggleSize = (size) => {
    setSizes((prev) => {
      const updated = prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size];

      setPage(1);
      return updated;
    });
  };

  const handleResetFilters = () => {
    // clear debounce if running
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchInput("");
    setSearch("");
    setSizes([]);
    setMinPrice("");
    setMaxPrice("");
    setSort("");
    setPage(1);

    onClose(); // close drawer for better UX
  };

  // -----------------------------
  // FETCH + CACHE
  // -----------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      const params = {
        gender: "men",
        page,
        limit: 15,
      };
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sizes.length) params.sizes = sizes.join(",");
      if (sort === "price_asc") {
        params.sortBy = "price";
        params.order = "asc";
      }

      if (sort === "price_desc") {
        params.sortBy = "price";
        params.order = "desc";
      }

      const query = new URLSearchParams(params).toString();
      const cacheKey = `${CACHE_KEY}::${query}`;

      try {
        // Try Cache
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
            console.log(parsed.data);
            setProducts(parsed.data.products);
            setTotalPages(parsed.data.totalpages);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Cache read error:", err);
      }

      // Fetch from server
      try {
        const res = await fetch(
          `https://smarttry.onrender.com/api/products/paginated?${query}`
        );
        const data = await res.json();
        console.log(data);
        setProducts(data.products || []);
        setTotalPages(data.totalpages || 1);

        // Save to cache
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: {
              products: data.products || [],
              totalpages: data.totalpages || 1,
            },
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.log("Fetch error:", err);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [page, search, minPrice, maxPrice, sizes.join(","), sort]);

  const sortedProducts = useMemo(() => {
    if (!sort) return products;

    const sorted = [...products];

    if (sort === "price_asc") {
      sorted.sort((a, b) => a.price - b.price);
    }

    if (sort === "price_desc") {
      sorted.sort((a, b) => b.price - a.price);
    }

    return sorted;
  }, [products, sort]);

  return (
    <Box p={2} bg={bgColor} color={textColor} minH="100vh">
      {/* Filter Button */}
      <Button onClick={onOpen} mb={2} colorScheme="gray" gap="10px">
        Filters <ArrowRightIcon />
      </Button>

      {/* Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={bgColor} color={textColor}>
          <DrawerCloseButton />
          <DrawerHeader>Filters</DrawerHeader>

          <DrawerBody>
            <Stack spacing={5}>
              <Box pt={4}>
                <Button
                  width="100%"
                  variant="outline"
                  colorScheme="gray"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
              </Box>

              {/* Search */}
              <Box>
                <Text mb={1}>Search</Text>
                <Input
                  placeholder="Search products"
                  value={searchInput}
                  onChange={handleSearchChange}
                />
              </Box>

              {/* Price */}
              <Box>
                <Text mb={1}>Price Range</Text>
                <HStack>
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minPrice}
                    onChange={handleMinPrice}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxPrice}
                    onChange={handleMaxPrice}
                  />
                </HStack>
              </Box>

              {/* Sort */}
              <Box>
                <Text mb={2}>Sort by Price</Text>
                <Stack>
                  <Checkbox
                    isChecked={sort === "price_asc"}
                    onChange={() => {
                      setSort(sort === "price_asc" ? "" : "price_asc");
                      setPage(1);
                    }}
                  >
                    Low → High
                  </Checkbox>

                  <Checkbox
                    isChecked={sort === "price_desc"}
                    onChange={() => {
                      setSort(sort === "price_desc" ? "" : "price_desc");
                      setPage(1);
                    }}
                  >
                    High → Low
                  </Checkbox>
                </Stack>
              </Box>

              {/* Sizes */}
              <Box>
                <Text mb={2}>Sizes</Text>
                <Stack>
                  {["S", "M", "L", "XL"].map((size) => (
                    <Checkbox
                      key={size}
                      isChecked={sizes.includes(size)}
                      onChange={() => toggleSize(size)}
                    >
                      {size}
                    </Checkbox>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Product Grid */}
      <SimpleGrid columns={{ base: 2, sm: 2, md: 3, lg: 5 }} spacing={4}>
        {loading
          ? [...Array(10)].map((_, i) => (
              <Box key={i} borderWidth="1px" borderRadius="md" bg={bgColor}>
                <Skeleton height="250px" width="100%" borderRadius="md" />
                <Box p={2}>
                  <Skeleton height="20px" mb={2} />
                  <Skeleton height="20px" width="60%" />
                </Box>
              </Box>
            ))
          : sortedProducts.map((product) => (
              <Box
                key={product._id}
                borderWidth="1px"
                borderRadius="md"
                overflow="hidden"
                bg={bgColor}
                _hover={{ shadow: "lg", transform: "scale(1.02)" }}
                transition="all 0.2s ease"
                onClick={() =>
                  navigate(`/products/${product._id}-${product.name}`)
                }
              >
                <Box
                  aspectRatio={1}
                  width="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  overflow="hidden"
                >
                  <Image
                    src={product.image?.replace(/\n/g, "").trim()}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                    alt={product.name}
                  />
                </Box>

                <Box p={2}>
                  <Text fontWeight="semibold" isTruncated>
                    {product.name}
                  </Text>

                  {/* ⭐ Rating Stack */}
                  <HStack spacing={1} mt={1}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        boxSize={3}
                        color={
                          i < Math.round(product.averageRating)
                            ? "yellow.400"
                            : "gray.300"
                        }
                      />
                    ))}

                    <Text fontSize="xs" color="gray.500">
                      ({product.averageRating || 0})
                    </Text>
                  </HStack>

                  {/* 💰 Price */}
                  <Text fontWeight="bold" color="gray.400" mt={1}>
                    ₹{product.price}
                  </Text>
                </Box>
              </Box>
            ))}
      </SimpleGrid>

      {!loading && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            if (newPage >= 1 && newPage <= totalPages) {
              setPage(newPage);
            }
          }}
        />
      )}
    </Box>
  );
};

export default Mens;

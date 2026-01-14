import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  Select,
  useDisclosure,
  useColorModeValue,
  Box,
  Flex,
  Avatar,
  Stack,
  Divider,
  Badge,
  Text,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useToast } from "../context/useToast";
import { useContext, useState } from "react";
import AuthContext from "../context/authContext";
import CartContext from "../context/cartContext";
import { useNavigate, Link } from "react-router-dom";

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const bg = useColorModeValue("white", "black");
  const cardBg = useColorModeValue("gray.50", "gray.900");
  const label = useColorModeValue("gray.600", "gray.400");
  const text = useColorModeValue("gray.700", "white");

  const borderClr = useColorModeValue("gray.200", "gray.700");
  const textClr = useColorModeValue("gray.500", "gray.100");

  const btnBg = useColorModeValue("black", "white");
  const btnColor = useColorModeValue("white", "black");
  const btnHoverBg = useColorModeValue("gray.800", "gray.200");

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    birthday: user.birthday || "",
    gender: user.gender || "",
    bio: user.bio || "",
    password: "",
    image: user.image || "",
    seller: user.seller || false,
    interest: user.interest || [],
    sellerInfo: {
      sellerName: user.sellerInfo?.sellerName || "",
      gstNumber: user.sellerInfo?.gstNumber || "",
      businessName: user.sellerInfo?.businessName || "",
      businessAddress: user.sellerInfo?.businessAddress || "",
      contactNumber: user.sellerInfo?.contactNumber || "",
      website: user.sellerInfo?.website || "",
      description: user.sellerInfo?.description || "",
    },
  });

  const handleInterestsChange = (e) => {
    const value = e.target.value;

    const updated = value
  .split(",")
  .map((i) => i.trim().toLowerCase());


    setFormData((prev) => ({ ...prev, interest: updated }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSellerChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      sellerInfo: {
        ...prev.sellerInfo,
        [name]: value,
      },
    }));
  };
  const handleUpdate = async () => {
    console.log(formData);

    try {
      const payload = { ...formData };

      /* ================= PASSWORD VALIDATION ================= */
      if (payload.password && payload.password.length < 6) {
        showToast({
          title: "Password too short ❌",
          description: "Password must be at least 6 characters",
          status: "warning",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      if (!payload.password) delete payload.password;

      /* ================= SELLER VALIDATION ================= */
      if (payload.seller) {
        const { sellerName, businessName, gstNumber, contactNumber } =
          payload.sellerInfo || {};

        if (!sellerName || !businessName || !gstNumber || !contactNumber) {
          showToast({
            title: "Incomplete seller details ❌",
            description: "Please fill all required seller information",
            status: "warning",
            duration: 4000,
            isClosable: true,
            position: "top",
          });
          return;
        }

        const gstRegex =
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstRegex.test(gstNumber.toUpperCase())) {
          showToast({
            title: "Invalid GST Number ❌",
            description: "Please enter a valid 15-character GST number",
            status: "error",
            duration: 4000,
            isClosable: true,
            position: "top",
          });
          return;
        }

        payload.sellerInfo.gstNumber = gstNumber.toUpperCase();
      }

      /* ================= CLEAN PAYLOAD ================= */
      if (!payload.seller) {
        delete payload.sellerInfo;
        payload.seller = false;
      }

      /* ================= INTRESETS VALIDATION ================= */
      if (payload.interest && !Array.isArray(payload.interest)) {
        showToast({
          title: "Invalid interests ❌",
          description: "Intresets must be an array",
          status: "warning",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      // Normalize intresets
      if (payload.interest) {
        payload.interest = [
          ...new Set(payload.interest.map((i) => i.toLowerCase().trim())),
        ];
      }

      /* ================= API CALL ================= */
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${user._id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        showToast({
          title: "Update failed ❌",
          description: data.message || "Something went wrong",
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      showToast({
        title: "Profile updated ✅",
        description:
          data.message || "Your profile has been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      onClose();
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error(err);
      showToast({
        title: "Update failed ❌",
        description: err.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    }
  };

  if (!user) return null;

  return (
    <Box
      minH="100vh"
      bg={bg}
      px={{ base: 4, md: 8 }}
      py={6}
      justifyContent={"center"}
    >
      {/* 1️⃣ Heading */}
      <Box display={"flex"} justifyContent={"flex-start"}>
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color={text}
          mb={4}
          textAlign="left"
        >
          My Profile
        </Text>
      </Box>

      {/* Main Card */}
      <Flex
        justifyContent={{ base: "flex-start", lg: "center" }}
        px={{ base: 0, lg: 0 }}
      >
        <Box
          w="100%"
          maxW="700px"
          bg={cardBg}
          borderRadius="xl"
          boxShadow="md"
          p={{ base: 5, md: 6 }}
        >
          {/* 2️⃣ Avatar */}
          <Flex justify="center" mb={5}>
            <Avatar
              size={{ base: "xl", md: "2xl" }}
              src={user.image}
              name={user.name}
            />
          </Flex>

          {/* Name + Email */}
          <Stack spacing={1} textAlign="center" mb={4}>
            <Text fontSize="lg" fontWeight="semibold" color={text}>
              {user.name}
            </Text>
            <Text fontSize="sm" color={label}>
              {user.email}
            </Text>

            <Button
              mt={3}
              size="sm"
              variant="outline"
              colorScheme="blue"
              onClick={onOpen}
              alignSelf="center"
            >
              Edit Profile
            </Button>
          </Stack>

          <Divider my={4} />

          {/* 3️⃣ Cart / Orders Info */}
          <Flex justify="space-between" align="center" mb={4}>
            <Text color={label}>Items in Cart</Text>
            <Badge
              cursor={"pointer"}
              onClick={() => navigate("/cart")}
              colorScheme="green"
              px={3}
              py={1}
              borderRadius="full"
            >
              {cartCount || 0}
            </Badge>
          </Flex>

          <Divider my={4} />

          {/* 4️⃣ User Personal Info */}
          <Stack spacing={3}>
            <InfoRow
              label="Birthday"
              value={user?.birthday?.split("T")[0] || "Not provided"}
            />
            <InfoRow label="Gender" value={user.gender || "Not specified"} />
            <InfoRow label="Bio" value={user.bio || "No bio added"} />
            <InfoRow
              label="Interests"
              value={
                user.interest && user.interest.length > 0
                  ? user.interest.join(", ")
                  : "No interests added"
              }
            />
            <InfoRow
              label="Seller Account"
              value={user.seller ? "Yes" : "No"}
              badge={user.seller}
            />
            {!formData.seller && (
              <Button
                size="sm"
                colorScheme="purple"
                variant="outline"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    seller: true,
                    sellerInfo: {
                      sellerName: "",
                      gstNumber: "",
                      businessName: "",
                      businessAddress: "",
                      contactNumber: "",
                      website: "",
                      description: "",
                    },
                  }));

                  onOpen();
                }}
              >
                Become a Seller
              </Button>
            )}
          </Stack>

          {/* 5️⃣ Seller Info */}
          {user.seller && user.sellerInfo && (
            <>
              <Divider my={6} />

              <Text fontWeight="semibold" mb={3} color={text}>
                Seller Information
              </Text>

              <Stack spacing={3}>
                <InfoRow
                  label="Seller Name"
                  value={user.sellerInfo.sellerName}
                />
                <InfoRow
                  label="Business Name"
                  value={user.sellerInfo.businessName}
                />
                <InfoRow label="GST Number" value={user.sellerInfo.gstNumber} />
                <InfoRow
                  label="Contact"
                  value={user.sellerInfo.contactNumber}
                />
                <InfoRow label="Website" value={user.sellerInfo.website} />
                <InfoRow
                  label="Address"
                  value={user.sellerInfo.businessAddress}
                />
                <InfoRow
                  label="Description"
                  value={user.sellerInfo.description}
                />
              </Stack>
            </>
          )}

          <Divider my={6} />

          {/* 6️⃣ User ID */}
          <Text fontSize="xs" color={label} textAlign="center">
            User ID: {user._id}
          </Text>
        </Box>
      </Flex>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        size={{ base: "full", md: "lg" }}
        scrollBehavior="inside"
      >
        <ModalOverlay />

        <ModalContent bg={cardBg} borderRadius="xl">
          <ModalHeader color={textClr}>Edit Profile</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Stack spacing={4}>
              {/* Basic Info */}
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Date of Birth</FormLabel>
                <Input
                  type="date"
                  name="birthday"
                  value={
                    formData.birthday ? formData.birthday.split("T")[0] : ""
                  }
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Gender</FormLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Image</FormLabel>
                <Input
                  name="image"
                  type="text"
                  placeholder="Enter your image link"
                  value={formData.image}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  name="bio"
                  placeholder="Tell us about yourself"
                  value={formData.bio}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Interests</FormLabel>
                <Textarea
                  name="interest"
                  placeholder="Enter interests (comma separated)"
                  value={formData.interest.join(", ")}
                  onChange={handleInterestsChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  placeholder="Leave blank to keep current password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </FormControl>

              {/* Seller Section */}
              {formData.seller && (
                <Box
                  border="1px solid"
                  borderColor={borderClr}
                  borderRadius="lg"
                  p={4}
                >
                  <Text
                    fontWeight="semibold"
                    fontSize={"2xl"}
                    mb={3}
                    color={textClr}
                  >
                    Seller Information
                  </Text>

                  <Stack spacing={3}>
                    <FormControl>
                      <FormLabel>Seller Name</FormLabel>
                      <Input
                        name="sellerName"
                        placeholder="Seller name"
                        value={formData.sellerInfo.sellerName}
                        onChange={handleSellerChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Business Name</FormLabel>
                      <Input
                        name="businessName"
                        placeholder="Business name"
                        value={formData.sellerInfo.businessName}
                        onChange={handleSellerChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>GST Number</FormLabel>
                      <Input
                        name="gstNumber"
                        placeholder="27AAPFU0939F1ZV"
                        value={formData.sellerInfo.gstNumber}
                        onChange={handleSellerChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Contact Number</FormLabel>
                      <Input
                        name="contactNumber"
                        placeholder="Phone number"
                        value={formData.sellerInfo.contactNumber}
                        onChange={handleSellerChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Website</FormLabel>
                      <Input
                        name="website"
                        placeholder="https://example.com"
                        value={formData.sellerInfo.website}
                        onChange={handleSellerChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Business Address</FormLabel>
                      <Textarea
                        name="businessAddress"
                        placeholder="Full business address"
                        value={formData.sellerInfo.businessAddress}
                        onChange={handleSellerChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        placeholder="Describe your business"
                        value={formData.sellerInfo.description}
                        onChange={handleSellerChange}
                      />
                    </FormControl>
                  </Stack>
                </Box>
              )}
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>

            <Button
              ml={3}
              bg={btnBg}
              color={btnColor}
              _hover={{ bg: btnHoverBg }}
              onClick={handleUpdate}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const InfoRow = ({ label, value, badge }) => (
  <Flex justify="space-between" gap={4}>
    <Text fontSize="sm" color="gray.500" minW="140px">
      {label}
    </Text>
    {badge ? (
      <Badge colorScheme="purple">Seller</Badge>
    ) : (
      <Text fontSize="sm" fontWeight="medium" textAlign="right">
        {value}
      </Text>
    )}
  </Flex>
);

export default Settings;

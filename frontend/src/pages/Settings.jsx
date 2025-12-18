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
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import AuthContext from "../context/authContext";
import CartContext from "../context/cartContext";

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);

  const bg = useColorModeValue("white", "black");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const label = useColorModeValue("gray.600", "gray.400");
  const text = useColorModeValue("gray.800", "white");
 
const borderClr = useColorModeValue("gray.200", "gray.700");
const textClr = useColorModeValue("gray.800", "gray.100");

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

    seller: user.seller || false,
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
    try {
      const payload = { ...formData };

      // ❌ do NOT send empty password
      if (!payload.password) delete payload.password;

      // ❌ do NOT send sellerInfo if not seller
      if (!payload.seller) delete payload.sellerInfo;

      const res = await fetch(
        `https://smarttry.onrender.com/api/users/${user._id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      onClose();
      window.location.reload(); // later replace with context update
    } catch (err) {
      console.error(err);
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
              src={user.image || user.photo}
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
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              {cartCount || 0}
            </Badge>
          </Flex>

          <Divider my={4} />

          {/* 4️⃣ User Personal Info */}
          <Stack spacing={3}>
            <InfoRow label="Birthday" value={user.birthday || "Not provided"} />
            <InfoRow label="Gender" value={user.gender || "Not specified"} />
            <InfoRow label="Bio" value={user.bio || "No bio added"} />
            <InfoRow
              label="Seller Account"
              value={user.seller ? "Yes" : "No"}
              badge={user.seller}
            />
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
>
  <ModalOverlay />

  <ModalContent bg={cardBg} borderRadius="xl">
    <ModalHeader color={textClr}>Edit Profile</ModalHeader>
    <ModalCloseButton />

    <ModalBody>
      <Stack spacing={4}>

        {/* Basic Info */}
        <Input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
        />

        <Input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          type="date"
          name="birthday"
          value={formData.birthday || ""}
          onChange={handleChange}
        />

        <Select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
        >
          <option value="">Select gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </Select>

        <Textarea
          name="bio"
          placeholder="Bio"
          value={formData.bio}
          onChange={handleChange}
        />

        <Input
          type="password"
          name="password"
          placeholder="New Password (optional)"
          value={formData.password}
          onChange={handleChange}
        />

        {/* Seller Section */}
        {formData.seller && (
          <Box
            border="1px solid"
            borderColor={borderClr}
            borderRadius="lg"
            p={4}
          >
            <Text fontWeight="semibold" mb={3} color={textClr}>
              Seller Information
            </Text>

            <Stack spacing={3}>
              <Input
                name="sellerName"
                placeholder="Seller Name"
                value={formData.sellerInfo.sellerName}
                onChange={handleSellerChange}
              />

              <Input
                name="businessName"
                placeholder="Business Name"
                value={formData.sellerInfo.businessName}
                onChange={handleSellerChange}
              />

              <Input
                name="gstNumber"
                placeholder="GST Number"
                value={formData.sellerInfo.gstNumber}
                onChange={handleSellerChange}
              />

              <Input
                name="contactNumber"
                placeholder="Contact Number"
                value={formData.sellerInfo.contactNumber}
                onChange={handleSellerChange}
              />

              <Input
                name="website"
                placeholder="Website"
                value={formData.sellerInfo.website}
                onChange={handleSellerChange}
              />

              <Textarea
                name="businessAddress"
                placeholder="Business Address"
                value={formData.sellerInfo.businessAddress}
                onChange={handleSellerChange}
              />

              <Textarea
                name="description"
                placeholder="Seller Description"
                value={formData.sellerInfo.description}
                onChange={handleSellerChange}
              />
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

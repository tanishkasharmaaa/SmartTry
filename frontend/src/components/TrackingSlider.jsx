import {
  Box,
  Flex,
  Text,
  Circle,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import {
  FaBoxOpen,
  FaTruck,
  FaCheckCircle,
  FaClipboardList,
} from "react-icons/fa";

const getUniqueTrackingHistory = (history = []) => {
  const seen = new Set();
  return history.filter((item) => {
    if (seen.has(item.status)) return false;
    seen.add(item.status);
    return true;
  });
};

// Status → Icon mapper
const statusIcon = (status) => {
  switch (status) {
    case "Processing":
      return FaClipboardList;
    case "Packed":
      return FaBoxOpen;
    case "Shipped":
    case "Out for Delivery":
      return FaTruck;
    case "Delivered":
      return FaCheckCircle;
    default:
      return FaBoxOpen;
  }
};

const TrackingSlider = ({ trackingHistory = [] }) => {
  const cleanedHistory = getUniqueTrackingHistory(trackingHistory);
  const containerRef = useRef(null);

  const bgTrack = useColorModeValue("#dcdcdc", "#333");
  const green = "#2ECC71"; // Amazon-like green
  const inactive = useColorModeValue("#999", "#555");
  const cardBg = useColorModeValue("#fafafa", "#111");

  const latestStatus = cleanedHistory[cleanedHistory.length - 1]?.status;
  const activeIndex = cleanedHistory.findIndex(
    (s) => s.status === latestStatus
  );

  // Auto-scroll to active status
   useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [cleanedHistory.length]);

  return (
    <Box mt={4} bg={cardBg} p={4} borderRadius="md">
      <Text fontSize="sm" mb={3} fontWeight="semibold">
        Order Tracking
      </Text>

      <Flex
        ref={containerRef}
        gap={10}
        overflowX="auto"
        pb={3}
        sx={{ "&::-webkit-scrollbar": { display: "none" } }}
      >
        {cleanedHistory.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isActive = index === activeIndex;
          const StepIcon = statusIcon(step.status);

          return (
            <Flex
              key={step._id}
              direction="column"
              align="center"
              minW="150px"
              position="relative"
            >
              {/* Progress Line */}
              {index !== 0 && (
                <Box
                  position="absolute"
                  top="20px"
                  left="-60%"
                  w="120%"
                  h="3px"
                  bg={isCompleted ? green : bgTrack}
                  transition="all 0.4s ease"
                />
              )}

              {/* Status Circle */}
              <Circle
                size="38px"
                bg={isCompleted ? green : inactive}
                color="white"
                zIndex={1}
                animation={isActive ? "pulse 1.5s infinite" : "none"}
              >
                <Icon as={StepIcon} boxSize={4} />
              </Circle>

              {/* Status Text */}
              <Text
                mt={2}
                fontSize="sm"
                fontWeight={isActive ? "bold" : "medium"}
                textAlign="center"
                color={isCompleted ? green : inactive}
              >
                {step.status}
              </Text>

              {/* Time */}
              <Text fontSize="xs" color="gray.500" textAlign="center">
                {new Date(step.updatedAt).toLocaleString()}
              </Text>
            </Flex>
          );
        })}
      </Flex>

      {/* Pulse Animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.6); }
            70% { transform: scale(1.3); box-shadow: 0 0 0 12px rgba(46, 204, 113, 0); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </Box>
  );
};

export default TrackingSlider;

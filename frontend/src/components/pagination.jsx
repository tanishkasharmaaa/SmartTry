import { HStack, Button } from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const bgColor = useColorModeValue("white", "black");
  const textColor = useColorModeValue("black", "white");
  const hoverBg = useColorModeValue("gray.200", "gray.700");
  const activeBg = useColorModeValue("black", "white");
  const activeText = useColorModeValue("white", "black");

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <HStack spacing={2} mt={6} justify="center">
      <Button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        isDisabled={currentPage === 1}
        bg={bgColor}
        color={textColor}
        _hover={{ bg: hoverBg }}
      >
        Prev
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          onClick={() => onPageChange(page)}
          size="sm"
          bg={page === currentPage ? activeBg : bgColor}
          color={page === currentPage ? activeText : textColor}
          borderRadius="sm"
          _hover={{
            bg: page === currentPage ? activeBg : hoverBg,
            color: page === currentPage ? activeText : textColor,
          }}
        >
          {page}
        </Button>
      ))}

      <Button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        isDisabled={currentPage === totalPages}
        bg={bgColor}
        color={textColor}
        _hover={{ bg: hoverBg }}
      >
        Next
      </Button>
    </HStack>
  );
};

export default Pagination;

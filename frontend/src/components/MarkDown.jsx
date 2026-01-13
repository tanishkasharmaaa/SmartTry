import ReactMarkdown from "react-markdown";
import { Box } from "@chakra-ui/react";

const MarkDown = ({ text }) => {
  return (
    <Box
    
    >
      <ReactMarkdown>
        {text}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkDown;

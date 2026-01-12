import {
  Box,
  Heading,
  Text,
  Button,
  Image,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";

export default function About() {
  const bg = useColorModeValue("gray.50", "gray.900");
  const sectionBg = useColorModeValue("white", "gray.800");
  const muted = useColorModeValue("gray.600", "gray.400");
  const heading = useColorModeValue("gray.900", "gray.100");
  const border = useColorModeValue("gray.200", "gray.700");

  return (
    <Box bg={bg} minH="100vh">

      {/* HERO SECTION */}
      <Box
        textAlign="center"
        py={{ base: 16, md: 24 }}
        px={6}
        bg={useColorModeValue("gray.100", "gray.850")}
      >
        <Heading size="2xl" color={heading} mb={4}>
         SM△RTTRY
        </Heading>
        <Text fontSize="lg" color={muted} maxW="720px" mx="auto">
          An AI-powered fashion assistant that understands your style,
          budget, and intent — and helps you shop smarter, not harder.
        </Text>
      </Box>

      {/* WHAT IS SMARTTRY */}
      <Box maxW="1100px" mx="auto" py={16} px={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12} alignItems="center">
          <Image
            src="Smarttry.png"
            alt="Smart shopping"
            borderRadius="xl"
            objectFit="cover"
          />

          <VStack align="start" spacing={4}>
            <Heading size="lg" color={heading}>
              Why SmartTry Exists
            </Heading>
            <Text color={muted}>
              Online shopping is overwhelming — too many products, filters,
              and decisions. SmartTry changes that by letting users
              <b> talk naturally</b>.
            </Text>
            <Text color={muted}>
              Ask things like <i>“Girls outfits under 3000”</i> or
              <i> “Trending shoes for men”</i> and SmartTry instantly
              understands intent, price, gender, and trends.
            </Text>
            <Text color={muted}>
              Behind the scenes, SmartTry combines
              <b> manual intelligence + AI fallback</b> to stay fast,
              accurate, and reliable — even when AI APIs fail.
            </Text>
          </VStack>
        </SimpleGrid>
      </Box>

      <Divider borderColor={border} />

      {/* ABOUT YOU */}
      <Box maxW="1100px" mx="auto" py={16} px={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12}>
          <VStack align="start" spacing={4}>
            <Heading size="lg" color={heading}>
              Who Built SmartTry?
            </Heading>
            <Text color={muted}>
              Hi, I’m <b>Tanishka Sharma</b> — a passionate Full Stack Developer
              who loves building real-world products that users actually enjoy
              using.
            </Text>
            <Text color={muted}>
              I specialize in the <b>MERN stack</b> and enjoy working on
              AI-powered systems, scalable backends, and clean UI experiences
              using Chakra UI.
            </Text>
            <Text color={muted}>
              My focus is always on <b>clarity, performance, and user intent</b>.
              SmartTry is a reflection of that mindset.
            </Text>
          </VStack>

          <Box
            bg={sectionBg}
            p={6}
            borderRadius="xl"
            border="1px solid"
            borderColor={border}
          >
            <Heading size="sm" mb={3} color={heading}>
              Technical Snapshot
            </Heading>
            <Text fontSize="sm" color={muted}>
              JavaScript • React • Node.js • Express • MongoDB • WebSocket •
              Gemini AI • JWT • Chakra UI • REST APIs • System Design
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      <Divider borderColor={border} />

      {/* PORTFOLIO */}
      <Box maxW="1200px" mx="auto" py={16} px={6}>
        <Heading textAlign="center" mb={12} color={heading}>
          Selected Work
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <PortfolioCard

            link="/"
            image="https://images.unsplash.com/photo-1557821552-17105176677c"
            title="SmartTry AI"
            desc="AI-powered fashion assistant with real-time chat, recommendations, and fallback logic."
            tech="MERN • WebSocket • Gemini AI"
          />

          <PortfolioCard
          link="https://ask-ai-mu-nine.vercel.app/"
            image="https://images.unsplash.com/photo-1556155092-8707de31f9c4"
            title="AskAI Platform"
            desc="Secure AI chat platform with JWT auth, structured responses, and quota-safe fallbacks."
            tech="AI • JWT • Chakra UI"
          />

          <PortfolioCard
          link={'https://nord-storm.vercel.app/'}
            image="https://images.unsplash.com/photo-1512436991641-6745cdb1723f"
            title="Nordstrom Rack Clone"
            desc="E-commerce app with filtering, session handling, and responsive UI."
            tech="React • Chakra UI"
          />
        </SimpleGrid>
      </Box>

      {/* CTA */}
      <Box
        bg={useColorModeValue("gray.200", "gray.800")}
        py={16}
        textAlign="center"
      >
        <Heading size="md" color={heading} mb={4}>
          Want to build something impactful?
        </Heading>
        <Text color={muted} mb={6}>
          I love working on products that combine design, performance, and AI.
        </Text>
       <Button 
  as="a" 
  colorScheme="gray" 
  variant="solid" 
  href="https://tanishka-portfolio-wvi4.vercel.app/" 
  target="_blank" 
  rel="noopener noreferrer"
>
  View Full Portfolio
</Button>

      </Box>
    </Box>
  );
}

/* ---------------- PORTFOLIO CARD ---------------- */
function PortfolioCard({ image, title, desc, tech,link }) {
  const bg = useColorModeValue("white", "gray.800");
  const muted = useColorModeValue("gray.600", "gray.400");
  const border = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
    as={'a'}
    href={link}
    bg={bg}
      borderRadius="xl"
      overflow="hidden"
      border="1px solid"
      borderColor={border}
      transition="all 0.3s"
      _hover={{ transform: "translateY(-6px)" }}
    >
      <Image src={image} h="200px" w="100%" objectFit="cover" />
      <Box p={5}>
        <Heading size="sm" mb={2}>
          {title}
        </Heading>
        <Text fontSize="sm" color={muted} mb={3}>
          {desc}
        </Text>
        <Text fontSize="xs" color={muted}>
          {tech}
        </Text>
      </Box>
    </Box>
  );
}

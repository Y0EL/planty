import { Container } from "@chakra-ui/react";
import { Dropzone } from "../components";

/**
 * Simplified Home component with just the essential Dropzone feature
 */
export const Home = () => {
  return (
    <Container 
      maxW={"container.xl"} 
      py={{ base: 4, md: 6 }}
      px={{ base: 2, md: 4 }}
      centerContent
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Dropzone />
    </Container>
  );
};

export default Home; 
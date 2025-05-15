import { Box, Container, HStack } from "@chakra-ui/react";
import { VeChainKitWalletButton } from "./ConnectWalletButton";

export const Navbar = () => {
  return (
    <Box
      px={0}
      position={"sticky"}
      top={0}
      zIndex={10}
      py={4}
      h={"auto"}
      w={"full"}
      bg={"#f7f7f7"}
    >
      <Container
        w="full"
        display="flex"
        flexDirection="row"
        justifyContent="flex-end"
        alignItems={"center"}
        maxW={"container.xl"}
      >
        <HStack spacing={4}>
          <VeChainKitWalletButton />
        </HStack>
      </Container>
    </Box>
  );
};

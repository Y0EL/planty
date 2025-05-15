import { Button, Fade, HStack, Text } from "@chakra-ui/react";
import { useWallet, useDAppKitWalletModal, WalletButton } from "@vechain/vechain-kit";
import { FaWallet } from "react-icons/fa6";
import { AddressIcon } from "./Icon";
import { humanAddress } from "@repo/utils/FormattingUtils";

export const ConnectWalletButton = () => {
  const { account } = useWallet();
  const { open } = useDAppKitWalletModal();

  if (!account)
    return (
      <Fade in={true}>
        <Button
          onClick={open}
          colorScheme="primary"
          size="md"
          leftIcon={<FaWallet />}
          data-testid="connect-wallet"
        >
          Connect Wallet
        </Button>
      </Fade>
    );

  return (
    <Fade in={true}>
      <Button
        onClick={open}
        rounded={"full"}
        color="black"
        size="md"
        bg="rgba(235, 236, 252, 1)"
      >
        <HStack spacing={2}>
          <AddressIcon address={account.address} boxSize={4} rounded={"full"} />
          <Text fontWeight={"400"}>{account.domain || humanAddress(account.address, 4, 6)}</Text>
        </HStack>
      </Button>
    </Fade>
  );
};

export const VeChainKitWalletButton = () => {
  return (
    <WalletButton 
      mobileVariant="icon"
      desktopVariant="icon"
      buttonStyle={{
        rounded: "full",
        color: "black",
        size: "md",
        bg: "rgba(235, 236, 252, 1)",
        p: 2.5,
        minW: "45px",
        minH: "45px"
      }}
    />
  );
};

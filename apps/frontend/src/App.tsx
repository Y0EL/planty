import { VeChainKitProvider } from "@vechain/vechain-kit";
import { ChakraProvider } from "@chakra-ui/react";
import {
  Navbar,
  SubmissionModal,
} from "./components";
import { Home } from "./pages";
import { lightTheme } from "./theme";

function App() {
  return (
    <ChakraProvider theme={lightTheme}>
      <VeChainKitProvider
        network={{
          type: "test",
        }}
        dappKit={{
          allowedWallets: ["veworld"],
          walletConnectOptions: {
            projectId: "faab2bc65e788124573c79a1983cd61b",
            metadata: {
              name: "Planty App",
              description: "Planty App - Reward sustainable actions",
              url: typeof window !== "undefined" ? window.location.origin : "",
              icons: [typeof window !== "undefined" ? window.location.origin + "/favicon.ico" : ""],
            },
          },
        }}
        loginMethods={[
          { method: "vechain", gridColumn: 4 }
        ]}
        feeDelegation={{
          delegatorUrl: "https://sponsor-testnet.vechain.energy/by/441",
          delegateAllTransactions: false,
        }}
      >
        <Navbar />
        <Home />
        {/* MODALS  */}
        <SubmissionModal />
      </VeChainKitProvider>
    </ChakraProvider>
  );
}

export default App;

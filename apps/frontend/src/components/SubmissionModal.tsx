import {
  Modal,
  ModalContent,
  ModalOverlay,
  VStack,
  Text,
  HStack,
  Image,
  Box,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useDisclosure, useSubmission } from "../hooks";
import loaderAnimation from "../assets/lottie/loader-json.json";
import Lottie from "lottie-react";
import { AirdropIcon, AlertIcon } from "./Icon";
import { useMemo } from "react";

export const SubmissionModal = () => {
  const { isLoading, response } = useSubmission();
  const { isOpen, onClose } = useDisclosure();
  const iconSize = useBreakpointValue({ base: 120, md: 200 }) || 120;

  const renderContent = useMemo(() => {
    // Handle error responses
    if (response?.error) {
      return (
        <VStack
          bgGradient={
            "radial-gradient(76.36% 85.35% at 50.12% 27.48%, rgba(252, 230, 207, 0.82) 38.14%, rgba(254, 194, 194, 0.82) 100%), #F07D00"
          }
          minH={{ base: "30vh", md: "40vh" }}
          w="100%"
          borderRadius={16}
          justifyContent={"center"}
          alignItems={"center"}
          p={4}
        >
          <AlertIcon size={iconSize} color="#D23F63" />
          <Text fontSize={{ base: 24, md: 32 }} fontWeight={600} textAlign="center">
            {response.error.code === 409 ? "Limit Reached" : "Error"}
          </Text>
          <HStack px={4}>
            <Text fontSize={{ base: 14, md: 16 }} fontWeight={400} textAlign={"center"}>
              {response.error.message}
            </Text>
          </HStack>
        </VStack>
      );
    }

    // Handle AI validation responses
    const isValid = response?.validation.validityFactor === 1;

    return isValid ? (
      <VStack
        bgGradient={
          "radial-gradient(76.36% 85.35% at 50.12% 27.48%, rgba(230, 252, 207, 0.82) 38.14%, rgba(194, 212, 254, 0.82) 100%), #7DF000"
        }
        minH={{ base: "30vh", md: "40vh" }}
        w="100%"
        borderRadius={16}
        justifyContent={"center"}
        alignItems={"center"}
        p={4}
      >
        <AirdropIcon size={iconSize} color="#373EDF" />
        <Text fontSize={{ base: 24, md: 32 }} fontWeight={600} textAlign="center">
          Congratulations!
        </Text>
        <HStack>
          <Text fontSize={{ base: 18, md: 24 }} fontWeight={400}>
            You've earned 1
          </Text>
          <Image src="b3tr-token.svg" h={{ base: "24px", md: "32px" }} />
        </HStack>
      </VStack>
    ) : (
      <VStack
        bgGradient={
          "radial-gradient(76.36% 85.35% at 50.12% 27.48%, rgba(230, 252, 207, 0.82) 38.14%, rgba(194, 212, 254, 0.82) 100%), #7DF000"
        }
        minH={{ base: "30vh", md: "40vh" }}
        w="100%"
        borderRadius={16}
        justifyContent={"center"}
        alignItems={"center"}
        p={4}
      >
        <AlertIcon size={iconSize} color="#D23F63" />
        <Text fontSize={{ base: 24, md: 32 }} fontWeight={600} textAlign="center">
          Oops! AI says
        </Text>
        <HStack px={4}>
          <Text fontSize={{ base: 12, md: 14 }} fontWeight={400} textAlign={"center"}>
            {response?.validation.descriptionOfAnalysis}
          </Text>
        </HStack>
      </VStack>
    );
  }, [response, iconSize]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      trapFocus={true}
      isCentered={true}
      closeOnOverlayClick={!isLoading}
      size={{ base: "sm", md: "md" }}
    >
      <ModalOverlay />
      <ModalContent 
        borderRadius={16} 
        mx={4}
        my={0}
        maxH={{ base: "80vh", md: "90vh" }}
        overflow="hidden"
      >
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%" width="100%" pointerEvents="none">
            <Lottie
              animationData={loaderAnimation}
              loop={true}
              style={{ width: "150px", height: "150px" }}
            />
          </Box>
        ) : (
          renderContent
        )}
      </ModalContent>
    </Modal>
  );
};

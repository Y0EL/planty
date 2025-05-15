import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box } from "@chakra-ui/react";
import { ScanIcon } from "./Icon";
import { blobToBase64, getDeviceId, resizeImage } from "../util";
import { useWallet } from "@vechain/vechain-kit";
import { submitReceipt } from "../networking";
import { useDisclosure, useSubmission } from "../hooks";

export const Dropzone = () => {
  const { account } = useWallet();

  const { setIsLoading, setResponse } = useSubmission();
  const { onOpen } = useDisclosure();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      onFileUpload(acceptedFiles); // Pass the files to the callback
    },
    maxFiles: 1, // Allow only one file
    accept: {
      "image/*": [], // Accept only image files
    },
  });

  const onFileUpload = useCallback(
    async (files: File[]) => {
      if (files.length > 1 || files.length === 0) {
        setResponse({
          validation: {
            validityFactor: 0,
            descriptionOfAnalysis: "",
          },
          error: {
            message: "Please upload only one file",
            code: 400
          }
        });
        onOpen();
        return;
      }

      if (!account) {
        setResponse({
          validation: {
            validityFactor: 0,
            descriptionOfAnalysis: "",
          },
          error: {
            message: "Please connect your wallet before uploading a receipt",
            code: 401
          }
        });
        onOpen();
        return;
      }

      setIsLoading(true);
      onOpen();

      const file = files[0];

      const resizedBlob = await resizeImage(file);
      const base64Image = await blobToBase64(resizedBlob as Blob);

      const deviceID = await getDeviceId();

      try {
        const response = await submitReceipt({
          address: account.address,
          deviceID,
          image: base64Image,
        });

        setResponse(response);
      } catch (error) {
        // Error is now handled by submitReceipt function
      } finally {
        setIsLoading(false);
      }
    },
    [account, onOpen, setIsLoading, setResponse],
  );

  return (
    <Box
      {...getRootProps()}
      p={5}
      border="2px"
      borderColor={isDragActive ? "green.300" : "gray.300"}
      borderStyle="dashed"
      borderRadius="full"
      bg={isDragActive ? "green.100" : "gray.50"}
      textAlign="center"
      cursor="pointer"
      _hover={{
        borderColor: "green.500",
        bg: "green.50",
        transform: "scale(1.05)",
        transition: "all 0.2s ease-in-out",
      }}
      w={{ base: "150px", md: "180px" }}
      h={{ base: "150px", md: "180px" }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      boxShadow="md"
    >
      <input {...getInputProps()} />
      <ScanIcon size={isDragActive ? 100 : 80} color={isDragActive ? "green" : "gray"} />
    </Box>
  );
};

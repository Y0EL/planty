import axios, { AxiosError } from "axios";
import { ReceiptData } from "./type";
import { backendURL } from "../config";

export type Response = {
  validation: {
    validityFactor: number;
    descriptionOfAnalysis: string;
  };
  error?: {
    message: string;
    code: number;
  };
};

export const submitReceipt = async (data: ReceiptData): Promise<Response> => {
  try {
    const response = await axios.post(`${backendURL}/submitReceipt`, data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const statusCode = axiosError.response.status;
        const errorData = axiosError.response.data as any;
        
        // Format error response
        return {
          validation: {
            validityFactor: 0,
            descriptionOfAnalysis: "",
          },
          error: {
            message: errorData.message || "Unknown error occurred",
            code: statusCode
          }
        };
      }
    }
    
    // Generic error fallback
    return {
      validation: {
        validityFactor: 0,
        descriptionOfAnalysis: "",
      },
      error: {
        message: "Failed to submit receipt. Please try again later.",
        code: 500
      }
    };
  }
};

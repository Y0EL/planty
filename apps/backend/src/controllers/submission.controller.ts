import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { OpenaiService } from '@/services/openai.service';
import { Submission } from '@/interfaces/submission.interface';
import { HttpException } from '@/exceptions/HttpException';
import { ContractsService } from '@/services/contracts.service';

export class SubmissionController {
  public openai = Container.get(OpenaiService);
  public contracts = Container.get(ContractsService);

  public submitReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body: Omit<Submission, 'timestamp'> = req.body;

      const submissionRequest: Submission = {
        ...body,
        timestamp: Date.now(),
      };
      
      console.log(`Processing submission request for address: ${submissionRequest.address}`);
      
      // Submission validation with smart contract
      try {
        await this.contracts.validateSubmission(submissionRequest);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        if (validationError instanceof HttpException) {
          throw validationError;
        }
        throw new HttpException(400, `Failed to validate submission: ${validationError.message || 'Unknown error'}`);
      }

      // Image validation with OpenAI
      let validationResult;
      try {
        validationResult = await this.openai.validateImage(body.image);
      } catch (aiError) {
        console.error('OpenAI validation error:', aiError);
        throw new HttpException(500, `Error validating image: ${aiError.message || 'Unknown error'}`);
      }

      if (validationResult == undefined || !('validityFactor' in (validationResult as object))) {
        throw new HttpException(500, 'Invalid validation result structure from image analysis');
      }

      const validityFactor = validationResult['validityFactor'];
      console.log(`Image validity factor: ${validityFactor}`);

      // Register submission if image is valid
      if (validityFactor > 0.5) {
        console.log('Image passed validation, registering submission on the blockchain');
        try {
          const success = await this.contracts.registerSubmission(submissionRequest);
          if (!success) {
            throw new HttpException(500, 'Failed to register submission - transaction was not successful');
          }
        } catch (contractError) {
          console.error('Contract interaction error:', contractError);
          if (contractError instanceof HttpException) {
            throw contractError;
          }
          throw new HttpException(500, `Error registering submission: ${contractError.message || 'Unknown error'}`);
        }
      } else {
        console.log('Image did not pass validation threshold');
      }

      res.status(200).json({ validation: validationResult });
    } catch (error) {
      next(error);
      return;
    }
  };
}

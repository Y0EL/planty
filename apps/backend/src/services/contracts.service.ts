import { HttpException } from '@/exceptions/HttpException';
import { Submission } from '@/interfaces/submission.interface';
import { plantyContract } from '@/utils/thor';
import { Service } from 'typedi';
import * as console from 'node:console';
import { unitsUtils } from '@vechain/sdk-core';
import { REWARD_AMOUNT } from '@config';

interface BatchSubmissionItem {
  address: string;
  amount: number;
}

@Service()
export class ContractsService {
  public async registerSubmission(submission: Submission): Promise<boolean> {
    try {
      console.log(`Attempting to register submission for address: ${submission.address}`);
      
      // 1. Check the current cycle information
      const currentCycle = (await plantyContract.read.getCurrentCycle())[0];
      console.log(`Current cycle: ${currentCycle}`);
      
      const nextCycleBlock = (await plantyContract.read.getNextCycleBlock())[0];
      console.log(`Next cycle block: ${nextCycleBlock}`);
      
      // 2. Check if there are rewards available for the current cycle
      const rewardsTotal = (await plantyContract.read.rewards(currentCycle))[0];
      const rewardsLeft = (await plantyContract.read.rewardsLeft(currentCycle))[0];
      
      console.log(`Rewards total for cycle ${currentCycle}: ${unitsUtils.formatUnits(rewardsTotal.toString(), 'ether')} B3TR`);
      console.log(`Rewards left for cycle ${currentCycle}: ${unitsUtils.formatUnits(rewardsLeft.toString(), 'ether')} B3TR`);
      
      if (BigInt(rewardsTotal) <= BigInt(0)) {
        console.error('No rewards allocated for current cycle:', currentCycle);
        throw new HttpException(400, 'No rewards have been allocated for the current cycle. Please contact the administrator.');
      }
      
      if (BigInt(rewardsLeft) <= BigInt(0)) {
        console.error('No rewards left for current cycle:', currentCycle);
        throw new HttpException(400, 'No rewards available for the current cycle. Please try again in the next cycle.');
      }

      // 3. Prepare reward amount
      const rewardAmountInWei = unitsUtils.parseUnits(REWARD_AMOUNT, 'ether');
      console.log(`Reward amount: ${REWARD_AMOUNT} B3TR (${rewardAmountInWei} wei)`);
      
      // 4. Check if we have enough rewards left
      if (BigInt(rewardsLeft) < BigInt(rewardAmountInWei.toString())) {
        console.error(`Not enough rewards left. Required: ${REWARD_AMOUNT}, Available: ${unitsUtils.formatUnits(rewardsLeft.toString(), 'ether')}`);
        throw new HttpException(400, `Not enough rewards left in the current cycle. Please try again in the next cycle.`);
      }
      
      // 5. Send the transaction
      console.log(`Sending transaction to register submission...`);
      const tx = await plantyContract.transact.registerValidSubmission(submission.address, rewardAmountInWei);
      console.log(`Transaction sent with data: ${JSON.stringify(tx)}`);
      
      // 6. Wait for transaction confirmation
      console.log(`Waiting for transaction confirmation...`);
      const result = await tx.wait();
      console.log(`Transaction result: ${JSON.stringify(result)}`);
      
      // 7. Check if transaction was successful
      if (result.reverted) {
        console.error('Transaction reverted:', result);
        throw new HttpException(500, 'Transaction reverted. The blockchain rejected this transaction.');
      }
      
      console.log(`Successfully registered submission for ${submission.address} with reward ${REWARD_AMOUNT} B3TR`);
      return true;
    } catch (error) {
      console.error('Error registering submission:', error);
      
      // Handle specific error cases
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Check for common error messages and provide better error messages
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('gas') || errorMessage.includes('fee')) {
        throw new HttpException(500, 'Transaction failed due to gas or fee issues. Please try again later.');
      } else if (errorMessage.includes('nonce')) { 
        throw new HttpException(500, 'Transaction failed due to nonce issues. Please try again later.');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        throw new HttpException(500, 'Transaction timed out. Please try again later.');
      }
      
      throw new HttpException(500, `Error registering submission: ${errorMessage}`);
    }
  }

  public async registerBatchSubmissions(submissions: BatchSubmissionItem[]): Promise<boolean> {
    try {
      console.log(`Starting batch submission for ${submissions.length} participants`);
      
      // First check if there are rewards available for the current cycle
      const currentCycle = (await plantyContract.read.getCurrentCycle())[0];
      const rewardsTotal = (await plantyContract.read.rewards(currentCycle))[0];
      const rewardsLeft = (await plantyContract.read.rewardsLeft(currentCycle))[0];
      
      console.log(`Current cycle: ${currentCycle}`);
      console.log(`Rewards total: ${unitsUtils.formatUnits(rewardsTotal.toString(), 'ether')} B3TR`);
      console.log(`Rewards left: ${unitsUtils.formatUnits(rewardsLeft.toString(), 'ether')} B3TR`);
      
      if (BigInt(rewardsTotal) <= BigInt(0)) {
        console.error('No rewards allocated for current cycle:', currentCycle);
        throw new HttpException(400, 'No rewards have been allocated for the current cycle');
      }
      
      // Calculate total amount needed
      const totalAmount = submissions.reduce(
        (sum, item) => sum + BigInt(unitsUtils.parseUnits(item.amount.toString(), 'ether')), 
        BigInt(0)
      );
      
      console.log(`Total reward amount needed: ${unitsUtils.formatUnits(totalAmount.toString(), 'ether')} B3TR`);
      
      if (BigInt(rewardsLeft) < totalAmount) {
        console.error('Not enough rewards left for batch submission. Available:', unitsUtils.formatUnits(rewardsLeft.toString(), 'ether'), 'Required:', unitsUtils.formatUnits(totalAmount.toString(), 'ether'));
        throw new HttpException(400, 'Not enough rewards available for these submissions');
      }

      // Process submissions one by one since we don't have a batch function in the contract
      console.log(`Processing ${submissions.length} submissions in sequence...`);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const item of submissions) {
        console.log(`Processing reward for address: ${item.address}, amount: ${item.amount} B3TR`);
        
        try {
          // Check if user has reached max submissions
          const isMaxSubmissionsReached = (await plantyContract.read.isUserMaxSubmissionsReached(item.address))[0];
          if (Boolean(isMaxSubmissionsReached) === true) {
            console.warn(`Max submissions reached for address: ${item.address}, skipping...`);
            failCount++;
            continue;
          }
          
          const amountInWei = unitsUtils.parseUnits(item.amount.toString(), 'ether');
          console.log(`Amount in wei: ${amountInWei}`);
          
          const tx = await plantyContract.transact.registerValidSubmission(
            item.address, 
            amountInWei
          );
          
          console.log(`Transaction sent: ${JSON.stringify(tx)}`);
          
          const result = await tx.wait();
          console.log(`Transaction result: ${JSON.stringify(result)}`);
          
          if (result.reverted) {
            console.error(`Transaction for address ${item.address} reverted:`, result);
            failCount++;
          } else {
            console.log(`Successfully rewarded address: ${item.address} with ${item.amount} B3TR`);
            successCount++;
          }
        } catch (itemError) {
          console.error(`Error processing submission for address ${item.address}:`, itemError);
          failCount++;
          // Continue with other submissions even if one fails
        }
      }
      
      console.log(`Batch processing completed. Success: ${successCount}, Failed: ${failCount}`);
      return successCount > 0; // Return true if at least one submission was successful
    } catch (error) {
      console.error('Error processing batch submission:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, `Error processing batch submission: ${error.message || 'Unknown error'}`);
    }
  }

  public async validateSubmission(submission: Submission): Promise<void> {
    try {
      console.log(`Validating submission for address: ${submission.address}`);
      
      // Check if the current cycle is active
      const currentCycle = (await plantyContract.read.getCurrentCycle())[0];
      const nextCycleBlock = (await plantyContract.read.getNextCycleBlock())[0];
      
      console.log(`Current cycle: ${currentCycle}, Next cycle block: ${nextCycleBlock}`);
      
      // Check if user has reached maximum submissions
      const isMaxSubmissionsReached = (await plantyContract.read.isUserMaxSubmissionsReached(submission.address))[0];
      console.log(`Is max submissions reached: ${isMaxSubmissionsReached}`);
      
      if (Boolean(isMaxSubmissionsReached) === true) {
        throw new HttpException(409, `Planty: Maximum submissions reached for this cycle`);
      }
      
      // Check if rewards are available
      const rewardsTotal = (await plantyContract.read.rewards(currentCycle))[0];
      const rewardsLeft = (await plantyContract.read.rewardsLeft(currentCycle))[0];
      
      console.log(`Rewards total: ${unitsUtils.formatUnits(rewardsTotal.toString(), 'ether')} B3TR`);
      console.log(`Rewards left: ${unitsUtils.formatUnits(rewardsLeft.toString(), 'ether')} B3TR`);
      
      if (BigInt(rewardsTotal) <= BigInt(0)) {
        throw new HttpException(400, 'No rewards have been allocated for the current cycle');
      }
      
      if (BigInt(rewardsLeft) <= BigInt(0)) {
        throw new HttpException(400, 'No rewards left for the current cycle');
      }
      
      const rewardAmountInWei = unitsUtils.parseUnits(REWARD_AMOUNT, 'ether');
      if (BigInt(rewardsLeft) < BigInt(rewardAmountInWei.toString())) {
        throw new HttpException(400, 'Not enough rewards left for this submission');
      }
      
      console.log(`Submission validated successfully for address: ${submission.address}`);
    } catch (error) {
      console.error('Error validating submission:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, `Error validating submission with smart contract: ${error.message || 'Unknown error'}`);
    }
  }
}

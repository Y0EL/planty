import { ethers } from "hardhat";
import { config } from "@repo/config-contract";
import { formatEther, parseEther } from "ethers";

async function main() {
  console.log("Checking Planty contract status...");

  // Connect to the Planty contract
  const plantyAddress = config.CONTRACT_ADDRESS;
  console.log(`Planty contract address: ${plantyAddress}`);
  
  const Planty = await ethers.getContractFactory("Planty");
  const planty = Planty.attach(plantyAddress);

  // Get current contract settings
  const currentCycle = await planty.getCurrentCycle();
  const nextCycle = await planty.nextCycle();
  const maxSubmissionsPerCycle = await planty.maxSubmissionsPerCycle();
  const cycleDuration = await planty.cycleDuration();
  const lastCycleStartBlock = await planty.lastCycleStartBlock();
  const nextCycleBlock = await planty.getNextCycleBlock();
  const currentBlock = await ethers.provider.getBlockNumber();
  const appId = await planty.appId();
  
  // Get rewards info
  const rewardsCurrentCycle = await planty.rewards(currentCycle);
  const rewardsLeftCurrentCycle = await planty.rewardsLeft(currentCycle);
  const rewardsNextCycle = await planty.rewards(nextCycle);
  const rewardsLeftNextCycle = await planty.rewardsLeft(nextCycle);
  
  // Get X2EarnRewardsPool contract info
  const x2EarnRewardsPoolAddress = await planty.x2EarnRewardsPoolContract();
  
  console.log("\n--- Basic Contract Info ---");
  console.log(`App ID: ${appId}`);
  console.log(`X2EarnRewardsPool contract: ${x2EarnRewardsPoolAddress}`);
  
  console.log("\n--- Cycle Info ---");
  console.log(`Current cycle: ${currentCycle}`);
  console.log(`Next cycle: ${nextCycle}`);
  console.log(`Max submissions per cycle: ${maxSubmissionsPerCycle}`);
  console.log(`Cycle duration (blocks): ${cycleDuration}`);
  console.log(`Last cycle start block: ${lastCycleStartBlock}`);
  console.log(`Next cycle block: ${nextCycleBlock}`);
  console.log(`Current block: ${currentBlock}`);
  console.log(`Blocks until next cycle: ${Number(nextCycleBlock) - currentBlock}`);
  
  console.log("\n--- Rewards Info ---");
  console.log(`Current cycle rewards: ${formatEther(rewardsCurrentCycle)} B3TR`);
  console.log(`Current cycle rewards left: ${formatEther(rewardsLeftCurrentCycle)} B3TR`);
  console.log(`Next cycle rewards: ${formatEther(rewardsNextCycle)} B3TR`);
  console.log(`Next cycle rewards left: ${formatEther(rewardsLeftNextCycle)} B3TR`);

  // Check total submissions for current cycle
  const totalSubmissions = await planty.totalSubmissions(currentCycle);
  console.log(`Total submissions in current cycle: ${totalSubmissions}`);

  // Check available funds
  const X2EarnRewardsPool = await ethers.getContractAt("IX2EarnRewardsPool", x2EarnRewardsPoolAddress);
  let availableFunds;
  try {
    availableFunds = await X2EarnRewardsPool.availableFunds(appId);
    console.log(`Available funds in X2EarnRewardsPool: ${formatEther(availableFunds)} B3TR`);
  } catch (error) {
    console.error("Error getting available funds:", error);
    console.log("Continuing without available funds information...");
    availableFunds = parseEther("0");
  }

  // Ask user if they want to set rewards for the next cycle
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('\nDo you want to set rewards for the next cycle? (y/n) ', async (answer: string) => {
    if (answer.toLowerCase() === 'y') {
      readline.question(`Enter reward amount in B3TR (available: ${formatEther(availableFunds)}): `, async (amount: string) => {
        try {
          const parsedAmount = parseEther(amount);
          console.log(`Setting rewards amount: ${amount} B3TR...`);
          
          // Set rewards for next cycle
          const tx = await planty.setRewardsAmount(parsedAmount);
          console.log(`Transaction hash: ${tx.hash}`);
          console.log("Waiting for transaction confirmation...");
          await tx.wait();
          
          console.log(`Successfully set rewards for cycle ${nextCycle}!`);
          
          // Check if rewards were set correctly
          const newRewardsNextCycle = await planty.rewards(nextCycle);
          const newRewardsLeftNextCycle = await planty.rewardsLeft(nextCycle);
          
          console.log(`Updated next cycle rewards: ${formatEther(newRewardsNextCycle)} B3TR`);
          console.log(`Updated next cycle rewards left: ${formatEther(newRewardsLeftNextCycle)} B3TR`);
          
          // Ask if user wants to trigger new cycle
          readline.question('\nDo you want to trigger a new cycle? (y/n) ', async (triggerAnswer: string) => {
            if (triggerAnswer.toLowerCase() === 'y') {
              console.log("Triggering new cycle...");
              
              // Trigger new cycle
              const triggerTx = await planty.triggerCycle();
              console.log(`Transaction hash: ${triggerTx.hash}`);
              console.log("Waiting for transaction confirmation...");
              await triggerTx.wait();
              
              const newCurrentCycle = await planty.getCurrentCycle();
              const newNextCycle = await planty.nextCycle();
              const newLastCycleStartBlock = await planty.lastCycleStartBlock();
              
              console.log(`Successfully triggered new cycle!`);
              console.log(`New current cycle: ${newCurrentCycle}`);
              console.log(`New next cycle: ${newNextCycle}`);
              console.log(`New last cycle start block: ${newLastCycleStartBlock}`);
            }
            
            readline.close();
          });
        } catch (error) {
          console.error("Error setting rewards:", error);
          readline.close();
        }
      });
    } else {
      readline.close();
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
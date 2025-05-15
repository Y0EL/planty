import { ethers } from "hardhat";
import { config } from "@repo/config-contract";
import { formatEther, parseEther } from "ethers";

// Configuration
const REWARDS_AMOUNT = "12000"; // 12000 B3TR - Adjust as needed
const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Example test address - replace with your own if needed

async function main() {
  console.log("🔧 Planty Contract Repair Tool 🔧");
  console.log("================================");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);

  // Connect to the contracts
  const plantyAddress = config.CONTRACT_ADDRESS;
  console.log(`Planty contract address: ${plantyAddress}`);
  
  const x2EarnRewardsPoolAddress = config.X2EARN_REWARDS_POOL;
  console.log(`X2EarnRewardsPool address: ${x2EarnRewardsPoolAddress}`);
  
  // Get contracts
  const planty = await ethers.getContractAt("Planty", plantyAddress, signer);
  const x2EarnPool = await ethers.getContractAt("IX2EarnRewardsPool", x2EarnRewardsPoolAddress, signer);

  // Get App ID
  const appId = await planty.appId();
  console.log(`App ID: ${appId}`);
  
  // Verify admin access
  const DEFAULT_ADMIN_ROLE = await planty.DEFAULT_ADMIN_ROLE();
  const isAdmin = await planty.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
  
  if (!isAdmin) {
    console.error(`⛔ ERROR: Account ${signer.address} is not an admin of the Planty contract`);
    console.error("Admin access is required to fix the contract.");
    return;
  }
  
  console.log(`✅ Verified admin access for ${signer.address}`);

  // Get cycle info
  const currentCycle = await planty.getCurrentCycle();
  const nextCycle = await planty.nextCycle();
  const lastCycleStartBlock = await planty.lastCycleStartBlock();
  const nextCycleBlock = await planty.getNextCycleBlock();
  const currentBlock = await ethers.provider.getBlockNumber();
  const blocksTillEnd = Number(nextCycleBlock) - currentBlock;
  
  console.log(`\n--- Cycle Information ---`);
  console.log(`Current cycle: ${currentCycle}`);
  console.log(`Next cycle: ${nextCycle}`);
  console.log(`Current block: ${currentBlock}`);
  console.log(`Last cycle start block: ${lastCycleStartBlock}`);
  console.log(`Next cycle block: ${nextCycleBlock}`);
  console.log(`Blocks until cycle end: ${blocksTillEnd}`);
  
  // Check X2EarnRewardsPool available funds
  const availableFunds = await x2EarnPool.availableFunds(appId);
  console.log(`\n--- Funds Information ---`);
  console.log(`Available funds in X2EarnRewardsPool: ${formatEther(availableFunds)} B3TR`);
  
  // Get current rewards info
  const currentCycleRewards = await planty.rewards(currentCycle);
  const currentCycleRewardsLeft = await planty.rewardsLeft(currentCycle);
  const nextCycleRewards = await planty.rewards(nextCycle);
  const nextCycleRewardsLeft = await planty.rewardsLeft(nextCycle);
  
  console.log(`\n--- Rewards Information ---`);
  console.log(`Current cycle (${currentCycle}) total rewards: ${formatEther(currentCycleRewards)} B3TR`);
  console.log(`Current cycle (${currentCycle}) rewards left: ${formatEther(currentCycleRewardsLeft)} B3TR`);
  console.log(`Next cycle (${nextCycle}) total rewards: ${formatEther(nextCycleRewards)} B3TR`);
  console.log(`Next cycle (${nextCycle}) rewards left: ${formatEther(nextCycleRewardsLeft)} B3TR`);
  
  // Check for issues
  const issues = [];
  
  if (availableFunds == 0n) {
    issues.push("⛔ No funds available in X2EarnRewardsPool for this App ID");
  }
  
  if (currentCycleRewards == 0n) {
    issues.push("⛔ No rewards allocated for current cycle");
  }
  
  if (currentCycleRewards > 0n && currentCycleRewardsLeft == 0n) {
    issues.push("⛔ All rewards for current cycle have been used up");
  }
  
  if (blocksTillEnd <= 0) {
    issues.push("⛔ Current cycle has ended but hasn't been advanced");
  }
  
  // Report issues
  if (issues.length === 0) {
    console.log("\n✅ No major issues detected with the contract!");
  } else {
    console.log("\n⚠️  Issues Detected:");
    issues.forEach(issue => console.log(issue));
  }
  
  // Fix issues
  console.log("\n🔧 Starting Repair Process...");
  
  // 1. Check if we need to trigger a new cycle
  if (blocksTillEnd <= 0) {
    console.log("\n>> Current cycle has ended. Triggering new cycle...");
    try {
      const tx = await planty.triggerCycle();
      console.log(`Transaction hash: ${tx.hash}`);
      console.log("Waiting for confirmation...");
      await tx.wait();
      console.log("✅ Successfully triggered new cycle!");
      
      // Refresh cycle info
      const newCurrentCycle = await planty.getCurrentCycle();
      const newNextCycle = await planty.nextCycle();
      console.log(`New current cycle: ${newCurrentCycle}`);
      console.log(`New next cycle: ${newNextCycle}`);
    } catch (error: any) {
      console.error(`❌ Failed to trigger new cycle: ${error.message}`);
    }
  }
  
  // 2. Allocate rewards for next cycle if needed
  if (nextCycleRewards == 0n) {
    console.log(`\n>> No rewards allocated for next cycle. Allocating ${REWARDS_AMOUNT} B3TR...`);
    
    if (availableFunds < parseEther(REWARDS_AMOUNT)) {
      console.error(`❌ Not enough funds available. Available: ${formatEther(availableFunds)} B3TR, Required: ${REWARDS_AMOUNT} B3TR`);
      console.error("You need to deposit more funds to the X2EarnRewardsPool for this App ID");
    } else {
      try {
        const tx = await planty.setRewardsAmount(parseEther(REWARDS_AMOUNT));
        console.log(`Transaction hash: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        await tx.wait();
        console.log("✅ Successfully allocated rewards for next cycle!");
        
        // Verify
        const newNextCycleRewards = await planty.rewards(nextCycle);
        const newNextCycleRewardsLeft = await planty.rewardsLeft(nextCycle);
        console.log(`New next cycle rewards: ${formatEther(newNextCycleRewards)} B3TR`);
        console.log(`New next cycle rewards left: ${formatEther(newNextCycleRewardsLeft)} B3TR`);
      } catch (error: any) {
        console.error(`❌ Failed to allocate rewards: ${error.message}`);
      }
    }
  }
  
  // 3. If current cycle has no rewards or all used up, and we didn't just trigger a new cycle, allocate and trigger
  if ((currentCycleRewards == 0n || currentCycleRewardsLeft == 0n) && blocksTillEnd > 0) {
    console.log("\n>> Current cycle has no rewards or all used up.");
    console.log(">> Setting up rewards and triggering new cycle...");
    
    if (availableFunds < parseEther(REWARDS_AMOUNT)) {
      console.error(`❌ Not enough funds available. Available: ${formatEther(availableFunds)} B3TR, Required: ${REWARDS_AMOUNT} B3TR`);
      console.error("You need to deposit more funds to the X2EarnRewardsPool for this App ID");
    } else {
      try {
        // First allocate rewards
        console.log(`Allocating ${REWARDS_AMOUNT} B3TR for next cycle...`);
        const setTx = await planty.setRewardsAmount(parseEther(REWARDS_AMOUNT));
        await setTx.wait();
        console.log("✅ Successfully allocated rewards");
        
        // Then trigger new cycle
        console.log("Triggering new cycle...");
        const triggerTx = await planty.triggerCycle();
        await triggerTx.wait();
        console.log("✅ Successfully triggered new cycle");
        
        // Verify setup
        const newCurrentCycle = await planty.getCurrentCycle();
        const newCurrentCycleRewards = await planty.rewards(newCurrentCycle);
        const newCurrentCycleRewardsLeft = await planty.rewardsLeft(newCurrentCycle);
        
        console.log(`New current cycle: ${newCurrentCycle}`);
        console.log(`New current cycle rewards: ${formatEther(newCurrentCycleRewards)} B3TR`);
        console.log(`New current cycle rewards left: ${formatEther(newCurrentCycleRewardsLeft)} B3TR`);
      } catch (error: any) {
        console.error(`❌ Failed to set up new cycle: ${error.message}`);
      }
    }
  }
  
  // 4. Verify contract works correctly
  console.log("\n🧪 Testing Contract Functionality...");
  
  // Get updated cycle and rewards info
  const finalCurrentCycle = await planty.getCurrentCycle();
  const finalCurrentCycleRewards = await planty.rewards(finalCurrentCycle);
  const finalCurrentCycleRewardsLeft = await planty.rewardsLeft(finalCurrentCycle);
  
  console.log(`Current cycle: ${finalCurrentCycle}`);
  console.log(`Current cycle rewards: ${formatEther(finalCurrentCycleRewards)} B3TR`);
  console.log(`Current cycle rewards left: ${formatEther(finalCurrentCycleRewardsLeft)} B3TR`);
  
  // Check if we can submit
  if (finalCurrentCycleRewardsLeft > 0n) {
    console.log("\n✅ Contract has rewards available for submissions!");
    
    // Optionally test a submission with a small amount - uncomment to test
    /*
    try {
      console.log(`Testing submission for address ${TEST_ADDRESS}...`);
      const testAmount = parseEther("0.1"); // Small test amount
      
      // Check max submissions
      const isMaxReached = await planty.isUserMaxSubmissionsReached(TEST_ADDRESS);
      if (isMaxReached) {
        console.log("⚠️ Test address has reached max submissions for this cycle");
      } else {
        const tx = await planty.registerValidSubmission(TEST_ADDRESS, testAmount);
        await tx.wait();
        console.log("✅ Test submission successful! Contract is working properly.");
      }
    } catch (error: any) {
      console.error(`❌ Test submission failed: ${error.message}`);
    }
    */
  } else {
    console.log("\n⛔ Contract still has no rewards available for submissions!");
    console.log("Please check X2EarnRewardsPool funding and try again.");
  }
  
  console.log("\n🔧 Repair Process Complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
import { ethers } from "hardhat";
import { config } from "@repo/config-contract";
import { formatEther, parseEther } from "ethers";

// Amount of rewards to set (in B3TR)
const REWARDS_AMOUNT = "12000"; // 12000 B3TR
const TRIGGER_NEW_CYCLE = true; // Set to true to trigger a new cycle after setting rewards

async function main() {
  console.log("Setting Planty contract rewards...");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);

  // Connect to the Planty contract
  const plantyAddress = config.CONTRACT_ADDRESS;
  console.log(`Planty contract address: ${plantyAddress}`);
  
  // Get X2EarnRewardsPool contract
  const x2EarnRewardsPoolAddress = config.X2EARN_REWARDS_POOL;
  console.log(`X2EarnRewardsPool contract address: ${x2EarnRewardsPoolAddress}`);
  const x2EarnRewardsPool = await ethers.getContractAt("IX2EarnRewardsPool", x2EarnRewardsPoolAddress, signer);
  
  // Get Planty contract
  const planty = await ethers.getContractAt("Planty", plantyAddress, signer);

  // Get App ID
  const appId = await planty.appId();
  console.log(`App ID: ${appId}`);
  
  // Check if the X2EarnRewardsPool has enough funds
  try {
    const availableFunds = await x2EarnRewardsPool.availableFunds(appId);
    console.log(`Available funds in X2EarnRewardsPool: ${formatEther(availableFunds)} B3TR`);
    
    if (availableFunds < parseEther(REWARDS_AMOUNT)) {
      console.warn(`⚠️  WARNING: Available funds (${formatEther(availableFunds)} B3TR) are less than the rewards amount (${REWARDS_AMOUNT} B3TR)`);
      console.warn("You may need to deposit more funds to the X2EarnRewardsPool contract for this App ID");
    }
  } catch (error) {
    console.error("Error checking available funds:", error);
    console.warn("Continuing without available funds information...");
  }

  // Get current block number
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log(`Current block number: ${currentBlock}`);
  
  // Get cycle info
  const currentCycle = await planty.getCurrentCycle();
  const nextCycle = await planty.nextCycle();
  const cycleEndBlock = await planty.getNextCycleBlock();
  const lastCycleStartBlock = await planty.lastCycleStartBlock();
  
  console.log(`Current cycle: ${currentCycle}`);
  console.log(`Next cycle: ${nextCycle}`);
  console.log(`Last cycle start block: ${lastCycleStartBlock}`);
  console.log(`Current cycle end block: ${cycleEndBlock}`);
  console.log(`Blocks until cycle end: ${Number(cycleEndBlock) - currentBlock}`);

  // Get current rewards info for multiple cycles
  console.log("\n--- Rewards Information ---");
  for (let i = Math.max(0, Number(currentCycle) - 2); i <= Number(nextCycle); i++) {
    const cycleRewards = await planty.rewards(i);
    const cycleRewardsLeft = await planty.rewardsLeft(i);
    console.log(`Cycle ${i} total rewards: ${formatEther(cycleRewards)} B3TR`);
    console.log(`Cycle ${i} rewards left: ${formatEther(cycleRewardsLeft)} B3TR`);
  }

  // Set rewards for next cycle
  const rewardsAmount = parseEther(REWARDS_AMOUNT);
  console.log(`\nSetting rewards for cycle ${nextCycle}: ${REWARDS_AMOUNT} B3TR...`);
  
  try {
    // Check if we're an admin
    const DEFAULT_ADMIN_ROLE = await planty.DEFAULT_ADMIN_ROLE();
    const isAdmin = await planty.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
    
    if (!isAdmin) {
      console.error(`ERROR: Account ${signer.address} is not an admin of the Planty contract`);
      return;
    }
    
    console.log(`Account ${signer.address} is a valid admin, proceeding...`);
    
    const tx = await planty.setRewardsAmount(rewardsAmount);
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Waiting for transaction confirmation...");
    await tx.wait();
    console.log(`Successfully set rewards for cycle ${nextCycle}!`);
    
    // Verify rewards were set correctly
    const newRewardsNextCycle = await planty.rewards(nextCycle);
    const newRewardsLeftNextCycle = await planty.rewardsLeft(nextCycle);
    console.log(`Verified next cycle rewards: ${formatEther(newRewardsNextCycle)} B3TR`);
    console.log(`Verified next cycle rewards left: ${formatEther(newRewardsLeftNextCycle)} B3TR`);
    
    // Trigger new cycle if requested
    if (TRIGGER_NEW_CYCLE) {
      console.log("\nTriggering new cycle...");
      const triggerTx = await planty.triggerCycle();
      console.log(`Transaction hash: ${triggerTx.hash}`);
      console.log("Waiting for transaction confirmation...");
      await triggerTx.wait();
      
      // Verify new cycle was triggered
      const newCurrentCycle = await planty.getCurrentCycle();
      const newNextCycle = await planty.nextCycle();
      const newLastCycleStartBlock = await planty.lastCycleStartBlock();
      const newEndBlock = await planty.getNextCycleBlock();
      
      console.log(`Successfully triggered new cycle!`);
      console.log(`New current cycle: ${newCurrentCycle}`);
      console.log(`New next cycle: ${newNextCycle}`);
      console.log(`New last cycle start block: ${newLastCycleStartBlock}`);
      console.log(`New cycle end block: ${newEndBlock}`);
      
      // Check new cycle rewards
      const newCurrentCycleRewards = await planty.rewards(newCurrentCycle);
      const newCurrentCycleRewardsLeft = await planty.rewardsLeft(newCurrentCycle);
      console.log(`New current cycle rewards: ${formatEther(newCurrentCycleRewards)} B3TR`);
      console.log(`New current cycle rewards left: ${formatEther(newCurrentCycleRewardsLeft)} B3TR`);
    }
  } catch (error: any) {
    console.error("Error:", error);
    // Check if error message includes "insufficient balance"
    if (error.message && typeof error.message === 'string' && error.message.includes("insufficient balance")) {
      console.error("\n===== IMPORTANT =====");
      console.error("It looks like there are insufficient funds in the X2EarnRewardsPool contract.");
      console.error("You may need to deposit funds into the X2EarnRewardsPool first.");
      console.error("====================");
    }
    // Check if error message includes "not enough rewards left"
    else if (error.message && typeof error.message === 'string' && error.message.includes("not enough rewards left")) {
      console.error("\n===== IMPORTANT =====");
      console.error("There are not enough rewards left in the current cycle.");
      console.error("You may need to trigger a new cycle first.");
      console.error("====================");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
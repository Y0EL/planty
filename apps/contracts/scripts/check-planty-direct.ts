import { ethers } from "ethers";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ABI fragments for the functions we need to call
const PLANTY_ABI = [
  "function getCurrentCycle() view returns (uint256)",
  "function nextCycle() view returns (uint256)",
  "function maxSubmissionsPerCycle() view returns (uint256)",
  "function cycleDuration() view returns (uint256)",
  "function lastCycleStartBlock() view returns (uint256)",
  "function getNextCycleBlock() view returns (uint256)",
  "function rewards(uint256) view returns (uint256)",
  "function rewardsLeft(uint256) view returns (uint256)",
  "function totalSubmissions(uint256) view returns (uint256)",
  "function submissions(uint256, address) view returns (uint256)",
  "function isUserMaxSubmissionsReached(address) view returns (bool)"
];

async function main() {
  console.log("Checking Planty contract cycle status...");

  // Connect to network
  const rpcUrl = process.env.TESTNET_URL;
  if (!rpcUrl) {
    throw new Error("TESTNET_URL not defined in environment variables");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Use mnemonic to get signer
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("MNEMONIC not defined in environment variables");
  }
  
  const wallet = ethers.Wallet.fromPhrase(mnemonic, provider);
  console.log(`Using account: ${wallet.address}`);

  // Connect to the Planty contract
  const plantyAddress = process.env.PLANTY_CONTRACT_ADDRESS;
  if (!plantyAddress) {
    throw new Error("PLANTY_CONTRACT_ADDRESS not defined in environment variables");
  }
  console.log(`Planty contract address: ${plantyAddress}`);
  
  // Get Planty contract
  const planty = new ethers.Contract(plantyAddress, PLANTY_ABI, wallet);

  // Get current contract settings
  const currentCycle = await planty.getCurrentCycle();
  const nextCycle = await planty.nextCycle();
  const maxSubmissionsPerCycle = await planty.maxSubmissionsPerCycle();
  const cycleDuration = await planty.cycleDuration();
  const lastCycleStartBlock = await planty.lastCycleStartBlock();
  const nextCycleBlock = await planty.getNextCycleBlock();
  const currentBlock = await provider.getBlockNumber();
  
  console.log("\n--- Cycle Info ---");
  console.log(`Current cycle: ${currentCycle}`);
  console.log(`Next cycle: ${nextCycle}`);
  console.log(`Max submissions per cycle: ${maxSubmissionsPerCycle}`);
  console.log(`Cycle duration (blocks): ${cycleDuration}`);
  console.log(`Last cycle start block: ${lastCycleStartBlock}`);
  console.log(`Next cycle block: ${nextCycleBlock}`);
  console.log(`Current block: ${currentBlock}`);
  
  const blocksLeft = Number(nextCycleBlock) - currentBlock;
  console.log(`Blocks until next cycle: ${blocksLeft}`);
  
  // Determine cycle status
  let cycleStatus = "Active";
  if (blocksLeft <= 0) {
    cycleStatus = "ENDED - Needs new cycle trigger";
  } else if (blocksLeft < 1000) {
    cycleStatus = "Ending soon";
  }
  console.log(`Cycle status: ${cycleStatus}`);
  
  // Get rewards info
  const rewardsCurrentCycle = await planty.rewards(currentCycle);
  const rewardsLeftCurrentCycle = await planty.rewardsLeft(currentCycle);
  const rewardsNextCycle = await planty.rewards(nextCycle);
  const rewardsLeftNextCycle = await planty.rewardsLeft(nextCycle);
  
  console.log("\n--- Rewards Info ---");
  console.log(`Current cycle rewards: ${ethers.formatEther(rewardsCurrentCycle)} B3TR`);
  console.log(`Current cycle rewards left: ${ethers.formatEther(rewardsLeftCurrentCycle)} B3TR`);
  console.log(`Next cycle rewards: ${ethers.formatEther(rewardsNextCycle)} B3TR`);
  console.log(`Next cycle rewards left: ${ethers.formatEther(rewardsLeftNextCycle)} B3TR`);
  
  // Calculate rewards used
  const rewardsUsed = rewardsCurrentCycle - rewardsLeftCurrentCycle;
  const percentUsed = rewardsCurrentCycle > 0 ? 
    (Number(rewardsUsed) * 100 / Number(rewardsCurrentCycle)).toFixed(2) : 
    "0.00";
  
  console.log(`Rewards used in current cycle: ${ethers.formatEther(rewardsUsed)} B3TR (${percentUsed}%)`);
  
  // Check if we need to set more rewards
  let rewardsStatus = "OK";
  if (Number(rewardsLeftCurrentCycle) === 0) {
    rewardsStatus = "EMPTY - No rewards left in current cycle!";
  } else if (Number(rewardsLeftCurrentCycle) < Number(rewardsCurrentCycle) * 0.1) {
    rewardsStatus = "LOW - Less than 10% rewards left in current cycle!";
  }
  console.log(`Rewards status: ${rewardsStatus}`);
  
  // Check if next cycle has rewards set
  if (Number(rewardsNextCycle) === 0) {
    console.log(`WARNING: No rewards set for next cycle (${nextCycle})!`);
  }
  
  // Check total submissions for current cycle
  const totalSubmissions = await planty.totalSubmissions(currentCycle);
  console.log(`\nTotal submissions in current cycle: ${totalSubmissions}`);
  
  // Check submissions for test addresses
  const testAddresses = [
    wallet.address
  ];
  
  console.log("\n--- Submissions by Address ---");
  for (const address of testAddresses) {
    const submissions = await planty.submissions(currentCycle, address);
    const maxReached = await planty.isUserMaxSubmissionsReached(address);
    console.log(`${address}: ${submissions} submissions (Max reached: ${maxReached})`);
  }
  
  // Provide recommendations
  console.log("\n--- Recommendations ---");
  if (cycleStatus === "ENDED - Needs new cycle trigger") {
    console.log("- Trigger a new cycle using planty.triggerCycle()");
  }
  
  if (rewardsStatus.startsWith("EMPTY") || rewardsStatus.startsWith("LOW")) {
    console.log("- Set more rewards for the current cycle");
  }
  
  if (Number(rewardsNextCycle) === 0) {
    console.log("- Set rewards for the next cycle using planty.setRewardsAmount()");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
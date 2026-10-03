import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';

import {
  Agent,
  User,
  UserAccount,
  PolicyCategory,
  PolicyCarrier,
  Policy,
} from '../../models/index.js';

/**
 * Worker thread execution for high-performance CSV processing
 */
export const runCsvWorker = async () => {
  const { filePath, mongoUri } = workerData || {};

  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Target CSV file not found: ${filePath}`);
  }

  // Connect dedicated Mongoose instance for the worker thread
  await mongoose.connect(mongoUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/insuredmine_db');

  let processedCount = 0;
  let errorCount = 0;
  const batchSize = 250;
  let batch = [];

  // In-memory caches to minimize redundant DB lookups during the import batch
  const agentCache = new Map();
  const categoryCache = new Map();
  const carrierCache = new Map();
  const userCache = new Map();

  const processBatch = async (records) => {
    for (const row of records) {
      try {
        // Normalize CSV header fields (handle lowercase, uppercase, and trimmed variations)
        const agentName = (row.agent || row.Agent || row['Agent Name'] || row.agentName || 'Default Agent').trim();
        const firstName = (row.firstname || row.firstName || row.FirstName || 'Unknown User').trim();
        const dob = row.dob || row.DOB ? new Date(row.dob || row.DOB) : null;
        const address = (row.address || row.Address || '').trim();
        const phoneNumber = (row.phone || row.phoneNumber || row.Phone || '').trim();
        const state = (row.state || row.State || '').trim();
        const zipCode = (row.zip || row.zipCode || row.Zip || '').trim();
        const email = (row.email || row.Email || '').trim().toLowerCase();
        const gender = (row.gender || row.Gender || '').trim();
        const userType = (row.userType || row['User Type'] || 'Standard').trim();

        const accountName = (row.account_name || row.accountName || `${firstName}'s Account`).trim();
        const accountType = (row.account_type || row.accountType || 'Personal').trim();

        const categoryName = (row.category_name || row['Policy Category'] || row.policy_type || 'General').trim();
        const companyName = (row.company_name || row['Company Name'] || row.carrier || 'Standard Insurance Co').trim();

        const policyNumber = (row.policy_number || row.policyNumber || row['Policy Number'] || `POL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`).trim();
        const policyStartDate = row.policy_start_date || row['Policy Start Date'] ? new Date(row.policy_start_date || row['Policy Start Date']) : new Date();
        const policyEndDate = row.policy_end_date || row['Policy End Date'] ? new Date(row.policy_end_date || row['Policy End Date']) : null;
        const premiumAmount = parseFloat(row.premium_amount || row['Premium Amount'] || 0) || 0;

        // 1. Agent (supports both agentName and name schema definitions)
        let agentId = agentCache.get(agentName);
        if (!agentId) {
          // const agentDoc = await Agent.findOneAndUpdate(
          //   { $or: [{ agentName }, { name: agentName }] },
          //   { agentName, name: agentName },
          //   { upsert: true, new: true, setDefaultsOnInsert: true }
          // );
          const agentDoc = await Agent.findOneAndUpdate(
            { agentName: agentName },     // <-- Removed the $or and 'name' field
            { agentName: agentName },     // <-- Removed 'name' field
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          agentId = agentDoc._id;
          agentCache.set(agentName, agentId);
        }

        // 2. User
        const userKey = email || `${firstName}-${phoneNumber}`;
        let userId = userCache.get(userKey);
        if (!userId) {
          const userQuery = email ? { email } : { firstName, phoneNumber };
          const userDoc = await User.findOneAndUpdate(
            userQuery,
            {
              firstName,
              dob,
              address,
              phoneNumber,
              state,
              zipCode,
              email: email || undefined,
              gender,
              userType,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          userId = userDoc._id;
          userCache.set(userKey, userId);
        }

        // 3. UserAccount
        await UserAccount.findOneAndUpdate(
          { accountName, userId },
          { accountName, accountType, userId },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 4. PolicyCategory (LOB)
        let categoryId = categoryCache.get(categoryName);
        if (!categoryId) {
          const categoryDoc = await PolicyCategory.findOneAndUpdate(
            { categoryName },
            { categoryName },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          categoryId = categoryDoc._id;
          categoryCache.set(categoryName, categoryId);
        }

        // 5. PolicyCarrier (Company)
        let carrierId = carrierCache.get(companyName);
        if (!carrierId) {
          const carrierDoc = await PolicyCarrier.findOneAndUpdate(
            { companyName },
            { companyName },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          carrierId = carrierDoc._id;
          carrierCache.set(companyName, carrierId);
        }

        // 6. Policy
        await Policy.findOneAndUpdate(
          { policyNumber },
          {
            policyNumber,
            policyStartDate,
            policyEndDate,
            policyCategoryId: categoryId,
            companyId: carrierId,
            userId,
            premiumAmount,
            policyType: categoryName,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        processedCount++;
      } catch (err) {
        errorCount++;
        console.error(`Worker Row Error:`, err.message);
      }
    }

    if (parentPort) {
      parentPort.postMessage({
        status: 'progress',
        type: 'progress',
        processed: processedCount,
        errors: errorCount,
        percent: processedCount,
      });
    }
  };

  const stream = fs.createReadStream(filePath).pipe(csv());

  for await (const row of stream) {
    batch.push(row);
    if (batch.length >= batchSize) {
      await processBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await processBatch(batch);
    batch = [];
  }

  // Cleanup file after processing
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (cleanErr) {
    console.warn('Could not clean up temporary upload file:', cleanErr.message);
  }

  await mongoose.disconnect();

  if (parentPort) {
    parentPort.postMessage({
      status: 'success',
      type: 'completed',
      totalProcessed: processedCount,
      totalErrors: errorCount,
    });
  }

  return { totalProcessed: processedCount, totalErrors: errorCount };
};

// Run automatically if spawned as Worker Thread
if (parentPort) {
  runCsvWorker().catch(async (error) => {
    console.error('Fatal Worker Thread Error:', error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    parentPort.postMessage({
      status: 'error',
      type: 'error',
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
}

export default runCsvWorker;

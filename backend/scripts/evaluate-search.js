// Evaluation script for MongoDB text search with regex fallback
// Metrics: Precision@K, Recall@K, F1@K, MRR, nDCG

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Load Document model
const Document = require('../models/Document');

function dedupePreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

// Compute DCG for ranked results given binary relevance
function dcg(relevances) {
  return relevances.reduce((sum, rel, i) => sum + (rel ? 1 / Math.log2(i + 2) : 0), 0);
}

async function searchDocumentsRaw(queryString, k) {
  const query = {};
  let projection = {};
  let sort = { createdAt: -1 };

  if (queryString && queryString.trim()) {
    const search = queryString.trim();
    query.$text = { $search: search };
    projection = { score: { $meta: 'textScore' } };
    sort = { score: { $meta: 'textScore' }, createdAt: -1 };
  }

  let docs = await Document.find(query, projection).sort(sort).limit(k);

  if ((!docs || docs.length === 0) && queryString && queryString.trim()) {
    const safe = queryString.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
    const regex = new RegExp(safe, 'i');
    const regexQuery = { ...query };
    delete regexQuery.$text;
    docs = await Document.find({
      ...regexQuery,
      $or: [{ title: regex }, { searchText: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(k);
  }

  return docs.map(d => d._id.toString());
}

function evaluateOne(retrievedIds, relevantIds, k) {
  const retrievedAtK = retrievedIds.slice(0, k);
  const relevantSet = new Set(relevantIds);
  const hits = retrievedAtK.filter(id => relevantSet.has(id));
  const numHits = hits.length;
  const precision = retrievedAtK.length ? numHits / retrievedAtK.length : 0;
  const recall = relevantIds.length ? numHits / relevantIds.length : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // MRR: first relevant rank
  let mrr = 0;
  for (let i = 0; i < retrievedAtK.length; i++) {
    if (relevantSet.has(retrievedAtK[i])) {
      mrr = 1 / (i + 1);
      break;
    }
  }

  // nDCG
  const relevances = retrievedAtK.map(id => (relevantSet.has(id) ? 1 : 0));
  const idealRelevances = Array(Math.min(k, relevantIds.length)).fill(1);
  const dcgVal = dcg(relevances);
  const idcgVal = dcg(idealRelevances);
  const ndcg = idcgVal > 0 ? dcgVal / idcgVal : 0;

  return { precision, recall, f1, mrr, ndcg };
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('dataset', { type: 'string', demandOption: true, describe: 'Path to queries JSON' })
    .option('mongo', { type: 'string', default: process.env.MONGO_URI || process.env.MONGODB_URI, describe: 'MongoDB connection string' })
    .option('k', { type: 'number', default: 10, describe: 'Top-K for metrics' })
    .strict()
    .help()
    .parse();

  if (!argv.mongo) {
    console.error('Missing MongoDB URI. Pass --mongo or set MONGO_URI.');
    process.exit(1);
  }

  const datasetPath = path.resolve(argv.dataset);
  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset file not found at: ${datasetPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(datasetPath, 'utf-8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items) || items.length === 0) {
    console.error('Dataset must be a non-empty array of { query, relevant: [docId, ...] }');
    process.exit(1);
  }

  await mongoose.connect(argv.mongo, { autoIndex: true });

  let totals = { precision: 0, recall: 0, f1: 0, mrr: 0, ndcg: 0 };
  let count = 0;

  for (const item of items) {
    const q = (item.query || '').trim();
    const relevant = Array.isArray(item.relevant) ? dedupePreserveOrder(item.relevant.map(String)) : [];
    if (!q || relevant.length === 0) continue;

    const retrieved = await searchDocumentsRaw(q, argv.k);
    const metrics = evaluateOne(retrieved, relevant, argv.k);
    totals.precision += metrics.precision;
    totals.recall += metrics.recall;
    totals.f1 += metrics.f1;
    totals.mrr += metrics.mrr;
    totals.ndcg += metrics.ndcg;
    count += 1;
  }

  await mongoose.disconnect();

  if (count === 0) {
    console.log('No valid items in dataset. Ensure each item has a non-empty query and relevant IDs.');
    process.exit(1);
  }

  const avg = {
    precisionAtK: totals.precision / count,
    recallAtK: totals.recall / count,
    f1AtK: totals.f1 / count,
    mrr: totals.mrr / count,
    ndcg: totals.ndcg / count,
    evaluatedQueries: count,
    k: argv.k,
  };

  console.log(JSON.stringify(avg, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});



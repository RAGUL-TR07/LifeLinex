/**
 * LifelineX — MongoDB Atlas Connection Diagnostic & Fix Script
 * Run: node fix-db-connection.js
 */
require('dotenv').config({ path: '.env' });
const dns = require('dns');
const net = require('net');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGODB_URI || '';
const masked = uri.replace(/:([^:@]+)@/, ':****@');

console.log('\n══════════════════════════════════════════════════════');
console.log('   LifelineX MongoDB Atlas Connection Diagnostics     ');
console.log('══════════════════════════════════════════════════════\n');
console.log('📋 URI in .env:');
console.log('  ', masked, '\n');

// Parse hostnames from URI
const hostMatches = uri.match(/@([^/?]+)/);
if (!hostMatches) {
  console.error('❌ Cannot parse hostname from MONGODB_URI. Check your .env file.');
  process.exit(1);
}

const hostsPart = hostMatches[1];
const hosts = hostsPart.split(',').map(h => h.trim());

console.log('🔍 Hosts to test:', hosts.length);

let passed = 0;
let failed = 0;
let tested = 0;

hosts.forEach(hostPort => {
  const [host, port = '27017'] = hostPort.split(':');
  
  // DNS check
  dns.lookup(host, (err, addr) => {
    tested++;
    if (err) {
      console.log(`\n  ❌ DNS FAIL: ${host}`);
      console.log(`     Error: ${err.message}`);
      console.log(`     → This host cannot be resolved. Cluster may be paused or renamed.`);
      failed++;
    } else {
      console.log(`\n  ✅ DNS OK: ${host} → ${addr}`);
      
      // TCP check
      const sock = new net.Socket();
      sock.setTimeout(5000);
      sock.connect(parseInt(port), addr, () => {
        console.log(`     ✅ TCP OK: Port ${port} open`);
        sock.destroy();
        passed++;
        checkDone();
      });
      sock.on('error', (e) => {
        console.log(`     ❌ TCP FAIL: Port ${port} — ${e.message}`);
        failed++;
        checkDone();
      });
      sock.on('timeout', () => {
        console.log(`     ❌ TCP TIMEOUT: Port ${port} unreachable`);
        sock.destroy();
        failed++;
        checkDone();
      });
    }
    if (err) checkDone();
  });
});

function checkDone() {
  if (tested < hosts.length) return;
  
  console.log('\n══════════════════════════════════════════════════════');
  
  if (failed === hosts.length) {
    console.log('\n🔴 DIAGNOSIS: MongoDB Atlas cluster is UNREACHABLE.\n');
    console.log('   The most common causes are:\n');
    console.log('   1️⃣  CLUSTER PAUSED (most likely on free M0 tier)');
    console.log('      Free clusters auto-pause after 60 days of inactivity.\n');
    console.log('   2️⃣  IP NOT WHITELISTED');
    console.log('      Your IP is not in Atlas Network Access list.\n');
    console.log('   3️⃣  WRONG CONNECTION STRING');
    console.log('      The cluster name may have changed.\n');
    
    console.log('══════════════════════════════════════════════════════');
    console.log('🛠️  FIX STEPS (do all of these):');
    console.log('══════════════════════════════════════════════════════\n');
    
    console.log('  STEP 1: Go to https://cloud.mongodb.com');
    console.log('          Log in with: ragultr07@gmail.com\n');
    
    console.log('  STEP 2: Check if cluster is PAUSED');
    console.log('          Look for a "Resume" button on your cluster.');
    console.log('          Click it and wait ~2 minutes for it to start.\n');
    
    console.log('  STEP 3: Add your IP to Network Access');
    console.log('          Left sidebar → Security → Network Access');
    console.log('          Click "+ ADD IP ADDRESS"');
    console.log('          Choose "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)');
    console.log('          (For development only — restrict in production)\n');
    
    console.log('  STEP 4: Get the correct connection string');
    console.log('          Click "Connect" on your cluster');
    console.log('          Choose "Drivers" → Node.js');
    console.log('          Copy the connection string (mongodb+srv://...)');
    console.log('          Replace MONGODB_URI in backend/.env with it\n');
    
    console.log('  STEP 5: Update the username/password in the new URI');
    console.log('          Database → Database Access → ragultr07_db_user');
    console.log('          Edit → change password if forgotten\n');
    
    console.log('  STEP 6: Restart backend: npm run dev\n');
    
    console.log('══════════════════════════════════════════════════════');
    console.log('📌 Meanwhile: The app works in DEMO MODE.');
    console.log('   Login with: user@lifelinex.com / Demo@1234');
    console.log('   Or:         admin@lifelinex.com / Admin@1234');
    console.log('══════════════════════════════════════════════════════\n');
  } else {
    console.log('\n🟡 PARTIAL connectivity. Attempting mongoose connection...\n');
    const mongoose = require('mongoose');
    mongoose.connect(uri, {
      serverSelectionTimeoutMS: 12000,
      connectTimeoutMS: 12000,
      family: 4,
    }).then(() => {
      console.log('✅ MongoDB CONNECTED successfully!');
      console.log('   Host:', mongoose.connection.host);
      console.log('\n   No connection issues found. Restart backend if needed.\n');
      mongoose.disconnect();
    }).catch(err => {
      console.log('❌ MongoDB connection failed:', err.message);
      if (err.message.includes('whitelist') || err.message.includes('IP')) {
        console.log('\n   → Your IP is NOT whitelisted on Atlas.');
        console.log('   → Go to: MongoDB Atlas → Security → Network Access');
        console.log('   → Add your current IP or use 0.0.0.0/0 for dev\n');
      }
    });
  }
}

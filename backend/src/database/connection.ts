import mongoose from 'mongoose';
import dns from 'dns';
import config from '../config';
import logger from '../utils/logger';

try {
  // Use IPv6 Google DNS servers — these resolve correctly on this network.
  // IPv4 DNS (8.8.8.8) is blocked; the OS routes DNS via 2001:4860:4860::6464.
  dns.setServers(['2001:4860:4860::6464', '2001:4860:4860::8888', '8.8.8.8', '1.1.1.1']);
} catch (err: any) {
  console.warn('⚠️ DNS configuration warning:', err.message);
}

class Database {
  private static instance: Database;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private eventsBound: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(retryCount = 0): Promise<void> {
    if (this.isConnected || mongoose.connection.readyState === 1) {
      this.isConnected = true;
      return;
    }

    // Only block concurrent first-time calls; retries must always proceed
    if (this.isConnecting && retryCount === 0) {
      return;
    }

    this.isConnecting = true;

    try {
      mongoose.set('strictQuery', false);

      let connectionUri = config.mongoUri;
      if (!connectionUri) {
        throw new Error('MONGODB_URI is not configured in environment variables');
      }

      const conn = await mongoose.connect(connectionUri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 2500,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 2500,
        autoIndex: true,
        heartbeatFrequencyMS: 10000,
      });

      this.isConnected = true;
      this.isConnecting = false;
      logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

      // Bind events only once
      if (!this.eventsBound) {
        this.eventsBound = true;

        mongoose.connection.on('error', (err) => {
          logger.error(`MongoDB error: ${err.message}`);
          this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected. Attempting reconnect...');
          this.isConnected = false;
          this.isConnecting = false;
          const delay = Math.min(5000 * Math.pow(1.5, retryCount), 30000);
          setTimeout(() => {
            this.connect(retryCount + 1).catch(() => {});
          }, delay);
        });

        mongoose.connection.on('reconnected', () => {
          logger.info('✅ MongoDB reconnected successfully');
          this.isConnected = true;
        });
      }

    } catch (error: any) {
      this.isConnecting = false;
      this.isConnected = false;

      const msg = error?.message || 'Unknown error';
      
      // Provide clear, actionable error messages based on error type
      if (msg.includes('whitelist') || msg.includes('IP')) {
        logger.error('🔴 MongoDB Atlas: Your IP is NOT whitelisted!');
        logger.error('   Fix: Atlas Dashboard → Security → Network Access → Add IP (0.0.0.0/0 for dev)');
      } else if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('querySrv')) {
        logger.error('🔴 MongoDB Atlas: Cluster hostname unreachable!');
        logger.error('   Fix: 1) Check if cluster is PAUSED at https://cloud.mongodb.com');
        logger.error('        2) Get fresh connection string from Atlas → Connect → Drivers → Node.js');
        logger.error('        3) Update MONGODB_URI in backend/.env');
        logger.error('   Run: node fix-db-connection.js  (for full diagnosis)');
      } else if (msg.includes('Authentication') || msg.includes('auth')) {
        logger.error('🔴 MongoDB Atlas: Authentication failed! Wrong username/password.');
        logger.error('   Fix: Atlas → Database Access → ragultr07_db_user → Edit Password');
      } else if (retryCount === 0) {
        logger.warn(`⚠️ MongoDB connection failed: ${msg}`);
      }

      if (retryCount % 5 === 0 && retryCount > 0) {
        logger.warn(`⚠️ MongoDB retry #${retryCount} still failing. Run: node fix-db-connection.js`);
      }

      // Exponential backoff: 5s → 30s cap
      const delay = Math.min(5000 * Math.pow(1.5, retryCount), 30000);
      setTimeout(() => {
        this.connect(retryCount + 1).catch(() => {});
      }, delay);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    await mongoose.connection.close();
    this.isConnected = false;
    this.eventsBound = false;
    logger.info('Database disconnected');
  }

  public getConnectionStatus(): boolean {
    return mongoose.connection.readyState === 1 || this.isConnected;
  }
}

export default Database.getInstance();

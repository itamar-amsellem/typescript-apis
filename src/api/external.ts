import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import * as ftp from 'basic-ftp';
import { Client as SFTPClient, ConnectConfig } from 'ssh2-sftp-client';

/**
 * S3 Connection Configuration
 */
export interface S3Config {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  endpoint?: string;
  forcePathStyle?: boolean;
}

/**
 * FTP Connection Configuration
 */
export interface FTPConfig {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  secure?: boolean;
  secureOptions?: any;
}

/**
 * SFTP Connection Configuration
 */
export interface SFTPConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string | Buffer;
  passphrase?: string;
}

/**
 * S3 Connection Manager - Non-Singleton
 * Create multiple instances for different S3 buckets/regions
 */
export class S3Connection {
  private client: S3Client;
  private config: S3Config;
  private connected: boolean = false;

  constructor(config: S3Config) {
    this.config = config;
    
    const s3Config: S3ClientConfig = {
      region: config.region,
      credentials: config.credentials,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
    };

    this.client = new S3Client(s3Config);
    this.connected = true;
  }

  getClient(): S3Client {
    if (!this.connected) {
      throw new Error('S3 connection not initialized');
    }
    return this.client;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.connected = false;
    }
  }

  getConfig(): Readonly<S3Config> {
    return { ...this.config };
  }
}

/**
 * FTP Connection Manager - Non-Singleton
 * Create multiple instances for different FTP servers
 */
export class FTPConnection {
  private client: ftp.Client;
  private config: FTPConfig;
  private connected: boolean = false;

  constructor(config: FTPConfig) {
    this.config = config;
    this.client = new ftp.Client();
    this.client.ftp.verbose = false;
  }

  async connect(): Promise<void> {
    try {
      await this.client.access({
        host: this.config.host,
        port: this.config.port || 21,
        user: this.config.user || 'anonymous',
        password: this.config.password || '',
        secure: this.config.secure || false,
        secureOptions: this.config.secureOptions,
      });
      this.connected = true;
    } catch (error) {
      this.connected = false;
      throw new Error(`FTP connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getClient(): ftp.Client {
    if (!this.connected) {
      throw new Error('FTP not connected. Call connect() first.');
    }
    return this.client;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      this.client.close();
      this.connected = false;
    }
  }

  getConfig(): Readonly<FTPConfig> {
    return { ...this.config };
  }
}

/**
 * SFTP Connection Manager - Non-Singleton
 * Create multiple instances for different SFTP servers
 */
export class SFTPConnection {
  private client: SFTPClient;
  private config: SFTPConfig;
  private connected: boolean = false;

  constructor(config: SFTPConfig) {
    this.config = config;
    this.client = new SFTPClient();
  }

  async connect(): Promise<void> {
    try {
      const connectConfig: ConnectConfig = {
        host: this.config.host,
        port: this.config.port || 22,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
        passphrase: this.config.passphrase,
      };

      await this.client.connect(connectConfig);
      this.connected = true;
    } catch (error) {
      this.connected = false;
      throw new Error(`SFTP connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getClient(): SFTPClient {
    if (!this.connected) {
      throw new Error('SFTP not connected. Call connect() first.');
    }
    return this.client;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
    }
  }

  getConfig(): Readonly<SFTPConfig> {
    return { ...this.config };
  }
}

/**
 * Example Usage:
 * 
 * // Create multiple S3 connections
 * const s3Primary = new S3Connection({
 *   region: 'us-east-1',
 *   credentials: {
 *     accessKeyId: 'YOUR_KEY',
 *     secretAccessKey: 'YOUR_SECRET'
 *   }
 * });
 * 
 * const s3Secondary = new S3Connection({
 *   region: 'eu-west-1',
 *   credentials: {
 *     accessKeyId: 'OTHER_KEY',
 *     secretAccessKey: 'OTHER_SECRET'
 *   }
 * });
 * 
 * // Create multiple FTP connections
 * const ftpServer1 = new FTPConnection({
 *   host: 'ftp.example.com',
 *   user: 'username',
 *   password: 'password'
 * });
 * await ftpServer1.connect();
 * 
 * const ftpServer2 = new FTPConnection({
 *   host: 'ftp.another.com',
 *   user: 'different_user',
 *   password: 'different_pass'
 * });
 * await ftpServer2.connect();
 * 
 * // Create multiple SFTP connections
 * const sftpServer1 = new SFTPConnection({
 *   host: 'sftp.example.com',
 *   username: 'user',
 *   password: 'pass'
 * });
 * await sftpServer1.connect();
 * 
 * const sftpServer2 = new SFTPConnection({
 *   host: 'sftp.another.com',
 *   username: 'other_user',
 *   privateKey: fs.readFileSync('/path/to/key')
 * });
 * await sftpServer2.connect();
 * 
 * // Use the connections
 * const s3Client = s3Primary.getClient();
 * const ftpClient = ftpServer1.getClient();
 * const sftpClient = sftpServer1.getClient();
 * 
 * // Clean up
 * await s3Primary.disconnect();
 * await ftpServer1.disconnect();
 * await sftpServer1.disconnect();
 */

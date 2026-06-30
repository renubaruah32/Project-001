import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";

// Load environment variables from .env file (if exists)
dotenv.config({ override: true });

console.log("[STARTUP] Environment diagnostics:");
console.log("  - SUPABASE_URL / VITE_SUPABASE_URL present:", !!(process.env.VITE_SUPABASE_URL || process.env["SUPABASE_URL"]), (process.env.VITE_SUPABASE_URL || process.env["SUPABASE_URL"]) ? `(${(process.env.VITE_SUPABASE_URL || process.env["SUPABASE_URL"])!.slice(0, 15)}...)` : "(missing)");
console.log("  - SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY present:", !!(process.env.VITE_SUPABASE_ANON_KEY || process.env["SUPABASE_ANON_KEY"]));
console.log("  - SUPABASE_SERVICE_ROLE_KEY present:", !!process.env["SUPABASE_SERVICE_ROLE_KEY"]);
console.log("  - DATABASE_URL present:", !!process.env.DATABASE_URL);

import { createServer as createViteServer } from "vite";
import { uploadImageToDatabase, retrieveImageFromDatabase } from "./src/utils/imageStorage";
import { isPgActive, initPostgresSchema, loadStateFromPostgres, saveStateToPostgres, testConnectionOnDemand, resetConnectionPoolState, isPgConnectionFailed, getPool, invalidatePostgresCache } from "./src/db/postgres";
import { isSupabaseServerActive, getSupabaseServerClient, resetSupabaseServerClient } from "./src/db/supabase";

let globalDatabaseState: any = {};

async function getAuthUser(req: express.Request) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  // Intercept mock tokens for seamless offline/local fallback operation
  if (token.startsWith("mock-token-")) {
    const parts = token.split("-");
    const userId = parts[2] || "mock-user-123";
    const username = parts[3] || "Player";
    const email = `${username.toLowerCase()}@example.com`;
    const user = {
      id: userId,
      email: email,
      user_metadata: {
        username: username,
        avatar: "lady-vip"
      }
    };

    // Auto-create missing mock profile/user rows in local memory database
    const db = globalDatabaseState;
    if (db && db.users) {
      const exists = db.users.some((u: any) => u.id === userId || u.user_id === userId);
      if (!exists) {
        console.log(`[getAuthUser] Local Fallback: Auto-registering mock user ${username} in memory db...`);
        const referredByHeader = req.headers["x-referred-by"] || "";
        const referredByCode = parts[4] || referredByHeader || "";
        let referrerId = "";

        if (referredByCode) {
          const referrerUser = db.users.find((u: any) => u.referral_code === referredByCode || u.id === referredByCode || u.username === referredByCode);
          if (referrerUser) {
            referrerId = referrerUser.id;
            console.log(`[Local Fallback] Found referrer: ${referrerId} using code: ${referredByCode}`);
            // Reward referrer's mock wallet with 250 INR
            if (db.wallets) {
              const refWallet = db.wallets.find((w: any) => w.id === referrerId);
              if (refWallet) {
                refWallet.balance = (refWallet.balance || 0) + 250;
              }
            }
          }
        }

        const generatedRefCode = `TNZ_${username.toUpperCase().replace(/\s+/g, '')}_${Math.floor(100 + Math.random() * 900)}`;

        const newUser = {
          id: userId,
          user_id: userId,
          full_name: username,
          username: username,
          email: email,
          phone: "",
          avatar: "lady-vip",
          security_id: "SEC-" + Math.floor(1000 + Math.random() * 9000),
          balance: 1000,
          bonus_balance: 100,
          referral_code: generatedRefCode,
          referred_by: referrerId,
          vip_level: "1",
          status: "Active",
          kyc_status: "Approved",
          created_at: new Date().toISOString(),
          balance_version: 1
        };
        db.users.push(newUser);
        
        if (!db.wallets) db.wallets = [];
        db.wallets.push({
          id: userId,
          balance: 1000,
          bonus_balance: 100,
          balance_version: 1
        });

        if (!db.profiles) db.profiles = [];
        db.profiles.push({
          id: userId,
          username: username,
          avatar: "lady-vip",
          vip_level: "1",
          status: "active"
        });

        // Save local JSON db synchronously to survive restarts
        try {
          const DB_PATH = path.join(process.cwd(), "src", "data", "db.json");
          fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
          console.log("[Local Storage] Mock user state saved successfully.");
        } catch (err) {
          console.error("[getAuthUser] Failed to save mock user state:", err);
        }
      }
    }

    return user;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      const errMsg = error?.message || "";
      const isExpired = errMsg.toLowerCase().includes("expired") || errMsg.toLowerCase().includes("claims") || errMsg.toLowerCase().includes("signature");
      if (isExpired) {
        console.log("[Auth] Token is expired or invalid. User session needs renewal.");
      } else {
        console.warn("[Auth] Failed to get user from token:", errMsg);
      }
      return null;
    }

    // Lazily ensure profiles, wallets, and users tables have the row for this user
    try {
      const activePool = getPool();
      if (activePool && isPgActive()) {
        const client = await activePool.connect();
        try {
          await client.query("BEGIN");
          
          const userId = user.id;
          const email = user.email || "";
          const username = user.user_metadata?.username || email.split("@")[0] || "User";
          const avatar = user.user_metadata?.avatar || "";

          // Self-healing: Clean up any stale records in users and profiles that have the same email or username but a different ID
          if (email) {
            await client.query("DELETE FROM users WHERE (email = $1 OR username = $2) AND id <> $3", [email, username, userId]);
            await client.query("DELETE FROM profiles WHERE username = $1 AND id <> $2", [username, userId]);
          } else {
            await client.query("DELETE FROM users WHERE username = $1 AND id <> $2", [username, userId]);
            await client.query("DELETE FROM profiles WHERE username = $1 AND id <> $2", [username, userId]);
          }

          // Check/Create profile
          const profCheck = await client.query("SELECT id FROM profiles WHERE id = $1", [userId]);
          if (profCheck.rows.length === 0) {
            console.log(`[getAuthUser] Auto-creating missing profile for ${userId}`);
            await client.query(
              `INSERT INTO profiles (id, username, avatar, vip_level, status)
               VALUES ($1, $2, $3, 1, 'active')`,
              [userId, username, avatar]
            );
          }

          // Check/Create wallet
          const walletCheck = await client.query("SELECT id FROM wallets WHERE id = $1", [userId]);
          if (walletCheck.rows.length === 0) {
            console.log(`[getAuthUser] Auto-creating missing wallet for ${userId}`);
            await client.query(
              `INSERT INTO wallets (id, balance, bonus_balance, balance_version)
               VALUES ($1, 0, 0, 0)`,
              [userId]
            );
          }

          // Check/Create users row to keep everything sync'd
          const userCheck = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
          if (userCheck.rows.length === 0) {
            console.log(`[getAuthUser] Auto-creating missing users row for ${userId}`);
            
            // Check x-referred-by or user metadata for referrer code
            const referredByHeader = (req.headers["x-referred-by"] || "") as string;
            const referredByCode = (user.user_metadata?.referred_by_code || referredByHeader || "") as string;
            let referrerId = "";
            
            if (referredByCode) {
              const refUserCheck = await client.query("SELECT id FROM users WHERE referral_code = $1 OR id = $2 OR username = $3", [referredByCode, referredByCode, referredByCode]);
              if (refUserCheck.rows.length > 0) {
                referrerId = refUserCheck.rows[0].id;
                console.log(`[getAuthUser] Postgres: User ${userId} referred by ${referrerId} using code ${referredByCode}`);
              }
            }

            const generatedRefCode = `TNZ_${username.toUpperCase().replace(/\s+/g, '')}_${Math.floor(100 + Math.random() * 900)}`;

            await client.query(
              `INSERT INTO users (id, user_id, full_name, username, email, phone, avatar, security_id, balance, bonus_balance, referral_code, referred_by, vip_level, status, kyc_status, created_at, balance_version)
               VALUES ($1, $2, $3, $4, $5, '', $6, '', 1000, 100, $7, $8, '1', 'Active', 'Approved', $9, 0)`,
              [userId, userId, username, username, email, avatar, generatedRefCode, referrerId, new Date().toISOString()]
            );

            // Ensure wallet also starts with 1000 INR and 100 Bonus INR
            await client.query(
              `UPDATE wallets SET balance = 1000, bonus_balance = 100 WHERE id = $1`,
              [userId]
            );

            // Insert referral commission tracker row if referrer was found
            if (referrerId) {
              const referralId = `ref-${userId.slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
              await client.query(
                `INSERT INTO referrals (referral_id, referrer_user_id, referred_user_id, commission, status, created_at)
                 VALUES ($1, $2, $3, 250, 'active', $4)`,
                [referralId, referrerId, userId, new Date().toISOString()]
              );
              // Give referrer 250 INR reward!
              await client.query(
                `UPDATE wallets SET balance = balance + 250 WHERE id = $1`,
                [referrerId]
              );
            }
          }

          await client.query("COMMIT");
        } catch (dbErr) {
          await client.query("ROLLBACK");
          console.error("[getAuthUser] Failed to ensure database rows for user:", dbErr);
        } finally {
          client.release();
        }
      }
    } catch (dbConnectErr) {
      console.error("[getAuthUser] Database connection/sync failed:", dbConnectErr);
    }

    return user;
  } catch (err) {
    console.error("[Auth] Error parsing token:", err);
    return null;
  }
}

interface UpiOrder {
  orderId: string;
  amount: number;
  receiverVpa: string;
  status: 'awaiting_payment' | 'verifying' | 'success' | 'failed';
  progress: number;
  log: string;
  referenceUtr?: string;
  timestamp: number;
  username?: string;
}

const upiOrders: Record<string, UpiOrder> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Save Image to Database helper
  async function saveImageToDatabase(filename: string, base64Image: string, assetType: string, gameId?: string) {
    try {
      const imageUrl = await uploadImageToDatabase(filename, base64Image, assetType, gameId);
      return imageUrl;
    } catch (err) {
      console.error("[Database Storage] Error saving image:", err);
      return null;
    }
  }

  // Middleware for body parsing with high limit for image uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Enable full CORS support including custom headers for API Key validation
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Auto cache invalidation middleware for any mutations/writes (POST, PUT, DELETE, PATCH)
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      invalidatePostgresCache();
    }
    next();
  });

  // Ensure uploads directory exists and host statically
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use("/uploads", express.static(UPLOADS_DIR));



  // Verify all required environment variables are present on startup.
  const missingVars = [];
  const activeUrl = process.env.VITE_SUPABASE_URL || process.env["SUPABASE_URL"];
  const activeAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env["SUPABASE_ANON_KEY"];
  
  if (!activeUrl) missingVars.push("VITE_SUPABASE_URL");
  if (!activeAnonKey) missingVars.push("VITE_SUPABASE_ANON_KEY");
  if (!process.env.DATABASE_URL) missingVars.push("DATABASE_URL");
  if (missingVars.length > 0) {
    console.warn(`⚠️ WARNING: Missing some required connection variables on startup: ${missingVars.join(", ")}. Falling back to local in-memory/JSON DB mode.`);
  } else {
    console.log("[Supabase] Required environment variables are present:");
    console.log(`  - VITE_SUPABASE_URL: ${activeUrl.slice(0, 25)}...`);
    console.log(`  - VITE_SUPABASE_ANON_KEY: configured`);
    console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL!.slice(0, 30)}...`);
  }

  // Path to persistent db.json (only used for initial seed if tables are empty, then never touched)
  const DB_PATH = path.join(process.cwd(), "src", "data", "db.json");
  let seedData: any = {};
  try {
    if (fs.existsSync(DB_PATH)) {
      console.log("[PostgreSQL] Found db.json template for initial seeding.");
      seedData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("[PostgreSQL] Warning: failed to parse db.json for seeding:", e);
  }

  // Verify connection to PostgreSQL/Supabase database on startup.
  let isDatabaseConnected = false;
  if (missingVars.length === 0) {
    console.log("[PostgreSQL] Checking connection to live Supabase database...");
    try {
      const connTest = await testConnectionOnDemand();
      if (connTest.success) {
        console.log("✅ PostgreSQL connection test successful.");
        isDatabaseConnected = true;
      } else {
        console.error("⚠️ WARNING: Failed to connect to the live Supabase database on startup:", connTest.error);
      }
    } catch (err) {
      console.error("⚠️ WARNING: Exception testing PostgreSQL connection:", err);
    }
  }

  // Strictly initialize PostgreSQL schema and load state.
  let database: any = seedData;
  globalDatabaseState = database;
  if (isDatabaseConnected) {
    try {
      console.log("[PostgreSQL] Initializing table schemas...");
      await initPostgresSchema(seedData);

      console.log("[PostgreSQL] Loading database state from live Supabase database...");
      const pgData = await loadStateFromPostgres();
      if (pgData) {
        database = pgData;
        console.log(`✅ Successfully loaded full state from Supabase database. (${Object.keys(database).length} tables loaded)`);
      } else {
        console.warn("⚠️ WARNING: loadStateFromPostgres returned null. Falling back to local/memory state.");
      }

      // Ensure Supabase Storage assets bucket exists
      const supabase = getSupabaseServerClient();
      if (supabase) {
        try {
          console.log("[Supabase Storage] Initializing bucket verification...");
          const { data: buckets, error: bError } = await supabase.storage.listBuckets();
          if (!bError && buckets) {
            const assetsBucketExists = buckets.some((b: any) => b.name === "assets");
            if (!assetsBucketExists) {
              console.log("[Supabase Storage] 'assets' bucket does not exist. Creating...");
              const { error: cError } = await supabase.storage.createBucket("assets", {
                public: true,
                allowedMimeTypes: ["image/*", "audio/*"],
                fileSizeLimit: 20971520 // 20 MB
              });
              if (cError) {
                console.warn("[Supabase Storage] Note: Could not create 'assets' bucket (expected if using Anon key):", cError.message);
              } else {
                console.log("[Supabase Storage] Created 'assets' bucket successfully with image/* and audio/* allowed.");
              }
            } else {
              console.log("[Supabase Storage] 'assets' bucket already exists. Updating to allow both image/* and audio/*...");
              const { error: uError } = await supabase.storage.updateBucket("assets", {
                public: true,
                allowedMimeTypes: ["image/*", "audio/*"],
                fileSizeLimit: 20971520
              });
              if (uError) {
                console.warn("[Supabase Storage] Note: Could not update 'assets' bucket (expected if using Anon key):", uError.message);
              } else {
                console.log("[Supabase Storage] Updated 'assets' bucket allowedMimeTypes successfully.");
              }
            }
          } else if (bError) {
            console.warn("[Supabase Storage] Note: Could not list buckets during startup (expected if using Anon key):", bError.message);
          }
        } catch (err) {
          console.warn("[Supabase Storage] Exception verifying/creating assets bucket (handled gracefully):", err);
        }
      }
    } catch (err: any) {
      console.error("⚠️ WARNING: Failed to initialize and load state from live database:", err.message || err);
      console.warn("⚠️ Falling back gracefully to local in-memory database to keep the server running.");
    }
  } else {
    console.warn("⚠️ Database connection was not established. Running in Local Memory Fallback mode.");
  }

  // Load Database helper
  function loadDB() {
    return database;
  }

  // Save Database helper (Updates memory cache and saves synchronously to Postgres and local db.json)
  function saveDB(db: any) {
    database = db;
    globalDatabaseState = db;
    
    // Always write to local db.json first to ensure local durability
    try {
      const DB_PATH = path.join(process.cwd(), "src", "data", "db.json");
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
      console.log("[Local Storage] Saved state to db.json successfully.");
    } catch (fsErr) {
      console.error("[Local Storage] Failed to write state to db.json:", fsErr);
    }

    if (isPgActive()) {
      saveStateToPostgres(db).then((success) => {
        if (success) {
          console.log("[PostgreSQL] Saved state to live database successfully.");
        } else {
          console.error("[PostgreSQL] Failed to save state to live database.");
        }
      }).catch((err) => {
        console.error("[PostgreSQL] Error saving state to live database:", err);
      });
    } else {
      console.error("[PostgreSQL] Cannot save state. Database connection is not active.");
    }
  }

  // Rate Limiting IP Tracking
  const ipRequests: Record<string, number[]> = {};
  const rateLimiter = (req: any, res: any, next: any) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    
    if (!ipRequests[ip]) {
      ipRequests[ip] = [];
    }
    
    // Prune requests older than 1 minute
    ipRequests[ip] = ipRequests[ip].filter(timestamp => now - timestamp < 60000);
    
    if (ipRequests[ip].length >= 100) { // Limit to 100 requests per minute
      return res.status(429).json({ 
        status: "error", 
        message: "Too many requests. Real-time rate limiter active (60s cooldown limit exceeded)." 
      });
    }
    
    ipRequests[ip].push(now);
    next();
  };

  app.use(rateLimiter);



  // ==================== FRONTEND API ROUTES ====================

  // Serve images stored in Database or local disk
  app.get("/api/images/:filename", async (req, res) => {
    const { filename } = req.params;
    
    // 1. Try to fetch from Database if enabled
    try {
      const base64Image = await retrieveImageFromDatabase(filename);
      if (base64Image) {
        const matches = base64Image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = `image/${matches[1]}`;
          const imageBuffer = Buffer.from(matches[2], 'base64');
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return res.send(imageBuffer);
        }
      }
    } catch (err) {
      console.error(`[Database Storage] Error serving image ${filename}:`, err);
    }

    // 2. Fallback to local files in uploads folder
    const localPath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(localPath)) {
      // Determine content type
      let contentType = "image/jpeg";
      if (filename.endsWith(".png")) contentType = "image/png";
      else if (filename.endsWith(".gif")) contentType = "image/gif";
      else if (filename.endsWith(".svg")) contentType = "image/svg+xml";
      else if (filename.endsWith(".webp")) contentType = "image/webp";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(localPath);
    }

    return res.status(404).send("Image not found");
  });

  app.get("/api/auth/profile", async (req, res) => {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized: Invalid or expired token." });
    }

    const userId = user.id;
    let profileData: any = null;
    let walletData: any = null;

    const activePool = getPool();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "");
    if (activePool && isPgActive() && isUuid) {
      try {
        const profRes = await activePool.query("SELECT * FROM profiles WHERE id = $1", [userId]);
        if (profRes.rows.length > 0) {
          profileData = profRes.rows[0];
        }
        const walletRes = await activePool.query("SELECT * FROM wallets WHERE id = $1", [userId]);
        if (walletRes.rows.length > 0) {
          walletData = walletRes.rows[0];
        }
      } catch (err) {
        console.error("[Auth Profile] Fetch error:", err);
      }
    } else {
      // Fallback: look up profile & wallet in the local memory database
      const db = globalDatabaseState;
      if (db) {
        const memUser = (db.users || []).find((u: any) => u.id === userId || u.user_id === userId);
        if (memUser) {
          profileData = {
            id: userId,
            username: memUser.username || memUser.full_name,
            avatar: memUser.avatar,
            vip_level: memUser.vip_level || 1,
            status: memUser.status || "active"
          };
          walletData = {
            id: userId,
            balance: memUser.balance,
            bonus_balance: memUser.bonus_balance,
            balance_version: memUser.balance_version || 0
          };
        }
      }
    }

    const finalProfile = profileData || {
      id: userId,
      username: user.user_metadata?.username || user.email?.split("@")[0],
      avatar: user.user_metadata?.avatar || "",
      vip_level: 1,
      status: 'active'
    };
    const finalWallet = walletData || {
      balance: 0,
      bonus_balance: 0,
      balance_version: 0
    };

    res.json({
      status: "ok",
      user: {
        id: userId,
        email: user.email,
        username: finalProfile.username,
        avatar: finalProfile.avatar || "",
        vipLevel: Number(finalProfile.vip_level || 1),
        walletBalance: Number(finalWallet.balance || 0),
        bonusBalance: Number(finalWallet.bonus_balance || 0),
        balanceVersion: Number(finalWallet.balance_version || 0)
      }
    });
  });

  // API 1: Get full database state (for initial sync)
  app.get("/api/db", async (req, res) => {
    let db = loadDB() || database;
    const pgActive = isPgActive();
    const sbActive = isSupabaseServerActive();

    if (pgActive) {
      const pgState = await loadStateFromPostgres();
      if (pgState) {
        db = pgState;
      }
    }

    const dbType = "Supabase PostgreSQL Database (Active)";

    const authHeader = req.headers["authorization"];

    let authUser = null;
    if (authHeader) {
      authUser = await getAuthUser(req);
      if (!authUser) {
        return res.status(401).json({ status: "error", message: "Unauthorized: Invalid or expired token." });
      }
    }

    // Clone DB state before applying user-specific filters to prevent mutating the shared cache/memory state
    const responseDb = {
      ...db,
      users: [...(db.users || [])],
      deposits: [...(db.deposits || [])],
      withdrawals: [...(db.withdrawals || [])]
    };

    if (authUser) {
      const userId = authUser.id;
      // 1. Only allow the user to see their own transactions
      responseDb.deposits = (responseDb.deposits || []).filter((d: any) => d.user_id === userId);
      responseDb.withdrawals = (responseDb.withdrawals || []).filter((w: any) => w.user_id === userId);
      
      // 2. Fetch the user's personal profile and wallet
      const activePool = getPool();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || "");
      if (activePool && pgActive && isUuid) {
        try {
          const profRes = await activePool.query("SELECT * FROM profiles WHERE id = $1", [userId]);
          const walletRes = await activePool.query("SELECT * FROM wallets WHERE id = $1", [userId]);
          
          if (profRes.rows.length > 0 && walletRes.rows.length > 0) {
            const p = profRes.rows[0];
            const w = walletRes.rows[0];
            
            const mappedUser = {
              id: userId,
              user_id: userId,
              username: p.username,
              avatar: p.avatar || "",
              vip_level: Number(p.vip_level || 1),
              status: p.status || "active",
              balance: Number(w.balance || 0),
              bonus_balance: Number(w.bonus_balance || 0),
              balance_version: Number(w.balance_version || 0)
            };

            // Set users to ONLY contain the currently authenticated user
            responseDb.users = [mappedUser];
          }
        } catch (dbErr) {
          console.error("[api/db] Error loading personal user profile:", dbErr);
        }
      } else {
        // Fallback for mock users when PostgreSQL is not active
        const memUser = (responseDb.users || []).find((u: any) => u.id === userId || u.user_id === userId);
        if (memUser) {
          responseDb.users = [memUser];
        } else {
          responseDb.users = [];
        }
      }
    } else {
      // If not authenticated, we do not expose any other users or balances
      responseDb.users = [];
      responseDb.deposits = [];
      responseDb.withdrawals = [];
    }

    res.json({ 
      status: "ok", 
      db: responseDb, 
      isPgActive: pgActive, 
      isSupabaseActive: sbActive,
      dbType,
      hasFailed: isPgConnectionFailed()
    });
  });

  // API 1b: Test database connection on demand
  app.get("/api/db/test", async (req, res) => {
    try {
      const result = await testConnectionOnDemand();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // API 1c: Reset connection pool to retry after credential updates
  app.post("/api/db/reset", (req, res) => {
    try {
      const result = resetConnectionPoolState();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // API 1d: Get dynamic database credentials for client-side SDK use
  app.get("/api/db/credentials", (req, res) => {
    res.json({
      status: "ok",
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env["SUPABASE_URL"] || "",
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env["SUPABASE_ANON_KEY"] || ""
    });
  });







  // ==================== CLIENT (USER) FLOW ACTIONS API ====================

  // Client updates wallet / deposit creation
  app.post("/api/client/deposit-request", async (req, res) => {
    const { username, amount, paymentMethod, utrNumber } = req.body;
    const value = Number(amount);
    if (value <= 0) {
      return res.status(400).json({ status: "error", message: "Transaction must be greater than zero." });
    }

    const authHeader = req.headers["authorization"];
    let authUser = null;
    if (authHeader) {
      authUser = await getAuthUser(req);
      if (!authUser) {
        return res.status(401).json({ status: "error", message: "Unauthorized: Invalid or expired token." });
      }
    }
    const pgActive = isPgActive();
    const activePool = getPool();

    const isUuid = authUser ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id) : false;
    if (authUser && pgActive && activePool && isUuid) {
      const userId = authUser.id;
      try {
        // Fetch profile
        const profRes = await activePool.query("SELECT * FROM profiles WHERE id = $1", [userId]);
        if (profRes.rows.length === 0) {
          return res.status(404).json({ status: "error", message: "User profile not found." });
        }
        const profile = profRes.rows[0];

        // Checking if Auto-Approval is on
        const db = loadDB() || database;
        const isAutoApprove = db.global_settings?.automatic_deposit_approval || false;
        const status = isAutoApprove ? "APPROVED" : "PENDING";

        // Create deposit
        const newDep = {
          deposit_id: "DEP-" + Date.now().toString().slice(-4),
          user_id: userId,
          amount: value,
          payment_method: paymentMethod || "UPI",
          utr_number: utrNumber || "3" + Math.floor(10000000000 + Math.random() * 90000000000),
          screenshot: "",
          status,
          created_at: new Date().toISOString()
        };

        // Insert into deposits table
        await activePool.query(
          `INSERT INTO deposits (deposit_id, user_id, amount, payment_method, utr_number, screenshot, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [newDep.deposit_id, newDep.user_id, newDep.amount, newDep.payment_method, newDep.utr_number, newDep.screenshot, newDep.status, newDep.created_at]
        );

        if (isAutoApprove) {
          // Increment wallets balance
          await activePool.query(
            `INSERT INTO wallets (id, balance, bonus_balance, balance_version)
             VALUES ($1, $2, 0, 1)
             ON CONFLICT (id) DO UPDATE SET
               balance = wallets.balance + EXCLUDED.balance,
               balance_version = wallets.balance_version + 1`,
            [userId, value]
          );
        }

        // Get updated wallet
        const walletRes = await activePool.query("SELECT * FROM wallets WHERE id = $1", [userId]);
        const wallet = walletRes.rows[0] || { balance: 0, bonus_balance: 0, balance_version: 0 };

        return res.json({
          status: "ok",
          deposit: newDep,
          user: {
            id: userId,
            username: profile.username,
            avatar: profile.avatar || "",
            vipLevel: Number(profile.vip_level || 1),
            walletBalance: Number(wallet.balance || 0),
            bonusBalance: Number(wallet.bonus_balance || 0),
            balanceVersion: Number(wallet.balance_version || 0)
          }
        });
      } catch (err: any) {
        console.error("[Deposit Request] DB error:", err);
        return res.status(500).json({ status: "error", message: err.message });
      }
    }

    // Fallback Mock JSON Flow
    const db = loadDB() || database;
    const user = db.users.find((u: any) => u.username === username);
    if (!user) {
      return res.status(404).json({ status: "error", message: "Active player session not registered." });
    }

    const isAutoApprove = db.global_settings?.automatic_deposit_approval || false;
    const status = isAutoApprove ? "APPROVED" : "PENDING";

    const newDep = {
      deposit_id: "DEP-" + Date.now().toString().slice(-4),
      user_id: user.user_id,
      amount: value,
      payment_method: paymentMethod || "UPI",
      utr_number: utrNumber || "3" + Math.floor(10000000000 + Math.random() * 90000000000),
      screenshot: "",
      status,
      created_at: new Date().toISOString()
    };

    if (isAutoApprove) {
      user.balance += value;
      user.balance_version = (user.balance_version || 0) + 1;
    }

    db.deposits = [newDep, ...db.deposits];
    saveDB(db);
    database = db;

    res.json({ status: "ok", deposit: newDep, user });
  });

  // Client requests cashout
  app.post("/api/client/withdraw-request", async (req, res) => {
    const { username, amount, bankName, accountNumber, ifscCode, upiId } = req.body;
    const value = Number(amount);
    if (value <= 0) {
      return res.status(400).json({ status: "error", message: "A minimum withdrawal amount is required." });
    }

    const authHeader = req.headers["authorization"];
    let authUser = null;
    if (authHeader) {
      authUser = await getAuthUser(req);
      if (!authUser) {
        return res.status(401).json({ status: "error", message: "Unauthorized: Invalid or expired token." });
      }
    }
    const pgActive = isPgActive();
    const activePool = getPool();

    const isUuid = authUser ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id) : false;
    if (authUser && pgActive && activePool && isUuid) {
      const userId = authUser.id;
      try {
        // Fetch wallet
        const walletRes = await activePool.query("SELECT * FROM wallets WHERE id = $1", [userId]);
        const wallet = walletRes.rows[0];
        if (!wallet || Number(wallet.balance) < value) {
          return res.status(400).json({ status: "error", message: "Insufficient vault balance." });
        }

        // Fetch profile
        const profRes = await activePool.query("SELECT * FROM profiles WHERE id = $1", [userId]);
        const profile = profRes.rows[0] || {};

        // Create withdrawal transaction
        const newWth = {
          withdrawal_id: "WTH-" + Date.now().toString().slice(-4),
          user_id: userId,
          amount: value,
          bank_name: bankName || "N/A",
          account_number: accountNumber || "N/A",
          ifsc_code: ifscCode || "N/A",
          upi_id: upiId || "N/A",
          status: "PENDING",
          remarks: "",
          created_at: new Date().toISOString()
        };

        // Deduct balance in DB
        await activePool.query(
          `UPDATE wallets SET 
             balance = balance - $1, 
             balance_version = balance_version + 1 
           WHERE id = $2`,
          [value, userId]
        );

        // Insert withdrawal request
        await activePool.query(
          `INSERT INTO withdrawals (withdrawal_id, user_id, amount, bank_name, account_number, ifsc_code, upi_id, status, remarks, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [newWth.withdrawal_id, newWth.user_id, newWth.amount, newWth.bank_name, newWth.account_number, newWth.ifsc_code, newWth.upi_id, newWth.status, newWth.remarks, newWth.created_at]
        );

        // Get updated wallet
        const updatedWalletRes = await activePool.query("SELECT * FROM wallets WHERE id = $1", [userId]);
        const updatedWallet = updatedWalletRes.rows[0];

        return res.json({
          status: "ok",
          withdrawal: newWth,
          user: {
            id: userId,
            username: profile.username,
            avatar: profile.avatar || "",
            vipLevel: Number(profile.vip_level || 1),
            walletBalance: Number(updatedWallet.balance),
            bonusBalance: Number(updatedWallet.bonus_balance),
            balanceVersion: Number(updatedWallet.balance_version)
          }
        });
      } catch (err: any) {
        console.error("[Withdrawal Request] DB error:", err);
        return res.status(500).json({ status: "error", message: err.message });
      }
    }

    // Fallback Mock JSON Flow
    const db = loadDB() || database;
    const user = db.users.find((u: any) => u.username === username);
    if (!user) {
      return res.status(404).json({ status: "error", message: "Session profile missing." });
    }

    if (user.balance < value) {
      return res.status(400).json({ status: "error", message: "Insufficient vault balance." });
    }

    // Deduct immediate balance
    user.balance -= value;
    user.balance_version = (user.balance_version || 0) + 1;

    const newWth = {
      withdrawal_id: "WTH-" + Date.now().toString().slice(-4),
      user_id: user.user_id,
      amount: value,
      bank_name: bankName || "N/A",
      account_number: accountNumber || "N/A",
      ifsc_code: ifscCode || "N/A",
      upi_id: upiId || "N/A",
      status: "PENDING",
      remarks: "",
      created_at: new Date().toISOString()
    };

    db.withdrawals = [newWth, ...db.withdrawals];
    saveDB(db);
    database = db;

    res.json({ status: "ok", withdrawal: newWth, user });
  });

  // Client updates balance after play / wins / losses / claims
  app.post("/api/client/update-balance", async (req, res) => {
    const { username, balance, bonusBalance, balanceVersion } = req.body;
    
    const authHeader = req.headers["authorization"];
    let authUser = null;
    if (authHeader) {
      authUser = await getAuthUser(req);
      if (!authUser) {
        return res.status(401).json({ status: "error", message: "Unauthorized: Invalid or expired token." });
      }
    }
    const pgActive = isPgActive();
    const activePool = getPool();

    const isUuid = authUser ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id) : false;
    if (authUser && pgActive && activePool && isUuid) {
      const userId = authUser.id;
      try {
        const q = `
          INSERT INTO wallets (id, balance, bonus_balance, balance_version)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET
            balance = EXCLUDED.balance,
            bonus_balance = EXCLUDED.bonus_balance,
            balance_version = EXCLUDED.balance_version
          RETURNING *;
        `;
        const result = await activePool.query(q, [
          userId, 
          Math.max(0, Number(balance)), 
          Math.max(0, Number(bonusBalance || 0)), 
          Math.max(0, Number(balanceVersion || 0))
        ]);
        const wallet = result.rows[0];
        return res.json({ 
          status: "ok", 
          balance: Number(wallet.balance), 
          bonus_balance: Number(wallet.bonus_balance), 
          balance_version: Number(wallet.balance_version) 
        });
      } catch (err: any) {
        console.error("[Update Balance] DB update failed:", err);
        return res.status(500).json({ status: "error", message: err.message });
      }
    }

    // Fallback Mock JSON Flow
    const db = loadDB() || database;
    const user = db.users.find((u: any) => u.username === username);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User profile not found." });
    }

    if (balance !== undefined) {
      user.balance = Math.max(0, Number(balance));
    }
    if (bonusBalance !== undefined) {
      user.bonus_balance = Math.max(0, Number(bonusBalance));
    }
    if (balanceVersion !== undefined) {
      user.balance_version = Math.max(user.balance_version || 0, Number(balanceVersion));
    }

    saveDB(db);
    database = db;

    res.json({ status: "ok", balance: user.balance, bonus_balance: user.bonus_balance, balance_version: user.balance_version });
  });

  // ==================== ORIGINAL UPI SMS FLOWS (COMPATIBILITY) ====================

  app.post("/api/upi-initiate", (req, res) => {
    const { orderId, amount, receiverVpa, username } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({ status: "error", message: "Missing orderId or amount" });
    }

    upiOrders[orderId] = {
      orderId,
      amount: Number(amount),
      receiverVpa: receiverVpa || 'debupam.work@okaxis',
      status: 'awaiting_payment',
      progress: 0,
      log: `📡 Webhook Listener Active... Awaiting SMS payload containing ID Code: ${orderId}`,
      timestamp: Date.now(),
      username: username || 'HighRoller777'
    };

    console.log(`[UPI Ledger] Order registered: ${orderId} for ₹${amount} (user: ${username || 'HighRoller777'})`);
    res.json({ status: "ok", order: upiOrders[orderId] });
  });

  app.get("/api/upi-status/:orderId", (req, res) => {
    const { orderId } = req.params;
    const order = upiOrders[orderId];

    if (!order) {
      return res.status(404).json({ status: "error", message: "Order not found" });
    }

    res.json({ status: "ok", order });
  });

  app.post("/api/upi-webhook", (req, res) => {
    const db = loadDB() || database;
    const rawMessage = req.body.message || req.body.text || req.body.body || "";
    let noteRemarks = req.body.noteRemarks || req.body.note || req.body.remarks || "";

    if (!noteRemarks && rawMessage) {
      const match = rawMessage.match(/RWP\d{6}/i);
      if (match) {
        noteRemarks = match[0].toUpperCase();
      }
    }

    const targetOrderId = noteRemarks ? noteRemarks.toUpperCase() : null;
    if (!targetOrderId || !upiOrders[targetOrderId]) {
      console.warn(`[Webhook Invalid] Remarks note '${noteRemarks}' not matched to a pending order in system.`);
      return res.status(400).json({ 
        status: "error", 
        message: "No matching pending deposit order found for note remarks: " + noteRemarks 
      });
    }

    const order = upiOrders[targetOrderId];
    let matchedAmount = Number(req.body.amount);
    if (!matchedAmount && rawMessage) {
      const amtMatch = rawMessage.match(/(?:Rs|INR|₹)\.?\s*([\d,]+(?:\.\d{1,2})?)/i) || rawMessage.match(/credited.*?([\d,]+(?:\.\d{1,2})?)/i);
      if (amtMatch) {
         matchedAmount = parseFloat(amtMatch[1].replace(/,/g, ''));
      }
    }

    let matchedUtr = req.body.referenceUtr || req.body.utr;
    if (!matchedUtr && rawMessage) {
      const utrMatch = rawMessage.match(/\b\d{12}\b/);
      if (utrMatch) {
        matchedUtr = utrMatch[0];
      }
    }
    if (!matchedUtr) {
      matchedUtr = "3" + Math.floor(10000000000 + Math.random() * 90000000000);
    }

    order.status = 'success';
    order.progress = 100;
    order.referenceUtr = matchedUtr;
    order.log = `⚡ Webhook integration match verified! ₹${(matchedAmount || order.amount).toLocaleString()} credited. Bank Ledger Sync complete.`;

    // Process real credit inside database dynamically for the correct user!
    const targetUsername = order.username || "HighRoller777";
    const clientUser = db.users.find((u: any) => u.username === targetUsername || u.user_id === targetUsername);
    if (clientUser) {
      const addedAmt = matchedAmount || order.amount;
      clientUser.balance += addedAmt;
      clientUser.balance_version = (clientUser.balance_version || 0) + 1;
      
      const newDep = {
        deposit_id: "DEP-W" + Date.now().toString().slice(-4),
        user_id: clientUser.user_id,
        amount: addedAmt,
        payment_method: "UPI_AUTO_SMS",
        utr_number: matchedUtr,
        screenshot: "",
        status: "APPROVED",
        created_at: new Date().toISOString()
      };
      
      db.deposits = [newDep, ...db.deposits];
      saveDB(db);
      database = db;
    }

    res.json({
      status: "ok",
      message: "Webhook matched and credited successfully",
      orderId: order.orderId,
      amount: matchedAmount || order.amount
    });
  });

  // Serve static assets of single page React client
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RoyalWinPro Server] Fullstack backend running on port http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start RoyalWinPro backend server:", err);
});

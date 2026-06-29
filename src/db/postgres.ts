import pg from "pg";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isPostgresActive = false;
let hasConnectionFailed = false;

// Initialize connection pool lazily if DATABASE_URL is available
export function getPool() {
  if (hasConnectionFailed) {
    return null;
  }
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      console.log("[PostgreSQL] DATABASE_URL found. Initializing Pool...");
      try {
        pool = new Pool({
          connectionString,
          ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
            ? false
            : { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000
        });
        pool.on("error", (err) => {
          console.error("[PostgreSQL] Unexpected pool error:", err.message || err);
          isPostgresActive = false;
          hasConnectionFailed = true;
        });
        isPostgresActive = true;
      } catch (e: any) {
        console.error("[PostgreSQL] Failed to initialize Pool instance:", e.message || e);
        isPostgresActive = false;
        hasConnectionFailed = true;
        pool = null;
      }
    } else {
      console.error("[PostgreSQL] DATABASE_URL not specified. Fallback mode active.");
      isPostgresActive = false;
      return null;
    }
  }
  return pool;
}

export function isPgActive(): boolean {
  getPool();
  return isPostgresActive;
}

// Check connection and initialize table schemas
export async function initPostgresSchema(fallbackDbState: any) {
  const activePool = getPool();
  if (!activePool) return;

  try {
    const client = await activePool.connect();
    console.log("[PostgreSQL] Successfully connected to database. Setting up schema tables...");
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE,
        full_name VARCHAR(255),
        username VARCHAR(255) UNIQUE,
        email VARCHAR(255),
        phone VARCHAR(255),
        avatar TEXT,
        security_id VARCHAR(255),
        balance NUMERIC DEFAULT 0,
        bonus_balance NUMERIC DEFAULT 0,
        referral_code VARCHAR(255),
        referred_by VARCHAR(255),
        vip_level VARCHAR(255),
        status VARCHAR(255),
        kyc_status VARCHAR(255),
        created_at VARCHAR(255),
        balance_version INT DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        deposit_id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        amount NUMERIC,
        payment_method VARCHAR(255),
        utr_number VARCHAR(255),
        screenshot TEXT,
        status VARCHAR(255),
        created_at VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        withdrawal_id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        amount NUMERIC,
        bank_name VARCHAR(255),
        account_number VARCHAR(255),
        ifsc_code VARCHAR(255),
        upi_id VARCHAR(255),
        status VARCHAR(255),
        remarks TEXT,
        created_at VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        referral_id VARCHAR(255) PRIMARY KEY,
        referrer_user_id VARCHAR(255),
        referred_user_id VARCHAR(255),
        commission NUMERIC,
        status VARCHAR(255),
        created_at VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vip_levels_config (
        level VARCHAR(255) PRIMARY KEY,
        req_deposit NUMERIC,
        req_turnover NUMERIC,
        reward_percentage NUMERIC,
        max_daily_withdraw NUMERIC
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(255),
        image TEXT,
        enabled BOOLEAN,
        rtp NUMERIC,
        house_edge NUMERIC,
        live_players INT,
        odds_multiplier NUMERIC
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(255),
        title VARCHAR(255),
        message TEXT,
        target VARCHAR(255),
        created_at VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        action TEXT,
        admin_user VARCHAR(255),
        ip_address VARCHAR(255),
        device_info TEXT,
        timestamp VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS global_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS website_images (
        filename VARCHAR(255) PRIMARY KEY,
        base64_image TEXT,
        asset_type VARCHAR(255),
        game_id VARCHAR(255),
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Media Manager Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS hero_images (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        image_url TEXT,
        display_order INT DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS game_icons (
        id VARCHAR(255) PRIMARY KEY,
        game_name VARCHAR(255),
        icon_url TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        image_url TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS logos (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        image_url TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create profiles table linked to auth.users
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        avatar TEXT,
        vip_level INT DEFAULT 1,
        status VARCHAR(255) DEFAULT 'active',
        role VARCHAR(255) DEFAULT 'user',
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(255) DEFAULT 'Super Admin',
        passcode VARCHAR(255) DEFAULT 'super777',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Drop the foreign key constraint that references auth.users(id) if it exists from earlier schemas
    await client.query(`
      ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    `).catch((err) => {
      console.warn("[Postgres Init] Failed or skipped dropping profiles_id_fkey constraint (this is usually fine):", err.message || err);
    });

    // Ensure older databases get any missing columns on profiles table
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;`).catch((err) => {
      console.error("[Postgres Init] Failed to add avatar column to profiles table:", err);
    });
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_level INT DEFAULT 1;`).catch((err) => {
      console.error("[Postgres Init] Failed to add vip_level column to profiles table:", err);
    });
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'active';`).catch((err) => {
      console.error("[Postgres Init] Failed to add status column to profiles table:", err);
    });
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'user';`).catch((err) => {
      console.error("[Postgres Init] Failed to add role column to profiles table:", err);
    });
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`).catch((err) => {
      console.error("[Postgres Init] Failed to add is_admin column to profiles table:", err);
    });
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`).catch((err) => {
      console.error("[Postgres Init] Failed to add created_at column to profiles table:", err);
    });

    // Create wallets table linked to profiles.id
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
        balance NUMERIC DEFAULT 0,
        bonus_balance NUMERIC DEFAULT 0,
        balance_version INT DEFAULT 0
      );
    `);

    // Enable Row Level Security (RLS) on tables
    await client.query(`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`).catch(() => {});
    await client.query(`ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;`).catch(() => {});
    await client.query(`ALTER TABLE admins ENABLE ROW LEVEL SECURITY;`).catch(() => {});

    // Create RLS Policies
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
          ) THEN
              CREATE POLICY "Users can view their own profile" ON profiles 
                  FOR SELECT USING (auth.uid() = id);
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
          ) THEN
              CREATE POLICY "Users can update their own profile" ON profiles 
                  FOR UPDATE USING (auth.uid() = id);
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
          ) THEN
              CREATE POLICY "Users can insert their own profile" ON profiles 
                  FOR INSERT WITH CHECK (auth.uid() = id);
          END IF;
      END
      $$;
    `).catch((err) => console.error("Error creating profiles policies:", err));

    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'wallets' AND policyname = 'Users can view their own wallet'
          ) THEN
              CREATE POLICY "Users can view their own wallet" ON wallets 
                  FOR SELECT USING (auth.uid() = id);
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'wallets' AND policyname = 'Users can update their own wallet'
          ) THEN
              CREATE POLICY "Users can update their own wallet" ON wallets 
                  FOR UPDATE USING (auth.uid() = id);
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'wallets' AND policyname = 'Users can insert their own wallet'
          ) THEN
              CREATE POLICY "Users can insert their own wallet" ON wallets 
                  FOR INSERT WITH CHECK (auth.uid() = id);
          END IF;
      END
      $$;
    `).catch((err) => console.error("Error creating wallets policies:", err));

    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'admins' AND policyname = 'Admins are viewable by other admins'
          ) THEN
              CREATE POLICY "Admins are viewable by other admins" ON admins 
                  FOR SELECT USING (
                      EXISTS (
                          SELECT 1 FROM profiles 
                          WHERE profiles.id = auth.uid() AND profiles.is_admin = true
                      )
                  );
          END IF;
      END
      $$;
    `).catch((err) => console.error("Error creating admins policies:", err));

    // Create trigger and function to automatically synchronize auth.users -> public.profiles and public.wallets
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $trigger$
        BEGIN
          INSERT INTO public.profiles (id, username, avatar, vip_level, status, role, is_admin)
          VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
            COALESCE(new.raw_user_meta_data->>'avatar', ''),
            1,
            'active',
            'user',
            false
          )
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO public.wallets (id, balance, bonus_balance, balance_version)
          VALUES (new.id, 0, 0, 0)
          ON CONFLICT (id) DO NOTHING;

          RETURN new;
        END;
        $trigger$ LANGUAGE plpgsql SECURITY DEFINER;
      `);

      await client.query(`
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `);
      console.log("[PostgreSQL] Trigger on_auth_user_created configured successfully.");
    } catch (triggerErr: any) {
      console.warn("[PostgreSQL] Skipping triggers setup (likely running on standard PostgreSQL role without Superuser/Event privileges):", triggerErr.message || triggerErr);
    }

    // Initialize default test player in Supabase Auth & Profiles
    try {
      const testEmail = "test@tenzobet.com";
      const userCheck = await client.query("SELECT id FROM auth.users WHERE email = $1", [testEmail]);
      if (userCheck.rows.length === 0) {
        console.log(`[PostgreSQL] Default test player ${testEmail} does not exist. Creating...`);
        const userId = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash("Test@123456", 10);
        const instanceId = "00000000-0000-0000-0000-000000000000";
        const aud = "authenticated";
        const role = "authenticated";
        const rawAppMetaData = JSON.stringify({ provider: "email", providers: ["email"] });
        const rawUserMetaData = JSON.stringify({ username: "TestPlayer" });

        // Query the schema of auth.users dynamically to see which columns are present and if they are generated
        const userColsCheck = await client.query(`
          SELECT column_name, is_generated 
          FROM information_schema.columns 
          WHERE table_schema = 'auth' AND table_name = 'users'
        `);
        const userCols = userColsCheck.rows;
        
        const insertColumns: string[] = [];
        const insertValues: string[] = [];
        const queryParams: any[] = [];
        let pIndex = 1;
        
        const addColumn = (colName: string, valueExpr: string, paramValue?: any) => {
          const colInfo = userCols.find(c => c.column_name === colName);
          if (colInfo && colInfo.is_generated !== 'ALWAYS') {
            insertColumns.push(colName);
            if (paramValue !== undefined) {
              insertValues.push(`$${pIndex}${valueExpr}`);
              queryParams.push(paramValue);
              pIndex++;
            } else {
              insertValues.push(valueExpr);
            }
          }
        };

        addColumn("id", "", userId);
        addColumn("instance_id", "", instanceId);
        addColumn("aud", "", aud);
        addColumn("role", "", role);
        addColumn("email", "", testEmail);
        addColumn("encrypted_password", "", hashedPassword);
        addColumn("email_confirmed_at", "NOW()");
        addColumn("raw_app_meta_data", "::jsonb", rawAppMetaData);
        addColumn("raw_user_meta_data", "::jsonb", rawUserMetaData);
        addColumn("created_at", "NOW()");
        addColumn("updated_at", "NOW()");
        addColumn("is_super_admin", "", false);
        addColumn("phone", "", null);
        addColumn("confirmed_at", "NOW()");

        await client.query(`
          INSERT INTO auth.users (${insertColumns.join(", ")})
          VALUES (${insertValues.join(", ")})
        `, queryParams);

        // Check auth.identities columns dynamically to support different GoTrue/Supabase versions
        const colCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'auth' AND table_name = 'identities'
        `);
        const idCols = colCheck.rows.map(r => r.column_name);
        const hasEmailCol = idCols.includes("email");
        const identityData = JSON.stringify({ sub: userId, email: testEmail });

        if (hasEmailCol) {
          await client.query(`
            INSERT INTO auth.identities (
              id,
              user_id,
              identity_data,
              provider,
              last_sign_in_at,
              created_at,
              updated_at,
              email
            ) VALUES ($1, $2, $3::jsonb, $4, NOW(), NOW(), NOW(), $5)
          `, [userId, userId, identityData, "email", testEmail]);
        } else {
          await client.query(`
            INSERT INTO auth.identities (
              id,
              user_id,
              identity_data,
              provider,
              last_sign_in_at,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3::jsonb, $4, NOW(), NOW(), NOW())
          `, [userId, userId, identityData, "email"]);
        }

        // Create profile row linked to auth.users
        await client.query(`
          INSERT INTO profiles (id, username, avatar, vip_level, status)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
        `, [userId, "TestPlayer", "", 1, "active"]);

        // Create wallet row for test user
        await client.query(`
          INSERT INTO wallets (id, balance, bonus_balance, balance_version)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING
        `, [userId, 10000, 0, 0]);

        console.log("Test user created successfully");
      }
    } catch (err: any) {
      console.error("[PostgreSQL] Error checking/creating default test user:", err.message || err);
    }

    // Seeding default admins table entries
    try {
      console.log("[PostgreSQL] Checking and seeding admins table...");
      await client.query(`
        INSERT INTO admins (id, username, role, passcode, is_active)
        VALUES 
          ('00000000-0000-0000-0000-000000000001', 'super_admin', 'Super Admin', 'super777', true),
          ('00000000-0000-0000-0000-000000000002', 'sub_admin', 'Sub Admin', 'sub555', true),
          ('00000000-0000-0000-0000-000000000003', 'support_agent', 'Support Agent', 'agent333', true)
        ON CONFLICT (username) DO NOTHING
      `);
      console.log("[PostgreSQL] Default admins table seeded successfully.");
    } catch (adminSeedErr: any) {
      console.error("[PostgreSQL] Error seeding admins table:", adminSeedErr.message || adminSeedErr);
    }

    // Ensure the user's admin account exists (email baruahb5000@gmail.com)
    try {
      const adminEmail = "baruahb5000@gmail.com";
      console.log(`[PostgreSQL] Verifying admin status for user: ${adminEmail}`);
      
      const adminUserCheck = await client.query("SELECT id FROM auth.users WHERE email = $1", [adminEmail]);
      let adminUserId = "";

      if (adminUserCheck.rows.length === 0) {
        console.log(`[PostgreSQL] Admin user ${adminEmail} does not exist. Creating...`);
        adminUserId = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash("super777", 10);
        const instanceId = "00000000-0000-0000-0000-000000000000";
        const aud = "authenticated";
        const role = "authenticated";
        const rawAppMetaData = JSON.stringify({ provider: "email", providers: ["email"] });
        const rawUserMetaData = JSON.stringify({ username: "baruahb5000" });

        // Query columns dynamically to insert safely
        const userColsCheck = await client.query(`
          SELECT column_name, is_generated 
          FROM information_schema.columns 
          WHERE table_schema = 'auth' AND table_name = 'users'
        `);
        const userCols = userColsCheck.rows;
        
        const insertColumns: string[] = [];
        const insertValues: string[] = [];
        const queryParams: any[] = [];
        let pIndex = 1;
        
        const addColumn = (colName: string, valueExpr: string, paramValue?: any) => {
          const colInfo = userCols.find(c => c.column_name === colName);
          if (colInfo && colInfo.is_generated !== 'ALWAYS') {
            insertColumns.push(colName);
            if (paramValue !== undefined) {
              insertValues.push(`$${pIndex}${valueExpr}`);
              queryParams.push(paramValue);
              pIndex++;
            } else {
              insertValues.push(valueExpr);
            }
          }
        };

        addColumn("id", "", adminUserId);
        addColumn("instance_id", "", instanceId);
        addColumn("aud", "", aud);
        addColumn("role", "", role);
        addColumn("email", "", adminEmail);
        addColumn("encrypted_password", "", hashedPassword);
        addColumn("email_confirmed_at", "NOW()");
        addColumn("raw_app_meta_data", "::jsonb", rawAppMetaData);
        addColumn("raw_user_meta_data", "::jsonb", rawUserMetaData);
        addColumn("created_at", "NOW()");
        addColumn("updated_at", "NOW()");
        addColumn("is_super_admin", "", true);
        addColumn("phone", "", null);
        addColumn("confirmed_at", "NOW()");

        await client.query(`
          INSERT INTO auth.users (${insertColumns.join(", ")})
          VALUES (${insertValues.join(", ")})
        `, queryParams);

        // Add identity
        const colCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'auth' AND table_name = 'identities'
        `);
        const idCols = colCheck.rows.map(r => r.column_name);
        const hasEmailCol = idCols.includes("email");
        const identityData = JSON.stringify({ sub: adminUserId, email: adminEmail });

        if (hasEmailCol) {
          await client.query(`
            INSERT INTO auth.identities (
              id,
              user_id,
              identity_data,
              provider,
              last_sign_in_at,
              created_at,
              updated_at,
              email
            ) VALUES ($1, $2, $3::jsonb, $4, NOW(), NOW(), NOW(), $5)
          `, [adminUserId, adminUserId, identityData, "email", adminEmail]);
        } else {
          await client.query(`
            INSERT INTO auth.identities (
              id,
              user_id,
              identity_data,
              provider,
              last_sign_in_at,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3::jsonb, $4, NOW(), NOW(), NOW())
          `, [adminUserId, adminUserId, identityData, "email"]);
        }

        // Create profiles record with role = 'Super Admin' and is_admin = true
        await client.query(`
          INSERT INTO profiles (id, username, avatar, vip_level, status, role, is_admin)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [adminUserId, "baruahb5000", "", 1, "active", "Super Admin", true]);

        // Create wallet row
        await client.query(`
          INSERT INTO wallets (id, balance, bonus_balance, balance_version)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING
        `, [adminUserId, 10000, 0, 0]);

        console.log(`Admin user ${adminEmail} registered successfully.`);
      } else {
        adminUserId = adminUserCheck.rows[0].id;
        console.log(`[PostgreSQL] User ${adminEmail} already exists. Ensuring they have Super Admin roles...`);
        
        // Ensure profile exists and is updated to Super Admin / is_admin = true
        await client.query(`
          INSERT INTO profiles (id, username, avatar, vip_level, status, role, is_admin)
          VALUES ($1, 'baruahb5000', '', 1, 'active', 'Super Admin', true)
          ON CONFLICT (id) DO UPDATE SET role = 'Super Admin', is_admin = true;
        `, [adminUserId]);

        // Ensure wallet exists
        await client.query(`
          INSERT INTO wallets (id, balance, bonus_balance, balance_version)
          VALUES ($1, 10000, 0, 0)
          ON CONFLICT (id) DO NOTHING;
        `, [adminUserId]);
      }

      // Ensure they have a record in the admins table as well so they can log in via username/passcode
      await client.query(`
        INSERT INTO admins (id, username, role, passcode, is_active)
        VALUES ($1, 'baruahb5000', 'Super Admin', 'super777', true)
        ON CONFLICT (username) DO UPDATE SET role = 'Super Admin', passcode = 'super777', is_active = true
      `, [adminUserId]);

      console.log(`[PostgreSQL] Admin credentials for baruahb5000 verified in admins table.`);
    } catch (err: any) {
      console.error("[PostgreSQL] Error configuring admin account for baruahb5000@gmail.com:", err.message || err);
    }

    console.log("[PostgreSQL] Tables checked & verified. Checking seed data...");

    // Seeding if tables are empty
    const usersCountRes = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(usersCountRes.rows[0].count) === 0 && fallbackDbState?.users?.length > 0) {
      console.log("[PostgreSQL] Users table is empty. Performing automatic seed...");
      for (const u of fallbackDbState.users) {
        await client.query(
          `INSERT INTO users (id, user_id, full_name, username, email, phone, avatar, security_id, balance, bonus_balance, referral_code, referred_by, vip_level, status, kyc_status, created_at, balance_version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) ON CONFLICT (id) DO NOTHING`,
          [u.id, u.user_id, u.full_name, u.username, u.email, u.phone, u.avatar || "", u.security_id || "", u.balance || 0, u.bonus_balance || 0, u.referral_code || "", u.referred_by || null, u.vip_level || "Bronze", u.status || "Active", u.kyc_status || "Unverified", u.created_at || new Date().toISOString(), u.balance_version || 0]
        );
      }
    }

    const depositsCountRes = await client.query("SELECT COUNT(*) FROM deposits");
    if (parseInt(depositsCountRes.rows[0].count) === 0 && fallbackDbState?.deposits?.length > 0) {
      console.log("[PostgreSQL] Deposits table is empty. Seeding...");
      for (const d of fallbackDbState.deposits) {
        await client.query(
          `INSERT INTO deposits (deposit_id, user_id, amount, payment_method, utr_number, screenshot, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (deposit_id) DO NOTHING`,
          [d.deposit_id, d.user_id, d.amount, d.payment_method, d.utr_number, d.screenshot || "", d.status, d.created_at]
        );
      }
    }

    const withdrawalsCountRes = await client.query("SELECT COUNT(*) FROM withdrawals");
    if (parseInt(withdrawalsCountRes.rows[0].count) === 0 && fallbackDbState?.withdrawals?.length > 0) {
      console.log("[PostgreSQL] Withdrawals table is empty. Seeding...");
      for (const w of fallbackDbState.withdrawals) {
        await client.query(
          `INSERT INTO withdrawals (withdrawal_id, user_id, amount, bank_name, account_number, ifsc_code, upi_id, status, remarks, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (withdrawal_id) DO NOTHING`,
          [w.withdrawal_id, w.user_id, w.amount, w.bank_name || "", w.account_number || "", w.ifsc_code || "", w.upi_id || "", w.status, w.remarks || "", w.created_at]
        );
      }
    }

    const referralsCountRes = await client.query("SELECT COUNT(*) FROM referrals");
    if (parseInt(referralsCountRes.rows[0].count) === 0 && fallbackDbState?.referrals?.length > 0) {
      console.log("[PostgreSQL] Referrals table is empty. Seeding...");
      for (const r of fallbackDbState.referrals) {
        await client.query(
          `INSERT INTO referrals (referral_id, referrer_user_id, referred_user_id, commission, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (referral_id) DO NOTHING`,
          [r.referral_id, r.referrer_user_id, r.referred_user_id, r.commission, r.status, r.created_at]
        );
      }
    }

    const vipCountRes = await client.query("SELECT COUNT(*) FROM vip_levels_config");
    if (parseInt(vipCountRes.rows[0].count) === 0 && fallbackDbState?.vip_levels_config?.length > 0) {
      console.log("[PostgreSQL] VIP config is empty. Seeding...");
      for (const v of fallbackDbState.vip_levels_config) {
        await client.query(
          `INSERT INTO vip_levels_config (level, req_deposit, req_turnover, reward_percentage, max_daily_withdraw)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (level) DO NOTHING`,
          [v.level, v.req_deposit, v.req_turnover, v.reward_percentage, v.max_daily_withdraw]
        );
      }
    }

    const gamesCountRes = await client.query("SELECT COUNT(*) FROM games");
    if (parseInt(gamesCountRes.rows[0].count) === 0 && fallbackDbState?.games?.length > 0) {
      console.log("[PostgreSQL] Games config is empty. Seeding...");
      for (const g of fallbackDbState.games) {
        await client.query(
          `INSERT INTO games (id, name, category, image, enabled, rtp, house_edge, live_players, odds_multiplier)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
          [g.id, g.name, g.category, g.image || "", g.enabled, g.rtp, g.house_edge, g.live_players, g.odds_multiplier]
        );
      }
    }

    const notificationsCountRes = await client.query("SELECT COUNT(*) FROM notifications");
    if (parseInt(notificationsCountRes.rows[0].count) === 0 && fallbackDbState?.notifications?.length > 0) {
      console.log("[PostgreSQL] Notifications table is empty. Seeding...");
      for (const n of fallbackDbState.notifications) {
        await client.query(
          `INSERT INTO notifications (id, type, title, message, target, created_at)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [n.id, n.type, n.title, n.message, n.target, n.created_at]
        );
      }
    }

    const logsCountRes = await client.query("SELECT COUNT(*) FROM audit_logs");
    if (parseInt(logsCountRes.rows[0].count) === 0 && fallbackDbState?.audit_logs?.length > 0) {
      console.log("[PostgreSQL] Audit logs table is empty. Seeding...");
      for (const l of fallbackDbState.audit_logs) {
        await client.query(
          `INSERT INTO audit_logs (id, action, admin_user, ip_address, device_info, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [l.id, l.action, l.admin_user, l.ip_address, l.device_info, l.timestamp]
        );
      }
    }

    const settingsCountRes = await client.query("SELECT COUNT(*) FROM global_settings");
    if (parseInt(settingsCountRes.rows[0].count) === 0 && fallbackDbState?.global_settings) {
      console.log("[PostgreSQL] Global settings are empty. Seeding...");
      const settings = fallbackDbState.global_settings;
      for (const key of Object.keys(settings)) {
        await client.query(
          `INSERT INTO global_settings (key, value)
           VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
          [key, JSON.stringify(settings[key])]
        );
      }
    }

    // Clear and delete all hero section images and config from database as requested by the user
    console.log("[PostgreSQL] Cleaning and deleting all hero section images and settings...");
    await client.query("DELETE FROM hero_images;");
    await client.query("DELETE FROM website_images WHERE asset_type = 'hero' OR filename LIKE 'asset_hero%';");
    await client.query(`
      INSERT INTO global_settings (key, value)
      VALUES ('hero_poster_url', '""')
      ON CONFLICT (key) DO UPDATE SET value = '""'
    `);
    await client.query(`
      INSERT INTO global_settings (key, value)
      VALUES ('hero_heading', '""')
      ON CONFLICT (key) DO UPDATE SET value = '""'
    `);
    await client.query(`
      INSERT INTO global_settings (key, value)
      VALUES ('hero_subheading', '""')
      ON CONFLICT (key) DO UPDATE SET value = '""'
    `);

    client.release();
    console.log("[PostgreSQL] Schema seed synchronization complete.");
  } catch (err: any) {
    console.error(`[PostgreSQL] FATAL: Schema setup or initialization failed: ${err.message || err}`);
    isPostgresActive = false;
    hasConnectionFailed = true;
    if (pool) {
      pool.end().catch(() => {});
      pool = null;
    }
    throw err;
  }
}

// In-memory cache for loadStateFromPostgres
let cachedDbState: any = null;
let lastDbStateFetchTime = 0;
const CACHE_TTL_MS = 2500; // Cache database state for 2.5 seconds to handle high-frequency polling/concurrency

export function invalidatePostgresCache() {
  cachedDbState = null;
  lastDbStateFetchTime = 0;
}

// Fetch complete state from PostgreSQL
export async function loadStateFromPostgres(force: boolean = false): Promise<any> {
  const activePool = getPool();
  if (!activePool || !isPostgresActive) return null;

  if (!force && cachedDbState && (Date.now() - lastDbStateFetchTime < CACHE_TTL_MS)) {
    return cachedDbState;
  }

  try {
    // Run the Supabase-specific query with an individual catch block so it doesn't fail the whole Promise.all
    const sbUsersPromise = activePool.query(`
      SELECT 
        p.id,
        p.username,
        p.avatar,
        p.vip_level,
        p.status,
        p.created_at,
        w.balance,
        w.bonus_balance,
        w.balance_version,
        au.email
      FROM profiles p
      LEFT JOIN wallets w ON p.id = w.id
      LEFT JOIN auth.users au ON p.id = au.id
      ORDER BY p.created_at DESC
    `).catch(e => {
      console.error("[Postgres Load] Failed to load from profiles/wallets/auth.users:", e);
      return { rows: [] };
    });

    const [
      users,
      deposits,
      withdrawals,
      referrals,
      vip,
      games,
      notifications,
      auditLogs,
      settingsRows,
      heroImages,
      gameIcons,
      bannersRes,
      logosRes,
      sbUsersRes
    ] = await Promise.all([
      activePool.query("SELECT * FROM users ORDER BY created_at DESC"),
      activePool.query("SELECT * FROM deposits ORDER BY created_at DESC"),
      activePool.query("SELECT * FROM withdrawals ORDER BY created_at DESC"),
      activePool.query("SELECT * FROM referrals ORDER BY created_at DESC"),
      activePool.query("SELECT * FROM vip_levels_config ORDER BY req_deposit ASC"),
      activePool.query("SELECT * FROM games ORDER BY id ASC"),
      activePool.query("SELECT * FROM notifications ORDER BY created_at DESC"),
      activePool.query("SELECT * FROM audit_logs ORDER BY timestamp DESC"),
      activePool.query("SELECT * FROM global_settings"),
      activePool.query("SELECT * FROM hero_images ORDER BY display_order ASC, created_at DESC"),
      activePool.query("SELECT * FROM game_icons ORDER BY created_at DESC"),
      activePool.query("SELECT * FROM banners ORDER BY created_at DESC"),
      activePool.query("SELECT * FROM logos ORDER BY created_at DESC"),
      sbUsersPromise
    ]);

    const supabaseUsers = (sbUsersRes.rows || []).map(row => ({
      id: row.id,
      user_id: row.id,
      full_name: row.username,
      username: row.username,
      email: row.email || `${row.username}@example.com`,
      phone: '',
      avatar: row.avatar || '',
      security_id: '',
      balance: parseFloat(row.balance || 0),
      bonus_balance: parseFloat(row.bonus_balance || 0),
      referral_code: 'TENZO_ROYAL_77',
      referred_by: '',
      vip_level: String(row.vip_level || 1),
      status: row.status === 'active' ? 'Active' : (row.status || 'Active'),
      kyc_status: 'Approved',
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      balance_version: parseInt(row.balance_version || 0)
    }));

    const globalSettings: Record<string, any> = {};
    settingsRows.rows.forEach(row => {
      try {
        globalSettings[row.key] = JSON.parse(row.value);
      } catch (e) {
        globalSettings[row.key] = row.value;
      }
    });

    // Map numerical values properly
    const dbMappedUsers = users.rows.map(u => ({
      ...u,
      balance: parseFloat(u.balance || 0),
      bonus_balance: parseFloat(u.bonus_balance || 0),
      balance_version: parseInt(u.balance_version || 0)
    }));

    // Merge: any user from supabaseUsers override or add
    const finalUsersMap = new Map<string, any>();
    dbMappedUsers.forEach(u => {
      if (u.id) finalUsersMap.set(u.id, u);
    });
    supabaseUsers.forEach(u => {
      if (u.id) finalUsersMap.set(u.id, u);
    });
    const mappedUsers = Array.from(finalUsersMap.values());

    const mappedDeposits = deposits.rows.map(d => ({
      ...d,
      amount: parseFloat(d.amount || 0)
    }));

    const mappedWithdrawals = withdrawals.rows.map(w => ({
      ...w,
      amount: parseFloat(w.amount || 0)
    }));

    const mappedReferrals = referrals.rows.map(r => ({
      ...r,
      commission: parseFloat(r.commission || 0)
    }));

    const mappedVip = vip.rows.map(v => ({
      ...v,
      req_deposit: parseFloat(v.req_deposit || 0),
      req_turnover: parseFloat(v.req_turnover || 0),
      reward_percentage: parseFloat(v.reward_percentage || 0),
      max_daily_withdraw: parseFloat(v.max_daily_withdraw || 0)
    }));

    const mappedGames = games.rows.map(g => ({
      ...g,
      rtp: parseFloat(g.rtp || 0),
      house_edge: parseFloat(g.house_edge || 0),
      live_players: parseInt(g.live_players || 0),
      odds_multiplier: parseFloat(g.odds_multiplier || 0)
    }));

    const result = {
      users: mappedUsers,
      deposits: mappedDeposits,
      withdrawals: mappedWithdrawals,
      referrals: mappedReferrals,
      vip_levels_config: mappedVip,
      games: mappedGames,
      notifications: notifications.rows,
      audit_logs: auditLogs.rows,
      global_settings: globalSettings,
      hero_images: heroImages.rows,
      game_icons: gameIcons.rows,
      banners: bannersRes.rows,
      logos: logosRes.rows
    };

    cachedDbState = result;
    lastDbStateFetchTime = Date.now();

    return result;
  } catch (err) {
    console.error("[PostgreSQL] Error loading state:", err);
    hasConnectionFailed = true;
    isPostgresActive = false;
    return null;
  }
}

// Synchronize state to PostgreSQL
export async function saveStateToPostgres(state: any): Promise<boolean> {
  const activePool = getPool();
  if (!activePool || !isPostgresActive) return false;

  try {
    const client = await activePool.connect();
    
    // Perform bulk updates/upserts
    await client.query("BEGIN");

    // 1. Users
    if (state.users) {
      for (const u of state.users) {
        await client.query(
          `INSERT INTO users (id, user_id, full_name, username, email, phone, avatar, security_id, balance, bonus_balance, referral_code, referred_by, vip_level, status, kyc_status, created_at, balance_version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO UPDATE SET
             user_id = EXCLUDED.user_id,
             full_name = EXCLUDED.full_name,
             username = EXCLUDED.username,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             avatar = EXCLUDED.avatar,
             security_id = EXCLUDED.security_id,
             balance = EXCLUDED.balance,
             bonus_balance = EXCLUDED.bonus_balance,
             referral_code = EXCLUDED.referral_code,
             referred_by = EXCLUDED.referred_by,
             vip_level = EXCLUDED.vip_level,
             status = EXCLUDED.status,
             kyc_status = EXCLUDED.kyc_status,
             balance_version = EXCLUDED.balance_version`,
          [u.id, u.user_id, u.full_name, u.username, u.email, u.phone, u.avatar || "", u.security_id || "", u.balance || 0, u.bonus_balance || 0, u.referral_code || "", u.referred_by || null, u.vip_level || "Bronze", u.status || "Active", u.kyc_status || "Unverified", u.created_at || new Date().toISOString(), u.balance_version || 0]
        );

        // Also sync to profiles and wallets tables if user ID is a valid UUID
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (u.id && uuidRegex.test(u.id)) {
          const numericVip = u.vip_level === "Diamond" ? 5 : u.vip_level === "Platinum" ? 4 : u.vip_level === "Gold" ? 3 : u.vip_level === "Silver" ? 2 : 1;
          const lowerStatus = (u.status || "Active").toLowerCase();
          
          await client.query(
            `INSERT INTO profiles (id, username, avatar, vip_level, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
               username = EXCLUDED.username,
               avatar = EXCLUDED.avatar,
               vip_level = EXCLUDED.vip_level,
               status = EXCLUDED.status`,
            [u.id, u.username, u.avatar || "", numericVip, lowerStatus]
          );

          await client.query(
            `INSERT INTO wallets (id, balance, bonus_balance, balance_version)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET
               balance = EXCLUDED.balance,
               bonus_balance = EXCLUDED.bonus_balance,
               balance_version = EXCLUDED.balance_version`,
            [u.id, u.balance || 0, u.bonus_balance || 0, u.balance_version || 0]
          );
        }
      }
    }

    // 2. Deposits
    if (state.deposits) {
      for (const d of state.deposits) {
        await client.query(
          `INSERT INTO deposits (deposit_id, user_id, amount, payment_method, utr_number, screenshot, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (deposit_id) DO UPDATE SET
             status = EXCLUDED.status,
             utr_number = EXCLUDED.utr_number,
             screenshot = EXCLUDED.screenshot`,
          [d.deposit_id, d.user_id, d.amount, d.payment_method, d.utr_number, d.screenshot || "", d.status, d.created_at]
        );
      }
    }

    // 3. Withdrawals
    if (state.withdrawals) {
      for (const w of state.withdrawals) {
        await client.query(
          `INSERT INTO withdrawals (withdrawal_id, user_id, amount, bank_name, account_number, ifsc_code, upi_id, status, remarks, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (withdrawal_id) DO UPDATE SET
             status = EXCLUDED.status,
             remarks = EXCLUDED.remarks`,
          [w.withdrawal_id, w.user_id, w.amount, w.bank_name || "", w.account_number || "", w.ifsc_code || "", w.upi_id || "", w.status, w.remarks || "", w.created_at]
        );
      }
    }

    // 4. Referrals
    if (state.referrals) {
      for (const r of state.referrals) {
        await client.query(
          `INSERT INTO referrals (referral_id, referrer_user_id, referred_user_id, commission, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (referral_id) DO UPDATE SET
             status = EXCLUDED.status`,
          [r.referral_id, r.referrer_user_id, r.referred_user_id, r.commission, r.status, r.created_at]
        );
      }
    }

    // 5. VIP configurations
    if (state.vip_levels_config) {
      for (const v of state.vip_levels_config) {
        await client.query(
          `INSERT INTO vip_levels_config (level, req_deposit, req_turnover, reward_percentage, max_daily_withdraw)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (level) DO UPDATE SET
             req_deposit = EXCLUDED.req_deposit,
             req_turnover = EXCLUDED.req_turnover,
             reward_percentage = EXCLUDED.reward_percentage,
             max_daily_withdraw = EXCLUDED.max_daily_withdraw`,
          [v.level, v.req_deposit, v.req_turnover, v.reward_percentage, v.max_daily_withdraw]
        );
      }
    }

    // 6. Games
    if (state.games) {
      for (const g of state.games) {
        await client.query(
          `INSERT INTO games (id, name, category, image, enabled, rtp, house_edge, live_players, odds_multiplier)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             enabled = EXCLUDED.enabled,
             rtp = EXCLUDED.rtp,
             house_edge = EXCLUDED.house_edge,
             live_players = EXCLUDED.live_players,
             odds_multiplier = EXCLUDED.odds_multiplier,
             image = EXCLUDED.image`,
          [g.id, g.name, g.category, g.image || "", g.enabled, g.rtp, g.house_edge, g.live_players, g.odds_multiplier]
        );
      }
    }

    // 7. Notifications
    if (state.notifications) {
      for (const n of state.notifications) {
        await client.query(
          `INSERT INTO notifications (id, type, title, message, target, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [n.id, n.type, n.title, n.message, n.target, n.created_at]
        );
      }
    }

    // 8. Audit logs
    if (state.audit_logs) {
      for (const l of state.audit_logs) {
        await client.query(
          `INSERT INTO audit_logs (id, action, admin_user, ip_address, device_info, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [l.id, l.action, l.admin_user, l.ip_address, l.device_info, l.timestamp]
        );
      }
    }

    // 9. Global settings
    if (state.global_settings) {
      const settings = state.global_settings;
      for (const key of Object.keys(settings)) {
        await client.query(
          `INSERT INTO global_settings (key, value)
           VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, JSON.stringify(settings[key])]
        );
      }
    }

    await client.query("COMMIT");
    client.release();
    return true;
  } catch (err) {
    console.error("[PostgreSQL] Commit transaction failed:", err);
    hasConnectionFailed = true;
    isPostgresActive = false;
    await activePool.query("ROLLBACK").catch(() => {});
    return false;
  }
}

// Check if PostgreSQL connection has failed in previous attempts
export function isPgConnectionFailed(): boolean {
  return hasConnectionFailed;
}

// Explicit on-demand check of the PostgreSQL/Supabase database connection
export async function testConnectionOnDemand(): Promise<{ success: boolean; error?: string }> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { success: false, error: "No DATABASE_URL environment variable is configured in the environment." };
  }

  // Create a temporary pool to test the connection independently
  const testPool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const client = await testPool.connect();
    await client.query("SELECT 1");
    client.release();
    await testPool.end();
    
    // On success, reset the global failed flag so the application can try using it again
    hasConnectionFailed = false;
    isPostgresActive = true;
    return { success: true };
  } catch (err: any) {
    hasConnectionFailed = true;
    isPostgresActive = false;
    await testPool.end().catch(() => {});
    return { success: false, error: err.message || String(err) };
  }
}

// Reset the connection pool and failed flag to force a fresh initialization attempt
export function resetConnectionPoolState(): { success: boolean; message: string } {
  hasConnectionFailed = false;
  isPostgresActive = false;
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
  return { success: true, message: "Database connection pool state reset successfully. Ready for fresh connection attempt." };
}


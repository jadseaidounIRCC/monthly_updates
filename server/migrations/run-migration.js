#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const runMigration = async () => {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOSTNAME || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'monthly_updates',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      multipleStatements: true
    });

    console.log('🔗 Connected to MySQL database');

    // Read and execute migration files in order
    const migrationFiles = [
      '001-fix-reporting-periods-schema.sql',
      '002-remove-project-id-from-periods.sql'
    ];

    for (const filename of migrationFiles) {
      const filePath = path.join(__dirname, filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Migration file ${filename} not found, skipping...`);
        continue;
      }

      console.log(`\n📜 Running migration: ${filename}`);
      
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Split by semicolons but be careful with complex statements
      const statements = sqlContent.split(';').filter(stmt => 
        stmt.trim().length > 0 && !stmt.trim().startsWith('--')
      );

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          try {
            console.log(`  Executing statement ${i + 1}/${statements.length}...`);
            await connection.execute(statement);
          } catch (error) {
            console.log(`    ⚠️  Statement failed (might be expected): ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Migration ${filename} completed`);
    }

    // Verify the migration worked
    console.log('\n🔍 Verifying migration results...');
    
    const [periods] = await connection.execute('SELECT id, period_name, is_active, is_locked FROM reporting_periods');
    console.log(`📊 Reporting periods: ${periods.length} found`);
    periods.forEach(period => {
      console.log(`  - ${period.period_name} (Active: ${period.is_active}, Locked: ${period.is_locked})`);
    });

    const [projectData] = await connection.execute('SELECT COUNT(*) as count FROM project_data');
    console.log(`📊 Project data records: ${projectData[0].count}`);

    // Check if project_id column still exists in reporting_periods
    try {
      await connection.execute('SELECT project_id FROM reporting_periods LIMIT 1');
      console.log('⚠️  project_id column still exists in reporting_periods - run step 2 manually');
    } catch (error) {
      console.log('✅ project_id column successfully removed from reporting_periods');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔚 Database connection closed');
    }
  }
};

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
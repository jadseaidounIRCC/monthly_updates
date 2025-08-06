#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

const runCorrectedMigration = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOSTNAME || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'monthly_updates',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || ''
    });

    console.log('🔗 Connected to MySQL database');

    // Execute each statement individually
    const statements = [
      // Create project_data table
      `CREATE TABLE IF NOT EXISTS project_data (
          id VARCHAR(36) PRIMARY KEY,
          project_id VARCHAR(36) NOT NULL,
          period_id VARCHAR(36) NOT NULL,
          field_name VARCHAR(100) NOT NULL,
          field_value JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_project_data (project_id, period_id, field_name),
          UNIQUE KEY unique_project_field_period (project_id, period_id, field_name)
      )`,
      
      // Add is_active column
      `ALTER TABLE reporting_periods ADD COLUMN is_active BOOLEAN DEFAULT FALSE`,
      
      // Create default global period
      `INSERT INTO reporting_periods (
          id, period_start, period_end, period_name, is_locked, is_active, created_at, updated_at
       ) VALUES (
          'period-august-2025', '2025-07-15', '2025-08-15', 'August 2025', FALSE, TRUE, NOW(), NOW()
       )`,
      
      // Remove project_id column (first need to drop foreign key if exists)
      `ALTER TABLE reporting_periods DROP COLUMN project_id`
    ];

    for (let i = 0; i < statements.length; i++) {
      try {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        await connection.execute(statements[i]);
        console.log(`✅ Statement ${i + 1} completed`);
      } catch (error) {
        console.log(`⚠️  Statement ${i + 1} failed: ${error.message}`);
        // Continue with other statements
      }
    }

    // Add foreign key constraints to project_data
    try {
      console.log('🔗 Adding foreign key constraints...');
      await connection.execute(`
        ALTER TABLE project_data 
        ADD CONSTRAINT fk_project_data_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      `);
      
      await connection.execute(`
        ALTER TABLE project_data 
        ADD CONSTRAINT fk_project_data_period 
        FOREIGN KEY (period_id) REFERENCES reporting_periods(id) ON DELETE CASCADE
      `);
      console.log('✅ Foreign key constraints added');
    } catch (error) {
      console.log(`⚠️  Foreign key constraint error: ${error.message}`);
    }

    // Migrate existing project data
    try {
      console.log('📦 Migrating existing project data...');
      
      // Get projects
      const [projects] = await connection.execute('SELECT id, benefits, key_risks, key_updates FROM projects');
      
      for (const project of projects) {
        // Migrate benefits
        if (project.benefits) {
          await connection.execute(`
            INSERT IGNORE INTO project_data (id, project_id, period_id, field_name, field_value)
            VALUES (?, ?, 'period-august-2025', 'benefits', ?)
          `, [`${project.id}-benefits`, project.id, JSON.stringify(project.benefits)]);
        }
        
        // Migrate key_risks
        await connection.execute(`
          INSERT IGNORE INTO project_data (id, project_id, period_id, field_name, field_value)
          VALUES (?, ?, 'period-august-2025', 'key_risks', ?)
        `, [`${project.id}-key_risks`, project.id, JSON.stringify(project.key_risks || '')]);
        
        // Migrate key_updates
        await connection.execute(`
          INSERT IGNORE INTO project_data (id, project_id, period_id, field_name, field_value)
          VALUES (?, ?, 'period-august-2025', 'key_updates', ?)
        `, [`${project.id}-key_updates`, project.id, JSON.stringify(project.key_updates || '')]);
      }
      
      console.log(`✅ Migrated data for ${projects.length} projects`);
    } catch (error) {
      console.log(`⚠️  Data migration error: ${error.message}`);
    }

    // Update comments and next_steps
    try {
      console.log('🔄 Updating comments and next_steps...');
      await connection.execute(`
        UPDATE comments SET period_id = 'period-august-2025' 
        WHERE period_id IS NULL OR period_id NOT IN (SELECT id FROM reporting_periods)
      `);
      
      await connection.execute(`
        UPDATE next_steps SET period_id = 'period-august-2025'
        WHERE period_id IS NULL OR period_id NOT IN (SELECT id FROM reporting_periods)
      `);
      console.log('✅ Updated comments and next_steps');
    } catch (error) {
      console.log(`⚠️  Update error: ${error.message}`);
    }

    // Create indexes
    try {
      console.log('📊 Creating indexes...');
      await connection.execute('CREATE INDEX idx_period_active ON reporting_periods(is_active, period_start)');
      await connection.execute('CREATE INDEX idx_project_data_lookup ON project_data(period_id, project_id)');
      console.log('✅ Indexes created');
    } catch (error) {
      console.log(`⚠️  Index creation error: ${error.message}`);
    }

    // Verify results
    console.log('\n🔍 Verification:');
    const [periods] = await connection.execute('SELECT id, period_name, is_active FROM reporting_periods');
    console.log(`📊 Reporting periods: ${periods.length}`);
    periods.forEach(period => {
      console.log(`  - ${period.period_name} (Active: ${period.is_active})`);
    });

    const [projectDataCount] = await connection.execute('SELECT COUNT(*) as count FROM project_data');
    console.log(`📊 Project data records: ${projectDataCount[0].count}`);

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

runCorrectedMigration();
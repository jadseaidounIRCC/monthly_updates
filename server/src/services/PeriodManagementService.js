const { ReportingPeriod, Project, ProjectData } = require('../models');
const logger = require('../config/logger');

class PeriodManagementService {
  
  /**
   * Calculate the next reporting period dates based on current active period
   */
  static async calculateNextPeriod() {
    try {
      // Get current active period
      const currentPeriod = await ReportingPeriod.findOne({ 
        where: { isActive: true },
        order: [['period_end', 'DESC']]
      });

      let nextStartDate, nextEndDate;

      if (currentPeriod) {
        // Next period starts when current ends
        nextStartDate = new Date(currentPeriod.periodEnd);
        nextEndDate = new Date(nextStartDate);
        nextEndDate.setMonth(nextEndDate.getMonth() + 1);
      } else {
        // No current period - create first one based on 15th cycle
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();

        if (currentDay >= 15) {
          // After 15th - period is this month's 15th to next month's 15th
          nextStartDate = new Date(currentYear, currentMonth, 15);
          nextEndDate = new Date(currentYear, currentMonth + 1, 15);
        } else {
          // Before 15th - period is last month's 15th to this month's 15th
          nextStartDate = new Date(currentYear, currentMonth - 1, 15);
          nextEndDate = new Date(currentYear, currentMonth, 15);
        }
      }

      // Generate period name
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const periodName = `${monthNames[nextEndDate.getMonth()]} ${nextEndDate.getFullYear()}`;

      return {
        startDate: nextStartDate.toISOString().split('T')[0],
        endDate: nextEndDate.toISOString().split('T')[0],
        name: periodName
      };

    } catch (error) {
      logger.error('Error calculating next period:', error);
      throw error;
    }
  }

  /**
   * Create a new reporting period and copy all projects to it
   */
  static async createNewPeriod(userId = null, req = null) {
    const sequelize = require('../config/database').sequelize();
    const transaction = await sequelize.transaction();

    try {
      // Calculate next period
      const nextPeriod = await this.calculateNextPeriod();
      logger.info('Creating new period:', nextPeriod);

      // Check if period already exists
      const existingPeriod = await ReportingPeriod.findOne({
        where: {
          periodStart: nextPeriod.startDate,
          periodEnd: nextPeriod.endDate
        }
      });

      if (existingPeriod) {
        throw new Error(`Period ${nextPeriod.name} already exists`);
      }

      // 1. Lock all current active periods
      const lockedCount = await ReportingPeriod.update(
        { 
          isActive: false, 
          isLocked: true, 
          lockedAt: new Date() 
        },
        { 
          where: { isActive: true },
          transaction
        }
      );

      logger.info(`Locked ${lockedCount[0]} previous periods`);

      // 2. Create new reporting period
      const newPeriod = await ReportingPeriod.create({
        id: `period-${nextPeriod.name.toLowerCase().replace(' ', '-')}`,
        periodStart: nextPeriod.startDate,
        periodEnd: nextPeriod.endDate,
        periodName: nextPeriod.name,
        isActive: true,
        isLocked: false
      }, { transaction });

      logger.info(`Created new period: ${newPeriod.periodName}`);

      // 3. Get all projects
      const projects = await Project.findAll();
      logger.info(`Found ${projects.length} projects to copy`);

      // 4. Copy all project data to new period
      let copiedDataCount = 0;
      const fieldsToCopy = ['benefits', 'key_risks', 'key_updates', 'description'];

      for (const project of projects) {
        for (const fieldName of fieldsToCopy) {
          let fieldValue;
          
          // Get field value from project
          switch (fieldName) {
            case 'benefits':
              fieldValue = project.benefits || {};
              break;
            case 'key_risks':
              fieldValue = project.keyRisks || '';
              break;
            case 'key_updates':
              fieldValue = project.keyUpdates || '';
              break;
            case 'description':
              fieldValue = project.description || '';
              break;
          }

          // Create project data record
          await ProjectData.create({
            id: `${project.id}-${newPeriod.id}-${fieldName}`,
            projectId: project.id,
            periodId: newPeriod.id,
            fieldName: fieldName,
            fieldValue: typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
          }, { transaction });

          copiedDataCount++;
        }
      }

      await transaction.commit();

      const result = {
        newPeriod: {
          id: newPeriod.id,
          name: newPeriod.periodName,
          startDate: newPeriod.periodStart,
          endDate: newPeriod.periodEnd,
          isActive: newPeriod.isActive
        },
        copiedProjectsCount: projects.length,
        copiedDataRecordsCount: copiedDataCount,
        lockedPreviousPeriodsCount: lockedCount[0]
      };

      logger.info('Period creation completed:', result);
      return result;

    } catch (error) {
      await transaction.rollback();
      logger.error('Period creation failed:', error);
      throw error;
    }
  }

  /**
   * Get current active period
   */
  static async getCurrentPeriod() {
    return await ReportingPeriod.findOne({
      where: { isActive: true },
      order: [['period_start', 'DESC']]
    });
  }

  /**
   * Get all periods in descending order
   */
  static async getAllPeriods() {
    return await ReportingPeriod.findAll({
      order: [['period_start', 'DESC']]
    });
  }

  /**
   * Get projects for a specific period
   */
  static async getProjectsForPeriod(periodId) {
    const projects = await Project.findAll();
    const projectsWithData = [];

    for (const project of projects) {
      const projectData = await ProjectData.findAll({
        where: { 
          projectId: project.id, 
          periodId: periodId 
        }
      });

      // Transform project data back to project format
      const projectWithPeriodData = {
        ...project.toJSON(),
        periodId: periodId
      };

      // Apply period-specific data
      for (const data of projectData) {
        switch (data.fieldName) {
          case 'benefits':
            projectWithPeriodData.benefits = typeof data.fieldValue === 'string' 
              ? JSON.parse(data.fieldValue) 
              : data.fieldValue;
            break;
          case 'key_risks':
            projectWithPeriodData.keyRisks = typeof data.fieldValue === 'string' 
              ? JSON.parse(data.fieldValue) 
              : data.fieldValue;
            break;
          case 'key_updates':
            projectWithPeriodData.keyUpdates = typeof data.fieldValue === 'string' 
              ? JSON.parse(data.fieldValue) 
              : data.fieldValue;
            break;
          case 'description':
            projectWithPeriodData.description = typeof data.fieldValue === 'string' 
              ? JSON.parse(data.fieldValue) 
              : data.fieldValue;
            break;
        }
      }

      projectsWithData.push(projectWithPeriodData);
    }

    return projectsWithData;
  }
}

module.exports = PeriodManagementService;
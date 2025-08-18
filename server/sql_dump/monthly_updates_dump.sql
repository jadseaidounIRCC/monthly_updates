-- MySQL dump 10.13  Distrib 9.2.0, for macos14.7 (arm64)
--
-- Host: localhost    Database: monthly_updates
-- ------------------------------------------------------
-- Server version	9.1.0-commercial

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique comment identifier',
  `project_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_reference` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Field reference (e.g., description, benefits.fteSavings, nextSteps.{stepId})',
  `parent_comment_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `author_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Comment author name',
  `author_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Comment content',
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether the comment thread is resolved',
  `resolved_at` datetime DEFAULT NULL COMMENT 'Timestamp when comment was resolved',
  `resolved_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Name of person who resolved the comment',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_field_comments` (`project_id`,`period_id`,`field_reference`),
  KEY `idx_comment_thread` (`parent_comment_id`),
  KEY `idx_author` (`author_name`),
  KEY `idx_resolved_status` (`is_resolved`),
  KEY `idx_created_date` (`created_at`),
  KEY `period_id` (`period_id`),
  KEY `author_user_id` (`author_user_id`),
  CONSTRAINT `comments_ibfk_41` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_42` FOREIGN KEY (`period_id`) REFERENCES `reporting_periods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_43` FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_44` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES ('mea8p6xx0sitnjsl7mr','mduhf18z13v2dyoy30tn','period-august-2025','description',NULL,'Test User',NULL,'Test comment from CLI',0,NULL,NULL,'2025-08-13 17:23:56','2025-08-13 17:23:56');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migration_backup_comments`
--

DROP TABLE IF EXISTS `migration_backup_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migration_backup_comments` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique comment identifier',
  `project_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Field reference (e.g., description, benefits.fteSavings, nextSteps.{stepId})',
  `parent_comment_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `author_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Comment author name',
  `author_user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Comment content',
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether the comment thread is resolved',
  `resolved_at` datetime DEFAULT NULL COMMENT 'Timestamp when comment was resolved',
  `resolved_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Name of person who resolved the comment',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migration_backup_comments`
--

LOCK TABLES `migration_backup_comments` WRITE;
/*!40000 ALTER TABLE `migration_backup_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `migration_backup_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migration_backup_next_steps`
--

DROP TABLE IF EXISTS `migration_backup_next_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migration_backup_next_steps` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique next step identifier',
  `project_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Step description',
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Step owner name',
  `due_date` date DEFAULT NULL COMMENT 'Due date for the step',
  `status` enum('not-started','in-progress','ongoing','blocked','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not-started' COMMENT 'Current status of the step',
  `assigned_user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migration_backup_next_steps`
--

LOCK TABLES `migration_backup_next_steps` WRITE;
/*!40000 ALTER TABLE `migration_backup_next_steps` DISABLE KEYS */;
/*!40000 ALTER TABLE `migration_backup_next_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migration_backup_projects`
--

DROP TABLE IF EXISTS `migration_backup_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migration_backup_projects` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique project identifier',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Project name',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Project description',
  `business_lead` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Business lead name',
  `initiator` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Project initiator name',
  `dev_team_lead` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Development team lead name',
  `project_start_date` date DEFAULT NULL COMMENT 'Project start date',
  `current_project_stage` enum('prototype','poc','pilot') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Current project development stage',
  `current_ai_stage` enum('planning-design','data-collection','model-building','testing-validation','deployment','monitoring') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Current AI lifecycle stage',
  `target_next_stage_date` date DEFAULT NULL COMMENT 'Target date for next AI lifecycle stage',
  `target_completion_date` date DEFAULT NULL COMMENT 'Target project completion date',
  `budget` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Project budget or TBD',
  `benefits` json NOT NULL COMMENT 'Expected benefits configuration',
  `key_risks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Key risks and issues',
  `key_updates` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Key project updates',
  `assigned_user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migration_backup_projects`
--

LOCK TABLES `migration_backup_projects` WRITE;
/*!40000 ALTER TABLE `migration_backup_projects` DISABLE KEYS */;
INSERT INTO `migration_backup_projects` VALUES ('mduhf18z13v2dyoy30tn','IRCC Assistant','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"other\": {\"details\": \"\", \"applicable\": \"\"}, \"fteSavings\": {\"details\": \"\", \"applicable\": \"\"}, \"costSavings\": {\"details\": \"\", \"applicable\": \"\"}, \"clientService\": {\"details\": \"\", \"applicable\": \"\"}, \"programIntegrity\": {\"details\": \"\", \"applicable\": \"\"}}',NULL,NULL,NULL,'2025-08-02 16:43:40','2025-08-02 16:43:41');
/*!40000 ALTER TABLE `migration_backup_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `next_steps`
--

DROP TABLE IF EXISTS `next_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `next_steps` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique next step identifier',
  `project_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Step description',
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Step owner name',
  `due_date` date DEFAULT NULL COMMENT 'Due date for the step',
  `status` enum('not-started','in-progress','ongoing','blocked','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not-started' COMMENT 'Current status of the step',
  `assigned_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_steps` (`project_id`,`period_id`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_status` (`status`),
  KEY `idx_owner` (`owner`),
  KEY `period_id` (`period_id`),
  KEY `assigned_user_id` (`assigned_user_id`),
  CONSTRAINT `next_steps_ibfk_31` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `next_steps_ibfk_32` FOREIGN KEY (`period_id`) REFERENCES `reporting_periods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `next_steps_ibfk_33` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `next_steps`
--

LOCK TABLES `next_steps` WRITE;
/*!40000 ALTER TABLE `next_steps` DISABLE KEYS */;
/*!40000 ALTER TABLE `next_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_data`
--

DROP TABLE IF EXISTS `project_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_data` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_value` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_project_field_period` (`project_id`,`period_id`,`field_name`),
  KEY `idx_project_data` (`project_id`,`period_id`,`field_name`),
  KEY `idx_project_data_lookup` (`period_id`,`project_id`),
  CONSTRAINT `fk_project_data_period` FOREIGN KEY (`period_id`) REFERENCES `reporting_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_data_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_data`
--

LOCK TABLES `project_data` WRITE;
/*!40000 ALTER TABLE `project_data` DISABLE KEYS */;
INSERT INTO `project_data` VALUES ('mduhf18z13v2dyoy30tn-benefits','mduhf18z13v2dyoy30tn','period-august-2025','benefits','{\"other\": {\"details\": \"\", \"applicable\": \"\"}, \"fteSavings\": {\"details\": \"\", \"applicable\": \"\"}, \"costSavings\": {\"details\": \"\", \"applicable\": \"\"}, \"clientService\": {\"details\": \"\", \"applicable\": \"\"}, \"programIntegrity\": {\"details\": \"\", \"applicable\": \"\"}}','2025-08-06 14:41:15','2025-08-06 14:41:15'),('mduhf18z13v2dyoy30tn-key_risks','mduhf18z13v2dyoy30tn','period-august-2025','key_risks','\"\"','2025-08-06 14:41:15','2025-08-06 14:41:15'),('mduhf18z13v2dyoy30tn-key_updates','mduhf18z13v2dyoy30tn','period-august-2025','key_updates','\"\"','2025-08-06 14:41:15','2025-08-06 14:41:15');
/*!40000 ALTER TABLE `project_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique project identifier',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Project name',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Project description',
  `business_lead` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Business lead name',
  `initiator` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Project initiator name',
  `dev_team_lead` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Development team lead name',
  `project_start_date` date DEFAULT NULL COMMENT 'Project start date',
  `current_project_stage` enum('prototype','poc','pilot') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Current project development stage',
  `current_ai_stage` enum('planning-design','data-collection','model-building','testing-validation','deployment','monitoring') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Current AI lifecycle stage',
  `target_next_stage_date` date DEFAULT NULL COMMENT 'Target date for next AI lifecycle stage',
  `target_completion_date` date DEFAULT NULL COMMENT 'Target project completion date',
  `budget` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Project budget or TBD',
  `benefits` json NOT NULL COMMENT 'Expected benefits configuration',
  `key_risks` text COLLATE utf8mb4_unicode_ci COMMENT 'Key risks and issues',
  `key_updates` text COLLATE utf8mb4_unicode_ci COMMENT 'Key project updates',
  `assigned_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `projects_name` (`name`),
  KEY `projects_created_at` (`created_at`),
  KEY `projects_current_project_stage` (`current_project_stage`),
  KEY `projects_current_ai_stage` (`current_ai_stage`),
  KEY `assigned_user_id` (`assigned_user_id`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES ('mduhf18z13v2dyoy30tn','IRCC Assistant','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"other\": {\"details\": \"\", \"applicable\": \"\"}, \"fteSavings\": {\"details\": \"\", \"applicable\": \"\"}, \"costSavings\": {\"details\": \"\", \"applicable\": \"\"}, \"clientService\": {\"details\": \"\", \"applicable\": \"\"}, \"programIntegrity\": {\"details\": \"\", \"applicable\": \"\"}}',NULL,NULL,NULL,'2025-08-02 16:43:40','2025-08-02 16:43:41');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reporting_periods`
--

DROP TABLE IF EXISTS `reporting_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reporting_periods` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique reporting period identifier',
  `period_start` date NOT NULL COMMENT 'Period start date (15th of month)',
  `period_end` date NOT NULL COMMENT 'Period end date (15th of next month)',
  `period_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Period name (e.g., "August 2024")',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether this period is locked (immutable)',
  `data_snapshot` json DEFAULT NULL COMMENT 'Immutable snapshot of project data when period was locked',
  `locked_at` datetime DEFAULT NULL COMMENT 'Timestamp when period was locked',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether this is the current active period (only one can be active)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_project_period` (`period_start`,`period_end`),
  KEY `idx_project_period` (`period_start`),
  KEY `idx_period_dates` (`period_start`,`period_end`),
  KEY `idx_locked_status` (`is_locked`),
  KEY `idx_period_active` (`is_active`,`period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporting_periods`
--

LOCK TABLES `reporting_periods` WRITE;
/*!40000 ALTER TABLE `reporting_periods` DISABLE KEYS */;
INSERT INTO `reporting_periods` VALUES ('period-august-2025','2025-07-15','2025-08-15','August 2025',0,NULL,NULL,'2025-08-06 10:41:15','2025-08-06 10:41:15',1);
/*!40000 ALTER TABLE `reporting_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique user identifier',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User full name',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User email address',
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User department or team',
  `role` enum('admin','manager','contributor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'contributor' COMMENT 'User role for access control',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Whether user is active in the system',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `unique_email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  KEY `idx_department` (`department`),
  KEY `idx_role` (`role`),
  KEY `idx_active_status` (`is_active`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-18 13:25:51

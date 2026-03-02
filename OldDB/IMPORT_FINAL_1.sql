-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
--
-- Host: 45.76.250.100    Database: lunarpay_prod
-- ------------------------------------------------------
-- Server version	5.5.5-10.6.22-MariaDB-ubu2004

--
-- Table structure for table "account_donor"
--

CREATE TABLE IF NOT EXISTS "account_donor" (
  "id" SERIAL PRIMARY KEY,
  "email" varchar(150) DEFAULT '',
  "country_code_phone" varchar(5) DEFAULT NULL,
  "phone_code" varchar(5) DEFAULT NULL,
  "phone" varchar(32) DEFAULT NULL,
  "id_church" INTEGER DEFAULT NULL,
  "stripe_customer_id" text DEFAULT NULL,
  "freshbooks_id_user" varchar(10) DEFAULT NULL,
  "quickbooks_id_user" varchar(20) DEFAULT NULL,
  "state" varchar(64) DEFAULT NULL,
  "address" text DEFAULT NULL,
  "city" varchar(128) DEFAULT NULL,
  "business_name" varchar(128) DEFAULT NULL,
  "postal_code" varchar(16) DEFAULT NULL,
  "bank" TEXT DEFAULT NULL,
  "phone_bckp" TEXT DEFAULT NULL,
  "contact_phone" TEXT DEFAULT NULL,
  "contact_email" TEXT DEFAULT NULL,
  "address2" TEXT DEFAULT NULL,
  "campus_id" INTEGER DEFAULT NULL,
  "preferred_name" varchar(128) DEFAULT NULL,
  "membership" varchar(32) DEFAULT NULL,
  "birthday" date DEFAULT NULL,
  "gender" varchar(32) DEFAULT '',
  "life_stage" varchar(32) DEFAULT '',
  "child_stage_allergies" TEXT DEFAULT NULL,
  "is_volunteer" char(1) DEFAULT 'N',
  "interest_volunteer" char(1) DEFAULT NULL,
  "donate_account_id" INTEGER DEFAULT NULL,
  "created_from" varchar(255) DEFAULT NULL,
  "metadata" text DEFAULT NULL,
  "photo_profile" varchar(64) DEFAULT NULL,
  "custom_fields_data" text DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at_sync" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "sync_log" varchar(100) DEFAULT NULL,
  "call_list" SMALLINT DEFAULT 1,
  "first_name" varchar(45) DEFAULT NULL,
  "last_name" varchar(45) DEFAULT NULL,
  "amount_acum" decimal(15,2) DEFAULT 0.00,
  "fee_acum" decimal(15,2) DEFAULT 0.00,
  "net_acum" decimal(15,2) DEFAULT 0.00,
  "last_donation_date" TIMESTAMP DEFAULT NULL,
  "password" varchar(255) DEFAULT NULL,
  "forgotten_password_selector" varchar(255) DEFAULT NULL,
  "forgotten_password_code" varchar(255) DEFAULT NULL,
  "forgotten_back_url" varchar(255) DEFAULT NULL,
  "forgotten_password_time" INTEGER DEFAULT NULL,
  "status_chat" char(1) DEFAULT 'O'
);

--
-- Dumping data for table "account_donor"
--

INSERT INTO "account_donor" VALUES (1,'juan@lunarpay.com','US','1',NULL,1,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-01-09 20:14:27','2025-01-09 20:14:27','2025-01-09 20:14:27',NULL,1,'Juan','Gmz',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(2,'juan@lunarpay.com','US','1',NULL,2,NULL,NULL,NULL,NULL,'1234 Example Street Miami, FL 33101',NULL,'Harris Corporation',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-01-09 20:31:50','2025-05-09 17:46:01','2025-05-09 17:46:01',NULL,1,'Juan','Gomez',0.00,0.63,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(3,'jb@marketing.biz','US','1',NULL,2,NULL,NULL,NULL,NULL,'3316 taunton way mckinney tx 75069',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-01-17 13:44:10','2025-03-25 15:39:09','2025-03-25 15:39:09',NULL,1,'Jonathan','Bodnar',104.30,3.63,103.97,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(4,'troy@ism.bible','US','1',NULL,2,NULL,NULL,NULL,NULL,'8350 North Central Expressway Suite 1900 Dallas, Texas 75206',NULL,'International Scripture Ministries',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-01-27 21:17:23','2025-07-28 21:54:07','2025-07-28 21:54:07',NULL,1,'Troy','Carl',707121.17,24751.70,706598.53,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(5,'jb@marketing.biz','US',NULL,NULL,12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'customer/apiv1/auth/register',NULL,NULL,NULL,'2025-05-07 19:51:52','2025-05-07 19:51:52','2025-05-07 19:51:52',NULL,1,'Jb','',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(6,'juan@lunarpay.io','US','1',NULL,1,NULL,NULL,NULL,NULL,'',NULL,'CP',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-05-08 23:58:28','2025-05-08 23:58:28','2025-05-08 23:58:28',NULL,1,'Juan','Gmz',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(7,'jonathanbodnar@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'customer/apiv1/auth/register',NULL,NULL,NULL,'2025-05-19 18:44:12','2025-05-19 18:44:12','2025-05-19 18:44:12',NULL,1,'Jonathanbodnar','',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(8,'jonathan@apollo.inc','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"66bd519a276614ffb6397ba6\",\"magicweb_email\":\"jonathan@apollo.inc\"}',NULL,NULL,'2025-07-04 21:49:04','2025-07-04 21:49:04','2025-07-04 21:49:04',NULL,1,'Jonathan','Bodnar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(9,'juan@apolloapps.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68684f8a1dc047b9c477680d\",\"magicweb_email\":\"juan@apolloapps.com\"}',NULL,NULL,'2025-07-04 22:02:51','2025-07-04 22:02:51','2025-07-04 22:02:51',NULL,1,'Juan','Gmz',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(10,'cruzenaz46@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"6868f3961dc047b9c47780a4\",\"magicweb_email\":\"cruzenaz46@gmail.com\"}',NULL,NULL,'2025-07-05 09:42:47','2025-07-05 09:42:47','2025-07-05 09:42:47',NULL,1,'Michelle','Cooper',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(11,'xenniet@yahoo.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"686c02de1dc047b9c477ec8e\",\"magicweb_email\":\"xenniet@yahoo.com\"}',NULL,NULL,'2025-07-07 17:24:47','2025-07-07 17:24:47','2025-07-07 17:24:47',NULL,1,'Xennie','Thompson',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(12,'jeejo2005@rediffmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68765eaf1dc047b9c4797c6a\",\"magicweb_email\":\"jeejo2005@rediffmail.com\"}',NULL,NULL,'2025-07-15 13:59:11','2025-07-15 13:59:11','2025-07-15 13:59:11',NULL,1,'Jeejo','John K',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(13,'Samuelhernandez236@yahoo.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"687762e01dc047b9c4799f8d\",\"magicweb_email\":\"Samuelhernandez236@yahoo.com\"}',NULL,NULL,'2025-07-16 08:29:20','2025-07-16 08:29:20','2025-07-16 08:29:20',NULL,1,'Samuel','Hernandez',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(14,'himyrealnameiscar@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68794efa1dc047b9c479e657\",\"magicweb_email\":\"himyrealnameiscar@gmail.com\"}',NULL,NULL,'2025-07-17 19:28:58','2025-07-17 19:28:58','2025-07-17 19:28:58',NULL,1,'Record','Gaming',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(15,'juan@marketing.biz','US','1',NULL,14,NULL,NULL,NULL,NULL,'',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-07-23 20:19:58','2025-07-23 20:19:58','2025-07-23 20:19:58',NULL,1,'Juan','Gomez',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(16,'sunnyaron228@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"688533edd4a7d0b3cc64525a\",\"magicweb_email\":\"sunnyaron228@gmail.com\"}',NULL,NULL,'2025-07-26 20:00:46','2025-07-26 20:00:46','2025-07-26 20:00:46',NULL,1,'Sunny','Arron',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(17,'harsith.kannan@student.education.wa.edu.au','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"688a0b93d4a7d0b3cc6478e1\",\"magicweb_email\":\"harsith.kannan@student.education.wa.edu.au\"}',NULL,NULL,'2025-07-30 12:09:56','2025-07-30 12:09:56','2025-07-30 12:09:56',NULL,1,'Harsith','Kannan',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(18,'belov11@duck.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"688e41a4d4a7d0b3cc648c07\",\"magicweb_email\":\"belov11@duck.com\"}',NULL,NULL,'2025-08-02 16:49:41','2025-08-02 16:49:41','2025-08-02 16:49:41',NULL,1,'Serjey','Kiriushyn',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(19,'dm@wttint.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"689193bad4a7d0b3cc64987b\",\"magicweb_email\":\"dm@wttint.com\"}',NULL,NULL,'2025-08-05 05:16:43','2025-08-05 05:16:43','2025-08-05 05:16:43',NULL,1,'Sanjay','Prasad',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(20,'carl.gallardo@yahoo.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"6893969bd4a7d0b3cc64a5b6\",\"magicweb_email\":\"carl.gallardo@yahoo.com\"}',NULL,NULL,'2025-08-06 17:53:32','2025-08-06 17:53:32','2025-08-06 17:53:32',NULL,1,'Carl','Gallardo',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(21,'yukmawijaya33@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68974b5dd4a7d0b3cc64b47b\",\"magicweb_email\":\"yukmawijaya33@gmail.com\"}',NULL,NULL,'2025-08-09 13:21:34','2025-08-09 13:21:34','2025-08-09 13:21:34',NULL,1,'Yukma','Wijaya',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(22,'btrowa24@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68982856d4a7d0b3cc64b857\",\"magicweb_email\":\"btrowa24@gmail.com\"}',NULL,NULL,'2025-08-10 05:04:23','2025-08-10 05:04:23','2025-08-10 05:04:23',NULL,1,'Haven','Pascual',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(23,'naveenns200123456789@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"689ab625d4a7d0b3cc64c135\",\"magicweb_email\":\"naveenns200123456789@gmail.com\"}',NULL,NULL,'2025-08-12 03:33:58','2025-08-12 03:33:58','2025-08-12 03:33:58',NULL,1,'Naveen','Kumar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(24,'juan@marketing.biz','US','1',NULL,23,NULL,NULL,NULL,NULL,'',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-08-12 20:32:50','2025-08-12 20:39:37','2025-08-12 20:39:37',NULL,1,'Juan','Gomez',0.00,0.33,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(25,'salmandotweb@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"d4b4ef2e-f697-48d4-95ff-ff3743092bdc\"}',NULL,NULL,'2025-08-12 22:40:41','2025-08-12 22:40:41','2025-08-12 22:40:41',NULL,1,'Muhammad','Salman',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(26,'globaltrends.tech254@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"689bd1e3d4a7d0b3cc64c80e\",\"magicweb_email\":\"globaltrends.tech254@gmail.com\"}',NULL,NULL,'2025-08-12 23:44:36','2025-08-12 23:44:36','2025-08-12 23:44:36',NULL,1,'Patrick','Mutinda',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(27,'shipcrewltd01@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"c0be1d3c-dd62-4a9e-a155-f963937f9782\"}',NULL,NULL,'2025-08-12 23:49:51','2025-08-12 23:49:51','2025-08-12 23:49:51',NULL,1,'Shipcrew','Ltd',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(28,'imperialtrendshop00@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"45fc4761-6aba-42ff-a3e2-b2466ee59a92\"}',NULL,NULL,'2025-08-13 01:51:04','2025-08-13 01:51:04','2025-08-13 01:51:04',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(29,'hamzarasheed804@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"689c3118d4a7d0b3cc64ca07\",\"magicweb_email\":\"hamzarasheed804@gmail.com\"}',NULL,NULL,'2025-08-13 06:30:49','2025-08-13 06:30:49','2025-08-13 06:30:49',NULL,1,'Hamza','Rasheed',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(30,'juan2@marketing.biz','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"bf71a30f-664a-494a-824c-e2c4c786ef11\"}',NULL,NULL,'2025-08-13 13:38:47','2025-08-13 13:38:47','2025-08-13 13:38:47',NULL,1,'Juan','Gomez',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(31,'help@leads.biz','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"164ecd7a-52f7-4073-a7a3-d7b31713cc15\"}',NULL,NULL,'2025-08-13 14:58:46','2025-08-13 14:58:46','2025-08-13 14:58:46',NULL,1,'Jonathan','Bodnar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(32,'jbtestpay@leads.biz','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"95bb0a4c-11d4-4946-8c2b-da050fbef1a7\"}',NULL,NULL,'2025-08-13 17:10:29','2025-08-13 17:10:29','2025-08-13 17:10:29',NULL,1,'Jonathan','Bodnar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(33,'salmandotweb+1@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"375cc8c6-0a51-44fa-ae6a-92386abfffae\"}',NULL,NULL,'2025-08-13 18:50:18','2025-08-13 18:50:18','2025-08-13 18:50:18',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(34,'baxterwandf@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"3d7c083a-dce6-47ae-acf2-afef112d31a0\"}',NULL,NULL,'2025-08-14 00:18:10','2025-08-14 00:18:10','2025-08-14 00:18:10',NULL,1,'Jake','Baxter',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(35,'coderology12@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"61dae0ee-3b1a-4b15-a9b9-75acc2977420\"}',NULL,NULL,'2025-08-14 03:20:57','2025-08-14 03:20:57','2025-08-14 03:20:57',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(36,'mgmkahc@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"689d6e70d4a7d0b3cc64cd89\",\"magicweb_email\":\"mgmkahc@gmail.com\"}',NULL,NULL,'2025-08-14 05:04:48','2025-08-14 05:04:48','2025-08-14 05:04:48',NULL,1,'Ghulam Mohammad','Mustafa',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(37,'imperialtrendshop11@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"aae70855-8102-49a4-a4a1-13e4b41a77e2\"}',NULL,NULL,'2025-08-14 16:03:24','2025-08-14 16:03:24','2025-08-14 16:03:24',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(38,'imperialtrendshop+22@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"01241e27-5e22-4862-aa7e-810ab285c69c\"}',NULL,NULL,'2025-08-14 16:08:39','2025-08-14 16:08:39','2025-08-14 16:08:39',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(39,'peviyam147@mardiek.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"689edbf5d4a7d0b3cc64d41b\",\"magicweb_email\":\"peviyam147@mardiek.com\"}',NULL,NULL,'2025-08-15 07:04:21','2025-08-15 07:04:21','2025-08-15 07:04:21',NULL,1,'John','Darr',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(40,'mmbodnar@galtgpp.com','US','1','4692079703',23,NULL,NULL,NULL,NULL,'',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-08-15 16:48:37','2025-08-15 16:48:37','2025-08-15 16:48:37',NULL,1,'Michael','Bodnar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(41,'emmanueltokula4@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68a0ed83d4a7d0b3cc64dc2c\",\"magicweb_email\":\"emmanueltokula4@gmail.com\"}',NULL,NULL,'2025-08-16 20:43:48','2025-08-16 20:43:48','2025-08-16 20:43:48',NULL,1,'Emmanuel','Tokula',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(42,'Sridharanguruji@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68a1efd5d4a7d0b3cc64df8a\",\"magicweb_email\":\"Sridharanguruji@gmail.com\"}',NULL,NULL,'2025-08-17 15:05:58','2025-08-17 15:05:58','2025-08-17 15:05:58',NULL,1,'Sridharbabu','Varadharajan',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(43,'mbodnar@galtgpp.com','US','1','4692079703',2,NULL,NULL,NULL,NULL,'',NULL,'Galt',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'donors/save',NULL,NULL,NULL,'2025-08-18 14:45:07','2025-08-18 20:13:59','2025-08-18 20:13:59',NULL,1,'Michael','Bodnar',15000.00,435.30,14564.70,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(44,'wavecomworks@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68a3894928c6c20b42b6db0e\",\"magicweb_email\":\"wavecomworks@gmail.com\"}',NULL,NULL,'2025-08-18 20:12:58','2025-08-18 20:12:58','2025-08-18 20:12:58',NULL,1,'Isaac','Lopez',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(45,'films2050@yahoo.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68a438d328c6c20b42b6dfb0\",\"magicweb_email\":\"films2050@yahoo.com\"}',NULL,NULL,'2025-08-19 08:41:56','2025-08-19 08:41:56','2025-08-19 08:41:56',NULL,1,'Fokuss','Fox',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(46,'imperialtrendshoopp@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"804a4ad5-c213-4a9a-9843-91684f1a4afa\"}',NULL,NULL,'2025-08-19 18:32:48','2025-08-19 18:32:48','2025-08-19 18:32:48',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(47,'Deepharmanpbx6@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68a54c4a28c6c20b42b6e417\",\"magicweb_email\":\"Deepharmanpbx6@gmail.com\"}',NULL,NULL,'2025-08-20 04:17:14','2025-08-20 04:17:14','2025-08-20 04:17:14',NULL,1,'Harmandeep','Singh',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(48,'asdasdads@leads.biz','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"48d359cf-5b1f-4418-9480-a1288dde9106\"}',NULL,NULL,'2025-08-20 15:42:03','2025-08-20 15:42:03','2025-08-20 15:42:03',NULL,1,'New','Models',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(49,'onboardingtesting@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"a8fb9872-f328-4de7-b515-afbfd99e6ca5\"}',NULL,NULL,'2025-08-20 16:49:55','2025-08-20 16:49:55','2025-08-20 16:49:55',NULL,1,'Onboarding','Testing',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(50,'Brittnigreenberg@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"7e7b9734-94f7-407b-8c6e-dcdc6cbb0c7e\"}',NULL,NULL,'2025-08-21 05:43:33','2025-08-21 05:43:33','2025-08-21 05:43:33',NULL,1,'Brittni','Greenberg',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(51,'shashankamallela94@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68a6e6ff28c6c20b42b6eb78\",\"magicweb_email\":\"shashankamallela94@gmail.com\"}',NULL,NULL,'2025-08-21 09:29:35','2025-08-21 09:29:35','2025-08-21 09:29:35',NULL,1,'Mallela','Shashanka',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(52,'coderology222@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"paymentFirst\":true}',NULL,NULL,'2025-08-21 11:22:54','2025-08-21 11:22:54','2025-08-21 11:22:54',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(53,'imperialtrendshop@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"paymentFirst\":true}',NULL,NULL,'2025-08-21 17:24:50','2025-08-21 17:24:50','2025-08-21 17:24:50',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(54,'test123@marketing.biz','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"paymentFirst\":true}',NULL,NULL,'2025-08-21 17:50:52','2025-08-21 17:50:52','2025-08-21 17:50:52',NULL,1,'Jonathan','Bodnar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(55,'lsmachinist@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68a83f0128c6c20b42b6f557\",\"magicweb_email\":\"lsmachinist@gmail.com\"}',NULL,NULL,'2025-08-22 09:57:22','2025-08-22 09:57:22','2025-08-22 09:57:22',NULL,1,'Lionel','Slor',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(56,'support@spuddys.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"985ad078-acf9-4c03-a943-8a68a09917c7\"}',NULL,NULL,'2025-08-23 03:11:06','2025-08-23 03:11:06','2025-08-23 03:11:06',NULL,1,'James','Reynolds',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(57,'Dwaynenickson94@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68a9352028c6c20b42b6fb88\",\"magicweb_email\":\"Dwaynenickson94@gmail.com\"}',NULL,NULL,'2025-08-23 03:27:28','2025-08-23 03:27:28','2025-08-23 03:27:28',NULL,1,'Dwayne','Nick',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(58,'pierrecampbell77@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"6dc94b94-aaf5-49ff-9f0c-546d05517483\"}',NULL,NULL,'2025-08-25 12:27:31','2025-08-25 12:27:31','2025-08-25 12:27:31',NULL,1,'Pierre','Campbell',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(59,'Dcontenido.co@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68ac853928c6c20b42b70c94\",\"magicweb_email\":\"Dcontenido.co@gmail.com\"}',NULL,NULL,'2025-08-25 15:46:01','2025-08-25 15:46:01','2025-08-25 15:46:01',NULL,1,'Melisa','Ceballos',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(60,'juan3@marketing.biz','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"ceb65750-5941-4d31-96c0-1b5c26f4e82b\"}',NULL,NULL,'2025-08-26 00:09:01','2025-08-26 00:09:01','2025-08-26 00:09:01',NULL,1,'Jjuan3','',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(61,'aryapsn194@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68ae02c728c6c20b42b71642\",\"magicweb_email\":\"aryapsn194@gmail.com\"}',NULL,NULL,'2025-08-26 18:53:59','2025-08-26 18:53:59','2025-08-26 18:53:59',NULL,1,'Arya','Hama Salih',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(62,'rikkibanks01@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"fec9348e-5de8-4ead-8c59-120213aad4ad\"}',NULL,NULL,'2025-08-27 00:09:59','2025-08-27 00:09:59','2025-08-27 00:09:59',NULL,1,'Erica','Banks',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(63,'salmandotweb2211@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"2539e5fb-b8a7-4134-8511-a5af78b64610\"}',NULL,NULL,'2025-08-27 21:10:09','2025-08-27 21:10:09','2025-08-27 21:10:09',NULL,1,'Salman','Nisar',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(64,'kennethrmckay@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"583e6505-b72d-4f05-8f27-fd9a1dce407d\"}',NULL,NULL,'2025-08-28 12:39:26','2025-08-28 12:39:26','2025-08-28 12:39:26',NULL,1,'Kenneth','Mckay',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(65,'convertiqo@gmail.com','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"c3a44457-2f32-4015-a9e9-e4961bf1d353\"}',NULL,NULL,'2025-08-28 15:54:10','2025-08-28 15:54:10','2025-08-28 15:54:10',NULL,1,'John','Ramos',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(66,'kuldeeppatel0045@gmail.com','US',NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"magicweb_user_id\":\"68b081e928c6c20b42b721db\",\"magicweb_email\":\"kuldeeppatel0045@gmail.com\"}',NULL,NULL,'2025-08-28 16:20:58','2025-08-28 16:20:58','2025-08-28 16:20:58',NULL,1,'Kuldeep','Aanjana',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O'),(67,'rrreeessade@marketing.biz','US',NULL,NULL,23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'','',NULL,'N',NULL,NULL,'merchant-api','{\"userId\":\"f6a7170e-6979-437c-a133-123f18118ad5\"}',NULL,NULL,'2025-08-29 14:14:34','2025-08-29 14:14:34','2025-08-29 14:14:34',NULL,1,'Sandra','',0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'O');

--
-- Table structure for table "api_access_token"
--

CREATE TABLE IF NOT EXISTS "api_access_token" (
  "id" INTEGER NOT NULL,
  "user_id" INTEGER DEFAULT NULL,
  "church_id" INTEGER DEFAULT NULL,
  "campus_id" INTEGER DEFAULT NULL,
  "phone" varchar(16) DEFAULT NULL,
  "token" varchar(60) DEFAULT NULL,
  "expire_at" TIMESTAMP DEFAULT NULL,
  "session_data" TEXT DEFAULT NULL
);

--
-- Dumping data for table "api_access_token"
--

INSERT INTO "api_access_token" VALUES (5,5,12,NULL,NULL,'f69a6112ff43774b69dde88883f75434eb8cfcce0265349c','2025-05-19 14:02:26','{\"user_id\":\"5\",\"identity\":\"jb@marketing.biz\"}'),(7,2,2,NULL,NULL,'a688a25847ebf5df1b0513932ddf70babfad85da975e19bb','2025-06-13 17:52:23','{\"user_id\":\"2\",\"identity\":\"juan@lunarpay.com\"}'),(8,1,1,NULL,NULL,'b37fc66df238296c340128f98414bd722f6d72a9d66d2808','2025-05-09 13:06:26','{\"user_id\":\"1\",\"identity\":\"juan@lunarpay.com\"}'),(10,8,2,NULL,NULL,'10d8c7f23a2276376bf104bfcad77ae372679c4173a59380','2025-08-12 15:52:11','{\"user_id\":\"8\",\"identity\":\"jonathan@apollo.inc\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiYXRpZCI6IjEwIiwicnRpZCI6IjEwIiwiYXVkIjoicGF5bWVudF9saW5rIiwiY3VzdG9tZXJfaWQiOiI4Iiwib3JnX2lkIjoiMiIsImp0aSI6IjY4ODFiN2EzODk1YTkiLCJpYXQiOjE3NTMzMzE2MTksImV4cCI6MTc1MzMzMzQxOX0.RGPyG1RfuwI5StS1yu7Ik_5xwuWBkWs7L_5tBCz6oh4\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/68684e08b1bf1\"}}'),(11,9,2,NULL,NULL,'1dd0d3e946192e51d621c00e0ca009b5bfdf3efd67d91447','2025-08-13 15:34:23','{\"user_id\":\"9\",\"identity\":\"juan@apolloapps.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiYXRpZCI6IjExIiwicnRpZCI6IjExIiwiYXVkIjoicGF5bWVudF9saW5rIiwiY3VzdG9tZXJfaWQiOiI5Iiwib3JnX2lkIjoiMiIsImp0aSI6IjY4Njg1MzRjODcwNzciLCJpYXQiOjE3NTE2Njc1MzIsImV4cCI6MTc1MTY2OTMzMn0.wRLzk596zyZ9UYgehd3MMHZyKuvlssFebxd49EHvrf0\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/68684e08b1bf1\"}}'),(14,27,23,NULL,NULL,'dfc6f6bc13605a577c3374671ad11c47536a1e8e92c06b82','2025-08-12 19:09:51','{\"user_id\":27,\"identity\":\"shipcrewltd01@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIxNCIsInJ0aWQiOjE0LCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6MjcsIm9yZ19pZCI6IjIzIiwianRpIjoiNjg5YmQzMWZlYjE0MSIsImlhdCI6MTc1NTA0MjU5MSwiZXhwIjoxNzU1MDQ0MzkxfQ.xZMxMIsr3XMXJ5VeEiil3hvLcAWdY_KLyHHv28si5xM\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(15,28,23,NULL,NULL,'db8dfb9ae3c300fce4f24853c400ecf1a86eb722927230fd','2025-08-13 08:43:36','{\"user_id\":28,\"identity\":\"imperialtrendshop00@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIxNSIsInJ0aWQiOiIxNSIsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjoyOCwib3JnX2lkIjoiMjMiLCJqdGkiOiI2ODljOTFkODJkMjU2IiwiaWF0IjoxNzU1MDkxNDE2LCJleHAiOjE3NTUwOTMyMTZ9.TX1qWK9aTR2QV842OuwOaaQKUHI3mCpvw5PCncZBbho\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(16,25,23,NULL,NULL,'e1042810bca0213282cd9ab1d9ca72ec7199ec2ae2d04edc','2025-08-21 07:35:39','{\"user_id\":\"25\",\"identity\":\"salmandotweb@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIxNiIsInJ0aWQiOiIxNiIsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjoiMjUiLCJvcmdfaWQiOiIyMyIsImp0aSI6IjY4YTcwZGViZWJiNTYiLCJpYXQiOjE3NTU3Nzg1MzksImV4cCI6MTc1NTc4MDMzOX0.Yl2BopiXBY7oaABUGb2fJ59QTqefPovtLYxvbOZAjN4\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\",\"post_purchase_link\":null}}'),(17,29,2,NULL,NULL,'96673ff7d2e403095bb1699493927d7f9a47385c3fa9d188','2025-08-13 01:51:37','{\"user_id\":\"29\",\"identity\":\"hamzarasheed804@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiYXRpZCI6IjE3IiwicnRpZCI6MTcsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjoiMjkiLCJvcmdfaWQiOiIyIiwianRpIjoiNjg5YzMxNDkxM2NiNCIsImlhdCI6MTc1NTA2NjY5NywiZXhwIjoxNzU1MDY4NDk3fQ.0PXznAQPZA1Ua5qd1hjtopqTdv-XQpT1tn0lAhDWtk8\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/68684e08b1bf1\"}}'),(19,31,23,NULL,NULL,'51ee6607e51feb2d38c0decee097ece93d797ace5b569a44','2025-08-13 10:18:55','{\"user_id\":31,\"identity\":\"help@leads.biz\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIxOSIsInJ0aWQiOjE5LCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6MzEsIm9yZ19pZCI6IjIzIiwianRpIjoiNjg5Y2E4MmYyNzIxZSIsImlhdCI6MTc1NTA5NzEzNSwiZXhwIjoxNzU1MDk4OTM1fQ.c8pHwMcODOzaSRI5W47O72s1oSvaAwwj_AoVJQx1dPg\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(20,32,23,NULL,NULL,'2bc76acd653215366f352d4fd694d3ef209f76b7764fe45c','2025-08-13 15:16:05','{\"user_id\":32,\"identity\":\"jbtestpay@leads.biz\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyMCIsInJ0aWQiOiIyMCIsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjozMiwib3JnX2lkIjoiMjMiLCJqdGkiOiI2ODljZDcwNGQyODVjIiwiaWF0IjoxNzU1MTA5MTI0LCJleHAiOjE3NTUxMTA5MjR9.mV9Ge7GwAJC4xLPUeWmO8tgZXRQmQIxF3wff1PD5UTc\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(21,33,23,NULL,NULL,'0c18db637f1be228830710583ce588ca83190e6a53539b46','2025-08-18 14:48:13','{\"user_id\":33,\"identity\":\"salmandotweb+1@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyMSIsInJ0aWQiOiIyMSIsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjozMywib3JnX2lkIjoiMjMiLCJqdGkiOiI2ODllMDg2MmJjM2Y3IiwiaWF0IjoxNzU1MTg3Mjk4LCJleHAiOjE3NTUxODkwOTh9.03LFLwCSMABO0Y1yYEttt7zA74kQS7ncGn_kBzs_LCA\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(22,34,23,NULL,NULL,'037a900df79a2422ada5c1bc1ed1903f7e0fc6a4035b41c8','2025-08-13 19:38:11','{\"user_id\":34,\"identity\":\"baxterwandf@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyMiIsInJ0aWQiOjIyLCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6MzQsIm9yZ19pZCI6IjIzIiwianRpIjoiNjg5ZDJiNDMyOTA1MCIsImlhdCI6MTc1NTEzMDY5MSwiZXhwIjoxNzU1MTMyNDkxfQ.SNAvMrZiCJOBdclakihAxgJOBlnixi-uGBuYyZLHmFw\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(23,35,23,NULL,NULL,'4a7d2985909a31aef9bc9f166532c00e31452d2d6ed99557','2025-08-13 22:40:59','{\"user_id\":35,\"identity\":\"coderology12@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyMyIsInJ0aWQiOjIzLCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6MzUsIm9yZ19pZCI6IjIzIiwianRpIjoiNjg5ZDU2MWIxMDBiNCIsImlhdCI6MTc1NTE0MTY1OSwiZXhwIjoxNzU1MTQzNDU5fQ.MLYU0ltPDISDNPFiWSpoy9QMlzxzqVUN_T9fhSLfCgY\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(24,37,23,NULL,NULL,'77cb4b9f6cea377973d796a068c63d4a93cb43061b88e64d','2025-08-14 11:23:25','{\"user_id\":37,\"identity\":\"imperialtrendshop11@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyNCIsInJ0aWQiOjI0LCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6MzcsIm9yZ19pZCI6IjIzIiwianRpIjoiNjg5ZTA4Y2Q0NGE1MiIsImlhdCI6MTc1NTE4NzQwNSwiZXhwIjoxNzU1MTg5MjA1fQ.C-8XJ-_jE7AKobqeAoE-siGZQRafjUifKCm-1YTaWHs\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(25,38,23,NULL,NULL,'5eba8aadb1bac0095d674c4ecb9772db717a1fa345e4c37d','2025-08-14 11:28:39','{\"user_id\":38,\"identity\":\"imperialtrendshop+22@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyNSIsInJ0aWQiOjI1LCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6MzgsIm9yZ19pZCI6IjIzIiwianRpIjoiNjg5ZTBhMDc4ZGY2NyIsImlhdCI6MTc1NTE4NzcxOSwiZXhwIjoxNzU1MTg5NTE5fQ.KNKtX1ckp2Dp5w7zUJh3F7uDUif1O3WpwmDXykDgoQc\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\"}}'),(27,46,23,NULL,NULL,'6458e32cc00deeac287d2b047366585038dfb4979874ead7','2025-08-19 13:52:49','{\"user_id\":46,\"identity\":\"imperialtrendshoopp@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyNyIsInJ0aWQiOjI3LCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6NDYsIm9yZ19pZCI6IjIzIiwianRpIjoiNjhhNGMzNTFkMmIwNCIsImlhdCI6MTc1NTYyODM2OSwiZXhwIjoxNzU1NjMwMTY5fQ.ZZ8HxzLvp0ADg7AO_nMSXKN9coeJAxrCXVfVTvoFAPA\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\",\"post_purchase_link\":null}}'),(28,48,23,NULL,NULL,'b5402bb08bc092924c51393306f4edd4317802978b159ff3','2025-08-20 11:02:38','{\"user_id\":48,\"identity\":\"asdasdads@leads.biz\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyOCIsInJ0aWQiOiIyOCIsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjo0OCwib3JnX2lkIjoiMjMiLCJqdGkiOiI2OGE1ZWNlZWJhMDg2IiwiaWF0IjoxNzU1NzA0NTU4LCJleHAiOjE3NTU3MDYzNTh9.a_o8zUEqOACt3tPbzmEtxwOYASeJp0kPTAEeidois9U\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\",\"post_purchase_link\":null}}'),(29,49,23,NULL,NULL,'4910c9b7c42a44fc90608766060c0259ae2e0c72dbb6ac1b','2025-08-20 12:09:57','{\"user_id\":49,\"identity\":\"onboardingtesting@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIyOSIsInJ0aWQiOjI5LCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6NDksIm9yZ19pZCI6IjIzIiwianRpIjoiNjhhNWZjYjUwZjllMSIsImlhdCI6MTc1NTcwODU5NywiZXhwIjoxNzU1NzEwMzk3fQ.RF7LNmLLAIeUmf-BVdzpiXm6f8oNitaBd0FWa3ZI8R8\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\",\"post_purchase_link\":null}}'),(30,50,23,NULL,NULL,'a3e134599b3bc5d954b7cb5d56efbf2713927aef6017124a','2025-08-21 01:03:59','{\"user_id\":50,\"identity\":\"Brittnigreenberg@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIzMCIsInJ0aWQiOiIzMCIsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjo1MCwib3JnX2lkIjoiMjMiLCJqdGkiOiI2OGE2YjIxZjQ0YjJhIiwiaWF0IjoxNzU1NzU1MDM5LCJleHAiOjE3NTU3NTY4Mzl9.lOz2QEobSzELMCSZSK_MAwOn3y2Y19dSVvvtxJ6u8nw\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\",\"post_purchase_link\":null}}'),(31,52,23,NULL,NULL,'3a019cee4b6895eec9aafee1c1a582a6e8f3a0a2d9cd6b96','2025-08-21 06:42:54','{\"user_id\":52,\"identity\":\"coderology222@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIzMSIsInJ0aWQiOjMxLCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6NTIsIm9yZ19pZCI6IjIzIiwianRpIjoiNjhhNzAxOGVkMjZjZCIsImlhdCI6MTc1NTc3NTM3NCwiZXhwIjoxNzU1Nzc3MTc0fQ._HPgazf09nwxTAuX-UAROU91-U3AmBp9l-zvYdKqQ-4\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\",\"post_purchase_link\":null}}'),(32,53,23,NULL,NULL,'aceebb414250f7acc0a1a78884507e00111739442b9e40f2','2025-08-21 12:44:51','{\"user_id\":53,\"identity\":\"imperialtrendshop@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIzMiIsInJ0aWQiOjMyLCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6NTMsIm9yZ19pZCI6IjIzIiwianRpIjoiNjhhNzU2NjM1ODgwOCIsImlhdCI6MTc1NTc5NzA5MSwiZXhwIjoxNzU1Nzk4ODkxfQ.UKiX-_hYHXYnAbeKQ3OLX4s5jV7YIr9ftSKMQzioxtw\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9?success_callback=https%3A%2F%2Fdrive-dev.marketing.biz%2Fpayment-success%3FsessionId%3Dpublic_payment_53_1755797091150%26email%3Dimperialtrendshop%2540gmail.com\",\"post_purchase_link\":\"https:\\/\\/drive-dev.marketing.biz\\/payment-success?sessionId=public_payment_53_1755797091150&email=imperialtrendshop%40gmail.com\"}}'),(33,54,23,NULL,NULL,'ca51ae9f305812a1d7bd3d0026ebd16da54acebc6adf7b5d','2025-08-28 21:37:50','{\"user_id\":54,\"identity\":\"test123@marketing.biz\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIzMyIsInJ0aWQiOjMzLCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6NTQsIm9yZ19pZCI6IjIzIiwianRpIjoiNjhhNzVjN2NhMzI5MCIsImlhdCI6MTc1NTc5ODY1MiwiZXhwIjoxNzU1ODAwNDUyfQ.JIzUFGyxodLRtdnqm0uo4i8cfKQtF4ebzrWVT_nrVdI\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9?success_callback=https%3A%2F%2Fdrive-dev.marketing.biz%2Fpayment-success%3FsessionId%3Dpublic_payment_54_1755798652435%26email%3Dtest123%2540marketing.biz\",\"post_purchase_link\":\"https:\\/\\/drive-dev.marketing.biz\\/payment-success?sessionId=public_payment_54_1755798652435&email=test123%40marketing.biz\"}}'),(34,56,23,NULL,NULL,'e608598acfa3478e34cc5187c5c204a71a7a1818d5f710c3','2025-08-25 12:19:13','{\"user_id\":56,\"identity\":\"support@spuddys.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIzNCIsInJ0aWQiOiIzNCIsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjo1Niwib3JnX2lkIjoiMjMiLCJqdGkiOiI2OGFjOTY2MTU4M2RkIiwiaWF0IjoxNzU2MTQxMTUzLCJleHAiOjE3NTYxNDI5NTN9.XtQ5F5b05QIL4m-LslqGvo3_8guLDfX9pItIVhDXoZQ\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/689ba4b5887e9\",\"post_purchase_link\":null}}'),(39,63,23,NULL,NULL,'87befbfc06a49d552d636068ad99d09adc76cb19f381c8bd','2025-08-27 16:30:10','{\"user_id\":63,\"identity\":\"salmandotweb2211@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiIzOSIsInJ0aWQiOjM5LCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6NjMsIm9yZ19pZCI6IjIzIiwianRpIjoiNjhhZjc0MzJiYTk2NCIsImlhdCI6MTc1NjMyOTAxMCwiZXhwIjoxNzU2MzMwODEwfQ.zfZNnz8NcDIRtbSOiMyVFxUkJqtgm6xcqKnMRUxoY4Q\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/68adf7f8af108\",\"post_purchase_link\":null}}'),(40,64,23,NULL,NULL,'3ba57c0409d0f0dbc0c32861387be783b6c776fbae02bc6d','2025-08-28 07:59:26','{\"user_id\":64,\"identity\":\"kennethrmckay@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiI0MCIsInJ0aWQiOjQwLCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6NjQsIm9yZ19pZCI6IjIzIiwianRpIjoiNjhiMDRkZmU4YWEwMCIsImlhdCI6MTc1NjM4NDc2NiwiZXhwIjoxNzU2Mzg2NTY2fQ.tvY-5mTTZcZ-Z65Rh4JJGVxduNgmWBPmflG30AzvfLA\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/68adf7f8af108\",\"post_purchase_link\":null}}'),(41,65,23,NULL,NULL,'d965a8a84e766226044ea085591da2cccdf8f51e8eef37d7','2025-08-28 11:16:56','{\"user_id\":65,\"identity\":\"convertiqo@gmail.com\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiI0MSIsInJ0aWQiOiI0MSIsImF1ZCI6InBheW1lbnRfbGluayIsImN1c3RvbWVyX2lkIjo2NSwib3JnX2lkIjoiMjMiLCJqdGkiOiI2OGIwN2M0ODU5MzkwIiwiaWF0IjoxNzU2Mzk2NjE2LCJleHAiOjE3NTYzOTg0MTZ9.KcsC64-oU73S77t4k90dIGn5Ojhmlfyai_ycMdp9HdA\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/68adf7f8af108\",\"post_purchase_link\":null}}'),(43,67,23,NULL,NULL,'9293e0188526409016323c080cc4f6eb8ff445a1c57e978f','2025-08-29 09:34:34','{\"user_id\":67,\"identity\":\"rrreeessade@marketing.biz\",\"generated_session_link\":{\"token_link\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMyIsImF0aWQiOiI0MyIsInJ0aWQiOjQzLCJhdWQiOiJwYXltZW50X2xpbmsiLCJjdXN0b21lcl9pZCI6NjcsIm9yZ19pZCI6IjIzIiwianRpIjoiNjhiMWI1Y2E4ZTE3NCIsImlhdCI6MTc1NjQ3Njg3NCwiZXhwIjoxNzU2NDc4Njc0fQ.uGVspAkk-5PAAZrihl6cVnkXF_7rhEaF_sqqLeXPqMA\",\"redirect_url\":\"https:\\/\\/app.lunarpay.com\\/c\\/portal\\/payment_link\\/68adf7f8af108\",\"post_purchase_link\":null}}');

--
-- Table structure for table "api_keys_merchant"
--

CREATE TABLE IF NOT EXISTS "api_keys_merchant" (
  "id" INTEGER NOT NULL,
  "church_id" INTEGER DEFAULT NULL,
  "campus_id" INTEGER DEFAULT NULL,
  "token" varchar(145) DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT NULL
);

--
-- Dumping data for table "api_keys_merchant"
--

--
-- Table structure for table "api_merchant_credentials"
--

CREATE TABLE IF NOT EXISTS "api_merchant_credentials" (
  "id" INTEGER NOT NULL,
  "client_id" varchar(100) NOT NULL,
  "api_key" varchar(255) NOT NULL,
  "api_secret_hash" varchar(255) NOT NULL,
  "webhook_config" text DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--
-- Dumping data for table "api_merchant_credentials"
--

INSERT INTO "api_merchant_credentials" VALUES (1,'2','6a5c7d287af07ffaaec4ddaca54c2372','$2y$10$59CcUxS81BW.jvw0h5XRhu13KfySAFlW80zWhFCkuRfbCjKJRPst.','{\n    \"bearer_token\": \"lpwhkey_0b432da9247544151a7ef44a3313530edc49bc91b187d6de\",\n    \"subscription_created\": {\n        \"enabled\": true,\n        \"url\": \"https://api.magicweb.ai/subscriptionlp/webhook\"\n    },\n    \"subscription_updated\": {\n        \"enabled\": true,\n        \"url\": \"https://api.magicweb.ai/subscriptionlp/webhook\"\n    }\n}','2025-07-04 16:04:39','2025-07-04 17:14:49'),(2,'3','b84459428071eb0bda73945b4bc0cb8b','$2y$10$SoEusJfC2k/3ECxnb6fgfeKYU2U3xQgBy0d2T2JZUgdYxZ9no1N4a','{\n    \"bearer_token\": \"lpwhkey_34de554c9aaafe74d412e602ff3d6f24a4dd5f1b1b272801\",\n    \"subscription_created\": {\n        \"enabled\": true,\n        \"url\": \"https://api-mail-dev.marketing.biz/billing/webhook\"\n    },\n    \"subscription_updated\": {\n        \"enabled\": true,\n        \"url\": \"https://api-mail-dev.marketing.biz/billing/webhook\"\n    }\n}','2025-08-12 10:24:20','2025-08-12 10:27:20'),(3,'23','460e3c066b19dd89ee1239d1cce65cd0','$2y$10$I2ZLnuu6.3TxuwvpcbMNOePMu2HeWjZBUuqlyCrr2Fdu8vUtjLS6.','{\n    \"bearer_token\": \"lpwhkey_458ad69ff132058032157bddb47fb63f794bc6f4106ece5e\",\n    \"subscription_created\": {\n        \"enabled\": true,\n        \"url\": \"https://api-mail-dev.marketing.biz/billing/webhook\"\n    },\n    \"subscription_updated\": {\n        \"enabled\": true,\n        \"url\": \"https://api-mail-dev.marketing.biz/billing/webhook\"\n    }\n}','2025-08-12 15:44:15','2025-08-13 12:36:41');

--
-- Table structure for table "api_refresh_token"
--

CREATE TABLE IF NOT EXISTS "api_refresh_token" (
  "id" INTEGER NOT NULL,
  "user_id" INTEGER DEFAULT NULL,
  "church_id" INTEGER DEFAULT NULL,
  "campus_id" INTEGER DEFAULT NULL,
  "phone" varchar(16) DEFAULT NULL,
  "token" varchar(60) DEFAULT NULL,
  "expire_at" TIMESTAMP DEFAULT NULL
);

--
-- Dumping data for table "api_refresh_token"
--

INSERT INTO "api_refresh_token" VALUES (5,5,12,NULL,NULL,'f17bd0638375a32271defb561437b1071fc25634096f0527','2025-11-15 13:42:26'),(7,2,2,NULL,NULL,'1fcae2d563206af5ca5434c07ae557a8dcedeec415dcef66','2025-12-10 17:32:23'),(8,1,1,NULL,NULL,'4c707c78eff34eb0915aebf73ec4357297eb4bed299d3dd4','2025-11-05 12:46:26'),(10,8,2,NULL,NULL,'66539cfb6fe23f5c56302d3420233f6f9ef067ea454f5bf3','2026-02-08 15:32:11'),(11,9,2,NULL,NULL,'4ad79da6119b8ef558c525671cee89a5f440539f9aa7f9a3','2026-02-09 15:14:23'),(14,27,23,NULL,NULL,'8e3011b37b9d9cc3d4c20c437c287fe7eba187494380f415','2026-02-08 18:49:51'),(15,28,23,NULL,NULL,'8d5b09c89c9479ac9afe7cfebb40c5d1a634b9e8f4988c4a','2026-02-09 08:23:36'),(16,25,23,NULL,NULL,'5f1f6dc1b806c4b78d5388c7f45257be5a0ab8457cf58ab0','2026-02-17 07:15:39'),(17,29,2,NULL,NULL,'1e43c22236c724014fc5a2b43948c36e4916711ec49fa57d','2026-02-09 01:31:37'),(19,31,23,NULL,NULL,'6497549f5256a5f46a7caf5220b1c091b20b1b56bf57f137','2026-02-09 09:58:55'),(20,32,23,NULL,NULL,'188d2e344ef99678160e232be805652f579383a78474d1c1','2026-02-09 14:56:05'),(21,33,23,NULL,NULL,'14a348a19d6402d07d5adf618a8eb32962b72a7ce13234ae','2026-02-14 14:28:13'),(22,34,23,NULL,NULL,'d2b9787690c0e8c27225c54f21e9884c918c14bb95781b5a','2026-02-09 19:18:11'),(23,35,23,NULL,NULL,'d6d3cffe91ed8714f04ffd453a8b2dfbe28fee04bed3de34','2026-02-09 22:20:59'),(24,37,23,NULL,NULL,'3858b4bf33d5273a547f4d010b65071a4f0ea18cfc780330','2026-02-10 11:03:25'),(25,38,23,NULL,NULL,'dd0558690ff2054720249e8124a6b62bcf856c14074b9601','2026-02-10 11:08:39'),(27,46,23,NULL,NULL,'c9539845304c63ebecd2df6f4079f10e5bbe0e495abc06ed','2026-02-15 13:32:49'),(28,48,23,NULL,NULL,'26fc5f98b5e2dbe6fefe0abf3b48ae9f5096a575464ea574','2026-02-16 10:42:38'),(29,49,23,NULL,NULL,'666e65750015068797178f1527c046dcece7e01933ed0d1d','2026-02-16 11:49:57'),(30,50,23,NULL,NULL,'75d02559c1b1036cc491609091d95a04e7b44a0bd8413bdb','2026-02-17 00:43:59'),(31,52,23,NULL,NULL,'8cbb5e554670814208589039fbab740b96ce013c2cdb5cec','2026-02-17 06:22:54'),(32,53,23,NULL,NULL,'a118ba5358c4553ffbb29a112d2e30bd3f18784c9b25d23c','2026-02-17 12:24:51'),(33,54,23,NULL,NULL,'3036aba7e5144ac62523f47a2bf460ec85f62da33a7fe501','2026-02-24 21:17:50'),(34,56,23,NULL,NULL,'3824167453b17585d0e0c0f4df099543e92898767cba054a','2026-02-21 11:59:13'),(39,63,23,NULL,NULL,'d8730bb781f463cdbafd5fcc6838e5b69352ad6255706882','2026-02-23 16:10:10'),(40,64,23,NULL,NULL,'bf2d4ed4fb7d91e1b7604ecfa7d7213b5cc8f3861dda3e71','2026-02-24 07:39:26'),(41,65,23,NULL,NULL,'85781cd844a4a2028848083d98dfb1f8e391929dc977ee3c','2026-02-24 10:56:56'),(43,67,23,NULL,NULL,'526a5e2ec36270613ed6e6cade6fec774e23cb23a7dde6ea','2026-02-25 09:14:34');

--
-- Table structure for table "batch_tags"
--

CREATE TABLE IF NOT EXISTS "batch_tags" (
  "id" INTEGER NOT NULL,
  "client_id" INTEGER DEFAULT NULL,
  "tag_id" INTEGER DEFAULT NULL,
  "batch_id" INTEGER DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT NULL
);

--
-- Dumping data for table "batch_tags"
--

--
-- Table structure for table "batches"
--

CREATE TABLE IF NOT EXISTS "batches" (
  "id" INTEGER NOT NULL,
  "name" varchar(64) DEFAULT NULL,
  "church_id" INTEGER DEFAULT NULL,
  "campus_id" INTEGER DEFAULT NULL,
  "status" char(1) DEFAULT 'U',
  "created_at" TIMESTAMP DEFAULT NULL,
  "committed_at" TIMESTAMP DEFAULT NULL
);

--
-- Dumping data for table "batches"
--

--
-- Table structure for table "campuses"
--

CREATE TABLE IF NOT EXISTS "campuses" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar(45) DEFAULT NULL,
  "address" varchar(45) DEFAULT NULL,
  "phone" varchar(45) DEFAULT NULL,
  "photo" text DEFAULT NULL,
  "description" varchar(45) DEFAULT NULL,
  "pastor" varchar(45) DEFAULT NULL,
  "church_id" INTEGER DEFAULT NULL,
  "cfeed_link" varchar(64) DEFAULT NULL,
  "token" varchar(32) DEFAULT NULL,
  "slug" varchar(150) DEFAULT NULL
);

--
-- Dumping data for table "campuses"
--

--
-- Table structure for table "chat_childs"
--

CREATE TABLE IF NOT EXISTS "chat_childs" (
  "id" INTEGER NOT NULL,
  "order" INTEGER DEFAULT NULL,
  "parent_id" INTEGER DEFAULT NULL,
  "child_id" INTEGER DEFAULT NULL
);

--
-- Dumping data for table "chat_childs"
--

--
-- Table structure for table "chat_customize_text"
--

CREATE TABLE IF NOT EXISTS "chat_customize_text" (
  "id" SERIAL PRIMARY KEY,
  "church_id" INTEGER NOT NULL,
  "campus_id" INTEGER DEFAULT NULL,
  "chat_tree_id" INTEGER NOT NULL,
  "customize_text" text DEFAULT NULL
);

--
-- Dumping data for table "chat_customize_text"
--

--
-- Table structure for table "chat_settings"
--

CREATE TABLE IF NOT EXISTS "chat_settings" (
  "id" SERIAL PRIMARY KEY,
  "client_id" INTEGER NOT NULL,
  "church_id" INTEGER NOT NULL,
  "campus_id" INTEGER DEFAULT NULL,
  "logo" text DEFAULT NULL,
  "theme_color" varchar(20) DEFAULT NULL,
  "button_text_color" varchar(20) DEFAULT NULL,
  "domain" varchar(150) DEFAULT NULL,
  "trigger_text" varchar(56) DEFAULT NULL,
  "debug_message" SMALLINT DEFAULT 0,
  "suggested_amounts" text DEFAULT NULL,
  "install_status_date" TIMESTAMP DEFAULT NULL,
  "install_status" char(1) DEFAULT NULL,
  "type_widget" varchar(50) DEFAULT 'standard',
  "conduit_funds" varchar(1000) DEFAULT NULL,
  "widget_position" varchar(50) DEFAULT 'bottom_right',
  "widget_x_adjust" decimal(10,2) DEFAULT 0.00,
  "widget_y_adjust" decimal(10,2) DEFAULT 0.00
);

--
-- Dumping data for table "chat_settings"
--

INSERT INTO "chat_settings" VALUES (1,1,1,NULL,'branding_logo/u1_ch1.jpg?v=1736453626','#000000','#ffffff','app.lunarpay.com','',0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(2,2,2,NULL,'branding_logo/u2_ch2.png?v=1735320509','#000000','#ffffff','apollo.inc','',0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(3,3,3,NULL,NULL,'#000000','#ffffff','marketing.biz/saas',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(4,4,4,NULL,NULL,'#000000','#ffffff',NULL,NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(5,5,5,NULL,NULL,'#000000','#ffffff',NULL,NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(6,6,6,NULL,NULL,'#000000','#ffffff',NULL,NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(7,7,7,NULL,NULL,'#000000','#ffffff',NULL,NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(8,8,8,NULL,'branding_logo/u8_ch8.png?v=1740411063','#000000','#ffffff','ethnoholdings.com','',0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(9,9,9,NULL,NULL,'#000000','#ffffff','marketing.biz','',0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(10,10,10,NULL,NULL,'#000000','#ffffff','www.nighthawkconsulting.biz','',0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(11,11,11,NULL,NULL,'#000000','#ffffff',NULL,NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(12,12,12,NULL,NULL,'#000000','#ffffff','marketing.biz',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(13,13,13,NULL,NULL,'#000000','#ffffff','apollo.inc',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(14,14,14,NULL,NULL,'#000000','#ffffff','apollo.com',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(15,15,15,NULL,NULL,'#000000','#ffffff','weightlloss4texas.com',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(16,16,16,NULL,NULL,'#000000','#ffffff',NULL,NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(17,17,17,NULL,NULL,'#000000','#ffffff',NULL,NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(18,18,18,NULL,NULL,'#000000','#ffffff',NULL,NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(19,19,19,NULL,NULL,'#000000','#ffffff','lunarpay.com',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(20,20,20,NULL,NULL,'#000000','#ffffff','lunarpay.com',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(21,21,21,NULL,NULL,'#000000','#ffffff','apollo.inc',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(22,22,22,NULL,NULL,'#000000','#ffffff','forextradingsignals.netlify.app',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00),(23,23,23,NULL,'branding_logo/u23_ch23.png?v=1754760283','#ff7800','#ffffff','leads.biz',NULL,0,'[\"10\",\"30\",\"50\",\"100\"]',NULL,NULL,'standard',NULL,'bottom_right',0.00,0.00);

--
-- Table structure for table "chat_tree"
--

CREATE TABLE IF NOT EXISTS "chat_tree" (
  "id" INTEGER NOT NULL,
  "order" INTEGER DEFAULT NULL,
  "type_set" varchar(128) DEFAULT NULL,
  "method_set" varchar(128) DEFAULT NULL,
  "set" varchar(128) DEFAULT NULL,
  "method_get" varchar(128) DEFAULT NULL,
  "type_get" varchar(100) DEFAULT NULL,
  "answer_type" varchar(128) DEFAULT NULL,
  "html" text DEFAULT NULL,
  "purpose" text DEFAULT NULL,
  "answer" varchar(24) DEFAULT NULL,
  "replace" text DEFAULT NULL,
  "back" SMALLINT DEFAULT 0,
  "dev" text DEFAULT NULL,
  "sessions" varchar(256) DEFAULT NULL,
  "is_text_customizable" SMALLINT DEFAULT 1,
  "is_session_enabled" SMALLINT DEFAULT 1,
  "session_enabled_id" INTEGER DEFAULT NULL
);

--
-- Dumping data for table "chat_tree"
--

INSERT INTO "chat_tree" VALUES (1,0,'start',NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,0,NULL,NULL,1,1,NULL),(2,30,'action','set_amount_gross_logged',NULL,'get_suggested_amounts','money_or_quickgive','money_or_quickgive','Hey [first_name], if you''d like to give to [org_name], choose an amount below or reply with a custom amount.','If donor is logged, amount to give request, use [first_name] to display first name of donor and [org_name] to display the organization name.','1','first_name,org_name',0,NULL,'amount,is_repeat_quickgive',1,1,NULL),(3,40,'action','set_identity',NULL,NULL,NULL,NULL,'Welcome, what''s your phone or email?','If donor isn''t logged, chat requests email or phone.','1',NULL,0,NULL,'identity',1,0,NULL),(5,60,'action','set','first_name',NULL,NULL,NULL,'Welcome! What''s your name?','Name request for account creation.','0',NULL,0,NULL,'first_name',1,0,NULL),(6,70,'auto_message',NULL,NULL,'register',NULL,NULL,'Hey [first_name], nice to meet you','Friendly message after set Name, use [first_name] to display the first name.','1','first_name',0,NULL,NULL,1,1,NULL),(10,10,'action','set','amount_gross','get_suggested_amounts','money','money','If you''d like to give to [org_name], choose an amount below or reply with a custom amount.','If donor isn''t logged, amount to give request','0','org_name',0,NULL,'amount_gross',1,0,2),(11,130,'action','set_fund',NULL,'get_funds','buttons',NULL,'Thank you for your generosity! Which fund would you like to give to?','Request of Fund.','1',NULL,1,NULL,'fund',1,1,NULL),(12,140,'action','set_recurrent',NULL,'get_recurring_options','buttons',NULL,'Great! Would you like to make this gift recurring?','Request if donor wants to make a recurring gift.','1',NULL,1,NULL,'recurring,chosen_frequency',1,1,NULL),(13,160,'action','set_recurrent_date',NULL,'recurring_date_form','form','date','Start Recurring Giving on:','If recurring gift doesn''t begin today, start recurring date calendar picker title.','0',NULL,0,NULL,'recurrent_date',1,1,NULL),(14,170,'action','set_payment_method',NULL,'get_payment_methods','buttons_methods',NULL,'Which payment method would you like to use today?','Request for payment method to make the gift.','2',NULL,0,NULL,'payment_method,is_exp_date,fee',1,1,NULL),(16,180,'form','payment_checking',NULL,'credit_card_form','no_send_form',NULL,'','New Payment Method, CC Form Title.','2',NULL,0,NULL,NULL,0,1,NULL),(17,200,'action','set_save_source',NULL,'get_yes_no_buttons','local_payment_form','yes_no','Would you like to save this for future use?','New Payment Method, request to save it for future.','1',NULL,1,NULL,'save_source',1,1,NULL),(18,220,'auto_message',NULL,NULL,'payment','validate_payment',NULL,'Your gift is being processed','Gift is being processed.','1',NULL,0,NULL,NULL,1,1,NULL),(19,230,'end',NULL,NULL,NULL,'end',NULL,'Payment processed! Thanks so much for your generosity!','Gift has been processed successfully.','1',NULL,0,NULL,NULL,1,1,NULL),(20,190,'form','payment_checking',NULL,'bank_account_form','no_send_form',NULL,'','New Payment Method, ACH Form Title.','3',NULL,0,NULL,NULL,0,1,NULL),(21,150,'action','is_recurring_today',NULL,'get_yes_no_buttons',NULL,'yes_no','Do you want your [chosen_frequency] gift to start today?','For recurring gift, request if recurring gift will begin today, use [chosen_frequency] to display chosen frequency by the donor.','1','chosen_frequency',1,NULL,'is_recurring_today',1,1,NULL),(25,210,'action','set_amount_fee',NULL,'get_yes_no_payments','payment_form','yes_no','Would you like to help by covering the $[fee] processing fee for [org_name]?','Request if donor wants to cover the fee, use [fee] to display the fee and [org_name] to display the organization name.','4','fee,org_name',0,NULL,'amount_fee',1,1,NULL),(27,114,'action','set_method_save',NULL,'get_methods_options','buttons',NULL,'Which payment method would you like to use today?','To add a new faster payment method, choose kind of method (CC or ACH).','1',NULL,0,NULL,'method_save',1,1,NULL),(29,118,'form_method',NULL,NULL,'save_credit_card_form','form_method',NULL,'','To add a new faster payment method, CC Form Title.','1',NULL,0,NULL,NULL,0,1,NULL),(30,119,'form_method',NULL,NULL,'save_bank_account_form','form_method',NULL,'','To add a new faster payment method, ACH Form Title.','2',NULL,0,NULL,NULL,0,1,NULL),(32,175,'form_exp_date','update_exp_date',NULL,'get_update_exp_form','form',NULL,'Your credit card has expired, please update your expiration date','Request to update expiration date of CC.','5',NULL,0,NULL,'exp_date_status,exp_date_message',1,1,NULL),(33,50,'action','set_security_code',NULL,NULL,NULL,NULL,'We have sent your security code, please enter it below.','Security Code request for login','1',NULL,0,NULL,NULL,1,0,NULL),(34,215,'action',NULL,NULL,'confirmation','confirmation',NULL,'We are ready to proccess your gift','Message awaiting final confirmation','2',NULL,0,NULL,NULL,1,1,NULL),(35,131,'action','set_fund_multiple',NULL,'get_funds_multiple','buttons',NULL,'Hey, you can give to several funds at the same time, which fund would you like to start giving to?','Request of Multiple Fund.','10',NULL,0,NULL,'',0,0,38),(36,132,'action','set_amount_to_fund',NULL,'get_suggested_amounts_multiple','money','money','Choose an amount below or reply with a custom amount.','Amount related to fund','11',NULL,0,NULL,'',0,1,NULL),(37,133,'action','check_continue_multiple_funds',NULL,'get_yes_no_buttons',NULL,'yes_no','Thank you for your generosity! Would you like to give to another fund?','Continue with multiple fund loop','11',NULL,0,NULL,'',0,1,NULL),(38,31,'action','set_fund_multiple',NULL,'get_funds_multiple_loop_quickgive','fund_or_quickgive',NULL,'Hey [first_name], you can give to several funds at the same time, which fund would you like to start giving to?','If donor is logged, on multiple fund widget, fund request to give','11','first_name',0,NULL,NULL,0,1,NULL),(39,135,'action','set_fund_multiple_loop',NULL,'get_funds_multiple_loop','buttons',NULL,'Thank you for your generosity! Which fund would you like to continue giving to?','Request of Multiple Fund Loop.','10',NULL,0,NULL,'',0,1,NULL);

--
-- Table structure for table "church_detail"
--

CREATE TABLE IF NOT EXISTS "church_detail" (
  "ch_id" INTEGER NOT NULL,
  "client_id" INTEGER NOT NULL,
  "church_name" varchar(100) NOT NULL,
  "legal_name" varchar(100) NOT NULL,
  "phone_no" varchar(128) NOT NULL,
  "website" varchar(100) NOT NULL,
  "email" varchar(300) DEFAULT NULL,
  "street_address" varchar(300) NOT NULL,
  "street_address_suite" varchar(300) NOT NULL,
  "city" varchar(100) NOT NULL,
  "state" varchar(100) NOT NULL,
  "postal" varchar(50) NOT NULL,
  "country" varchar(50) NOT NULL,
  "latitude" decimal(10,8) DEFAULT NULL,
  "longitude" decimal(11,8) DEFAULT NULL,
  "giving_type" text NOT NULL,
  "twilio_accountsid" varchar(50) DEFAULT NULL,
  "twilio_phonesid" varchar(50) DEFAULT NULL,
  "twilio_country_code" varchar(2) DEFAULT NULL,
  "twilio_country_number" varchar(7) DEFAULT NULL,
  "twilio_phoneno" varchar(15) DEFAULT NULL,
  "twilio_token" varchar(1032) DEFAULT NULL,
  "twilio_cancel_data" TEXT DEFAULT NULL,
  "sms_messaging_from" char(1) DEFAULT 'C',
  "logo" varchar(100) DEFAULT NULL,
  "color" varchar(100) DEFAULT NULL,
  "partnership" varchar(50) NOT NULL,
  "cover_fee" INTEGER NOT NULL DEFAULT 0,
  "cfeed_code" varchar(64) DEFAULT NULL,
  "epicpay_verification_status" char(1) DEFAULT 'N',
  "epicpay_credentials" varchar(500) DEFAULT NULL,
  "epicpay_id" INTEGER DEFAULT NULL,
  "epicpay_gateway_id" varchar(255) DEFAULT NULL,
  "txt_togive_with" varchar(2) DEFAULT 'EP',
  "epicpay_template" varchar(32) DEFAULT NULL,
  "fortis_template" varchar(255) NOT NULL DEFAULT 'lunarpayfr',
  "paysafe_template" varchar(128) DEFAULT NULL,
  "template_history" TEXT DEFAULT NULL,
  "tax_id" varchar(32) DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT NULL,
  "zapier_notify_not_completed" INTEGER DEFAULT NULL,
  "giving_type_json" text NOT NULL,
  "token" varchar(32) DEFAULT NULL,
  "trash" SMALLINT NOT NULL DEFAULT 0,
  "slug" varchar(150) DEFAULT NULL,
  "todo_notes" text DEFAULT NULL,
  "todo_action_required_by" text DEFAULT NULL,
  "todo_reference_date" date DEFAULT NULL
);

--
-- Dumping data for table "church_detail"
--

INSERT INTO "church_detail" VALUES (1,1,'ProdCompanyTest1','Legal name 1','','app.lunarpay.com',NULL,'St line 1','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2024-12-23 16:04:24',NULL,'','53ea44161e46dfe967fd5b4040fab25d',0,'prodcompanytest1',NULL,NULL,NULL),(2,2,'Apollo Eleven Inc','Apollo Eleven Inc','','apollo.inc',NULL,'3316 taunton way','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2024-12-26 15:34:12',NULL,'','1d9973f7f6322e42f5b69c4159282965',0,'apollo-eleven-inc',NULL,NULL,NULL),(3,3,'Marketing.biz','Marketing.biz Payments LLC','','marketing.biz/saas',NULL,'163 Town Pl','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2024-12-31 17:18:43',NULL,'','f1476a033a71ea30310f145f4d97e9f6',0,'marketing.biz',NULL,NULL,NULL),(4,4,'ELEV3N Records','','','',NULL,'','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-01-20 00:57:07',NULL,'','b5cd4811fb7e27d77e5aa628cf34af97',0,NULL,NULL,NULL,NULL),(5,5,'Indonesian Offensive Security','','','',NULL,'','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-01-20 03:03:49',NULL,'','7bc7e0028e9a37b08677f81b2f816d21',0,NULL,NULL,NULL,NULL),(6,6,'Jonathan','','','',NULL,'','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-01-23 09:50:25',NULL,'','357d2ea70d515f5630fa1c89022a9dea',0,NULL,NULL,NULL,NULL),(7,7,'Masters Touch, Inc.','','','',NULL,'','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-02-21 12:32:04',NULL,'','f51c8c04b77d9490927a1fa1019de2d8',0,NULL,NULL,NULL,NULL),(8,8,'Ethno Holdings','Ethno Holdings','','ethnoholdings.com',NULL,'980 moon deck trl','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-02-24 09:25:49',NULL,'','5fc0ac20a41f8bd065447e3cf8b59234',0,'ethno-holdings',NULL,NULL,NULL),(9,9,'Masters Touch, Inc.','Masters Touch, Inc.','','marketing.biz',NULL,'1409 Brentfield Dr','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-02-28 15:52:31',NULL,'','c827943bb0094c94e3795f1ab3fcdc62',0,'masters-touch,-inc.',NULL,NULL,NULL),(10,10,'Nighthawk Consulting LLC','Nighthawk Consulting LLC','','www.nighthawkconsulting.biz',NULL,'662 Sabine Creek Rd','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-03-14 08:55:32',NULL,'','bce929301df85f91cacc2c3c9ab6df58',0,'nighthawk-consulting-llc',NULL,NULL,NULL),(11,11,'Tetris','','','',NULL,'','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-03-23 06:30:02',NULL,'','e54345321fae742dbc6eb73cbcd4a085',0,NULL,NULL,NULL,NULL),(12,12,'Marketing.biz Payments LLC','Marketing.biz Payments LLC','','marketing.biz',NULL,'163 Town Pl','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-05-03 20:42:33',NULL,'','08e479dd3ad78f15ddcfa4c2740b5916',0,'marketing.biz-payments-llc',NULL,NULL,NULL),(13,13,'Prod company test','Test','','apollo.inc',NULL,'St','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-05-09 11:44:04',NULL,'','5032b5a4e83a3ccb0b5ecf818473e9f4',0,'prod-company-test',NULL,NULL,NULL),(14,14,'Prod Test App Company','Legal','','apollo.com',NULL,'St','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-05-12 15:35:13',NULL,'','6de42976a17c7439e73de9e02f610639',0,'prod-test-app-company',NULL,NULL,NULL),(15,15,'SozaClinic','ELTTAC INK','','weightlloss4texas.com',NULL,'1219 iowa rd','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-05-13 18:38:58',NULL,'','8a0f856ada1874741feb6b77e89c4128',0,'sozaclinic','We are waiting for the fortis webhook','payment_provider','2025-05-15'),(16,16,'Apollo Eleven inc.','','','',NULL,'','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-05-19 13:41:35',NULL,'','fa2c2a6a002c6d8ebda8c2f5cc8db620',0,NULL,NULL,NULL,NULL),(17,17,'Breath Stealers Music Academy','','','',NULL,'','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-05-26 06:09:32',NULL,'','8d7eba049bf1338fc342f721072c092b',0,NULL,NULL,NULL,NULL),(18,18,'Marketing.biz LLC','','','',NULL,'','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-05-29 10:30:46',NULL,'','c8381b7596a35bedc546db722072cb19',0,NULL,NULL,NULL,NULL),(19,19,'Test Prod Comp 2025-06-17','Test Prod Comp 2025-06-17','','lunarpay.com',NULL,'St1','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-06-17 10:52:29',NULL,'','38ccc9748634ea72c2ef4f02d2c3a497',0,'test-prod-comp-2025-06-17',NULL,NULL,NULL),(20,20,'Test Prod Comp 2025-06-17-2','Test prod comp 2025 06 17 2','','lunarpay.com',NULL,'St','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-06-17 12:35:56',NULL,'','c3e248631af11541daffaec645b86e05',0,'test-prod-comp-2025-06-17-2',NULL,NULL,NULL),(21,21,'Atlas Holdings','Altas Holdings LLC','','apollo.inc',NULL,'3316 taunton way','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-06-23 10:05:23',NULL,'','79e20b66cb7378069cab8848b6b61283',0,'atlas-holdings',NULL,NULL,NULL),(22,22,'Forex','Eusters','','forextradingsignals.netlify.app',NULL,'0797747587','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-06-29 10:08:35',NULL,'','c43bc7795e2a6401f10c1828ed71d307',0,'forex',NULL,NULL,NULL),(23,23,'Leads.biz LLC','Leads.biz LLC','','leads.biz',NULL,'3316 Taunton Way','','','','','',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'C',NULL,NULL,'',0,NULL,'N',NULL,NULL,NULL,'EP',NULL,'lunarpayfr',NULL,NULL,NULL,'2025-08-08 16:23:11',NULL,'','d9e84e6c8a020a682e1c9a4c7359eb45',0,'leads.biz-llc',NULL,NULL,NULL);

--
-- Table structure for table "church_onboard"
--

CREATE TABLE IF NOT EXISTS "church_onboard" (
  "id" SERIAL PRIMARY KEY,
  "church_id" INTEGER DEFAULT NULL,
  "processor" varchar(24) DEFAULT NULL,
  "processor_response" text DEFAULT NULL,
  "business_category" varchar(64) DEFAULT NULL,
  "business_type" varchar(64) DEFAULT NULL,
  "business_description" varchar(200) DEFAULT NULL,
  "ownership_type" varchar(16) DEFAULT NULL,
  "swiped_percent" varchar(3) DEFAULT NULL,
  "keyed_percent" varchar(3) DEFAULT NULL,
  "ecommerce_percent" varchar(3) DEFAULT NULL,
  "cc_monthly_volume_range" varchar(3) DEFAULT NULL,
  "cc_avg_ticket_range" varchar(3) DEFAULT NULL,
  "cc_high_ticket" INTEGER DEFAULT NULL,
  "ec_monthly_volume_range" varchar(3) DEFAULT NULL,
  "ec_avg_ticket_range" varchar(3) DEFAULT NULL,
  "ec_high_ticket" INTEGER DEFAULT NULL,
  "sign_first_name" varchar(20) DEFAULT NULL,
  "sign_last_name" varchar(20) DEFAULT NULL,
  "sign_date_of_birth" date DEFAULT NULL,
  "sign_phone_number" varchar(20) DEFAULT NULL,
  "sign_ssn" varchar(4) DEFAULT NULL,
  "sign_title" varchar(20) DEFAULT NULL,
  "sign_ownership_percent" varchar(3) DEFAULT NULL,
  "sign_state_province" varchar(20) DEFAULT NULL,
  "sign_city" varchar(20) DEFAULT NULL,
  "sign_postal_code" varchar(10) DEFAULT NULL,
  "sign_address_line_1" varchar(100) DEFAULT NULL,
  "sign_address_line_2" varchar(100) DEFAULT NULL,
  "routing_number_last4" varchar(4) DEFAULT NULL,
  "account_number_last4" varchar(4) DEFAULT NULL,
  "account_holder_name" varchar(40) DEFAULT NULL
);

--
-- Dumping data for table "church_onboard"
--

--
-- Table structure for table "church_onboard_crypto"
--

CREATE TABLE IF NOT EXISTS "church_onboard_crypto" (
  "id" SERIAL PRIMARY KEY,
  "church_id" INTEGER NOT NULL,
  "active" SMALLINT DEFAULT NULL,
  "account_id" varchar(128) DEFAULT NULL,
  "merchant_name" varchar(100) DEFAULT NULL,
  "api_requests" text DEFAULT NULL,
  "api_responses" text DEFAULT NULL
);

--
-- Dumping data for table "church_onboard_crypto"
--

--
-- Table structure for table "church_onboard_fortis"
--

CREATE TABLE IF NOT EXISTS "church_onboard_fortis" (
  "id" SERIAL PRIMARY KEY,
  "church_id" INTEGER DEFAULT NULL,
  "sign_first_name" varchar(20) DEFAULT NULL,
  "sign_last_name" varchar(20) DEFAULT NULL,
  "sign_phone_number" varchar(20) DEFAULT NULL,
  "email" varchar(128) DEFAULT NULL,
  "merchant_state" varchar(2) DEFAULT NULL,
  "merchant_city" varchar(50) DEFAULT NULL,
  "merchant_postal_code" varchar(10) DEFAULT NULL,
  "merchant_address_line_1" varchar(100) DEFAULT NULL,
  "app_status" VARCHAR(255) DEFAULT NULL,
  "mpa_link" varchar(512) DEFAULT NULL,
  "processor_response" text DEFAULT NULL,
  "credentials" varchar(500) DEFAULT NULL,
  "location_id" varchar(64) DEFAULT NULL,
  "cc_product_transaction_id" varchar(64) DEFAULT NULL,
  "cc_webhook_resp_status" text DEFAULT NULL,
  "ach_product_transaction_id" varchar(64) DEFAULT NULL,
  "ach_webhook_resp_status" text DEFAULT NULL,
  "account_number_last4" varchar(4) DEFAULT NULL,
  "routing_number_last4" varchar(4) DEFAULT NULL,
  "account_holder_name" varchar(40) DEFAULT NULL,
  "account2_number_last4" varchar(4) DEFAULT NULL,
  "routing2_number_last4" varchar(4) DEFAULT NULL,
  "account2_holder_name" varchar(40) DEFAULT NULL
);

--
-- Dumping data for table "church_onboard_fortis"
--

INSERT INTO "church_onboard_fortis" VALUES (1,1,'Juan','Gomez','3006009000','juan@marketing.biz','TX','Dallas','73000','St line 1','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/43513624-d110-44f5-85c3-5f5c45025503','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/43513624-d110-44f5-85c3-5f5c45025503\",\"client_app_id\":\"1\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"ProdCompanyTest1\",\"email\":\"juan@marketing.biz\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'0123','3093','Juan Test Prod','0123','3093','Juan Test Prod'),(2,2,'Jonathan','Bodnar','4699078539','jonathan@apollo.inc','TX','Mckinney','75069','3316 Taunton way','ACTIVE','https://mpa.epicpay.com/clearapp/go/976f19d3-e9c4-4f17-ac51-59e634c14e9c','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/976f19d3-e9c4-4f17-ac51-59e634c14e9c\",\"client_app_id\":\"2\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Apollo Eleven Inc\",\"email\":\"jonathan@apollo.inc\"}}','9159493aa1d36f5b44eba89e8de81756c5a3e03687a8e7b408942442caf0d3b794becdf9b0dd9167b1908dc1c1bd4e44388398c0bd640c1f442a12f38fd198fc9XeCGqo8J6JcsuPrxU6YFKs1jrL3BzAPhJwnVTK3GA81YCedfED+Fpgu9yvzS6uj5yXXbj0isSC2ENppobkbudY2PnZf1M+vcxRlMjvnNTAwhKg3KejdK+p+P7b9uOzJ','11efc6d85288cf1aaa096bfc','11efc6dbad5836088038e207',NULL,'11efc6d8cf81fa78951b3915',NULL,'5535','0614','Apollo Eleven Inc','5535','0614','Apollo Eleven Inc'),(3,3,'Jonathan','Bodnar','4699078539','jb@marketing.biz','TX','Fairview','75069','163 Town Pl','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/d09230f3-c83a-4ed7-9607-85cbee77e54f','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/d09230f3-c83a-4ed7-9607-85cbee77e54f\",\"client_app_id\":\"3\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Marketing.biz\",\"email\":\"jb@marketing.biz\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'4633','9588','Marketing.biz Payments Llc','4633','9588','Marketing.biz Payments Llc'),(4,4,'Liam','','6132819107','liamtodd@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,5,'Jivk','Ryujinx','+62813360605321','ryujinx@wearehackerone.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,6,'Jonathan','Bagwell','7208181289','jonathanbagwell23@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,7,'Caleb','Mitchell','2143851075','calebmitcheltx@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,8,'Cherice','Stoltzfus','6823653869','cherice@ethnoholdings.com','TX','Lucas','75002','980 moon deck trl','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/3c877708-74e9-4040-a012-6ee3ebf371b4','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/3c877708-74e9-4040-a012-6ee3ebf371b4\",\"client_app_id\":\"8\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Ethno Holdings\",\"email\":\"cherice@ethnoholdings.com\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'1063','0659','111900659','1063','0659','111900659'),(9,9,'Caleb','Mitchell','(214) 385-1075','calebmitchelltx@gmail.com','TX','Anna','75409','1409 Brentfield Dr','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/7f8a5e09-f2b1-46e9-b843-961ea0a25a0a','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/7f8a5e09-f2b1-46e9-b843-961ea0a25a0a\",\"client_app_id\":\"9\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Masters Touch, Inc.\",\"email\":\"calebmitchelltx@gmail.com\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'3942','0025','Masters Touch, Inc.','1182','0025','Caleb Mitchell'),(10,10,'Jake','Baxter','2142366479','jake@nhsolutions.org','TX','Royse City','75189','662 Sabine Creek Rd','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/7df189c4-2cb5-4553-b315-6ad6558014a0','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/7df189c4-2cb5-4553-b315-6ad6558014a0\",\"client_app_id\":\"10\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Nighthawk Consulting LLC\",\"email\":\"jakebaxter315@gmail.com\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'7103','1975','Nighthawk Consulting Llc','8361','1975','Jake Baxter'),(11,11,'ümit','Aras','595043149','umit.aras96@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,12,'Jonathan','Bodnar','4699078539','jb@apollo.inc','TX','Fairview','75069','163 Town Pl','ACTIVE','https://mpa.epicpay.com/clearapp/go/b2fe2e33-691d-4a62-96a3-eca96b5a7604','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/b2fe2e33-691d-4a62-96a3-eca96b5a7604\",\"client_app_id\":\"12\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Marketing.biz Payments LLC\",\"email\":\"jb@apollo.inc\"}}','9c7e6f96226c401f48941d65a33346e8394dc001783e2decddd043f752bf4878e1fd4c4b89e8e4b45c779c0ae5652be923c35550a675f3cab7a6ce22ceed1e02j8wqBScC+ryFwRclp5ooWLDvEmISq6syAV28Scgg8qjLDJ0ZCJh/7KbAqDTaHTNn7bHI8AjSoc1o1RbtnFy33YwhxbRjNSfAmYGoF/5twgkUxEl9tMMbmLW3zdF3xnjV','31f04e1b30827e96a2b1f660','31f04e1b32988aae9f756f5d',NULL,'31f04e1b34cb4474b5bb83ab',NULL,'8548','9588','Jonathan Bodnar','8548','9588','Jonathan Bodnar'),(13,13,'Juan','Gomez','3006009000','juan@lunarpay.io','TX','Texas','73001','St','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/bd89b5f9-ebf3-49bf-bad8-8855987e38b8','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/bd89b5f9-ebf3-49bf-bad8-8855987e38b8\",\"client_app_id\":\"13\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Prod company test\",\"email\":\"juan@lunarpay.io\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'0123','3093','Juan Gomez','0123','3093','Juan Gomez'),(14,14,'Juan','Gomez','3006009000','juan@apolloapps.com','TX','Dallas','73002','St','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/98efccd3-d8eb-43e5-85d0-292817b26ba2','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/98efccd3-d8eb-43e5-85d0-292817b26ba2\",\"client_app_id\":\"14\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Prod Test App Company\",\"email\":\"juan@apolloapps.com\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'0123','3093','Juan Gomez','0123','3093','Juan Gomez'),(15,15,'Edward','Gonzales','901-237-7472','edg@sozaclinic.com','TX','Murphy ','75094','1219 iowa rd ','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/9b7a8945-ba61-47be-b0fe-df192eba658a','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/9b7a8945-ba61-47be-b0fe-df192eba658a\",\"client_app_id\":\"15\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"SozaClinic\",\"email\":\"edg@sozaclinic.com\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'0595','0614','Edward Gonzales','0595','0614','Edward Gonzales'),(16,16,'Jonathan','Bodnar','4699078539','jonathqweqwean@lunarpay.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,17,'Prasanna','','9972620273','breathstealersworld@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,18,'Jonathan','Bodnar','4699078539','jonathantest@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(19,19,'Juan','Gmz','3006009000','pablogmzc@outlook.com','TX','Dallas','73001','St1','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/5a71352e-2dc1-4657-a351-8ee903074e66','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/5a71352e-2dc1-4657-a351-8ee903074e66\",\"client_app_id\":\"19\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Test Prod Comp 2025-06-17\",\"email\":\"pablogmzc@outlook.com\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'0123','3093','Juan Gmz','0123','3093','Juan Gmz'),(20,20,'Juan','Gmz','3006009000','juan@lunarpay.com','TX','Dallas','73001','St','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/18dac526-ee78-4cbe-b2fe-8fe39d8896b9','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/18dac526-ee78-4cbe-b2fe-8fe39d8896b9\",\"client_app_id\":\"20\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Test Prod Comp 2025-06-17-2\",\"email\":\"juan@lunarpay.com\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'0123','3093','Jgmez','0123','3093','Jgmez'),(21,21,'Jonathan','Bodnar','4692079703','atlas@apollo.inc','TX','MCKINNEY','75069','3316 taunton way','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/e505e491-50dd-4dc3-a0ef-5b87fc118f87','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/e505e491-50dd-4dc3-a0ef-5b87fc118f87\",\"client_app_id\":\"21\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Atlas Holdings\",\"email\":\"atlas@apollo.inc\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'8889','9588','Altas Holdings Llc','8889','9588','Altas Holdings Llc'),(22,22,'Eusters','Andalo','0707191729','eustersshikol@gmail.com','MT','Nairobi','00500','0797747587','BANK_INFORMATION_SENT','https://mpa.epicpay.com/clearapp/go/4fa9712c-f6ac-43bd-844c-77e3cf70b375','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/4fa9712c-f6ac-43bd-844c-77e3cf70b375\",\"client_app_id\":\"22\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Forex\",\"email\":\"eustersshikol@gmail.com\"}}',NULL,NULL,NULL,NULL,NULL,NULL,'9065','3233','Eusters','9065','3233','Eusters'),(23,23,'Jonathan','Bodnar','4692079703','jb@leads.biz','TX','Mckinney','75069','3316 Taunton Way ','ACTIVE','https://mpa.epicpay.com/clearapp/go/49f0a7e9-6f98-4b5b-a41c-eea8f5b8c0ea','{\"type\":\"Onboarding\",\"data\":{\"app_link\":\"https:\\/\\/mpa.epicpay.com\\/clearapp\\/go\\/49f0a7e9-6f98-4b5b-a41c-eea8f5b8c0ea\",\"client_app_id\":\"23\",\"app_delivery\":\"link_iframe\",\"dba_name\":\"Leads.biz LLC\",\"email\":\"jb@leads.biz\"}}','c60cf34ee11f115712aa2f8f3b54a32cedd8de85c01a7a7fa43e84a6742f40a369c089e9138faffefa85542b76999d4fa170b98ec92ff49d4601edcf8acff5757/Aafll+bTtuLCFq7fu8XqTgUE3RS+PolzzgGw2z7Ko7igR2Zc0tMhTsfNpLGAABvqJZPkUCvAMB/KyWPwdd1t7P8SI/xVE1UPqHYMEV5+lP0YLB7hiial5DfpOk21EX','31f0779bf29fa89c83583d82','31f0779bf4ffca2281cb1b12',NULL,'31f0779bf728943c83e4b357',NULL,'4483','9588','Leads.biz Llc','4483','9588','Leads.biz Llc');

--
-- Table structure for table "church_onboard_paysafe"
--

CREATE TABLE IF NOT EXISTS "church_onboard_paysafe" (
  "id" SERIAL PRIMARY KEY,
  "church_id" INTEGER NOT NULL,
  "merchant_name" varchar(100) DEFAULT NULL,
  "currency" varchar(3) DEFAULT 'USD',
  "merchant_id" varchar(255) DEFAULT NULL,
  "account_id" varchar(255) DEFAULT NULL,
  "account_id2" varchar(255) DEFAULT NULL,
  "account_id3" varchar(255) DEFAULT NULL,
  "account_id4" varchar(255) DEFAULT NULL,
  "account_id5" varchar(255) DEFAULT NULL,
  "account_id6" varchar(255) DEFAULT NULL,
  "business_owner_id" varchar(255) DEFAULT NULL,
  "business_owner_id2" varchar(255) DEFAULT NULL,
  "business_owner2_id" varchar(255) DEFAULT NULL,
  "business_owner2_id2" varchar(255) DEFAULT NULL,
  "bank_id" varchar(255) DEFAULT NULL,
  "bank_id2" varchar(255) DEFAULT NULL,
  "terms_conditions_1" TEXT DEFAULT NULL,
  "terms_conditions_1_ver" varchar(12) DEFAULT NULL,
  "terms_conditions_2" TEXT DEFAULT NULL,
  "terms_conditions_2_ver" varchar(12) DEFAULT NULL,
  "terms_conditions_acceptance_id" varchar(255) DEFAULT NULL,
  "terms_conditions_acceptance_id2" varchar(255) DEFAULT NULL,
  "terms_conditions_meta" text DEFAULT NULL,
  "terms_conditions_meta2" text DEFAULT NULL,
  "bank_microdeposit_id" varchar(50) DEFAULT NULL,
  "bank_microdeposit_id2" varchar(50) DEFAULT NULL,
  "validation_amount" varchar(4) DEFAULT NULL,
  "bank_status" varchar(50) DEFAULT NULL,
  "bank_status_blocked" text DEFAULT NULL,
  "bank_status2" varchar(50) DEFAULT NULL,
  "bank_status2_blocked" text DEFAULT NULL,
  "bank_status_meta" text DEFAULT NULL,
  "bank_status2_meta" text DEFAULT NULL,
  "user" text DEFAULT NULL,
  "user2" text DEFAULT NULL,
  "activation_request_response" text DEFAULT NULL,
  "activation_request_response2" text DEFAULT NULL,
  "status_reason" varchar(50) DEFAULT NULL,
  "status_reason2" varchar(50) DEFAULT NULL,
  "account_status" varchar(50) DEFAULT NULL,
  "account_status2" varchar(50) DEFAULT NULL,
  "merchant_requests" text DEFAULT NULL,
  "merchant_responses" TEXT DEFAULT NULL,
  "region" varchar(2) DEFAULT NULL,
  "business_category" varchar(32) DEFAULT NULL,
  "yearly_volume_range" varchar(16) DEFAULT NULL,
  "average_transaction_amount" INTEGER DEFAULT NULL,
  "dynamic_descriptor" varchar(32) DEFAULT NULL,
  "phone_descriptor" varchar(13) DEFAULT NULL,
  "business_type" varchar(32) DEFAULT NULL,
  "federal_tax_number" varchar(32) DEFAULT NULL,
  "registration_number" varchar(32) DEFAULT NULL,
  "trading_country" varchar(2) DEFAULT NULL,
  "trading_state" varchar(2) DEFAULT NULL,
  "trading_city" varchar(50) DEFAULT NULL,
  "trading_address_line_1" varchar(512) DEFAULT NULL,
  "trading_address_line_2" varchar(512) DEFAULT NULL,
  "trading_zip" varchar(16) DEFAULT NULL,
  "owner_first_name" varchar(128) DEFAULT NULL,
  "owner_last_name" varchar(128) DEFAULT NULL,
  "owner_title" varchar(128) DEFAULT NULL,
  "owner_phone" varchar(64) DEFAULT NULL,
  "owner_is_european" char(3) DEFAULT NULL,
  "owner_nationality" varchar(2) DEFAULT NULL,
  "owner_gender" varchar(1) DEFAULT NULL,
  "owner_birth" date DEFAULT NULL,
  "owner_ssn" varchar(15) DEFAULT NULL,
  "owner_current_country" varchar(2) DEFAULT NULL,
  "owner_current_state" varchar(2) DEFAULT NULL,
  "owner_current_city" varchar(50) DEFAULT NULL,
  "owner_current_zip" varchar(16) DEFAULT NULL,
  "owner_current_address_line_1" varchar(512) DEFAULT NULL,
  "owner_current_address_line_2" varchar(512) DEFAULT NULL,
  "years_at_address" varchar(2) DEFAULT NULL,
  "owner_previous_country" varchar(2) DEFAULT NULL,
  "owner_previous_state" varchar(2) DEFAULT NULL,
  "owner_previous_city" varchar(50) DEFAULT NULL,
  "owner_previous_zip" varchar(16) DEFAULT NULL,
  "owner_previous_address_line_1" varchar(512) DEFAULT NULL,
  "owner_previous_address_line_2" varchar(512) DEFAULT NULL,
  "owner_is_applicant" SMALLINT DEFAULT 0,
  "owner_is_control_prong" SMALLINT DEFAULT 0,
  "owner2_first_name" varchar(128) DEFAULT NULL,
  "owner2_last_name" varchar(128) DEFAULT NULL,
  "owner2_title" varchar(128) DEFAULT NULL,
  "owner2_phone" varchar(64) DEFAULT NULL,
  "owner2_is_european" char(3) DEFAULT NULL,
  "owner2_nationality" varchar(2) DEFAULT NULL,
  "owner2_gender" varchar(1) DEFAULT NULL,
  "owner2_birth" date DEFAULT NULL,
  "owner2_ssn" varchar(15) DEFAULT NULL,
  "owner2_current_country" varchar(2) DEFAULT NULL,
  "owner2_current_state" varchar(2) DEFAULT NULL,
  "owner2_current_city" varchar(50) DEFAULT NULL,
  "owner2_current_zip" varchar(16) DEFAULT NULL,
  "owner2_current_address_line_1" varchar(512) DEFAULT NULL,
  "owner2_current_address_line_2" varchar(512) DEFAULT NULL,
  "years_at_address2" varchar(2) DEFAULT NULL,
  "owner2_previous_country" varchar(2) DEFAULT NULL,
  "owner2_previous_state" varchar(2) DEFAULT NULL,
  "owner2_previous_city" varchar(50) DEFAULT NULL,
  "owner2_previous_zip" varchar(16) DEFAULT NULL,
  "owner2_previous_address_line_1" varchar(512) DEFAULT NULL,
  "owner2_previous_address_line_2" varchar(512) DEFAULT NULL,
  "owner2_is_applicant" SMALLINT DEFAULT 0,
  "owner2_is_control_prong" SMALLINT DEFAULT 0,
  "euidcard_number2" varchar(30) DEFAULT NULL,
  "euidcard_country_of_issue2" varchar(2) DEFAULT NULL,
  "euidcard_expiry_date2" date DEFAULT NULL,
  "euidcard_number_line_12" varchar(30) DEFAULT NULL,
  "euidcard_number_line_22" varchar(30) DEFAULT NULL,
  "euidcard_number_line_32" varchar(30) DEFAULT NULL,
  "euidcard_number" varchar(30) DEFAULT NULL,
  "euidcard_country_of_issue" varchar(2) DEFAULT NULL,
  "euidcard_expiry_date" date DEFAULT NULL,
  "euidcard_number_line_1" varchar(30) DEFAULT NULL,
  "euidcard_number_line_2" varchar(30) DEFAULT NULL,
  "euidcard_number_line_3" varchar(30) DEFAULT NULL,
  "routing_number_last4" varchar(4) DEFAULT NULL,
  "account_number_last4" varchar(4) DEFAULT NULL,
  "backoffice_username" varchar(100) DEFAULT NULL,
  "backoffice_email" varchar(255) DEFAULT NULL,
  "backoffice_hash" varchar(500) DEFAULT NULL,
  "backoffice_recovery_question" text DEFAULT NULL,
  "bank_type" varchar(100) DEFAULT NULL
);

--
-- Dumping data for table "church_onboard_paysafe"
--

--
-- Table structure for table "code_security"
--

CREATE TABLE IF NOT EXISTS "code_security" (
  "id" SERIAL PRIMARY KEY,
  "user_identity" varchar(256) DEFAULT NULL,
  "code" varchar(6) DEFAULT NULL
);

--
-- Dumping data for table "code_security"
--

INSERT INTO "code_security" VALUES (16,'infolegacyassurancegroup@gmail.com','50162'),(17,'Zitavious471@gmail.com','95684'),(18,'convertiqo@gmail.com','31698'),(20,'juan2@marketing.biz','92731');

--
-- Table structure for table "communication"
--

CREATE TABLE IF NOT EXISTS "communication" (
  "id" INTEGER NOT NULL,
  "sid" varchar(128) NOT NULL DEFAULT '0',
  "user_id" INTEGER DEFAULT NULL,
  "client_id" INTEGER DEFAULT NULL,
  "from" varchar(128) DEFAULT NULL,
  "to" varchar(128) DEFAULT NULL,
  "text" TEXT DEFAULT NULL,
  "direction" char(1) DEFAULT NULL,
  "sms_status" varchar(32) DEFAULT NULL,
  "message_status" varchar(32) DEFAULT NULL,
  "received_payload" text DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "callback_at" TIMESTAMP DEFAULT NULL
);

--
-- Dumping data for table "communication"
--

--
-- Table structure for table "epicpay_customer_sources"
--

CREATE TABLE IF NOT EXISTS "epicpay_customer_sources" (
  "id" INTEGER NOT NULL,
  "customer_id" INTEGER DEFAULT NULL,
  "church_id" INTEGER DEFAULT NULL,
  "account_donor_id" INTEGER DEFAULT NULL,
  "source_type" varchar(50) DEFAULT NULL,
  "bank_type" varchar(5) DEFAULT NULL,
  "exp_month" char(2) DEFAULT NULL,
  "exp_year" char(4) DEFAULT NULL,
  "last_digits" char(6) DEFAULT NULL,
  "src_account_type" varchar(16) DEFAULT NULL,
  "postal_code" varchar(16) DEFAULT NULL,
  "name_holder" varchar(255) DEFAULT NULL,
  "bank_name" varchar(255) DEFAULT NULL,
  "epicpay_wallet_id" varchar(50) DEFAULT NULL,
  "epicpay_customer_id" varchar(50) DEFAULT NULL,
  "is_active" char(1) DEFAULT 'Y',
  "is_saved" char(1) DEFAULT 'N',
  "request_data" TEXT DEFAULT NULL,
  "request_response" TEXT DEFAULT NULL,
  "request_data_update" TEXT DEFAULT NULL,
  "request_response_update" TEXT DEFAULT NULL,
  "response_delete" text DEFAULT NULL,
  "status" char(1) DEFAULT 'U',
  "migrated" char(1) DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT NULL,
  "updated_at" TIMESTAMP DEFAULT NULL,
  "src" varchar(50) DEFAULT NULL,
  "template" varchar(50) DEFAULT NULL,
  "from_stripemigration_sid" INTEGER DEFAULT NULL,
  "done_temp" SMALLINT DEFAULT NULL,
  "from_stripemigration_onetime" INTEGER DEFAULT NULL,
  "ask_wallet_update" SMALLINT DEFAULT NULL,
  "ispaysafe" SMALLINT DEFAULT NULL,
  "paysafe_source_id" varchar(50) DEFAULT NULL,
  "paysafe_billing_address_id" varchar(50) DEFAULT NULL,
  "paysafe_billing_address" text DEFAULT NULL
);

--
-- Dumping data for table "epicpay_customer_sources"
--

INSERT INTO "epicpay_customer_sources" VALUES (1,1,2,2,'card',NULL,'11','25','1111','visa',NULL,'jgmez',NULL,'31f03e2da944f398855b128f','11efc6da833b85e2b082446a','Y','Y',NULL,'{\"@action\":\"tokenization\",\"id\":\"31f03e2da944f398855b128f\",\"payment_method\":\"cc\",\"title\":null,\"account_holder_name\":\"jgmez\",\"first_six\":\"411111\",\"last_four\":\"1111\",\"exp_date\":\"1125\",\"account_type\":\"visa\",\"created_ts\":1748702628,\"modified_ts\":1748702628,\"account_vault_api_id\":null,\"contact_id\":null,\"location_id\":\"11efc6d85288cf1aaa096bfc\",\"expiring_in_months\":7,\"has_recurring\":false,\"accountvault_c1\":null,\"accountvault_c2\":null,\"accountvault_c3\":null,\"active\":true,\"ach_sec_code\":null,\"customer_id\":null,\"cau_summary_status_id\":0,\"cau_last_updated_ts\":null,\"card_bin\":null,\"created_user_id\":\"11efc6da833b85e2b082446a\",\"token_import_id\":null,\"acs_transaction_id\":null,\"routing_number\":null,\"token_api_id\":null,\"token_c1\":null,\"token_c2\":null,\"token_c3\":null,\"identity_verification\":{\"dl_number\":null,\"dl_state\":null,\"ssn4\":null,\"dob_year\":null}}',NULL,NULL,NULL,'P',NULL,'2025-05-31 09:43:48','2025-05-31 09:43:48',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,2,2,9,'card',NULL,'06','27','4112','visa',NULL,'Juan Gomez',NULL,'31f059232d4b34da94fc159b','11efc6da833b85e2b082446a','N','Y',NULL,'{\"@action\":\"tokenization\",\"id\":\"31f059232d4b34da94fc159b\",\"payment_method\":\"cc\",\"title\":null,\"account_holder_name\":\"Juan Gomez\",\"first_six\":\"409355\",\"last_four\":\"4112\",\"exp_date\":\"0627\",\"account_type\":\"visa\",\"created_ts\":1751666806,\"modified_ts\":1751666806,\"account_vault_api_id\":null,\"contact_id\":null,\"location_id\":\"11efc6d85288cf1aaa096bfc\",\"expiring_in_months\":23,\"has_recurring\":false,\"accountvault_c1\":null,\"accountvault_c2\":null,\"accountvault_c3\":null,\"active\":true,\"ach_sec_code\":null,\"customer_id\":null,\"cau_summary_status_id\":0,\"cau_last_updated_ts\":null,\"card_bin\":\"40935500\",\"created_user_id\":\"11efc6da833b85e2b082446a\",\"token_import_id\":null,\"acs_transaction_id\":null,\"routing_number\":null,\"token_api_id\":null,\"token_c1\":null,\"token_c2\":null,\"token_c3\":null,\"identity_verification\":{\"dl_number\":null,\"dl_state\":null,\"ssn4\":null,\"dob_year\":null}}',NULL,NULL,'{\n    \"error\": 0,\n    \"response\": null\n}','D',NULL,'2025-07-04 17:06:47','2025-07-04 17:16:21',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,2,2,9,'card',NULL,'06','27','4112','visa',NULL,'Juan Gomez',NULL,'31f0592508f94566805d7d84','11efc6da833b85e2b082446a','N','Y',NULL,'{\"@action\":\"tokenization\",\"id\":\"31f0592508f94566805d7d84\",\"payment_method\":\"cc\",\"title\":null,\"account_holder_name\":\"Juan Gomez\",\"first_six\":\"409355\",\"last_four\":\"4112\",\"exp_date\":\"0627\",\"account_type\":\"visa\",\"created_ts\":1751667604,\"modified_ts\":1751667604,\"account_vault_api_id\":null,\"contact_id\":null,\"location_id\":\"11efc6d85288cf1aaa096bfc\",\"expiring_in_months\":23,\"has_recurring\":false,\"accountvault_c1\":null,\"accountvault_c2\":null,\"accountvault_c3\":null,\"active\":true,\"ach_sec_code\":null,\"customer_id\":null,\"cau_summary_status_id\":0,\"cau_last_updated_ts\":null,\"card_bin\":\"40935500\",\"created_user_id\":\"11efc6da833b85e2b082446a\",\"token_import_id\":null,\"acs_transaction_id\":null,\"routing_number\":null,\"token_api_id\":null,\"token_c1\":null,\"token_c2\":null,\"token_c3\":null,\"identity_verification\":{\"dl_number\":null,\"dl_state\":null,\"ssn4\":null,\"dob_year\":null}}',NULL,NULL,'{\n    \"error\": 0,\n    \"response\": null\n}','D',NULL,'2025-07-04 17:20:05','2025-07-22 23:14:47',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,3,23,32,'card',NULL,'05','29','8225','visa',NULL,'Jonathan Bodnar',NULL,'31f078688af78c96b37822cf','31f0779bfa7eb328a422a269','Y','Y',NULL,'{\"@action\":\"tokenization\",\"id\":\"31f078688af78c96b37822cf\",\"payment_method\":\"cc\",\"title\":null,\"account_holder_name\":\"Jonathan Bodnar\",\"first_six\":\"435478\",\"last_four\":\"8225\",\"exp_date\":\"0529\",\"account_type\":\"visa\",\"created_ts\":1755105085,\"modified_ts\":1755105085,\"account_vault_api_id\":null,\"contact_id\":null,\"location_id\":\"31f0779bf29fa89c83583d82\",\"expiring_in_months\":45,\"has_recurring\":false,\"accountvault_c1\":null,\"accountvault_c2\":null,\"accountvault_c3\":null,\"active\":true,\"ach_sec_code\":null,\"customer_id\":null,\"cau_summary_status_id\":0,\"cau_last_updated_ts\":null,\"card_bin\":\"43547800\",\"created_user_id\":\"31f0779bfa7eb328a422a269\",\"token_import_id\":null,\"acs_transaction_id\":null,\"routing_number\":null,\"token_api_id\":null,\"token_c1\":null,\"token_c2\":null,\"token_c3\":null,\"identity_verification\":{\"dl_number\":null,\"dl_state\":null,\"ssn4\":null,\"dob_year\":null}}',NULL,NULL,NULL,'P',NULL,'2025-08-13 12:11:25','2025-08-13 12:11:25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,4,23,30,'card',NULL,'11','25','1111','visa',NULL,'jgmez',NULL,'31f0786ca28ec51eb99b4161','31f0779bfa7eb328a422a269','Y','Y',NULL,'{\"@action\":\"tokenization\",\"id\":\"31f0786ca28ec51eb99b4161\",\"payment_method\":\"cc\",\"title\":null,\"account_holder_name\":\"jgmez\",\"first_six\":\"411111\",\"last_four\":\"1111\",\"exp_date\":\"1125\",\"account_type\":\"visa\",\"created_ts\":1755106842,\"modified_ts\":1755106842,\"account_vault_api_id\":null,\"contact_id\":null,\"location_id\":\"31f0779bf29fa89c83583d82\",\"expiring_in_months\":3,\"has_recurring\":false,\"accountvault_c1\":null,\"accountvault_c2\":null,\"accountvault_c3\":null,\"active\":true,\"ach_sec_code\":null,\"customer_id\":null,\"cau_summary_status_id\":0,\"cau_last_updated_ts\":null,\"card_bin\":null,\"created_user_id\":\"31f0779bfa7eb328a422a269\",\"token_import_id\":null,\"acs_transaction_id\":null,\"routing_number\":null,\"token_api_id\":null,\"token_c1\":null,\"token_c2\":null,\"token_c3\":null,\"identity_verification\":{\"dl_number\":null,\"dl_state\":null,\"ssn4\":null,\"dob_year\":null}}',NULL,NULL,NULL,'P',NULL,'2025-08-13 12:40:43','2025-08-13 12:40:43',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,2,2,9,'card',NULL,'11','25','1111','visa',NULL,'1234',NULL,'31f0788227dbf43eb409bd84','11efc6da833b85e2b082446a','Y','Y',NULL,'{\"@action\":\"tokenization\",\"id\":\"31f0788227dbf43eb409bd84\",\"payment_method\":\"cc\",\"title\":null,\"account_holder_name\":\"1234\",\"first_six\":\"411111\",\"last_four\":\"1111\",\"exp_date\":\"1125\",\"account_type\":\"visa\",\"created_ts\":1755116085,\"modified_ts\":1755116085,\"account_vault_api_id\":null,\"contact_id\":null,\"location_id\":\"11efc6d85288cf1aaa096bfc\",\"expiring_in_months\":3,\"has_recurring\":false,\"accountvault_c1\":null,\"accountvault_c2\":null,\"accountvault_c3\":null,\"active\":true,\"ach_sec_code\":null,\"customer_id\":null,\"cau_summary_status_id\":0,\"cau_last_updated_ts\":null,\"card_bin\":null,\"created_user_id\":\"11efc6da833b85e2b082446a\",\"token_import_id\":null,\"acs_transaction_id\":null,\"routing_number\":null,\"token_api_id\":null,\"token_c1\":null,\"token_c2\":null,\"token_c3\":null,\"identity_verification\":{\"dl_number\":null,\"dl_state\":null,\"ssn4\":null,\"dob_year\":null}}',NULL,NULL,NULL,'P',NULL,'2025-08-13 15:14:46','2025-08-13 15:14:46',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,5,23,34,'card',NULL,'05','29','8225','visa',NULL,'Jonathan Bodnar',NULL,'31f078a459034e789d4c845c','31f0779bfa7eb328a422a269','Y','Y',NULL,'{\"@action\":\"tokenization\",\"id\":\"31f078a459034e789d4c845c\",\"payment_method\":\"cc\",\"title\":null,\"account_holder_name\":\"Jonathan Bodnar\",\"first_six\":\"435478\",\"last_four\":\"8225\",\"exp_date\":\"0529\",\"account_type\":\"visa\",\"created_ts\":1755130771,\"modified_ts\":1755130771,\"account_vault_api_id\":null,\"contact_id\":null,\"location_id\":\"31f0779bf29fa89c83583d82\",\"expiring_in_months\":45,\"has_recurring\":false,\"accountvault_c1\":null,\"accountvault_c2\":null,\"accountvault_c3\":null,\"active\":true,\"ach_sec_code\":null,\"customer_id\":null,\"cau_summary_status_id\":0,\"cau_last_updated_ts\":null,\"card_bin\":\"43547800\",\"created_user_id\":\"31f0779bfa7eb328a422a269\",\"token_import_id\":null,\"acs_transaction_id\":null,\"routing_number\":null,\"token_api_id\":null,\"token_c1\":null,\"token_c2\":null,\"token_c3\":null,\"identity_verification\":{\"dl_number\":null,\"dl_state\":null,\"ssn4\":null,\"dob_year\":null}}',NULL,NULL,NULL,'P',NULL,'2025-08-13 19:19:31','2025-08-13 19:19:31',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,6,23,58,'card',NULL,'09','27','8977','mc',NULL,'Pierre M Campbell',NULL,'31f081af2faa0210a24d6f78','31f0779bfa7eb328a422a269','Y','Y',NULL,'{\"@action\":\"tokenization\",\"id\":\"31f081af2faa0210a24d6f78\",\"payment_method\":\"cc\",\"title\":null,\"account_holder_name\":\"Pierre M Campbell\",\"first_six\":\"514377\",\"last_four\":\"8977\",\"exp_date\":\"0927\",\"account_type\":\"mc\",\"created_ts\":1756124986,\"modified_ts\":1756124986,\"account_vault_api_id\":null,\"contact_id\":null,\"location_id\":\"31f0779bf29fa89c83583d82\",\"expiring_in_months\":25,\"has_recurring\":false,\"accountvault_c1\":null,\"accountvault_c2\":null,\"accountvault_c3\":null,\"active\":true,\"ach_sec_code\":null,\"customer_id\":null,\"cau_summary_status_id\":0,\"cau_last_updated_ts\":null,\"card_bin\":\"5143773\",\"created_user_id\":\"31f0779bfa7eb328a422a269\",\"token_import_id\":null,\"acs_transaction_id\":null,\"routing_number\":null,\"token_api_id\":null,\"token_c1\":null,\"token_c2\":null,\"token_c3\":null,\"identity_verification\":{\"dl_number\":null,\"dl_state\":null,\"ssn4\":null,\"dob_year\":null}}',NULL,NULL,NULL,'P',NULL,'2025-08-25 07:29:47','2025-08-25 07:29:47',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);


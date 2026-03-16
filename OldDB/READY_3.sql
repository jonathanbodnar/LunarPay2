--

--
-- Table structure for table "settings"
--

CREATE TABLE IF NOT EXISTS "settings" (
  "settings_id" INTEGER NOT NULL,
  "type" varchar(255) NOT NULL DEFAULT '',
  "description" text NOT NULL DEFAULT ''
);

--
-- Dumping data for table "settings"
--

INSERT INTO "settings" VALUES (1,'is_new_donor_before_days','30'),(2,'widget_allowed_ips','[\"::1\"]'),(3,'install_expiration_date','15'),(4,'yes_options','[\"yes\",\"yeah\",\"yep\",\"yea\",\"y\",\"sure\",\"true\",\"ok\",\"great\",\"nice\"]'),(5,'no_options','[\"no\",\"nah\",\"nope\",\"na\",\"n\",\"not\",\"false\"]'),(6,'chat_expiration_hours','2'),(7,'deletexxx',''),(9,'SYSTEM_LETTER_ID','L');

--
-- Table structure for table "statement_donors"
--

CREATE TABLE IF NOT EXISTS "statement_donors" (
  "id" INTEGER NOT NULL,
  "statement_id" INTEGER NOT NULL,
  "church_id" INTEGER NOT NULL,
  "donor_email" varchar(255) DEFAULT NULL,
  "donor_name" varchar(255) DEFAULT NULL,
  "file_name" varchar(255) DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NULL
);

--
-- Dumping data for table "statement_donors"
--

--
-- Table structure for table "statements"
--

CREATE TABLE IF NOT EXISTS "statements" (
  "id" INTEGER NOT NULL,
  "type" varchar(10) DEFAULT NULL,
  "client_id" INTEGER DEFAULT NULL,
  "created_by" char(1) DEFAULT 'U',
  "account_donor_id" INTEGER DEFAULT NULL,
  "church_id" INTEGER DEFAULT NULL,
  "date_from" date DEFAULT NULL,
  "date_to" date DEFAULT NULL,
  "file_name" varchar(255) DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT NULL,
  "updated_at" TIMESTAMP DEFAULT NULL
);

--
-- Dumping data for table "statements"
--

--
-- Table structure for table "tags"
--

CREATE TABLE IF NOT EXISTS "tags" (
  "id" INTEGER NOT NULL,
  "client_id" INTEGER DEFAULT NULL,
  "name" varchar(64) DEFAULT NULL,
  "scope" char(1) DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT NULL,
  UNIQUE
);

--
-- Dumping data for table "tags"
--

--
-- Table structure for table "transactions_funds"
--

CREATE TABLE IF NOT EXISTS "transactions_funds" (
  "id" INTEGER NOT NULL,
  "transaction_id" INTEGER DEFAULT NULL,
  "subscription_id" INTEGER DEFAULT NULL,
  "fund_id" INTEGER DEFAULT NULL,
  "amount" decimal(15,4) DEFAULT NULL,
  "fee" decimal(15,4) DEFAULT NULL,
  "net" decimal(15,2) DEFAULT NULL,
  "fund_name" varchar(128) DEFAULT NULL,
  "plcenter_last_update" TIMESTAMP DEFAULT NULL,
  "plcenter_pushed" char(1) DEFAULT NULL,
  "freshbooks_last_update" TIMESTAMP DEFAULT NULL,
  "freshbooks_pushed" char(1) DEFAULT NULL,
  "quickbooks_last_update" TIMESTAMP DEFAULT NULL,
  "quickbooks_pushed" char(1) DEFAULT NULL
);

--
-- Dumping data for table "transactions_funds"
--

INSERT INTO "transactions_funds" VALUES (1,1,NULL,1,20.0000,0.0000,20.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(2,2,NULL,2,1.0000,0.3000,0.70,'General',NULL,NULL,NULL,NULL,NULL,NULL),(3,3,NULL,2,-1.0000,0.0000,-1.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(4,4,NULL,2,103.3000,3.3000,100.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(5,5,NULL,2,138414.3200,4844.8500,133569.47,'General',NULL,NULL,NULL,NULL,NULL,NULL),(6,6,NULL,2,126010.7300,4410.7300,121600.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(7,7,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(8,8,NULL,2,126010.7300,4410.7300,121600.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(9,9,NULL,2,126010.7300,4410.7300,121600.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(10,10,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(11,11,NULL,2,-1.0000,0.0000,-1.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(12,12,NULL,2,109430.4100,3830.4100,105600.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(13,13,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(14,14,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(15,15,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(16,16,NULL,2,66321.6100,2321.6100,64000.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(17,NULL,1,2,14.0000,0.7100,13.29,'General',NULL,NULL,NULL,NULL,NULL,NULL),(18,NULL,2,2,14.0000,0.7100,13.29,'General',NULL,NULL,NULL,NULL,NULL,NULL),(19,17,NULL,2,14922.6400,522.6400,14400.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(20,18,NULL,23,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(21,19,NULL,23,-1.0000,0.0000,-1.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(22,NULL,3,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(23,NULL,4,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(24,NULL,5,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(25,NULL,6,2,14.0000,0.7100,13.29,'General',NULL,NULL,NULL,NULL,NULL,NULL),(26,NULL,7,2,14.0000,0.7100,13.29,'General',NULL,NULL,NULL,NULL,NULL,NULL),(27,NULL,8,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(28,20,NULL,2,15000.0000,435.3000,14564.70,'General',NULL,NULL,NULL,NULL,NULL,NULL),(29,NULL,9,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(30,NULL,10,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(31,21,NULL,23,27.0000,1.0800,25.92,'General',NULL,NULL,NULL,NULL,NULL,NULL),(32,22,NULL,23,27.0000,1.3000,25.70,'General',NULL,NULL,NULL,NULL,NULL,NULL),(33,23,NULL,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL);

--
-- Table structure for table "users"
--

CREATE TABLE IF NOT EXISTS "users" (
  "id" mediumint(8) NOT NULL,
  "ip_address" varchar(45) NOT NULL,
  "username" varchar(100) NOT NULL,
  "password" varchar(255) NOT NULL,
  "email" varchar(254) NOT NULL,
  "activation_selector" varchar(255) DEFAULT NULL,
  "activation_code" varchar(255) DEFAULT NULL,
  "forgotten_password_selector" varchar(255) DEFAULT NULL,
  "forgotten_password_code" varchar(255) DEFAULT NULL,
  "forgotten_password_time" INTEGER DEFAULT NULL,
  "remember_selector" varchar(255) DEFAULT NULL,
  "remember_code" varchar(255) DEFAULT NULL,
  "created_on" INTEGER NOT NULL,
  "last_login" INTEGER DEFAULT NULL,
  "active" SMALLINT DEFAULT NULL,
  "first_name" varchar(50) DEFAULT NULL,
  "last_name" varchar(50) DEFAULT NULL,
  "company" varchar(100) DEFAULT NULL,
  "phone" varchar(20) DEFAULT NULL,
  "access_token" char(96) DEFAULT NULL,
  "role" enum('user','admin') NOT NULL DEFAULT 'user',
  "gbarber_app_status" char(1) DEFAULT NULL,
  "gbarber_app_url" varchar(256) DEFAULT NULL,
  "gbarber_app_created_attempt" TIMESTAMP DEFAULT NULL,
  "planning_center_oauth" text DEFAULT NULL,
  "stripe_oauth" text DEFAULT NULL,
  "freshbooks_oauth" text DEFAULT NULL,
  "quickbooks_oauth" text DEFAULT NULL,
  "slack_status" char(1) DEFAULT 'D',
  "slack_oauth" text DEFAULT NULL,
  "slack_channel" varchar(40) DEFAULT NULL,
  "parent_id" INTEGER DEFAULT NULL,
  "permissions" text DEFAULT NULL,
  "payment_processor" varchar(3) DEFAULT 'FTS',
  "starter_step" INTEGER DEFAULT 1,
  "force_logout" SMALLINT DEFAULT NULL,
  "zelle_account_id" varchar(200) DEFAULT NULL,
  "zelle_social_security" varchar(200) DEFAULT NULL,
  "referral_code" varchar(200) DEFAULT NULL,
  UNIQUE,
  UNIQUE,
  UNIQUE,
  UNIQUE
);

--
-- Dumping data for table "users"
--

INSERT INTO "users" VALUES (1,'192.168.2.49','','$2y$10$FI0UonTIbQmu8LWp.lYmlOsceYanNYE8tzzZCP57u1KIM57OpVTQa','juan@marketing.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1734991464,1747414940,1,'Juan','Gomez','ProdCompanyTest1','3006009000','1e25c9cc1d2bf16ae079e16d32bc29042a2716e1c2484d38c58feb058b84664be72c7e7a4d485dab67a3224f93ab8ac0','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(2,'192.168.5.52','','$2y$10$kAe39r54MTJDSmxfEkPINO9LhfitjBTF5ua7lnsAipzpX6VvJpWAG','jonathan@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1735248852,1756357798,1,'Jonathan','Bodnar','Apollo Eleven Inc','4699078539','51cbbdd0dff00a1f8a9f6ef052ca3b5e2fb1ab647c80a744a881843ef62ac91bc2c871db27d7c8281e4653a40429d80a','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(3,'192.168.2.49','','$2y$10$c3D0MLjjluqdfgvDtabwjuEGhdHD6boJ9nj6WfyX9xjKGIgpLRyY2','jb@marketing.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1735687123,1755537796,1,'Jonathan','Bodnar','Marketing.biz','4699078539','d5db7b4fc1020158838a517922492811f91de648187d77467719ac413f9ae5fbed5cb4a9512738547e169edad452f898','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(4,'192.168.2.91','','$2y$10$xs9aeMkttycomDKjxb0dcOqUUqZU.kWrn7YDr1pHR01fa1Qgpz54G','liamtodd@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737356227,NULL,1,'Liam','','ELEV3N Records','6132819107','b1c377b33ed338a7f30f962de8c8dac7fdf2aa7843e3ca73ae476f0d5947627962ba136c3cf45ca7c8390d79ec97f0eb','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(5,'192.168.5.59','','$2y$10$7YwmOGZ1IuJ7MjmAdoZJY.0VW7S3hBooQYos.Hc4kCBWgXpaEPu8m','ryujinx@wearehackerone.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737363829,NULL,1,'Jivk','Ryujinx','Indonesian Offensive Security','+62813360605321','106bee6a47b07ae1e57eca80db1b16c00bcd2c009288ed9ce1c36a2ee6eeedccad4c6f0d996871da190470ffc3a3bfca','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(6,'192.168.2.91','','$2y$10$OvWhPt4LeykfGp5DlAZ.o.PQotSrrHb0dYsftgQq2ATIliWqVFFre','jonathanbagwell23@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737647425,NULL,1,'Jonathan','Bagwell','Jonathan','7208181289','70dee5ac8545f7b3bac413ed7fa601e3abfd3cf272ef996c3e1f37c5bcfd5c58824cf835856a7ab06f2e73095b637ca9','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(7,'192.168.2.91','','$2y$10$cm7SOwRcasX3/8bhlDWZJ.PR78nf5GGYavJtbkPX1j1shumVW1xA2','calebmitcheltx@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740162724,1742933303,1,'Caleb','Mitchell','Masters Touch, Inc.','2143851075','03cba4b72d591a53e077334461bb3b951ac90b227d24aa54bd88a151e7c5b63c27e4d15d68e5ee59c6c5cba680d458e7','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(8,'192.168.2.91','','$2y$10$ugPZY.h.rokHrKh0cZ5nt.c62.NQsJjfqMrTMJGRpKQ8r9LgEAB9a','cherice@ethnoholdings.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740410749,NULL,1,'Cherice','Stoltzfus','Ethno Holdings','6823653869','1e959516ed79bee4c63381c50ba56970443c18de46d7e1199fc3e8ce87d4009a566d77d08cc88865a9f40b3636824f01','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(9,'192.168.2.91','','$2y$10$9CDbuYEDEbkVqiBlj3Ys.uKLP70K2ZS5g5kyljM/wH4dcwlSFwPoK','calebmitchelltx@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740779551,NULL,1,'Caleb','Mitchell','Masters Touch, Inc.','(214) 385-1075','162b4bab4bfd8b9442203dc2c73c3380646aba7e971db2c607299639ea4b705084a056d8d4a4b118ddd3c1a1d25937fc','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(10,'192.168.5.68','','$2y$10$Ej5lfDWV.I5XSDgWYxwd.ezsJi9qWtvgK4Z4BWBdPzQ8j9y2ukqjS','jakebaxter315@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1741960532,1742325716,1,'Jake','Baxter','Nighthawk Consulting LLC','2142366479','8f8748e9a51a111e017cd0333d8c6134352398089dd09a4bfec677dec5f9fccb4d13c5fe8f930055a18e2e9a3b29fd43','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(11,'192.168.5.17','','$2y$10$SdP39F7oEYPEJSu/CLaQqezsHfJsKU4YuhmoRMTrnsDfoVzAYG.mK','umit.aras96@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1742729402,NULL,1,'ümit','Aras','tetris','595043149','7958aa5a7c16315ce177e767f18265e35da72e74cb7192a9008b18d98ebca2e67a847c5ae147f1c422017266b1f6bdf3','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(12,'192.168.5.37','','$2y$10$RQbX7WhOrfQsBVRn4Fx6v.5myTWzmis.stQEQsuHvgrOfzuU.jroO','jb@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1746322953,1756357781,1,'Jonathan','Bodnar','Apollo Eleven inc.','4699078539','7f91d107aa84fb63088d8eaab7f7095fb15d58ac31c3e9fbe6c12364f242764481a62d161335ac695c84f3652c822b80','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(13,'192.168.2.67','','$2y$10$UB2DaBhaL.igR1gnknl9vOmVTVD3DxhWtc8ld0HtYkxqTeHW6CSbi','juan@lunarpay.io',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1746809044,1750185046,1,'Juan','Gomez','Prod company test','3006009000','db6ef9664fe49ab19f2c294543cd026881bfa5d74c1e0989aa4a7e76090042901a1cf5eb073c13a9087e1d06a07ef089','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(14,'192.168.5.37','','$2y$10$lpUDR3oxivOa7jlRmQ/aMeC7PADgN6IxZMz06jGRpdmrCTSX9AZIe','juan@apolloapps.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747082113,1755709283,1,'Juan','Gomez',NULL,NULL,'a67f443d10c6002cf709a60189a39e66088e8757c7158b61d7827627a451ce2f44388a1d55ce9fde9c5df8c93d114c51','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(15,'192.168.2.79','','$2y$10$D5eQnF6rSxJvRD1EhepZ1.YNxnBxCEZ4YasJdmLI7PYFwMmJMyDy2','edg@sozaclinic.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747179538,1748533551,1,'Edward','Gonzales','SozaClinic','901-237-7472','20ed26b177ec78cb495c72563c56ad2fd042a6891bacc1ffc0379f01c087df5e4faecec6a505534c89342fdd0ba67cbe','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(16,'192.168.2.79','','$2y$10$NfdELLVuJzZ/nDOEU8gY0.ANEhOe7JsogNAEq/aaQWDKq9gUetRia','jonathqweqwean@lunarpay.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747680095,NULL,1,'Jonathan','Bodnar','Apollo Eleven inc.','4699078539','c79fb884506f68e7471adda7717fc0aa3079639a7f2741ab73ea21f887cbba94ff66adc9242f4cd038ac07ecec7a856e','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(17,'192.168.5.79','','$2y$10$4wogCicFpbfOugcrNRL5O.TfVFJX6pYPdbrZAh02lF4wAv0OhICvm','breathstealersworld@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1748257772,1751915965,1,'Prasanna','','Breath Stealers Music Academy','9972620273','e207d7eb27b78b41ce7163c064c7f71afd3e96ff51429921120bbaf69fcda6b7bc4659631d2ed10072e6518f9e1e59ee','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(18,'192.168.5.79','','$2y$10$VRYuqDMTi3CcR56c8V1fJeY8HtFtOGSHPkEp4B1xJjd.vY8bUGm7u','jonathantest@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1748532646,NULL,1,'Jonathan','Bodnar','Marketing.biz LLC','4699078539','e1a219a6d21c9c9b6cb027894b71c8b6e4d2adb4659992f86dc8ad66fea9b1400bc5447d2c90afd9db8ade85153960ae','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(19,'192.168.2.82','','$2y$10$68vlzle9PJ9cxIz3uDyAMOoL.LBk8KY2rDLX1KZ6y9v7jarTCPFT6','pablogmzc@outlook.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750175549,1750180206,1,'Juan','Gmz','Test Prod Comp 2025-06-17','3006009000','deac7a71454b78d5365cd7f1f94deaf81dc8c2a57c270d79cc86e2f8dd49580385d1e5430b4c22885b2a852054116b5b','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(20,'192.168.2.82','','$2y$10$ytZZsY0irRmL6rXafe5QXuvNSEsxOEj7ZyepCAY8Bnzz80RUzYFKu','juan@lunarpay.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750181756,1750185015,1,'Juan','Gmz','Test Prod Comp 2025-06-17-2','3006009000','7b9789f56c019058a1ccea296e463999d49c1763542587cc4bc50249b5363f316508ff417453503969921cd36b044b28','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(21,'192.168.5.28','','$2y$10$jChLjD0StrO1qR9wa8sbburQvvUFzhThzuXg2Lf.biG1npCUrkgyy','atlas@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750691123,1750777601,1,'Jonathan','Bodnar','Atlas Holdings','4692079703','24616bf076e7f59f2abaeaa404ea6c95eafba501f249203fe19e71f9de2b4e67080808c5859f2ac5f8d911ce81e81c71','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(22,'192.168.5.28','','$2y$10$iQKFROwbThyP3D4YanvfEuEH//fwbMU.DKutzdwia5tYtGB7jKGvW','eustersshikol@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1751209714,NULL,1,'Eusters','Andalo','Forex','0707191729','1da6a65b12d9edf276913581c8a57d81ab9997671223a7e2766bd4f64edd5069bc2520e41c3ba483353b4444d801230f','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(23,'172.18.0.1','','$2y$10$9sIJFEyVN4hAwACK3mVvc.rQ.Q327DQkVRejffgwYl5Tyqjn33NFu','jb@leads.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1754688191,1756357865,1,'Jonathan','Bodnar','Leads.biz LLC','4692079703','7437bb693b9eddb7c82565c9c0aaeb8adfb20fc85116c428f36706f70ded9cc8c124968f3c1d12f44e38f69b225fb8d2','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL);

--
-- Table structure for table "users_groups"
--

CREATE TABLE IF NOT EXISTS "users_groups" (
  "id" mediumint(8) NOT NULL,
  "user_id" mediumint(8) NOT NULL,
  "group_id" mediumint(8) NOT NULL
);

--
-- Dumping data for table "users_groups"
--

INSERT INTO "users_groups" VALUES (1,1,2),(2,2,2),(3,3,2),(4,4,2),(5,5,2),(6,6,2),(7,7,2),(8,8,2),(9,9,2),(10,10,2),(11,11,2),(12,12,2),(13,13,2),(14,14,2),(15,15,2),(16,16,2),(17,17,2),(18,18,2),(19,19,2),(20,20,2),(21,21,2),(22,22,2),(23,23,2);

--
-- Table structure for table "webhook_sent_logs"
--

CREATE TABLE IF NOT EXISTS "webhook_sent_logs" (
  "id" SERIAL PRIMARY KEY,
  "webhook_type" varchar(50) NOT NULL,
  "client_id" varchar(255) NOT NULL,
  "status" enum('pending','success','failed','retrying') NOT NULL DEFAULT 'pending',
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 3,
  "next_retry_at" TIMESTAMP DEFAULT NULL,
  "last_attempt_at" TIMESTAMP DEFAULT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" TEXT NOT NULL,
  "response_body" TEXT DEFAULT NULL,
  "http_status_code" INTEGER DEFAULT NULL,
  "error_message" text DEFAULT NULL,
  "webhook_url" varchar(500) NOT NULL,
  "event_type" varchar(100) NOT NULL,
  "event_id" varchar(255) DEFAULT NULL
);

--
-- Dumping data for table "webhook_sent_logs"
--

INSERT INTO "webhook_sent_logs" VALUES (1,'sub','2','success',0,3,NULL,'2025-07-04 17:15:30','2025-07-04 22:15:30','2025-07-04 22:15:30','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-07-04T17:15:30-05:00\",\"client_id\":\"2\",\"data\":{\"customer_id\":\"9\",\"subscription_id\":\"1\",\"plan_type\":\"basic\",\"billing_cycle\":\"monthly\",\"amount\":\"14.00\",\"start_date\":\"2025-07-11 00:00:00\",\"next_payment_on\":\"2025-07-11 23:59:59\",\"customer_email\":\"juan@apolloapps.com\",\"customer_name\":\"Juan Gmz\",\"c_status\":\"cancelled\",\"status\":\"D\",\"trial_ends_at\":\"2025-07-11 23:59:59\",\"ends_at\":\"2025-07-11 23:59:59\",\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_686852827b8015.88008975'),(2,'sub','2','success',0,3,NULL,'2025-07-04 17:20:05','2025-07-04 22:20:05','2025-07-04 22:20:05','{\"event_type\":\"subscription_created\",\"timestamp\":\"2025-07-04T17:20:05-05:00\",\"client_id\":\"2\",\"data\":{\"customer_id\":\"9\",\"subscription_id\":\"2\",\"plan_type\":\"basic\",\"billing_cycle\":\"monthly\",\"amount\":\"14.00\",\"start_date\":\"2025-07-11 00:00:00\",\"next_payment_on\":\"2025-07-11 23:59:59\",\"customer_email\":\"juan@apolloapps.com\",\"customer_name\":\"Juan Gmz\",\"c_status\":\"on_trial\",\"status\":\"A\",\"trial_ends_at\":\"2025-07-11 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":null,\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_68685395bf4d75.62785501'),(3,'sub','2','success',0,3,NULL,'2025-07-11 03:00:01','2025-07-11 08:00:01','2025-07-11 08:00:01','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-07-11T03:00:01-05:00\",\"client_id\":\"2\",\"data\":{\"customer_id\":\"9\",\"subscription_id\":\"2\",\"plan_type\":\"basic\",\"billing_cycle\":\"monthly\",\"amount\":\"14.00\",\"start_date\":\"2025-07-11 00:00:00\",\"next_payment_on\":\"2025-07-11 23:59:59\",\"customer_email\":\"juan@apolloapps.com\",\"customer_name\":\"Juan Gmz\",\"c_status\":\"cancelled\",\"status\":\"A\",\"trial_ends_at\":\"2025-07-11 23:59:59\",\"ends_at\":null,\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_6870c481727b46.37889039'),(4,'sub','2','success',0,3,NULL,'2025-07-11 03:00:01','2025-07-11 08:00:01','2025-07-11 08:00:01','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-07-11T03:00:01-05:00\",\"client_id\":\"2\",\"data\":{\"customer_id\":\"9\",\"subscription_id\":\"2\",\"plan_type\":\"basic\",\"billing_cycle\":\"monthly\",\"amount\":\"14.00\",\"start_date\":\"2025-07-11 00:00:00\",\"next_payment_on\":\"2025-07-11 23:59:59\",\"customer_email\":\"juan@apolloapps.com\",\"customer_name\":\"Juan Gmz\",\"c_status\":\"cancelled\",\"status\":\"A\",\"trial_ends_at\":\"2025-07-11 23:59:59\",\"ends_at\":null,\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_6870c481738f74.98668289'),(5,'sub','23','success',0,3,NULL,'2025-08-13 12:40:43','2025-08-13 17:40:43','2025-08-13 17:40:43','{\"event_type\":\"subscription_created\",\"timestamp\":\"2025-08-13T12:40:43-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"30\",\"subscription_id\":\"4\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"juan2@marketing.biz\",\"customer_name\":\"Juan Gomez\",\"c_status\":\"on_trial\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":null,\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689cce1b411623.31803227'),(6,'sub','23','success',0,3,NULL,'2025-08-13 13:20:03','2025-08-13 18:20:03','2025-08-13 18:20:03','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-08-13T13:20:03-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"32\",\"subscription_id\":\"3\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"jbtestpay@leads.biz\",\"customer_name\":\"Jonathan Bodnar\",\"c_status\":\"cancelled\",\"status\":\"D\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":\"2025-08-20 23:59:59\",\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_689cd75307efe2.85028537'),(7,'sub','23','success',0,3,NULL,'2025-08-13 13:20:12','2025-08-13 18:20:12','2025-08-13 18:20:12','{\"event_type\":\"subscription_created\",\"timestamp\":\"2025-08-13T13:20:12-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"32\",\"subscription_id\":\"5\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"jbtestpay@leads.biz\",\"customer_name\":\"Jonathan Bodnar\",\"c_status\":\"on_trial\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":null,\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689cd75c285ef8.98356997'),(8,'sub','2','success',0,3,NULL,'2025-08-13 15:14:46','2025-08-13 20:14:46','2025-08-13 20:14:46','{\"event_type\":\"subscription_created\",\"timestamp\":\"2025-08-13T15:14:46-05:00\",\"client_id\":\"2\",\"data\":{\"customer_id\":\"9\",\"subscription_id\":\"6\",\"plan_type\":\"basic\",\"billing_cycle\":\"monthly\",\"amount\":\"14.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"juan@apolloapps.com\",\"customer_name\":\"Juan Gmz\",\"c_status\":\"on_trial\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":null,\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_689cf23619d564.52797684'),(9,'sub','2','success',0,3,NULL,'2025-08-13 15:15:52','2025-08-13 20:15:52','2025-08-13 20:15:52','{\"event_type\":\"subscription_created\",\"timestamp\":\"2025-08-13T15:15:52-05:00\",\"client_id\":\"2\",\"data\":{\"customer_id\":\"9\",\"subscription_id\":\"7\",\"plan_type\":\"basic\",\"billing_cycle\":\"monthly\",\"amount\":\"14.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"juan@apolloapps.com\",\"customer_name\":\"Juan Gmz\",\"c_status\":\"on_trial\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":null,\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_689cf27804d955.66179144'),(10,'sub','23','success',0,3,NULL,'2025-08-13 16:09:51','2025-08-13 21:09:51','2025-08-13 21:09:51','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-08-13T16:09:51-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"30\",\"subscription_id\":\"4\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"juan2@marketing.biz\",\"customer_name\":\"Juan Gomez\",\"c_status\":\"cancelled\",\"status\":\"D\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":\"2025-08-20 23:59:59\",\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_689cff1fa6d908.65806576'),(11,'sub','23','success',0,3,NULL,'2025-08-13 19:19:32','2025-08-14 00:19:31','2025-08-14 00:19:32','{\"event_type\":\"subscription_created\",\"timestamp\":\"2025-08-13T19:19:31-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"34\",\"subscription_id\":\"8\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"baxterwandf@gmail.com\",\"customer_name\":\"Jake Baxter\",\"c_status\":\"on_trial\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":null,\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689d2b937bbff5.75108551'),(12,'sub','23','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:01','2025-08-20 08:00:02','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-08-20T03:00:01-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"32\",\"subscription_id\":\"5\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"jbtestpay@leads.biz\",\"customer_name\":\"Jonathan Bodnar\",\"c_status\":\"cancelled\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68a58081d1e236.73650804'),(13,'sub','2','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-08-20T03:00:02-05:00\",\"client_id\":\"2\",\"data\":{\"customer_id\":\"9\",\"subscription_id\":\"6\",\"plan_type\":\"basic\",\"billing_cycle\":\"monthly\",\"amount\":\"14.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"juan@apolloapps.com\",\"customer_name\":\"Juan Gmz\",\"c_status\":\"cancelled\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_68a580821fa5c1.79871021'),(14,'sub','2','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-08-20T03:00:02-05:00\",\"client_id\":\"2\",\"data\":{\"customer_id\":\"9\",\"subscription_id\":\"7\",\"plan_type\":\"basic\",\"billing_cycle\":\"monthly\",\"amount\":\"14.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"juan@apolloapps.com\",\"customer_name\":\"Juan Gmz\",\"c_status\":\"cancelled\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_68a58082434137.02767687'),(15,'sub','23','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-08-20T03:00:02-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"34\",\"subscription_id\":\"8\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-20 00:00:00\",\"next_payment_on\":\"2025-08-20 23:59:59\",\"customer_email\":\"baxterwandf@gmail.com\",\"customer_name\":\"Jake Baxter\",\"c_status\":\"cancelled\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-20 23:59:59\",\"ends_at\":null,\"trial_status\":\"ended\",\"last_transaction_id\":null,\"access_period_status\":\"ended\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68a58082639150.53228511'),(16,'sub','23','success',0,3,NULL,'2025-08-22 15:29:48','2025-08-22 20:29:48','2025-08-22 20:29:48','{\"event_type\":\"subscription_created\",\"timestamp\":\"2025-08-22T15:29:48-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"30\",\"subscription_id\":\"9\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-29 00:00:00\",\"next_payment_on\":\"2025-08-29 23:59:59\",\"customer_email\":\"juan2@marketing.biz\",\"customer_name\":\"Juan Gomez\",\"c_status\":\"on_trial\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-29 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":null,\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_68a8d33c0378e4.82013835'),(17,'sub','23','success',0,3,NULL,'2025-08-25 07:29:48','2025-08-25 12:29:47','2025-08-25 12:29:48','{\"event_type\":\"subscription_created\",\"timestamp\":\"2025-08-25T07:29:47-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"58\",\"subscription_id\":\"10\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-09-01 00:00:00\",\"next_payment_on\":\"2025-09-01 23:59:59\",\"customer_email\":\"pierrecampbell77@gmail.com\",\"customer_name\":\"Pierre Campbell\",\"c_status\":\"on_trial\",\"status\":\"A\",\"trial_ends_at\":\"2025-09-01 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":null,\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_68ac573b2afc03.32836300'),(18,'sub','23','success',0,3,NULL,'2025-08-29 09:00:05','2025-08-29 14:00:04','2025-08-29 14:00:05','{\"event_type\":\"subscription_updated\",\"timestamp\":\"2025-08-29T09:00:04-05:00\",\"client_id\":\"23\",\"data\":{\"customer_id\":\"30\",\"subscription_id\":\"9\",\"plan_type\":\"one_click_funnel\",\"billing_cycle\":\"monthly\",\"amount\":\"297.00\",\"start_date\":\"2025-08-29 00:00:00\",\"next_payment_on\":\"2025-09-29 23:59:59\",\"customer_email\":\"juan2@marketing.biz\",\"customer_name\":\"Juan Gomez\",\"c_status\":\"unpaid\",\"status\":\"A\",\"trial_ends_at\":\"2025-08-29 23:59:59\",\"ends_at\":null,\"trial_status\":\"active\",\"last_transaction_id\":\"23\",\"access_period_status\":\"active\",\"created_as_trial\":\"1\"}}','{\"success\":true,\"meta\":{\"status\":201,\"message\":\"Created\"}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68b1b264c506d2.14298499');

--
-- Table structure for table "zadm_groups"
--

CREATE TABLE IF NOT EXISTS "zadm_groups" (
  "id" mediumint(8) NOT NULL,
  "name" varchar(20) NOT NULL,
  "description" varchar(100) NOT NULL
);

--
-- Dumping data for table "zadm_groups"
--

INSERT INTO "zadm_groups" VALUES (1,'admin','Administrator'),(2,'members','General User');

--
-- Table structure for table "zadm_login_attempts"
--

CREATE TABLE IF NOT EXISTS "zadm_login_attempts" (
  "id" mediumint(8) NOT NULL,
  "ip_address" varchar(45) NOT NULL,
  "login" varchar(100) DEFAULT NULL,
  "time" INTEGER DEFAULT NULL
);

--
-- Dumping data for table "zadm_login_attempts"
--

--
-- Table structure for table "zadm_users"
--

CREATE TABLE IF NOT EXISTS "zadm_users" (
  "id" mediumint(8) NOT NULL,
  "ip_address" varchar(45) NOT NULL,
  "username" varchar(100) NOT NULL,
  "password" varchar(255) NOT NULL,
  "email" varchar(254) NOT NULL,
  "activation_selector" varchar(255) DEFAULT NULL,
  "activation_code" varchar(255) DEFAULT NULL,
  "forgotten_password_selector" varchar(255) DEFAULT NULL,
  "forgotten_password_code" varchar(255) DEFAULT NULL,
  "forgotten_password_time" INTEGER DEFAULT NULL,
  "remember_selector" varchar(255) DEFAULT NULL,
  "remember_code" varchar(255) DEFAULT NULL,
  "created_on" INTEGER NOT NULL,
  "last_login" INTEGER DEFAULT NULL,
  "active" SMALLINT DEFAULT NULL,
  "first_name" varchar(50) DEFAULT NULL,
  "last_name" varchar(50) DEFAULT NULL,
  "company" varchar(100) DEFAULT NULL,
  "phone" varchar(20) DEFAULT NULL,
  "access_token" char(96) DEFAULT NULL,
  "gbarber_app_status" char(1) DEFAULT NULL,
  "gbarber_app_url" varchar(256) DEFAULT NULL,
  "gbarber_app_created_attempt" TIMESTAMP DEFAULT NULL,
  "planning_center_oauth" text DEFAULT NULL,
  UNIQUE,
  UNIQUE,
  UNIQUE,
  UNIQUE
);

--
-- Dumping data for table "zadm_users"
--

INSERT INTO "zadm_users" VALUES (1,'127.0.0.1','administrator','$2y$12$qod/OYjwZeOl/6S3Dq2IseIEg2ielhbPmpTG72R8ZGutT/CbbiSH2','admin@admin.com',NULL,'',NULL,NULL,NULL,NULL,NULL,1268889823,1650906737,1,'Administrator','','ADMIN','0',NULL,NULL,NULL,NULL,NULL);

--
-- Table structure for table "zadm_users_groups"
--

CREATE TABLE IF NOT EXISTS "zadm_users_groups" (
  "id" mediumint(8) NOT NULL,
  "user_id" mediumint(8) NOT NULL,
  "group_id" mediumint(8) NOT NULL
);

--
-- Dumping data for table "zadm_users_groups"
--

INSERT INTO "zadm_users_groups" VALUES (1,1,1);

-- Dump completed on 2025-08-29 12:14:01

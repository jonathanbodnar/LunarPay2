 "date_month_covered" date DEFAULT NULL,
 "date_created" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "user_id" INTEGER NOT NULL,
 "message" VARCHAR(255) DEFAULT NULL
);


--
-- Dumping data for table "payment_affiliates"
--






--
-- Table structure for table "payment_link_products"
--




CREATE TABLE IF NOT EXISTS "payment_link_products" (
 "id" SERIAL PRIMARY KEY,
 "payment_link_id" INTEGER NOT NULL,
 "product_id" INTEGER NOT NULL,
 "product_name" VARCHAR(200) NOT NULL,
 "product_price" decimal(10,2) NOT NULL,
 "is_editable" SMALLINT NOT NULL DEFAULT 0,
 "qty" INTEGER NOT NULL,
 "is_qty_unlimited" SMALLINT NOT NULL DEFAULT 0
);


--
-- Dumping data for table "payment_link_products"
--



INSERT INTO "payment_link_products" VALUES (1,1,1,'Prodcompanytest1 P1',10.00,0,1,0),(2,2,2,'Test Product 1',1.00,0,1,0),(3,3,4,'Hours',80.00,0,1,0),(4,3,3,'Consulting',100.00,0,1,0),(5,3,2,'Test Product 1',1.00,0,1,0),(6,4,4,'Hours',80.00,0,1,0),(7,5,4,'Hours',80.00,0,1,0),(8,5,3,'Consulting',100.00,0,2,0),(9,6,5,'Recurring',100.00,0,1,0),(10,6,6,'Setup',1000.00,0,1,0),(11,7,2,'Test Product 1',1.00,0,1,0),(12,7,7,'Test2',1.00,0,1,0),(13,8,2,'Test Product 1',1.00,0,1,0),(14,8,7,'Test2',1.00,0,1,0),(15,9,9,'Magicweb Basic Mo',14.00,0,1,0),(16,10,9,'Magicweb Basic Mo',14.00,0,1,0),(17,11,10,'Magicweb Pro Mo',49.00,0,1,0),(18,12,11,'Magicweb Basic Yr',140.00,0,1,0),(19,13,12,'Magicweb Pro Yr',490.00,0,1,0),(20,14,9,'Magicweb Basic Mo',14.00,0,1,0),(21,15,13,'One Click Funnel (periodically)',297.00,0,1,0),(22,16,14,'One Click Funnel (periodically)',297.00,0,1,0),(23,17,18,'Leads In 7 Days',1200.00,0,1,0),(24,18,19,'Leads In 7 Days (discounted)',997.00,0,1,0),(25,19,20,'Full Ai Funnel',97.00,0,1,0),(26,20,21,'Unlimited Sms Marketing',27.00,0,1,0),(27,21,22,'Lifetime Access',27.00,0,1,0),(28,22,20,'Full Ai Funnel',97.00,0,1,0),(29,22,21,'Unlimited Sms Marketing',27.00,0,1,0),(30,23,20,'Full Ai Funnel',97.00,0,1,0),(31,23,21,'Unlimited Sms Marketing',27.00,0,1,0),(32,24,24,'One Click Funnel (periodically)',97.00,0,1,0),(33,25,20,'Full Ai Funnel',97.00,0,1,0),(34,25,22,'Lifetime Access',27.00,0,1,0),(35,26,21,'Unlimited Sms Marketing',27.00,0,1,0),(36,26,20,'Full Ai Funnel',97.00,0,1,0),(37,27,21,'Unlimited Sms Marketing',27.00,0,1,0);



--
-- Table structure for table "payment_link_products_paid"
--




CREATE TABLE IF NOT EXISTS "payment_link_products_paid" (
 "id" SERIAL PRIMARY KEY,
 "transaction_id" INTEGER DEFAULT NULL,
 "subscription_id" INTEGER DEFAULT NULL,
 "payment_link_id" INTEGER DEFAULT NULL,
 "product_id" INTEGER DEFAULT NULL,
 "product_name" VARCHAR(200) DEFAULT NULL,
 "qty_req" INTEGER DEFAULT NULL,
 "product_price" decimal(10,2) DEFAULT NULL
);


--
-- Dumping data for table "payment_link_products_paid"
--



INSERT INTO "payment_link_products_paid" VALUES (1,7,NULL,2,2,'Test Product 1',1,1.00),(2,13,NULL,2,2,'Test Product 1',1,1.00),(3,14,NULL,2,2,'Test Product 1',1,1.00),(4,NULL,1,14,9,'Magicweb Basic Mo',1,14.00),(5,NULL,2,14,9,'Magicweb Basic Mo',1,14.00),(6,NULL,3,16,14,'One Click Funnel (periodically)',1,297.00),(7,NULL,4,16,14,'One Click Funnel (periodically)',1,297.00),(8,NULL,5,16,14,'One Click Funnel (periodically)',1,297.00),(9,NULL,6,14,9,'Magicweb Basic Mo',1,14.00),(10,NULL,7,14,9,'Magicweb Basic Mo',1,14.00),(11,NULL,8,16,14,'One Click Funnel (periodically)',1,297.00),(12,NULL,9,16,14,'One Click Funnel (periodically)',1,297.00),(13,NULL,10,16,14,'One Click Funnel (periodically)',1,297.00),(14,21,NULL,21,22,'Lifetime Access',1,27.00),(15,22,NULL,21,22,'Lifetime Access',1,27.00),(16,23,NULL,16,14,'One Click Funnel (periodically)',1,297.00);



--
-- Table structure for table "payment_links"
--




CREATE TABLE IF NOT EXISTS "payment_links" (
 "id" SERIAL PRIMARY KEY,
 "client_id" INTEGER NOT NULL,
 "hash" VARCHAR(200) NOT NULL,
 "church_id" INTEGER NOT NULL,
 "campus_id" INTEGER DEFAULT NULL,
 "customer_id" INTEGER DEFAULT NULL,
 "customer_email" VARCHAR(128) DEFAULT NULL,
 "status" SMALLINT NOT NULL DEFAULT 1,
 "show_post_purchase_link" SMALLINT DEFAULT NULL,
 "post_purchase_link" VARCHAR(255) DEFAULT NULL,
 "is_internal" SMALLINT DEFAULT NULL,
 "trial_days" INTEGER DEFAULT NULL,
 "payment_methods" VARCHAR(100) NOT NULL,
 "cover_fee" SMALLINT DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


--
-- Dumping data for table "payment_links"
--



INSERT INTO "payment_links" VALUES (1,1,'6769deb72fa88',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2024-12-23 16:05:43'),(2,2,'678146af5c6cf',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-01-10 10:11:27'),(3,2,'68155ec6cc306',2,NULL,2,'juan@lunarpay.com',1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-02 19:09:42'),(4,2,'682b7bfccec79',2,NULL,7,'jonathanbodnar@gmail.com',1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-19 13:44:12'),(5,2,'682b7c29e88f7',2,NULL,7,'jonathanbodnar@gmail.com',1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-19 13:44:57'),(6,2,'6837acac7538a',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-28 19:39:08'),(7,2,'6837ad1edd9d6',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-28 19:41:02'),(8,2,'6837ad34dc330',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',1,'2025-05-28 19:41:24'),(9,2,'686849f1c6e30',2,NULL,NULL,NULL,0,NULL,NULL,NULL,30,'[""CC"",""BANK""]',NULL,'2025-07-04 16:38:57'),(10,2,'68684a13e6c7d',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-07-04 16:39:31'),(11,2,'68684a7577924',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-07-04 16:41:09'),(12,2,'68684ad402457',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-07-04 16:42:44'),(13,2,'68684bf899f8b',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-07-04 16:47:36'),(14,2,'68684e08b1bf1',2,NULL,NULL,NULL,1,1,'https://app.magicweb.ai',NULL,7,'[""CC"",""BANK""]',NULL,'2025-07-04 16:56:24'),(15,3,'689b5c7a66cff',3,NULL,NULL,NULL,1,NULL,NULL,NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-12 10:23:38'),(16,23,'689ba4b5887e9',23,NULL,NULL,NULL,1,1,'https://app.leads.biz',NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-12 15:31:49'),(17,12,'68a35887707f4',12,NULL,NULL,NULL,1,1,'',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-18 11:44:55'),(18,12,'68a377327bc2a',12,NULL,NULL,NULL,1,1,'',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-18 13:55:46'),(19,23,'68acad9760b36',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/paid',NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-25 13:38:15'),(20,23,'68ade2bed7372',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/free-sms',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-26 11:37:18'),(21,23,'68ade573a47f5',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/free-sms',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-26 11:48:51'),(22,23,'68adeb632d5fa',23,NULL,NULL,NULL,0,1,'https://app.leads.biz/paid',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-26 12:14:11'),(23,23,'68adeb948addd',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/paid',NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-26 12:15:00'),(24,23,'68adf7f8af108',23,NULL,NULL,NULL,1,1,'https://app.leads.biz',NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-26 13:07:52'),(25,23,'68af5a5488457',23,NULL,NULL,NULL,0,1,'https://app.leads.biz/paid',NULL,14,'[""CC"",""BANK""]',NULL,'2025-08-27 14:19:48'),(26,23,'68af5a750b8ca',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/paid',NULL,14,'[""CC"",""BANK""]',NULL,'2025-08-27 14:20:21'),(27,23,'68b10da69b516',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/free-sms',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-28 21:17:10');



--
-- Table structure for table "paysafe_webhooks"
--




CREATE TABLE IF NOT EXISTS "paysafe_webhooks" (
 "id" SERIAL PRIMARY KEY,
 "event_json" text DEFAULT NULL,
 "system" VARCHAR(50) DEFAULT NULL,
 "mode" VARCHAR(32) DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT NULL
);


--
-- Dumping data for table "paysafe_webhooks"
--






--
-- Table structure for table "products"
--




CREATE TABLE IF NOT EXISTS "products" (
 "id" SERIAL PRIMARY KEY,
 "reference" VARCHAR(32) DEFAULT NULL,
 "church_id" INTEGER DEFAULT NULL,
 "product_stripe_id" VARCHAR(20) DEFAULT NULL,
 "product_quickbooks_id" VARCHAR(20) DEFAULT NULL,
 "campus_id" INTEGER DEFAULT NULL,
 "name" VARCHAR(255) DEFAULT NULL,
 "description" text DEFAULT NULL,
 "price" decimal(10,2) DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT NULL,
 "trash" SMALLINT DEFAULT 0,
 "slug" VARCHAR(200) DEFAULT NULL,
 "client_id" INTEGER DEFAULT NULL,
 "recurrence" VARCHAR(1) DEFAULT 'O',
 "billing_period" VARCHAR(30) DEFAULT NULL,
 "custom_date" text DEFAULT NULL,
 "start_subscription" VARCHAR(1) NOT NULL DEFAULT 'D',
 "file_hash" VARCHAR(255) DEFAULT NULL,
 "show_customer_portal" SMALLINT DEFAULT NULL,
 "plan_type" VARCHAR(50) DEFAULT NULL
);


--
-- Dumping data for table "products"
--



INSERT INTO "products" VALUES (1,'PR8FC7BBB5-001',1,NULL,NULL,NULL,'Prodcompanytest1 P1',NULL,10.00,'2024-12-23 16:05:41',0,NULL,1,'O',NULL,NULL,'D',NULL,NULL,NULL),(2,'PR9513A068-002',2,NULL,NULL,NULL,'Test Product 1',NULL,1.00,'2025-01-09 14:32:09',0,NULL,2,'O',NULL,NULL,'D',NULL,NULL,NULL),(3,'PR9514D637-003',2,NULL,NULL,NULL,'Consulting',NULL,100.00,'2025-01-17 07:43:48',0,NULL,2,'O',NULL,NULL,'D',NULL,1,NULL),(4,'PR95165FDD-004',2,NULL,NULL,NULL,'Hours',NULL,80.00,'2025-01-27 15:17:43',0,NULL,2,'O',NULL,NULL,'D',NULL,1,NULL),(5,'PR95539192-005',2,NULL,NULL,NULL,'Recurring','',100.00,'2025-05-28 19:38:50',0,NULL,2,'R','monthly',NULL,'D',NULL,1,NULL),(6,'PR95539193-006',2,NULL,NULL,NULL,'Setup','',1000.00,'2025-05-28 19:39:06',0,NULL,2,'O',NULL,NULL,'D',NULL,1,NULL),(7,'PR95539195-007',2,NULL,NULL,NULL,'Test2','',1.00,'2025-05-28 19:41:00',0,NULL,2,'R','monthly',NULL,'D',NULL,1,NULL),(8,'PR955ED7D0-008',14,NULL,NULL,NULL,'Test','',50.00,'2025-06-02 08:16:24',0,NULL,14,'O',NULL,NULL,'D',NULL,1,NULL),(9,'PR956E6B5A-009',2,NULL,NULL,NULL,'Magicweb Basic Mo','For individuals just starting up',14.00,'2025-07-04 16:26:27',0,NULL,2,'R','monthly',NULL,'D',NULL,NULL,'basic'),(10,'PR956E6B69-0010',2,NULL,NULL,NULL,'Magicweb Pro Mo','For individuals, business owners',49.00,'2025-07-04 16:41:06',0,NULL,2,'R','monthly',NULL,'D',NULL,NULL,'pro'),(11,'PR956E6B6A-0011',2,NULL,NULL,NULL,'Magicweb Basic Yr','For individuals just starting up',140.00,'2025-07-04 16:42:36',0,NULL,2,'R','yearly',NULL,'D',NULL,NULL,'basic'),(12,'PR956E6B6E-0012',2,NULL,NULL,NULL,'Magicweb Pro Yr','For individuals, business owners',490.00,'2025-07-04 16:46:43',0,NULL,2,'R','yearly',NULL,'D',NULL,NULL,'pro'),(13,'PR957EE3BD-0013',3,NULL,NULL,NULL,'One Click Funnel (periodically)','Get and sell leads faster than ever before, using the power of AI and an instant marketing funnel proven to scale service based businesses at life changing speeds.',297.00,'2025-08-12 10:21:34',0,NULL,3,'R','monthly',NULL,'D',NULL,1,'one_click_funnel'),(14,'PR957EE5BB-0014',23,NULL,NULL,NULL,'One Click Funnel (periodically)','Get and sell leads faster than ever before, using the power of AI and an instant marketing funnel proven to scale service based businesses at life changing speeds.',297.00,'2025-08-12 15:31:43',0,NULL,23,'R','monthly',NULL,'D',NULL,1,'one_click_funnel'),(15,'PR957EE5BD-0015',23,NULL,NULL,NULL,'One Dolar Product1','',1.00,'2025-08-12 15:33:19',0,NULL,23,'O',NULL,NULL,'D',NULL,NULL,'one_dolar_product1'),(16,'PR957F596D-0016',23,NULL,NULL,NULL,'Full Software Project','',15000.00,'2025-08-15 11:49:02',0,NULL,23,'O',NULL,NULL,'D',NULL,1,'full_software_project'),(17,'PR957FCDD1-0017',2,NULL,NULL,NULL,'Development','',15000.00,'2025-08-18 09:45:19',0,NULL,2,'O',NULL,NULL,'D',NULL,1,'development'),(18,'PR957FCE98-0018',12,NULL,NULL,NULL,'Leads In 7 Days','',1200.00,'2025-08-18 11:44:45',0,NULL,12,'R','monthly',NULL,'D',NULL,1,'leads_in_7_days'),(19,'PR957FCF6B-0019',12,NULL,NULL,NULL,'Leads In 7 Days (discounted)','',997.00,'2025-08-18 13:55:41',0,NULL,12,'O',NULL,NULL,'D',NULL,1,'leads_in_7_days_discounted'),(20,'PR9580E0C8-0020',23,NULL,NULL,NULL,'Full Ai Funnel','',97.00,'2025-08-25 13:36:32',0,NULL,23,'R','monthly',NULL,'D',NULL,1,'Full AI Funnel'),(21,'PR95810711-0021',23,NULL,NULL,NULL,'Unlimited Sms Marketing','',27.00,'2025-08-26 11:37:01',0,NULL,23,'O',NULL,NULL,'D',NULL,1,'unlimited_sms_marketing'),(22,'PR9581071C-0022',23,NULL,NULL,NULL,'Lifetime Access','',27.00,'2025-08-26 11:48:29',0,NULL,23,'O',NULL,NULL,'D',NULL,1,'Unlimited SMS & Email Marketing For Life'),(23,'PR958107B9-0023',23,NULL,NULL,NULL,'One Click Funnel (periodically)','Get and sell leads faster than ever before, using the power of AI and an instant marketing funnel proven to scale service based businesses at life changing speeds.',97.00,'2025-08-26 13:05:45',1,'2320250826',23,'R','monthly',NULL,'D',NULL,1,'one_click_funnel_periodically'),(24,'PR958107BB-0024',23,NULL,NULL,NULL,'One Click Funnel (periodically)','Get and sell leads faster than ever before, using the power of AI and an instant marketing funnel proven to scale service based businesses at life changing speeds.',97.00,'2025-08-26 13:07:12',0,NULL,23,'R','monthly',NULL,'D',NULL,1,'one_click_funnel_periodically_97'),(25,'PR95812AED-0025',23,NULL,NULL,NULL,'Test','one_click_funnel_periodically_97',1.00,'2025-08-27 03:17:48',1,'2520250827',23,'R','monthly',NULL,'D',NULL,1,'one_click_funnel_periodically_97');



--
-- Table structure for table "referals"
--




CREATE TABLE IF NOT EXISTS "referals" (
 "id" SERIAL PRIMARY KEY,
 "parent_id" INTEGER NOT NULL,
 "user_id" INTEGER DEFAULT NULL,
 "email" VARCHAR(200) NOT NULL,
 "full_name" VARCHAR(200) NOT NULL,
 "referal_message" VARCHAR(255) NOT NULL,
 "date_sent" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 "date_register" TIMESTAMP DEFAULT NULL
);


--
-- Dumping data for table "referals"
--






--
-- Table structure for table "request_logs"
--




CREATE TABLE IF NOT EXISTS "request_logs" (
 "id" SERIAL PRIMARY KEY,
 "type" enum('REQ','RES') DEFAULT NULL,
 "headers" text DEFAULT NULL,
 "method" enum('GET','POST','PUT','DEL') DEFAULT NULL,
 "url" VARCHAR(256) DEFAULT NULL,
 "payload" text DEFAULT NULL,
 "date" TIMESTAMP DEFAULT NULL
);


--
-- Dumping data for table "request_logs"
--






--
-- Table structure for table "settings"
--




CREATE TABLE IF NOT EXISTS "settings" (
 "settings_id" INTEGER NOT NULL ,
 "type" VARCHAR(255) NOT NULL DEFAULT '',
 "description" text NOT NULL DEFAULT '',
 PRIMARY KEY ("settings_id")
);


--
-- Dumping data for table "settings"
--



INSERT INTO "settings" VALUES (1,'is_new_donor_before_days','30'),(2,'widget_allowed_ips','[""::1""]'),(3,'install_expiration_date','15'),(4,'yes_options','[""yes"",""yeah"",""yep"",""yea"",""y"",""sure"",""true"",""ok"",""great"",""nice""]'),(5,'no_options','[""no"",""nah"",""nope"",""na"",""n"",""not"",""false""]'),(6,'chat_expiration_hours','2'),(7,'deletexxx',''),(9,'SYSTEM_LETTER_ID','L');



--
-- Table structure for table "statement_donors"
--




CREATE TABLE IF NOT EXISTS "statement_donors" (
 "id" SERIAL PRIMARY KEY,
 "statement_id" INTEGER NOT NULL,
 "church_id" INTEGER NOT NULL,
 "donor_email" VARCHAR(255) DEFAULT NULL,
 "donor_name" VARCHAR(255) DEFAULT NULL,
 "file_name" VARCHAR(255) DEFAULT NULL,
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
 "id" SERIAL PRIMARY KEY,
 "type" VARCHAR(10) DEFAULT NULL,
 "client_id" INTEGER DEFAULT NULL,
 "created_by" VARCHAR(1) DEFAULT 'U',
 "account_donor_id" INTEGER DEFAULT NULL,
 "church_id" INTEGER DEFAULT NULL,
 "date_from" date DEFAULT NULL,
 "date_to" date DEFAULT NULL,
 "file_name" VARCHAR(255) DEFAULT NULL,
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
 "id" SERIAL PRIMARY KEY,
 "client_id" INTEGER DEFAULT NULL,
 "name" VARCHAR(64) DEFAULT NULL,
 "scope" VARCHAR(1) DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT NULL
);


--
-- Dumping data for table "tags"
--






--
-- Table structure for table "transactions_funds"
--




CREATE TABLE IF NOT EXISTS "transactions_funds" (
 "id" SERIAL PRIMARY KEY,
 "transaction_id" INTEGER DEFAULT NULL,
 "subscription_id" INTEGER DEFAULT NULL,
 "fund_id" INTEGER DEFAULT NULL,
 "amount" decimal(15,4) DEFAULT NULL,
 "fee" decimal(15,4) DEFAULT NULL,
 "net" decimal(15,2) DEFAULT NULL,
 "fund_name" VARCHAR(128) DEFAULT NULL,
 "plcenter_last_update" TIMESTAMP DEFAULT NULL,
 "plcenter_pushed" VARCHAR(1) DEFAULT NULL,
 "freshbooks_last_update" TIMESTAMP DEFAULT NULL,
 "freshbooks_pushed" VARCHAR(1) DEFAULT NULL,
 "quickbooks_last_update" TIMESTAMP DEFAULT NULL,
 "quickbooks_pushed" VARCHAR(1) DEFAULT NULL
);


--
-- Dumping data for table "transactions_funds"
--



INSERT INTO "transactions_funds" VALUES (1,1,NULL,1,20.0000,0.0000,20.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(2,2,NULL,2,1.0000,0.3000,0.70,'General',NULL,NULL,NULL,NULL,NULL,NULL),(3,3,NULL,2,-1.0000,0.0000,-1.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(4,4,NULL,2,103.3000,3.3000,100.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(5,5,NULL,2,138414.3200,4844.8500,133569.47,'General',NULL,NULL,NULL,NULL,NULL,NULL),(6,6,NULL,2,126010.7300,4410.7300,121600.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(7,7,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(8,8,NULL,2,126010.7300,4410.7300,121600.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(9,9,NULL,2,126010.7300,4410.7300,121600.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(10,10,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(11,11,NULL,2,-1.0000,0.0000,-1.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(12,12,NULL,2,109430.4100,3830.4100,105600.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(13,13,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(14,14,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(15,15,NULL,2,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(16,16,NULL,2,66321.6100,2321.6100,64000.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(17,NULL,1,2,14.0000,0.7100,13.29,'General',NULL,NULL,NULL,NULL,NULL,NULL),(18,NULL,2,2,14.0000,0.7100,13.29,'General',NULL,NULL,NULL,NULL,NULL,NULL),(19,17,NULL,2,14922.6400,522.6400,14400.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(20,18,NULL,23,1.0000,0.3300,0.67,'General',NULL,NULL,NULL,NULL,NULL,NULL),(21,19,NULL,23,-1.0000,0.0000,-1.00,'General',NULL,NULL,NULL,NULL,NULL,NULL),(22,NULL,3,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(23,NULL,4,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(24,NULL,5,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(25,NULL,6,2,14.0000,0.7100,13.29,'General',NULL,NULL,NULL,NULL,NULL,NULL),(26,NULL,7,2,14.0000,0.7100,13.29,'General',NULL,NULL,NULL,NULL,NULL,NULL),(27,NULL,8,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(28,20,NULL,2,15000.0000,435.3000,14564.70,'General',NULL,NULL,NULL,NULL,NULL,NULL),(29,NULL,9,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(30,NULL,10,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL),(31,21,NULL,23,27.0000,1.0800,25.92,'General',NULL,NULL,NULL,NULL,NULL,NULL),(32,22,NULL,23,27.0000,1.3000,25.70,'General',NULL,NULL,NULL,NULL,NULL,NULL),(33,23,NULL,23,297.0000,8.9100,288.09,'General',NULL,NULL,NULL,NULL,NULL,NULL);



--
-- Table structure for table "users"
--




CREATE TABLE IF NOT EXISTS "users" (
 "id" SERIAL PRIMARY KEY,
 "ip_address" VARCHAR(45) NOT NULL,
 "username" VARCHAR(100) NOT NULL,
 "password" VARCHAR(255) NOT NULL,
 "email" VARCHAR(254) NOT NULL,
 "activation_selector" VARCHAR(255) DEFAULT NULL,
 "activation_code" VARCHAR(255) DEFAULT NULL,
 "forgotten_password_selector" VARCHAR(255) DEFAULT NULL,
 "forgotten_password_code" VARCHAR(255) DEFAULT NULL,
 "forgotten_password_time" INTEGER DEFAULT NULL,
 "remember_selector" VARCHAR(255) DEFAULT NULL,
 "remember_code" VARCHAR(255) DEFAULT NULL,
 "created_on" INTEGER NOT NULL,
 "last_login" INTEGER DEFAULT NULL,
 "active" SMALLINT DEFAULT NULL,
 "first_name" VARCHAR(50) DEFAULT NULL,
 "last_name" VARCHAR(50) DEFAULT NULL,
 "company" VARCHAR(100) DEFAULT NULL,
 "phone" VARCHAR(20) DEFAULT NULL,
 "access_token" char(96) DEFAULT NULL,
 "role" enum('user','admin') NOT NULL DEFAULT 'user',
 "gbarber_app_status" VARCHAR(1) DEFAULT NULL,
 "gbarber_app_url" VARCHAR(256) DEFAULT NULL,
 "gbarber_app_created_attempt" TIMESTAMP DEFAULT NULL,
 "planning_center_oauth" text DEFAULT NULL,
 "stripe_oauth" text DEFAULT NULL,
 "freshbooks_oauth" text DEFAULT NULL,
 "quickbooks_oauth" text DEFAULT NULL,
 "slack_status" VARCHAR(1) DEFAULT 'D',
 "slack_oauth" text DEFAULT NULL,
 "slack_channel" VARCHAR(40) DEFAULT NULL,
 "parent_id" INTEGER DEFAULT NULL,
 "permissions" text DEFAULT NULL,
 "payment_processor" VARCHAR(3) DEFAULT 'FTS',
 "starter_step" INTEGER DEFAULT 1,
 "force_logout" SMALLINT DEFAULT NULL,
 "zelle_account_id" VARCHAR(200) DEFAULT NULL,
 "zelle_social_security" VARCHAR(200) DEFAULT NULL,
 "referral_code" VARCHAR(200) DEFAULT NULL
);


--
-- Dumping data for table "users"
--



INSERT INTO "users" VALUES (1,'192.168.2.49','','$2y$10$FI0UonTIbQmu8LWp.lYmlOsceYanNYE8tzzZCP57u1KIM57OpVTQa','juan@marketing.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1734991464,1747414940,1,'Juan','Gomez','ProdCompanyTest1','3006009000','1e25c9cc1d2bf16ae079e16d32bc29042a2716e1c2484d38c58feb058b84664be72c7e7a4d485dab67a3224f93ab8ac0','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(2,'192.168.5.52','','$2y$10$kAe39r54MTJDSmxfEkPINO9LhfitjBTF5ua7lnsAipzpX6VvJpWAG','jonathan@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1735248852,1756357798,1,'Jonathan','Bodnar','Apollo Eleven Inc','4699078539','51cbbdd0dff00a1f8a9f6ef052ca3b5e2fb1ab647c80a744a881843ef62ac91bc2c871db27d7c8281e4653a40429d80a','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(3,'192.168.2.49','','$2y$10$c3D0MLjjluqdfgvDtabwjuEGhdHD6boJ9nj6WfyX9xjKGIgpLRyY2','jb@marketing.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1735687123,1755537796,1,'Jonathan','Bodnar','Marketing.biz','4699078539','d5db7b4fc1020158838a517922492811f91de648187d77467719ac413f9ae5fbed5cb4a9512738547e169edad452f898','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(4,'192.168.2.91','','$2y$10$xs9aeMkttycomDKjxb0dcOqUUqZU.kWrn7YDr1pHR01fa1Qgpz54G','liamtodd@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737356227,NULL,1,'Liam','','ELEV3N Records','6132819107','b1c377b33ed338a7f30f962de8c8dac7fdf2aa7843e3ca73ae476f0d5947627962ba136c3cf45ca7c8390d79ec97f0eb','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(5,'192.168.5.59','','$2y$10$7YwmOGZ1IuJ7MjmAdoZJY.0VW7S3hBooQYos.Hc4kCBWgXpaEPu8m','ryujinx@wearehackerone.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737363829,NULL,1,'Jivk','Ryujinx','Indonesian Offensive Security','+62813360605321','106bee6a47b07ae1e57eca80db1b16c00bcd2c009288ed9ce1c36a2ee6eeedccad4c6f0d996871da190470ffc3a3bfca','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(6,'192.168.2.91','','$2y$10$OvWhPt4LeykfGp5DlAZ.o.PQotSrrHb0dYsftgQq2ATIliWqVFFre','jonathanbagwell23@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737647425,NULL,1,'Jonathan','Bagwell','Jonathan','7208181289','70dee5ac8545f7b3bac413ed7fa601e3abfd3cf272ef996c3e1f37c5bcfd5c58824cf835856a7ab06f2e73095b637ca9','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(7,'192.168.2.91','','$2y$10$cm7SOwRcasX3/8bhlDWZJ.PR78nf5GGYavJtbkPX1j1shumVW1xA2','calebmitcheltx@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740162724,1742933303,1,'Caleb','Mitchell','Masters Touch, Inc.','2143851075','03cba4b72d591a53e077334461bb3b951ac90b227d24aa54bd88a151e7c5b63c27e4d15d68e5ee59c6c5cba680d458e7','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(8,'192.168.2.91','','$2y$10$ugPZY.h.rokHrKh0cZ5nt.c62.NQsJjfqMrTMJGRpKQ8r9LgEAB9a','cherice@ethnoholdings.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740410749,NULL,1,'Cherice','Stoltzfus','Ethno Holdings','6823653869','1e959516ed79bee4c63381c50ba56970443c18de46d7e1199fc3e8ce87d4009a566d77d08cc88865a9f40b3636824f01','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(9,'192.168.2.91','','$2y$10$9CDbuYEDEbkVqiBlj3Ys.uKLP70K2ZS5g5kyljM/wH4dcwlSFwPoK','calebmitchelltx@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740779551,NULL,1,'Caleb','Mitchell','Masters Touch, Inc.','(214) 385-1075','162b4bab4bfd8b9442203dc2c73c3380646aba7e971db2c607299639ea4b705084a056d8d4a4b118ddd3c1a1d25937fc','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(10,'192.168.5.68','','$2y$10$Ej5lfDWV.I5XSDgWYxwd.ezsJi9qWtvgK4Z4BWBdPzQ8j9y2ukqjS','jakebaxter315@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1741960532,1742325716,1,'Jake','Baxter','Nighthawk Consulting LLC','2142366479','8f8748e9a51a111e017cd0333d8c6134352398089dd09a4bfec677dec5f9fccb4d13c5fe8f930055a18e2e9a3b29fd43','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(11,'192.168.5.17','','$2y$10$SdP39F7oEYPEJSu/CLaQqezsHfJsKU4YuhmoRMTrnsDfoVzAYG.mK','umit.aras96@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1742729402,NULL,1,'ümit','Aras','tetris','595043149','7958aa5a7c16315ce177e767f18265e35da72e74cb7192a9008b18d98ebca2e67a847c5ae147f1c422017266b1f6bdf3','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(12,'192.168.5.37','','$2y$10$RQbX7WhOrfQsBVRn4Fx6v.5myTWzmis.stQEQsuHvgrOfzuU.jroO','jb@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1746322953,1756357781,1,'Jonathan','Bodnar','Apollo Eleven inc.','4699078539','7f91d107aa84fb63088d8eaab7f7095fb15d58ac31c3e9fbe6c12364f242764481a62d161335ac695c84f3652c822b80','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(13,'192.168.2.67','','$2y$10$UB2DaBhaL.igR1gnknl9vOmVTVD3DxhWtc8ld0HtYkxqTeHW6CSbi','juan@lunarpay.io',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1746809044,1750185046,1,'Juan','Gomez','Prod company test','3006009000','db6ef9664fe49ab19f2c294543cd026881bfa5d74c1e0989aa4a7e76090042901a1cf5eb073c13a9087e1d06a07ef089','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(14,'192.168.5.37','','$2y$10$lpUDR3oxivOa7jlRmQ/aMeC7PADgN6IxZMz06jGRpdmrCTSX9AZIe','juan@apolloapps.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747082113,1755709283,1,'Juan','Gomez',NULL,NULL,'a67f443d10c6002cf709a60189a39e66088e8757c7158b61d7827627a451ce2f44388a1d55ce9fde9c5df8c93d114c51','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(15,'192.168.2.79','','$2y$10$D5eQnF6rSxJvRD1EhepZ1.YNxnBxCEZ4YasJdmLI7PYFwMmJMyDy2','edg@sozaclinic.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747179538,1748533551,1,'Edward','Gonzales','SozaClinic','901-237-7472','20ed26b177ec78cb495c72563c56ad2fd042a6891bacc1ffc0379f01c087df5e4faecec6a505534c89342fdd0ba67cbe','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(16,'192.168.2.79','','$2y$10$NfdELLVuJzZ/nDOEU8gY0.ANEhOe7JsogNAEq/aaQWDKq9gUetRia','jonathqweqwean@lunarpay.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747680095,NULL,1,'Jonathan','Bodnar','Apollo Eleven inc.','4699078539','c79fb884506f68e7471adda7717fc0aa3079639a7f2741ab73ea21f887cbba94ff66adc9242f4cd038ac07ecec7a856e','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(17,'192.168.5.79','','$2y$10$4wogCicFpbfOugcrNRL5O.TfVFJX6pYPdbrZAh02lF4wAv0OhICvm','breathstealersworld@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1748257772,1751915965,1,'Prasanna','','Breath Stealers Music Academy','9972620273','e207d7eb27b78b41ce7163c064c7f71afd3e96ff51429921120bbaf69fcda6b7bc4659631d2ed10072e6518f9e1e59ee','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(18,'192.168.5.79','','$2y$10$VRYuqDMTi3CcR56c8V1fJeY8HtFtOGSHPkEp4B1xJjd.vY8bUGm7u','jonathantest@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1748532646,NULL,1,'Jonathan','Bodnar','Marketing.biz LLC','4699078539','e1a219a6d21c9c9b6cb027894b71c8b6e4d2adb4659992f86dc8ad66fea9b1400bc5447d2c90afd9db8ade85153960ae','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(19,'192.168.2.82','','$2y$10$68vlzle9PJ9cxIz3uDyAMOoL.LBk8KY2rDLX1KZ6y9v7jarTCPFT6','pablogmzc@outlook.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750175549,1750180206,1,'Juan','Gmz','Test Prod Comp 2025-06-17','3006009000','deac7a71454b78d5365cd7f1f94deaf81dc8c2a57c270d79cc86e2f8dd49580385d1e5430b4c22885b2a852054116b5b','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(20,'192.168.2.82','','$2y$10$ytZZsY0irRmL6rXafe5QXuvNSEsxOEj7ZyepCAY8Bnzz80RUzYFKu','juan@lunarpay.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750181756,1750185015,1,'Juan','Gmz','Test Prod Comp 2025-06-17-2','3006009000','7b9789f56c019058a1ccea296e463999d49c1763542587cc4bc50249b5363f316508ff417453503969921cd36b044b28','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(21,'192.168.5.28','','$2y$10$jChLjD0StrO1qR9wa8sbburQvvUFzhThzuXg2Lf.biG1npCUrkgyy','atlas@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750691123,1750777601,1,'Jonathan','Bodnar','Atlas Holdings','4692079703','24616bf076e7f59f2abaeaa404ea6c95eafba501f249203fe19e71f9de2b4e67080808c5859f2ac5f8d911ce81e81c71','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(22,'192.168.5.28','','$2y$10$iQKFROwbThyP3D4YanvfEuEH//fwbMU.DKutzdwia5tYtGB7jKGvW','eustersshikol@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1751209714,NULL,1,'Eusters','Andalo','Forex','0707191729','1da6a65b12d9edf276913581c8a57d81ab9997671223a7e2766bd4f64edd5069bc2520e41c3ba483353b4444d801230f','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(23,'172.18.0.1','','$2y$10$9sIJFEyVN4hAwACK3mVvc.rQ.Q327DQkVRejffgwYl5Tyqjn33NFu','jb@leads.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1754688191,1756357865,1,'Jonathan','Bodnar','Leads.biz LLC','4692079703','7437bb693b9eddb7c82565c9c0aaeb8adfb20fc85116c428f36706f70ded9cc8c124968f3c1d12f44e38f69b225fb8d2','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL);



--
-- Table structure for table "users_groups"
--




CREATE TABLE IF NOT EXISTS "users_groups" (
 "id" SERIAL PRIMARY KEY,
 "user_id" INTEGER NOT NULL,
 "group_id" INTEGER NOT NULL
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
 "webhook_type" VARCHAR(50) NOT NULL,
 "client_id" VARCHAR(255) NOT NULL,
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
 "webhook_url" VARCHAR(500) NOT NULL,
 "event_type" VARCHAR(100) NOT NULL,
 "event_id" VARCHAR(255) DEFAULT NULL
);


--
-- Dumping data for table "webhook_sent_logs"
--



INSERT INTO "webhook_sent_logs" VALUES (1,'sub','2','success',0,3,NULL,'2025-07-04 17:15:30','2025-07-04 22:15:30','2025-07-04 22:15:30','{""event_type"":""subscription_updated"",""timestamp"":""2025-07-04T17:15:30-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""1"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-07-11 00:00:00"",""next_payment_on"":""2025-07-11 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""D"",""trial_ends_at"":""2025-07-11 23:59:59"",""ends_at"":""2025-07-11 23:59:59"",""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_686852827b8015.88008975'),(2,'sub','2','success',0,3,NULL,'2025-07-04 17:20:05','2025-07-04 22:20:05','2025-07-04 22:20:05','{""event_type"":""subscription_created"",""timestamp"":""2025-07-04T17:20:05-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""2"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-07-11 00:00:00"",""next_payment_on"":""2025-07-11 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-07-11 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_68685395bf4d75.62785501'),(3,'sub','2','success',0,3,NULL,'2025-07-11 03:00:01','2025-07-11 08:00:01','2025-07-11 08:00:01','{""event_type"":""subscription_updated"",""timestamp"":""2025-07-11T03:00:01-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""2"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-07-11 00:00:00"",""next_payment_on"":""2025-07-11 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-07-11 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_6870c481727b46.37889039'),(4,'sub','2','success',0,3,NULL,'2025-07-11 03:00:01','2025-07-11 08:00:01','2025-07-11 08:00:01','{""event_type"":""subscription_updated"",""timestamp"":""2025-07-11T03:00:01-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""2"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-07-11 00:00:00"",""next_payment_on"":""2025-07-11 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-07-11 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_6870c481738f74.98668289'),(5,'sub','23','success',0,3,NULL,'2025-08-13 12:40:43','2025-08-13 17:40:43','2025-08-13 17:40:43','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T12:40:43-05:00"",""client_id"":""23"",""data"":{""customer_id"":""30"",""subscription_id"":""4"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan2@marketing.biz"",""customer_name"":""Juan Gomez"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689cce1b411623.31803227'),(6,'sub','23','success',0,3,NULL,'2025-08-13 13:20:03','2025-08-13 18:20:03','2025-08-13 18:20:03','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-13T13:20:03-05:00"",""client_id"":""23"",""data"":{""customer_id"":""32"",""subscription_id"":""3"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""jbtestpay@leads.biz"",""customer_name"":""Jonathan Bodnar"",""c_status"":""cancelled"",""status"":""D"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":""2025-08-20 23:59:59"",""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_689cd75307efe2.85028537'),(7,'sub','23','success',0,3,NULL,'2025-08-13 13:20:12','2025-08-13 18:20:12','2025-08-13 18:20:12','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T13:20:12-05:00"",""client_id"":""23"",""data"":{""customer_id"":""32"",""subscription_id"":""5"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""jbtestpay@leads.biz"",""customer_name"":""Jonathan Bodnar"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689cd75c285ef8.98356997'),(8,'sub','2','success',0,3,NULL,'2025-08-13 15:14:46','2025-08-13 20:14:46','2025-08-13 20:14:46','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T15:14:46-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""6"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_689cf23619d564.52797684'),(9,'sub','2','success',0,3,NULL,'2025-08-13 15:15:52','2025-08-13 20:15:52','2025-08-13 20:15:52','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T15:15:52-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""7"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_689cf27804d955.66179144'),(10,'sub','23','success',0,3,NULL,'2025-08-13 16:09:51','2025-08-13 21:09:51','2025-08-13 21:09:51','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-13T16:09:51-05:00"",""client_id"":""23"",""data"":{""customer_id"":""30"",""subscription_id"":""4"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan2@marketing.biz"",""customer_name"":""Juan Gomez"",""c_status"":""cancelled"",""status"":""D"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":""2025-08-20 23:59:59"",""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_689cff1fa6d908.65806576'),(11,'sub','23','success',0,3,NULL,'2025-08-13 19:19:32','2025-08-14 00:19:31','2025-08-14 00:19:32','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T19:19:31-05:00"",""client_id"":""23"",""data"":{""customer_id"":""34"",""subscription_id"":""8"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""baxterwandf@gmail.com"",""customer_name"":""Jake Baxter"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689d2b937bbff5.75108551'),(12,'sub','23','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:01','2025-08-20 08:00:02','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-20T03:00:01-05:00"",""client_id"":""23"",""data"":{""customer_id"":""32"",""subscription_id"":""5"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""jbtestpay@leads.biz"",""customer_name"":""Jonathan Bodnar"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68a58081d1e236.73650804'),(13,'sub','2','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-20T03:00:02-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""6"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_68a580821fa5c1.79871021'),(14,'sub','2','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-20T03:00:02-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""7"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_68a58082434137.02767687'),(15,'sub','23','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-20T03:00:02-05:00"",""client_id"":""23"",""data"":{""customer_id"":""34"",""subscription_id"":""8"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""baxterwandf@gmail.com"",""customer_name"":""Jake Baxter"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68a58082639150.53228511'),(16,'sub','23','success',0,3,NULL,'2025-08-22 15:29:48','2025-08-22 20:29:48','2025-08-22 20:29:48','{""event_type"":""subscription_created"",""timestamp"":""2025-08-22T15:29:48-05:00"",""client_id"":""23"",""data"":{""customer_id"":""30"",""subscription_id"":""9"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-29 00:00:00"",""next_payment_on"":""2025-08-29 23:59:59"",""customer_email"":""juan2@marketing.biz"",""customer_name"":""Juan Gomez"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-29 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_68a8d33c0378e4.82013835'),(17,'sub','23','success',0,3,NULL,'2025-08-25 07:29:48','2025-08-25 12:29:47','2025-08-25 12:29:48','{""event_type"":""subscription_created"",""timestamp"":""2025-08-25T07:29:47-05:00"",""client_id"":""23"",""data"":{""customer_id"":""58"",""subscription_id"":""10"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-09-01 00:00:00"",""next_payment_on"":""2025-09-01 23:59:59"",""customer_email"":""pierrecampbell77@gmail.com"",""customer_name"":""Pierre Campbell"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-09-01 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_68ac573b2afc03.32836300'),(18,'sub','23','success',0,3,NULL,'2025-08-29 09:00:05','2025-08-29 14:00:04','2025-08-29 14:00:05','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-29T09:00:04-05:00"",""client_id"":""23"",""data"":{""customer_id"":""30"",""subscription_id"":""9"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-29 00:00:00"",""next_payment_on"":""2025-09-29 23:59:59"",""customer_email"":""juan2@marketing.biz"",""customer_name"":""Juan Gomez"",""c_status"":""unpaid"",""status"":""A"",""trial_ends_at"":""2025-08-29 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":""23"",""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68b1b264c506d2.14298499');



--
-- Table structure for table "zadm_groups"
--




CREATE TABLE IF NOT EXISTS "zadm_groups" (
 "id" SERIAL PRIMARY KEY,
 "name" VARCHAR(20) NOT NULL,
 "description" VARCHAR(100) NOT NULL
);


--
-- Dumping data for table "zadm_groups"
--



INSERT INTO "zadm_groups" VALUES (1,'admin','Administrator'),(2,'members','General User');



--
-- Table structure for table "zadm_login_attempts"
--




CREATE TABLE IF NOT EXISTS "zadm_login_attempts" (
 "id" SERIAL PRIMARY KEY,
 "ip_address" VARCHAR(45) NOT NULL,
 "login" VARCHAR(100) DEFAULT NULL,
 "time" INTEGER DEFAULT NULL
);


--
-- Dumping data for table "zadm_login_attempts"
--






--
-- Table structure for table "zadm_users"
--




CREATE TABLE IF NOT EXISTS "zadm_users" (
 "id" SERIAL PRIMARY KEY,
 "ip_address" VARCHAR(45) NOT NULL,
 "username" VARCHAR(100) NOT NULL,
 "password" VARCHAR(255) NOT NULL,
 "email" VARCHAR(254) NOT NULL,
 "activation_selector" VARCHAR(255) DEFAULT NULL,
 "activation_code" VARCHAR(255) DEFAULT NULL,
 "forgotten_password_selector" VARCHAR(255) DEFAULT NULL,
 "forgotten_password_code" VARCHAR(255) DEFAULT NULL,
 "forgotten_password_time" INTEGER DEFAULT NULL,
 "remember_selector" VARCHAR(255) DEFAULT NULL,
 "remember_code" VARCHAR(255) DEFAULT NULL,
 "created_on" INTEGER NOT NULL,
 "last_login" INTEGER DEFAULT NULL,
 "active" SMALLINT DEFAULT NULL,
 "first_name" VARCHAR(50) DEFAULT NULL,
 "last_name" VARCHAR(50) DEFAULT NULL,
 "company" VARCHAR(100) DEFAULT NULL,
 "phone" VARCHAR(20) DEFAULT NULL,
 "access_token" char(96) DEFAULT NULL,
 "gbarber_app_status" VARCHAR(1) DEFAULT NULL,
 "gbarber_app_url" VARCHAR(256) DEFAULT NULL,
 "gbarber_app_created_attempt" TIMESTAMP DEFAULT NULL,
 "planning_center_oauth" text DEFAULT NULL
);


--
-- Dumping data for table "zadm_users"
--



INSERT INTO "zadm_users" VALUES (1,'127.0.0.1','administrator','$2y$12$qod/OYjwZeOl/6S3Dq2IseIEg2ielhbPmpTG72R8ZGutT/CbbiSH2','admin@admin.com',NULL,'',NULL,NULL,NULL,NULL,NULL,1268889823,1650906737,1,'Administrator','','ADMIN','0',NULL,NULL,NULL,NULL,NULL);



--
-- Table structure for table "zadm_users_groups"
--




CREATE TABLE IF NOT EXISTS "zadm_users_groups" (
 "id" SERIAL PRIMARY KEY,
 "user_id" INTEGER NOT NULL,
 "group_id" INTEGER NOT NULL
);


--
-- Dumping data for table "zadm_users_groups"
--



INSERT INTO "zadm_users_groups" VALUES (1,1,1);












-- Dump completed on 2025-08-29 12:14:01

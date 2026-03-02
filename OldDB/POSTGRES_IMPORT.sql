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
  "created_from" varchar(255) DEFAULT NULL VALUES (1,1,1);

-- Dump completed on 2025-08-29 12:14:01

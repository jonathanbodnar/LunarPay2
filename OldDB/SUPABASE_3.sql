

CREATE TABLE IF NOT EXISTS "invoice_products" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "invoice_id" INTEGER DEFAULT NULL,
 "product_id" INTEGER DEFAULT NULL,
 "product_name" varchar(255) DEFAULT NULL,
 "price" decimal(10,2) DEFAULT NULL,
 "quantity" INTEGER DEFAULT NULL USING BTREE USING BTREE
);


--
-- Dumping data for table "invoice_products"
--



INSERT INTO "invoice_products" VALUES (1,1,1,'Prodcompanytest1 P1',10.00,1),(2,2,2,'Test Product 1',1.00,1),(3,3,2,'Test Product 1',1.00,1),(4,4,3,'Consulting',100.00,1),(5,5,2,'Test Product 1',1.00,1),(6,6,2,'Test Product 1',1.00,1),(7,7,2,'Test Product 1',1.00,1),(9,8,4,'Hours',80.00,1680),(10,9,2,'Test Product 1',1.00,1),(11,10,4,'Hours',80.00,1),(12,11,4,'Hours',80.00,1),(13,12,4,'Hours',80.00,1),(14,13,2,'Test Product 1',1.00,1),(15,14,4,'Hours',80.00,1),(16,15,3,'Consulting',100.00,1),(18,16,2,'Test Product 1',1.00,1),(19,16,3,'Consulting',100.00,1),(24,17,4,'Hours',80.00,1680),(25,18,4,'Hours',80.00,1520),(28,19,4,'Hours',80.00,1520),(30,20,2,'Test Product 1',1.00,1),(32,21,4,'Hours',80.00,1520),(34,22,4,'Hours',80.00,1320),(35,23,2,'Test Product 1',1.00,1),(37,24,4,'Hours',80.00,800),(38,25,8,'Test',50.00,1),(41,26,4,'Hours',80.00,420),(43,27,4,'Hours',80.00,180),(44,28,15,'One Dolar Product1',1.00,1),(45,29,16,'Full Software Project',15000.00,1),(46,30,17,'Development',15000.00,1),(48,31,17,'Development',15000.00,1),(49,32,14,'One Click Funnel (periodically)',297.00,1);

UN

--
-- Table structure for table "invoices"
--




CREATE TABLE IF NOT EXISTS "invoices" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "reference" varchar(32) DEFAULT NULL,
 "church_id" INTEGER DEFAULT NULL,
 "campus_id" INTEGER DEFAULT NULL,
 "hash" varchar(150) DEFAULT NULL,
 "donor_id" INTEGER DEFAULT NULL,
 "stripe_id" varchar(40) DEFAULT NULL,
 "freshbooks_id" varchar(40) DEFAULT NULL,
 "quickbooks_id" varchar(40) DEFAULT NULL,
 "tags" varchar(1024) DEFAULT NULL,
 "payment_options" varchar(255) DEFAULT NULL,
 "memo" varchar(500) DEFAULT NULL,
 "footer" varchar(500) DEFAULT NULL,
 "total_amount" decimal(10,2) DEFAULT NULL,
 "fee" decimal(10,2) NOT NULL DEFAULT 0.00,
 "fee_when_amex" decimal(10,2) NOT NULL DEFAULT 0.00,
 "fee_when_ach" decimal(10,2) NOT NULL DEFAULT 0.00,
 "due_date" date DEFAULT NULL,
 "status" char(1) DEFAULT 'D',
 "cover_fee" SMALLINT DEFAULT NULL,
 "finalized" TIMESTAMP DEFAULT NULL,
 "trash" SMALLINT NOT NULL DEFAULT 0,
 "pdf_url" varchar(255) DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT NULL,
 "updated_at" TIMESTAMP DEFAULT NULL,
 "show_post_purchase_link" SMALLINT DEFAULT NULL,
 "post_purchase_link" varchar(255) DEFAULT NULL,
 "subscription_id" INTEGER DEFAULT NULL,
 "payment_method_id" INTEGER DEFAULT NULL USING BTREE USING BTREE USING BTREE
);


--
-- Dumping data for table "invoices"
--



INSERT INTO "invoices" VALUES (1,'IN9513A056-001',1,NULL,'110052a6edbde57c73a0c3ac4f7e67ff4555b887163b2770b099b0e9180349a9cc0c459ffc4339adbe0bafd4a59529d2c354d545cbf2d5d6601d6f430fb8b92db',1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',10.00,0.00,0.00,0.00,'2025-01-16','E',NULL,'2025-01-09 14:14:35',0,'https://app.lunarpay.com/files/get/invoices/INV_IN9513A056-001_a7783679add0b3f8c227c901ba5c73788da9591198881ff9d710c397eff4b3cfbb3b8ad7797898cba7d155ad463fe57d474d8ba8e84621b64964f688a0e959bc.pdf.crypt','2025-01-09 14:14:35','2025-01-17 02:00:01',NULL,NULL,NULL,NULL),(2,'IN9513A068-002',2,NULL,'2d2d83b3be0288e2af3902d4af70ab6d0989d80f835d3845513d47f4dec832c176e9e33960f37a4cc46b57b45464c0ea8a32fce6c30548099883c22d620eef8a5',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-01-16','P',NULL,'2025-01-09 14:32:12',0,'https://app.lunarpay.com/files/get/invoices/INV_IN9513A068-002_5c933e47df34c21aed4a47fc0549e12b5500a44ec2f0ea992f2bbead022ce23158e9851c6d3a9bcadd6b919479052b8d48896f449b400b26885fd72d7bc0c033.pdf.crypt','2025-01-09 14:32:12','2025-01-09 15:10:15',NULL,NULL,NULL,NULL),(3,'IN9513C915-003',2,NULL,'31728230fe8716d4fc744333f7154d738172433a95b5c6a59447e057022c7e5c4708cd0452a2b2df54816c8131339938ee05992215281b23aa2f443721a3ffde1',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-01-17','C',NULL,'2025-01-10 18:45:29',0,'https://app.lunarpay.com/files/get/invoices/INV_IN9513C915-003_e4c79284c11c12790bd289eadc1ed3a3d13564466a254102dc6613cdd4a78e5a4a6cd017bd1c5cf4355a9600318db86fe851be098f34d4618ed3fd21321b765e.pdf.crypt','2025-01-10 18:45:29','2025-01-27 14:40:01',NULL,NULL,NULL,NULL),(4,'IN9514D638-004',2,NULL,'49194d63bf5c43d1382d6c9ac401422151913fe80e333e28cb1f0dd6fbf71154074329286fa7b7cae1ce247448c45a52f7c49a8ca847b4d7f26b09d1e1c200784',3,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',100.00,3.30,0.00,1.52,'2025-01-24','P',1,'2025-01-17 07:44:31',0,'https://app.lunarpay.com/files/get/invoices/INV_IN9514D638-004_5c1145a94fe22a80894295f95cc81769a3fe33c3883679f3770a58f189175e85676f6027284ff1a312138ad87b13e1ac8a7c9e2d6ab8770b88d04e68e459d0c3.pdf.crypt','2025-01-17 07:44:31','2025-01-17 07:45:23',1,'https://apollo.inc',NULL,NULL),(5,'IN95165F6B-005',2,NULL,'5d8ccd8c0aefa21616394ee397576448b646ec12226b2a8add1fc62cb28c0204a8b4c911a96931cd593acd6ac57cc0074dbcbbe5192bd53e2f637137228a1aee2',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-02-03','C',NULL,'2025-01-27 14:03:59',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95165F6B-005_216fcd818815593b48cc05d701c8c1ea5e3aa411ce248e51532c6ff3116503a5806ba46aa22ca191d8f5ac7de51c249cfa44cca23ad656ed9f2f1a4331104f6c.pdf.crypt','2025-01-27 14:03:59','2025-01-27 14:05:03',NULL,NULL,NULL,NULL),(6,'IN95165F6D-006',2,NULL,'64928e7041a2088cde1def294c1859a9946e8b4772e40bcf533c73d517aa621e324b65d9f1c1a7c363d906f31405abd0b91cb7dac0a5dabb186b5452f07f5cd27',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-02-03','C',NULL,'2025-01-27 14:05:21',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95165F6D-006_6a9cd0ec49918a09247e754228203b2776505d6fd3a99dfb1be58966dbc1b2ad0fe10ec42b65e8b844e0a91c0fd2781320008d150aecd15ce53483b9f907b492.pdf.crypt','2025-01-27 14:05:21','2025-01-27 14:21:54',NULL,NULL,NULL,NULL),(7,'IN95165F7E-007',2,NULL,'76c9df29b77d2e13c196fa41fedc41dac602de8bbca9ce2dcaff388891b2ff9c7e7767d121870efbcc6df1d7863961c85cbe5ca995f0403ba3749f11319a37c97',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-02-03','C',NULL,'2025-01-27 14:22:03',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95165F7E-007_5556af3a0635bd981b2c8dccf8bafc6c4b45ba092cde81e2338798158d7ccd22bef87914146e8bef10926d4f05f1d03b3ef4abe462e939a182430df976e548e5.pdf.crypt','2025-01-27 14:22:03','2025-01-27 14:22:13',NULL,NULL,NULL,NULL),(8,'IN95165FDF-008',2,NULL,'8d134182eb5db283828d44cbe05bff799b16445a6e54760eadaa84cdcab885c12929acef7a0020d041f1d68f85cac9572669a9841365c13df191f40c34cd6da13',4,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Per SOW for Q1 (10.5 team members * 160 hours)','Thank you for being a valued partner with Apollo!',134400.00,4014.32,0.00,1701.52,'2025-02-03','P',1,'2025-01-27 15:23:07',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95165FDF-008_139f3ec55b5c6780b73ae1eb89142b0ff3d870fc967232f590caa5c0a7215911f95441b33f56ad3e3dec3228fb18dd71751961a6266348b95debad85fa5aa6f8.pdf.crypt','2025-01-27 15:19:45','2025-01-28 12:48:47',NULL,NULL,NULL,NULL),(9,'IN95168487-009',2,NULL,'91fd23e4c1ebbee16a4e652b388812137ad8da942aa852b555353ca7a21932d7282ade3dea4faa3454885bc7476985ce87b626718e1e1193e18264106e21de287',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Test email invoice from production','',1.00,0.00,0.00,0.00,'2025-02-04','C',NULL,'2025-01-28 09:03:48',1,'https://app.lunarpay.com/files/get/invoices/INV_IN95168487-009_0065ddd36ba683e12835decccfd755b65a4744d608609bdedcffdd382950090bdbb02c66ce9ea142a437da183ea677804b7f2ce8069d615db090ec3306bf9595.pdf.crypt','2025-01-28 09:03:48','2025-01-28 09:41:36',NULL,NULL,NULL,NULL),(10,'IN9516868B-0010',2,NULL,'10a22bf4457d1e6ac4264c61cfc0ab738aa176f93800ac6afcfd23fe50d457340897a7470aba0ba8e823b0a6f902ebbdd0d037578de1b65407b79fbb1f524a6a28',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',80.00,0.00,0.00,0.00,'2025-02-04','C',NULL,'2025-01-28 14:19:11',1,'https://app.lunarpay.com/files/get/invoices/INV_IN9516868B-0010_e1cf7147124c2f25c7e774bb7fe975a320b7035d82aeaebf8d81da4c524221078b4e50208dd93fd91a365673074ee9a543c1c53a8cae4d695240ea33cc6eb30a.pdf.crypt','2025-01-28 14:19:11','2025-01-28 14:21:26',NULL,NULL,NULL,NULL),(11,'IN9516868C-0011',2,NULL,'112928bde3623489172a3ee2de2ee435d3c37a8b3acb872f5bf879ef9561e0888b2ca51c97d674fd032ec70e4e194772ca8bef5ea909484d00e88a90cab4ece5d0',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',80.00,0.00,0.00,0.00,'2025-02-04','C',NULL,'2025-01-28 14:20:36',1,'https://app.lunarpay.com/files/get/invoices/INV_IN9516868C-0011_e52d87bd05609a3a26809ec2e625678d88c0e0ecdbf1cc59012512d5f713611cd35c41526b78326b8f17be889de4fbe3482c76ea906140b3c170a30f29ffd153.pdf.crypt','2025-01-28 14:20:36','2025-01-28 14:21:35',NULL,NULL,NULL,NULL),(12,'IN9516868D-0012',2,NULL,'12d0c318de487ffc37352b20c78079cd424f97683ddde1505ccb1adcd6b94ac211ee4d71923b51c76e87bee9a1e8848ca31ecaa9891fbbaf347939ca280be8bde4',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',80.00,0.00,0.00,0.00,'2025-02-04','C',NULL,'2025-01-28 14:21:53',1,'https://app.lunarpay.com/files/get/invoices/INV_IN9516868D-0012_e2c8f489ff011234656b80867ba3eab966ba5c3cef89072033c3a798924c0f878254333dbd41bceff8d2b3c8910e84faa462901ff42b7da7a4ff97f517d1856c.pdf.crypt','2025-01-28 14:21:53','2025-01-28 14:24:16',NULL,NULL,NULL,NULL),(13,'IN9516868F-0013',2,NULL,'13f5b00ffb0c6c4a0e0e6b8077d7e202d0379e392f115b33e6f20877951bd7f249adc3aeb3c192f5e3a5806d76b867e076b09730d5d8c27c9da8833d21d428ec34',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-02-04','C',NULL,'2025-01-28 14:23:26',1,'https://app.lunarpay.com/files/get/invoices/INV_IN9516868F-0013_54ae41161cfdc85072447744c7ae64e2925d0040414ecd4fd3d0dd6d4934b67b0bcea719be07b1b12c86d70b0ee22da06b031eeb68e33ed83a8335c648dc2440.pdf.crypt','2025-01-28 14:23:26','2025-01-28 14:24:23',NULL,NULL,NULL,NULL),(14,'IN9516868F-0014',2,NULL,'140f5921406422384478f47911e0c59c3ee746fb1b632fb1e54bca885ac231571a979b3e52c5f5e03dcb178144c34e75b593b15211ec7d53e33033faee8e4de26c',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',80.00,0.00,0.00,0.00,'2025-02-04','C',NULL,'2025-01-28 14:23:51',1,'https://app.lunarpay.com/files/get/invoices/INV_IN9516868F-0014_220f4b5055fe3f40669adc6a06383dcb4fa75e51a12713574002e1937a1e70b9c700eb228c657aa8fcdc3ceb315afb084f1040812bfbbafb0bfe800ddd305867.pdf.crypt','2025-01-28 14:23:51','2025-01-28 14:36:34',NULL,NULL,NULL,NULL),(15,'IN951687A6-0015',2,NULL,'159fd2a7d112906dd01c8b844dde4e5ca7675efa70adb0763d8b0ce4c98edbc2752b6092438ef754d94633c50c508f7eb87148e09d5fb5d53b76253d0e0b0ffd22',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','This is a test production invoice','',100.00,0.00,0.00,0.00,'2025-02-04','C',NULL,'2025-01-28 17:02:16',1,'https://app.lunarpay.com/files/get/invoices/INV_IN951687A6-0015_dc0cc69e57d128d0d8ff1d1cdd9db18bad36abcb3fcbf4fec0361832a1b276eee821a14ee30225af80ed088ef3d387779793f1b0da09e85e91c036ac40dd4e04.pdf.crypt','2025-01-28 17:02:16','2025-01-29 17:37:03',NULL,NULL,NULL,NULL),(16,'IN952469BE-0016',2,NULL,'166ff85ad5ea8da3a4a0c8efb935c525287a81e9632c891fd6ea5d45cdba9755ce46d0faed84c22ea5500eb5072c1a7aad3028b3a4cef9bd7a22b83cfa7c016cc2',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',101.00,3.33,4.03,1.53,'2025-02-26','E',1,'2025-02-19 15:53:53',1,'https://app.lunarpay.com/files/get/invoices/INV_IN952469BE-0016_0790fa3386ccbeecef1dd900e74109c7319fbdca017bea5a01302b887d5730ab24708f5b6eef246dc4c228de03bea543e27f7292ff3fea1c16f27be84be3347c.pdf.crypt','2025-02-19 15:50:43','2025-02-27 02:00:01',NULL,NULL,NULL,NULL),(17,'IN95246A19-0017',2,NULL,'1751bcc11bb8edba9b1011b7b065df2874d51cbb87eeb338408cff436b552503dbc18eeaa5bdc3dab4e8a73cfe34b8f5e0132ea6120ca8a62c940eca986425f1b0',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',134400.00,4014.32,4874.97,1701.52,'2025-02-26','E',1,'2025-02-19 16:57:26',1,'https://app.lunarpay.com/files/get/invoices/INV_IN95246A19-0017_54645b20f0b7ee3a6b73fccc7c5b27efb4d8ab631f1654595eb2cc95d14be77a068149ab456581a4acac50052eb612d339d95d6ac7ff8e298c01bd89439f84ff.pdf.crypt','2025-02-19 16:41:32','2025-02-27 02:00:01',NULL,NULL,NULL,NULL),(18,'IN95255390-0018',2,NULL,'181d6031c09b2c3f738b1cbc2dabbd4e86f5ff806c83bdbba10b1cd8d8dd968246aad73439e5281f19ef8f57665dd0f9b1e64520aceb9db8e7fb36ec799c9c581b',4,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Breakdown of assets & hours in footer.','Hourly breakdown: https://docs.google.com/spreadsheets/d/1GLVyHzvwpsWl3A7TCJ9I3qNMj3jv_CnL/edit?usp=sharing&ouid=110802042761032939216&rtpof=true&sd=true',121600.00,3632.03,4410.73,1539.49,'2025-02-28','P',1,'2025-02-25 14:08:31',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95255390-0018_3b1d8c91f0f1066cef1a541cb6d48a34a25593e06946777d81ac9a5081da8fef065651d62100f627ad117446d051d024439058e06e9fdea952abed98796967f9.pdf.crypt','2025-02-25 14:08:31','2025-03-01 21:40:24',NULL,NULL,NULL,NULL),(19,'IN95346E0A-0019',2,NULL,'19da0a9b7c817b7a7ed2d2163b7ae67e523220be0577338345e8aacfbfd5b2aa5812091c3872d4c23474f4275839cc7661d947d7ebb531e565749be1f814754217',4,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Breakdown of assets & hours in footer.','Hourly breakdown: https://docs.google.com/spreadsheets/d/1GLVyHzvwpsWl3A7TCJ9I3qNMj3jv_CnL/edit?usp=sharing&ouid=110802042761032939216&rtpof=true&sd=true',121600.00,3632.03,4410.73,1539.49,'2025-03-29','P',1,'2025-03-25 09:18:10',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95346E0A-0019_edd90186c37c8fb4a89af2baabed6d4823a3d5d493b53236ea5a88adc63d81091f7034df23533b94eb8ead482b38b3361a7a5cf7129563397fc5f142488a5604.pdf.crypt','2025-03-24 12:26:28','2025-03-31 12:58:04',NULL,NULL,NULL,NULL),(20,'IN95438CBF-0020',2,NULL,'208023e60e1b247e2acc0c08b995af8e4c361cdff2a730fa15cd650fa487583857dd10b4e216b909d3c81b7fed92bfaf4a0364a10b419fbf9e96adb1778f711294',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-04-30','P',NULL,'2025-04-23 21:27:28',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95438CBF-0020_ef6e6aadedb8c89743e25268e71bcb2f046a5debab2260880b8c770d838fbc3c8ea84a9adb609bf06228ac941377a9129bb1d87c254d875bdec4dcd7047e83f9.pdf.crypt','2025-04-23 21:27:20','2025-05-09 12:44:00',NULL,NULL,NULL,NULL),(21,'IN9543D692-0021',2,NULL,'214cb2139657873d8477df238983ae96d5be238f6331db87255fe8248b9f349e373c158c7c635fe302e49edeb6ab37c64fef566917b641d8041343b1e380ebd8c3',4,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Breakdown of assets & hours in footer.','Hourly breakdown: https://docs.google.com/spreadsheets/d/1V0wjXguaCa61wSZr9Pw08WIr2cWVDYg4/edit?usp=sharing&ouid=110802042761032939216&rtpof=true&sd=true',121600.00,3632.03,4410.73,1539.49,'2025-04-30','P',1,'2025-04-28 09:56:08',0,'https://app.lunarpay.com/files/get/invoices/INV_IN9543D692-0021_24bb5a96c41150a5b62e70172ed912039305b7af7b38598cfa523829737826303998e6d08124ae18e4b33a553d0880ac6b96fca91379a2a33124421c831fcf2d.pdf.crypt','2025-04-25 10:26:59','2025-04-30 22:39:25',NULL,NULL,NULL,NULL),(22,'IN95536876-0022',2,NULL,'22aa5deda9dbe5e7cd9be46fad60ad275036a03593290944018c9a113e63c5043aadcd20f95fd631f5d1b6f2ba633b2b05b3cb64269ab7234d7157575ffd1e5a37',4,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Breakdown of assets & hours in footer.','Hourly breakdown: https://docs.google.com/spreadsheets/d/1asakErxULQ5NxAUR56bilmbC61c1qpyD/edit?usp=sharing&ouid=110802042761032939216&rtpof=true&sd=true',105600.00,3154.17,3830.41,1336.96,'2025-05-28','P',1,'2025-05-27 14:15:51',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95536876-0022_c9aa10c8949aceaffd086b3e0a6f4bd55a374b907107119b93f263d7e4ad92173f2b53c03ba35b4e659ae24dc5312e85ac629b91e1cbf12073b988357adbed38.pdf.crypt','2025-05-27 14:14:28','2025-05-27 18:52:54',NULL,NULL,NULL,NULL),(23,'IN955ED7D2-0023',2,NULL,'23cc669c64544fdc04d313d64c19180a14795760d5434432c8303d66b6b1f6265eb899d0ad3b8d56152470ce6aa01ef98a31dc1a030f1fdeadc93e05b5527fae05',2,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-06-09','D',NULL,'2025-06-02 08:18:01',0,'https://app.lunarpay.com/files/get/invoices/INV_IN955ED7D2-0023_fc0bee342438c4a3ef6a83902e0beb39ab52656d6f27b86aac19d2d763eb2d30925f96ad3c0456cc5e31e2291aaeb984ab4210e77ba7843b0789c0f68c28e042.pdf.crypt','2025-06-02 08:18:01',NULL,NULL,NULL,NULL,1),(24,'IN9562378A-0024',2,NULL,'244b5ac008a2273b920d0e9e16f37f6c963092e29f908cda03af064366568cfc3544942113f326b70bcc4020b4cebfba703c996da580eabacc4c18b229f9617d0d',4,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Breakdown of assets & hours in footer.','Hourly breakdown: https://docs.google.com/spreadsheets/d/1qqN3xMiQaUc2pZP6IkbGthP5HBxRvBve/edit?usp=sharing&ouid=110802042761032939216&rtpof=true&sd=true',64000.00,1911.74,2321.61,810.38,'2025-06-27','P',1,'2025-06-24 19:32:57',0,'https://app.lunarpay.com/files/get/invoices/INV_IN9562378A-0024_844913b8a8a523cf06cdf6f9a4c3796d97722ece3f1bc5cc60591623afdb059d27e234d6271bcc9f8a5dc9c89b39cfce0f1e73f4020fe05e27d90a0a93906b24.pdf.crypt','2025-06-24 19:30:39','2025-06-26 22:50:36',NULL,NULL,NULL,NULL),(25,'IN95715120-0025',14,NULL,'25078b7a1c41f8c7b6a4997cb9c6d46645c8425895988e837782ee20368b03fc25a363b39531d69bb6a0c07a07ade79cf1fb2d93a1e676ff92ee8ff95a8e87df85',15,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',50.00,0.00,0.00,0.00,'2025-07-30','E',NULL,'2025-07-23 15:20:06',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95715120-0025_b7d9f1055d29a1e1f9e790a36502fe8f891beae7561b0de175b64f8955407bfaf74a49ea765759722c7938b1fc95981d36798439dae470afeb6e0de3841bc71d.pdf.crypt','2025-07-23 15:20:06','2025-07-31 03:00:01',NULL,NULL,NULL,NULL),(26,'IN9571771A-0026',2,NULL,'26fc5c88aa27839e7a5d4d0c7c3e08aaaf3f82ff3a6af09c6b5876fe2b0a903d89cdf10f630027027ebb2daf91b162d69ee313c1e5239011012d0310e6c12125db',4,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Final hourly breakdown: 420: Nicholas Uzoni 20 Rowdy Fraser 80 Jalie Wooten 80 Muhammad Iftikhar 160 Muhammad Saeed 80','Https://docs.google.com/spreadsheets/d/1cv9iWzeFGrJH9Jpdz-mxnk3a-DEaaAjM/edit?usp=sharing&ouid=106987278055778111354&rtpof=true&sd=true',33600.00,1003.81,1219.02,425.57,'2025-07-30','E',1,'2025-07-24 16:16:38',0,'https://app.lunarpay.com/files/get/invoices/INV_IN9571771A-0026_dc3390680718fead5b74fbabcd2cefe62f56d8ebd082c83fa3cb0d907041f89e3dbd85170f563a5ec71f2810387bd62737e18088305819484b073a2957ed8962.pdf.crypt','2025-07-24 12:42:48','2025-07-31 03:00:01',NULL,NULL,NULL,NULL),(27,'IN95721471-0027',2,NULL,'27daa93a7054304a8289ba2ff14f7089ee1fb778026fbe6fe01399544247ff72e56cff20e2a9a755295df2a6d74f2cf2fe0c4cdedfb33bf3099fd92b77f72f8135',4,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','Nicholas Uzoni: 20 hours Rowdy Fraser: 80 hours Jalie Wooten: 80 hours','Https://docs.google.com/spreadsheets/d/1cv9iWzeFGrJH9Jpdz-mxnk3a-DEaaAjM/edit?usp=sharing&ouid=106987278055778111354&rtpof=true&sd=true',14400.00,430.38,522.64,182.53,'2025-08-03','P',1,'2025-07-28 15:22:17',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95721471-0027_76f2513a80b4ddaec121711a29c09426d5a2ef4ecac595b0baf9ea21a7615eed784aff0c84e5c24f7c1217e908547e8286e5ee347bbeee2b26304c77032b02d5.pdf.crypt','2025-07-28 15:21:50','2025-07-28 16:54:08',NULL,NULL,NULL,NULL),(28,'IN957EE5BD-0028',23,NULL,'289d6131cbeda5235f2fb7b57798721beb9e213944e2021a66f668b97af4f2f6e782b7f0a59221b605c373fb397efc9f179b9685c120631281329c3137ac1aee54',24,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',1.00,0.00,0.00,0.00,'2025-08-19','P',NULL,'2025-08-12 15:33:32',0,'https://app.lunarpay.com/files/get/invoices/INV_IN957EE5BD-0028_61b3428883ca8e9f7c848183fc0a4bdab679d07f037c79f33255d2cc883fed1c91acaa5f4c8eb5ac6cac2dc200b3d93f54a3968bbe3d588618cd902da6258475.pdf.crypt','2025-08-12 15:33:32','2025-08-12 15:36:49',NULL,NULL,NULL,NULL),(29,'IN957F596D-0029',23,NULL,'293c5fcc78ea7f50a512734a260604b8345ae3f7e5ec740afd09f85f4f600ab21f3059b031079ea6311e9c72149df016f99e4037f6326cbb7d68c18d66cb3cefae',40,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',15000.00,0.00,0.00,0.00,'2025-08-22','D',NULL,NULL,0,NULL,'2025-08-15 11:49:17',NULL,NULL,NULL,NULL,NULL),(30,'IN957FCDD1-0030',2,NULL,'306abc4b59cb3f08bb88d67f53ef34b5ca92abb3304875a171a831e2ef8d197e1e9d0d13d5816806862c1a5471d0fbca67bf4e7fc5f2cc5718fc40a4b3e424c5a3',43,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',15000.00,448.30,544.40,190.13,'2025-08-25','C',1,'2025-08-18 09:45:50',0,'https://app.lunarpay.com/files/get/invoices/INV_IN957FCDD1-0030_ddb4839f03f44a1d7b54b8232b07badf1411c9ab3400d968fd45b2d04f90c2afd5ecf57e169f0be57bd625e4bb3cb277fb64bfd31ed6b57d4656bb9866f4d3da.pdf.crypt','2025-08-18 09:45:50','2025-08-18 14:14:46',NULL,NULL,NULL,NULL),(31,'IN957FCFA6-0031',2,NULL,'31b15e69920882bcf315c81fd872b50fb933e0e5947e526d0562c74656e69f4103ab458f96c88d57bcd13a1736bcc146fa95d2963809bc70458e9abfd77dcdf4cc',43,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]','','',15000.00,0.00,0.00,0.00,'2025-08-25','P',NULL,'2025-08-18 14:14:21',0,'https://app.lunarpay.com/files/get/invoices/INV_IN957FCFA6-0031_04e657780879c3bac87da6e21062c02f705a6392fb99f972e57f82ad3adf502a3542a85faff49ef5c1c1c40ef5c379b56078c12908f1622ade985bc63104f40a.pdf.crypt','2025-08-18 14:14:13','2025-08-18 15:14:00',NULL,NULL,NULL,NULL),(32,'IN95817B54-0032',23,NULL,'328321d23438898f6e0361252a1efd170a4b88d77afd6321c4399b6c98d29639d7c6b1effa84e96f7b8bdc2e845ad6f7c0476709f6f135b37c201b406bde816f88',30,NULL,NULL,NULL,'Subscription #9','[""CC"",""BANK""]','Invoice generated from subscription #9','',297.00,0.00,0.00,0.00,'2025-08-29','U',NULL,'2025-08-29 09:00:01',0,'https://app.lunarpay.com/files/get/invoices/INV_IN95817B54-0032_78a1401e218aa6a0ba2b3fc280133670919ada6ce26bd54e8670ac0e6f47866629956af3349332823428cecd06fc3751d478d04c63499c5ed3caa58236c09a5b.pdf.crypt','2025-08-29 09:00:01',NULL,NULL,NULL,9,NULL);

UN

--
-- Table structure for table "login_attempts"
--




CREATE TABLE IF NOT EXISTS "login_attempts" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "ip_address" varchar(45) NOT NULL,
 "login" varchar(100) DEFAULT NULL,
 "time" INTEGER DEFAULT NULL
);


--
-- Dumping data for table "login_attempts"
--




UN

--
-- Table structure for table "migrations"
--




CREATE TABLE IF NOT EXISTS "migrations" (
 "version" BIGINT NOT NULL
);


--
-- Dumping data for table "migrations"
--



INSERT INTO "migrations" VALUES (20250813135056);

UN

--
-- Table structure for table "mobile_transaction"
--




CREATE TABLE IF NOT EXISTS "mobile_transaction" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "mobile_no" varchar(20) NOT NULL,
 "donarid" INTEGER NOT NULL,
 "church_id" INTEGER NOT NULL,
 "amount" float NOT NULL,
 "giving_type" varchar(30) NOT NULL,
 "source_name" varchar(20) NOT NULL,
 "date_time" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
 "sourceid" varchar(50) NOT NULL,
 "active" SMALLINT NOT NULL DEFAULT 1
);


--
-- Dumping data for table "mobile_transaction"
--




UN

--
-- Table structure for table "pages"
--




CREATE TABLE IF NOT EXISTS "pages" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "church_id" INTEGER DEFAULT NULL,
 "campus_id" INTEGER DEFAULT NULL,
 "client_id" INTEGER DEFAULT NULL,
 "page_name" varchar(200) DEFAULT NULL,
 "slug" varchar(200) DEFAULT NULL,
 "title" varchar(200) DEFAULT NULL,
 "content" varchar(1000) DEFAULT NULL,
 "background_image" varchar(200) DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT NULL,
 "style" char(1) DEFAULT NULL,
 "title_font_family" varchar(100) DEFAULT 'Segoe UI',
 "title_font_family_type" varchar(100) DEFAULT 'default',
 "content_font_family" varchar(100) DEFAULT 'Segoe UI',
 "content_font_family_type" varchar(100) DEFAULT 'default',
 "title_font_size" decimal(10,2) DEFAULT 3.50,
 "content_font_size" decimal(10,2) DEFAULT 2.00,
 "type_page" varchar(50) DEFAULT NULL,
 "conduit_funds" varchar(1000) DEFAULT NULL,
 "trash" SMALLINT DEFAULT 0 USING BTREE USING BTREE USING BTREE
);


--
-- Dumping data for table "pages"
--




UN

--
-- Table structure for table "payment_affiliates"
--




CREATE TABLE IF NOT EXISTS "payment_affiliates" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "amount" decimal(10,2) NOT NULL DEFAULT 0.00,
 "date_month_covered" date DEFAULT NULL,
 "date_created" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
 "user_id" INTEGER NOT NULL,
 "message" varchar(255) DEFAULT NULL
);


--
-- Dumping data for table "payment_affiliates"
--




UN

--
-- Table structure for table "payment_link_products"
--




CREATE TABLE IF NOT EXISTS "payment_link_products" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "payment_link_id" INTEGER NOT NULL,
 "product_id" INTEGER NOT NULL,
 "product_name" varchar(200) NOT NULL,
 "product_price" decimal(10,2) NOT NULL,
 "is_editable" SMALLINT NOT NULL DEFAULT 0,
 "qty" INTEGER NOT NULL,
 "is_qty_unlimited" SMALLINT NOT NULL DEFAULT 0
);


--
-- Dumping data for table "payment_link_products"
--



INSERT INTO "payment_link_products" VALUES (1,1,1,'Prodcompanytest1 P1',10.00,0,1,0),(2,2,2,'Test Product 1',1.00,0,1,0),(3,3,4,'Hours',80.00,0,1,0),(4,3,3,'Consulting',100.00,0,1,0),(5,3,2,'Test Product 1',1.00,0,1,0),(6,4,4,'Hours',80.00,0,1,0),(7,5,4,'Hours',80.00,0,1,0),(8,5,3,'Consulting',100.00,0,2,0),(9,6,5,'Recurring',100.00,0,1,0),(10,6,6,'Setup',1000.00,0,1,0),(11,7,2,'Test Product 1',1.00,0,1,0),(12,7,7,'Test2',1.00,0,1,0),(13,8,2,'Test Product 1',1.00,0,1,0),(14,8,7,'Test2',1.00,0,1,0),(15,9,9,'Magicweb Basic Mo',14.00,0,1,0),(16,10,9,'Magicweb Basic Mo',14.00,0,1,0),(17,11,10,'Magicweb Pro Mo',49.00,0,1,0),(18,12,11,'Magicweb Basic Yr',140.00,0,1,0),(19,13,12,'Magicweb Pro Yr',490.00,0,1,0),(20,14,9,'Magicweb Basic Mo',14.00,0,1,0),(21,15,13,'One Click Funnel (periodically)',297.00,0,1,0),(22,16,14,'One Click Funnel (periodically)',297.00,0,1,0),(23,17,18,'Leads In 7 Days',1200.00,0,1,0),(24,18,19,'Leads In 7 Days (discounted)',997.00,0,1,0),(25,19,20,'Full Ai Funnel',97.00,0,1,0),(26,20,21,'Unlimited Sms Marketing',27.00,0,1,0),(27,21,22,'Lifetime Access',27.00,0,1,0),(28,22,20,'Full Ai Funnel',97.00,0,1,0),(29,22,21,'Unlimited Sms Marketing',27.00,0,1,0),(30,23,20,'Full Ai Funnel',97.00,0,1,0),(31,23,21,'Unlimited Sms Marketing',27.00,0,1,0),(32,24,24,'One Click Funnel (periodically)',97.00,0,1,0),(33,25,20,'Full Ai Funnel',97.00,0,1,0),(34,25,22,'Lifetime Access',27.00,0,1,0),(35,26,21,'Unlimited Sms Marketing',27.00,0,1,0),(36,26,20,'Full Ai Funnel',97.00,0,1,0),(37,27,21,'Unlimited Sms Marketing',27.00,0,1,0);

UN

--
-- Table structure for table "payment_link_products_paid"
--




CREATE TABLE IF NOT EXISTS "payment_link_products_paid" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "transaction_id" INTEGER DEFAULT NULL,
 "subscription_id" INTEGER DEFAULT NULL,
 "payment_link_id" INTEGER DEFAULT NULL,
 "product_id" INTEGER DEFAULT NULL,
 "product_name" varchar(200) DEFAULT NULL,
 "qty_req" INTEGER DEFAULT NULL,
 "product_price" decimal(10,2) DEFAULT NULL
);


--
-- Dumping data for table "payment_link_products_paid"
--



INSERT INTO "payment_link_products_paid" VALUES (1,7,NULL,2,2,'Test Product 1',1,1.00),(2,13,NULL,2,2,'Test Product 1',1,1.00),(3,14,NULL,2,2,'Test Product 1',1,1.00),(4,NULL,1,14,9,'Magicweb Basic Mo',1,14.00),(5,NULL,2,14,9,'Magicweb Basic Mo',1,14.00),(6,NULL,3,16,14,'One Click Funnel (periodically)',1,297.00),(7,NULL,4,16,14,'One Click Funnel (periodically)',1,297.00),(8,NULL,5,16,14,'One Click Funnel (periodically)',1,297.00),(9,NULL,6,14,9,'Magicweb Basic Mo',1,14.00),(10,NULL,7,14,9,'Magicweb Basic Mo',1,14.00),(11,NULL,8,16,14,'One Click Funnel (periodically)',1,297.00),(12,NULL,9,16,14,'One Click Funnel (periodically)',1,297.00),(13,NULL,10,16,14,'One Click Funnel (periodically)',1,297.00),(14,21,NULL,21,22,'Lifetime Access',1,27.00),(15,22,NULL,21,22,'Lifetime Access',1,27.00),(16,23,NULL,16,14,'One Click Funnel (periodically)',1,297.00);

UN

--
-- Table structure for table "payment_links"
--




CREATE TABLE IF NOT EXISTS "payment_links" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "client_id" INTEGER NOT NULL,
 "hash" varchar(200) NOT NULL,
 "church_id" INTEGER NOT NULL,
 "campus_id" INTEGER DEFAULT NULL,
 "customer_id" INTEGER DEFAULT NULL,
 "customer_email" varchar(128) DEFAULT NULL,
 "status" SMALLINT NOT NULL DEFAULT 1,
 "show_post_purchase_link" SMALLINT DEFAULT NULL,
 "post_purchase_link" varchar(255) DEFAULT NULL,
 "is_internal" SMALLINT DEFAULT NULL,
 "trial_days" INTEGER DEFAULT NULL,
 "payment_methods" varchar(100) NOT NULL,
 "cover_fee" SMALLINT DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT current_timestamp()
);


--
-- Dumping data for table "payment_links"
--



INSERT INTO "payment_links" VALUES (1,1,'6769deb72fa88',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2024-12-23 16:05:43'),(2,2,'678146af5c6cf',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-01-10 10:11:27'),(3,2,'68155ec6cc306',2,NULL,2,'juan@lunarpay.com',1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-02 19:09:42'),(4,2,'682b7bfccec79',2,NULL,7,'jonathanbodnar@gmail.com',1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-19 13:44:12'),(5,2,'682b7c29e88f7',2,NULL,7,'jonathanbodnar@gmail.com',1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-19 13:44:57'),(6,2,'6837acac7538a',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-28 19:39:08'),(7,2,'6837ad1edd9d6',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-05-28 19:41:02'),(8,2,'6837ad34dc330',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',1,'2025-05-28 19:41:24'),(9,2,'686849f1c6e30',2,NULL,NULL,NULL,0,NULL,NULL,NULL,30,'[""CC"",""BANK""]',NULL,'2025-07-04 16:38:57'),(10,2,'68684a13e6c7d',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-07-04 16:39:31'),(11,2,'68684a7577924',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-07-04 16:41:09'),(12,2,'68684ad402457',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-07-04 16:42:44'),(13,2,'68684bf899f8b',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-07-04 16:47:36'),(14,2,'68684e08b1bf1',2,NULL,NULL,NULL,1,1,'https://app.magicweb.ai',NULL,7,'[""CC"",""BANK""]',NULL,'2025-07-04 16:56:24'),(15,3,'689b5c7a66cff',3,NULL,NULL,NULL,1,NULL,NULL,NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-12 10:23:38'),(16,23,'689ba4b5887e9',23,NULL,NULL,NULL,1,1,'https://app.leads.biz',NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-12 15:31:49'),(17,12,'68a35887707f4',12,NULL,NULL,NULL,1,1,'',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-18 11:44:55'),(18,12,'68a377327bc2a',12,NULL,NULL,NULL,1,1,'',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-18 13:55:46'),(19,23,'68acad9760b36',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/paid',NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-25 13:38:15'),(20,23,'68ade2bed7372',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/free-sms',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-26 11:37:18'),(21,23,'68ade573a47f5',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/free-sms',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-26 11:48:51'),(22,23,'68adeb632d5fa',23,NULL,NULL,NULL,0,1,'https://app.leads.biz/paid',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-26 12:14:11'),(23,23,'68adeb948addd',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/paid',NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-26 12:15:00'),(24,23,'68adf7f8af108',23,NULL,NULL,NULL,1,1,'https://app.leads.biz',NULL,7,'[""CC"",""BANK""]',NULL,'2025-08-26 13:07:52'),(25,23,'68af5a5488457',23,NULL,NULL,NULL,0,1,'https://app.leads.biz/paid',NULL,14,'[""CC"",""BANK""]',NULL,'2025-08-27 14:19:48'),(26,23,'68af5a750b8ca',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/paid',NULL,14,'[""CC"",""BANK""]',NULL,'2025-08-27 14:20:21'),(27,23,'68b10da69b516',23,NULL,NULL,NULL,1,1,'https://app.leads.biz/free-sms',NULL,NULL,'[""CC"",""BANK""]',NULL,'2025-08-28 21:17:10');

UN

--
-- Table structure for table "paysafe_webhooks"
--




CREATE TABLE IF NOT EXISTS "paysafe_webhooks" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "event_json" text DEFAULT NULL,
 "system" varchar(50) DEFAULT NULL,
 "mode" varchar(32) DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT NULL
);


--
-- Dumping data for table "paysafe_webhooks"
--




UN

--
-- Table structure for table "products"
--




CREATE TABLE IF NOT EXISTS "products" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "reference" varchar(32) DEFAULT NULL,
 "church_id" INTEGER DEFAULT NULL,
 "product_stripe_id" varchar(20) DEFAULT NULL,
 "product_quickbooks_id" varchar(20) DEFAULT NULL,
 "campus_id" INTEGER DEFAULT NULL,
 "name" varchar(255) DEFAULT NULL,
 "description" text DEFAULT NULL,
 "price" decimal(10,2) DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT NULL,
 "trash" SMALLINT DEFAULT 0,
 "slug" varchar(200) DEFAULT NULL,
 "client_id" INTEGER DEFAULT NULL,
 "recurrence" char(1) DEFAULT 'O',
 "billing_period" varchar(30) DEFAULT NULL,
 "custom_date" text DEFAULT NULL,
 "start_subscription" char(1) NOT NULL DEFAULT 'D',
 "file_hash" varchar(255) DEFAULT NULL,
 "show_customer_portal" SMALLINT DEFAULT NULL,
 "plan_type" varchar(50) DEFAULT NULL
);


--
-- Dumping data for table "products"
--



INSERT INTO "products" VALUES (1,'PR8FC7BBB5-001',1,NULL,NULL,NULL,'Prodcompanytest1 P1',NULL,10.00,'2024-12-23 16:05:41',0,NULL,1,'O',NULL,NULL,'D',NULL,NULL,NULL),(2,'PR9513A068-002',2,NULL,NULL,NULL,'Test Product 1',NULL,1.00,'2025-01-09 14:32:09',0,NULL,2,'O',NULL,NULL,'D',NULL,NULL,NULL),(3,'PR9514D637-003',2,NULL,NULL,NULL,'Consulting',NULL,100.00,'2025-01-17 07:43:48',0,NULL,2,'O',NULL,NULL,'D',NULL,1,NULL),(4,'PR95165FDD-004',2,NULL,NULL,NULL,'Hours',NULL,80.00,'2025-01-27 15:17:43',0,NULL,2,'O',NULL,NULL,'D',NULL,1,NULL),(5,'PR95539192-005',2,NULL,NULL,NULL,'Recurring','',100.00,'2025-05-28 19:38:50',0,NULL,2,'R','monthly',NULL,'D',NULL,1,NULL),(6,'PR95539193-006',2,NULL,NULL,NULL,'Setup','',1000.00,'2025-05-28 19:39:06',0,NULL,2,'O',NULL,NULL,'D',NULL,1,NULL),(7,'PR95539195-007',2,NULL,NULL,NULL,'Test2','',1.00,'2025-05-28 19:41:00',0,NULL,2,'R','monthly',NULL,'D',NULL,1,NULL),(8,'PR955ED7D0-008',14,NULL,NULL,NULL,'Test','',50.00,'2025-06-02 08:16:24',0,NULL,14,'O',NULL,NULL,'D',NULL,1,NULL),(9,'PR956E6B5A-009',2,NULL,NULL,NULL,'Magicweb Basic Mo','For individuals just starting up',14.00,'2025-07-04 16:26:27',0,NULL,2,'R','monthly',NULL,'D',NULL,NULL,'basic'),(10,'PR956E6B69-0010',2,NULL,NULL,NULL,'Magicweb Pro Mo','For individuals, business owners',49.00,'2025-07-04 16:41:06',0,NULL,2,'R','monthly',NULL,'D',NULL,NULL,'pro'),(11,'PR956E6B6A-0011',2,NULL,NULL,NULL,'Magicweb Basic Yr','For individuals just starting up',140.00,'2025-07-04 16:42:36',0,NULL,2,'R','yearly',NULL,'D',NULL,NULL,'basic'),(12,'PR956E6B6E-0012',2,NULL,NULL,NULL,'Magicweb Pro Yr','For individuals, business owners',490.00,'2025-07-04 16:46:43',0,NULL,2,'R','yearly',NULL,'D',NULL,NULL,'pro'),(13,'PR957EE3BD-0013',3,NULL,NULL,NULL,'One Click Funnel (periodically)','Get and sell leads faster than ever before, using the power of AI and an instant marketing funnel proven to scale service based businesses at life changing speeds.',297.00,'2025-08-12 10:21:34',0,NULL,3,'R','monthly',NULL,'D',NULL,1,'one_click_funnel'),(14,'PR957EE5BB-0014',23,NULL,NULL,NULL,'One Click Funnel (periodically)','Get and sell leads faster than ever before, using the power of AI and an instant marketing funnel proven to scale service based businesses at life changing speeds.',297.00,'2025-08-12 15:31:43',0,NULL,23,'R','monthly',NULL,'D',NULL,1,'one_click_funnel'),(15,'PR957EE5BD-0015',23,NULL,NULL,NULL,'One Dolar Product1','',1.00,'2025-08-12 15:33:19',0,NULL,23,'O',NULL,NULL,'D',NULL,NULL,'one_dolar_product1'),(16,'PR957F596D-0016',23,NULL,NULL,NULL,'Full Software Project','',15000.00,'2025-08-15 11:49:02',0,NULL,23,'O',NULL,NULL,'D',NULL,1,'full_software_project'),(17,'PR957FCDD1-0017',2,NULL,NULL,NULL,'Development','',15000.00,'2025-08-18 09:45:19',0,NULL,2,'O',NULL,NULL,'D',NULL,1,'development'),(18,'PR957FCE98-0018',12,NULL,NULL,NULL,'Leads In 7 Days','',1200.00,'2025-08-18 11:44:45',0,NULL,12,'R','monthly',NULL,'D',NULL,1,'leads_in_7_days'),(19,'PR957FCF6B-0019',12,NULL,NULL,NULL,'Leads In 7 Days (discounted)','',997.00,'2025-08-18 13:55:41',0,NULL,12,'O',NULL,NULL,'D',NULL,1,'leads_in_7_days_discounted'),(20,'PR9580E0C8-0020',23,NULL,NULL,NULL,'Full Ai Funnel','',97.00,'2025-08-25 13:36:32',0,NULL,23,'R','monthly',NULL,'D',NULL,1,'Full AI Funnel'),(21,'PR95810711-0021',23,NULL,NULL,NULL,'Unlimited Sms Marketing','',27.00,'2025-08-26 11:37:01',0,NULL,23,'O',NULL,NULL,'D',NULL,1,'unlimited_sms_marketing'),(22,'PR9581071C-0022',23,NULL,NULL,NULL,'Lifetime Access','',27.00,'2025-08-26 11:48:29',0,NULL,23,'O',NULL,NULL,'D',NULL,1,'Unlimited SMS & Email Marketing For Life'),(23,'PR958107B9-0023',23,NULL,NULL,NULL,'One Click Funnel (periodically)','Get and sell leads faster than ever before, using the power of AI and an instant marketing funnel proven to scale service based businesses at life changing speeds.',97.00,'2025-08-26 13:05:45',1,'2320250826',23,'R','monthly',NULL,'D',NULL,1,'one_click_funnel_periodically'),(24,'PR958107BB-0024',23,NULL,NULL,NULL,'One Click Funnel (periodically)','Get and sell leads faster than ever before, using the power of AI and an instant marketing funnel proven to scale service based businesses at life changing speeds.',97.00,'2025-08-26 13:07:12',0,NULL,23,'R','monthly',NULL,'D',NULL,1,'one_click_funnel_periodically_97'),(25,'PR95812AED-0025',23,NULL,NULL,NULL,'Test','one_click_funnel_periodically_97',1.00,'2025-08-27 03:17:48',1,'2520250827',23,'R','monthly',NULL,'D',NULL,1,'one_click_funnel_periodically_97');

UN

--
-- Table structure for table "referals"
--




CREATE TABLE IF NOT EXISTS "referals" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "parent_id" INTEGER NOT NULL,
 "user_id" INTEGER DEFAULT NULL,
 "email" varchar(200) NOT NULL,
 "full_name" varchar(200) NOT NULL,
 "referal_message" varchar(255) NOT NULL,
 "date_sent" TIMESTAMP DEFAULT current_timestamp(),
 "date_register" TIMESTAMP DEFAULT NULL
);


--
-- Dumping data for table "referals"
--




UN

--
-- Table structure for table "request_logs"
--




CREATE TABLE IF NOT EXISTS "request_logs" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "type" enum('REQ','RES') DEFAULT NULL,
 "headers" text DEFAULT NULL,
 "method" enum('GET','POST','PUT','DEL') DEFAULT NULL,
 "url" varchar(256) DEFAULT NULL,
 "payload" text DEFAULT NULL,
 "date" TIMESTAMP DEFAULT NULL
);


--
-- Dumping data for table "request_logs"
--




UN

--
-- Table structure for table "settings"
--




CREATE TABLE IF NOT EXISTS "settings" (
 "settings_id" INTEGER NOT NULL AUTO_INCREMENT,
 "type" varchar(255) NOT NULL DEFAULT '',
 "description" text NOT NULL DEFAULT ''
);


--
-- Dumping data for table "settings"
--



INSERT INTO "settings" VALUES (1,'is_new_donor_before_days','30'),(2,'widget_allowed_ips','[""::1""]'),(3,'install_expiration_date','15'),(4,'yes_options','[""yes"",""yeah"",""yep"",""yea"",""y"",""sure"",""true"",""ok"",""great"",""nice""]'),(5,'no_options','[""no"",""nah"",""nope"",""na"",""n"",""not"",""false""]'),(6,'chat_expiration_hours','2'),(7,'deletexxx',''),(9,'SYSTEM_LETTER_ID','L');

UN

--
-- Table structure for table "statement_donors"
--




CREATE TABLE IF NOT EXISTS "statement_donors" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
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




UN

--
-- Table structure for table "statements"
--




CREATE TABLE IF NOT EXISTS "statements" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
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




UN

--
-- Table structure for table "tags"
--




CREATE TABLE IF NOT EXISTS "tags" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "client_id" INTEGER DEFAULT NULL,
 "name" varchar(64) DEFAULT NULL,
 "scope" char(1) DEFAULT NULL,
 "created_at" TIMESTAMP DEFAULT NULL
);


--
-- Dumping data for table "tags"
--




UN

--
-- Table structure for table "transactions_funds"
--




CREATE TABLE IF NOT EXISTS "transactions_funds" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
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

UN

--
-- Table structure for table "users"
--




CREATE TABLE IF NOT EXISTS "users" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
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
 "referral_code" varchar(200) DEFAULT NULL
);


--
-- Dumping data for table "users"
--



INSERT INTO "users" VALUES (1,'192.168.2.49','','$2y$10$FI0UonTIbQmu8LWp.lYmlOsceYanNYE8tzzZCP57u1KIM57OpVTQa','juan@marketing.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1734991464,1747414940,1,'Juan','Gomez','ProdCompanyTest1','3006009000','1e25c9cc1d2bf16ae079e16d32bc29042a2716e1c2484d38c58feb058b84664be72c7e7a4d485dab67a3224f93ab8ac0','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(2,'192.168.5.52','','$2y$10$kAe39r54MTJDSmxfEkPINO9LhfitjBTF5ua7lnsAipzpX6VvJpWAG','jonathan@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1735248852,1756357798,1,'Jonathan','Bodnar','Apollo Eleven Inc','4699078539','51cbbdd0dff00a1f8a9f6ef052ca3b5e2fb1ab647c80a744a881843ef62ac91bc2c871db27d7c8281e4653a40429d80a','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(3,'192.168.2.49','','$2y$10$c3D0MLjjluqdfgvDtabwjuEGhdHD6boJ9nj6WfyX9xjKGIgpLRyY2','jb@marketing.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1735687123,1755537796,1,'Jonathan','Bodnar','Marketing.biz','4699078539','d5db7b4fc1020158838a517922492811f91de648187d77467719ac413f9ae5fbed5cb4a9512738547e169edad452f898','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(4,'192.168.2.91','','$2y$10$xs9aeMkttycomDKjxb0dcOqUUqZU.kWrn7YDr1pHR01fa1Qgpz54G','liamtodd@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737356227,NULL,1,'Liam','','ELEV3N Records','6132819107','b1c377b33ed338a7f30f962de8c8dac7fdf2aa7843e3ca73ae476f0d5947627962ba136c3cf45ca7c8390d79ec97f0eb','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(5,'192.168.5.59','','$2y$10$7YwmOGZ1IuJ7MjmAdoZJY.0VW7S3hBooQYos.Hc4kCBWgXpaEPu8m','ryujinx@wearehackerone.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737363829,NULL,1,'Jivk','Ryujinx','Indonesian Offensive Security','+62813360605321','106bee6a47b07ae1e57eca80db1b16c00bcd2c009288ed9ce1c36a2ee6eeedccad4c6f0d996871da190470ffc3a3bfca','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(6,'192.168.2.91','','$2y$10$OvWhPt4LeykfGp5DlAZ.o.PQotSrrHb0dYsftgQq2ATIliWqVFFre','jonathanbagwell23@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1737647425,NULL,1,'Jonathan','Bagwell','Jonathan','7208181289','70dee5ac8545f7b3bac413ed7fa601e3abfd3cf272ef996c3e1f37c5bcfd5c58824cf835856a7ab06f2e73095b637ca9','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(7,'192.168.2.91','','$2y$10$cm7SOwRcasX3/8bhlDWZJ.PR78nf5GGYavJtbkPX1j1shumVW1xA2','calebmitcheltx@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740162724,1742933303,1,'Caleb','Mitchell','Masters Touch, Inc.','2143851075','03cba4b72d591a53e077334461bb3b951ac90b227d24aa54bd88a151e7c5b63c27e4d15d68e5ee59c6c5cba680d458e7','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(8,'192.168.2.91','','$2y$10$ugPZY.h.rokHrKh0cZ5nt.c62.NQsJjfqMrTMJGRpKQ8r9LgEAB9a','cherice@ethnoholdings.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740410749,NULL,1,'Cherice','Stoltzfus','Ethno Holdings','6823653869','1e959516ed79bee4c63381c50ba56970443c18de46d7e1199fc3e8ce87d4009a566d77d08cc88865a9f40b3636824f01','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(9,'192.168.2.91','','$2y$10$9CDbuYEDEbkVqiBlj3Ys.uKLP70K2ZS5g5kyljM/wH4dcwlSFwPoK','calebmitchelltx@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1740779551,NULL,1,'Caleb','Mitchell','Masters Touch, Inc.','(214) 385-1075','162b4bab4bfd8b9442203dc2c73c3380646aba7e971db2c607299639ea4b705084a056d8d4a4b118ddd3c1a1d25937fc','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(10,'192.168.5.68','','$2y$10$Ej5lfDWV.I5XSDgWYxwd.ezsJi9qWtvgK4Z4BWBdPzQ8j9y2ukqjS','jakebaxter315@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1741960532,1742325716,1,'Jake','Baxter','Nighthawk Consulting LLC','2142366479','8f8748e9a51a111e017cd0333d8c6134352398089dd09a4bfec677dec5f9fccb4d13c5fe8f930055a18e2e9a3b29fd43','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(11,'192.168.5.17','','$2y$10$SdP39F7oEYPEJSu/CLaQqezsHfJsKU4YuhmoRMTrnsDfoVzAYG.mK','umit.aras96@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1742729402,NULL,1,'ümit','Aras','tetris','595043149','7958aa5a7c16315ce177e767f18265e35da72e74cb7192a9008b18d98ebca2e67a847c5ae147f1c422017266b1f6bdf3','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(12,'192.168.5.37','','$2y$10$RQbX7WhOrfQsBVRn4Fx6v.5myTWzmis.stQEQsuHvgrOfzuU.jroO','jb@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1746322953,1756357781,1,'Jonathan','Bodnar','Apollo Eleven inc.','4699078539','7f91d107aa84fb63088d8eaab7f7095fb15d58ac31c3e9fbe6c12364f242764481a62d161335ac695c84f3652c822b80','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(13,'192.168.2.67','','$2y$10$UB2DaBhaL.igR1gnknl9vOmVTVD3DxhWtc8ld0HtYkxqTeHW6CSbi','juan@lunarpay.io',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1746809044,1750185046,1,'Juan','Gomez','Prod company test','3006009000','db6ef9664fe49ab19f2c294543cd026881bfa5d74c1e0989aa4a7e76090042901a1cf5eb073c13a9087e1d06a07ef089','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(14,'192.168.5.37','','$2y$10$lpUDR3oxivOa7jlRmQ/aMeC7PADgN6IxZMz06jGRpdmrCTSX9AZIe','juan@apolloapps.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747082113,1755709283,1,'Juan','Gomez',NULL,NULL,'a67f443d10c6002cf709a60189a39e66088e8757c7158b61d7827627a451ce2f44388a1d55ce9fde9c5df8c93d114c51','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(15,'192.168.2.79','','$2y$10$D5eQnF6rSxJvRD1EhepZ1.YNxnBxCEZ4YasJdmLI7PYFwMmJMyDy2','edg@sozaclinic.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747179538,1748533551,1,'Edward','Gonzales','SozaClinic','901-237-7472','20ed26b177ec78cb495c72563c56ad2fd042a6891bacc1ffc0379f01c087df5e4faecec6a505534c89342fdd0ba67cbe','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(16,'192.168.2.79','','$2y$10$NfdELLVuJzZ/nDOEU8gY0.ANEhOe7JsogNAEq/aaQWDKq9gUetRia','jonathqweqwean@lunarpay.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1747680095,NULL,1,'Jonathan','Bodnar','Apollo Eleven inc.','4699078539','c79fb884506f68e7471adda7717fc0aa3079639a7f2741ab73ea21f887cbba94ff66adc9242f4cd038ac07ecec7a856e','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(17,'192.168.5.79','','$2y$10$4wogCicFpbfOugcrNRL5O.TfVFJX6pYPdbrZAh02lF4wAv0OhICvm','breathstealersworld@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1748257772,1751915965,1,'Prasanna','','Breath Stealers Music Academy','9972620273','e207d7eb27b78b41ce7163c064c7f71afd3e96ff51429921120bbaf69fcda6b7bc4659631d2ed10072e6518f9e1e59ee','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(18,'192.168.5.79','','$2y$10$VRYuqDMTi3CcR56c8V1fJeY8HtFtOGSHPkEp4B1xJjd.vY8bUGm7u','jonathantest@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1748532646,NULL,1,'Jonathan','Bodnar','Marketing.biz LLC','4699078539','e1a219a6d21c9c9b6cb027894b71c8b6e4d2adb4659992f86dc8ad66fea9b1400bc5447d2c90afd9db8ade85153960ae','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',1,NULL,NULL,NULL,NULL),(19,'192.168.2.82','','$2y$10$68vlzle9PJ9cxIz3uDyAMOoL.LBk8KY2rDLX1KZ6y9v7jarTCPFT6','pablogmzc@outlook.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750175549,1750180206,1,'Juan','Gmz','Test Prod Comp 2025-06-17','3006009000','deac7a71454b78d5365cd7f1f94deaf81dc8c2a57c270d79cc86e2f8dd49580385d1e5430b4c22885b2a852054116b5b','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(20,'192.168.2.82','','$2y$10$ytZZsY0irRmL6rXafe5QXuvNSEsxOEj7ZyepCAY8Bnzz80RUzYFKu','juan@lunarpay.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750181756,1750185015,1,'Juan','Gmz','Test Prod Comp 2025-06-17-2','3006009000','7b9789f56c019058a1ccea296e463999d49c1763542587cc4bc50249b5363f316508ff417453503969921cd36b044b28','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(21,'192.168.5.28','','$2y$10$jChLjD0StrO1qR9wa8sbburQvvUFzhThzuXg2Lf.biG1npCUrkgyy','atlas@apollo.inc',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1750691123,1750777601,1,'Jonathan','Bodnar','Atlas Holdings','4692079703','24616bf076e7f59f2abaeaa404ea6c95eafba501f249203fe19e71f9de2b4e67080808c5859f2ac5f8d911ce81e81c71','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(22,'192.168.5.28','','$2y$10$iQKFROwbThyP3D4YanvfEuEH//fwbMU.DKutzdwia5tYtGB7jKGvW','eustersshikol@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1751209714,NULL,1,'Eusters','Andalo','Forex','0707191729','1da6a65b12d9edf276913581c8a57d81ab9997671223a7e2766bd4f64edd5069bc2520e41c3ba483353b4444d801230f','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL),(23,'172.18.0.1','','$2y$10$9sIJFEyVN4hAwACK3mVvc.rQ.Q327DQkVRejffgwYl5Tyqjn33NFu','jb@leads.biz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1754688191,1756357865,1,'Jonathan','Bodnar','Leads.biz LLC','4692079703','7437bb693b9eddb7c82565c9c0aaeb8adfb20fc85116c428f36706f70ded9cc8c124968f3c1d12f44e38f69b225fb8d2','user',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'D',NULL,NULL,NULL,NULL,'FTS',3,NULL,NULL,NULL,NULL);

UN

--
-- Table structure for table "users_groups"
--




CREATE TABLE IF NOT EXISTS "users_groups" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "user_id" INTEGER NOT NULL,
 "group_id" INTEGER NOT NULL
);


--
-- Dumping data for table "users_groups"
--



INSERT INTO "users_groups" VALUES (1,1,2),(2,2,2),(3,3,2),(4,4,2),(5,5,2),(6,6,2),(7,7,2),(8,8,2),(9,9,2),(10,10,2),(11,11,2),(12,12,2),(13,13,2),(14,14,2),(15,15,2),(16,16,2),(17,17,2),(18,18,2),(19,19,2),(20,20,2),(21,21,2),(22,22,2),(23,23,2);

UN

--
-- Table structure for table "webhook_sent_logs"
--




CREATE TABLE IF NOT EXISTS "webhook_sent_logs" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "webhook_type" varchar(50) NOT NULL,
 "client_id" varchar(255) NOT NULL,
 "status" enum('pending','success','failed','retrying') NOT NULL DEFAULT 'pending',
 "retry_count" INTEGER NOT NULL DEFAULT 0,
 "max_retries" INTEGER NOT NULL DEFAULT 3,
 "next_retry_at" TIMESTAMP DEFAULT NULL,
 "last_attempt_at" TIMESTAMP DEFAULT NULL,
 "created_at" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
 "updated_at" TIMESTAMP NOT NULL DEFAULT current_timestamp(),
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



INSERT INTO "webhook_sent_logs" VALUES (1,'sub','2','success',0,3,NULL,'2025-07-04 17:15:30','2025-07-04 22:15:30','2025-07-04 22:15:30','{""event_type"":""subscription_updated"",""timestamp"":""2025-07-04T17:15:30-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""1"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-07-11 00:00:00"",""next_payment_on"":""2025-07-11 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""D"",""trial_ends_at"":""2025-07-11 23:59:59"",""ends_at"":""2025-07-11 23:59:59"",""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_686852827b8015.88008975'),(2,'sub','2','success',0,3,NULL,'2025-07-04 17:20:05','2025-07-04 22:20:05','2025-07-04 22:20:05','{""event_type"":""subscription_created"",""timestamp"":""2025-07-04T17:20:05-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""2"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-07-11 00:00:00"",""next_payment_on"":""2025-07-11 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-07-11 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_68685395bf4d75.62785501'),(3,'sub','2','success',0,3,NULL,'2025-07-11 03:00:01','2025-07-11 08:00:01','2025-07-11 08:00:01','{""event_type"":""subscription_updated"",""timestamp"":""2025-07-11T03:00:01-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""2"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-07-11 00:00:00"",""next_payment_on"":""2025-07-11 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-07-11 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_6870c481727b46.37889039'),(4,'sub','2','success',0,3,NULL,'2025-07-11 03:00:01','2025-07-11 08:00:01','2025-07-11 08:00:01','{""event_type"":""subscription_updated"",""timestamp"":""2025-07-11T03:00:01-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""2"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-07-11 00:00:00"",""next_payment_on"":""2025-07-11 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-07-11 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_6870c481738f74.98668289'),(5,'sub','23','success',0,3,NULL,'2025-08-13 12:40:43','2025-08-13 17:40:43','2025-08-13 17:40:43','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T12:40:43-05:00"",""client_id"":""23"",""data"":{""customer_id"":""30"",""subscription_id"":""4"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan2@marketing.biz"",""customer_name"":""Juan Gomez"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689cce1b411623.31803227'),(6,'sub','23','success',0,3,NULL,'2025-08-13 13:20:03','2025-08-13 18:20:03','2025-08-13 18:20:03','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-13T13:20:03-05:00"",""client_id"":""23"",""data"":{""customer_id"":""32"",""subscription_id"":""3"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""jbtestpay@leads.biz"",""customer_name"":""Jonathan Bodnar"",""c_status"":""cancelled"",""status"":""D"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":""2025-08-20 23:59:59"",""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_689cd75307efe2.85028537'),(7,'sub','23','success',0,3,NULL,'2025-08-13 13:20:12','2025-08-13 18:20:12','2025-08-13 18:20:12','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T13:20:12-05:00"",""client_id"":""23"",""data"":{""customer_id"":""32"",""subscription_id"":""5"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""jbtestpay@leads.biz"",""customer_name"":""Jonathan Bodnar"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689cd75c285ef8.98356997'),(8,'sub','2','success',0,3,NULL,'2025-08-13 15:14:46','2025-08-13 20:14:46','2025-08-13 20:14:46','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T15:14:46-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""6"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_689cf23619d564.52797684'),(9,'sub','2','success',0,3,NULL,'2025-08-13 15:15:52','2025-08-13 20:15:52','2025-08-13 20:15:52','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T15:15:52-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""7"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_created','webhook_689cf27804d955.66179144'),(10,'sub','23','success',0,3,NULL,'2025-08-13 16:09:51','2025-08-13 21:09:51','2025-08-13 21:09:51','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-13T16:09:51-05:00"",""client_id"":""23"",""data"":{""customer_id"":""30"",""subscription_id"":""4"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan2@marketing.biz"",""customer_name"":""Juan Gomez"",""c_status"":""cancelled"",""status"":""D"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":""2025-08-20 23:59:59"",""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_689cff1fa6d908.65806576'),(11,'sub','23','success',0,3,NULL,'2025-08-13 19:19:32','2025-08-14 00:19:31','2025-08-14 00:19:32','{""event_type"":""subscription_created"",""timestamp"":""2025-08-13T19:19:31-05:00"",""client_id"":""23"",""data"":{""customer_id"":""34"",""subscription_id"":""8"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""baxterwandf@gmail.com"",""customer_name"":""Jake Baxter"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_689d2b937bbff5.75108551'),(12,'sub','23','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:01','2025-08-20 08:00:02','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-20T03:00:01-05:00"",""client_id"":""23"",""data"":{""customer_id"":""32"",""subscription_id"":""5"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""jbtestpay@leads.biz"",""customer_name"":""Jonathan Bodnar"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68a58081d1e236.73650804'),(13,'sub','2','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-20T03:00:02-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""6"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_68a580821fa5c1.79871021'),(14,'sub','2','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-20T03:00:02-05:00"",""client_id"":""2"",""data"":{""customer_id"":""9"",""subscription_id"":""7"",""plan_type"":""basic"",""billing_cycle"":""monthly"",""amount"":""14.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""juan@apolloapps.com"",""customer_name"":""Juan Gmz"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true}',200,NULL,'https://api.magicweb.ai/subscriptionlp/webhook','subscription_updated','webhook_68a58082434137.02767687'),(15,'sub','23','success',0,3,NULL,'2025-08-20 03:00:02','2025-08-20 08:00:02','2025-08-20 08:00:02','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-20T03:00:02-05:00"",""client_id"":""23"",""data"":{""customer_id"":""34"",""subscription_id"":""8"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-20 00:00:00"",""next_payment_on"":""2025-08-20 23:59:59"",""customer_email"":""baxterwandf@gmail.com"",""customer_name"":""Jake Baxter"",""c_status"":""cancelled"",""status"":""A"",""trial_ends_at"":""2025-08-20 23:59:59"",""ends_at"":null,""trial_status"":""ended"",""last_transaction_id"":null,""access_period_status"":""ended"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68a58082639150.53228511'),(16,'sub','23','success',0,3,NULL,'2025-08-22 15:29:48','2025-08-22 20:29:48','2025-08-22 20:29:48','{""event_type"":""subscription_created"",""timestamp"":""2025-08-22T15:29:48-05:00"",""client_id"":""23"",""data"":{""customer_id"":""30"",""subscription_id"":""9"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-29 00:00:00"",""next_payment_on"":""2025-08-29 23:59:59"",""customer_email"":""juan2@marketing.biz"",""customer_name"":""Juan Gomez"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-08-29 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_68a8d33c0378e4.82013835'),(17,'sub','23','success',0,3,NULL,'2025-08-25 07:29:48','2025-08-25 12:29:47','2025-08-25 12:29:48','{""event_type"":""subscription_created"",""timestamp"":""2025-08-25T07:29:47-05:00"",""client_id"":""23"",""data"":{""customer_id"":""58"",""subscription_id"":""10"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-09-01 00:00:00"",""next_payment_on"":""2025-09-01 23:59:59"",""customer_email"":""pierrecampbell77@gmail.com"",""customer_name"":""Pierre Campbell"",""c_status"":""on_trial"",""status"":""A"",""trial_ends_at"":""2025-09-01 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":null,""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_created','webhook_68ac573b2afc03.32836300'),(18,'sub','23','success',0,3,NULL,'2025-08-29 09:00:05','2025-08-29 14:00:04','2025-08-29 14:00:05','{""event_type"":""subscription_updated"",""timestamp"":""2025-08-29T09:00:04-05:00"",""client_id"":""23"",""data"":{""customer_id"":""30"",""subscription_id"":""9"",""plan_type"":""one_click_funnel"",""billing_cycle"":""monthly"",""amount"":""297.00"",""start_date"":""2025-08-29 00:00:00"",""next_payment_on"":""2025-09-29 23:59:59"",""customer_email"":""juan2@marketing.biz"",""customer_name"":""Juan Gomez"",""c_status"":""unpaid"",""status"":""A"",""trial_ends_at"":""2025-08-29 23:59:59"",""ends_at"":null,""trial_status"":""active"",""last_transaction_id"":""23"",""access_period_status"":""active"",""created_as_trial"":""1""}}','{""success"":true,""meta"":{""status"":201,""message"":""Created""}}',201,NULL,'https://api-mail-dev.marketing.biz/billing/webhook','subscription_updated','webhook_68b1b264c506d2.14298499');

UN

--
-- Table structure for table "zadm_groups"
--




CREATE TABLE IF NOT EXISTS "zadm_groups" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "name" varchar(20) NOT NULL,
 "description" varchar(100) NOT NULL
);


--
-- Dumping data for table "zadm_groups"
--



INSERT INTO "zadm_groups" VALUES (1,'admin','Administrator'),(2,'members','General User');

UN

--
-- Table structure for table "zadm_login_attempts"
--




CREATE TABLE IF NOT EXISTS "zadm_login_attempts" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "ip_address" varchar(45) NOT NULL,
 "login" varchar(100) DEFAULT NULL,
 "time" INTEGER DEFAULT NULL
);


--
-- Dumping data for table "zadm_login_attempts"
--




UN

--
-- Table structure for table "zadm_users"
--




CREATE TABLE IF NOT EXISTS "zadm_users" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
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
 "planning_center_oauth" text DEFAULT NULL
);


--
-- Dumping data for table "zadm_users"
--



INSERT INTO "zadm_users" VALUES (1,'127.0.0.1','administrator','$2y$12$qod/OYjwZeOl/6S3Dq2IseIEg2ielhbPmpTG72R8ZGutT/CbbiSH2','admin@admin.com',NULL,'',NULL,NULL,NULL,NULL,NULL,1268889823,1650906737,1,'Administrator','','ADMIN','0',NULL,NULL,NULL,NULL,NULL);

UN

--
-- Table structure for table "zadm_users_groups"
--




CREATE TABLE IF NOT EXISTS "zadm_users_groups" (
 "id" INTEGER NOT NULL AUTO_INCREMENT,
 "user_id" INTEGER NOT NULL,
 "group_id" INTEGER NOT NULL
);


--
-- Dumping data for table "zadm_users_groups"
--



INSERT INTO "zadm_users_groups" VALUES (1,1,1);

UN










-- Dump completed on 2025-08-29 12:14:01

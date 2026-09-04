CREATE TABLE `downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pdfId` int NOT NULL,
	`userId` int,
	`downloadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdf_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(240) NOT NULL,
	`subjectId` int NOT NULL,
	`unit` varchar(40) NOT NULL,
	`description` text,
	`tags` text,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(600) NOT NULL,
	`fileSize` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`academicYear` varchar(20),
	`semester` varchar(40),
	`viewCount` int NOT NULL DEFAULT 0,
	`downloadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdf_files_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdf_files_fileKey_unique` UNIQUE(`fileKey`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pdfId` int NOT NULL,
	`reportedBy` int NOT NULL,
	`reason` varchar(80) NOT NULL,
	`description` text,
	`status` enum('open','resolved','rejected') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`code` varchar(40),
	`department` varchar(120),
	`semester` varchar(40),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_name_code_idx` UNIQUE(`name`,`code`)
);
--> statement-breakpoint
CREATE TABLE `views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pdfId` int NOT NULL,
	`userId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `downloads_pdf_idx` ON `downloads` (`pdfId`);--> statement-breakpoint
CREATE INDEX `downloads_user_idx` ON `downloads` (`userId`);--> statement-breakpoint
CREATE INDEX `pdf_subject_idx` ON `pdf_files` (`subjectId`);--> statement-breakpoint
CREATE INDEX `pdf_uploader_idx` ON `pdf_files` (`uploadedBy`);--> statement-breakpoint
CREATE INDEX `pdf_title_idx` ON `pdf_files` (`title`);--> statement-breakpoint
CREATE INDEX `pdf_created_at_idx` ON `pdf_files` (`createdAt`);--> statement-breakpoint
CREATE INDEX `pdf_downloads_idx` ON `pdf_files` (`downloadCount`);--> statement-breakpoint
CREATE INDEX `reports_pdf_idx` ON `reports` (`pdfId`);--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `subjects_created_by_idx` ON `subjects` (`createdBy`);--> statement-breakpoint
CREATE INDEX `views_pdf_idx` ON `views` (`pdfId`);--> statement-breakpoint
CREATE INDEX `views_user_idx` ON `views` (`userId`);
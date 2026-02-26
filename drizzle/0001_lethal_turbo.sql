CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` varchar(255) NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`translation` text,
	`category` varchar(100),
	`level` int,
	`publishedDate` varchar(20),
	`source` enum('bbc','voa','engoo') NOT NULL,
	`sourceUrl` text,
	`sourceAttribution` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_articleId_unique` UNIQUE(`articleId`)
);

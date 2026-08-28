CREATE TABLE `sharedAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(32) NOT NULL,
	`payload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sharedAnalyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `sharedAnalyses_token_unique` UNIQUE(`token`)
);

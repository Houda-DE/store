ALTER TABLE `users` ADD `role` enum('seller','customer') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `location` varchar(255) NOT NULL;
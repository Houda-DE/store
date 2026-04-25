CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seller_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`image_url` varchar(512) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seller_delivery_cities` (
	`seller_id` varchar(36) NOT NULL,
	`city_id` int NOT NULL,
	CONSTRAINT `seller_delivery_cities_seller_id_city_id_pk` PRIMARY KEY(`seller_id`,`city_id`)
);
--> statement-breakpoint
ALTER TABLE `items` ADD CONSTRAINT `items_seller_id_users_id_fk` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seller_delivery_cities` ADD CONSTRAINT `seller_delivery_cities_seller_id_users_id_fk` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seller_delivery_cities` ADD CONSTRAINT `seller_delivery_cities_city_id_cities_id_fk` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;
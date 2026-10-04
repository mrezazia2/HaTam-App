ALTER TABLE `property_media` ADD `urgent_sale_id` text;
--> statement-breakpoint
CREATE INDEX `idx_property_media_urgent_sale_status` ON `property_media` (`urgent_sale_id`,`status`);

import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps={createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),updatedAt:integer("updated_at",{mode:"timestamp_ms"}).notNull()};
export const cooperateApplications=sqliteTable("cooperate_applications",{id:text("id").primaryKey(),payload:text("payload",{mode:"json"}).$type<Record<string,unknown>>().notNull(),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull()});

export const accounts=sqliteTable("accounts",{
 contactPhone:text("contact_phone").notNull().default(""),avatarKey:text("avatar_key"),specialty:text("specialty").notNull().default(""),biography:text("biography").notNull().default(""),
 id:text("id").primaryKey(),role:text("role",{enum:["admin","user","consultant","agency"]}).notNull(),name:text("name").notNull(),mobile:text("mobile").notNull().unique(),passwordHash:text("password_hash"),address:text("address").notNull().default(""),status:text("status",{enum:["pending","active","suspended","rejected"]}).notNull().default("pending"),nationalId:text("national_id"),agencyId:text("agency_id"),...timestamps,
},table=>[index("idx_accounts_role_status").on(table.role,table.status)]);

export const agencies=sqliteTable("agencies",{
 id:text("id").primaryKey(),name:text("name").notNull(),managerAccountId:text("manager_account_id"),phone:text("phone").notNull(),address:text("address").notNull(),licenseNumber:text("license_number"),status:text("status",{enum:["pending","active","suspended","rejected"]}).notNull().default("pending"),...timestamps,
});

export const properties=sqliteTable("properties",{
 id:text("id").primaryKey(),title:text("title").notNull(),ownerAccountId:text("owner_account_id"),consultantAccountId:text("consultant_account_id"),agencyId:text("agency_id"),ownerMobile:text("owner_mobile").notNull(),address:text("address").notNull(),district:text("district"),latitude:real("latitude"),longitude:real("longitude"),transactionType:text("transaction_type",{enum:["sale","rent","presale"]}).notNull(),propertyType:text("property_type").notNull(),area:integer("area").notNull(),bedrooms:integer("bedrooms").notNull().default(0),price:integer("price").notNull().default(0),description:text("description").notNull().default(""),coverImage:text("cover_image"),status:text("status",{enum:["draft","pending","published","vip","rejected","archived"]}).notNull().default("pending"),featured:integer("featured",{mode:"boolean"}).notNull().default(false),...timestamps,
},table=>[index("idx_properties_status_district").on(table.status,table.district),index("idx_properties_owner").on(table.ownerAccountId)]);

export const propertyStatusHistory=sqliteTable("property_status_history",{
 id:text("id").primaryKey(),propertyId:text("property_id").notNull(),actorAccountId:text("actor_account_id"),fromStatus:text("from_status"),toStatus:text("to_status").notNull(),note:text("note").notNull().default(""),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),
},table=>[index("idx_property_history_property_created").on(table.propertyId,table.createdAt)]);

export const propertyMedia=sqliteTable("property_media",{
 id:text("id").primaryKey(),objectKey:text("object_key").notNull(),ownerAccountId:text("owner_account_id").notNull(),propertyId:text("property_id"),urgentSaleId:text("urgent_sale_id"),fileName:text("file_name").notNull(),contentType:text("content_type").notNull(),size:integer("size").notNull(),status:text("status",{enum:["active","deleted"]}).notNull().default("active"),...timestamps,
},table=>[uniqueIndex("uq_property_media_object_key").on(table.objectKey),index("idx_property_media_owner_created").on(table.ownerAccountId,table.createdAt),index("idx_property_media_property_status").on(table.propertyId,table.status),index("idx_property_media_urgent_sale_status").on(table.urgentSaleId,table.status)]);

export const contentPages=sqliteTable("content_pages",{
 id:text("id").primaryKey(),title:text("title").notNull(),slug:text("slug").notNull().unique(),target:text("target",{enum:["site","app"]}).notNull(),status:text("status",{enum:["draft","published"]}).notNull().default("draft"),seoTitle:text("seo_title"),seoDescription:text("seo_description"),...timestamps,
});

export const contentBlocks=sqliteTable("content_blocks",{
 id:text("id").primaryKey(),pageId:text("page_id").notNull(),type:text("type",{enum:["hero","text","features","cta"]}).notNull(),title:text("title").notNull(),body:text("body").notNull(),sortOrder:integer("sort_order").notNull().default(0),...timestamps,
},table=>[index("idx_content_blocks_page_order").on(table.pageId,table.sortOrder)]);

export const brandSettings=sqliteTable("brand_settings",{
 id:text("id").primaryKey(),brandName:text("brand_name").notNull(),slogan:text("slogan").notNull(),logoUrl:text("logo_url").notNull(),faviconUrl:text("favicon_url").notNull(),primaryColor:text("primary_color").notNull(),secondaryColor:text("secondary_color").notNull(),accentColor:text("accent_color").notNull(),fontFamily:text("font_family").notNull(),typeScale:real("type_scale").notNull().default(1),...timestamps,
});

export const appMenuItems=sqliteTable("app_menu_items",{
 id:text("id").primaryKey(),
 label:text("label").notNull(),
 subtitle:text("subtitle").notNull().default(""),
 icon:text("icon").notNull().default("home"),
 action:text("action",{enum:["home","urgent","featured","trust","cooperate","consultants","contact","login","register-property","url","vip"]}).notNull(),
 target:text("target").notNull().default(""),
 variant:text("variant",{enum:["item","cta"]}).notNull().default("item"),
 enabled:integer("enabled",{mode:"boolean"}).notNull().default(true),
 sortOrder:integer("sort_order").notNull().default(0),
 ...timestamps,
},table=>[index("idx_app_menu_enabled_order").on(table.enabled,table.sortOrder)]);

export const appConfigurations=sqliteTable("app_configurations",{
 id:text("id").primaryKey(),value:text("value",{mode:"json"}).$type<Record<string,unknown>>().notNull(),...timestamps,
});

export const trustVideos=sqliteTable("trust_videos",{
 id:text("id").primaryKey(),title:text("title").notNull(),objectKey:text("object_key").notNull().unique(),contentType:text("content_type").notNull(),size:integer("size").notNull(),enabled:integer("enabled",{mode:"boolean"}).notNull().default(true),sortOrder:integer("sort_order").notNull().default(0),...timestamps,
},table=>[index("idx_trust_videos_enabled_order").on(table.enabled,table.sortOrder)]);

export const integrationSettings=sqliteTable("integration_settings",{
 id:text("id").primaryKey(),
 category:text("category",{enum:["sms","payment_gateway","card_transfer","ai"]}).notNull().unique(),
 provider:text("provider").notNull().default(""),
 enabled:integer("enabled",{mode:"boolean"}).notNull().default(false),
 publicConfig:text("public_config",{mode:"json"}).$type<Record<string,string>>().notNull(),
 encryptedSecret:text("encrypted_secret"),
 secretHint:text("secret_hint"),
 ...timestamps,
});

export const otpChallenges=sqliteTable("otp_challenges",{
 id:text("id").primaryKey(),mobile:text("mobile").notNull(),role:text("role").notNull(),codeHash:text("code_hash").notNull(),attempts:integer("attempts").notNull().default(0),expiresAt:integer("expires_at",{mode:"timestamp_ms"}).notNull(),consumedAt:integer("consumed_at",{mode:"timestamp_ms"}),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),
});

export const sessions=sqliteTable("sessions",{
 id:text("id").primaryKey(),accountId:text("account_id").notNull(),tokenHash:text("token_hash").notNull().unique(),expiresAt:integer("expires_at",{mode:"timestamp_ms"}).notNull(),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),
});

export const passkeyCredentials=sqliteTable("passkey_credentials",{
 credentialId:text("credential_id").primaryKey(),accountId:text("account_id").notNull(),publicKey:text("public_key").notNull(),counter:integer("counter").notNull().default(0),transports:text("transports",{mode:"json"}).$type<string[]>().notNull(),deviceType:text("device_type").notNull(),backedUp:integer("backed_up",{mode:"boolean"}).notNull().default(false),label:text("label").notNull().default("قفل دستگاه"),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),lastUsedAt:integer("last_used_at",{mode:"timestamp_ms"}),
},table=>[index("idx_passkey_credentials_account").on(table.accountId)]);

export const passkeyChallenges=sqliteTable("passkey_challenges",{
 id:text("id").primaryKey(),accountId:text("account_id").notNull(),kind:text("kind",{enum:["register","authenticate"]}).notNull(),challenge:text("challenge").notNull(),origin:text("origin").notNull(),expiresAt:integer("expires_at",{mode:"timestamp_ms"}).notNull(),consumedAt:integer("consumed_at",{mode:"timestamp_ms"}),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),
},table=>[index("idx_passkey_challenges_account_kind").on(table.accountId,table.kind),index("idx_passkey_challenges_expires").on(table.expiresAt)]);

export const authSecurityEvents=sqliteTable("auth_security_events",{
 id:text("id").primaryKey(),action:text("action",{enum:["otp_request","otp_verify","password_login","passkey_login"]}).notNull(),identifierHash:text("identifier_hash").notNull(),ipHash:text("ip_hash").notNull(),success:integer("success",{mode:"boolean"}).notNull().default(false),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),
},table=>[index("idx_auth_events_identifier_action_created").on(table.identifierHash,table.action,table.createdAt),index("idx_auth_events_ip_action_created").on(table.ipHash,table.action,table.createdAt)]);

export const wallets=sqliteTable("wallets",{
 id:text("id").primaryKey(),accountId:text("account_id").notNull().unique(),balance:integer("balance").notNull().default(0),currency:text("currency").notNull().default("IRR"),...timestamps,
});

export const walletTransactions=sqliteTable("wallet_transactions",{
 id:text("id").primaryKey(),walletId:text("wallet_id").notNull(),type:text("type",{enum:["credit","debit","hold","release"]}).notNull(),amount:integer("amount").notNull(),status:text("status",{enum:["pending","completed","failed"]}).notNull(),reference:text("reference"),description:text("description").notNull(),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),
},table=>[index("idx_wallet_transactions_wallet_created").on(table.walletId,table.createdAt),uniqueIndex("uq_wallet_transactions_reference").on(table.reference)]);

export const consultations=sqliteTable("consultations",{
 id:text("id").primaryKey(),customerAccountId:text("customer_account_id").notNull(),consultantAccountId:text("consultant_account_id"),propertyId:text("property_id"),subject:text("subject").notNull(),scheduledAt:integer("scheduled_at",{mode:"timestamp_ms"}),status:text("status",{enum:["requested","scheduled","completed","cancelled"]}).notNull(),notes:text("notes").notNull().default(""),...timestamps,
},table=>[index("idx_consultations_customer_status").on(table.customerAccountId,table.status),index("idx_consultations_consultant_status").on(table.consultantAccountId,table.status)]);

export const visits=sqliteTable("visits",{
 id:text("id").primaryKey(),propertyId:text("property_id").notNull(),customerAccountId:text("customer_account_id").notNull(),consultantAccountId:text("consultant_account_id"),scheduledAt:integer("scheduled_at",{mode:"timestamp_ms"}).notNull(),status:text("status",{enum:["requested","confirmed","completed","cancelled"]}).notNull(),...timestamps,
},table=>[index("idx_visits_property_scheduled").on(table.propertyId,table.scheduledAt),index("idx_visits_customer_status").on(table.customerAccountId,table.status)]);

export const agencyMembers=sqliteTable("agency_members",{id:text("id").primaryKey(),agencyId:text("agency_id").notNull(),accountId:text("account_id").notNull(),title:text("title").notNull().default("مشاور"),status:text("status",{enum:["invited","active","suspended"]}).notNull().default("invited"),...timestamps},table=>[index("idx_agency_members_agency_status").on(table.agencyId,table.status),index("idx_agency_members_account").on(table.accountId)]);
export const agencyBranches=sqliteTable("agency_branches",{id:text("id").primaryKey(),agencyId:text("agency_id").notNull(),name:text("name").notNull(),phone:text("phone").notNull().default(""),address:text("address").notNull(),status:text("status",{enum:["active","suspended"]}).notNull().default("active"),...timestamps},table=>[index("idx_agency_branches_agency_status").on(table.agencyId,table.status)]);
export const leads=sqliteTable("leads",{id:text("id").primaryKey(),agencyId:text("agency_id").notNull(),consultantAccountId:text("consultant_account_id"),name:text("name").notNull(),mobile:text("mobile").notNull(),request:text("request").notNull(),status:text("status",{enum:["new","contacted","qualified","won","lost"]}).notNull().default("new"),...timestamps},table=>[index("idx_leads_agency_status").on(table.agencyId,table.status),index("idx_leads_consultant").on(table.consultantAccountId)]);
export const contracts=sqliteTable("contracts",{id:text("id").primaryKey(),agencyId:text("agency_id").notNull(),propertyId:text("property_id"),consultantAccountId:text("consultant_account_id"),customerAccountId:text("customer_account_id"),customerName:text("customer_name").notNull(),customerMobile:text("customer_mobile").notNull().default(""),amount:integer("amount").notNull().default(0),signingAt:integer("signing_at",{mode:"timestamp_ms"}),notes:text("notes").notNull().default(""),status:text("status",{enum:["draft","review","signing","completed","cancelled"]}).notNull().default("draft"),...timestamps},table=>[index("idx_contracts_agency_status").on(table.agencyId,table.status),index("idx_contracts_customer").on(table.customerAccountId),index("idx_contracts_signing").on(table.signingAt)]);
export const contractDocuments=sqliteTable("contract_documents",{id:text("id").primaryKey(),contractId:text("contract_id").notNull(),objectKey:text("object_key").notNull().unique(),uploadedBy:text("uploaded_by").notNull(),fileName:text("file_name").notNull(),contentType:text("content_type").notNull(),size:integer("size").notNull(),status:text("status",{enum:["active","deleted"]}).notNull().default("active"),...timestamps},table=>[index("idx_contract_documents_contract_status").on(table.contractId,table.status)]);

export const conversations=sqliteTable("conversations",{id:text("id").primaryKey(),kind:text("kind",{enum:["direct","property","visit","contract","support"]}).notNull(),subject:text("subject").notNull(),propertyId:text("property_id"),agencyId:text("agency_id"),status:text("status",{enum:["open","closed","archived"]}).notNull().default("open"),...timestamps},table=>[index("idx_conversations_agency_updated").on(table.agencyId,table.updatedAt)]);
export const conversationParticipants=sqliteTable("conversation_participants",{id:text("id").primaryKey(),conversationId:text("conversation_id").notNull(),accountId:text("account_id").notNull(),role:text("role").notNull(),lastReadAt:integer("last_read_at",{mode:"timestamp_ms"}),joinedAt:integer("joined_at",{mode:"timestamp_ms"}).notNull()},table=>[index("idx_conversation_participants_account").on(table.accountId),index("idx_conversation_participants_conversation").on(table.conversationId)]);
export const messages=sqliteTable("messages",{id:text("id").primaryKey(),conversationId:text("conversation_id").notNull(),senderAccountId:text("sender_account_id").notNull(),body:text("body").notNull(),moderationStatus:text("moderation_status",{enum:["visible","flagged","hidden"]}).notNull().default("visible"),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull()},table=>[index("idx_messages_conversation_created").on(table.conversationId,table.createdAt)]);
export const notifications=sqliteTable("notifications",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),type:text("type").notNull(),title:text("title").notNull(),body:text("body").notNull(),link:text("link"),readAt:integer("read_at",{mode:"timestamp_ms"}),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull()},table=>[index("idx_notifications_account_created").on(table.accountId,table.createdAt),index("idx_notifications_account_read").on(table.accountId,table.readAt)]);
export const reminders=sqliteTable("reminders",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),eventType:text("event_type").notNull(),eventId:text("event_id").notNull(),channel:text("channel",{enum:["in_app","sms","both"]}).notNull(),scheduledAt:integer("scheduled_at",{mode:"timestamp_ms"}).notNull(),sentAt:integer("sent_at",{mode:"timestamp_ms"}),status:text("status",{enum:["pending","processing","sent","failed","cancelled"]}).notNull().default("pending"),lockedAt:integer("locked_at",{mode:"timestamp_ms"}),lockToken:text("lock_token"),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull()},table=>[index("idx_reminders_status_scheduled").on(table.status,table.scheduledAt),index("idx_reminders_account").on(table.accountId)]);
export const smsOutbox=sqliteTable("sms_outbox",{id:text("id").primaryKey(),accountId:text("account_id"),mobile:text("mobile").notNull(),template:text("template").notNull(),payload:text("payload",{mode:"json"}).$type<Record<string,string>>().notNull(),status:text("status",{enum:["pending","processing","sent","failed","cancelled"]}).notNull().default("pending"),attempts:integer("attempts").notNull().default(0),lastError:text("last_error"),nextAttemptAt:integer("next_attempt_at",{mode:"timestamp_ms"}),lockedAt:integer("locked_at",{mode:"timestamp_ms"}),lockToken:text("lock_token"),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),sentAt:integer("sent_at",{mode:"timestamp_ms"})},table=>[index("idx_sms_outbox_status_created").on(table.status,table.createdAt),index("idx_sms_outbox_status_next_attempt").on(table.status,table.nextAttemptAt)]);

export const paymentIntents=sqliteTable("payment_intents",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),walletId:text("wallet_id").notNull(),amount:integer("amount").notNull(),purpose:text("purpose",{enum:["wallet_topup","subscription"]}).notNull().default("wallet_topup"),referenceId:text("reference_id"),provider:text("provider").notNull(),authority:text("authority"),providerReference:text("provider_reference"),status:text("status",{enum:["created","redirected","paid","failed","cancelled"]}).notNull().default("created"),callbackPayload:text("callback_payload",{mode:"json"}).$type<Record<string,string>>(),verifiedAt:integer("verified_at",{mode:"timestamp_ms"}),...timestamps},table=>[index("idx_payment_intents_account_status").on(table.accountId,table.status),uniqueIndex("uq_payment_intents_authority").on(table.authority),uniqueIndex("uq_payment_intents_provider_reference").on(table.provider,table.providerReference),index("idx_payment_intents_reference").on(table.purpose,table.referenceId)]);
export const cardTransferReceipts=sqliteTable("card_transfer_receipts",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),walletId:text("wallet_id").notNull(),amount:integer("amount").notNull(),trackingCode:text("tracking_code").notNull(),receiptUrl:text("receipt_url"),status:text("status",{enum:["pending","approved","rejected"]}).notNull().default("pending"),reviewedBy:text("reviewed_by"),reviewNote:text("review_note"),...timestamps},table=>[index("idx_card_receipts_status_created").on(table.status,table.createdAt),index("idx_card_receipts_account").on(table.accountId),uniqueIndex("uq_card_receipts_account_tracking").on(table.accountId,table.trackingCode)]);
export const settlements=sqliteTable("settlements",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),walletId:text("wallet_id").notNull(),amount:integer("amount").notNull(),iban:text("iban").notNull(),status:text("status",{enum:["requested","approved","paid","rejected"]}).notNull().default("requested"),reference:text("reference"),reviewedBy:text("reviewed_by"),...timestamps},table=>[index("idx_settlements_status_created").on(table.status,table.createdAt),index("idx_settlements_account").on(table.accountId)]);

export const subscriptionPlans=sqliteTable("subscription_plans",{id:text("id").primaryKey(),name:text("name").notNull(),audience:text("audience",{enum:["user","consultant","agency"]}).notNull(),price:integer("price").notNull(),durationDays:integer("duration_days").notNull(),features:text("features",{mode:"json"}).$type<string[]>().notNull(),active:integer("active",{mode:"boolean"}).notNull().default(true),...timestamps},table=>[index("idx_subscription_plans_audience_active").on(table.audience,table.active)]);
export const subscriptions=sqliteTable("subscriptions",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),planId:text("plan_id").notNull(),paymentIntentId:text("payment_intent_id"),status:text("status",{enum:["pending","active","expired","cancelled"]}).notNull().default("pending"),startsAt:integer("starts_at",{mode:"timestamp_ms"}),expiresAt:integer("expires_at",{mode:"timestamp_ms"}),autoRenew:integer("auto_renew",{mode:"boolean"}).notNull().default(false),...timestamps},table=>[index("idx_subscriptions_account_status").on(table.accountId,table.status),index("idx_subscriptions_expiry").on(table.status,table.expiresAt)]);

export const propertyFavorites=sqliteTable("property_favorites",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),propertyId:text("property_id").notNull(),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull()},table=>[uniqueIndex("uq_property_favorites_account_property").on(table.accountId,table.propertyId),index("idx_property_favorites_account_created").on(table.accountId,table.createdAt)]);
export const savedSearches=sqliteTable("saved_searches",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),name:text("name").notNull(),transactionType:text("transaction_type",{enum:["sale","rent","presale"]}),district:text("district"),propertyType:text("property_type"),minPrice:integer("min_price"),maxPrice:integer("max_price"),minArea:integer("min_area"),maxArea:integer("max_area"),minBedrooms:integer("min_bedrooms"),alertsEnabled:integer("alerts_enabled",{mode:"boolean"}).notNull().default(true),lastNotifiedAt:integer("last_notified_at",{mode:"timestamp_ms"}),...timestamps},table=>[index("idx_saved_searches_account_updated").on(table.accountId,table.updatedAt),index("idx_saved_searches_alerts").on(table.alertsEnabled,table.lastNotifiedAt)]);

export const urgentSaleRequests=sqliteTable("urgent_sale_requests",{
 id:text("id").primaryKey(),accountId:text("account_id"),firstName:text("first_name").notNull(),lastName:text("last_name").notNull(),mobile:text("mobile"),address:text("address").notNull(),latitude:real("latitude"),longitude:real("longitude"),area:integer("area").notNull(),bedrooms:integer("bedrooms").notNull().default(0),buildingAge:integer("building_age").notNull(),floor:integer("floor").notNull().default(0),unitsPerFloor:integer("units_per_floor").notNull().default(1),amenities:text("amenities",{mode:"json"}).$type<string[]>().notNull(),expectedPrice:integer("expected_price").notNull(),status:text("status",{enum:["new","reviewing","assigned","completed","rejected"]}).notNull().default("new"),assignedConsultantId:text("assigned_consultant_id"),assignedConsultantName:text("assigned_consultant_name").notNull().default(""),consultantAccess:text("consultant_access",{enum:["view","edit","manage"]}).notNull().default("view"),adminNote:text("admin_note").notNull().default(""),...timestamps,
},table=>[index("idx_urgent_sales_status_created").on(table.status,table.createdAt),index("idx_urgent_sales_consultant").on(table.assignedConsultantId)]);

export const communicationPolicies=sqliteTable("communication_policies",{
 id:text("id").primaryKey(),accountId:text("account_id").notNull().unique(),smsEnabled:integer("sms_enabled",{mode:"boolean"}).notNull().default(false),requireVip:integer("require_vip",{mode:"boolean"}).notNull().default(true),updatedBy:text("updated_by"),...timestamps,
},table=>[index("idx_communication_policies_account").on(table.accountId)]);

export const communicationTemplates=sqliteTable("communication_templates",{
 id:text("id").primaryKey(),key:text("key").notNull().unique(),title:text("title").notNull(),body:text("body").notNull(),smsPattern:text("sms_pattern").notNull().default(""),link:text("link").notNull().default("/panel"),enabled:integer("enabled",{mode:"boolean"}).notNull().default(true),...timestamps,
});

export const reminderRules=sqliteTable("reminder_rules",{
 id:text("id").primaryKey(),eventType:text("event_type").notNull().unique(),label:text("label").notNull(),enabled:integer("enabled",{mode:"boolean"}).notNull().default(true),leadMinutes:integer("lead_minutes").notNull().default(120),channel:text("channel",{enum:["in_app","sms","both"]}).notNull().default("both"),...timestamps,
});

export const propertyRequests=sqliteTable("property_requests",{
 id:text("id").primaryKey(),requestType:text("request_type",{enum:["buy","sell"]}).notNull(),customerAccountId:text("customer_account_id").notNull(),consultantAccountId:text("consultant_account_id"),propertyId:text("property_id"),title:text("title").notNull(),district:text("district"),minBudget:integer("min_budget"),maxBudget:integer("max_budget"),description:text("description").notNull().default(""),status:text("status",{enum:["new","assigned","contacted","completed","cancelled"]}).notNull().default("new"),createdBy:text("created_by").notNull(),...timestamps,
},table=>[index("idx_property_requests_customer_status").on(table.customerAccountId,table.status),index("idx_property_requests_consultant_status").on(table.consultantAccountId,table.status),index("idx_property_requests_created").on(table.createdAt)]);

export const auditLogs=sqliteTable("audit_logs",{
 id:text("id").primaryKey(),actorAccountId:text("actor_account_id"),actorRole:text("actor_role").notNull(),action:text("action").notNull(),entityType:text("entity_type").notNull(),entityId:text("entity_id"),summary:text("summary").notNull(),metadata:text("metadata",{mode:"json"}).$type<Record<string,unknown>>().notNull(),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),
},table=>[index("idx_audit_logs_created").on(table.createdAt),index("idx_audit_logs_entity").on(table.entityType,table.entityId),index("idx_audit_logs_actor").on(table.actorAccountId,table.createdAt)]);

export const chatReadReceipts=sqliteTable("chat_read_receipts",{id:text("id").primaryKey(),accountId:text("account_id").notNull(),conversationId:text("conversation_id").notNull(),readAt:integer("read_at",{mode:"timestamp_ms"}).notNull()},table=>[uniqueIndex("uq_chat_read_receipt").on(table.accountId,table.conversationId)]);

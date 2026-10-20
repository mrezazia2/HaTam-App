CREATE TABLE cooperate_applications (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL);
INSERT OR IGNORE INTO cooperate_applications(id,payload,created_at)
SELECT COALESCE(json_extract(j.value,'$.id'),'CO-legacy-'||j.key),j.value,c.created_at
FROM app_configurations c, json_each(CASE WHEN json_valid(c.value) THEN c.value ELSE '[]' END) j
WHERE c.id='cooperate-applications' AND j.type='object';

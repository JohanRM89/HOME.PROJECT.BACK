
ALTER TABLE notifications
ADD COLUMN group_id UUID REFERENCES family_groups(id);

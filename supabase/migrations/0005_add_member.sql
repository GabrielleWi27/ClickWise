-- Adds a flag so we can show a "please change your password" banner to
-- anyone whose account was created by their org admin with the shared
-- default password, until they actually set their own.
alter table profiles add column must_change_password boolean not null default false;

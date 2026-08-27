-- A one-time, real (not just localStorage) gate: an Org Admin or Employee
-- must watch the "What Is Phishing?" intro animation before Training
-- unlocks for their account. Same pattern as must_change_password —
-- a boolean flag on profiles, flipped once via an update from the client.
alter table profiles add column watched_phishing_intro boolean not null default false;

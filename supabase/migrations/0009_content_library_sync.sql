-- The Platform Admin's "Content Library" Campaigns/Trainings tabs were
-- reading from a separate content_library table that was only ever
-- seeded once with the original 6 simulations' worth of stub data — it
-- never got the 12 additional simulations/lessons added later, so it
-- silently drifted out of sync with the real content. This migration lets
-- those tabs read directly from the real `simulations`/`lessons` tables
-- instead (the single source of truth), so they can never drift again.

-- Lets Platform Admin enable/disable individual campaign templates,
-- same as content_library already allowed.
alter table simulations add column active boolean not null default true;

-- org_assigned_content/org_campaigns.content_id used to only ever point
-- at content_library (uuid ids). Now that campaigns are assigned/launched
-- straight from `simulations` (text ids like 'sim_password_reset'), this
-- column needs to hold either kind of id — drop the single-table foreign
-- key and widen the column to text. The denormalized name/category/
-- difficulty columns already do all the real display work; this id was
-- always just an optional traceability pointer.
alter table org_assigned_content drop constraint org_assigned_content_content_id_fkey;
alter table org_assigned_content alter column content_id type text using content_id::text;

alter table org_campaigns drop constraint org_campaigns_content_id_fkey;
alter table org_campaigns alter column content_id type text using content_id::text;

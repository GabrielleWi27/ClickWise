-- Pairs each simulation with the training lesson that teaches you how to
-- spot it, and requires that lesson be completed before the simulation
-- can be attempted (enforced in the app, same as how lessons already
-- unlock each other in order).
alter table simulations add column required_lesson_id text references lessons(id) on delete set null;

-- Ratings are insert-once. Owner cannot update after the first submit.
drop policy if exists sale_ratings_owner_update on public.sale_ratings;

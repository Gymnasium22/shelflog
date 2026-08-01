-- Product default currency: BYN (белорусский рубль, ISO 4217).
-- Applied as column default when households table is created (Stage 5 migrations).
-- Documented here so Stage 3 already locks the decision in SQL history.

comment on schema public is 'ShelfLog domain. Default household currency: BYN.';

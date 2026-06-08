alter table public.debts
  add column if not exists term_months integer
    check (term_months is null or term_months > 0),
  add column if not exists payment_type text not null default 'annuity'
    check (payment_type in ('annuity', 'manual'));

comment on column public.debts.term_months is 'Loan term in months for annuity payment calculation';
comment on column public.debts.payment_type is 'annuity = calculated payment; manual = user-entered minimum_payment';

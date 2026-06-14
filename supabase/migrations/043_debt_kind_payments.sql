-- Debt product type and explicit calculated vs actual monthly payments

alter table public.debts
  add column if not exists debt_kind text not null default 'other';

alter table public.debts
  drop constraint if exists debts_debt_kind_check;

alter table public.debts
  add constraint debts_debt_kind_check check (
    debt_kind in (
      'credit',
      'credit_card',
      'microloan',
      'installment',
      'personal_loan',
      'other'
    )
  );

alter table public.debts
  add column if not exists calculated_monthly_payment numeric(12, 2)
    check (calculated_monthly_payment is null or calculated_monthly_payment >= 0);

alter table public.debts
  add column if not exists actual_monthly_payment numeric(12, 2)
    check (actual_monthly_payment is null or actual_monthly_payment >= 0);

-- Legacy manual entries: treat minimum_payment as user-provided actual payment
update public.debts
set actual_monthly_payment = minimum_payment
where payment_type = 'manual'
  and minimum_payment > 0
  and actual_monthly_payment is null;

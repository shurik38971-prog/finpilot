# Миграции Supabase (FinPilot — приложение)

Выполняйте **по порядку**, один файл за раз, в Supabase SQL Editor.

| № | Файл |
|---|------|
| 001 | `001_initial_schema.sql` |
| 002 | `002_analyses.sql` |
| 003 | `003_analyses_comparison.sql` |
| 004 | `004_analyses_daily_and_goals.sql` |
| 005 | `005_financial_tasks.sql` |
| 006 | `006_tasks_goal_link.sql` |
| 007 | `007_task_impacts.sql` |
| 008 | `008_next_best_action.sql` |
| 009 | `009_product_analytics.sql` |
| 010 | `010_admin_self_check.sql` |
| 011 | `011_onboarding_progress.sql` |
| 012 | `012_product_feedback.sql` |
| 013 | `013_feedback_v2_reactivation.sql` |
| 014 | `014_user_profiles_privacy.sql` |
| 015 | `015_financial_tasks_normalized_title.sql` |
| 016 | `016_financial_tasks_category_archived.sql` |
| 017 | `017_incomes_income_type.sql` |
| 018 | `018_user_profiles_profile_type.sql` |
| 019 | `019_quick_feedback.sql` |
| 020 | `020_analytics_events.sql` |
| 021 | `021_recommendation_rating_reasons.sql` |
| 022 | `022_self_employed_profile_type.sql` |
| 023 | `023_profile_income_parameters.sql` |
| 024 | `024_rename_profile_income_columns.sql` |
| 025 | `025_derive_base_income_from_range.sql` |
| 026 | `026_profile_expected_monthly_income.sql` |
| 027 | `027_additional_income_model.sql` |

**Важно:** `013` меняет таблицу `feedback` из `012`. Если `012` ещё не выполняли — сначала `012`, затем `013`.

Лендинг (` lendihg FinPilot`) **не использует** эти миграции — только это приложение.

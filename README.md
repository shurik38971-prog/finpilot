# FinPilot — приложение (личный кабинет)

Сервис для самозанятых: доходы, расходы, долги, цели, ИИ-анализ, действия.

> **Это не лендинг.** Маркетинговый сайт — отдельный проект в папке  
> `A:\Projects\ lendihg FinPilot` (порт **3001**).

## Два проекта

| | **Приложение** (этот репозиторий) | **Лендинг** |
|---|-----------------------------------|-------------|
| Папка | `A:\Projects\FinPilot` | `A:\Projects\ lendihg FinPilot` |
| Порт dev | 3000 | 3001 |
| GitHub | `shurik38971-prog/finpilot` | `shurik38971-prog/finpilot-landing` |
| Назначение | Личный кабинет, Supabase, админка | Маркетинг, SEO, кнопки в приложение |

## Быстрый старт (приложение)

```bash
cd A:\Projects\FinPilot
npm install
cp .env.example .env.local
# заполните Supabase, GPTunnel, ADMIN_EMAILS
npm run dev
```

http://localhost:3000

## База данных

Все миграции — **только для приложения**. Список по порядку:

**[supabase/MIGRATIONS.md](supabase/MIGRATIONS.md)** (001 → 013)

Не пропускайте номера. После `012` обязательно выполните `013`.

## Стек

Next.js 15 · TypeScript · Tailwind · Supabase · GPTunnel · Recharts

## Деплой

- **Приложение:** Vercel → `finpilot` (или `app.finpilot.ru`)
- **Лендинг:** отдельный Vercel-проект из папки лендинга → `NEXT_PUBLIC_APP_URL` указывает на URL приложения

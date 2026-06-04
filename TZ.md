# 📋 TEXNIK VAZIFA (TZ) — "Kommunal Pay"
### Kommunal Xizmatlar Billing Tizimi

> Holat sanasi: **2026-06-04** · Versiya **v1.0** · Deploy: https://diplom-work-two.vercel.app

---

## 1. LOYIHA MAQSADI
Kommunal xizmatlar (elektr, suv, gaz) bo'yicha avtomatlashtirilgan hisob-kitob va
to'lov boshqaruv tizimini yaratish.

## 2. FOYDALANUVCHILAR
| Rol | Vazifalari |
|-----|------------|
| Administrator | Mijozlar, tariflar, ko'rsatmalar, schyotlarni boshqarish |
| Mijoz | O'z schyotlarini ko'rish va to'lash |

## 3. FUNKSIONAL TALABLAR

### 3.1 Admin Panel
| # | Funksiya | Holat |
|---|----------|:-----:|
| F-01 | Tizimga kirish (autentifikatsiya) | ✅ |
| F-02 | Dashboard — statistika va grafiklar | ✅ |
| F-03 | Mijozlar ro'yxati, qidiruv | ✅ |
| F-04 | Mijoz qo'shish, tahrirlash, o'chirish | ✅ |
| F-05 | Hisoblagich ko'rsatmalarini kiritish | ✅ |
| F-06 | Ko'rsatmalarni qidiruv/filter | ✅ |
| F-07 | Tariflarni belgilash va yangilash | ✅ |
| F-08 | Schyot avtomatik yaratish (hisoblash) | ✅ |
| F-09 | Schyotni PDF formatda yuklab olish | ✅ |
| F-10 | Schyotni "to'langan" deb belgilash | ✅ |
| F-11 | Muddati o'tgan schyotlar avtomatik yangilanishi | ✅ |
| F-12 | Schyotlarni o'chirish | ✅ |
| F-13 | Ommaviy schyot yaratish | ✅ |
| F-14 | Excel/hisobot export | ✅ |
| F-15 | Pagination | ✅ |
| F-22 | Qarzdorlar bo'yicha avtomatik bildirishnoma (in-app) | ✅ |

### 3.2 Mijoz Portali
| # | Funksiya | Holat |
|---|----------|:-----:|
| F-16 | Mijoz ro'yxatdan o'tish (hisob raqam orqali) | ✅ |
| F-17 | Mijoz kirishi | ✅ |
| F-18 | Schyotlar ro'yxati va statistika | ✅ |
| F-19 | To'lov (simulyatsiya + Click UI) | ✅ |
| F-20 | Mijoz profil tahrirlash | ✅ |
| F-21 | Parolni tiklash | ✅ |

### 3.3 Texnik talablar
| # | Talab | Holat |
|---|-------|:-----:|
| T-01 | React.js (frontend) | ✅ |
| T-02 | Supabase (backend + DB) | ✅ |
| T-03 | Row Level Security (RLS) | ✅ |
| T-04 | Responsive dizayn (mobil) | ✅ |
| T-05 | Deploy (Vercel) | ✅ |

> **Eslatma:** schyotni email orqali yuborish funksiyasi loyiha doirasidan chiqarildi.
> Uning o'rniga qarzdorlik haqida **ilova ichidagi avtomatik bildirishnoma** (F-22)
> amalga oshirildi: admin sidebar'da qizil hisoblagich + qarzdorlar ro'yxati modali.

## 4. TEXNOLOGIYALAR
- **Frontend:** React 19, Vite 8, React Router 7
- **Backend/DB:** Supabase (PostgreSQL + RLS)
- **UI:** Lucide React, Recharts, Tailwind CSS 4
- **PDF:** @react-pdf/renderer
- **Excel:** xlsx (SheetJS)
- **To'lov:** Click.uz (UI tayyor, integratsiya rejalashtirilgan)
- **Hosting:** Vercel

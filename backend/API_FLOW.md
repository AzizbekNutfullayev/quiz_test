Base URL
http://localhost:5000
Authorization

Protected endpointlarda token yuborish shart:

Authorization: Bearer <TOKEN>

Bu TOKEN login qilingandan keyin /auth/verify-otp dan keladi.

Umumiy ishlash logikasi

Bu project — Quiz Platform Backend.

Unda 3 ta asosiy user turi bor:

oddiy user

premium user

admin

Project ichida quyidagi asosiy modullar bor:

OTP login

quiz ishlash

admin boshqaruvi

user statistics

leaderboard

premium system

premium user question bank

1. AUTH API

Bu bo‘lim userni tizimga kiritish uchun ishlatiladi.

1.1 POST /auth/request-otp
Nima qiladi

User email yuboradi, backend shu email uchun OTP yaratadi.

Qayerda ishlatiladi

Login sahifasida, user email kiritgandan keyin.

Body
{
  "email": "aziz@gmail.com"
}
Response
{
  "ok": true,
  "message": "OTP sent"
}
Backendda nima bo‘ladi

OTP yaratiladi

hash qilinadi

otps table ga yoziladi

dev rejimda terminalga OTP chiqadi

1.2 POST /auth/verify-otp
Nima qiladi

User kiritgan OTP ni tekshiradi. To‘g‘ri bo‘lsa login qiladi va token beradi.

Qayerda ishlatiladi

OTP kiritish sahifasida.

Body
{
  "email": "aziz@gmail.com",
  "otp": "123456",
  "code": "123456"
}
Response
{
  "accessToken": "JWT_TOKEN",
  "user": {
    "id": "user-uuid-or-id",
    "email": "aziz@gmail.com",
    "role": "user"
  }
}
Frontendda nima qilinadi

accessToken saqlanadi

keyingi protected requestlarda headerga qo‘yiladi

1.3 GET /auth/ping
Nima qiladi

Auth route ishlayaptimi, oddiy health check.

Qayerda ishlatiladi

Debug yoki test paytida.

Response
{
  "ok": true
}
2. QUIZ API

Bu bo‘lim userning quiz ishlashi uchun.

Quiz flow shunday:

quiz boshlaydi

savollarni oladi

javob yuboradi

finish qiladi

natija oladi

2.1 POST /quiz/start
Nima qiladi

Yangi quiz attempt yaratadi va savollar setini tanlaydi.

Qayerda ishlatiladi

User category, subcategory, difficulty tanlaganidan keyin.

Auth

Protected

Body
{
  "categoryId": 1,
  "subcategoryId": 1,
  "difficultyId": 1,
  "count": 10,
  "timePerQuestionSec": 60
}
Response
{
  "ok": true,
  "attemptId": 2,
  "questionCount": 10,
  "timePerQuestionSec": 60,
  "message": "Quiz started"
}
Backendda nima bo‘ladi

savollar DB dan random olinadi

quiz_attempts ga attempt yoziladi

attempt_questions ga snapshot saqlanadi

Frontendda nima qilinadi

attemptId saqlanadi

keyin savollarni olish uchun ishlatiladi

2.2 GET /quiz/attempts/:attemptId/questions
Nima qiladi

Boshlangan attempt bo‘yicha savollarni qaytaradi.

Qayerda ishlatiladi

Quiz page ochilganda.

Auth

Protected

Example
GET /quiz/attempts/2/questions
Response
{
  "attemptId": 2,
  "questions": [
    {
      "order_index": 1,
      "question_id": 101,
      "question_text": "2 + 2 nechchi?",
      "option_a": "3",
      "option_b": "4",
      "option_c": "5",
      "option_d": "6",
      "image_url": null
    }
  ]
}
Muhim izoh

correct_option frontga berilmaydi.

2.3 POST /quiz/attempts/:attemptId/answer
Nima qiladi

User bitta savolga javob yuboradi.

Qayerda ishlatiladi

Har bir savolga user tanlov qilganda.

Auth

Protected

Body
{
  "orderIndex": 1,
  "selectedOption": "A",
  "timeTakenSec": 12
}
Response
{
  "ok": true,
  "isCorrect": false,
  "message": "Answer saved"
}
Muhim izoh

har orderIndex ga bir marta javob yuboriladi

qayta yuborilsa xato qaytishi mumkin

2.4 POST /quiz/attempts/:attemptId/finish
Nima qiladi

Quizni tugatadi va umumiy natijani qaytaradi.

Qayerda ishlatiladi

Quiz oxirida, submit/finish bosilganda.

Auth

Protected

Response
{
  "ok": true,
  "attemptId": 2,
  "answered": 10,
  "totalCorrect": 7,
  "totalWrong": 3,
  "message": "Attempt finished"
}
Frontendda nima qilinadi

Natija page ko‘rsatiladi.

2.5 GET /quiz/me
Nima qiladi

Token ishlayaptimi va current user kimligini qaytaradi.

Qayerda ishlatiladi

Debug yoki authenticated userni tekshirish uchun.

Auth

Protected

Response
{
  "message": "You are authenticated",
  "user": {
    "id": "user-id",
    "email": "aziz@gmail.com",
    "role": "user"
  }
}
3. ADMIN API

Bu bo‘lim faqat admin uchun.

Admin quyidagilarni boshqaradi:

categories

subcategories

questions

users

premium

⚠️ Bu endpointlar ishlashi uchun user role admin bo‘lishi kerak.

3.1 CATEGORY API

Category — quizning asosiy bo‘limi. Masalan:

Math

English

IT

3.1.1 GET /admin/categories
Nima qiladi

Barcha categorylarni chiqaradi.

Qayerda ishlatiladi

Admin panel category list sahifasida.

Auth

Protected + Admin

Response
{
  "ok": true,
  "items": [
    {
      "id": 1,
      "name": "Math",
      "status": "active"
    }
  ]
}
3.1.2 POST /admin/categories
Nima qiladi

Yangi category yaratadi.

Qayerda ishlatiladi

Admin yangi category qo‘shganda.

Auth

Protected + Admin

Body
{
  "name": "Math"
}
Response
{
  "ok": true,
  "item": {
    "id": 13,
    "name": "Math",
    "status": "active"
  }
}
3.1.3 PATCH /admin/categories/:id
Nima qiladi

Category nomini o‘zgartiradi.

Qayerda ishlatiladi

Admin category edit qilganda.

Auth

Protected + Admin

Body
{
  "name": "Mathematics"
}
Response
{
  "ok": true,
  "item": {
    "id": 13,
    "name": "Mathematics",
    "status": "active"
  }
}
3.1.4 DELETE /admin/categories/:id
Nima qiladi

Categoryni o‘chiradi yoki inactive qiladi.

Qayerda ishlatiladi

Admin category delete qilganda.

Auth

Protected + Admin

Response

Soft delete bo‘lsa:

{
  "ok": true,
  "item": {
    "id": 13,
    "name": "Mathematics",
    "status": "inactive"
  }
}

Hard delete bo‘lsa:

{
  "ok": true
}
3.2 SUBCATEGORY API

Subcategory — category ichidagi bo‘lim. Masalan:

Algebra

Grammar

Networking

3.2.1 GET /admin/subcategories
Nima qiladi

Barcha subcategorylarni chiqaradi.

Qayerda ishlatiladi

Admin panelda subcategory list sahifasida.

Auth

Protected + Admin

Filter bilan
GET /admin/subcategories?categoryId=1
Response
{
  "ok": true,
  "items": [
    {
      "id": 5,
      "category_id": 1,
      "name": "Algebra",
      "status": "active"
    }
  ]
}
3.2.2 POST /admin/subcategories
Nima qiladi

Yangi subcategory yaratadi.

Qayerda ishlatiladi

Admin yangi subcategory qo‘shganda.

Auth

Protected + Admin

Body
{
  "categoryId": 1,
  "name": "Algebra"
}
Response
{
  "ok": true,
  "item": {
    "id": 5,
    "category_id": 1,
    "name": "Algebra",
    "status": "active"
  }
}
3.2.3 PATCH /admin/subcategories/:id
Nima qiladi

Subcategory nomini yangilaydi.

Qayerda ishlatiladi

Admin edit qilganda.

Auth

Protected + Admin

Body
{
  "name": "Linear Algebra"
}
Response
{
  "ok": true,
  "item": {
    "id": 5,
    "category_id": 1,
    "name": "Linear Algebra",
    "status": "active"
  }
}
3.2.4 DELETE /admin/subcategories/:id
Nima qiladi

Subcategoryni o‘chiradi yoki inactive qiladi.

Qayerda ishlatiladi

Admin delete qilganda.

Auth

Protected + Admin

Response
{
  "ok": true
}

yoki soft delete bo‘lsa:

{
  "ok": true,
  "item": {
    "id": 5,
    "status": "inactive"
  }
}
3.3 QUESTION API

Bu yerda admin umumiy quiz savollarini boshqaradi.

3.3.1 GET /admin/questions
Nima qiladi

Savollarni list qiladi.

Qayerda ishlatiladi

Admin panel question management page.

Auth

Protected + Admin

Filterlar

?categoryId=1

?subcategoryId=2

?difficultyId=1

?status=active

Response
{
  "ok": true,
  "items": [
    {
      "id": 10,
      "category_id": 1,
      "subcategory_id": 2,
      "difficulty_id": 1,
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "B",
      "image_url": null,
      "status": "active"
    }
  ]
}
3.3.2 POST /admin/questions
Nima qiladi

Yangi savol yaratadi.

Qayerda ishlatiladi

Admin yangi savol qo‘shganda.

Auth

Protected + Admin

Body
{
  "categoryId": 1,
  "subcategoryId": 2,
  "difficultyId": 1,
  "questionText": "2 + 2 nechchi?",
  "optionA": "3",
  "optionB": "4",
  "optionC": "5",
  "optionD": "6",
  "correctOption": "B",
  "status": "active"
}
Response
{
  "ok": true,
  "id": 10
}
3.3.3 PATCH /admin/questions/:id/toggle-status
Nima qiladi

Savol statusini active/inactive almashtiradi.

Qayerda ishlatiladi

Admin savolni vaqtincha o‘chirib qo‘ymoqchi bo‘lsa.

Auth

Protected + Admin

Response
{
  "ok": true,
  "item": {
    "id": 10,
    "status": "inactive"
  }
}
3.3.4 DELETE /admin/questions/:id
Nima qiladi

Savolni o‘chiradi.

Qayerda ishlatiladi

Admin savolni butunlay delete qilganda.

Auth

Protected + Admin

Response
{
  "ok": true
}
3.4 USER MANAGEMENT API

Admin userlarni ban/unban qila oladi.

3.4.1 POST /admin/users/:userId/ban
Nima qiladi

Userni ban qiladi.

Qayerda ishlatiladi

Admin userni bloklamoqchi bo‘lsa.

Auth

Protected + Admin

Response
{
  "ok": true,
  "user": {
    "id": "user-uuid",
    "is_banned": true
  }
}
3.4.2 POST /admin/users/:userId/unban
Nima qiladi

Ban qilingan userni qayta ochadi.

Qayerda ishlatiladi

Admin userni blokdan chiqarsa.

Auth

Protected + Admin

Response
{
  "ok": true,
  "user": {
    "id": "user-uuid",
    "is_banned": false
  }
}
3.5 PREMIUM MANAGEMENT API

Admin userga premium beradi yoki olib tashlaydi.

3.5.1 POST /admin/users/:userId/grant-premium
Nima qiladi

Userga tanlangan plan bo‘yicha premium beradi.

Qayerda ishlatiladi

Admin manual premium activation qilganda.

Auth

Protected + Admin

Body
{
  "planId": 1
}
Response
{
  "ok": true,
  "message": "Premium granted successfully",
  "data": {
    "userId": "user-uuid",
    "planId": 1,
    "planName": "1 Month Premium",
    "durationDays": 30,
    "premiumExpiresAt": "2026-04-15T10:00:00.000Z"
  }
}
3.5.2 POST /admin/users/:userId/remove-premium
Nima qiladi

Userning premiumini olib tashlaydi.

Qayerda ishlatiladi

Admin premium bekor qilganda.

Auth

Protected + Admin

Response
{
  "ok": true,
  "message": "Premium removed successfully"
}
4. USER PROFILE API

Bu bo‘lim oddiy userning o‘ziga tegishli ma’lumotlar uchun.

4.1 GET /users/me/profile
Nima qiladi

Current user ma’lumotlarini qaytaradi.

Qayerda ishlatiladi

Profile page, header, premium badge, role check.

Auth

Protected

Response
{
  "ok": true,
  "user": {
    "id": "user-uuid",
    "email": "aziz@gmail.com",
    "role": "user",
    "isPremium": true,
    "premiumExpiresAt": "2026-04-15T10:00:00.000Z"
  }
}
5. USER STATISTICS API

Bu bo‘lim userning natijalarini chiqaradi.

5.1 GET /users/me/stats
Nima qiladi

Userning umumiy statistikasi, category bo‘yicha statistikasi, difficulty bo‘yicha statistikasi va recent attemptlarini qaytaradi.

Qayerda ishlatiladi

Stats page, dashboard, profile analytics.

Auth

Protected

Response
{
  "ok": true,
  "summary": {
    "totalQuizzes": 12,
    "totalAnswered": 95,
    "totalCorrect": 71,
    "totalWrong": 24,
    "accuracy": 74.74
  },
  "byCategory": [
    {
      "categoryId": 1,
      "categoryName": "Math",
      "answered": 40,
      "correct": 30,
      "wrong": 10,
      "accuracy": 75
    }
  ],
  "byDifficulty": [
    {
      "difficultyId": 1,
      "difficultyName": "easy",
      "answered": 30,
      "correct": 25,
      "wrong": 5,
      "accuracy": 83.33
    }
  ],
  "recentAttempts": [
    {
      "attemptId": 12,
      "categoryName": "Math",
      "difficultyName": "easy",
      "totalQuestions": 10,
      "answered": 10,
      "correct": 7,
      "wrong": 3,
      "accuracy": 70,
      "finishedAt": "2026-03-15T12:00:00.000Z"
    }
  ]
}
6. LEADERBOARD API

Bu bo‘lim barcha userlar reytingini chiqaradi.

Frontendda filterlar:

week

month

year

all

6.1 GET /leaderboard?range=week
Nima qiladi

Oxirgi 7 kunlik ranking.

Qayerda ishlatiladi

Leaderboard page.

Auth

Public

6.2 GET /leaderboard?range=month
Nima qiladi

Oxirgi 30 kunlik ranking.

Qayerda ishlatiladi

Leaderboard page.

Auth

Public

6.3 GET /leaderboard?range=year
Nima qiladi

Oxirgi 365 kunlik ranking.

Qayerda ishlatiladi

Leaderboard page.

Auth

Public

6.4 GET /leaderboard?range=all
Nima qiladi

All-time ranking.

Qayerda ishlatiladi

Leaderboard page.

Auth

Public

Common Response
{
  "ok": true,
  "range": "all",
  "items": [
    {
      "rank": 1,
      "userId": "user-uuid",
      "email": "user1@gmail.com",
      "totalQuizzes": 12,
      "totalAnswered": 95,
      "totalCorrect": 71,
      "totalWrong": 24,
      "accuracy": 74.74
    }
  ]
}
7. PREMIUM USER QUESTION API

Bu bo‘lim faqat premium userlar uchun.

Premium user:

o‘z savolini yaratadi

ko‘radi

o‘zgartiradi

o‘chiradi

Bu keyinchalik custom battle uchun asos bo‘ladi.

7.1 POST /user/questions
Nima qiladi

Premium user yangi savol yaratadi.

Qayerda ishlatiladi

Premium user question creation page.

Auth

Protected + Premium

Body
{
  "questionText": "5 + 5 nechchi?",
  "optionA": "8",
  "optionB": "9",
  "optionC": "10",
  "optionD": "11",
  "correctOption": "C",
  "difficultyId": 1
}
Response
{
  "ok": true,
  "question": {
    "id": 2,
    "user_id": "user-uuid",
    "question_text": "5 + 5 nechchi?",
    "option_a": "8",
    "option_b": "9",
    "option_c": "10",
    "option_d": "11",
    "correct_option": "C",
    "difficulty_id": 1,
    "status": "active",
    "created_at": "2026-03-15T06:48:37.632Z"
  }
}
7.2 GET /user/questions
Nima qiladi

Premium userning o‘z savollarini list qiladi.

Qayerda ishlatiladi

“My Questions” sahifasida.

Auth

Protected + Premium

Response
{
  "ok": true,
  "items": [
    {
      "id": 2,
      "user_id": "user-uuid",
      "question_text": "5 + 5 nechchi?",
      "option_a": "8",
      "option_b": "9",
      "option_c": "10",
      "option_d": "11",
      "correct_option": "C",
      "difficulty_id": 1,
      "status": "active",
      "created_at": "2026-03-15T06:48:37.632Z"
    }
  ]
}
7.3 PATCH /user/questions/:id
Nima qiladi

Premium user o‘z savolini update qiladi.

Qayerda ishlatiladi

Edit question page.

Auth

Protected + Premium

Body
{
  "questionText": "5 + 5 nechiga teng?",
  "optionC": "10",
  "status": "active"
}
Response
{
  "ok": true,
  "question": {
    "id": 2,
    "user_id": "user-uuid",
    "question_text": "5 + 5 nechiga teng?",
    "option_a": "8",
    "option_b": "9",
    "option_c": "10",
    "option_d": "11",
    "correct_option": "C",
    "difficulty_id": 1,
    "status": "active",
    "created_at": "2026-03-15T06:48:37.632Z"
  }
}
7.4 DELETE /user/questions/:id
Nima qiladi

Premium user o‘z savolini o‘chiradi.

Qayerda ishlatiladi

Question list page ichidagi delete action.

Auth

Protected + Premium

Response
{
  "ok": true,
  "message": "Question deleted"
}
8. PAYMENT / SUBSCRIPTION FOUNDATION

Hozir premium system foundation quyidagilar bilan ishlaydi:

plans

payments

subscriptions

users.premium_expires_at

Bu nimani anglatadi:

hozircha premium admin orqali qo‘lda berilishi mumkin

keyinchalik Click / Payme qo‘shish uchun backend tayyor

Hozir alohida public payment endpoint bo‘lmasligi mumkin, lekin foundation tayyor.

9. Errorlar nimani anglatadi
400 Bad Request

Body noto‘g‘ri yoki field yetishmaydi.

401 Unauthorized

Token yo‘q yoki noto‘g‘ri.

403 Forbidden

Userda role/premium ruxsat yo‘q.

404 Not Found

Ma’lumot topilmadi.

500 Server error

Backend ichida xatolik bo‘ldi.

10. Frontend ulash bo‘yicha tavsiya
Login

email yuboriladi

OTP yuboriladi

verify qilinadi

token saqlanadi

Protected requestlar

Har safar:

Authorization: Bearer <TOKEN>
Profile

/users/me/profile bilan:

role

premium

expiry

olinadi.

Stats page

/users/me/stats

Leaderboard page

/leaderboard?range=week|month|year|all

Premium question page

/user/questions

11. Hamma API’lar ro‘yxati
Auth

POST /auth/request-otp

POST /auth/verify-otp

GET /auth/ping

Quiz

POST /quiz/start

GET /quiz/attempts/:attemptId/questions

POST /quiz/attempts/:attemptId/answer

POST /quiz/attempts/:attemptId/finish

GET /quiz/me

Admin Categories

GET /admin/categories

POST /admin/categories

PATCH /admin/categories/:id

DELETE /admin/categories/:id

Admin Subcategories

GET /admin/subcategories

POST /admin/subcategories

PATCH /admin/subcategories/:id

DELETE /admin/subcategories/:id

Admin Questions

GET /admin/questions

POST /admin/questions

PATCH /admin/questions/:id/toggle-status

DELETE /admin/questions/:id

Admin Users

POST /admin/users/:userId/ban

POST /admin/users/:userId/unban

Admin Premium

POST /admin/users/:userId/grant-premium

POST /admin/users/:userId/remove-premium

User

GET /users/me/profile

GET /users/me/stats

Leaderboard

GET /leaderboard?range=week

GET /leaderboard?range=month

GET /leaderboard?range=year

GET /leaderboard?range=all

Premium User Questions

POST /user/questions

GET /user/questions

PATCH /user/questions/:id

DELETE /user/questions/:id
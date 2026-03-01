# Quiz Platform API Flow (Frontend uchun)

## Base URL
http://localhost:5000

## Authorization
Protected endpointlarda header shart:

Authorization: Bearer <TOKEN>

TOKEN `/auth/verify-otp` dan keladi.

---
1) AUTH FLOW (OTP + JWT)
1.1 OTP so‘rash

POST /auth/request-otp

Body:

{
  "email": "aziz@gmail.com"
}

Natija:

server OTP yaratadi

DBga hash qilib saqlaydi

(dev rejimda) terminalga OTP chiqadi

Response (misol):

{ "ok": true, "message": "OTP sent" }
1.2 OTP tasdiqlash (Login)

POST /auth/verify-otp

Body (backendga qarab code yoki otp bo‘lishi mumkin, amalda ikkalasini ham yuborsa yaxshi):

{
  "email": "aziz@gmail.com",
  "code": "675939"
}

Response:

{
  "accessToken": "JWT_TOKEN",
  "user": {
    "id": "uuid-or-id",
    "email": "aziz@gmail.com",
    "role": "user"
  }
}

Frontend:

accessToken ni saqlab qo‘yadi (localStorage yoki state)

keyingi requestlarda Authorization headerga qo‘yadi

2) QUIZ FLOW
2.1 Quiz boshlash (Attempt yaratish)

POST /quiz/start ✅ (PROTECTED)

Headers:
Authorization: Bearer <TOKEN>

Body:

{
  "categoryId": 1,
  "subcategoryId": 1,
  "difficultyId": 1,
  "count": 10,
  "timePerQuestionSec": 60
}

Response:

{
  "attemptId": 2
}

Frontend:

attemptId ni saqlab qo‘yadi

2.2 Savollarni olish

GET /quiz/attempts/:attemptId/questions ✅ (PROTECTED)

Example:
GET /quiz/attempts/2/questions

Response:

{
  "attemptId": 2,
  "questions": [
    {
      "order_index": 1,
      "question_id": 101,
      "question_text": "....",
      "option_a": "....",
      "option_b": "....",
      "option_c": "....",
      "option_d": "....",
      "image_url": null
    }
  ]
}

Izoh:

correct_option frontga berilmaydi (security)

Savollar snapshot bo‘yicha keladi (attempt boshlangan paytdagi set)

2.3 Javob yuborish

POST /quiz/attempts/:attemptId/answer ✅ (PROTECTED)

Body:

{
  "orderIndex": 1,
  "selectedOption": "A",
  "timeTakenSec": 12
}

Response (misol):

{
  "ok": true,
  "isCorrect": false
}

Izoh:

har bir orderIndex uchun 1 marta javob yuboriladi

qayta yuborilsa “Already answered” bo‘lishi mumkin

2.4 Quizni tugatish

POST /quiz/attempts/:attemptId/finish ✅ (PROTECTED)

Body: yo‘q

Response:

{
  "ok": true,
  "attemptId": 2,
  "answered": 10,
  "totalCorrect": 7,
  "totalWrong": 3,
  "message": "Attempt finished"
}

Frontend:

natija ekranga chiqariladi

3) ADMIN FLOW (Role = admin)

⚠️ Admin endpointlar ishlashi uchun:

token ichida user.role = "admin" bo‘lishi shart

aks holda 403 Forbidden qaytadi

3.1 Categories
3.1.1 List categories

GET /admin/categories ✅ (PROTECTED + ADMIN)

Response:

{
  "ok": true,
  "items": [
    { "id": 1, "name": "Math", "status": "active" }
  ]
}

Tavsiya: list faqat status=active qaytarsin (frontendga “o‘chirilganlar” chiqmasin)

3.1.2 Create category

POST /admin/categories ✅

Body:

{ "name": "Math" }

Response:

{
  "ok": true,
  "item": { "id": 13, "name": "Math", "status": "active" }
}
3.1.3 Update category

PATCH /admin/categories/:id ✅

Body:

{ "name": "Mathematics" }

Response:

{
  "ok": true,
  "item": { "id": 13, "name": "Mathematics", "status": "active" }
}
3.1.4 Delete category (SOFT DELETE ✅ Eng xavfsiz)

DELETE /admin/categories/:id ✅

Natija: DBdan o‘chirmaydi, status='inactive' qiladi.

Response:

{
  "ok": true,
  "item": { "id": 13, "name": "Mathematics", "status": "inactive" }
}

✅ Nega shunday qilamiz?

FK error bo‘lmaydi

history/attemptlar buzilmaydi

qayta active qilib tiklash mumkin

3.2 Subcategories
3.2.1 List subcategories

GET /admin/subcategories ✅

yoki filter:
GET /admin/subcategories?categoryId=1

Response:

{
  "ok": true,
  "items": [
    { "id": 5, "category_id": 1, "name": "Algebra", "status": "active" }
  ]
}
3.2.2 Create subcategory

POST /admin/subcategories ✅

Body:

{
  "categoryId": 1,
  "name": "Algebra"
}

Response:

{
  "ok": true,
  "item": { "id": 5, "category_id": 1, "name": "Algebra", "status": "active" }
}
3.2.3 Update subcategory

PATCH /admin/subcategories/:id ✅

Body:

{ "name": "Linear Algebra" }
3.2.4 Delete subcategory (SOFT DELETE)

DELETE /admin/subcategories/:id ✅

Response:

{
  "ok": true,
  "item": { "id": 5, "status": "inactive" }
}
3.3 Questions
3.3.1 List questions

GET /admin/questions ✅

Filterlar:

?categoryId=1

?subcategoryId=2

?difficultyId=1

?status=active

Response:

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
3.3.2 Create question

POST /admin/questions ✅

Body:

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

Response:

{ "ok": true, "id": 10 }
3.3.3 Toggle question status (active/inactive)

PATCH /admin/questions/:id/toggle-status ✅

Response:

{
  "ok": true,
  "item": { "id": 10, "status": "inactive" }
}
3.3.4 Delete question (HARD delete)

DELETE /admin/questions/:id ✅

Response:

{ "ok": true }

Questions delete’ni hard qoldirish mumkin, lekin xavfsizlik uchun xohlasangiz buni ham soft qilish mumkin.
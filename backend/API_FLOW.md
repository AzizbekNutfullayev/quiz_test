# Quiz Platform API Flow (Frontend uchun)

## Base URL
http://localhost:5000

## Authorization
Protected endpointlarda header shart:

Authorization: Bearer <TOKEN>

TOKEN `/auth/verify-otp` dan keladi.

---

# 1) AUTH FLOW (Password yo‘q, OTP bilan)

## 1.1 OTP so‘rash
POST /auth/request-otp

Body:
{
  "email": "aziz@gmail.com"
}

Natija:
- server OTP yaratadi
- DBga hash qilib yozadi
- (dev rejimda) terminalga OTP chiqadi

---

## 1.2 OTP tasdiqlash (login)
POST /auth/verify-otp

Body:
{
  "email": "aziz@gmail.com",
  "code": "675939"
}

Response:
{
  "token": "JWT_TOKEN"
}

Frontend:
- tokenni saqlab qo‘yadi (localStorage yoki state)
- keyingi requestlarda Authorization headerga qo‘yadi

---

# 2) QUIZ FLOW

## 2.1 Quiz boshlash (attempt yaratish)
POST /quiz/start   (PROTECTED)

Headers:
Authorization: Bearer <TOKEN>

Body:
{
  "categoryId": 1,
  "subcategoryId": 1,
  "difficultyId": 1,
  "count": "10",              // faqat: "10" | "20" | "30" | "50"
  "timePerQuestionSec": 60
}

Response:
{
  "attemptId": 2
}

Frontend:
- attemptId ni saqlab qo‘yadi

---

## 2.2 Savollarni olish
GET /quiz/attempts/:attemptId/questions  (PROTECTED)

Example:
GET /quiz/attempts/2/questions

Response:
{
  "attemptId": 2,
  "questions": [
    {
      "order_index": 1,
      "question_id": 101,
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "image_url": null
    }
  ]
}

Izoh:
- correct_option frontga berilmaydi (security)

---

## 2.3 Javob yuborish
POST /quiz/attempts/:attemptId/answer  (PROTECTED)

Body:
{
  "orderIndex": 1,          // 1 dan boshlanadi (snapshot order)
  "selectedOption": "A",    // A | B | C | D
  "timeTakenSec": 12        // optional
}

Response:
{
  "ok": true,
  "isCorrect": true
}

Izoh:
- har bir orderIndex faqat 1 marta javob oladi (Already answered bo‘lishi mumkin)

---

## 2.4 Quizni tugatish
POST /quiz/attempts/:attemptId/finish  (PROTECTED)

Body: (yo‘q)

Response:
{
  "ok": true,
  "answered": 10,
  "totalCorrect": 7,
  "totalWrong": 3
}

Frontend:
- natija ekranga chiqariladi

---

# 3) Errorlar

## 401 Unauthorized
- token yo‘q yoki noto‘g‘ri
- Authorization header format xato

To‘g‘ri format:
Authorization: Bearer <TOKEN>

## 400 Already answered
- bitta orderIndexga qayta answer yuborilgan

## 404 Attempt not found
- attemptId boshqa userniki yoki yo‘q
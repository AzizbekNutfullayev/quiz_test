import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_EMAIL = process.env.TEST_EMAIL || "aziz@gmail.com";

async function req(path, opts = {}) {
    const method = opts.method || "GET";
    const token = opts.token;
    const body = opts.body;

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;

    let res;
    try {
        res = await fetch(BASE_URL + path, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (e) {
        console.log("❌ fetch failed. Server ishlayaptimi? BASE_URL:", BASE_URL);
        throw e;
    }

    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = { raw: text };
    }

    if (!res.ok) {
        console.log("❌ Request failed:", method, path);
        console.log("Status:", res.status);
        console.log("Response:", data);
        throw new Error("HTTP " + res.status);
    }

    return data;
}

async function main() {
    console.log("=== API TEST START ===");
    console.log("BASE_URL:", BASE_URL);
    console.log("EMAIL:", TEST_EMAIL);

    console.log("\n1) POST /auth/request-otp");
    await req("/auth/request-otp", { method: "POST", body: { email: TEST_EMAIL } });
    console.log("✅ OTP requested. (OTP server terminalida chiqadi)");

    const rl = readline.createInterface({ input, output });
    const otpInput = await rl.question("\nOTP ni kiriting (6 xonali): ");
    rl.close();

    const code = otpInput.trim();
    if (!/^\d{6}$/.test(code)) {
        throw new Error("OTP 6 xonali bo‘lishi shart. Masalan: 802406");
    }

    console.log("\n2) POST /auth/verify-otp");
    const verify = await req("/auth/verify-otp", {
        method: "POST",
        body: { email: TEST_EMAIL, code },
    });

    // Senda token nomi: accessToken
    const token = verify.accessToken || verify.token;
    if (!token) {
        console.log("Verify response:", verify);
        throw new Error("Token missing in /auth/verify-otp response");
    }

    console.log("✅ Token received (ok)");

    console.log("\n3) POST /quiz/start");
    const start = await req("/quiz/start", {
        method: "POST",
        token,
        body: { categoryId: 1, subcategoryId: 1, difficultyId: 1, count: "10", timePerQuestionSec: 60 },
    });

    const attemptId = start.attemptId;
    if (!attemptId) {
        console.log("Start response:", start);
        throw new Error("attemptId missing in /quiz/start response");
    }

    console.log("✅ attemptId:", attemptId);

    console.log("\n4) GET /quiz/attempts/:id/questions");
    const qs = await req("/quiz/attempts/" + attemptId + "/questions", { token });
    const questions = (qs && Array.isArray(qs.questions)) ? qs.questions : [];

    console.log("✅ questions count:", questions.length);
    console.log("First question:", questions[0] ? questions[0].question_text : "(missing)");

    console.log("\n5) POST /quiz/attempts/:id/answer (2 ta savol)");
    await req("/quiz/attempts/" + attemptId + "/answer", {
        method: "POST",
        token,
        body: { orderIndex: 1, selectedOption: "A", timeTakenSec: 10 },
    });

    await req("/quiz/attempts/" + attemptId + "/answer", {
        method: "POST",
        token,
        body: { orderIndex: 2, selectedOption: "B", timeTakenSec: 15 },
    });

    console.log("✅ answers saved (1,2)");

    console.log("\n6) POST /quiz/attempts/:id/finish");
    const finish = await req("/quiz/attempts/" + attemptId + "/finish", { method: "POST", token });
    console.log("✅ finished:", finish);

    console.log("\n=== API TEST DONE ✅ ===");
}

main().catch((e) => {
    console.error("\nTEST STOPPED ❌", e.message);
    process.exit(1);
});
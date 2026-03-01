import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_EMAIL = process.env.TEST_EMAIL || "aziz@gmail.com";

async function req(path, opts) {
    const method = (opts && opts.method) ? opts.method : "GET";
    const token = (opts && opts.token) ? opts.token : null;
    const body = (opts && opts.body) ? opts.body : null;

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;

    const res = await fetch(BASE_URL + path, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
        console.log("\n❌ Request failed:", method, path);
        console.log("Status:", res.status);
        console.log("Response:", data);
        throw new Error("HTTP " + res.status + " at " + method + " " + path);
    }

    return data;
}

function ensure(cond, msg) {
    if (!cond) throw new Error(msg);
}

async function main() {
    console.log("=== API FULL TEST START ===");
    console.log("BASE_URL:", BASE_URL);
    console.log("TEST_EMAIL:", TEST_EMAIL);

    // 1) OTP request
    console.log("\n1) POST /auth/request-otp");
    await req("/auth/request-otp", { method: "POST", body: { email: TEST_EMAIL } });
    console.log("✅ OTP requested (OTP server terminalida).");

    // OTP input
    const rl = readline.createInterface({ input, output });
    const otp = (await rl.question("OTP (6 xonali): ")).trim();
    rl.close();
    ensure(/^\d{6}$/.test(otp), "OTP 6 xonali bo‘lishi shart.");

    // 2) Verify
    console.log("\n2) POST /auth/verify-otp");
    const verify = await req("/auth/verify-otp", {
        method: "POST",
        body: { email: TEST_EMAIL, otp: otp, code: otp },
    });

    const token = verify.accessToken || verify.token;
    ensure(token, "Token missing in /auth/verify-otp response");
    const user = verify.user || {};
    console.log("✅ Token OK. role =", user.role);

    // ================= QUIZ FLOW =================
    console.log("\n3) POST /quiz/start");
    const start = await req("/quiz/start", {
        method: "POST",
        token,
        body: { categoryId: 1, subcategoryId: 1, difficultyId: 1, count: 10, timePerQuestionSec: 60 },
    });
    const attemptId = start.attemptId || start.attempt_id || start.id;
    ensure(attemptId, "attemptId missing in /quiz/start response");
    console.log("✅ attemptId:", attemptId);

    console.log("\n4) GET /quiz/attempts/:id/questions");
    const qs = await req("/quiz/attempts/" + attemptId + "/questions", { token });
    const questions = (qs && Array.isArray(qs.questions)) ? qs.questions : [];
    console.log("✅ questions:", questions.length);
    ensure(questions.length > 0, "No questions returned");

    console.log("\n5) POST /quiz/attempts/:id/answer (2ta)");
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
    console.log("✅ answers sent");

    console.log("\n6) POST /quiz/attempts/:id/finish");
    const finish = await req("/quiz/attempts/" + attemptId + "/finish", { method: "POST", token });
    console.log("✅ finish:", finish);

    // ================= ADMIN FLOW =================
    console.log("\n=== ADMIN FULL TESTS ===");
    if (user.role !== "admin") {
        console.log("⚠️ role admin emas -> admin test SKIP.");
        console.log("SQL: UPDATE users SET role='admin' WHERE email='" + TEST_EMAIL + "';");
        console.log("Keyin qayta OTP login qiling.");
        console.log("\n=== DONE ✅ (Admin skipped) ===");
        return;
    }

    // A) Category
    console.log("\nA1) POST /admin/categories (create)");
    const catName = "Cat " + Date.now();
    const catCreate = await req("/admin/categories", { method: "POST", token, body: { name: catName } });
    const categoryId = catCreate && catCreate.item ? catCreate.item.id : null;
    ensure(categoryId, "categoryId missing after create");
    console.log("✅ categoryId:", categoryId);

    console.log("\nA2) GET /admin/categories (list)");
    const catList = await req("/admin/categories", { token });
    console.log("✅ categories count:", Array.isArray(catList.items) ? catList.items.length : "unknown");

    console.log("\nA3) PATCH /admin/categories/:id (update)");
    const catUpd = await req("/admin/categories/" + categoryId, {
        method: "PATCH",
        token,
        body: { name: catName + " Updated" },
    });
    console.log("✅ updated:", catUpd.item || catUpd);

    // B) Subcategory
    console.log("\nB1) POST /admin/subcategories (create)");
    const subName = "Sub " + Date.now();
    const subCreate = await req("/admin/subcategories", {
        method: "POST",
        token,
        body: { categoryId: categoryId, name: subName },
    });
    const subcategoryId = subCreate && subCreate.item ? subCreate.item.id : null;
    ensure(subcategoryId, "subcategoryId missing after create");
    console.log("✅ subcategoryId:", subcategoryId);

    console.log("\nB2) GET /admin/subcategories?categoryId=...");
    const subList = await req("/admin/subcategories?categoryId=" + categoryId, { token });
    console.log("✅ subcategories count:", Array.isArray(subList.items) ? subList.items.length : "unknown");

    console.log("\nB3) PATCH /admin/subcategories/:id (update)");
    const subUpd = await req("/admin/subcategories/" + subcategoryId, {
        method: "PATCH",
        token,
        body: { name: subName + " Updated" },
    });
    console.log("✅ updated:", subUpd.item || subUpd);

    // C) Question
    console.log("\nC1) POST /admin/questions (create)");
    const qCreate = await req("/admin/questions", {
        method: "POST",
        token,
        body: {
            categoryId: categoryId,
            subcategoryId: subcategoryId,
            difficultyId: 1,
            questionText: "2 + 2 nechchi? (" + Date.now() + ")",
            optionA: "3",
            optionB: "4",
            optionC: "5",
            optionD: "6",
            correctOption: "B",
            status: "active",
        },
    });
    const questionId = qCreate.id || (qCreate.item ? qCreate.item.id : null);
    ensure(questionId, "questionId missing after create question");
    console.log("✅ questionId:", questionId);

    console.log("\nC2) GET /admin/questions?categoryId=...");
    const qList = await req("/admin/questions?categoryId=" + categoryId, { token });
    console.log("✅ questions count:", Array.isArray(qList.items) ? qList.items.length : "unknown");

    console.log("\nC3) PATCH /admin/questions/:id/toggle-status");
    const qTog = await req("/admin/questions/" + questionId + "/toggle-status", { method: "PATCH", token });
    console.log("✅ toggled:", qTog.item || qTog);

    console.log("\nC4) DELETE /admin/questions/:id (hard delete)");
    const qDel = await req("/admin/questions/" + questionId, { method: "DELETE", token });
    console.log("✅ deleted:", qDel);

    // D) Soft delete sub + cat (sizda DELETE soft bo‘lsa)
    console.log("\nD1) DELETE /admin/subcategories/:id (soft delete kutiladi)");
    const subDel = await req("/admin/subcategories/" + subcategoryId, { method: "DELETE", token });
    console.log("✅ subcategory delete:", subDel);

    console.log("\nD2) DELETE /admin/categories/:id (soft delete kutiladi)");
    const catDel = await req("/admin/categories/" + categoryId, { method: "DELETE", token });
    console.log("✅ category delete:", catDel);

    console.log("\n=== API FULL TEST DONE ✅ ===");
}

main().catch((e) => {
    console.error("\nTEST STOPPED ❌", e.message);
    process.exit(1);
});
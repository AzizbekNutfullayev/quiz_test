import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_EMAIL = process.env.TEST_EMAIL || "newadmin@gmail.com";

async function req(path, opts) {
    const method = opts && opts.method ? opts.method : "GET";
    const token = opts && opts.token ? opts.token : null;
    const body = opts && opts.body ? opts.body : null;

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;

    const res = await fetch(BASE_URL + path, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data;

    try {
        data = JSON.parse(text);
    } catch (err) {
        data = { raw: text };
    }

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

async function askOtp() {
    const rl = readline.createInterface({ input, output });
    const otp = (await rl.question("OTP (6 xonali): ")).trim();
    rl.close();

    ensure(/^\d{6}$/.test(otp), "OTP 6 xonali bo‘lishi shart.");
    return otp;
}

async function main() {
    console.log("=== API FULL TEST START ===");
    console.log("BASE_URL:", BASE_URL);
    console.log("TEST_EMAIL:", TEST_EMAIL);

    // ================= AUTH =================
    console.log("\n1) POST /auth/request-otp");
    await req("/auth/request-otp", {
        method: "POST",
        body: { email: TEST_EMAIL },
    });
    console.log("✅ OTP requested (OTP server terminalida).");

    const otp = await askOtp();

    console.log("\n2) POST /auth/verify-otp");
    const verify = await req("/auth/verify-otp", {
        method: "POST",
        body: { email: TEST_EMAIL, otp: otp, code: otp },
    });

    const token = verify.accessToken || verify.token;
    ensure(token, "Token missing in /auth/verify-otp response");

    const user = verify.user || {};
    const userId = user.id;
    ensure(userId, "user.id missing in /auth/verify-otp response");

    console.log("✅ Token OK. role =", user.role);
    console.log("✅ userId =", userId);

    // ================= QUIZ FLOW =================
    console.log("\n=== QUIZ FLOW ===");

    console.log("\n3) POST /quiz/start");
    const start = await req("/quiz/start", {
        method: "POST",
        token: token,
        body: {
            categoryId: 1,
            subcategoryId: 1,
            difficultyId: 1,
            count: 10,
            timePerQuestionSec: 60,
        },
    });

    const attemptId = start.attemptId || start.attempt_id || start.id;
    ensure(attemptId, "attemptId missing in /quiz/start response");
    console.log("✅ attemptId:", attemptId);

    console.log("\n4) GET /quiz/attempts/:id/questions");
    const qs = await req("/quiz/attempts/" + attemptId + "/questions", { token: token });
    const questions = qs && Array.isArray(qs.questions) ? qs.questions : [];
    console.log("✅ questions:", questions.length);
    ensure(questions.length > 0, "No questions returned");

    console.log("\n5) POST /quiz/attempts/:id/answer (2ta)");
    await req("/quiz/attempts/" + attemptId + "/answer", {
        method: "POST",
        token: token,
        body: { orderIndex: 1, selectedOption: "A", timeTakenSec: 10 },
    });
    await req("/quiz/attempts/" + attemptId + "/answer", {
        method: "POST",
        token: token,
        body: { orderIndex: 2, selectedOption: "B", timeTakenSec: 15 },
    });
    console.log("✅ answers sent");

    console.log("\n6) POST /quiz/attempts/:id/finish");
    const finish = await req("/quiz/attempts/" + attemptId + "/finish", {
        method: "POST",
        token: token,
    });
    console.log("✅ finish:", finish);

    // ================= USER PROFILE + STATS =================
    console.log("\n=== USER PROFILE + STATS ===");

    console.log("\n7) GET /users/me/profile");
    let myProfile = await req("/users/me/profile", { token: token });
    console.log("✅ profile:", myProfile);

    console.log("\n8) GET /users/me/stats");
    const myStats = await req("/users/me/stats", { token: token });
    console.log("✅ stats summary:", myStats.summary || myStats);

    // ================= LEADERBOARD =================
    console.log("\n=== LEADERBOARD ===");

    console.log("\n9) GET /leaderboard?range=week");
    const lbWeek = await req("/leaderboard?range=week");
    console.log("✅ leaderboard week count:", Array.isArray(lbWeek.items) ? lbWeek.items.length : "unknown");

    console.log("\n10) GET /leaderboard?range=month");
    const lbMonth = await req("/leaderboard?range=month");
    console.log("✅ leaderboard month count:", Array.isArray(lbMonth.items) ? lbMonth.items.length : "unknown");

    console.log("\n11) GET /leaderboard?range=year");
    const lbYear = await req("/leaderboard?range=year");
    console.log("✅ leaderboard year count:", Array.isArray(lbYear.items) ? lbYear.items.length : "unknown");

    console.log("\n12) GET /leaderboard?range=all");
    const lbAll = await req("/leaderboard?range=all");
    console.log("✅ leaderboard all count:", Array.isArray(lbAll.items) ? lbAll.items.length : "unknown");

    // ================= ADMIN FLOW =================
    console.log("\n=== ADMIN FLOW ===");

    if (user.role !== "admin") {
        console.log("⚠️ role admin emas -> admin + premium admin test SKIP.");
        console.log("SQL: UPDATE users SET role='admin' WHERE email='" + TEST_EMAIL + "';");
        console.log("Keyin qayta OTP login qiling.");
    } else {
        console.log("\nA1) POST /admin/categories");
        const catName = "Cat " + Date.now();
        const catCreate = await req("/admin/categories", {
            method: "POST",
            token: token,
            body: { name: catName },
        });
        const categoryId = catCreate && catCreate.item ? catCreate.item.id : null;
        ensure(categoryId, "categoryId missing after create");
        console.log("✅ categoryId:", categoryId);

        console.log("\nA2) GET /admin/categories");
        const catList = await req("/admin/categories", { token: token });
        console.log("✅ categories count:", Array.isArray(catList.items) ? catList.items.length : "unknown");

        console.log("\nA3) PATCH /admin/categories/:id");
        const catUpd = await req("/admin/categories/" + categoryId, {
            method: "PATCH",
            token: token,
            body: { name: catName + " Updated" },
        });
        console.log("✅ updated:", catUpd.item || catUpd);

        console.log("\nB1) POST /admin/subcategories");
        const subName = "Sub " + Date.now();
        const subCreate = await req("/admin/subcategories", {
            method: "POST",
            token: token,
            body: { categoryId: categoryId, name: subName },
        });
        const subcategoryId = subCreate && subCreate.item ? subCreate.item.id : null;
        ensure(subcategoryId, "subcategoryId missing after create");
        console.log("✅ subcategoryId:", subcategoryId);

        console.log("\nB2) GET /admin/subcategories?categoryId=...");
        const subList = await req("/admin/subcategories?categoryId=" + categoryId, { token: token });
        console.log("✅ subcategories count:", Array.isArray(subList.items) ? subList.items.length : "unknown");

        console.log("\nB3) PATCH /admin/subcategories/:id");
        const subUpd = await req("/admin/subcategories/" + subcategoryId, {
            method: "PATCH",
            token: token,
            body: { name: subName + " Updated" },
        });
        console.log("✅ updated:", subUpd.item || subUpd);

        console.log("\nC1) POST /admin/questions");
        const qCreate = await req("/admin/questions", {
            method: "POST",
            token: token,
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
        const qList = await req("/admin/questions?categoryId=" + categoryId, { token: token });
        console.log("✅ questions count:", Array.isArray(qList.items) ? qList.items.length : "unknown");

        console.log("\nC3) PATCH /admin/questions/:id/toggle-status");
        const qTog = await req("/admin/questions/" + questionId + "/toggle-status", {
            method: "PATCH",
            token: token,
        });
        console.log("✅ toggled:", qTog.item || qTog);

        console.log("\nC4) DELETE /admin/questions/:id");
        const qDel = await req("/admin/questions/" + questionId, {
            method: "DELETE",
            token: token,
        });
        console.log("✅ deleted:", qDel);

        console.log("\nD1) POST /admin/users/:userId/grant-premium");
        const grantPremium = await req("/admin/users/" + userId + "/grant-premium", {
            method: "POST",
            token: token,
            body: { planId: 1 },
        });
        console.log("✅ premium granted:", grantPremium);

        console.log("\nD2) GET /users/me/profile (premium tekshirish)");
        myProfile = await req("/users/me/profile", { token: token });
        console.log("✅ profile after premium:", myProfile);

        console.log("\n=== PREMIUM USER QUESTION CRUD ===");

        console.log("\nE1) POST /user/questions");
        const uqCreate = await req("/user/questions", {
            method: "POST",
            token: token,
            body: {
                questionText: "5 + 5 nechchi? (" + Date.now() + ")",
                optionA: "8",
                optionB: "9",
                optionC: "10",
                optionD: "11",
                correctOption: "C",
                difficultyId: 1,
            },
        });
        const userQuestionId = uqCreate && uqCreate.question ? uqCreate.question.id : null;
        ensure(userQuestionId, "userQuestionId missing after premium create");
        console.log("✅ premium question id:", userQuestionId);

        console.log("\nE2) GET /user/questions");
        const uqList = await req("/user/questions", { token: token });
        console.log("✅ my premium questions count:", Array.isArray(uqList.items) ? uqList.items.length : "unknown");

        console.log("\nE3) PATCH /user/questions/:id");
        const uqUpd = await req("/user/questions/" + userQuestionId, {
            method: "PATCH",
            token: token,
            body: {
                questionText: "5 + 5 nechiga teng? (" + Date.now() + ")",
                optionC: "10",
                status: "active",
            },
        });
        console.log("✅ premium question updated:", uqUpd);

        console.log("\nE4) DELETE /user/questions/:id");
        const uqDel = await req("/user/questions/" + userQuestionId, {
            method: "DELETE",
            token: token,
        });
        console.log("✅ premium question deleted:", uqDel);

        console.log("\nD3) POST /admin/users/:userId/remove-premium");
        const removePremium = await req("/admin/users/" + userId + "/remove-premium", {
            method: "POST",
            token: token,
        });
        console.log("✅ premium removed:", removePremium);

        console.log("\nF1) DELETE /admin/subcategories/:id");
        const subDel = await req("/admin/subcategories/" + subcategoryId, {
            method: "DELETE",
            token: token,
        });
        console.log("✅ subcategory delete:", subDel);

        console.log("\nF2) DELETE /admin/categories/:id");
        const catDel = await req("/admin/categories/" + categoryId, {
            method: "DELETE",
            token: token,
        });
        console.log("✅ category delete:", catDel);
    }

    console.log("\n=== API FULL TEST DONE ✅ ===");
}

main().catch(function(e) {
    console.error("\nTEST STOPPED ❌", e.message);
    process.exit(1);
});
export async function sendOtpEmail(email, code) {
    console.log("=== DEV MAILER ===");
    console.log("To:", email);
    console.log("OTP CODE:", code);
    console.log("==================");

    return { ok: true };
}
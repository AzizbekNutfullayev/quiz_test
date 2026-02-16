export async function requestOtp(req, res) {
    return res.json({ ok: true, message: "requestOtp works" });
}

export async function verifyOtp(req, res) {
    return res.json({ ok: true, message: "verifyOtp works" });
}
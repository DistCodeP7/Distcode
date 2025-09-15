const SECRET_KEY = "your_secret_key"; // Replace with your actual secret key

export function GenerateJWT(email: string) {
    var jwt = require('jsonwebtoken');
    const payload = { email };
    const options = { expiresIn: "1h" };
    return jwt.sign(payload, SECRET_KEY, options);
}


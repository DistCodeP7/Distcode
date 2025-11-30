const SECRET_KEY = "your_secret_key";
//TODO : Move to env variable
export function GenerateJWT(userid: string) {
  var jwt = require("jsonwebtoken");
  const payload = { userid };
  const options = { expiresIn: "1h" };
  return jwt.sign(payload, SECRET_KEY, options);
}

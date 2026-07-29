import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: ERROR_CODES.UNATUHTORIZED });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: ERROR_CODES.UNATUHTORIZED });
    }
    req.user = decodedUser;
    next();
  });
};

export default verifyToken;

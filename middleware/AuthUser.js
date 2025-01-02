import User from "../models/UserModel.js";
export const VerifyUser = async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ msg: "Please Login" });
  const user = await User.findOne({
    where: {
      uuid: req.session.userId,
    },
  });
  if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan" });
  req.userId = user.id;
  req.role = user.role;
  next();
};
export const AdminOnly = async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ msg: "Please Login" });
  const user = await User.findOne({
    where: {
      uuid: req.session.userId,
    },
  });
  if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan" });
  if (user.role !== "admin")
    return res.status(403).json({ msg: "Access Denied" });
  next();
};

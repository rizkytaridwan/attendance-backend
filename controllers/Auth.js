import User from "../models/UserModel.js";
import argon2 from "argon2";

export const Login = async (req, res) => {
  const user = await User.findOne({
    where: {
      email: req.body.email,
    },
  });
  if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan" });
  const match = await argon2.verify(user.password, req.body.password);
  if (!match) return res.status(400).json({ msg: "Password Salah" });
  req.session.userId = user.uuid;
  const uuid = user.uuid;
  const name = user.name;
  const email = user.email;
  const role = user.role;
  res.status(200).json({ uuid, name, email, role });
};

export const Me = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ msg: "Please Login" });
  const user = await User.findOne({
    attributes: [
      "uuid",
      "name",
      "email",
      "departement",
      "position",
      "role",
      "image",
    ],
    where: {
      uuid: req.session.userId,
    },
  });
  if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan" });
  res.status(200).json(user);
};

export const LogOut = async (req, res) => {
  try {
      // Hapus session dari store
      await new Promise((resolve, reject) => {
          req.session.destroy((err) => {
              if (err) reject(err);
              resolve();
          });
      });

      // Hapus cookie session
      res.clearCookie('connect.sid', {
          path: '/',
          domain: process.env.NODE_ENV === "production" ? process.env.DOMAIN : 'localhost',
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: 'lax',
          expires: new Date(0),
          maxAge: 0
      });

      res.status(200).json({ msg: "Logout Berhasil" });
  } catch (error) {
      console.error("Logout gagal:", error);
      res.status(500).json({ msg: "Terjadi kesalahan saat logout" });
  }
};
import User from "../models/UserModel.js";
import argon2 from "argon2";
export const getUsers = async (req, res) => {
    try {
        const response = await User.findAll({
            attributes: ['id','uuid','name','email','role','departement','position','image'],
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const getUserById = async (req, res) => {
    try {
        const response = await User.findOne({
            attributes: ['uuid','name','email','role','departement','position','image'],
            where: {
                uuid: req.params.id
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

export const createUser = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: "File gambar tidak diunggah!" });
    }
    const { name, email, password, confPassword, role, departement, position } = req.body;

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok!" });
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ msg: "Email Sudah Terdaftar!" });

        const hashPassword = await argon2.hash(password);

        const imagePath = `/uploads/${req.file.filename}`;

        await User.create({
            name,
            email,
            password: hashPassword,
            role,
            departement,
            position,
            image: imagePath,
        });

        res.status(201).json({ msg: "Register Berhasil!" });
    } catch (error) {
        res.status(500).json({ msg: "Terjadi kesalahan pada server: " + error.message });
    }
};



export const updateUser = async (req, res) => {
    const user = await User.findOne({
        where: {
            uuid: req.params.id
        }
    });

    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

    const { name, email, password, confPassword, role, departement, position } = req.body;

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
    }

    let hashPassword = user.password; 
    if (password && password !== "") {
        hashPassword = await argon2.hash(password); 
    }

    let imagePath = user.image; 
    if (req.file) {
        imagePath = `/uploads/${req.file.filename}`;
    }

    try {
        await User.update(
            {
                name,
                email,
                password: hashPassword,
                role,
                departement,
                position,
                image: imagePath,
            },
            {
                where: { uuid: req.params.id },
            }
        );

        res.status(200).json({ msg: "User updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan pada server: " + error.message });
    }
};

export const deleteUser = async (req, res) => {
    const user = await User.findOne({
        where: {
            uuid: req.params.id
        }
    });
    if (!user) return res.status(404).json({msg: "User Tidak Ditemukan!"});
    try {
            await User.destroy({
            where: {
                id: user.id
            }
        });
        res.status(200).json({msg: "User Deleted"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

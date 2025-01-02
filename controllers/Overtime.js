import Over from "../models/OvertimeModel.js";
import User from "../models/UserModel.js";
import { Op } from "sequelize";

export const createOvertime = async (req, res) => {
    try {
        const userUuid = req.session.userId;

        if (!userUuid) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({ where: { uuid: userUuid } });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan!" });

        const { date, hours, description } = req.body;

        if (!date || !hours || !description) {
            return res.status(400).json({ msg: "Semua data harus diisi!" });
        }

        const existingOvertime = await Over.findOne({
            where: {
                userId: user.id,
                date: {
                    [Op.gte]: new Date(new Date(date).setHours(0, 0, 0, 0)),
                    [Op.lt]: new Date(new Date(date).setHours(23, 59, 59, 999))
                }
            },
        });

        if (existingOvertime) {
            return res.status(400).json({ msg: "Anda sudah memiliki lembur di tanggal ini!" });
        }

        if (hours > 12) {
            return res.status(400).json({ msg: "Jam lembur tidak boleh lebih dari 12 jam per hari." });
        }
        const overtimerate = 30000;
        const totalpayment = hours * overtimerate;
        const overtime = await Over.create({
            date,
            hours,
            description,
            status: "Pending",
            approved_by: "Pending",
            overtime_rate: overtimerate,
            overtime_payment: totalpayment,
            userId: user.id,
        });

        return res.status(201).json({
            msg: "Lembur berhasil ditambahkan",
            overtime: {
                uuid: overtime.uuid,
                userName: user.name,
                departement: user.departement,
                position: user.position,
                date: overtime.date,
                hours: overtime.hours,
                description: overtime.description,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const getAllOvertime = async (req, res) => {
    try {
        const response = await Over.findAll({
            attributes: ['uuid', 'date', 'hours', 'description', 'status', 'overtime_rate', 'overtime_payment','approved_by'],
            include: [{
                model: User,
                attributes: ['name', 'departement', 'position'],
            }],
        });

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const getOvertimeByUuid = async (req, res) => {
    try {
        const { uuid } = req.params;

        const overtime = await Over.findOne({
            attributes: ['uuid', 'date', 'hours', 'description', 'status', 'overtime_rate', 'overtime_payment','approved_by'],
            where: { uuid },
            include: [{
                model: User,
                attributes: ['name', 'departement', 'position'],
            }],
        });

        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        return res.status(200).json(overtime);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const updateOvertime = async (req, res) => {
    try {
        const { uuid } = req.params;
        const { date, hours, description } = req.body;

        // if (!date || !hours || !description) {
        //     return res.status(400).json({ msg: "Semua data harus diisi!" });
        // }

        const overtime = await Over.findOne({ where: { uuid } });

        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        const overtimerate = 30000;
        overtime.date = date;
        overtime.hours = hours;
        overtime.description = description;
        overtime.overtime_rate = overtimerate;
        overtime.overtime_payment = hours * overtimerate;

        await overtime.save();

        return res.status(200).json({
            msg: "Lembur berhasil diupdate",
            overtime,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const deleteOvertime = async (req, res) => {
    try {
        const { uuid } = req.params;

        const overtime = await Over.findOne({ where: { uuid } });

        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        await overtime.destroy();

        return res.status(200).json({ msg: "Lembur berhasil dihapus" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const approveOvertime = async (req, res) => {
    try {
        const { uuid } = req.params;
        const userUuid = req.session.userId;

        if (!userUuid) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({ where: { uuid: userUuid } });
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan!" });
        }

        const overtime = await Over.findOne({ where: { uuid } });
        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        if (overtime.status !== "Pending") {
            return res.status(400).json({ msg: "Lembur sudah diproses." });
        }

        overtime.status = "Approved";
        overtime.approved_by = user.name;

        await overtime.save();

        return res.status(200).json({
            msg: "Lembur berhasil disetujui",
            overtime,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const rejectOvertime = async (req, res) => {
    try {
        const { uuid } = req.params;
        const userUuid = req.session.userId;

        if (!userUuid) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({ where: { uuid: userUuid } });
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan!" });
        }

        const overtime = await Over.findOne({ where: { uuid } });
        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        if (overtime.status !== "Pending") {
            return res.status(400).json({ msg: "Lembur sudah diproses." });
        }

        overtime.status = "Rejected";
        overtime.overtime_rate = 0;
        overtime.overtime_payment = 0;
        overtime.approved_by = user.name;

        await overtime.save();

        return res.status(200).json({
            msg: "Lembur berhasil ditolak",
            overtime,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const getUserOvertimeHistory = async (req, res) => {
    const userUuid = req.session.userId;

    if (!userUuid) {
        return res.status(401).json({ msg: "Unauthorized, please log in first" });
    }

    try {
        const user = await User.findOne({ where: { uuid: userUuid } });
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan!" });
        }

        const overtimeHistory = await Over.findAll({
            where: { userId: user.id },
            attributes: ['uuid', 'date', 'hours', 'description', 'status', 'overtime_rate', 'overtime_payment','approved_by'],
        });

        if (!overtimeHistory.length) {
            return res.status(404).json({ msg: "Tidak ada data lembur." });
        }

        res.status(200).json(overtimeHistory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const getPendingOvertime = async (req, res) => {
    try {
        const response = await Over.findAll({
            where: { status: "Pending" },
            attributes: ['uuid', 'date', 'hours', 'description', 'status', 'overtime_rate', 'overtime_payment','approved_by'],
        });

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

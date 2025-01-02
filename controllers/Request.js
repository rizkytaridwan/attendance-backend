import Requests from "../models/RequestModel.js";
import User from "../models/UserModel.js";

export const editRequest = async (req, res) => {
    try {
        const response = await Requests.update(req.body, {
            where: {
                uuid: req.params.id
            }
        });
        res.status(200).json({ msg: "Data updated successfully", response });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createRequest = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({ where: { uuid: userId } });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan!" });

        const { start_date, end_date, reason, leave_type } = req.body;

        if (!start_date || !end_date || !reason || !leave_type) {
            return res.status(400).json({ msg: "Semua data harus diisi!" });
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (startDate > endDate) {
            return res.status(400).json({ msg: "Tanggal mulai tidak boleh lebih besar dari tanggal akhir." });
        }

        const request = await Requests.create({
            userId: user.id,
            name: user.name,
            departement: user.departement,
            position: user.position,
            start_date: startDate,
            end_date: endDate,
            reason: reason,
            leave_type: leave_type,
            status: "Pending",
        });

        return res.status(201).json({
            msg: "Request Created",
            uuid: request.uuid,
            userName: user.name,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            leaveType: request.leave_type
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const approveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({ where: { uuid: userId } });
        if (!user) {
            return res.status(404).json({ msg: "Pengguna tidak ditemukan!" });
        }

        const request = await Requests.findOne({ where: { uuid: requestId } });

        if (!request) {
            return res.status(404).json({ msg: "Permintaan cuti tidak ditemukan!" });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({ msg: "Permintaan cuti ini sudah diproses sebelumnya." });
        }

        request.status = "Approved";
        request.approved_by = user.name;

        await request.save();

        return res.status(200).json({
            msg: "Permintaan cuti telah disetujui.",
            uuid: request.uuid,
            userName: user.name,
            startDate: request.start_date,
            endDate: request.end_date,
            reason: request.reason,
            leaveType: request.leave_type,
            approvedBy: request.approved_by,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({ where: { uuid: userId } });
        if (!user) {
            return res.status(404).json({ msg: "Pengguna tidak ditemukan!" });
        }

        const request = await Requests.findOne({ where: { uuid: requestId } });

        if (!request) {
            return res.status(404).json({ msg: "Permintaan cuti tidak ditemukan!" });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({ msg: "Permintaan cuti ini sudah diproses sebelumnya." });
        }

        request.status = "Rejected";
        request.approved_by = user.name;

        await request.save();

        return res.status(200).json({
            msg: "Permintaan cuti ditolak.",
            uuid: request.uuid,
            userName: user.name,
            startDate: request.start_date,
            endDate: request.end_date,
            reason: request.reason,
            leaveType: request.leave_type,
            approvedBy: request.approved_by,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const getRequests = async (req, res) => {
    try {
        const response = await Requests.findAll({
            attributes: [
                'uuid','start_date', 'end_date', 'reason', 'status', 'leave_type', 'approved_by'
            ],
            include: [{
                model: User,
                attributes: ['name', 'departement', 'position'],
            }],
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getRequestById = async (req, res) => {
    try {
        const response = await Requests.findOne({
            attributes: [
                'uuid','start_date', 'end_date', 'reason', 'status', 'leave_type', 'approved_by'
            ],
            where: { uuid: req.params.id },
            include: [{
                model: User,
                attributes: ['name', 'departement', 'position'],
            }],
        });
        if (!response) {
            return res.status(404).json({ msg: "Data tidak ditemukan!" });
        }
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const deleteRequest = async (req, res) => {
    try {
        const response = await Requests.destroy({
            where: {
                uuid: req.params.id
            }
        });
        res.status(200).json({ msg: "Data deleted successfully", response });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getPendingRequests = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({ where: { uuid: userId } });
        if (!user) return res.status(404).json({ msg: "User not found!" });

        const pendingRequests = await Requests.findAll({
            where: { userId: user.id, status: "Pending" },
            include: [{
                model: User,
                attributes: ['name', 'departement', 'position'],
            }],
        });

        res.status(200).json(pendingRequests);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getRequestBySession = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({
            where: { uuid: userId },
            attributes: ['id', 'name', 'departement', 'position']
        });

        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan!" });
        }

        const requests = await Requests.findAll({
            where: { userId: user.id },
            attributes: ['uuid', 'start_date', 'end_date', 'reason', 'status', 'leave_type', 'approved_by'],
            include: [{
                model: User,
                attributes: ['name', 'departement', 'position'],
            }],
        });

        if (!requests || requests.length === 0) {
            return res.status(404).json({ msg: "Tidak ada permintaan cuti untuk pengguna ini." });
        }

        return res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

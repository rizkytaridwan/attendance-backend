import Attendance from "../models/AttendanceModel.js";
import Deductions from "../models/DeductionsModel.js";
import Requests from "../models/RequestModel.js";
import User from "../models/UserModel.js";
import moment from "moment-timezone";
import { Op } from "sequelize";
import cron from "node-cron";

export const createAttendance = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized, please log in first" });
    }

    const user = await User.findOne({ where: { uuid: userId } });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan!" });

    const { checkOut, location = "Unknown", status = "Checked In", check_in_ip, check_out_ip } = req.body;

    if (!checkOut) {
      const existingAttendance = await Attendance.findOne({
        where: {
          userId: user.id,
          check_out_time: null,
        },
      });

      if (existingAttendance) {
        return res
          .status(400)
          .json({ msg: "User sudah melakukan check-in hari ini." });
      }

      const workStartTime = moment().tz("Asia/Jakarta").set({
        hour: 8,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      const checkInTime = moment(new Date()).tz("Asia/Jakarta");

      let latenessMinutes = 0;

      if (checkInTime.isAfter(workStartTime)) {
        latenessMinutes = checkInTime.diff(workStartTime, "minutes");
      }

      let checkInImage = null;
      if (req.files && req.files.checkInImage) {
        checkInImage = req.files.checkInImage[0].path;
      }
      const latenessDeduction = latenessMinutes * 208;
      const newAttendance = await Attendance.create({
        userId: user.id,
        check_in_time: checkInTime.toDate(),
        check_out_time: null,
        location_latitude: location.latitude || null,
        location_longitude: location.longitude || null,
        status,
        check_in_image: checkInImage,
        check_in_ip,
        lateness_minutes: latenessMinutes,
      });

      // Tambahkan ke tabel Deductions jika ada keterlambatan
      if (latenessMinutes > 0) {
        await Deductions.create({
          userId: user.id,
          type: "Late",
          amount: latenessDeduction,
          description: `Keterlambatan ${latenessMinutes} menit`,
        });
      }

      const checkInTimeLocal = checkInTime.format("YYYY-MM-DD HH:mm:ss");

      return res.status(200).json({
        msg: `Check-in berhasil! Anda Telat ${latenessMinutes} Menit`,
        attendance: {
          uuid: newAttendance.uuid,
          userName: user.name,
          departement: user.departement,
          position: user.position,
          checkInTime: checkInTimeLocal,
          latenessMinutes,
          Deduction: `Rp ${latenessDeduction}`,
        },
      });
    }

    const attendance = await Attendance.findOne({
      where: {
        userId: user.id,
        check_out_time: null,
      },
    });

    if (!attendance) {
      return res.status(400).json({ msg: "User belum melakukan check-in." });
    }

    const checkOutTime = new Date();

    let checkOutImage = null;
    if (req.files && req.files.checkOutImage) {
      checkOutImage = req.files.checkOutImage[0].path;
    }

    attendance.check_out_time = checkOutTime;
    attendance.status = "Checked Out";
    attendance.check_out_image = checkOutImage;
    attendance.check_out_ip = check_out_ip;

    await attendance.save();

    const checkInTime = new Date(attendance.check_in_time);
    const timeDifference = checkOutTime - checkInTime;

    if (timeDifference <= 0) {
      return res.status(400).json({
        msg: "Waktu check-out tidak valid. Pastikan waktu check-out lebih besar dari waktu check-in.",
      });
    }

    const totalHours = Math.floor(timeDifference / (1000 * 60 * 60));
    const totalMinutes = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    );

    const workEndTime = moment(checkInTime).tz("Asia/Jakarta").set({
      hour: 17,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    let earlyCheckoutPenalty = 0;
    if (moment(checkOutTime).isBefore(workEndTime)) {
      const earlyCheckoutMinutes = workEndTime.diff(
        moment(checkOutTime),
        "minutes"
      );
      earlyCheckoutPenalty = earlyCheckoutMinutes * 208; // Rp 208 per menit

      // Tambahkan ke tabel Deductions untuk early checkout
      await Deductions.create({
        userId: user.id,
        type: "Early Checkout",
        amount: earlyCheckoutPenalty,
        description: `Keluar lebih awal ${earlyCheckoutMinutes} menit`,
      });
    }

    const totalDuration = `${totalHours} jam ${totalMinutes} menit`;
    const checkOutTimeLocal = moment(checkOutTime)
      .tz("Asia/Jakarta")
      .format("YYYY-MM-DD HH:mm:ss");

    return res.status(200).json({
      msg: "Check-out berhasil!",
      attendance: {
        id: attendance.uuid,
        userName: user.name,
        departement: user.departement,
        position: user.position,
        checkOutTime: checkOutTimeLocal,
        totalDuration,
        earlyCheckoutPenalty: `Rp ${earlyCheckoutPenalty}`,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAttendanceStatus = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized, please log in first" });
    }

    const user = await User.findOne({ where: { uuid: userId } });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan!" });

    // Check if user has an active check-in
    const activeAttendance = await Attendance.findOne({
      where: {
        userId: user.id,
        check_out_time: null,
      },
    });

    return res.status(200).json({
      isCheckedIn: !!activeAttendance
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};


export const getAttendance = async (req, res) => {
  try {
    const response = await Attendance.findAll({
      attributes: [
        "uuid",
        "check_in_time",
        "check_out_time",
        "location_latitude",
        "location_longitude",
        "status",
        "check_in_image",
        "check_out_image",
        "check_in_ip",
        "check_out_ip",
        "lateness_minutes",
      ],
      include: [
        {
          model: User,
          attributes: ["name", "departement", "position"],
        },
      ],
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const response = await Attendance.findOne({
      attributes: [
        "uuid",
        "check_in_time",
        "check_out_time",
        "location_latitude",
        "location_longitude",
        "status",
        "check_in_image",
        "check_out_image",
        "lateness_minutes",
      ],
      where: { uuid: req.params.id },
      include: [
        {
          model: User,
          attributes: ["name", "departement", "position"],
        },
      ],
    });
    if (!response) {
      return res.status(404).json({ msg: "Data tidak ditemukan!" });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const response = await Attendance.update(req.body, {
      where: {
        uuid: req.params.id,
      },
    });
    res.status(200).json({ msg: "Data updated successfully", response });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const response = await Attendance.destroy({
      where: {
        uuid: req.params.id,
      },
    });
    res.status(200).json({ msg: "Data deleted successfully", response });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAbsentUsers = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendanceRecords = await Attendance.findAll({
      where: {
        check_in_time: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      attributes: ["userId"],
    });

    const attendedUserIds = attendanceRecords.map((record) => record.userId);

    const absentUsers = await User.findAll({
      where: {
        id: {
          [Op.notIn]: attendedUserIds,
        },
      },
      attributes: ["name" , "departement", "position"],
    });

    if (absentUsers.length > 0) {
      res
        .status(200)
        .json({ msg: "Karyawan yang tidak hadir hari ini", data: absentUsers });
    } else {
      res
        .status(404)
        .json({ msg: "Tidak ada karyawan yang tidak hadir hari ini" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server: " + error.message });
  }
};

export const getAttendanceBySession = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized, please log in first" });
    }

    const user = await User.findOne({
      where: { uuid: userId },
    });

    if (!user) {
      return res.status(404).json({ msg: "User Tidak Ditemukan!" });
    }

    const attendanceRecords = await Attendance.findAll({
      attributes: [
        "uuid",
        "check_in_time",
        "check_out_time",
        "location_latitude",
        "location_longitude",
        "status",
        "check_in_image",
        "check_out_image",
        "deduction",
        "lateness_minutes",
      ],
      where: { userId: user.id },
      order: [["check_in_time", "DESC"]],
    });

    if (attendanceRecords.length === 0) {
      return res
        .status(404)
        .json({ msg: "Tidak ada data absensi untuk user ini." });
    }

    const formattedResponse = attendanceRecords.map((att) => {
      const checkInTimeLocal = moment(att.check_in_time)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const checkOutTimeLocal = att.check_out_time
        ? moment(att.check_out_time)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD HH:mm:ss")
        : null;

      return {
        ...att.toJSON(),
        check_in_time: checkInTimeLocal,
        check_out_time: checkOutTimeLocal,
      };
    });

    return res.status(200).json(formattedResponse);
  } catch (error) {
    console.error("Error fetching attendance by session:", error.message);
    return res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server: " + error.message });
  }
};

export const getAttendanceInMonthByUserId = async (req, res) => {
  try {
    const { userId, month, year } = req.body;

    if (!userId || !month || !year) {
      return res.status(400).json({
        msg: "User ID, month, and year are required.",
      });
    }

    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ msg: "User Tidak Ditemukan!" });
    }

    const startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
    const endDate = moment(`${year}-${month}-01`).endOf("month").toDate();

    const attendanceRecords = await Attendance.findAll({
      where: {
        userId: user.id,
        check_in_time: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: ["check_in_time", "check_out_time", "lateness_minutes"],
    });

    if (attendanceRecords.length === 0) {
      return res
        .status(404)
        .json({ msg: `Tidak ada data absensi untuk bulan ${month}/${year}.` });
    }

    const totalDays = attendanceRecords.length;
    const lateDays = attendanceRecords.filter(
      (record) => record.lateness_minutes > 0
    ).length;
    const totalLateMinutes = attendanceRecords.reduce(
      (sum, record) => sum + record.lateness_minutes,
      0
    );

    const formattedResponse = attendanceRecords.map((att) => {
      const checkInTimeLocal = moment(att.check_in_time)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const checkOutTimeLocal = att.check_out_time
        ? moment(att.check_out_time)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD HH:mm:ss")
        : null;

      return {
        ...att.toJSON(),
        check_in_time: checkInTimeLocal,
        check_out_time: checkOutTimeLocal,
      };
    });

    return res.status(200).json({
      msg: `Data absensi bulan ${month}/${year}`,
      user: {
        name: user.name,
        departement: user.departement,
        position: user.position,
      },
      data: formattedResponse,
      summary: {
        totalDays,
        lateDays,
        totalLateMinutes,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching attendance in month by userId:",
      error.message
    );
    return res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server: " + error.message });
  }
};

export const getAttendanceInMonth = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        msg: "Month and year are required.",
      });
    }

    const startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
    const endDate = moment(`${year}-${month}-01`).endOf("month").toDate();

    const attendanceRecords = await Attendance.findAll({
      where: {
        check_in_time: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "uuid",
        "check_in_time",
        "check_out_time",
        "location_latitude",
        "location_longitude",
        "status",
        "check_in_image",
        "check_out_image",
        "lateness_minutes",
        "userId",
      ],
    });

    if (attendanceRecords.length === 0) {
      return res
        .status(404)
        .json({ msg: `Tidak ada data absensi untuk bulan ${month}/${year}.` });
    }
    const userPromises = attendanceRecords.map(async (att) => {
      const user = await User.findOne({
        where: { id: att.userId },
        attributes: ["name", "departement", "position"],
      });
      
      if (!user) {
        return res.status(500).json({ msg: "User not found for attendance record." });
      }

      return {
        ...att.toJSON(),
        user: user.toJSON(),
      };
    });
    const attendanceWithUser = await Promise.all(userPromises);

    const totalDays = attendanceWithUser.length;
    const lateDays = attendanceWithUser.filter(
      (record) => record.lateness_minutes > 0
    ).length;
    const totalLateMinutes = attendanceWithUser.reduce(
      (sum, record) => sum + record.lateness_minutes,
      0
    );

    const formattedResponse = attendanceWithUser.map((att) => {
      const checkInTimeLocal = moment(att.check_in_time)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const checkOutTimeLocal = att.check_out_time
        ? moment(att.check_out_time)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD HH:mm:ss")
        : null;

      return {
        ...att,
        check_in_time: checkInTimeLocal,
        check_out_time: checkOutTimeLocal,
      };
    });

    return res.status(200).json({
      msg: `Data absensi bulan ${month}/${year}`,
      data: formattedResponse,
      summary: {
        totalDays,
        lateDays,
        totalLateMinutes,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error.message);
    return res.status(500).json({ msg: "Terjadi kesalahan pada server: " + error.message });
  }
};

export const processAbsentEmployees = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get all employees who haven't checked in today
    const attendanceRecords = await Attendance.findAll({
      where: {
        check_in_time: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      attributes: ["userId"],
    });

    const attendedUserIds = attendanceRecords.map((record) => record.userId);

    // Get all employees who haven't checked in
    const absentUsers = await User.findAll({
      where: {
        id: {
          [Op.notIn]: attendedUserIds,
        },
      },
      attributes: ["id", "name", "departement", "position"],
    });

    // Process each absent user
    const processedUsers = await Promise.all(
      absentUsers.map(async (user) => {
        // Check if user has an approved leave request for today
        const leaveRequest = await Requests.findOne({
          where: {
            userId: user.id,
            status: "Approved",
            start_date: {
              [Op.lte]: endOfDay,
            },
            end_date: {
              [Op.gte]: startOfDay,
            },
          },
        });

        // If no approved leave request, create deduction
        if (!leaveRequest) {
          // Default deduction amount for unauthorized absence (you can adjust this)
          const deductionAmount = 100000; // Rp 100,000 per day

          await Deductions.create({
            userId: user.id,
            type: "Unauthorized Absence",
            amount: deductionAmount,
            description: `Tidak hadir tanpa keterangan pada ${moment(today).format(
              "DD-MM-YYYY"
            )}`,
          });

          return {
            ...user.toJSON(),
            status: "Unauthorized Absence",
            deduction: deductionAmount,
          };
        }

        return {
          ...user.toJSON(),
          status: "Approved Leave",
          leaveType: leaveRequest.leave_type,
          deduction: 0,
        };
      })
    );

    // Modify the getAbsentUsers function to include this information
    const summary = {
      totalAbsent: processedUsers.length,
      unauthorizedAbsences: processedUsers.filter(
        (user) => user.status === "Unauthorized Absence"
      ).length,
      approvedLeaves: processedUsers.filter(
        (user) => user.status === "Approved Leave"
      ).length,
      totalDeductions: processedUsers.reduce((sum, user) => sum + user.deduction, 0),
    };

    return res.status(200).json({
      msg: "Absent employees processed successfully",
      summary,
      data: processedUsers,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error processing absent employees: " + error.message,
    });
  }
};

export const getUserDeductions = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { startDate, endDate } = req.query;

    const whereClause = {
      userId: userId,
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const deductions = await Deductions.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["name", "departement", "position"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const summary = {
      totalDeductions: deductions.reduce((sum, record) => sum + Number(record.amount), 0),
      deductionsByType: deductions.reduce((acc, record) => {
        acc[record.type] = (acc[record.type] || 0) + Number(record.amount);
        return acc;
      }, {}),
    };

    return res.status(200).json({
      msg: "Deduction records retrieved successfully",
      summary,
      data: deductions,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving deduction records: " + error.message,
    });
  }
};

cron.schedule('59 23 * * *', async () => {
  try {
    await processAbsentEmployees();
    console.log('Processed absent employees successfully');
  } catch (error) {
    console.error('Error processing absent employees:', error);
  }
});

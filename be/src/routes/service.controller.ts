import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ServiceBooking } from "../models/ServiceBooking";

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const {
      serviceType,
      serviceDate,
      contactName,
      contactPhone,
      estimatedPrice,
      note,
      paymentMethod,
      movingDetails,
      cleaningDetails,
    } = req.body;

    // --- Validation ---
    if (!serviceType || !["moving", "cleaning"].includes(serviceType)) {
      return res.status(400).json({ message: "serviceType phải là 'moving' hoặc 'cleaning'" });
    }
    if (!serviceDate || isNaN(Date.parse(serviceDate))) {
      return res.status(400).json({ message: "serviceDate không hợp lệ" });
    }
    if (!contactName || typeof contactName !== "string" || contactName.trim() === "") {
      return res.status(400).json({ message: "contactName là bắt buộc" });
    }
    if (!contactPhone || typeof contactPhone !== "string" || contactPhone.trim() === "") {
      return res.status(400).json({ message: "contactPhone là bắt buộc" });
    }
    if (estimatedPrice !== undefined && (typeof estimatedPrice !== "number" || estimatedPrice < 0)) {
      return res.status(400).json({ message: "estimatedPrice không được âm" });
    }
    if (serviceType === "moving") {
      if (!movingDetails) {
        return res.status(400).json({ message: "movingDetails là bắt buộc cho dịch vụ vận chuyển" });
      }
      if (!movingDetails.pickupAddress || !movingDetails.dropoffAddress || !movingDetails.vehicleType) {
        return res.status(400).json({ message: "movingDetails phải có pickupAddress, dropoffAddress và vehicleType" });
      }
      const validVehicles = ["motorbike", "three_wheeler", "small_truck"];
      if (!validVehicles.includes(movingDetails.vehicleType)) {
        return res.status(400).json({ message: "vehicleType không hợp lệ" });
      }
    }
    if (serviceType === "cleaning") {
      if (!cleaningDetails) {
        return res.status(400).json({ message: "cleaningDetails là bắt buộc cho dịch vụ dọn dẹp" });
      }
      if (!cleaningDetails.address || !cleaningDetails.roomSizePackage) {
        return res.status(400).json({ message: "cleaningDetails phải có address và roomSizePackage" });
      }
      const validPackages = ["small", "medium", "large"];
      if (!validPackages.includes(cleaningDetails.roomSizePackage)) {
        return res.status(400).json({ message: "roomSizePackage không hợp lệ" });
      }
    }

    const newBooking = new ServiceBooking({
      tenant: req.userId,
      serviceType,
      serviceDate,
      contactName,
      contactPhone,
      estimatedPrice: estimatedPrice ?? 0,
      note,
      paymentMethod,
      movingDetails,
      cleaningDetails,
    });

    await newBooking.save();

    res.status(201).json({ message: "Đặt dịch vụ thành công", booking: newBooking });
  } catch (error: any) {
    console.error("Error creating service booking:", error);
    res.status(500).json({ message: "Lỗi server khi đặt dịch vụ", error: error.message });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await ServiceBooking.find({ tenant: req.userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error: any) {
    console.error("Error fetching my bookings:", error);
    res.status(500).json({ message: "Lỗi server khi tải lịch sử", error: error.message });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await ServiceBooking.findOne({ _id: id, tenant: req.userId });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn dịch vụ" });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return res.status(400).json({ message: "Chỉ có thể huỷ đơn đang chờ hoặc đã xác nhận" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Huỷ đơn thành công", booking });
  } catch (error: any) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Lỗi server khi huỷ đơn", error: error.message });
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await ServiceBooking.find().populate("tenant", "fullName email phone").sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error: any) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: "Lỗi server khi tải đơn dịch vụ", error: error.message });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const booking = await ServiceBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn dịch vụ" });
    }

    booking.status = status;
    if (adminNote !== undefined) {
      booking.adminNote = adminNote;
    }

    await booking.save();

    res.json({ message: "Cập nhật trạng thái thành công", booking });
  } catch (error: any) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái", error: error.message });
  }
};

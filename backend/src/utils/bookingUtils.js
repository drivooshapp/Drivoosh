import { Op } from "sequelize";
import Booking from "../models/Booking.js";

export const autoCancelExpiredBookings = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().substring(0, 5);

    await Booking.update(
      { status: "cancelled" },
      {
        where: {
          status: "pending",
          [Op.or]: [
            { lessonDate: { [Op.lt]: currentDate } },
            {
              lessonDate: currentDate,
              startTime: { [Op.lt]: currentTime }
            }
          ]
        }
      }
    );
  } catch (error) {
    console.error("Error auto-cancelling expired bookings:", error);
  }
};
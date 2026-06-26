import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Website from "../models/Website.js";

export const deleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Admin cannot delete their own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be removed here" });
    }

    await Promise.all([
      User.findByIdAndDelete(id),
      Message.deleteMany({
        $or: [{ senderId: id }, { receiverId: id }],
      }),
      Website.deleteMany({ userId: id }),
      Group.updateMany(
        { members: id },
        { $pull: { members: id } }
      ),
    ]);

    await Group.deleteMany({ members: { $size: 0 } });

    res.status(200).json({ message: "User account removed" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "Failed to remove user account" });
  }
};

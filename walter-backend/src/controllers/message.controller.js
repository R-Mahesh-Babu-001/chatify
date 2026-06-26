import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";

const MESSAGE_DELETE_AFTER_SEEN_MS = 10 * 60 * 1000;

const scheduleSeenMessagesDeletion = (messageIds) => {
  if (!messageIds.length) return;

  setTimeout(async () => {
    try {
      await Message.deleteMany({
        _id: { $in: messageIds },
        expireAt: { $lte: new Date() },
      });
    } catch (error) {
      console.error("Error deleting expired seen messages:", error.message);
    }
  }, MESSAGE_DELETE_AFTER_SEEN_MS);
};

export const getAllContacts = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { _id: { $ne: req.user._id } }
        : { role: { $ne: "admin" } };
    const users = await User.find(filter).select("-password -otpHash -otpExpiresAt");

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    const chatUser = await User.findById(userToChatId).select("role");

    if (!chatUser || (chatUser.role === "admin" && req.user.role !== "admin")) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      isDeleted: { $ne: true },
      deletedFor: { $nin: [myId] },
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, file, fileName, fileType, isGroup } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !audio && !file) {
      return res.status(400).json({ message: "Text, image, or audio is required." });
    }

    let imageUrl;
    if (file && fileType && fileType.startsWith("image/")) {
      const uploadResponse = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
      });
      imageUrl = uploadResponse.secure_url;
    } else if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let audioUrl;
    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "auto",
      });
      audioUrl = uploadResponse.secure_url;
    }

    let fileUrl;
    if (file && !(fileType && fileType.startsWith("image/"))) {
      const uploadResponse = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
      });
      fileUrl = uploadResponse.secure_url;
    }

    let newMessage;

    if (isGroup) {
      const group = await Group.findOne({ _id: receiverId, members: senderId });
      if (!group) {
        return res.status(403).json({ message: "Not authorized to message this group." });
      }

      newMessage = new Message({
        senderId,
        groupId: receiverId, // receiverId is groupId here
        text,
        image: imageUrl,
        audio: audioUrl,
        fileUrl,
        fileName,
        fileType,
      });

      await newMessage.save();
      // Populate sender for realtime update
      await newMessage.populate("senderId", "fullName profilePic");

      // Emit to group room
      io.to(receiverId).emit("newMessage", newMessage);
    } else {
      // Handle Direct Message
      if (senderId.equals(receiverId)) {
        return res.status(400).json({ message: "Cannot send messages to yourself." });
      }
      const receiverExists = await User.findById(receiverId).select("role");
      if (!receiverExists) {
        return res.status(404).json({ message: "Receiver not found." });
      }
      if (receiverExists.role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Cannot message this account." });
      }

      newMessage = new Message({
        senderId,
        receiverId,
        text,
        image: imageUrl,
        audio: audioUrl,
        fileUrl,
        fileName,
        fileType,
      });

      await newMessage.save();

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markConversationSeen = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;
    const { isGroup } = req.body;

    const now = new Date();
    const expireAt = new Date(now.getTime() + MESSAGE_DELETE_AFTER_SEEN_MS);

    const filter = isGroup
      ? { groupId: id, senderId: { $ne: myId }, seenAt: null }
      : { senderId: id, receiverId: myId, seenAt: null };

    if (isGroup) {
      const isMember = await Group.exists({ _id: id, members: myId });
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to access this group." });
      }
    }

    const messagesToExpire = await Message.find(filter).select("_id");
    const messageIds = messagesToExpire.map((message) => message._id);

    await Message.updateMany({ _id: { $in: messageIds } }, {
      $set: { seenAt: now, expireAt },
    });

    scheduleSeenMessagesDeletion(messageIds);

    res.status(200).json({
      message: "Marked as seen",
      deleteAfterMs: MESSAGE_DELETE_AFTER_SEEN_MS,
      expireAt,
      affectedCount: messageIds.length,
    });
  } catch (error) {
    console.log("Error in markConversationSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;
    const { scope } = req.body; // "me" | "all"

    if (!scope || (scope !== "me" && scope !== "all")) {
      return res.status(400).json({ message: "Invalid delete scope" });
    }

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (scope === "all") {
      if (message.senderId.toString() !== myId.toString()) {
        return res.status(403).json({ message: "Not allowed" });
      }
      await Message.findByIdAndDelete(id);
      return res.status(200).json({ message: "Deleted for all" });
    }

    await Message.findByIdAndUpdate(
      id,
      { $addToSet: { deletedFor: myId } },
      { new: true }
    );

    return res.status(200).json({ message: "Deleted for me" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      groupId: null,
      receiverId: { $ne: null },
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const userFilter =
      req.user.role === "admin"
        ? { _id: { $in: chatPartnerIds } }
        : { _id: { $in: chatPartnerIds }, role: { $ne: "admin" } };

    const chatPartners = await User.find(userFilter).select(
      "-password -otpHash -otpExpiresAt"
    );

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

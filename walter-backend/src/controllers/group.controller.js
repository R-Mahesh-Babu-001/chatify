import Group from "../models/Group.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";

export const createGroup = async (req, res) => {
    try {
        const { name, members, profilePic, description } = req.body;
        const adminId = req.user._id;

        if (!name || !members || members.length === 0) {
            return res.status(400).json({ message: "Name and at least one member are required" });
        }

        let imageUrl = "";
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            imageUrl = uploadResponse.secure_url;
        }

        const requestedMemberIds = members.map(String);
        const validMembers = await User.find({
            _id: { $in: requestedMemberIds },
        }).select("_id");

        if (validMembers.length !== new Set(requestedMemberIds).size) {
            return res.status(400).json({ message: "One or more selected members are invalid" });
        }

        const uniqueMembers = [...new Set([...requestedMemberIds, adminId.toString()])];

        const newGroup = new Group({
            name,
            description,
            admin: adminId,
            members: uniqueMembers,
            profilePic: imageUrl,
        });

        await newGroup.save();

        // Populate members for immediate UI update
        const populatedGroup = await Group.findById(newGroup._id).populate(
            "members",
            "-password -otpHash -otpExpiresAt"
        );

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error("Error in createGroup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyGroups = async (req, res) => {
    try {
        const myId = req.user._id;
        const groups = await Group.find({ members: myId })
            .populate("members", "-password -otpHash -otpExpiresAt")
            .populate("admin", "-password -otpHash -otpExpiresAt")
            .sort({ updatedAt: -1 });

        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getMyGroups:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const myId = req.user._id;

        // Verify user is member of group
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        if (!group.members.includes(myId)) {
            return res.status(403).json({ message: "Not authorized to view messages" });
        }

        const messages = await Message.find({
            groupId,
            isDeleted: { $ne: true },
            deletedFor: { $nin: [myId] },
        })
            .populate("senderId", "fullName profilePic") // Populate sender info
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getGroupMessages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

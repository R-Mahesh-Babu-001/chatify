import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, MicIcon, PlusIcon, SmileIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [fileAttachment, setFileAttachment] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled } = useChatStore();

  const emojiList = ["😀", "😁", "😂", "😍", "😎", "🥳", "😅", "😇", "😡", "😭", "🤯", "👍", "🙏", "🔥", "❤️", "🎉"];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !fileAttachment) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({
      text: text.trim(),
      image: imagePreview,
      file: fileAttachment?.data || null,
      fileName: fileAttachment?.name || null,
      fileType: fileAttachment?.type || null,
    });
    setText("");
    setImagePreview("");
    setFileAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Only images or PDF files are supported");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isImage) {
        setImagePreview(reader.result);
        setFileAttachment({ data: reader.result, name: file.name, type: file.type });
      } else {
        setImagePreview(null);
        setFileAttachment({ data: reader.result, name: file.name, type: file.type });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFileAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiPick = (emoji) => {
    setText((prev) => `${prev}${emoji}`);
    setShowEmoji(false);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          sendMessage({ text: "", image: null, audio: reader.result });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="w-full flex flex-col justify-end items-stretch px-4 py-2 bg-[#0c0c0c] border-t border-[#1a1a1a]">
      {imagePreview && (
        <div className="mb-2 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-[#1f1f1f]"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0c0c0c] flex items-center justify-center text-[#9b9b9b] hover:bg-[#1a1a1a]"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {fileAttachment && !imagePreview && (
        <div className="mb-2 flex items-center">
          <div className="relative flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#131313] px-3 py-2">
            <span className="text-xs text-[#9b9b9b]">{fileAttachment.name}</span>
            <button
              onClick={removeImage}
              className="w-6 h-6 rounded-full bg-[#0c0c0c] flex items-center justify-center text-[#9b9b9b] hover:bg-[#1a1a1a]"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {showEmoji && (
        <div className="mb-2 flex flex-wrap gap-2 bg-[#131313] border border-[#1a1a1a] rounded-lg p-2">
          {emojiList.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiPick(emoji)}
              className="text-lg hover:scale-110 transition-transform"
              aria-label={`emoji ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 bg-[#131313] rounded-2xl px-2 py-1.5 border border-[#1f1f1f]"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center w-9 h-9 rounded-full text-[#9b9b9b] hover:bg-[#1f1f1f] transition-colors"
          title="Attach"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
        <input
          type="file"
          accept="image/*,application/pdf"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className="flex items-center justify-center w-9 h-9 rounded-full text-[#9b9b9b] hover:bg-[#1f1f1f] transition-colors"
          tabIndex={-1}
          title="Emoji"
        >
          <SmileIcon className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          className="flex-1 bg-transparent border-none outline-none py-2 px-2 text-[#f2f2f2] placeholder-[#7a7a7a] text-[15px]"
          placeholder="Type a message"
        />
        {text.trim() || imagePreview || fileAttachment ? (
          <button
            type="submit"
            disabled={!text.trim() && !imagePreview && !fileAttachment}
            className="flex items-center justify-center w-9 h-9 rounded-full text-white bg-[#e50914] hover:bg-[#ff1f2b] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${isRecording ? "bg-red-600 text-white" : "text-[#9b9b9b] hover:bg-[#1f1f1f]"}`}
            tabIndex={-1}
            title={isRecording ? "Stop recording" : "Voice message"}
          >
            <MicIcon className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  );
}
export default MessageInput;

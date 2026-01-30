import { useState } from "react";
import { useSubmitReportMutation } from "../../services/userService";

const ReportForm = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [submitReport, { isLoading, isSuccess, error }] = useSubmitReportMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("message", message);
    if (image) formData.append("image", image);
    await submitReport(formData);
    setTitle("");
    setMessage("");
    setImage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          placeholder="Report title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Describe the issue..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
      </div>
      <button
        type="submit"
        className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send Report"}
      </button>
      {isSuccess && <p className="text-green-600">Report sent successfully!</p>}
      {error && <p className="text-red-600">Failed to send report.</p>}
    </form>
  );
};

export default ReportForm;





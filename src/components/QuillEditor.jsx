import { useEffect } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

export default function QuillEditor({ value, onChange }) {
  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    },
  });

  useEffect(() => {
    if (quill) {
      quill.root.innerHTML = value || "";

      quill.on("text-change", () => {
        onChange(quill.root.innerHTML);
      });
    }
  }, [quill]);

  return <div ref={quillRef} />;
}

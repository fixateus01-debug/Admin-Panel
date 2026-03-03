// import { EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Placeholder from "@tiptap/extension-placeholder";
// import Image from "@tiptap/extension-image";
// import Mathematics from "@tiptap/extension-mathematics";
// import "katex/dist/katex.min.css";

// export default function RichTextEditor({ value, onChange }) {
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Mathematics, // 👈 ADD HERE
//       Image,
//       Placeholder.configure({
//         placeholder: "Type $E=mc^2$ for inline math"
//       })
//     ],
//     content: value,
//     onUpdate: ({ editor }) => {
//       onChange(editor.getHTML());
//     }
//   });

//   return (
//     <div className="border rounded-lg bg-white p-4 shadow-sm min-h-[200px]">
//       <EditorContent editor={editor} />
//     </div>
//   );
// }



import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write instructions here...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-lg bg-white p-3 min-h-[150px]">
      <EditorContent editor={editor} />
    </div>
  );
}

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const EDITOR_STYLE_ID = "tiptap-editor-styles";

const editorStyles = `
  .ProseMirror { outline: none; }
  .ProseMirror p { margin-bottom: 0.75rem; }
  .ProseMirror h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.5rem; font-family: var(--font-display); }
  .ProseMirror h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; font-family: var(--font-display); }
  .ProseMirror h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; font-family: var(--font-display); }
  .ProseMirror ul { padding-left: 1.5rem; margin-bottom: 0.75rem; }
  .ProseMirror li { margin-bottom: 0.25rem; }
  .ProseMirror a { color: var(--crimson); text-decoration: underline; }
  .ProseMirror [style*="text-align: center"] { text-align: center; }
  .ProseMirror [style*="text-align: right"] { text-align: right; }
  .ProseMirror [style*="text-align: justify"] { text-align: justify; }
`;

const btnBase: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  border: "1px solid var(--border-color)",
  borderRadius: "4px",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: "bold",
  lineHeight: 1,
  transition: "background 0.15s",
};

const btnActive: React.CSSProperties = {
  ...btnBase,
  background: "var(--crimson)",
  color: "white",
  borderColor: "var(--crimson)",
};

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  useEffect(() => {
    if (!document.getElementById(EDITOR_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = EDITOR_STYLE_ID;
      style.textContent = editorStyles;
      document.head.appendChild(style);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  const blockType = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "paragraph") editor.chain().focus().setParagraph().run();
    else if (val === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (val === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (val === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
  };

  const handleLink = () => {
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
    else editor.chain().focus().unsetLink().run();
  };

  return (
    <div
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: "6px",
        background: "var(--bg-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.25rem",
          padding: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          borderRadius: "6px 6px 0 0",
        }}
      >
        {/* Block type */}
        <select
          value={blockType}
          onChange={handleBlockChange}
          style={{
            padding: "0.3rem 0.5rem",
            borderRadius: "4px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
          }}
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        {/* Alignment */}
        {(["left", "center", "right", "justify"] as const).map((align) => (
          <button
            key={align}
            type="button"
            onClick={() => editor.chain().focus().setTextAlign(align).run()}
            style={editor.isActive({ textAlign: align }) ? btnActive : btnBase}
            title={`Align ${align}`}
          >
            {align === "left" ? "←" : align === "center" ? "↔" : align === "right" ? "→" : "≡"}
          </button>
        ))}

        <span style={{ width: "1px", background: "var(--border-color)", margin: "0 0.15rem" }} />

        {/* Inline formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={editor.isActive("bold") ? btnActive : btnBase}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={editor.isActive("italic") ? btnActive : btnBase}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={editor.isActive("underline") ? btnActive : btnBase}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={editor.isActive("bulletList") ? btnActive : btnBase}
          title="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          onClick={handleLink}
          style={editor.isActive("link") ? btnActive : btnBase}
          title="Link"
        >
          🔗
        </button>
      </div>

      {/* Editor area */}
      <div style={{ padding: "1rem", minHeight: "250px", color: "var(--text-primary)" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

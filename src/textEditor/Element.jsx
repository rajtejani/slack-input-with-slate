import { css } from "@emotion/css";
import { Transforms } from "slate";
import { ReactEditor, useSelected, useSlateStatic } from "slate-react";
import { CodeBlockType, CodeLineType } from "./Buttons";
import { useMemo } from "react";
import { ImageElement } from "./SlateImage";

const allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:'];

const Element = ({ attributes, children, element }) => {
    const style = { textAlign: element.align };
    const selected = useSelected();

    const safeUrl = useMemo(() => {
        let parsedUrl = null;
        try {
            parsedUrl = new URL(element.url);
            // eslint-disable-next-line no-empty
        } catch { }
        if (parsedUrl && allowedSchemes.includes(parsedUrl.protocol)) {
            return parsedUrl.href;
        }
        return 'about:blank';
    }, [element.url]);

    // console.log(' #!@!@#!#!@#!#!@# ', element);
    switch (element.type) {
        case 'block-quote':
            return (
                <blockquote style={css(style,
                    `
          border-left: 2px solid #ddd;
          margin-left: 0;
          margin-right: 0;
          padding-left: 10px;
          color: #aaa;
          font-style: italic;
    `)
                } {...attributes}>
                    {children}
                </blockquote>
            );
        case 'bulleted-list':
            return (
                <ul style={style} {...attributes}>
                    {children}
                </ul>
            );
        case 'heading-one':
            return (
                <h1 style={style} {...attributes}>
                    {children}
                </h1>
            );
        case 'heading-two':
            return (
                <h2 style={style} {...attributes}>
                    {children}
                </h2>
            );
        case 'list-item':
            return (
                <li style={style} {...attributes}>
                    {children}
                </li>
            );
        case 'numbered-list':
            return (
                <ol style={style} {...attributes}>
                    {children}
                </ol>
            );
        case CodeBlockType:
        case CodeLineType:
            // case element.type === "code-line":
            return <CodeBlockElementWrapper attributes={attributes} children={children} element={element} />;
        case "image":
            return <ImageElement attributes={attributes} children={children} element={element} />;
        case 'link':
            return <a
                {...attributes}
                href={safeUrl}
                // className={
                //   selected
                //     ? css`
                //       // box-shadow: 0 0 0 3px #ddd;
                //       color : cornflowerblue;
                //     `
                //     : ''
                // }
                className={css`
              // box-shadow: 0 0 0 3px #ddd;
              color : cornflowerblue;
            `}
            >
                <InlineChromiumBugfix />
                {children}
                <InlineChromiumBugfix />
            </a>;
        default:
            return (
                <p style={style} {...attributes}>
                    {children}
                </p>
            );
    }
};


export default Element;


const CodeBlockElementWrapper = (props) => {
    const { attributes, children, element } = props;
    const editor = useSlateStatic();

    if (element.type === CodeBlockType) {
        const setLanguage = (language) => {
            const path = ReactEditor.findPath(editor, element);
            Transforms.setNodes(editor, { language }, { at: path });
        };

        return (
            <div
                className={css(`
        font-family: monospace;
        font-size: 16px;
        line-height: 20px;
        margin-top: 0;
        background: rgba(0, 20, 60, .03);
        padding: 5px 13px;
      `)}
                style={{ position: 'relative' }}
                spellCheck={false}
            >
                <LanguageSelect
                    value={element.language}
                    onChange={e => setLanguage(e.target.value)}
                />
                {children}
            </div>
        );
    }

    if (element.type === CodeLineType) {
        return (
            <div {...attributes} style={{ position: 'relative' }}>
                {children}
            </div>
        );
    }

    const Tag = editor.isInline(element) ? 'span' : 'div';
    return (
        <Tag {...attributes} style={{ position: 'relative' }}>
            {children}
        </Tag>
    );
};


const LanguageSelect = (props) => {
    return (
        <select
            data-test-id="language-select"
            contentEditable={false}
            className={css`
        position: absolute;
        right: 5px;
        top: 5px;
        z-index: 1;
      `}
            {...props}
        >
            <option value="css">CSS</option>
            <option value="html">HTML</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
            <option value="jsx">JSX</option>
            <option value="markdown">Markdown</option>
            <option value="php">PHP</option>
            <option value="python">Python</option>
            <option value="sql">SQL</option>
            <option value="tsx">TSX</option>
            <option value="typescript">TypeScript</option>
        </select>
    );
};

const InlineChromiumBugfix = () => (
    <span
        contentEditable={false}
        className={css`
      font-size: 0;
    `}
    >
        {String.fromCodePoint(160) /* Non-breaking space */}
    </span>
);
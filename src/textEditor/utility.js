import escapeHtml from 'escape-html';
import isHotkey, { isKeyHotkey } from "is-hotkey";
import isUrl from 'is-url';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
import { useCallback } from "react";
import { Editor, Node, Path, Point, Range, Element as SlateElement, Transforms } from "slate";
// import { jsx } from 'slate-hyperscript';
import { useSlate } from "slate-react";
import { CodeBlockType, CodeLineType } from "./Buttons";

export const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const newlineRe = /\r\n|\r|\n/;

export const SHORTCUTS = {
    '*': 'bold',
    '`': 'code',
    '_': 'italic',
};

export const HOTKEYS = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+shift+x': 'strike',
};

export const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

export const extractTextFromSlateValue = (nodes) => {
    return nodes
        .map((node) => {
            if (node.type === "image") {
                return `<img src=>"${node.url}" />`;
            } else if (node.children) {
                return extractTextFromSlateValue(node.children);
            } else {
                return node.text;
            }
        })
        .join("");
};

export const handleShiftEnter = (editor, nativeEvent) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
        const [node, path] = Editor.parent(editor, selection.anchor.path);

        if (SlateElement.isElement(node)) {
            if (node.type === "code-block") {
                console.log(" Inside Code element");
                Editor.insertText(editor, "\n");
            } else if (LIST_TYPES.includes(node.type)) {
                console.log(" Inside List element");
                Transforms.splitNodes(editor);
            } else if (node.children[0].code) {
                // Transforms.insertText(editor, "\n");
                Transforms.insertNodes(editor, {
                    type: CodeLineType,
                    children: [{ text: "", code: true }],
                });
                console.log(" Inside Code");
            } else if (node.type === "link") {

                if (isKeyHotkey('right', nativeEvent)) {
                    Transforms.move(editor, { unit: 'offset', reverse: false });
                    return;
                }
                if (isKeyHotkey('left', nativeEvent)) {
                    Transforms.move(editor, { unit: 'offset' });
                    return;
                }
                // If inside a link, move out of the link and insert a new paragraph
                // Transforms.unwrapNodes(editor, { match: n => n.type === 'link' });
                Transforms.insertNodes(editor, {
                    type: 'paragraph',
                    children: [{ text: "" }],
                });
                Transforms.select(editor, Editor.end(editor, []));
            }
            else {
                console.log("in else block");
                // Transforms.insertText(editor, "\n");
                Transforms.insertNodes(editor, {
                    type: node.type,
                    children: [{ text: "" }],
                });
            }
        }
    }
};

export const handleBackspace = (editor) => {
    const { selection } = editor;

    console.log(editor);

    if (selection && Range.isCollapsed(selection)) {
        const [node, path] = Editor.parent(editor, selection);

        console.log(SlateElement.isElement(node), node.type, "if blocks ");
        // Check if the node is a list-item and if the cursor is at the start of it
        if (SlateElement.isElement(node) && (node.type === "list-item" || node.type === "code-line")) {
            const start = Editor.start(editor, path);
            if (Point.equals(selection.anchor, start)) {

                const [parentNode, parentPath] = Editor.parent(editor, path);
                const nextPath = Path.next(parentPath);

                if (
                    SlateElement.isElement(parentNode) &&
                    (LIST_TYPES.includes(parentNode.type) || parentNode.type === "code-block" || parentNode.type === "code-line")
                ) {
                    // Unwrap the list-item from the list block
                    Transforms.unwrapNodes(editor, {
                        match: (n) =>
                            SlateElement.isElement(n) && (LIST_TYPES.includes(n.type) || n.type === CodeBlockType || n.type === CodeLineType),
                        split: true,
                    });
                    console.log(Transforms, "list");
                    // Set the unwrapped node to a paragraph type
                    Transforms.setNodes(editor, { type: "paragraph" });

                    // If the list was empty, remove the list container
                    if (parentNode.children.length === 1) {
                        Transforms.setNodes(editor, {
                            at: nextPath,
                            type: "paragraph", children: [{
                                text: '',
                            }]
                        });

                    }
                    // return;
                }
            }
        }
        else {
            const start = Editor.start(editor, path);
            if (Point.equals(selection.anchor, start)) {
                const [node, path] = Editor.parent(editor, selection);
                const [parentNode, parentPath] = Editor.parent(editor, path);

                const nextPath = Path.next(path);
                if (parentNode.children.length === 1) {
                    Transforms.insertNodes(editor, {
                        at: nextPath,
                        type: "paragraph", children: [{
                            text: '',
                        }]
                    });

                }
            }
        }
    };
};

export const deactivateCodeBlock = (editor, format) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
        const [node, path] = Editor.parent(editor, selection);
        console.log(node.type, "node type");
        if (
            SlateElement.isElement(node) &&
            (node.type === "code-line" || LIST_TYPES.includes(node.type) || node.type === "list-item")
        ) {
            const end = Editor.end(editor, path);
            // Check if we're at the end of the current block
            if (Editor.isEnd(editor, selection.anchor, end)) {
                // event.preventDefault();
                const nextPath = Path.next(path);

                if (Editor.hasPath(editor, nextPath)) {
                    // If there's a next block, move to its start
                    Transforms.select(editor, Editor.start(editor, nextPath));
                } else {
                    // If there's no next block, insert a new paragraph
                    insertNewParagraphList(path, editor, format, node.type);
                }
            }
        }
    }

    function insertNewParagraphList(path, editor, format, listType) {
        const parentPath = Path.parent(path);
        const nextPath = Path.next(parentPath);
        const isList = LIST_TYPES.includes(format);
        const isActive = isBlockActive(editor, format);

        Transforms?.unwrapNodes(editor, {
            match: n => SlateElement.isElement(n) && n.type === 'code-block',
            split: true,
        });

        // Transforms.insertNodes(editor, {
        //   type: 'paragraph',
        //   children: [{ text: '' }],
        // }, { at: parentPath });

        const newProperties = {
            type: isActive ? "paragraph" : isList ? "list-item" : format,
        };

        // const newProperties = {
        //   type: isActive ? "paragraph" : isList ? "list-item" : format,
        // };

        Transforms.setNodes(editor, newProperties);

        if (!isActive && isList) {
            const listItem = { type: format, children: [] };
            Transforms.wrapNodes(editor, listItem);
        }
        // Transforms.select(editor, Editor.start(editor, nextPath));
    }
};

export const useDecorate = (editor) => {
    return useCallback(
        ([node, path]) => {
            if (SlateElement.isElement(node) && node.type === CodeLineType) {
                const ranges = editor?.nodeToDecorations?.get(node) || [];
                return ranges;
            }

            return [];
        },
        [editor.nodeToDecorations]
    );
};

export const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

export const isBlockActive = (editor, format, blockType = 'type') => {
    const { selection } = editor
    if (!selection) return false
    const [match] = Array.from(
        Editor.nodes(editor, {
            at: Editor.unhangRange(editor, selection),
            match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n[blockType] === format,
        })
    )
    return !!match
};

export const isLinkActive = editor => {
    const [link] = Editor.nodes(editor, {
        match: n =>
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
    });
    return !!link;
};

export const toggleBlock = (editor, format, type) => {
    const isActive = isBlockActive(
        editor,
        format
    );
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
        match: n =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            LIST_TYPES.includes(n.type),
        split: true,
    });
    let newProperties;

    newProperties = {
        type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };

    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
        const block = { type: format, children: [] };
        Transforms.wrapNodes(editor, block);
    }
};

export const insertLink = (editor, url, content) => {
    if (editor.selection) {
        wrapLink(editor, url, content);
    }
};

export const wrapLink = (editor, url, content) => {
    if (isLinkActive(editor)) {
        unwrapLink(editor);
    }

    const { selection } = editor;
    console.log(selection, "selection");
    const isCollapsed = selection && Range.isCollapsed(selection);
    const link = {
        type: 'link',
        url,
        children: isCollapsed ? [{ text: content }] : [],
    };

    if (isCollapsed) {
        Transforms.insertNodes(editor, link);
        // Transforms.wrapNodes(editor, link);
    } else {
        Transforms.wrapNodes(editor, link, { split: true });
        Transforms.collapse(editor, { edge: 'end' });
    }
};

export const unwrapLink = editor => {
    Transforms.unwrapNodes(editor, {
        match: n =>
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
    });
};

export const mergeMaps = (...maps) => {
    const map = new Map();

    for (const m of maps) {
        for (const item of m) {
            map.set(...item);
        }
    }

    return map;
};

export const getChildNodeToDecorations = ([
    block,
    blockPath,
]) => {
    const nodeToDecorations = new Map();

    const text = block.children.map(line => Node.string(line)).join('\n');
    const language = block.language;
    const tokens = Prism.tokenize(text, Prism.languages[language]);
    const normalizedTokens = normalizeTokens(tokens); // make tokens flat and grouped by line
    const blockChildren = block.children;

    for (let index = 0; index < normalizedTokens.length; index++) {
        const tokens = normalizedTokens[index];
        const element = blockChildren[index];

        if (!nodeToDecorations.has(element)) {
            nodeToDecorations.set(element, []);
        }

        let start = 0;
        for (const token of tokens) {
            const length = token.content.length;
            if (!length) {
                continue;
            }

            const end = start + length;

            const path = [...blockPath, index, 0];
            const range = {
                anchor: { path, offset: start },
                focus: { path, offset: end },
                token: true,
                ...Object.fromEntries(token.types.map(type => [type, true])),
            };

            nodeToDecorations.get(element)?.push(range);

            start = end;
        }
    }

    return nodeToDecorations;
};

// precalculate editor.nodeToDecorations map to use it inside decorate function then
export const SetNodeToDecorations = () => {
    const editor = useSlate();

    const blockEntries = Array.from(
        Editor.nodes(editor, {
            at: [],
            mode: 'highest',
            match: n => SlateElement.isElement(n) && n.type === CodeBlockType,
        })
    );

    const nodeToDecorations = mergeMaps(
        ...blockEntries.map(getChildNodeToDecorations)
    );

    editor.nodeToDecorations = nodeToDecorations;

    return null;
};

export const useOnKeydown = (editor) => {
    const onKeyDown = useCallback(
        e => {
            if (isHotkey('tab', e)) {
                // handle tab key, insert spaces
                e.preventDefault();

                Editor.insertText(editor, '  ');
            }
        },
        [editor]
    );

    return onKeyDown;
};

export const toChildren = (content) => [{ text: content }];
export const toCodeLines = (content) =>
    content
        .split('\n')
        .map(line => ({ type: CodeLineType, children: toChildren(line) }));


// export const withInlineCode = (editor) => {
//   const { insertText } = editor;

//   editor.insertText = (text) => {
//     if (text === "`" && editor.selection && Editor.isCollapsed(editor)) {
//       const [start] = Editor.edges(editor, editor.selection);
//       const range = { anchor: start, focus: start };
//       const beforeRange = Editor.before(editor, start, { unit: "character" });
//       const beforeText = beforeRange && Editor.string(editor, beforeRange);

//       if (beforeText === "`") {
//         Editor.deleteBackward(editor, { unit: "character" });
//         Editor.deleteBackward(editor, { unit: "character" });
//         toggleMark(editor, "code");
//         return;
//       }
//     }

//     insertText(text);
//   };

//   return editor;
// };

export const withInlines = editor => {
    const { insertData, insertText, isInline, isElementReadOnly, isSelectable } =
        editor;

    editor.isInline = element =>
        ['link', 'button', 'badge'].includes(element.type) || isInline(element);

    editor.isElementReadOnly = element =>
        element.type === 'badge' || isElementReadOnly(element);

    editor.isSelectable = element =>
        element.type !== 'badge' && isSelectable(element);

    editor.insertText = text => {
        if (text && isUrl(text)) {
            wrapLink(editor, text, text);
        } else {

            if (text === "`" && editor.selection && Editor.isCollapsed(editor)) {
                const [start] = Editor.edges(editor, editor.selection);
                const range = { anchor: start, focus: start };
                const beforeRange = Editor.before(editor, start, { unit: "character" });
                const beforeText = beforeRange && Editor.string(editor, beforeRange);

                if (beforeText === "`") {
                    Editor.deleteBackward(editor, { unit: "character" });
                    Editor.deleteBackward(editor, { unit: "character" });
                    toggleMark(editor, "code");
                    return;
                }
            }

            insertText(text);
        }
    };

    editor.insertData = data => {
        const text = data.getData('text/plain');

        if (text && isUrl(text)) {
            wrapLink(editor, text, text);
        } else {
            insertData(data);
        }
    };

    return editor;
};

export const prismThemeCss = `
/**
 * prism.js default theme for JavaScript, CSS and HTML
 * Based on dabblet (http://dabblet.com)
 * @author Lea Verou
 */

code[class*="language-"],
pre[class*="language-"] {
    color: black;
    background: none;
    text-shadow: 0 1px white;
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    font-size: 1em;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    line-height: 1.5;

    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;

    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
}

pre[class*="language-"]::-moz-selection, pre[class*="language-"] ::-moz-selection,
code[class*="language-"]::-moz-selection, code[class*="language-"] ::-moz-selection {
    text-shadow: none;
    background: #b3d4fc;
}

pre[class*="language-"]::selection, pre[class*="language-"] ::selection,
code[class*="language-"]::selection, code[class*="language-"] ::selection {
    text-shadow: none;
    background: #b3d4fc;
}

@media print {
    code[class*="language-"],
    pre[class*="language-"] {
        text-shadow: none;
    }
}

/* Code blocks */
pre[class*="language-"] {
    padding: 1em;
    margin: .5em 0;
    overflow: auto;
}

:not(pre) > code[class*="language-"],
pre[class*="language-"] {
    background: #f5f2f0;
}

/* Inline code */
:not(pre) > code[class*="language-"] {
    padding: .1em;
    border-radius: .3em;
    white-space: normal;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
    color: slategray;
}

.token.punctuation {
    color: #999;
}

.token.namespace {
    opacity: .7;
}

.token.property,
.token.tag,
.token.boolean,
.token.number,
.token.constant,
.token.symbol,
.token.deleted {
    color: #905;
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
    color: #690;
}

.token.operator,
.token.entity,
.token.url,
.language-css .token.string,
.style .token.string {
    color: #9a6e3a;
    /* This background color was intended by the author of this theme. */
    background: hsla(0, 0%, 100%, .5);
}

.token.atrule,
.token.attr-value,
.token.keyword {
    color: #07a;
}

.token.function,
.token.class-name {
    color: #DD4A68;
}

.token.regex,
.token.important,
.token.variable {
    color: #e90;
}

.token.important,
.token.bold {
    font-weight: bold;
}
.token.italic {
    font-style: italic;
}

.token.entity {
    cursor: help;
}
`;

export const serialize = (nodes) => {
    return nodes.map(node => {
        if (typeof node.text !== 'undefined') {
            let text = escapeHtml(node.text);
            if (node.bold) {
                text = `<strong>${text}</strong>`;
            }
            if (node.italic) {
                text = `<em>${text}</em>`;
            }
            if (node.code) {
                text = `<code>${text}</code>`;
            }
            if (node.strike) {
                text = `<del>${text}</del>`;
            }
            return text;
        }

        const children = node.children.map(n => serialize([n])).join('\n');

        switch (node.type) {
            case 'paragraph':
                return `<p style="text-align: ${node.align || 'left'}">${children}</p>`;
            case 'heading-one':
                return `<h1 style="text-align: ${node.align || 'left'}">${children}</h1>`;
            case 'heading-two':
                return `<h2 style="text-align: ${node.align || 'left'}">${children}</h2>`;
            case 'block-quote':
                return `<blockquote style="border-left: 2px solid #ddd; margin-left: 0; margin-right: 0; padding-left: 10px; color: #aaa; font-style: italic; text-align: ${node.align || 'left'}">${children}</blockquote>`;
            case 'numbered-list':
                return `<ol style="text-align: ${node.align || 'left'}">${children}</ol>`;
            case 'bulleted-list':
                return `<ul style="text-align: ${node.align || 'left'}">${children}</ul>`;
            case 'list-item':
                return `<li style="text-align: ${node.align || 'left'}">${children}</li>`;
            case 'link':
                return `<a href="${escapeHtml(node.url)}">${children}</a>`;
            case 'code-block':
                return `<pre><code class="language-${node.language || ''}">${children}</code></pre>`;
            case 'code-line':
                return children + '\n';
            default:
                return children;
        }
    }).join('\n');
};

export const deserializeHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // return deserializeElement(doc.body);
};

// const deserializeElement = (el) => {
//     if (el.nodeType === 3) {
//         return el.textContent;
//     } else if (el.nodeType !== 1) {
//         return null;
//     }

//     const children = Array.from(el.childNodes).map(deserializeElement).flat();

//     switch (el.nodeName.toLowerCase()) {
//         case 'body':
//             return jsx('fragment', {}, children);
//         case 'br':
//             return '\n';
//         case 'blockquote':
//             return jsx('element', { type: 'block-quote' }, children);
//         case 'p':
//             return jsx('element', { type: 'paragraph' }, children);
//         case 'h1':
//             return jsx('element', { type: 'heading-one' }, children);
//         case 'h2':
//             return jsx('element', { type: 'heading-two' }, children);
//         case 'ul':
//             return jsx('element', { type: 'bulleted-list' }, children);
//         case 'ol':
//             return jsx('element', { type: 'numbered-list' }, children);
//         case 'li':
//             return jsx('element', { type: 'list-item' }, children);
//         case 'a':
//             return jsx(
//                 'element',
//                 { type: 'link', url: el.getAttribute('href') },
//                 children
//             );
//         case 'pre':
//             return jsx(
//                 'element',
//                 { type: 'code-block', language: el.getAttribute('class')?.replace('language-', '') || '' },
//                 children.map(child => jsx('element', { type: 'code-line' }, [child]))
//             );
//         default:
//             return children;
//     }
// };

const deserializeLeaf = (el) => {
    let text = { text: el.textContent };

    if (el.nodeName.toLowerCase() === 'strong') text.bold = true;
    if (el.nodeName.toLowerCase() === 'em') text.italic = true;
    if (el.nodeName.toLowerCase() === 'code') text.code = true;
    if (el.nodeName.toLowerCase() === 'del') text.strike = true;

    return text;
};

// Empty lines need to contain a single empty token, denoted with { empty: true }
const normalizeEmptyLines = (line) => {
    if (line.length === 0) {
        line.push({
            types: ['plain'],
            content: '\n',
            empty: true,
        });
    } else if (line.length === 1 && line[0].content === '') {
        line[0].content = '\n';
        line[0].empty = true;
    }
};

const appendTypes = (types, add) => {
    const typesSize = types.length;
    if (typesSize > 0 && types[typesSize - 1] === add) {
        return types;
    }

    return types.concat(add);
};

export const normalizeTokens = (
    tokens
) => {
    const typeArrStack = [[]];
    const tokenArrStack = [tokens];
    const tokenArrIndexStack = [0];
    const tokenArrSizeStack = [tokens.length];

    let i = 0;
    let stackIndex = 0;
    let currentLine = [];

    const acc = [currentLine];

    while (stackIndex > -1) {
        while (
            (i = tokenArrIndexStack[stackIndex]++) < tokenArrSizeStack[stackIndex]
        ) {
            let content;
            let types = typeArrStack[stackIndex];

            const tokenArr = tokenArrStack[stackIndex];
            const token = tokenArr[i];

            // Determine content and append type to types if necessary
            if (typeof token === 'string') {
                types = stackIndex > 0 ? types : ['plain'];
                content = token;
            } else {
                types = appendTypes(types, token.type);
                if (token.alias) {
                    types = appendTypes(types, token.alias);
                }

                content = token.content;
            }

            // If token.content is an array, increase the stack depth and repeat this while-loop
            if (typeof content !== 'string') {
                stackIndex++;
                typeArrStack.push(types);
                tokenArrStack.push(content);
                tokenArrIndexStack.push(0);
                tokenArrSizeStack.push(content.length);
                continue;
            }

            // Split by newlines
            const splitByNewlines = content.split(newlineRe);
            const newlineCount = splitByNewlines.length;

            currentLine.push({ types, content: splitByNewlines[0] });

            // Create a new line for each string on a new line
            for (let i = 1; i < newlineCount; i++) {
                normalizeEmptyLines(currentLine);
                acc.push((currentLine = []));
                currentLine.push({ types, content: splitByNewlines[i] });
            }
        }

        // Decreate the stack depth
        stackIndex--;
        typeArrStack.pop();
        tokenArrStack.pop();
        tokenArrIndexStack.pop();
        tokenArrSizeStack.pop();
    }

    normalizeEmptyLines(currentLine);
    return acc;
};
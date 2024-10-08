import React, { useCallback, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Editable, withReact, ReactEditor, Slate } from 'slate-react'
import {
    Editor,
    Transforms,
    createEditor,
    Element as SlateElement,
    Node as SlateNode,
    Path,
    Range
} from 'slate'
import { withHistory } from 'slate-history'
import { Toolbar } from '../components'
import {
    IconBold,
    IconBrackets,
    IconCode,
    IconItalic,
    IconList,
    IconListNumbers,
    IconPhotoPlus,
    IconStrikethrough,
} from "@tabler/icons-react";
import { AddLinkButton, BlockButton, CodeBlockButton, MarkButton, RemoveLinkButton } from './Buttons'
import { HOTKEYS, LIST_TYPES, SHORTCUTS, SetNodeToDecorations, handleBackspace, handleShiftEnter, prismThemeCss, toggleMark, useDecorate, withInlines } from './utility'
import Element from './Element'
import Leaf from './Leaf'
import { Box, ButtonGroup } from '@chakra-ui/react'
import { InsertImageButton } from './SlateImage'

const RichTextExample = () => {
    const initialValue = [
        {
            type: 'paragraph',
            children: [{
                text: '',
            }]
        }
    ];

    const renderElement = useCallback(props => <Element {...props} />, [])
    const renderLeaf = useCallback(props => <Leaf {...props} />, [])
    const [editor] = useState(() => withInlines(withHistory(withReact(createEditor()))));
    const [value, setValue] = useState(initialValue);

    const decorate = useDecorate(editor);

    const handleDOMBeforeInput = useCallback(
        (e) => {
            queueMicrotask(() => {
                const pendingDiffs = ReactEditor.androidPendingDiffs(editor);

                const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
                    if (!diff.text.endsWith(' ')) {
                        return false;
                    }

                    const { text } = SlateNode.leaf(editor, path);
                    const beforeText = text.slice(0, diff.start) + diff.text.slice(0, -1);
                    if (!(beforeText in SHORTCUTS)) {
                        return;
                    }

                    const blockEntry = Editor.above(editor, {
                        at: path,
                        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
                    });
                    if (!blockEntry) {
                        return false;
                    }

                    const [, blockPath] = blockEntry;
                    return Editor.isStart(editor, Editor.start(editor, path), blockPath);
                });

                if (scheduleFlush) {
                    ReactEditor.androidScheduleFlush(editor);
                }
            });
        },
        [editor]
    );

    const onKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const { nativeEvent } = event;
            if (event.shiftKey) {
                handleShiftEnter(editor, nativeEvent);
            } else {
                console.log("message sent to editor");
                // handleSubmit(event);
            }
        } else if (event.key === "ArrowDown") {
            // deactivateCodeBlock(editor);
            const { selection } = editor;
            if (selection && Range.isCollapsed(selection)) {
                const [node, path] = Editor.parent(editor, selection);
                if (
                    SlateElement.isElement(node) &&
                    (node.type === "code-line" || LIST_TYPES.includes(node.type))
                ) {
                    const end = Editor.end(editor, path);
                    // Check if we're at the end of the current block
                    if (Editor.isEnd(editor, selection.anchor, end)) {
                        event.preventDefault();
                        const nextPath = Path.next(path);

                        if (Editor.hasPath(editor, nextPath)) {
                            // If there's a next block, move to its start
                            Transforms.select(editor, Editor.start(editor, nextPath));
                        } else {
                            // If there's no next block, insert a new paragraph
                            insertNewParagraph(path);
                        }
                    }
                }
            }
        }
        else if (event.key === "Backspace") {
            handleBackspace(editor);
        }

        function insertNewParagraph(path) {
            const parentPath = Path.parent(path);
            const nextPath = Path.next(parentPath);

            Transforms.insertNodes(
                editor,
                { type: "paragraph", children: [{ text: "" }] },
                { at: nextPath }
            );
            Transforms.select(editor, Editor.start(editor, nextPath));
        }

        for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey];
                toggleMark(editor, mark);
            }
        }
    };

    const onChange = useCallback(
        (newValue) => {
            setValue(newValue);
        },
        [editor]
    );
    console.log(value);
    return (
        <Box className="slate-editor">
            <Slate editor={editor} initialValue={initialValue} onChange={onChange} className="slate-editor">
                <Toolbar className="tool-slate">
                    <MarkButton type={value?.[value?.length - 1]?.type} format="bold" icon={<IconBold />} />
                    <MarkButton type={value?.[value?.length - 1]?.type} format="italic" icon={<IconItalic />} />
                    <MarkButton type={value?.[value?.length - 1]?.type} format="strike" icon={<IconStrikethrough />} />
                    <MarkButton type={value?.[value?.length - 1]?.type} format="code" icon={<IconCode />} />
                    <AddLinkButton type={value?.[value?.length - 1]?.type} />
                    <RemoveLinkButton type={value?.[value?.length - 1]?.type} />
                    <CodeBlockButton type={value?.[value?.length - 1]?.type} format="code-block" icon={<IconBrackets />} />
                    <BlockButton type={value?.[value?.length - 1]?.type} format="numbered-list" icon={<IconListNumbers />} />
                    <BlockButton type={value?.[value?.length - 1]?.type} format="bulleted-list" icon={<IconList />} />
                    <ButtonGroup size="sm" isAttached variant="outline" mr={1}>
                        <InsertImageButton icon={IconPhotoPlus} />
                    </ButtonGroup>
                </Toolbar>
                <SetNodeToDecorations />
                <Editable
                    decorate={decorate}
                    style={{ border: `1px solid black`, padding: 5 }}
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    onDOMBeforeInput={handleDOMBeforeInput}
                    placeholder="Enter some rich text…"
                    spellCheck
                    autoFocus
                    onKeyDown={onKeyDown}
                />
                <style>{prismThemeCss}</style>
            </Slate>
        </Box>
    )
}

export default RichTextExample
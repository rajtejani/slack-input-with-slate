import { Box, Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import { IconLink, IconLinkOff, IconSourceCode } from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { Editor, Element as SlateElement, Transforms } from "slate";
import { useSlate, useSlateStatic } from "slate-react";
import { LIST_TYPES, deactivateCodeBlock, insertLink, isBlockActive, isLinkActive, isMarkActive, toggleBlock, toggleMark, unwrapLink } from "./utility";
import { Icon } from "../components";
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-java'

export const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

const ParagraphType = 'paragraph';
export const CodeBlockType = 'code-block';
export const CodeLineType = 'code-line';


export const BlockButton = ({ type, format, icon }) => {
    const editor = useSlate()
    const deActiveCodeblock = () => {
        if (type === 'code-block' || type === 'code-line') {
            deactivateCodeBlock(editor, format);
        } else {
            toggleBlock(editor, format, type);
        }
    };
    return (
        <Button
            {...isBlockActive(
                editor,
                format
            ) ? {
                bg: 'gray.100'
            } : {
                bg: 'gray.300'
            }}
            size={'sm'}
            border={'1px solid'}
            borderColor={'gray.200'}
            p={1}

            active={isBlockActive(
                editor,
                format,
                TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
            )}
            onMouseDown={event => {
                event.preventDefault();
                deActiveCodeblock();
            }}
        >
            <Icon size={16} stroke={2}>{icon}</Icon>
        </Button>
    )
}

// export const MarkButton = ({ format, icon: Icon }) => {
//     const editor = useSlate();
//     return (
//         <Button
//             p={1}
//             aria-label={format}
//             size={'sm'}
//             variant={"unstyled"}
//             border={'1px solid'}
//             borderColor={'gray.200'}
//             {...isMarkActive(
//                 editor,
//                 format
//             ) ? {
//                 backgroundColor: "gray.100"
//             } : {}}
//             onMouseDown={(event) => {
//                 event.preventDefault();
//                 toggleMark(editor, format);
//             }}
//         >
//             <Box
//                 display={"flex"}
//                 justifyContent={'center'}
//                 alignItems={'center'}>
//                 <Icon size={18} stroke={2} />
//             </Box>
//         </Button>
//     );
// };

export const MarkButton = ({ type, format, icon }) => {
    const editor = useSlate()
    return (
        <Button
            isDisabled={type === "code-block"}
            size={'sm'}
            border={'1px solid'}
            borderColor={'gray.200'}
            p={1}
            {...isMarkActive(editor, format) ? { bg: 'gray.100' } : { bg: 'gray.300' }}
            active={isMarkActive(editor, format)}
            onMouseDown={event => {
                event.preventDefault()
                toggleMark(editor, format)
            }}
        >
            <Icon size={16} >{icon}</Icon>
        </Button>
    )
}

export const AddLinkButton = ({ type }) => {
    const editor = useSlate();
    const [url, setUrl] = useState('');
    const [content, setContent] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure({

    });

    const handleClick = useCallback((e) => {
        e.preventDefault();
        if (!url) return;
        insertLink(editor, url, content);
        handleOnCanel();
    }, [url]);

    const handleOnCanel = () => {
        onClose();
        setContent("");
        setUrl("");
    };

    const handleValueChange = ({ target: { value } }) => setUrl(value);
    const handleValueChangeContent = ({ target: { value } }) => setContent(value);

    return (
        <>
            <Button
                isDisabled={type === "code-block"}
                size={'sm'}
                border={'1px solid'}
                borderColor={'gray.200'}
                p={1}
                isOpen={isOpen}
                onClose={onClose}
                {...isLinkActive(editor) ? {
                    bg: "gray.100"
                } : { bg: 'gray.300' }}
                onMouseDown={(event) => {
                    event.preventDefault();
                    onOpen();
                    // const url = window.prompt("Enter the URL of the link:");
                    // if (!url) return;
                    // insertLink(editor, url);
                }}
            >
                <Box
                    display={"flex"}
                    justifyContent={'center'}
                    alignItems={'center'}>
                    <IconLink size={18} stroke={2} />
                </Box>
            </Button>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
            >
                <form>
                    <ModalOverlay />
                    <ModalContent backgroundColor={"white"}>
                        <ModalHeader>Add link</ModalHeader>
                        <ModalCloseButton border="1px solid #868B944D" />
                        <ModalBody pb={6}>
                            <FormControl>
                                <FormLabel>Enter the Content:</FormLabel>
                                <Input placeholder='Content' value={content} onChange={handleValueChangeContent} autoFocus />
                                <FormLabel>Enter the URL of the link:</FormLabel>
                                <Input placeholder='URL' value={url} onChange={handleValueChange} />
                            </FormControl>
                        </ModalBody>

                        <ModalFooter>
                            <Button colorScheme='blue' mr={3} onClick={handleClick}>
                                Save
                            </Button>
                            <Button onClick={handleOnCanel}>Cancel</Button>
                        </ModalFooter>
                    </ModalContent>
                </form>
            </Modal>
        </>
    );
};

export const RemoveLinkButton = ({ type }) => {
    const editor = useSlate();

    return (
        <Button
            isDisabled={type === "code-block"}
            size={'sm'}
            // variant={"unstyled"}
            border={'1px solid'}
            borderColor={'gray.200'}
            p={1}
            {...isLinkActive(editor) ? {
                bg: "gray.100"
            } : { bg: 'gray.300' }}
            onMouseDown={event => {
                if (isLinkActive(editor)) {
                    unwrapLink(editor);
                }
            }}
        >
            <IconLinkOff size={18} stroke={2} />
        </Button>
    );
};

export const CodeBlockButton = ({ format, type }) => {
    const editor = useSlateStatic();
    const isActive = isBlockActive(editor, format);

    const isList = LIST_TYPES.includes(type);

    const handleClick = (e) => {
        e.preventDefault();

        if (isList || type === "list-item") {
            Transforms.unwrapNodes(editor, {
                match: (n) =>
                    LIST_TYPES.includes(
                        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type
                    ),
                split: true,
            });

            Transforms.wrapNodes(
                editor,
                { type: CodeBlockType, language: 'html', children: [] },
                {
                    match: n => SlateElement.isElement(n),
                    split: true,
                }
            );

            Transforms.setNodes(
                editor,
                { type: CodeLineType },
                { match: n => SlateElement.isElement(n) }
            );

            if (isActive && isList) {
                const block = { type: type, children: [] };
                Transforms.wrapNodes(editor, block);
            }
        } else if (isActive) {
            deactivateCodeBlock(editor, format);
        } else {
            Transforms.wrapNodes(
                editor,
                { type: CodeBlockType, language: 'html', children: [] },
                {
                    match: n => SlateElement.isElement(n) && n.type === ParagraphType || LIST_TYPES.includes(n.type),
                    split: true,
                }
            );
            Transforms.setNodes(
                editor,
                { type: CodeLineType },
                { match: n => SlateElement.isElement(n) && n.type === ParagraphType || LIST_TYPES.includes(n.type) }
            );
        }
    };

    return (
        <Button
            size={'sm'}
            // variant={"unstyled"}
            border={'1px solid'}
            borderColor={'gray.200'}
            p={1}
            {...isBlockActive(
                editor,
                CodeBlockType,
                'type'
            ) ? {
                bg: 'gray.100'
            } : { bg: "gray.300" }}
            onMouseDown={handleClick}
        >
            <Box
                display={"flex"}
                justifyContent={'center'}
                alignItems={'center'}>
                <IconSourceCode size={18} stroke={2} />
            </Box>
        </Button>
    );
};

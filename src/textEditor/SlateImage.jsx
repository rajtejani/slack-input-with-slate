import imageExtensions from "image-extensions";
import isUrl from "is-url";
import { Transforms } from "slate";
import { useSlate } from "slate-react";
import { ImageCropper } from "./ImageCropper";
import { Box, Button } from "@chakra-ui/react";

export const withSlateImages = (editor) => {
  const { insertData, isVoid } = editor;

  editor.isVoid = (element) => {
    return element.type === "image" ? true : isVoid(element);
  };

  editor.insertData = (data) => {
    const text = data.getData("text/plain");
    const { files } = data;

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader();
        const [mime] = file.type.split("/");

        if (mime === "image") {
          reader.addEventListener("load", () => {
            const url = reader.result;
            insertImage(editor, url);
          });
          reader.readAsDataURL(file);
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
};

export const ImageElement = ({ attributes, children, element }) => {
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img
          src={element.url}
          style={{
            maxHeight: 250,
            maxWidth: "100%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
      </div>
      {children}
    </div>
  );
};

const insertImage = (editor, url) => {
  const image = { type: "image", url, children: [{ text: "" }] };
  Transforms.insertNodes(editor, image);
};

export const InsertImageButton = ({ icon: Icon }) => {
  const editor = useSlate();

  const uploadedImageURL = (url) => {
    insertImage(editor, url);
  };

  const uploadButtom = () => <Button as="span" cursor={"pointer"}
    padding={"10px"} aria-label="Upload Image" > <Box
      display={"flex"}
      justifyContent={'center'}
      alignItems={'center'}>
      <Icon size={18} stroke={2} />
    </Box></Button>;

  return (
    <ImageCropper
      uploadTextIcon={uploadButtom}
      uploadedImageURL={uploadedImageURL}
    />
  );
};

const isImageUrl = (url) => {
  if (!url) return false;
  if (!isUrl(url)) return false;
  const ext = new URL(url).pathname.split(".").pop();
  return imageExtensions.includes(ext);
};

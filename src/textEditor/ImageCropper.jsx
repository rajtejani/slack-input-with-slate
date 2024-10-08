import { nanoid } from "nanoid";
import { useRef } from "react";

export const ImageCropper = (props) => {
  const uniqIDRef = useRef(nanoid()).current;
  const { uploadTextIcon, uploadedImageURL } = props;
  const fileInputRef = useRef(null);


  // const handleImageUpload = async event => {
  //   const { files } = event.target;
  //   if (!files?.length) {
  //     return;
  //   }
  //   const file = files[0];
  //   const reader = new FileReader();

  //   if (file) {
  //     reader.readAsDataURL(file);
  //   }

  //   const payload = {
  //     fileName: file.name,
  //     contentType: file.type
  //   };

  //   try {
  //     const response = await protectedRoute.post('/files/getPreSignedURL', payload);
  //     if (response.status === 201) {
  //       const uploadImgResponse = await axios.put(response.data, file, {
  //         headers: {
  //           'Content-Type': file.type
  //         }
  //       });

  //       if (uploadImgResponse.status === 200) {
  //         const url = response.data.slice(0, response.data.indexOf('?'));
  //         uploadedImageURL(url);
  //       }
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const fileSelectHandler = async (event) => {
    const { files } = event.target;
    if (!files?.length) {
      return;
    }

    console.log(files, "files");

    // WRITE YOU IMAGE UPLOAD LOAGIC

    // const fileUploaded = files[0];
    // if (fileUploaded) {
    //   handleImageUpload(event);
    // }
  };

  return (
    <>
      <input
        accept="image/*"
        style={{ display: "none" }}
        id={uniqIDRef}
        type="file"
        onChange={fileSelectHandler}
        ref={fileInputRef}
      />
      <label htmlFor={uniqIDRef}>{uploadTextIcon()}</label>
    </>
  );
};
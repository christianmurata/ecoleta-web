import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload } from 'react-icons/fi';

import './style.css'

interface Drop {
    onFileUploaded: (file: File) => void
}

const Dropzone: React.FC<Drop> = ({ onFileUploaded }) => {
    const [selectedFileUrl, setSelectedFileUrl] = useState('');

    const onDrop = useCallback(acceptedFiles => {
        // Do something with the files
        const file = acceptedFiles[0];
        const fileUrl = URL.createObjectURL(file);

        setSelectedFileUrl(fileUrl);
        onFileUploaded(file);
    }, [onFileUploaded])

    const { getRootProps, getInputProps } = useDropzone({ 
        onDrop,
        accept: 'image/*'
    })

    return (
        <div className="dropzone" {...getRootProps()}>
            <input accept="image/*" {...getInputProps()} />

            {
                selectedFileUrl ? <img src={selectedFileUrl} alt="Point image"/> : (
                    <p>
                        <FiUpload />
                        Imagem do estabelecimento
                    </p>
                )
            }

        </div>
    )
}

export default Dropzone;